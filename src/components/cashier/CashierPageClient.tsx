"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { signOut } from "next-auth/react";
import { LogOut, Landmark, Receipt, LayoutGrid, PlusCircle } from "lucide-react";
import OrdersQueue from "./OrdersQueue";
import TableStatusGrid from "./TableStatusGrid";
import CashierNewOrder from "./CashierNewOrder";

const queryClient = new QueryClient();

interface CashierPageClientProps {
  staffName: string;
}

export default function CashierPageClient({
  staffName,
}: CashierPageClientProps) {
  const [mobileTab, setMobileTab] = useState<"billing" | "tables">("billing");
  const [newOrder, setNewOrder] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-base-100 overflow-hidden">
        {/* Top nav */}
        <header className="flex items-center justify-between px-4 py-2 bg-success/10 border-b border-success/20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Landmark className="w-5 h-5 text-success shrink-0" />
            <span className="font-bold text-success shrink-0">Cashier</span>
            <span className="text-base-content/50 text-sm truncate">
              · {staffName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!newOrder && (
              <button
                onClick={() => setNewOrder(true)}
                className="btn btn-success btn-xs gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Order</span>
              </button>
            )}
            <button
              onClick={() =>
                signOut({ redirect: false }).then(() => {
                  window.location.replace("/cashier/login");
                })
              }
              className="btn btn-ghost btn-xs gap-1.5 text-base-content/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {newOrder ? (
          <div className="flex-1 overflow-hidden">
            <CashierNewOrder
              cashierName={staffName}
              onExit={() => setNewOrder(false)}
            />
          </div>
        ) : (
          <>
            {/* Desktop: side-by-side | Mobile: tabs */}
            <div className="flex flex-1 overflow-hidden">
          {/* Billing queue — always visible on desktop, tab-controlled on mobile */}
          <div
            className={`flex-1 border-r border-base-300 overflow-hidden flex flex-col ${mobileTab === "billing" ? "flex" : "hidden"} md:flex`}
          >
            <OrdersQueue />
          </div>
          {/* Table status — fixed width on desktop, tab-controlled on mobile */}
          <div
            className={`w-full md:w-52 lg:w-60 shrink-0 overflow-hidden flex-col border-t md:border-t-0 border-base-300 ${mobileTab === "tables" ? "flex" : "hidden"} md:flex`}
          >
            <TableStatusGrid />
          </div>
        </div>

        {/* Mobile bottom tab bar */}
        <div className="md:hidden shrink-0 border-t border-base-300 flex bg-base-100">
          <button
            onClick={() => setMobileTab("billing")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${mobileTab === "billing" ? "text-success" : "text-base-content/40"}`}
          >
            <Receipt className="w-5 h-5" />
            Billing
          </button>
          <button
            onClick={() => setMobileTab("tables")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${mobileTab === "tables" ? "text-success" : "text-base-content/40"}`}
          >
            <LayoutGrid className="w-5 h-5" />
            Tables
          </button>
        </div>
          </>
        )}
      </div>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
