"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, MessageCircle, Phone, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import {
  formatPrice,
  buildWhatsAppUrl,
  buildRoomOrderMessage,
} from "@/lib/utils";
import type { IBranding, ILocation } from "@/types";

interface Props {
  branding: IBranding | null;
  location: ILocation | null;
  onClose: () => void;
}

export default function TabletCartPanel({
  branding,
  location,
  onClose,
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
  const total = totalAmount();

  const handleWhatsApp = () => {
    const phone = branding?.whatsappNumber ?? "";
    const msg = buildRoomOrderMessage(
      branding?.restaurantName ?? "Regalia Resort",
      location?.label ?? "Room",
      items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        discountPrice: i.discountPrice,
      })),
      total,
      instrValue || undefined,
    );
    window.open(buildWhatsAppUrl(phone, msg), "_blank");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed top-0 right-0 bottom-0 w-80 bg-base-100 shadow-2xl z-50 flex flex-col border-l border-base-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <h2 className="font-bold font-playfair">Your Order</h2>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button className="btn btn-ghost btn-xs text-error" onClick={clear}>
              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-base-content/40 text-sm py-8">
            Cart is empty
          </p>
        ) : (
          items.map((item) => (
            <div key={item.itemId} className="flex items-center gap-2">
              {item.imageUrl && (
                <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-base-300">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
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
                  onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {items.length > 0 && (
          <textarea
            className="textarea textarea-bordered bg-base-200 w-full text-sm resize-none mt-2"
            rows={2}
            placeholder="Special instructions..."
            value={instrValue}
            onChange={(e) => {
              setInstrValue(e.target.value);
              setSpecialInstructions(e.target.value);
            }}
          />
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="p-4 border-t border-base-300 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-base-content/60">Total</span>
            <span className="font-bold">{formatPrice(total)}</span>
          </div>
          <button
            onClick={handleWhatsApp}
            className="btn btn-success w-full gap-2 text-white"
          >
            <MessageCircle className="w-4 h-4" /> Send via WhatsApp
          </button>
          {branding?.callNumber && (
            <a
              href={`tel:${branding.callNumber}`}
              className="btn btn-outline btn-info w-full gap-2 btn-sm"
            >
              <Phone className="w-3.5 h-3.5" /> Call Reception
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
