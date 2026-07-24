"use client";

import { UtensilsCrossed } from "lucide-react";
import type { CategoryWithItems } from "@/types";

interface Props {
  categories: CategoryWithItems[];
  onCategoryClick: (catId: string) => void;
  width: number;
  height: number;
}

export default function CategoryIndexPage({
  categories,
  onCategoryClick,
  width,
  height,
}: Props) {
  return (
    <div
      className="w-full h-full flex flex-col p-8 overflow-hidden"
      style={{ width, height, background: "var(--menu-page-bg)" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-6 text-center">
        <p className="text-white/55 text-xs tracking-widest uppercase mb-1">
          Contents
        </p>
        <h2 className="font-playfair text-white text-2xl font-bold">
          Our Menu
        </h2>
        <div className="w-12 h-px bg-white/20 mx-auto mt-3" />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden content-start">
        {categories.map((cat, idx) => (
          <button
            key={cat._id}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => {
              e.stopPropagation();
              onCategoryClick(cat._id);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Jump to ${cat.name}, ${cat.items.length} items`}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 transition-colors text-left group cursor-pointer touch-manipulation active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">
              {cat.iconEmoji ? (
                cat.iconEmoji
              ) : (
                <UtensilsCrossed className="w-5 h-5 text-[var(--menu-accent)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate group-active:text-primary transition-colors">
                {cat.name}
              </p>
              <p className="text-white/55 text-xs">{cat.items.length} items</p>
            </div>
            <span className="ml-auto text-white/40 text-xs font-mono tabular-nums">
              {String(idx + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-white/45 text-xs tracking-widest">
          Tap any category to jump to it
        </p>
      </div>
    </div>
  );
}
