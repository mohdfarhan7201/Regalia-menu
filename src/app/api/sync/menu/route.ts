import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Category from "@/lib/db/models/Category";
import Item from "@/lib/db/models/Item";
import Location from "@/lib/db/models/Location";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const [categories, items, locations] = await Promise.all([
      Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Item.find({ isAvailable: { $ne: false } })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Location.find({ isActive: true })
        .collation({ locale: "en_US", numericOrdering: true })
        .sort({ type: 1, label: 1 })
        .lean(),
    ]);

    return NextResponse.json({ categories, items, locations }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/sync/menu]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
