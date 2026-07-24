import type { UserRole } from "@/types";

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  captain: "/captain",
  kitchen: "/kitchen",
  cashier: "/cashier",
  lead_manager: "/leads",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  captain: "Captain",
  kitchen: "Kitchen",
  cashier: "Cashier",
  lead_manager: "Lead Manager",
};
