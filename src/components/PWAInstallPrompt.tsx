"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show on menu screens
    if (window.location.pathname.startsWith("/menu")) return;
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  if (dismissed || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div
          className="rounded-2xl shadow-2xl p-4 flex items-center gap-3"
          style={{
            background: "#1a1410",
            border: "1px solid rgba(201,169,110,0.3)",
          }}
        >
          <div
            className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold font-serif"
            style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}
          >
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#C9A96E" }}>
              Add to Home Screen
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              Install Regalia for faster access
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 btn btn-sm border-none gap-1.5 font-semibold"
            style={{ background: "#C9A96E", color: "#0f0f0f" }}
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="shrink-0 btn btn-ghost btn-xs btn-circle text-white/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
