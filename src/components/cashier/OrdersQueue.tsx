"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Receipt,
  ChevronDown,
  ChevronUp,
  Check,
  X as XIcon,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatElapsed } from "@/lib/utils";
import PaymentModal from "./PaymentModal";
import TransferModal from "./TransferModal";
import VoidModal from "./VoidModal";
import type { TableBill } from "@/app/api/orders/cashier/route";
import { Pill } from "@/components/ui/Pill";

async function fetchCashierTables(): Promise<TableBill[]> {
  const res = await fetch("/api/orders/cashier", { cache: "no-store" });
  if (!res.ok) throw new Error();
  return res.json();
}

export default function OrdersQueue() {
  const {
    data: tables = [],
    isLoading,
    refetch,
  } = useQuery<TableBill[]>({
    queryKey: ["cashier-tables"],
    queryFn: fetchCashierTables,
    refetchInterval: 5000,
  });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<TableBill | null>(null);
  const [transferTable, setTransferTable] = useState<TableBill | null>(null);
  const [voidTable, setVoidTable] = useState<TableBill | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  // Cashier takeover when the kitchen is behind: force an item delivered (it was
  // served, chef never tapped) or cancel it (never made → drop from the bill).
  async function resolveItem(
    orderId: string,
    itemId: string,
    itemStatus: "delivered" | "cancelled",
  ) {
    setBusyItem(itemId);
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemStatus }),
      });
      if (!res.ok) throw new Error();
      await refetch();
    } catch {
      toast.error("Could not update item");
    } finally {
      setBusyItem(null);
    }
  }

  // Toggle a line complimentary (₹0). Asks for a reason when turning on.
  async function toggleNoCharge(
    orderId: string,
    itemId: string,
    currentlyNc: boolean,
  ) {
    let reason: string | undefined;
    if (!currentlyNc) {
      const r = window.prompt("Mark item No-Charge — reason?", "");
      if (r === null) return;
      reason = r || undefined;
    }
    setBusyItem(itemId);
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noCharge: !currentlyNc, reason }),
      });
      if (!res.ok) throw new Error();
      await refetch();
    } catch {
      toast.error("Could not update item");
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-base-300 bg-base-200/50 flex items-center gap-2">
        <Receipt className="w-5 h-5 text-success" />
        <h2 className="font-bold text-base">Billing Queue</h2>
        {isLoading && (
          <span className="loading loading-spinner loading-xs text-base-content/40" />
        )}
        <Pill variant="success" className="ml-auto">
          {tables.length} table{tables.length !== 1 ? "s" : ""}
        </Pill>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-base-300/60">
        {!isLoading && tables.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-base-content/40">
            <span className="text-4xl">💰</span>
            <p className="text-sm">No tables awaiting billing</p>
          </div>
        )}

        <AnimatePresence>
          {tables.map((table) => {
            const isExp = expanded === table.tableId;
            const hasCancelled = table.kots.some((k) =>
              k.items.some((i) => i.itemStatus === "cancelled"),
            );
            // A KOT is "pending" for billing if it has any non-cancelled item that
            // isn't delivered yet. Cashier can resolve these inline below.
            const pendingKots = table.kots.filter((k) => {
              if (k.status === "cancelled") return false;
              const activeItems = k.items.filter(
                (i) => i.itemStatus !== "cancelled",
              );
              return (
                activeItems.length === 0 ||
                !activeItems.every((i) => i.itemStatus === "delivered")
              );
            });
            const canCollect = pendingKots.length === 0;

            return (
              <motion.div
                key={table.tableId}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="font-bold text-base shrink-0">
                      🪑 {table.tableLabel}
                    </span>
                    <Pill variant="outline" className="shrink-0">
                      {table.kots.length} KOT
                      {table.kots.length !== 1 ? "s" : ""}
                    </Pill>
                    {hasCancelled && (
                      <Pill variant="error" className="shrink-0">
                        voids
                      </Pill>
                    )}
                    {!canCollect && (
                      <Pill variant="warning" className="shrink-0">
                        {pendingKots.length} pending
                      </Pill>
                    )}
                  </div>
                  <button
                    onClick={() => setExpanded(isExp ? null : table.tableId)}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    {isExp ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm text-base-content/60 mb-3">
                  <span>
                    {table.itemCount} item{table.itemCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatElapsed(table.since)}
                  </span>
                </div>

                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="space-y-2">
                        {table.kots.map((kot) => (
                          <div
                            key={kot._id}
                            className="bg-base-200 rounded-xl px-3 py-2 text-sm"
                          >
                            <div className="flex justify-between font-mono font-bold text-warning text-xs mb-1">
                              <span>{kot.kotNumber}</span>
                              <span>₹{kot.total.toFixed(2)}</span>
                            </div>
                            <ul className="space-y-1">
                              {kot.items.map((item) => {
                                const cancelled =
                                  item.itemStatus === "cancelled";
                                const delivered =
                                  item.itemStatus === "delivered";
                                const unresolved = !cancelled && !delivered;
                                const busy = busyItem === item._id;
                                return (
                                  <li
                                    key={item._id}
                                    className="flex items-center justify-between gap-2 text-xs"
                                  >
                                    <span
                                      className={`min-w-0 truncate ${cancelled ? "line-through opacity-40" : "text-base-content/70"}`}
                                    >
                                      {item.name} x {item.quantity}
                                      {item.isNoCharge && (
                                        <span className="ml-1 font-bold text-success">
                                          NC
                                        </span>
                                      )}
                                      {unresolved && (
                                        <span className="ml-1 text-warning">
                                          · {item.itemStatus}
                                        </span>
                                      )}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span
                                        className={`text-base-content/60 ${item.isNoCharge ? "line-through opacity-40" : ""}`}
                                      >
                                        Rs.
                                        {(item.price * item.quantity).toFixed(
                                          2,
                                        )}
                                      </span>
                                      {item.isNoCharge && (
                                        <span className="text-success font-medium">
                                          Rs.0.00
                                        </span>
                                      )}
                                      {!cancelled && (
                                        <button
                                          onClick={() =>
                                            toggleNoCharge(
                                              kot._id,
                                              item._id,
                                              !!item.isNoCharge,
                                            )
                                          }
                                          disabled={busy}
                                          title={
                                            item.isNoCharge
                                              ? "Remove No-Charge"
                                              : "Mark No-Charge (₹0)"
                                          }
                                          className={`btn btn-xs ${item.isNoCharge ? "btn-success" : "btn-ghost border border-base-300"}`}
                                        >
                                          NC
                                        </button>
                                      )}
                                      {unresolved && (
                                        <>
                                          <button
                                            onClick={() =>
                                              resolveItem(
                                                kot._id,
                                                item._id,
                                                "delivered",
                                              )
                                            }
                                            disabled={busy}
                                            title="Mark served (charge)"
                                            className="btn btn-success btn-xs btn-circle"
                                          >
                                            <Check className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              resolveItem(
                                                kot._id,
                                                item._id,
                                                "cancelled",
                                              )
                                            }
                                            disabled={busy}
                                            title="Cancel (drop from bill)"
                                            className="btn btn-error btn-xs btn-circle"
                                          >
                                            <XIcon className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Secondary cashier actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setTransferTable(table)}
                          className="btn btn-outline btn-info btn-sm flex-1 gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Transfer
                        </button>
                        <button
                          onClick={() => setVoidTable(table)}
                          className="btn btn-outline btn-error btn-sm flex-1 gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Void
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => canCollect && setSelected(table)}
                  disabled={!canCollect}
                  className="btn btn-success btn-sm w-full gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !canCollect
                      ? `${pendingKots.length} KOT${pendingKots.length > 1 ? "s" : ""} have unresolved items — expand to deliver or cancel them`
                      : undefined
                  }
                >
                  <Receipt className="w-4 h-4 shrink-0" />
                  {canCollect ? (
                    <span className="truncate">
                      Collect Rs.{table.total.toFixed(2)}
                    </span>
                  ) : (
                    <span className="truncate text-warning text-xs">
                      ⏳ Resolve {pendingKots.length} KOT
                      {pendingKots.length > 1 ? "s" : ""} to bill
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {selected && (
        <PaymentModal
          table={selected}
          onClose={() => setSelected(null)}
          onPaid={() => {
            setSelected(null);
            refetch();
          }}
        />
      )}
      {transferTable && (
        <TransferModal
          table={transferTable}
          onClose={() => setTransferTable(null)}
          onTransferred={() => {
            setTransferTable(null);
            refetch();
          }}
        />
      )}
      {voidTable && (
        <VoidModal
          table={voidTable}
          onClose={() => setVoidTable(null)}
          onVoided={() => {
            setVoidTable(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
