"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  Trash2,
  ChevronLeft,
  Send,
  MessageSquarePlus,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useCaptainStore } from "@/store/captain";
import { formatPrice } from "@/lib/utils";
import LottiePlayer from "@/components/LottiePlayer";
import { FssaiDot } from "@/components/ui/FssaiDot";

interface OrderSummaryProps {
  captainName: string;
}

export default function OrderSummary({ captainName }: OrderSummaryProps) {
  const {
    selectedTable,
    orderItems,
    specialInstructions,
    updateQuantity,
    updateNotes,
    setNoCharge,
    setSpecialInstructions,
    setStep,
    resetOrder,
    totalItems,
    subtotal,
  } = useCaptainStore();

  const [isPlacing, setIsPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ kotNumber: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const placeOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return;
    setIsPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTable._id,
          tableLabel: selectedTable.label,
          items: orderItems,
          specialInstructions: specialInstructions.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to place order");

      setPlaced({ kotNumber: data.kotNumber });
      toast.success(`Order placed! ${data.kotNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  // Success screen
  if (placed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full gap-6 py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          <LottiePlayer variant="success" size={140} loop={false} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold font-playfair text-success">
            Order Placed!
          </h2>
          <p className="text-base-content/60 mt-1">Sent to Kitchen KDS</p>
          <div className="mt-4 inline-block bg-base-200 border border-base-300 rounded-2xl px-8 py-3">
            <p className="text-xs text-base-content/40 uppercase tracking-wider">
              KOT Number
            </p>
            <p className="text-3xl font-bold font-mono-jetbrains text-warning mt-1">
              {placed.kotNumber}
            </p>
          </div>
          <p className="text-sm text-base-content/50 mt-3">
            {selectedTable?.label}
          </p>
        </div>
        <button
          onClick={() => {
            resetOrder();
          }}
          className="btn btn-warning btn-lg"
        >
          New Order
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setStep("order_build")}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg">Review Order</h2>
          <p className="text-sm text-base-content/50">
            {selectedTable?.label} · {captainName}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence>
          {orderItems.map((item) => (
            <motion.div
              key={item.itemId}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-base-200 rounded-xl border border-base-300 p-3 space-y-2"
            >
              <div className="flex items-start gap-3">
                {/* Veg indicator */}
                <div className="mt-0.5">
                  <FssaiDot isVeg={item.isVegetarian} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {item.name}
                    {item.isNoCharge && (
                      <span className="ml-1 text-[10px] font-bold uppercase text-success">
                        NC
                      </span>
                    )}
                  </p>
                  {item.isNoCharge ? (
                    <p className="text-sm font-mono-jetbrains">
                      <span className="line-through opacity-40">
                        {formatPrice(
                          (item.discountPrice ?? item.price) * item.quantity,
                        )}
                      </span>{" "}
                      <span className="text-success">{formatPrice(0)}</span>
                    </p>
                  ) : (
                    <p className="text-warning text-sm font-mono-jetbrains">
                      {formatPrice(
                        (item.discountPrice ?? item.price) * item.quantity,
                      )}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (item.isNoCharge) {
                        setNoCharge(item.itemId, false);
                      } else {
                        const reason = window.prompt(
                          `Mark "${item.name}" No-Charge — reason?`,
                          "",
                        );
                        if (reason !== null)
                          setNoCharge(item.itemId, true, reason || undefined);
                      }
                    }}
                    className={`mt-0.5 text-[11px] font-medium ${item.isNoCharge ? "text-error" : "text-success"}`}
                  >
                    {item.isNoCharge ? "Remove No-Charge" : "Mark No-Charge"}
                  </button>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      updateQuantity(item.itemId, item.quantity - 1)
                    }
                    className="btn btn-ghost btn-xs btn-circle border border-base-300"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="w-3 h-3 text-error" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                  </button>
                  <span className="w-6 text-center text-sm font-bold font-mono-jetbrains">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.itemId, item.quantity + 1)
                    }
                    className="btn btn-ghost btn-xs btn-circle border border-base-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Per-item notes */}
              <input
                type="text"
                value={item.notes}
                onChange={(e) => updateNotes(item.itemId, e.target.value)}
                placeholder="e.g. no onion, extra spicy…"
                className="input input-bordered input-xs w-full text-xs"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Special instructions */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowInstructions((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-base-content/50 font-medium uppercase tracking-wider hover:text-base-content transition-colors w-full"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Special Instructions
          {specialInstructions && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-warning" />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 ml-auto transition-transform ${showInstructions ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Urgent – VIP guest, birthday table, allergy notes…"
                rows={2}
                className="textarea textarea-bordered w-full text-sm mt-2 resize-none"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Total & Place */}
      <div className="mt-3 bg-base-200 rounded-xl border border-base-300 p-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-base-content/60">Items</span>
          <span>{totalItems()}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Subtotal</span>
          <span className="font-mono-jetbrains text-warning">
            {formatPrice(subtotal())}
          </span>
        </div>
      </div>

      <button
        onClick={placeOrder}
        disabled={isPlacing || orderItems.length === 0}
        className="btn btn-warning btn-lg w-full mt-3 gap-2"
      >
        {isPlacing ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <Send className="w-5 h-5" />
        )}
        {isPlacing ? "Placing Order…" : "Place Order → Kitchen"}
      </button>
    </div>
  );
}
