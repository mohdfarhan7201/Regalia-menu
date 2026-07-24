import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Location from "@/lib/db/models/Location";
import Order from "@/lib/db/models/Order";
import { LocationSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const parsed = LocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  await connectDB();
  const code = parsed.data.label.toUpperCase().replace(/\s+/g, "-");
  const updated = await Location.findByIdAndUpdate(
    id,
    { ...parsed.data, code },
    { new: true },
  );
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// PATCH — lightweight field updates (currently: manual occupied toggle).
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  if (typeof body.isOccupied !== "boolean") {
    return NextResponse.json(
      { error: "isOccupied (boolean) required" },
      { status: 400 },
    );
  }
  await connectDB();
  const updated = await Location.findByIdAndUpdate(
    id,
    { isOccupied: body.isOccupied },
    { new: true },
  );
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await connectDB();

  // Block deletion while live orders sit on the table — deleting it would orphan
  // those orders and silently break every isOccupied update for them.
  const activeOrders = await Order.exists({
    tableId: id,
    status: { $nin: ["cleared", "paid", "cancelled"] },
  });
  if (activeOrders) {
    return NextResponse.json(
      { error: "Table has active orders — clear or void them first." },
      { status: 409 },
    );
  }

  await Location.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
