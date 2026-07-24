import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Staff from "@/lib/db/models/Staff";
import Order from "@/lib/db/models/Order";
import { StaffUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const parsed = StaffUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  await connectDB();
  const staff = await Staff.findById(id);
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  staff.name = parsed.data.name;
  staff.email = parsed.data.email;
  staff.role = parsed.data.role;
  staff.isActive = parsed.data.isActive ?? true;
  if (parsed.data.password) {
    staff.password = parsed.data.password; // pre-save hook will hash it
  }
  await staff.save();

  const { password: _, ...safe } = staff.toObject();
  void _;
  return NextResponse.json(safe);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await connectDB();

  // Preserve the audit trail — a staffer who ever placed an order can't be hard
  // deleted (it would orphan the required captainId ref). Deactivate instead.
  const hasOrders = await Order.exists({ captainId: id });
  if (hasOrders) {
    return NextResponse.json(
      {
        error:
          "This staff member has order history. Deactivate them instead of deleting.",
      },
      { status: 409 },
    );
  }

  await Staff.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
