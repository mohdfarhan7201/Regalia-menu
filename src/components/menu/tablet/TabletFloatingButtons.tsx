"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  BellRing,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { IBranding, MenuMode } from "@/types";

interface Props {
  branding: IBranding | null;
  mode: MenuMode;
  locationCode?: string | null;
}

type CallState = "idle" | "calling" | "sent" | "error";

export default function TabletFloatingButtons({
  branding,
  mode,
  locationCode,
}: Props) {
  const isRoom = mode === "room";
  const showWhatsApp = isRoom && branding?.whatsappNumber;
  // Show captain call button in ALL modes — locationCode optional
  const showCaptainCall = true;

  const [callState, setCallState] = useState<CallState>("idle");

  const handleCallCaptain = async () => {
    if (callState !== "idle") return;
    setCallState("calling");
    try {
      const res = await fetch("/api/captain-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationCode }),
      });
      if (res.ok) {
        setCallState("sent");
        setTimeout(() => setCallState("idle"), 10000);
      } else {
        setCallState("error");
        setTimeout(() => setCallState("idle"), 4000);
      }
    } catch {
      setCallState("error");
      setTimeout(() => setCallState("idle"), 4000);
    }
  };

  if (!showWhatsApp && !showCaptainCall) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-8 left-6 flex flex-col gap-3 z-20"
    >
      {showCaptainCall && (
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.08 }}
            onClick={handleCallCaptain}
            disabled={callState !== "idle"}
            className="relative w-14 h-14 rounded-full shadow-2xl border-none flex items-center justify-center transition-all cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{
              background:
                callState === "sent"
                  ? "#16a34a"
                  : callState === "error"
                    ? "#dc2626"
                    : "var(--menu-accent)",
              boxShadow:
                callState === "sent"
                  ? "0 0 20px rgba(22,163,74,0.5)"
                  : "0 0 20px var(--menu-accent-glow)",
            }}
            title={
              callState === "sent"
                ? "Captain is on the way!"
                : callState === "calling"
                  ? "Alerting captain…"
                  : "Call Captain"
            }
            aria-label="Call Captain"
          >
            {/* Pulse ring when calling */}
            {callState === "calling" && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: "2px solid var(--menu-accent)" }}
                animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeOut" }}
              />
            )}
            {callState === "sent" ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : callState === "error" ? (
              <AlertCircle className="w-6 h-6 text-white" />
            ) : (
              <BellRing
                className="w-6 h-6"
                style={{ color: "var(--menu-on-accent)" }}
              />
            )}
          </motion.button>

          {/* Label */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="absolute left-16 bottom-3 text-xs font-medium whitespace-nowrap select-none"
            style={{ color: "var(--menu-accent-dim)" }}
          >
            {callState === "sent"
              ? "Captain on the way!"
              : callState === "calling"
                ? "Alerting…"
                : callState === "error"
                  ? "Try again"
                  : "Call Captain"}
          </motion.span>

          {/* Toast */}
          {callState === "sent" && (
            <motion.div
              initial={{ opacity: 0, x: -8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="absolute left-16 bottom-10 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap inline-flex items-center gap-1"
              style={{
                background: "rgba(22,163,74,0.15)",
                border: "1px solid rgba(22,163,74,0.4)",
                color: "#4ade80",
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" /> All captains have been
              alerted!
            </motion.div>
          )}
        </div>
      )}

      {showWhatsApp && (
        <motion.a
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          href={`https://wa.me/${branding?.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          style={{ background: "#25D366" }}
          title="WhatsApp"
          aria-label="Order via WhatsApp"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.a>
      )}
    </motion.div>
  );
}
