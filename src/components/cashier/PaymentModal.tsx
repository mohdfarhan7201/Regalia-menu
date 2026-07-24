"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Hotel,
  Split,
} from "lucide-react";
import { toast } from "sonner";
import type { PaymentMethod } from "@/types";
import type { TableBill } from "@/app/api/orders/cashier/route";

interface PaymentModalProps {
  table: TableBill;
  onClose: () => void;
  onPaid: () => void;
}

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "cash", label: "Cash", icon: <Banknote className="w-4 h-4" /> },
  { value: "card", label: "Card", icon: <CreditCard className="w-4 h-4" /> },
  { value: "upi", label: "UPI", icon: <Smartphone className="w-4 h-4" /> },
  {
    value: "room_charge",
    label: "Room Charge",
    icon: <Hotel className="w-4 h-4" />,
  },
];

export default function PaymentModal({
  table,
  onClose,
  onPaid,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState<string>(table.total.toFixed(2));
  const [loading, setLoading] = useState(false);

  // Split payment state
  const [splitMode, setSplitMode] = useState(false);
  const [split1Method, setSplit1Method] = useState<PaymentMethod>("cash");
  const [split1Amount, setSplit1Amount] = useState<string>(
    (table.total / 2).toFixed(2),
  );
  const [split2Method, setSplit2Method] = useState<PaymentMethod>("upi");

  const numAmount = parseFloat(amount) || 0;
  const change = numAmount - table.total;

  const split1Num = parseFloat(split1Amount) || 0;
  const split2Num = Math.max(0, table.total - split1Num);

  const handlePay = async () => {
    if (!splitMode && numAmount < table.total && method === "cash") {
      toast.error("Amount is less than total");
      return;
    }
    if (splitMode && split1Num <= 0) {
      toast.error("First payment amount must be greater than 0");
      return;
    }
    if (splitMode && split2Num <= 0) {
      toast.error("Split amounts must add up to the total");
      return;
    }
    setLoading(true);
    try {
      const body = splitMode
        ? {
            action: "pay_table",
            tableId: table.tableId,
            splitPayment: [
              { method: split1Method, amount: split1Num },
              { method: split2Method, amount: split2Num },
            ],
          }
        : {
            action: "pay_table",
            tableId: table.tableId,
            paymentMethod: method,
            paymentAmount: numAmount,
          };

      const res = await fetch(`/api/orders/${table.anchorKotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("Payment recorded - table cleared!");
      onPaid();
    } catch {
      toast.error("Failed to process payment");
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
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 bg-success/5">
            <div>
              <h2 className="font-bold text-lg">Process Payment</h2>
              <p className="text-sm text-base-content/60">
                {table.tableLabel} · {table.kots.length} KOT
                {table.kots.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-sm"
              aria-label="Close payment modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {/* Bill summary — per KOT */}
            <div className="bg-base-200 rounded-xl p-4 space-y-3 max-h-60 overflow-y-auto">
              {table.kots.map((kot) => (
                <div key={kot._id}>
                  <p className="text-xs font-mono font-bold text-warning mb-1">
                    {kot.kotNumber}
                  </p>
                  {kot.items.map((item) => {
                    const cancelled = item.itemStatus === "cancelled";
                    return (
                      <div
                        key={item._id}
                        className={`flex justify-between text-sm ${cancelled ? "line-through opacity-40" : ""}`}
                      >
                        <span className="text-base-content/70">
                          {item.name} x {item.quantity}
                          {item.isNoCharge && (
                            <span className="ml-1 text-xs font-bold text-success">
                              NC
                            </span>
                          )}
                        </span>
                        <span className={item.isNoCharge ? "text-success" : ""}>
                          Rs.
                          {(item.isNoCharge
                            ? 0
                            : item.price * item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-xs text-base-content/50 mt-1">
                    <span>KOT subtotal</span>
                    <span>Rs.{kot.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-base-300 pt-2 flex justify-between font-bold text-base">
                <span>Table Total</span>
                <span className="text-success">
                  Rs.{table.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Split toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Payment Method</p>
              <button
                onClick={() => setSplitMode((v) => !v)}
                className={`btn btn-xs gap-1 ${splitMode ? "btn-warning" : "btn-ghost border border-base-300"}`}
              >
                <Split className="w-3 h-3" />
                Split
              </button>
            </div>

            {!splitMode ? (
              <>
                {/* Single method */}
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      onClick={() => setMethod(pm.value)}
                      className={`btn btn-sm gap-2 justify-start ${method === pm.value ? "btn-success" : "btn-outline"}`}
                    >
                      {pm.icon}
                      {pm.label}
                    </button>
                  ))}
                </div>

                {/* Amount received (cash only) */}
                {method === "cash" && (
                  <div className="form-control gap-1">
                    <label className="label py-0">
                      <span className="label-text text-sm">
                        Amount Received (Rs.)
                      </span>
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input input-bordered"
                      min={0}
                      step="0.01"
                    />
                    {change >= 0 && (
                      <p className="text-sm text-success mt-1">
                        Change: Rs.{change.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Split payment UI */
              <div className="space-y-3">
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-warning uppercase">
                    Payment 1
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.value}
                        onClick={() => setSplit1Method(pm.value)}
                        className={`btn btn-xs gap-1 justify-start ${split1Method === pm.value ? "btn-warning" : "btn-ghost border border-base-300"}`}
                      >
                        {pm.icon}
                        {pm.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-base-content/50 shrink-0">
                      Rs.
                    </label>
                    <input
                      type="number"
                      value={split1Amount}
                      onChange={(e) => setSplit1Amount(e.target.value)}
                      className="input input-bordered input-sm flex-1"
                      min={0}
                      max={table.total}
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-info/30 bg-info/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-info uppercase">
                    Payment 2 (Remaining)
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.value}
                        onClick={() => setSplit2Method(pm.value)}
                        className={`btn btn-xs gap-1 justify-start ${split2Method === pm.value ? "btn-info" : "btn-ghost border border-base-300"}`}
                      >
                        {pm.icon}
                        {pm.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-info">
                    Rs.{split2Num.toFixed(2)}
                    <span className="text-xs font-normal text-base-content/40 ml-1">
                      auto-calculated
                    </span>
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={loading}
              className="btn btn-success btn-lg w-full"
            >
              {loading ? (
                <span className="loading loading-spinner" />
              ) : splitMode ? (
                `Collect Rs.${table.total.toFixed(2)} (Split) and Clear Table`
              ) : (
                `Collect Rs.${table.total.toFixed(2)} and Clear Table`
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
