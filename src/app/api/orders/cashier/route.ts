import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/lib/db/models/Order";
import type { IOrder } from "@/types";

export interface TableBill {
  tableId: string;
  tableLabel: string;
  kots: IOrder[];
  total: number;
  itemCount: number;
  since: string; // createdAt of oldest KOT
  anchorKotId: string; // first KOT id — used for pay_table API call
}

// GET /api/orders/cashier — table-wise billing view
export async function GET() {
  const session = await auth();
  if (!session?.user || !["admin", "cashier"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Fetch all active (unpaid, uncleared) orders for the billing queue.
  // Include all non-terminal statuses so a table appears as soon as an order exists.
  const orders = await Order.find({
    status: {
      $in: [
        "pending",
        "preparing",
        "partially_ready",
        "ready",
        "partially_delivered",
        "delivered",
      ],
    },
  })
    .sort({ createdAt: 1 })
    .lean<IOrder[]>();

  // Group by tableId
  const tableMap = new Map<string, IOrder[]>();
  for (const order of orders) {
    const key = order.tableId.toString();
    if (!tableMap.has(key)) tableMap.set(key, []);
    tableMap.get(key)!.push(order);
  }

  const tables: TableBill[] = [];
  for (const [tableId, kots] of tableMap) {
    const total = kots.reduce((sum, k) => sum + k.total, 0);
    const itemCount = kots.reduce(
      (sum, k) =>
        sum + k.items.filter((i) => i.itemStatus !== "cancelled").length,
      0,
    );
    tables.push({
      tableId,
      tableLabel: kots[0].tableLabel,
      kots,
      total,
      itemCount,
      since: kots[0].createdAt,
      anchorKotId: kots[0]._id,
    });
  }

  // Sort by oldest first
  tables.sort(
    (a, b) => new Date(a.since).getTime() - new Date(b.since).getTime(),
  );

  return NextResponse.json(tables);
}
