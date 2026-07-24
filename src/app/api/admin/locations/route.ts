import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Location from "@/lib/db/models/Location";
import { LocationSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const locs = await Location.find({})
    .collation({ locale: "en_US", numericOrdering: true })
    .sort({ type: 1, label: 1 })
    .lean();
  return NextResponse.json(locs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loc = await (Location.create as any)({ ...parsed.data, code });
    return NextResponse.json(loc, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A location with this label already exists." },
        { status: 409 },
      );
    }
    throw e;
  }
}
