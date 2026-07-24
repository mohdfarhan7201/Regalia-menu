"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Trash2,
  MessageCircle,
  Phone,
  Minus,
  Plus,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import {
  formatPrice,
  buildWhatsAppUrl,
  buildRoomOrderMessage,
} from "@/lib/utils";
import Image from "next/image";
import type { IBranding, ILocation } from "@/types";
import LottiePlayer from "@/components/LottiePlayer";

interface Props {
  open: boolean;
  onClose: () => void;
  branding: IBranding | null;
  location: ILocation | null;
}

export default function CartDrawer({
  open,
  onClose,
  branding,
  location,
}: Props) {
  const {
    items,
    removeItem,
    updateQuantity,
    setSpecialInstructions,
    specialInstructions,
    clear,
    totalAmount,
  } = useCartStore();
  const [instrValue, setInstrValue] = useState(specialInstructions);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const total = totalAmount();

  // Modal a11y: Escape to close, focus trap, and restore focus on close.
  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement;

    const focusables = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], textarea, input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const list = focusables();
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  const handleWhatsApp = () => {
    const phone = branding?.whatsappNumber ?? "";
    const restaurantName = branding?.restaurantName ?? "Regalia Resort";
    const roomLabel = location?.label ?? "Room";
    const msg = buildRoomOrderMessage(
      restaurantName,
      roomLabel,
      items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        discountPrice: i.discountPrice,
      })),
      total,
      instrValue || undefined,
    );
    const url = buildWhatsAppUrl(phone, msg);
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-base-300" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-base-300">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Your Order</h2>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border bg-primary/15 text-primary border-primary/30">
                  {items.length}
                </span>
              </div>
              <div className="flex gap-2">
                {items.length > 0 && (
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={clear}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
                <button
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-base-200 active:opacity-70 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                  onClick={onClose}
                  aria-label="Close cart"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <LottiePlayer variant="empty-cart" size={110} />
                  <p className="text-base-content/40 text-sm">
                    Your cart is empty
                  </p>
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <div key={item.itemId} className="flex items-center gap-3">
                      {item.imageUrl && (
                        <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-base-300">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-primary font-bold">
                          {formatPrice(
                            (item.discountPrice ?? item.price) * item.quantity,
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-base-200 rounded-full px-1">
                        <button
                          onClick={() =>
                            item.quantity === 1
                              ? removeItem(item.itemId)
                              : updateQuantity(item.itemId, item.quantity - 1)
                          }
                          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.itemId, item.quantity + 1)
                          }
                          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Special Instructions */}
                  <div className="mt-3">
                    <label className="text-xs text-base-content/50 font-medium">
                      Special Instructions (optional)
                    </label>
                    <textarea
                      ref={inputRef}
                      className="textarea textarea-bordered bg-base-200 w-full text-sm mt-1 resize-none"
                      rows={2}
                      placeholder="e.g. No onions, extra spicy..."
                      value={instrValue}
                      onChange={(e) => {
                        setInstrValue(e.target.value);
                        setSpecialInstructions(e.target.value);
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 py-4 border-t border-base-300 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60 text-sm">Total</span>
                  <span className="font-bold text-lg">
                    {formatPrice(total)}
                  </span>
                </div>
                <button
                  onClick={handleWhatsApp}
                  className="btn btn-success w-full gap-2 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Order via WhatsApp
                </button>
                {branding?.callNumber && (
                  <a
                    href={`tel:${branding.callNumber}`}
                    className="btn btn-outline btn-info w-full gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Reception
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
