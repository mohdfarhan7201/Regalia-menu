import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Branding from "@/lib/db/models/Branding";
import { BrandingSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


/**
 * The DB model uses `restaurantName`; the form/Zod schema uses `hotelName`.
 * These helpers translate between the two so the form always sees `hotelName`
 * and the DB always receives `restaurantName`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToForm(doc: any) {
  if (!doc) return {};
  const { restaurantName, ...rest } = doc;
  return { ...rest, hotelName: restaurantName };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formToDb(data: any) {
  const { hotelName, ...rest } = data;
  return { ...rest, restaurantName: hotelName };
}

export async function GET() {
  await connectDB();
  const branding = await Branding.findOne({}).lean();
  return NextResponse.json(dbToForm(branding));
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = BrandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  await connectDB();
  const updated = await Branding.findOneAndUpdate(
    {},
    { $set: formToDb(parsed.data) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return NextResponse.json(dbToForm(updated?.toObject?.() ?? updated));
}
