import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/lib/db/models/Order";
import type { IOrder } from "@/types";

// GET /api/orders/captain?tableId=xxx — active orders for a table
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["admin", "captain"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");
  if (!tableId) {
    return NextResponse.json({ error: "tableId required" }, { status: 400 });
  }

  await connectDB();

  const orders = await Order.find({
    tableId,
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

  return NextResponse.json(orders);
}
