import { z } from "zod";

// ─── Branding ───────────────────────────────────────────────────────────────
export const BrandingSchema = z.object({
  hotelName: z.string().min(1, "Hotel name is required").max(100),
  tagline: z.string().max(200).optional(),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  coverImageUrl: z
    .string()
    .url("Invalid cover image URL")
    .optional()
    .or(z.literal("")),
  coverVideoUrl: z
    .string()
    .url("Invalid cover video URL")
    .optional()
    .or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  whatsappNumber: z
    .string()
    .regex(/^\d{10,15}$/, "WhatsApp number must be 10–15 digits")
    .optional()
    .or(z.literal("")),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type BrandingInput = z.infer<typeof BrandingSchema>;

// ─── Category ────────────────────────────────────────────────────────────────
export const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(60),
  description: z.string().max(300).optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

// ─── Item ────────────────────────────────────────────────────────────────────
export const ItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive("Price must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  isVeg: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  preparationTtlMinutes: z.number().int().min(1).max(120).default(15),
  tags: z.array(z.string().max(30)).max(10).default([]),
  allergens: z.array(z.string().max(30)).max(10).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

export type ItemInput = z.infer<typeof ItemSchema>;

// ─── Location ────────────────────────────────────────────────────────────────
export const LocationSchema = z.object({
  label: z.string().min(1, "Location label is required").max(60),
  type: z.enum(["table", "room"]),
  floor: z.string().max(20).optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().default(true),
});

export type LocationInput = z.infer<typeof LocationSchema>;

// ─── Staff ───────────────────────────────────────────────────────────────────
export const StaffSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72)
    .optional(),
  role: z.enum(["captain", "kitchen", "cashier", "lead_manager"]),
  phone: z.string().max(15).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const StaffUpdateSchema = StaffSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72)
    .optional()
    .or(z.literal("")),
});

export type StaffInput = z.infer<typeof StaffSchema>;
export type StaffUpdateInput = z.infer<typeof StaffUpdateSchema>;

// ─── Order ───────────────────────────────────────────────────────────────────
export const OrderItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(200).optional(),
});

export const CreateOrderSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  items: z.array(OrderItemSchema).min(1, "At least one item is required"),
  guestName: z.string().max(100).optional(),
  guestPhone: z.string().max(15).optional(),
  notes: z.string().max(500).optional(),
  source: z
    .enum(["qr_room", "qr_table", "captain", "whatsapp"])
    .default("captain"),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
    "billed",
  ]),
  itemId: z.string().optional(), // for per-item status updates
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ─── Lead ────────────────────────────────────────────────────────────────────
export const LeadSchema = z.object({
  guestName: z.string().min(1, "Guest name is required").max(100),
  phone: z
    .string()
    .regex(/^\d{10,15}$/, "Phone must be 10–15 digits")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().max(100).optional(),
  source: z.enum([
    "walk_in",
    "website",
    "referral",
    "social_media",
    "whatsapp",
    "phone",
    "email",
    "other",
  ]),
  status: z
    .enum([
      "new",
      "contacted",
      "qualified",
      "proposal_sent",
      "negotiation",
      "won",
      "lost",
      "on_hold",
    ])
    .default("new"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  estimatedValue: z.number().min(0).optional(),
  eventDate: z.string().datetime().optional().or(z.literal("")),
  eventType: z.string().max(100).optional(),
  guestCount: z.number().int().min(1).optional(),
  notes: z.string().max(2000).optional(),
  nextFollowUpAt: z.string().datetime().optional().or(z.literal("")),
  leadManagerId: z.string().optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;

// ─── Follow-up ───────────────────────────────────────────────────────────────
export const FollowUpSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  type: z.enum(["call", "email", "whatsapp", "meeting", "note"]),
  notes: z.string().min(1, "Notes are required").max(2000),
  outcome: z.string().max(500).optional(),
  nextFollowUpAt: z.string().datetime().optional().or(z.literal("")),
  scheduledAt: z.string().datetime().optional(),
});

export type FollowUpInput = z.infer<typeof FollowUpSchema>;

// ─── Login ───────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  role: z
    .enum(["admin", "captain", "kitchen", "cashier", "lead_manager"])
    .optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
