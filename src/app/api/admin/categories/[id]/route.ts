import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import Category from "@/lib/db/models/Category";
import Item from "@/lib/db/models/Item";
import { CategorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  await connectDB();
  const updated = await Category.findByIdAndUpdate(id, body, { new: true });
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  await connectDB();
  const updated = await Category.findByIdAndUpdate(
    id,
    { ...parsed.data, slug: slugify(parsed.data.name) },
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
  // Check if items exist under this category
  const itemCount = await Item.countDocuments({ categoryId: id });
  if (itemCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${itemCount} item(s) exist under this category.`,
      },
      { status: 409 },
    );
  }
  await Category.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
