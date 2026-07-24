import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDashboardMetrics,
  getAllLocations,
  getActiveOrders,
} from "@/lib/queries";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [metrics, locations, activeOrdersList] = await Promise.all([
    getDashboardMetrics(),
    getAllLocations(),
    getActiveOrders(),
  ]);

  return NextResponse.json(
    JSON.parse(JSON.stringify({ metrics, locations, activeOrdersList })),
  );
}
