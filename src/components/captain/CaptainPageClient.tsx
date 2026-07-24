"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  LogOut,
  ArrowLeft,
  ClipboardList,
  PlusCircle,
  Bell,
} from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import TableSelector from "@/components/captain/TableSelector";
import OrderBuilder from "@/components/captain/OrderBuilder";
import OrderSummary from "@/components/captain/OrderSummary";
import ActiveOrders from "@/components/captain/ActiveOrders";
import CaptainCallPopup from "@/components/captain/CaptainCallPopup";
import { useCaptainStore } from "@/store/captain";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import type { ILocation } from "@/types";

const queryClient = new QueryClient();

interface CaptainAppProps {
  captainName: string;
}

function CaptainApp({ captainName }: CaptainAppProps) {
  const { step, selectedTable, setStep, selectTable, clearTable, resetOrder } =
    useCaptainStore();

  // Register push notifications for this captain device (permission requested
  // only via the explicit "Enable alerts" button below — never on mount).
  const { permission, enable, disable } = usePushSubscription();

  // Reset on unmount
  useEffect(() => {
    return () => resetOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTable = (table: ILocation) => {
    selectTable(table);
  };

  const stepLabel: Record<string, string> = {
    table_select: "Select Table",
    order_build: "Add Items",
    order_summary: "Review & Place",
    active_orders: "Active Orders",
  };

  const handleBack = () => {
    if (step === "order_summary") setStep("order_build");
    else if (step === "order_build" || step === "active_orders") clearTable();
    else clearTable();
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <CaptainCallPopup />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-base-200/80 backdrop-blur border-b border-base-300 px-4 py-3 flex items-center gap-3">
        {step !== "table_select" && (
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 flex-1">
          <ChefHat className="w-5 h-5 text-warning" />
          <div>
            <p className="font-bold text-sm leading-none">Captain</p>
            <p className="text-xs text-base-content/50 leading-none mt-0.5">
              {stepLabel[step]}
              {selectedTable && step !== "table_select" && (
                <span className="ml-1 text-warning font-medium">
                  · {selectedTable.label}
                </span>
              )}
            </p>
          </div>
        </div>

        <span className="text-sm text-base-content/50 hidden sm:block">
          {captainName}
        </span>

        {permission === "default" && (
          <button
            onClick={() => enable()}
            className="btn btn-ghost btn-sm gap-1 text-warning"
            title="Enable call alerts on this device"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Enable alerts</span>
          </button>
        )}

        <button
          onClick={() =>
            disable().finally(() =>
              signOut({ redirect: false }).then(() => {
                window.location.replace("/captain/login");
              }),
            )
          }
          className="btn btn-ghost btn-sm gap-1 text-base-content/50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* Tab bar when a table is selected (but not in summary) */}
      {selectedTable && step !== "order_summary" && (
        <div className="border-b border-base-300 bg-base-200/50 flex">
          <button
            onClick={() => setStep("order_build")}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              step === "order_build"
                ? "border-warning text-warning"
                : "border-transparent text-base-content/50 hover:text-base-content"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            New Order
          </button>
          <button
            onClick={() => setStep("active_orders")}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              step === "active_orders"
                ? "border-error text-error"
                : "border-transparent text-base-content/50 hover:text-base-content"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Active Orders
          </button>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {step === "table_select" && (
            <motion.div
              key="table_select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-playfair text-2xl font-bold mb-6">
                Select a Table
              </h1>
              <TableSelector onSelectTable={handleSelectTable} />
            </motion.div>
          )}

          {step === "order_build" && (
            <motion.div
              key="order_build"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-160px)] flex flex-col"
            >
              <OrderBuilder />
            </motion.div>
          )}

          {step === "order_summary" && (
            <motion.div
              key="order_summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-120px)] flex flex-col"
            >
              <OrderSummary captainName={captainName} />
            </motion.div>
          )}

          {step === "active_orders" && selectedTable && (
            <motion.div
              key="active_orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveOrders
                tableId={selectedTable._id}
                tableLabel={selectedTable.label}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Server-component wrapper is in page.tsx — this is the client shell
export default function CaptainPageClient({
  captainName,
}: {
  captainName: string;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <CaptainApp captainName={captainName} />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
