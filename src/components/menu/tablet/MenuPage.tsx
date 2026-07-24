"use client";

import Image from "next/image";
import { UtensilsCrossed, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import type { CategoryWithItems, IItem } from "@/types";
import { FssaiDot } from "@/components/ui/FssaiDot";
import FoodPlaceholder from "@/components/menu/FoodPlaceholder";

interface Props {
  category: CategoryWithItems;
  items: IItem[];
  chunkIndex: number;
  totalChunks: number;
  isRoom: boolean;
  width: number;
  height: number;
  logoUrl?: string | null;
}

export default function MenuPage({
  category,
  items,
  chunkIndex,
  totalChunks,
  isRoom,
  width,
  height,
  logoUrl,
}: Props) {
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ width, height, background: "var(--menu-page-bg)" }}
    >
      {/* Category header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {category.iconEmoji ? (
            <span className="text-2xl">{category.iconEmoji}</span>
          ) : (
            <UtensilsCrossed className="w-6 h-6 text-[var(--menu-accent)]" />
          )}
          <div>
            <h2 className="font-playfair text-white text-xl font-bold">
              {category.name}
            </h2>
            {totalChunks > 1 && (
              <p className="text-white/55 text-xs">
                Page {chunkIndex + 1} of {totalChunks}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items grid — 3 columns × 2 rows */}
      <div className="flex-1 p-4 grid grid-cols-3 gap-3 content-start overflow-hidden">
        {items.map((item) => (
          <TabletItemCard
            key={item._id}
            item={item}
            isRoom={isRoom}
            logoUrl={logoUrl}
          />
        ))}
      </div>
    </div>
  );
}

function TabletItemCard({
  item,
  isRoom,
  logoUrl,
}: {
  item: IItem;
  isRoom: boolean;
  logoUrl?: string | null;
}) {
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
  } = useCartStore();
  const cartItem = cartItems.find((i) => i.itemId === item._id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () =>
    addItem({
      itemId: item._id,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      quantity: 1,
      imageUrl: item.imageUrl,
      isVegetarian: item.isVegetarian,
    });

  return (
    <div
      className={`flex flex-col bg-white/5 rounded-xl overflow-hidden border transition-colors active:border-[var(--menu-accent-border)] ${item.isFeatured ? "border-[var(--menu-accent-border)]" : "border-white/10"}`}
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-white/5">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="180px"
          />
        ) : (
          <FoodPlaceholder logoUrl={logoUrl} />
        )}
        {/* Veg/Non-veg indicator — FSSAI style */}
        <div className="absolute top-1.5 left-1.5">
          <FssaiDot isVeg={item.isVegetarian} size="md" />
        </div>
        {item.isFeatured && (
          <span
            className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
            style={{
              background: "var(--menu-accent)",
              color: "var(--menu-on-accent)",
            }}
          >
            <Star className="w-2.5 h-2.5" fill="currentColor" /> Special
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
          {item.name}
        </p>
        <div className="flex items-center gap-1.5 mt-auto">
          {item.discountPrice ? (
            <>
              <span className="text-primary text-sm font-bold">
                {formatPrice(item.discountPrice)}
              </span>
              <span className="text-white/40 text-xs line-through">
                {formatPrice(item.price)}
              </span>
            </>
          ) : (
            <span className="text-white/80 text-sm font-bold">
              {formatPrice(item.price)}
            </span>
          )}
        </div>

        {/* Add/Qty */}
        {isRoom && (
          <div className="mt-1.5">
            {qty === 0 ? (
              <button
                onClick={handleAdd}
                aria-label={`Add ${item.name} to order`}
                className="bg-primary text-primary-content w-full rounded-lg text-xs font-bold h-11 cursor-pointer touch-manipulation active:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70"
              >
                ADD
              </button>
            ) : (
              <div className="flex items-center justify-between bg-primary/20 rounded-lg h-11">
                <button
                  onClick={() =>
                    qty === 1
                      ? removeItem(item._id)
                      : updateQuantity(item._id, qty - 1)
                  }
                  aria-label={`Decrease ${item.name} quantity`}
                  className="text-primary font-bold text-lg leading-none flex-1 h-full flex items-center justify-center cursor-pointer touch-manipulation active:opacity-60"
                >
                  −
                </button>
                <span className="text-primary font-bold text-sm tabular-nums min-w-6 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => updateQuantity(item._id, qty + 1)}
                  aria-label={`Increase ${item.name} quantity`}
                  className="text-primary font-bold text-lg leading-none flex-1 h-full flex items-center justify-center cursor-pointer touch-manipulation active:opacity-60"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
