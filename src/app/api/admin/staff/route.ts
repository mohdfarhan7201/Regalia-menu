import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Staff from "@/lib/db/models/Staff";
import { StaffSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const staff = await Staff.find({})
    .select("-password")
    .sort({ role: 1, name: 1 })
    .lean();
  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = StaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (!parsed.data.password) {
    return NextResponse.json(
      { error: "Password is required for new staff." },
      { status: 400 },
    );
  }
  await connectDB();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const staff = await (Staff.create as any)(parsed.data);
    const { password: _, ...safe } = staff.toObject();
    void _;
    return NextResponse.json(safe, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "Email already in use." },
        { status: 409 },
      );
    }
    throw e;
  }
}
