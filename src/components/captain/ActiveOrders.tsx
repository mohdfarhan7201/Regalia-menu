"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Ban, Timer } from "lucide-react";
import { toast } from "sonner";
import { formatElapsed, formatPrice } from "@/lib/utils";
import type { IOrder } from "@/types";
import { FssaiDot } from "@/components/ui/FssaiDot";
import { Pill } from "@/components/ui/Pill";
import type { PillVariant } from "@/components/ui/Pill";

interface Props {
  tableId: string;
  tableLabel: string;
}

const VOID_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

async function fetchTableOrders(tableId: string): Promise<IOrder[]> {
  const res = await fetch(`/api/orders/captain?tableId=${tableId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

async function cancelItem(orderId: string, itemId: string) {
  const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemStatus: "cancelled" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to cancel item");
}

const STATUS_CONFIG: Record<string, { label: string; pill: PillVariant }> = {
  pending: { label: "Pending", pill: "warning" },
  preparing: { label: "Preparing", pill: "info" },
  partially_ready: { label: "Partially Ready", pill: "info" },
  ready: { label: "Ready", pill: "success" },
  partially_delivered: { label: "Partially Delivered", pill: "success" },
  delivered: { label: "Delivered", pill: "ghost" },
  cancelled: { label: "Cancelled", pill: "error" },
};

// Per-item kitchen status shown to captain
const ITEM_STATUS_CONFIG: Record<
  string,
  { label: string; pill: PillVariant; icon: string }
> = {
  pending: { label: "Queued", pill: "neutral", icon: "⏳" },
  preparing: { label: "Preparing", pill: "info", icon: "🔥" },
  ready: { label: "Ready", pill: "success", icon: "✅" },
  delivered: { label: "Delivered", pill: "ghost", icon: "🍽️" },
  cancelled: { label: "Voided", pill: "error", icon: "✕" },
};

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function ActiveOrders({ tableId, tableLabel }: Props) {
  const queryClient = useQueryClient();
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const now = useNow();
  const prevOrderIds = useRef<string[]>([]);
  const [tickerMsg, setTickerMsg] = useState<string | null>(null);
  const tickerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: orders = [], isLoading } = useQuery<IOrder[]>({
    queryKey: ["captain-active-orders", tableId],
    queryFn: () => fetchTableOrders(tableId),
    refetchInterval: 6000,
  });

  // Detect genuinely new KOTs and show a ticker announcement
  useEffect(() => {
    const currentIds = orders.map((o) => o._id);
    const newOrders = orders.filter(
      (o) => !prevOrderIds.current.includes(o._id),
    );
    if (prevOrderIds.current.length > 0 && newOrders.length > 0) {
      const latest = newOrders[newOrders.length - 1];
      const itemCount = latest.items.reduce((s, i) => s + i.quantity, 0);
      const msg = `🆕 ${latest.kotNumber} · ${latest.tableLabel} · ${itemCount} item${itemCount !== 1 ? "s" : ""} · ₹${latest.total}`;
      setTickerMsg(msg);
      if (tickerTimer.current) clearTimeout(tickerTimer.current);
      tickerTimer.current = setTimeout(() => setTickerMsg(null), 10_000);
    }
    prevOrderIds.current = currentIds;
  }, [orders]);

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      cancelItem(orderId, itemId),
    onSuccess: () => {
      toast.success("Item voided");
      setConfirmingItemId(null);
      queryClient.invalidateQueries({
        queryKey: ["captain-active-orders", tableId],
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed");
      setConfirmingItemId(null);
    },
  });

  const activeOrders = orders.filter(
    (o) => !["cancelled", "paid", "cleared"].includes(o.status),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span className="loading loading-spinner loading-md text-warning" />
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-base-content/40">
        <CheckCircle2 className="w-8 h-8" />
        <p className="text-sm">No active orders for {tableLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* News ticker — appears for 10 s when a new KOT arrives */}
      <AnimatePresence>
        {tickerMsg && (
          <motion.div
            key="ticker"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="overflow-hidden rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2 px-3 py-1.5"
          >
            <span className="shrink-0 text-warning text-xs font-bold uppercase tracking-widest">
              NEW
            </span>
            <div className="flex-1 overflow-hidden">
              <motion.p
                key={tickerMsg}
                initial={{ x: "100%" }}
                animate={{ x: "-100%" }}
                transition={{ duration: 12, ease: "linear" }}
                className="whitespace-nowrap text-xs font-medium text-warning"
              >
                {tickerMsg}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{tickerMsg}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-base-content/50 uppercase tracking-wider font-medium">
        {activeOrders.length} Active Order{activeOrders.length > 1 ? "s" : ""} —{" "}
        {tableLabel}
      </p>

      <AnimatePresence>
        {activeOrders.map((order) => {
          const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
          const orderAge = now - new Date(order.createdAt).getTime();
          const inVoidWindow = orderAge < VOID_WINDOW_MS;
          const remainingSec = inVoidWindow
            ? Math.ceil((VOID_WINDOW_MS - orderAge) / 1000)
            : 0;

          return (
            <motion.div
              key={order._id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-base-300 bg-base-200 p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-warning text-sm">
                    {order.kotNumber}
                  </span>
                  <Pill variant={cfg.pill}>{cfg.label}</Pill>
                </div>
                <span className="text-xs text-base-content/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatElapsed(order.createdAt)}
                </span>
              </div>

              {/* Kitchen progress summary */}
              {(() => {
                const active = order.items.filter(
                  (i) => i.itemStatus !== "cancelled",
                );
                const ready = active.filter(
                  (i) =>
                    i.itemStatus === "ready" || i.itemStatus === "delivered",
                ).length;
                const preparing = active.filter(
                  (i) => i.itemStatus === "preparing",
                ).length;
                const total = active.length;
                const pct = total > 0 ? Math.round((ready / total) * 100) : 0;
                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-base-content/50">
                      <span className="flex items-center gap-2">
                        {preparing > 0 && (
                          <span className="text-info font-medium">
                            🔥 {preparing} cooking
                          </span>
                        )}
                        {ready > 0 && (
                          <span className="text-success font-medium">
                            ✅ {ready}/{total} ready
                          </span>
                        )}
                        {preparing === 0 && ready === 0 && (
                          <span>⏳ Waiting for kitchen</span>
                        )}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-base-300 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct === 100
                              ? "oklch(var(--su))"
                              : "oklch(var(--in))",
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Void window indicator */}
              {inVoidWindow && (
                <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                  <Timer className="w-3 h-3" />
                  Void window closes in {remainingSec}s — tap ✕ to void an item
                </div>
              )}
              {!inVoidWindow && (
                <div className="flex items-center gap-1.5 text-xs text-base-content/40">
                  <Ban className="w-3 h-3" />
                  Void window expired — ask the kitchen to cancel
                </div>
              )}

              {/* Items */}
              <ul className="space-y-1.5">
                {order.items.map((item) => {
                  const isCancelled = item.itemStatus === "cancelled";
                  const isConfirming = confirmingItemId === item._id;
                  const canVoid =
                    inVoidWindow &&
                    !isCancelled &&
                    item.itemStatus !== "delivered";
                  const itemCfg =
                    ITEM_STATUS_CONFIG[item.itemStatus] ??
                    ITEM_STATUS_CONFIG.pending;

                  return (
                    <li key={item._id}>
                      {isConfirming ? (
                        <div className="flex items-center gap-2 bg-error/10 rounded-xl px-2 py-1.5">
                          <span className="text-xs text-error flex-1 font-medium">
                            Void &quot;{item.name}&quot;?
                          </span>
                          <button
                            onClick={() =>
                              cancelMutation.mutate({
                                orderId: order._id,
                                itemId: item._id,
                              })
                            }
                            disabled={cancelMutation.isPending}
                            className="btn btn-error btn-xs gap-1"
                          >
                            {cancelMutation.isPending ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              "Yes, Void"
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmingItemId(null)}
                            className="btn btn-ghost btn-xs"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`flex justify-between items-start gap-2 text-sm ${isCancelled ? "opacity-40" : "text-base-content/80"}`}
                        >
                          <span className="flex items-center gap-1.5 flex-1 min-w-0">
                            <FssaiDot isVeg={item.isVegetarian} size="sm" />
                            <span
                              className={`truncate ${isCancelled ? "line-through" : ""}`}
                            >
                              {item.quantity}× {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-xs text-base-content/40 italic shrink-0">
                                ({item.notes})
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            {/* Kitchen status pill */}
                            <Pill variant={itemCfg.pill}>
                              {itemCfg.icon} {itemCfg.label}
                            </Pill>
                            <span className="font-mono-jetbrains text-xs text-base-content/50">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            {canVoid && (
                              <button
                                onClick={() => setConfirmingItemId(item._id)}
                                className="btn btn-ghost btn-xs text-error px-1 min-h-0 h-5"
                                title="Void item"
                              >
                                ✕
                              </button>
                            )}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Total */}
              <div className="flex justify-between text-sm font-bold border-t border-base-300/50 pt-2">
                <span>Total</span>
                <span className="font-mono-jetbrains text-warning">
                  {formatPrice(order.total)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
