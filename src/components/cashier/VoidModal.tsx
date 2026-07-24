"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TableBill } from "@/app/api/orders/cashier/route";

interface VoidModalProps {
  table: TableBill;
  onClose: () => void;
  onVoided: () => void;
}

const PRESET_REASONS = ["No-show", "Walk-out", "Wrong table", "Duplicate KOT"];

export default function VoidModal({
  table,
  onClose,
  onVoided,
}: VoidModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVoid = async () => {
    const finalReason = reason.trim();
    if (!finalReason) {
      toast.error("A reason is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${table.anchorKotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "void_table",
          tableId: table.tableId,
          reason: finalReason,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error);
      }
      toast.success("Table freed — orders voided (no charge)");
      onVoided();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Void failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-base-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 bg-error/5">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-error" />
                Free Without Payment
              </h2>
              <p className="text-sm text-base-content/60">
                {table.tableLabel} · {table.kots.length} KOT
                {table.kots.length !== 1 ? "s" : ""} · Rs.
                {table.total.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-sm"
              aria-label="Close void modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <p className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
              Orders will be cancelled and kept OUT of sales. This cannot be
              undone.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`btn btn-xs ${reason === r ? "btn-error" : "btn-outline"}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (required)"
              className="input input-bordered w-full"
            />

            <button
              onClick={handleVoid}
              disabled={loading}
              className="btn btn-error btn-lg w-full"
            >
              {loading ? (
                <span className="loading loading-spinner" />
              ) : (
                "Free Table (No Charge)"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
