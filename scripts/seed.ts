/**
 * Seed script — run with:
 *   npx tsx scripts/seed.ts
 *
 * Requires MONGODB_URI in .env.local
 */
import "dotenv/config";
import mongoose from "mongoose";

// Load .env.local
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env.local");
  process.exit(1);
}

/** Convert a name to a URL-safe slug */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB");

  // Dynamic imports so models register after connection
  const { default: AdminUser } = await import("../src/lib/db/models/AdminUser");
  const { default: Staff } = await import("../src/lib/db/models/Staff");
  const { default: Branding } = await import("../src/lib/db/models/Branding");
  const { default: Category } = await import("../src/lib/db/models/Category");
  const { default: Item } = await import("../src/lib/db/models/Item");
  const { default: Location } = await import("../src/lib/db/models/Location");

  // ─── Admin User ────────────────────────────────────────────────────────────
  const existingAdmin = await AdminUser.findOne({ email: "admin@regalia.com" });
  if (!existingAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (AdminUser.create as any)({
      name: "Super Admin",
      email: "admin@regalia.com",
      password: "admin123",
      isActive: true,
    });
    console.log("✅  Admin user created: admin@regalia.com / admin123");
  } else {
    console.log("ℹ️   Admin user already exists");
  }

  // ─── Staff Accounts ────────────────────────────────────────────────────────
  const staffAccounts = [
    {
      name: "Captain Ali",
      email: "captain@regalia.com",
      role: "captain",
      password: "captain123",
    },
    {
      name: "Chef Ravi",
      email: "kitchen@regalia.com",
      role: "kitchen",
      password: "kitchen123",
    },
    {
      name: "Cashier Sara",
      email: "cashier@regalia.com",
      role: "cashier",
      password: "cashier123",
    },
    {
      name: "Sales Priya",
      email: "leads@regalia.com",
      role: "lead_manager",
      password: "leads123",
    },
  ] as const;

  for (const staff of staffAccounts) {
    const existing = await Staff.findOne({ email: staff.email });
    if (!existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Staff.create as any)({ ...staff, isActive: true });
      console.log(
        `✅  Staff created: ${staff.email} / ${staff.password} [${staff.role}]`,
      );
    } else {
      console.log(`ℹ️   Staff exists: ${staff.email}`);
    }
  }

  // ─── Branding ──────────────────────────────────────────────────────────────
  const existingBranding = await Branding.findOne({});
  if (!existingBranding) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (Branding.create as any)({
      hotelName: "Regalia Resort",
      tagline: "A Royal Experience",
      primaryColor: "#C9A96E",
      accentColor: "#1A1A2E",
      whatsappNumber: "+910000000000",
      callNumber: "+910000000000",
    });
    console.log("✅  Branding created");
  }

  // ─── Categories ────────────────────────────────────────────────────────────
  const categories = [
    { name: "Breakfast", description: "Start your day right", sortOrder: 1 },
    {
      name: "Starters",
      description: "Appetizers & small plates",
      sortOrder: 2,
    },
    { name: "Mains", description: "Main course dishes", sortOrder: 3 },
    { name: "Breads", description: "Indian breads & sides", sortOrder: 4 },
    { name: "Rice & Biryani", description: "Rice preparations", sortOrder: 5 },
    { name: "Desserts", description: "Sweet endings", sortOrder: 6 },
    { name: "Beverages", description: "Hot & cold drinks", sortOrder: 7 },
    { name: "Mocktails", description: "Refreshing mocktails", sortOrder: 8 },
  ];

  const createdCategories: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of categories) {
    const existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      const created = await Category.create({
        ...cat,
        slug: toSlug(cat.name),
        isActive: true,
      });
      createdCategories[cat.name] = created._id;
      console.log(`✅  Category: ${cat.name}`);
    } else {
      createdCategories[cat.name] = existing._id;
      console.log(`ℹ️   Category exists: ${cat.name}`);
    }
  }

  // ─── Sample Items ──────────────────────────────────────────────────────────
  const sampleItems = [
    // Breakfast
    {
      name: "Masala Omelette",
      price: 120,
      categoryName: "Breakfast",
      isVeg: false,
      preparationTtlMinutes: 10,
      tags: ["egg"],
    },
    {
      name: "Aloo Paratha",
      price: 100,
      categoryName: "Breakfast",
      isVeg: true,
      preparationTtlMinutes: 12,
      tags: ["popular"],
    },
    {
      name: "Cereal & Milk",
      price: 80,
      categoryName: "Breakfast",
      isVeg: true,
      preparationTtlMinutes: 5,
    },
    // Starters
    {
      name: "Chicken Lollipop",
      price: 320,
      categoryName: "Starters",
      isVeg: false,
      preparationTtlMinutes: 20,
      tags: ["bestseller", "spicy"],
    },
    {
      name: "Paneer Tikka",
      price: 260,
      categoryName: "Starters",
      isVeg: true,
      preparationTtlMinutes: 18,
      tags: ["bestseller"],
    },
    {
      name: "Chilli Mushroom",
      price: 220,
      categoryName: "Starters",
      isVeg: true,
      preparationTtlMinutes: 15,
    },
    // Mains
    {
      name: "Butter Chicken",
      price: 380,
      categoryName: "Mains",
      isVeg: false,
      preparationTtlMinutes: 25,
      tags: ["bestseller", "popular"],
    },
    {
      name: "Dal Makhani",
      price: 260,
      categoryName: "Mains",
      isVeg: true,
      preparationTtlMinutes: 20,
      tags: ["popular"],
    },
    {
      name: "Mutton Rogan Josh",
      price: 460,
      categoryName: "Mains",
      isVeg: false,
      preparationTtlMinutes: 35,
      tags: ["premium"],
    },
    {
      name: "Kaju Masala",
      price: 340,
      categoryName: "Mains",
      isVeg: true,
      preparationTtlMinutes: 20,
    },
    // Breads
    {
      name: "Butter Naan",
      price: 50,
      categoryName: "Breads",
      isVeg: true,
      preparationTtlMinutes: 8,
    },
    {
      name: "Laccha Paratha",
      price: 60,
      categoryName: "Breads",
      isVeg: true,
      preparationTtlMinutes: 8,
    },
    // Rice & Biryani
    {
      name: "Chicken Biryani",
      price: 380,
      categoryName: "Rice & Biryani",
      isVeg: false,
      preparationTtlMinutes: 30,
      tags: ["bestseller"],
    },
    {
      name: "Veg Fried Rice",
      price: 200,
      categoryName: "Rice & Biryani",
      isVeg: true,
      preparationTtlMinutes: 15,
    },
    // Desserts
    {
      name: "Gulab Jamun",
      price: 100,
      categoryName: "Desserts",
      isVeg: true,
      preparationTtlMinutes: 5,
      tags: ["popular"],
    },
    {
      name: "Kulfi",
      price: 120,
      categoryName: "Desserts",
      isVeg: true,
      preparationTtlMinutes: 5,
    },
    // Beverages
    {
      name: "Masala Chai",
      price: 60,
      categoryName: "Beverages",
      isVeg: true,
      preparationTtlMinutes: 5,
    },
    {
      name: "Cold Coffee",
      price: 120,
      categoryName: "Beverages",
      isVeg: true,
      preparationTtlMinutes: 5,
      tags: ["popular"],
    },
    {
      name: "Fresh Lime Soda",
      price: 80,
      categoryName: "Beverages",
      isVeg: true,
      preparationTtlMinutes: 3,
    },
    // Mocktails
    {
      name: "Virgin Mojito",
      price: 140,
      categoryName: "Mocktails",
      isVeg: true,
      preparationTtlMinutes: 5,
      tags: ["popular"],
    },
    {
      name: "Piña Colada (Mock)",
      price: 160,
      categoryName: "Mocktails",
      isVeg: true,
      preparationTtlMinutes: 5,
    },
  ];

  for (const item of sampleItems) {
    const catId = createdCategories[item.categoryName];
    if (!catId) continue;
    const existing = await Item.findOne({ name: item.name });
    if (!existing) {
      const { categoryName, ...rest } = item;
      void categoryName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Item.create as any)({
        ...rest,
        slug: toSlug(item.name),
        categoryId: catId,
        isActive: true,
        isFeatured: false,
        sortOrder: 0,
      });
      console.log(`✅  Item: ${item.name}`);
    } else {
      console.log(`ℹ️   Item exists: ${item.name}`);
    }
  }

  // ─── Locations ─────────────────────────────────────────────────────────────
  const locations: Array<{
    label: string;
    code: string;
    type: "table" | "room";
    floor: string;
    capacity: number;
  }> = [
    {
      label: "Table 1",
      code: "T01",
      type: "table",
      floor: "Ground",
      capacity: 4,
    },
    {
      label: "Table 2",
      code: "T02",
      type: "table",
      floor: "Ground",
      capacity: 4,
    },
    {
      label: "Table 3",
      code: "T03",
      type: "table",
      floor: "Ground",
      capacity: 6,
    },
    {
      label: "Table 4",
      code: "T04",
      type: "table",
      floor: "Ground",
      capacity: 2,
    },
    {
      label: "Table 5",
      code: "T05",
      type: "table",
      floor: "Ground",
      capacity: 8,
    },
    {
      label: "Room 101",
      code: "R101",
      type: "room",
      floor: "1st",
      capacity: 2,
    },
    {
      label: "Room 102",
      code: "R102",
      type: "room",
      floor: "1st",
      capacity: 3,
    },
    {
      label: "Room 201",
      code: "R201",
      type: "room",
      floor: "2nd",
      capacity: 2,
    },
    {
      label: "Poolside",
      code: "PS01",
      type: "table",
      floor: "Ground",
      capacity: 20,
    },
  ];

  for (const loc of locations) {
    const existing = await Location.findOne({ code: loc.code });
    if (!existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Location.create as any)({
        ...loc,
        isActive: true,
        isOccupied: false,
      });
      console.log(`✅  Location: ${loc.label}`);
    } else {
      console.log(`ℹ️   Location exists: ${loc.label}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n🎉  Seed complete!");
}

main().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
