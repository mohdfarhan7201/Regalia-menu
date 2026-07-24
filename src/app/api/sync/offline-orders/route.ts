import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/lib/db/models/Order";
import Item from "@/lib/db/models/Item";
import Location from "@/lib/db/models/Location";
import { withTransaction } from "@/lib/db/withTransaction";
import { nextDailyKotSeq } from "@/lib/db/models/Counter";
import { formatKotNumber, lineTotal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orders = body.orders;
    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid payload: orders must be an array" }, { status: 400 });
    }

    await connectDB();

    const results: any[] = [];

    // Process each order sequentially to avoid race conditions with KOT sequences
    for (const offlineOrder of orders) {
      try {
        const { tableId, tableLabel, captainId, captainName, items, specialInstructions, createdAt } = offlineOrder;
        
        if (!tableId || !items || !items.length) {
          results.push({ error: "Missing required fields", offlineId: offlineOrder._id });
          continue;
        }

        // Validate items and calculate totals
        const itemIds = items.map((i: any) => i.itemId);
        const dbItems = await Item.find({ _id: { $in: itemIds } }).lean();
        const byId = new Map(dbItems.map((db) => [db._id.toString(), db]));

        const orderItems: any[] = [];
        let now = createdAt ? new Date(createdAt) : new Date();

        for (const i of items) {
          const db = byId.get(String(i.itemId));
          if (!db) throw new Error(`Unknown menu item: ${i.itemId}`);
          const qty = Number(i.quantity);
          if (!Number.isInteger(qty) || qty < 1) throw new Error(`Invalid quantity for ${db.name}`);
          
          orderItems.push({
            itemId: db._id,
            name: db.name,
            price: db.discountPrice ?? db.price,
            quantity: qty,
            notes: i.notes || undefined,
            isVegetarian: db.isVegetarian,
            preparationTtlMinutes: db.preparationTtlMinutes ?? 15,
            itemStatus: "pending",
            orderedAt: now,
            isNoCharge: false,
          });
        }

        const subtotal = orderItems.reduce((sum, i) => sum + lineTotal(i), 0);
        const total = subtotal;

        const kotDate = now.toISOString().slice(0, 10); // "YYYY-MM-DD" (UTC)
        const todayStart = new Date(`${kotDate}T00:00:00.000Z`);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

        let savedOrder = null;
        let lastErr = null;
        for (let attempt = 0; attempt < 3 && !savedOrder; attempt++) {
          const existingTodayCount = await Order.countDocuments({
            createdAt: { $gte: todayStart, $lt: tomorrowStart },
          });
          const seq = await nextDailyKotSeq(existingTodayCount);
          const kotNumber = formatKotNumber(seq);

          try {
            savedOrder = await withTransaction(async (s) => {
              const [created] = await (Order.create as any)([
                {
                  kotNumber,
                  kotDate,
                  tableId,
                  tableLabel,
                  captainId: captainId || "000000000000000000000000",
                  captainName: captainName || "Offline KOT",
                  placedByRole: "captain",
                  status: "pending",
                  items: orderItems,
                  specialInstructions,
                  subtotal,
                  total,
                  createdAt: now,
                  kotPrinted: true, // Already printed offline
                  kotPrintedAt: now,
                  isOfflineSynced: true, // Mark as offline synced for UI
                }
              ], { session: s });

              await Location.findByIdAndUpdate(tableId, { isOccupied: true }, { session: s });
              return created;
            });
          } catch (e: any) {
            lastErr = e;
            if (e.code === 11000) continue; // Retry KOT clash
            throw e;
          }
        }
        
        if (!savedOrder) throw lastErr ?? new Error("Failed to create order");
        results.push({ success: true, offlineId: offlineOrder._id, newId: savedOrder._id, kotNumber: savedOrder.kotNumber });

      } catch (err: any) {
        console.error("[Sync Error for Order]", err);
        results.push({ error: err.message, offlineId: offlineOrder._id });
      }
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/sync/offline-orders]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
