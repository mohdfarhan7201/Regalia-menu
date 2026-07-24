import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Location from "@/lib/db/models/Location";
import type { ILocation } from "@/types";

// GET /api/locations — accessible by all authenticated staff + admin
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { isActive: true };
  if (type === "table" || type === "room") query.type = type;

  const locations = await Location.find(query)
    .collation({ locale: "en_US", numericOrdering: true })
    .sort({ type: 1, label: 1 })
    .lean<ILocation[]>();

  return NextResponse.json(locations);
}
