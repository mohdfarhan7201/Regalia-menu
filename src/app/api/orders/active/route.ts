import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/lib/db/models/Order";
import type { IOrder } from "@/types";

// GET /api/orders/active — for KDS polling
export async function GET() {
  const session = await auth();
  if (!session?.user || !["admin", "kitchen"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

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

  return NextResponse.json(orders);
}
