"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X, CheckCheck } from "lucide-react";
import { useCaptainCallAlerts } from "@/hooks/useCaptainCallAlerts";

export default function CaptainCallPopup() {
  const { alerts, dismiss, dismissAll } = useCaptainCallAlerts();

  return (
    <div className="fixed top-20 right-4 z-200 flex flex-col gap-2 w-72 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert._id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto bg-warning text-warning-content rounded-2xl shadow-2xl border border-warning/50 overflow-hidden"
          >
            {/* Pulsing top bar */}
            <div className="h-1 bg-warning-content/30 animate-pulse" />

            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 bg-warning-content/20 rounded-full p-2">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">
                    {alert.isGeneric
                      ? "Guest Needs Attention!"
                      : "Table Calling!"}
                  </p>
                  <p className="text-lg font-extrabold mt-0.5">
                    {alert.isGeneric
                      ? "👤 Someone needs help"
                      : `🪑 ${alert.tableLabel}`}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(alert.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => dismiss(alert._id)}
                  className="btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => dismiss(alert._id)}
                className="btn btn-sm w-full mt-3 bg-warning-content/20 hover:bg-warning-content/30 border-none font-semibold gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                On My Way
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Dismiss all if multiple */}
      <AnimatePresence>
        {alerts.length > 1 && (
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onClick={dismissAll}
            className="pointer-events-auto btn btn-xs btn-ghost text-base-content/50 self-end"
          >
            Dismiss all ({alerts.length})
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
