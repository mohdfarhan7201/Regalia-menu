"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tag,
  MapPin,
  Users,
  Settings,
  ClipboardList,
  BarChart3,
  LogOut,
  PhoneCall,
  Menu,
  Landmark,
  ChefHat,
  ConciergeBell,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/metrics", label: "Metrics", icon: BarChart3 },
    ],
  },
  {
    // Live operational panels — admin is authorized on all of them and can take
    // over any role (place/cancel/transfer/void/bill) when staff is unavailable.
    label: "Operations",
    items: [
      { href: "/cashier", label: "Cashier (Billing)", icon: Landmark },
      { href: "/kitchen", label: "Kitchen (KDS)", icon: ChefHat },
      { href: "/captain", label: "Captain (Order)", icon: ConciergeBell },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/items", label: "Menu Items", icon: UtensilsCrossed },
      { href: "/admin/locations", label: "Locations / QR", icon: MapPin },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/staff", label: "Staff", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: PhoneCall },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/branding", label: "Branding", icon: Settings }],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-base-300/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <UtensilsCrossed className="w-4 h-4 text-primary-content" />
          </div>
          <div>
            <p className="font-playfair font-bold text-sm leading-tight tracking-wide">
              Regalia
            </p>
            <p className="text-[10px] text-base-content/40 leading-tight font-medium tracking-widest uppercase">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-base-content/30 px-3 mb-1.5">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                      active
                        ? "bg-primary text-primary-content font-semibold shadow-md shadow-primary/20"
                        : "text-base-content/60 hover:bg-base-300 hover:text-base-content",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                        active && "text-primary-content",
                      )}
                    />
                    <span className="flex-1 leading-none">{label}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-content/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="px-3 pb-4 pt-3 border-t border-base-300/60">
        <button
          onClick={() =>
            signOut({ redirect: false }).then(() => {
              window.location.replace("/login");
            })
          }
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-base-content/40 hover:bg-error/10 hover:text-error transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — hidden below md (768px) */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col bg-base-200 border-r border-base-300/60">
        <SidebarNav />
      </aside>

      {/* Mobile top bar + Sheet drawer — visible below md (768px) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 bg-base-200/95 backdrop-blur-sm border-b border-base-300/60">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open navigation"
              />
            }
          >
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-64 p-0 bg-base-200 border-r border-base-300/60"
          >
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
            <UtensilsCrossed className="w-3.5 h-3.5 text-primary-content" />
          </div>
          <span className="font-playfair font-bold text-sm tracking-wide">
            Regalia
          </span>
          <span className="text-[10px] text-base-content/40 font-medium tracking-widest uppercase mt-px">
            Admin
          </span>
        </div>
      </div>
    </>
  );
}
