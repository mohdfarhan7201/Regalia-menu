import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/lib/db/models/Order";
import Location from "@/lib/db/models/Location";
import Item from "@/lib/db/models/Item";
import { withTransaction } from "@/lib/db/withTransaction";
import { lineTotal } from "@/lib/utils";
import type { IOrder } from "@/types";

// Derive the order-level status from its item statuses (cancelled items ignored).
function recomputeStatus(
  items: { itemStatus: string }[],
): IOrder["status"] {
  const active = items.filter((i) => i.itemStatus !== "cancelled");
  if (active.length === 0) return "cancelled";
  const s = active.map((i) => i.itemStatus);
  const allDelivered = s.every((x) => x === "delivered");
  const someDelivered = s.some((x) => x === "delivered");
  const allReady = s.every((x) => ["ready", "delivered"].includes(x));
  const someReady = s.some((x) => ["ready", "delivered"].includes(x));
  const allPending = s.every((x) => x === "pending");
  if (allDelivered) return "delivered";
  if (someDelivered) return "partially_delivered";
  if (allReady) return "ready";
  if (someReady) return "partially_ready";
  if (!allPending) return "preparing";
  return "pending";
}

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  // Operational roles only — lead_manager has no business reading order/payment data.
  if (
    !session?.user ||
    !["admin", "cashier", "kitchen", "captain"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const order = await Order.findById(id).lean<IOrder>();
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

// ─── PATCH /api/orders/[id] ───────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (
    !session?.user ||
    !["admin", "kitchen", "cashier"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  try {
    // Cashier/admin: free a table WITHOUT payment (no-show / walk-out / mistake,
    // or a stuck "occupied" location with no active orders). Orders are marked
    // "cancelled" (NOT "cleared") with a reason + actor so they stay out of
    // revenue while leaving an audit trail. Note: `id` here is the TABLE/location
    // id, not an order id — so this runs BEFORE the order lookup below.
    if (body.action === "void_table") {
      if (!["admin", "cashier"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const { tableId, reason } = body;
      if (!tableId || !reason) {
        return NextResponse.json(
          { error: "tableId and reason required" },
          { status: 400 },
        );
      }

      const now = new Date();
      const voided = await withTransaction(async (s) => {
        const tableOrders = await Order.find({
          tableId,
          status: { $nin: ["cleared", "paid", "cancelled"] },
        }).session(s);
        for (const o of tableOrders) {
          for (const item of o.items) {
            if (item.itemStatus === "cancelled") continue;
            item.itemStatus = "cancelled";
            item.cancelledAt = now;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            item.cancelledBy = session.user.id as any;
            item.cancelReason = reason;
          }
          o.status = "cancelled";
          o.subtotal = 0;
          o.total = 0;
          o.voidReason = reason;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          o.voidedBy = session.user.id as any;
          await o.save({ session: s });
        }
        await Location.findByIdAndUpdate(
          tableId,
          { isOccupied: false },
          { session: s },
        );
        return tableOrders.length;
      });
      return NextResponse.json({ success: true, voided });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Cashier: pay & clear a single KOT
    if (body.action === "pay_and_clear") {
      if (!["admin", "cashier"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const { paymentMethod, paymentAmount } = body;
      if (!paymentMethod) {
        return NextResponse.json(
          { error: "paymentMethod required" },
          { status: 400 },
        );
      }
      const now = new Date();
      await withTransaction(async (s) => {
        order.status = "cleared";
        order.paymentMethod = paymentMethod;
        order.paymentAmount = paymentAmount ?? order.total;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        order.cashierId = session.user.id as any;
        order.paidAt = now;
        order.clearedAt = now;
        await order.save({ session: s });

        // Free the table only if no other active KOTs remain — checked inside
        // the same transaction so the count is consistent with the write.
        const remaining = await Order.countDocuments({
          tableId: order.tableId,
          status: { $nin: ["cleared", "paid", "cancelled"] },
          _id: { $ne: order._id },
        }).session(s);
        if (remaining === 0) {
          await Location.findByIdAndUpdate(
            order.tableId,
            { isOccupied: false },
            { session: s },
          );
        }
      });

      return NextResponse.json({ success: true });
    }

    // Cashier: pay ALL KOTs for a table at once (table-wise billing)
    if (body.action === "pay_table") {
      if (!["admin", "cashier"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const { tableId, paymentMethod, paymentAmount, splitPayment } = body;
      if (!tableId || (!paymentMethod && !splitPayment)) {
        return NextResponse.json(
          { error: "tableId and payment info required" },
          { status: 400 },
        );
      }

      // Resolve primary method (first split entry or single method)
      const primaryMethod = splitPayment?.[0]?.method ?? paymentMethod;
      const now = new Date();

      await withTransaction(async (s) => {
        // Authoritative table total from the DB (not the client) so payment
        // amount + split reconciliation can't be tampered with.
        const activeOrders = await Order.find({
          tableId,
          status: { $nin: ["cleared", "paid", "cancelled"] },
        }).session(s);
        const tableTotal = activeOrders.reduce((sum, o) => sum + o.total, 0);

        const totalPaid = splitPayment
          ? splitPayment.reduce(
              (acc: number, p: { amount: number }) => acc + (p.amount || 0),
              0,
            )
          : (paymentAmount ?? tableTotal);

        // Reject a split that doesn't reconcile to the bill (tolerate rounding).
        if (splitPayment && Math.abs(totalPaid - tableTotal) > 0.01) {
          throw new Error("Split amounts do not add up to the table total");
        }

        await Order.updateMany(
          { tableId, status: { $nin: ["cleared", "paid", "cancelled"] } },
          {
            $set: {
              status: "cleared",
              paymentMethod: primaryMethod,
              paymentAmount: 0, // distributed — individual totals preserved
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cashierId: session.user.id as any,
              paidAt: now,
              clearedAt: now,
            },
          },
          { session: s },
        );

        // Record actual amount + split details on the "anchor" order
        await Order.findByIdAndUpdate(
          id,
          { paymentAmount: totalPaid, ...(splitPayment ? { splitPayment } : {}) },
          { session: s },
        );

        await Location.findByIdAndUpdate(
          tableId,
          { isOccupied: false },
          { session: s },
        );
      });

      return NextResponse.json({ success: true });
    }

    // Admin: re-open a paid/cleared order to correct a mistake or refund.
    // Reverts to an active status, wipes payment, re-occupies the table, and
    // logs who/why (+ optional refund amount).
    if (body.action === "reopen") {
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (!["cleared", "paid"].includes(order.status)) {
        return NextResponse.json(
          { error: "Only a paid/cleared order can be reopened" },
          { status: 400 },
        );
      }
      const { reason, refundAmount } = body;
      if (!reason) {
        return NextResponse.json(
          { error: "reason required" },
          { status: 400 },
        );
      }

      await withTransaction(async (s) => {
        order.status = recomputeStatus(order.items);
        order.paymentMethod = undefined;
        order.paymentAmount = undefined;
        order.splitPayment = undefined;
        order.paidAt = undefined;
        order.clearedAt = undefined;
        order.reopenReason = reason;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        order.reopenedBy = session.user.id as any;
        order.reopenedAt = new Date();
        // Number.isFinite rejects NaN/Infinity (typeof NaN === "number" passes a
        // naive check and would persist a garbage refund).
        if (Number.isFinite(refundAmount)) order.refundAmount = refundAmount;
        await order.save({ session: s });

        // Put the table back in play so it returns to the billing queue.
        await Location.findByIdAndUpdate(
          order.tableId,
          { isOccupied: true },
          { session: s },
        );
      });
      return NextResponse.json({ success: true });
    }

    // Admin: edit items of an already-placed order (add / remove / change qty).
    if (body.action === "edit_items") {
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (["cleared", "paid", "cancelled"].includes(order.status)) {
        return NextResponse.json(
          { error: "Reopen the order before editing items" },
          { status: 400 },
        );
      }
      const {
        addItems = [],
        removeItemIds = [],
        updateQty = [],
      }: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addItems?: any[];
        removeItemIds?: string[];
        updateQty?: { itemId: string; quantity: number }[];
      } = body;
      const now = new Date();

      // Server-price every added item against the menu (never trust the client).
      const addIds = addItems.map((a) => String(a.itemId));
      const dbAdds = addIds.length
        ? await Item.find({ _id: { $in: addIds } }).lean()
        : [];
      const addById = new Map(dbAdds.map((d) => [String(d._id), d]));

      // Cancel removed items (preserve audit trail rather than hard-delete)
      for (const rid of removeItemIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const it = order.items.find((i: any) => i._id.toString() === rid);
        if (it && it.itemStatus !== "cancelled") {
          it.itemStatus = "cancelled";
          it.cancelledAt = now;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          it.cancelledBy = session.user.id as any;
          it.cancelReason = "Edited by admin";
        }
      }

      // Update quantity — only for items the kitchen hasn't started yet.
      // Track which were ignored so the UI can tell the admin.
      const droppedQty: string[] = [];
      for (const u of updateQty) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const it = order.items.find((i: any) => i._id.toString() === u.itemId);
        const qty = Number(u.quantity);
        if (!it) continue;
        if (it.itemStatus === "pending" && Number.isInteger(qty) && qty > 0) {
          it.quantity = qty;
        } else {
          droppedQty.push(it.name);
        }
      }

      // Append new items as pending (DB-priced)
      for (const a of addItems) {
        const db = addById.get(String(a.itemId));
        if (!db) {
          return NextResponse.json(
            { error: `Unknown menu item: ${a.itemId}` },
            { status: 400 },
          );
        }
        const qty = Number(a.quantity);
        if (!Number.isInteger(qty) || qty < 1) {
          return NextResponse.json(
            { error: `Invalid quantity for ${db.name}` },
            { status: 400 },
          );
        }
        order.items.push({
          itemId: db._id,
          name: db.name,
          price: db.discountPrice ?? db.price,
          quantity: qty,
          notes: a.notes || undefined,
          isVegetarian: db.isVegetarian,
          preparationTtlMinutes: db.preparationTtlMinutes ?? 15,
          itemStatus: "pending",
          orderedAt: now,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }

      const activeItems = order.items.filter(
        (i) => i.itemStatus !== "cancelled",
      );
      order.subtotal = activeItems.reduce((s, i) => s + lineTotal(i), 0);
      order.total = order.subtotal + (order.tax ?? 0);
      order.status = recomputeStatus(order.items);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      order.editedBy = session.user.id as any;
      order.editedAt = now;

      await withTransaction(async (s) => {
        await order.save({ session: s });
        // If every item ended up cancelled, free the table.
        if (order.status === "cancelled") {
          const remaining = await Order.countDocuments({
            tableId: order.tableId,
            status: { $nin: ["cleared", "paid", "cancelled"] },
            _id: { $ne: order._id },
          }).session(s);
          if (remaining === 0) {
            await Location.findByIdAndUpdate(
              order.tableId,
              { isOccupied: false },
              { session: s },
            );
          }
        }
      });
      return NextResponse.json({
        success: true,
        status: order.status,
        droppedQty,
      });
    }

    // Kitchen: update order status directly
    if (body.status) {
      if (!["admin", "kitchen"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const now = new Date();
      const newStatus: IOrder["status"] = body.status;

      // paid/cleared must go through the payment actions (which record method,
      // amount, cashier, and free the table) — block them on this raw path.
      const ALLOWED_DIRECT: IOrder["status"][] = [
        "pending",
        "preparing",
        "partially_ready",
        "ready",
        "partially_delivered",
        "delivered",
        "cancelled",
      ];
      if (!ALLOWED_DIRECT.includes(newStatus)) {
        return NextResponse.json(
          { error: "Use the payment action to mark paid/cleared" },
          { status: 400 },
        );
      }

      // Sync item-level statuses so the rest of the system stays consistent.
      // When kitchen skips straight to delivered/ready, backfill timestamps on
      // items that haven't reached that stage yet.
      if (newStatus === "delivered") {
        for (const item of order.items) {
          if (item.itemStatus === "cancelled") continue;
          if (!item.preparingAt) item.preparingAt = now;
          if (!item.readyAt) item.readyAt = now;
          if (!item.deliveredAt) item.deliveredAt = now;
          item.itemStatus = "delivered";
        }
      } else if (newStatus === "ready") {
        for (const item of order.items) {
          if (item.itemStatus === "cancelled") continue;
          if (item.itemStatus === "delivered") continue;
          if (!item.preparingAt) item.preparingAt = now;
          if (!item.readyAt) item.readyAt = now;
          item.itemStatus = "ready";
        }
      } else if (newStatus === "preparing") {
        for (const item of order.items) {
          if (item.itemStatus === "cancelled") continue;
          if (["ready", "delivered"].includes(item.itemStatus)) continue;
          if (!item.preparingAt) item.preparingAt = now;
          item.itemStatus = "preparing";
        }
      }

      order.status = newStatus;
      await withTransaction(async (s) => {
        await order.save({ session: s });
        // Free the table if the whole order was cancelled and nothing else active.
        if (newStatus === "cancelled") {
          const remaining = await Order.countDocuments({
            tableId: order.tableId,
            status: { $nin: ["cleared", "paid", "cancelled"] },
            _id: { $ne: order._id },
          }).session(s);
          if (remaining === 0) {
            await Location.findByIdAndUpdate(
              order.tableId,
              { isOccupied: false },
              { session: s },
            );
          }
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No valid action" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/orders/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
