"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ShoppingCart, Search, X, Star, BellRing, Play } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { menuThemeVars } from "@/lib/menu-theme";
import CartDrawer from "./CartDrawer";
import FloatingButtons from "./FloatingButtons";
import FeaturedRail from "./FeaturedRail";
import ItemDetailSheet from "./ItemDetailSheet";
import FoodPlaceholder from "@/components/menu/FoodPlaceholder";
import LottiePlayer from "@/components/LottiePlayer";
import { FssaiDot } from "@/components/ui/FssaiDot";
import type {
  IBranding,
  ILocation,
  CategoryWithItems,
  IItem,
  MenuMode,
} from "@/types";

interface Props {
  branding: IBranding | null;
  categoriesWithItems: CategoryWithItems[];
  location: ILocation | null;
  mode: MenuMode;
}

/** Shared visible focus ring for keyboard users (a11y). */
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]";

function VegIndicator({ isVeg }: { isVeg: boolean }) {
  return <FssaiDot isVeg={isVeg} size="sm" />;
}

function AddControl({
  qty,
  onAdd,
  itemId,
  name,
  updateQuantity,
  removeItem,
}: {
  qty: number;
  onAdd: () => void;
  itemId: string;
  name: string;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
}) {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        aria-label={`Add ${name} to order`}
        className={`w-full min-h-11 rounded-lg text-xs font-bold tracking-wide cursor-pointer touch-manipulation transition-colors active:opacity-80 ${FOCUS_RING}`}
        style={{
          border: "1.5px solid var(--menu-accent)",
          color: "var(--menu-accent)",
          background: "transparent",
        }}
      >
        ADD +
      </button>
    );
  }
  return (
    <div
      className="flex items-center justify-between rounded-lg overflow-hidden"
      style={{ background: "var(--menu-accent)" }}
    >
      <button
        onClick={() =>
          qty === 1 ? removeItem(itemId) : updateQuantity(itemId, qty - 1)
        }
        aria-label={`Decrease ${name} quantity`}
        className={`min-w-11 h-11 flex items-center justify-center font-bold text-lg cursor-pointer touch-manipulation active:opacity-70 ${FOCUS_RING}`}
        style={{ color: "var(--menu-on-accent)" }}
      >
        −
      </button>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: "var(--menu-on-accent)" }}
      >
        {qty}
      </span>
      <button
        onClick={() => updateQuantity(itemId, qty + 1)}
        aria-label={`Increase ${name} quantity`}
        className={`min-w-11 h-11 flex items-center justify-center font-bold text-lg cursor-pointer touch-manipulation active:opacity-70 ${FOCUS_RING}`}
        style={{ color: "var(--menu-on-accent)" }}
      >
        +
      </button>
    </div>
  );
}

function ItemCard({
  item,
  isRoom,
  onAdd,
  onOpen,
  logoUrl,
}: {
  item: IItem;
  isRoom: boolean;
  onAdd: () => void;
  onOpen: () => void;
  logoUrl?: string | null;
}) {
  const { items, updateQuantity, removeItem } = useCartStore();
  const qty = items.find((i) => i.itemId === item._id)?.quantity ?? 0;
  const isVeg =
    item.isVegetarian ?? (item as IItem & { isVeg?: boolean }).isVeg ?? true;
  const hasDetail = !!(item.description || item.imageUrl || item.videoUrl);
  return (
    <div
      className="flex gap-3 px-4 py-4"
      style={{ borderBottom: "1px solid var(--menu-border)" }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <button
          onClick={hasDetail ? onOpen : undefined}
          aria-label={hasDetail ? `View ${item.name} details` : undefined}
          className={`text-left flex flex-col gap-1.5 ${hasDetail ? "cursor-pointer" : "cursor-default"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70 rounded-md`}
        >
          <VegIndicator isVeg={isVeg} />
          <p
            className="font-semibold text-sm leading-snug"
            style={{ color: "var(--menu-text)" }}
          >
            {item.name}
            {item.isFeatured && (
              <Star
                className="inline w-3 h-3 ml-1.5 mb-0.5"
                style={{ color: "var(--menu-accent)" }}
                fill="currentColor"
                aria-label="Chef's special"
              />
            )}
          </p>
          {item.description && (
            <p
              className="text-xs leading-relaxed line-clamp-2"
              style={{ color: "var(--menu-text-muted)" }}
            >
              {item.description}
            </p>
          )}
          <div className="flex items-baseline gap-1.5 mt-auto pt-1">
            {item.discountPrice ? (
              <>
                <span
                  className="font-bold text-sm"
                  style={{ color: "var(--menu-accent)" }}
                >
                  {formatPrice(item.discountPrice)}
                </span>
                <span
                  className="text-xs line-through"
                  style={{ color: "var(--menu-text-faint)" }}
                >
                  {formatPrice(item.price)}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: "rgba(34,197,94,0.18)", color: "#4ade80" }}
                >
                  {Math.round(
                    ((item.price - item.discountPrice) / item.price) * 100,
                  )}
                  % off
                </span>
              </>
            ) : (
              <span
                className="font-bold text-sm"
                style={{ color: "var(--menu-text)" }}
              >
                {formatPrice(item.price)}
              </span>
            )}
          </div>
        </button>
      </div>
      <div className="shrink-0 flex flex-col items-center gap-2">
        <button
          onClick={hasDetail ? onOpen : undefined}
          disabled={!hasDetail}
          aria-label={hasDetail ? `View ${item.name} details` : undefined}
          className={`relative rounded-xl overflow-hidden ${hasDetail ? "cursor-pointer" : "cursor-default"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70`}
          style={{
            width: 96,
            height: 96,
            background: "var(--menu-surface)",
          }}
        >
          {item.imageUrl ? (
            <>
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="96px"
              />
              {item.videoUrl && (
                <span
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                  aria-hidden="true"
                >
                  <Play className="w-3 h-3 text-white" fill="currentColor" />
                </span>
              )}
            </>
          ) : (
            <FoodPlaceholder logoUrl={logoUrl} />
          )}
        </button>
        {isRoom && (
          <div className="w-24">
            <AddControl
              qty={qty}
              onAdd={onAdd}
              itemId={item._id}
              name={item.name}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultItem({
  item,
  isRoom,
  onAdd,
  onOpen,
  logoUrl,
}: {
  item: IItem;
  isRoom: boolean;
  onAdd: () => void;
  onOpen: () => void;
  logoUrl?: string | null;
}) {
  const { items, updateQuantity, removeItem } = useCartStore();
  const qty = items.find((i) => i.itemId === item._id)?.quantity ?? 0;
  const isVeg =
    item.isVegetarian ?? (item as IItem & { isVeg?: boolean }).isVeg ?? true;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: "var(--menu-surface)",
        border: "1px solid var(--menu-border)",
      }}
    >
      <button
        onClick={onOpen}
        aria-label={`View ${item.name} details`}
        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70"
      >
        <div
          className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden"
          style={{ background: "var(--menu-surface-2)" }}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <FoodPlaceholder logoUrl={logoUrl} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <VegIndicator isVeg={isVeg} />
            <p
              className="font-medium text-sm truncate"
              style={{ color: "var(--menu-text)" }}
            >
              {item.name}
            </p>
          </div>
          <p
            className="text-xs font-bold"
            style={{ color: "var(--menu-accent)" }}
          >
            {formatPrice(item.discountPrice ?? item.price)}
          </p>
        </div>
      </button>
      {isRoom && (
        <div className="w-24 shrink-0">
          <AddControl
            qty={qty}
            onAdd={onAdd}
            itemId={item._id}
            name={item.name}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
          />
        </div>
      )}
    </div>
  );
}

export default function MobileMenuShell({
  branding,
  categoriesWithItems,
  location,
  mode,
}: Props) {
  const isRoom = mode === "room";
  const reduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState(
    categoriesWithItems[0]?._id ?? "",
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<IItem | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const { addItem, totalItems, setLocation } = useCartStore();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location) setLocation(location.code, location.label);
  }, [location, setLocation]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id.replace("cat-", "");
            setActiveCategory(id);
            tabsRef.current
              ?.querySelector(`[data-cat="${id}"]`)
              ?.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
              });
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach(
      (el) => el && observer.observe(el),
    );
    return () => observer.disconnect();
  }, [categoriesWithItems]);

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const allItems = categoriesWithItems.flatMap((c) => c.items);
  const featuredItems = allItems.filter((i) => i.isFeatured && i.isAvailable);
  const filteredItems = searchQuery
    ? allItems.filter(
        (i) =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : null;

  const cartCount = totalItems();
  const restaurantName = branding?.restaurantName ?? "Regalia Resort";

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{
        ...menuThemeVars(branding),
        background: "var(--menu-bg)",
        color: "var(--menu-text)",
      }}
    >
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(15,15,15,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--menu-border)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {branding?.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={`${restaurantName} logo`}
                width={36}
                height={36}
                className="rounded-lg object-cover shrink-0"
                style={{ border: "1px solid var(--menu-border)" }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold"
                style={{
                  background: "var(--menu-accent)",
                  color: "var(--menu-on-accent)",
                }}
              >
                {restaurantName[0]}
              </div>
            )}
            <div className="min-w-0">
              <p
                className="font-bold text-sm truncate"
                style={{ letterSpacing: "0.01em" }}
              >
                {restaurantName}
              </p>
              {location && (
                <p className="text-xs" style={{ color: "var(--menu-text-muted)" }}>
                  {location.type === "room" ? "Rm" : "Tbl"} {location.label}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search the menu"
              className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer touch-manipulation active:opacity-70 ${FOCUS_RING}`}
              style={{ background: "var(--menu-surface-2)" }}
            >
              <Search
                className="w-4 h-4"
                style={{ color: "var(--menu-text)" }}
              />
            </button>
            {isRoom && (
              <button
                onClick={() => setCartOpen(true)}
                aria-label={`Open order${cartCount > 0 ? `, ${cartCount} item${cartCount > 1 ? "s" : ""}` : ""}`}
                className={`relative w-11 h-11 rounded-full flex items-center justify-center cursor-pointer touch-manipulation active:opacity-70 ${FOCUS_RING}`}
                style={{ background: "var(--menu-surface-2)" }}
              >
                <ShoppingCart
                  className="w-4 h-4"
                  style={{ color: "var(--menu-text)" }}
                />
                {cartCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      background: "var(--menu-accent)",
                      color: "var(--menu-on-accent)",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        {mode === "table" && (
          <div
            className="mx-4 mb-2 px-3 py-2 rounded-lg text-xs text-center space-y-0.5"
            style={{
              background: "var(--menu-accent-soft)",
              color: "var(--menu-accent)",
              border: "1px solid var(--menu-accent-border)",
            }}
          >
            <p>Your captain will take your order</p>
            <p
              className="inline-flex items-center justify-center gap-1"
              style={{ color: "var(--menu-accent-dim)" }}
            >
              Need help? Tap the
              <BellRing
                className="inline w-3.5 h-3.5"
                style={{ color: "var(--menu-accent)" }}
                aria-hidden="true"
              />
              button to call your captain
            </p>
          </div>
        )}
        {/* Scroll-spy category jump links — a navigation list, not a tab widget
            (all sections are visible at once), so use nav + aria-current. */}
        <nav
          ref={tabsRef}
          aria-label="Menu categories"
          className="flex gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-none"
        >
          {categoriesWithItems.map((cat) => {
            const active = activeCategory === cat._id;
            return (
              <button
                key={cat._id}
                data-cat={cat._id}
                aria-current={active ? "true" : undefined}
                onClick={() => scrollToCategory(cat._id)}
                className={`shrink-0 px-3.5 min-h-9 rounded-full text-xs font-medium transition-all cursor-pointer touch-manipulation ${FOCUS_RING}`}
                style={
                  active
                    ? {
                        background: "var(--menu-accent)",
                        color: "var(--menu-on-accent)",
                        fontWeight: 600,
                      }
                    : {
                        background: "var(--menu-surface-2)",
                        color: "var(--menu-text-muted)",
                      }
                }
              >
                {cat.iconEmoji && <span className="mr-1">{cat.iconEmoji}</span>}
                {cat.name}
              </button>
            );
          })}
        </nav>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search menu"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchOpen(false);
                setSearchQuery("");
              }
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{
              background: "rgba(10,10,10,0.98)",
              backdropFilter: "blur(16px)",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <div className="flex items-center gap-2 px-4 pt-5 pb-3">
              <label htmlFor="menu-search" className="sr-only">
                Search dishes
              </label>
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: "var(--menu-surface-2)",
                  border: "1px solid var(--menu-border)",
                }}
              >
                <Search
                  className="w-4 h-4 shrink-0"
                  style={{ color: "var(--menu-text-faint)" }}
                />
                <input
                  id="menu-search"
                  autoFocus
                  className="bg-transparent flex-1 outline-none text-base"
                  style={{ color: "var(--menu-text)" }}
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className={`w-8 h-8 -mr-1 flex items-center justify-center rounded-full cursor-pointer ${FOCUS_RING}`}
                  >
                    <X
                      className="w-4 h-4"
                      style={{ color: "var(--menu-text-faint)" }}
                    />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className={`text-sm font-medium px-2 min-h-11 cursor-pointer ${FOCUS_RING}`}
                style={{ color: "var(--menu-accent)" }}
              >
                Cancel
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
              {!searchQuery && (
                <p
                  className="text-xs text-center pt-12"
                  style={{ color: "var(--menu-text-faint)" }}
                >
                  Type to search the menu
                </p>
              )}
              {filteredItems?.map((item) => (
                <SearchResultItem
                  key={item._id}
                  item={item}
                  isRoom={isRoom}
                  logoUrl={branding?.logoUrl}
                  onOpen={() => {
                    setSearchOpen(false);
                    setDetailItem(item);
                  }}
                  onAdd={() =>
                    addItem({
                      itemId: item._id,
                      name: item.name,
                      price: item.price,
                      discountPrice: item.discountPrice,
                      quantity: 1,
                      imageUrl: item.imageUrl,
                      isVegetarian: item.isVegetarian,
                    })
                  }
                />
              ))}
              {filteredItems?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <LottiePlayer variant="no-results" size={100} />
                  <p
                    className="text-sm"
                    style={{ color: "var(--menu-text-muted)" }}
                  >
                    No results for &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 pb-36">
        {categoriesWithItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 px-6 text-center">
            <LottiePlayer variant="empty-cart" size={140} />
            <p className="text-sm" style={{ color: "var(--menu-text-muted)" }}>
              Menu is being prepared.
              <br />
              Please check back soon.
            </p>
          </div>
        ) : (
          <>
            <FeaturedRail
              items={featuredItems}
              onSelect={setDetailItem}
              logoUrl={branding?.logoUrl}
            />
            {categoriesWithItems.map((cat) => (
            <section
              key={cat._id}
              id={`cat-${cat._id}`}
              ref={(el) => {
                sectionRefs.current[cat._id] = el as HTMLDivElement | null;
              }}
            >
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{
                  background: "rgba(20,20,20,0.95)",
                  backdropFilter: "blur(8px)",
                  borderBottom: "1px solid var(--menu-border)",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                {cat.iconEmoji && (
                  <span className="text-lg">{cat.iconEmoji}</span>
                )}
                <h2
                  className="text-base font-bold"
                  style={{ letterSpacing: "0.01em" }}
                >
                  {cat.name}
                </h2>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full tabular-nums"
                  style={{
                    background: "var(--menu-surface-2)",
                    color: "var(--menu-text-muted)",
                  }}
                >
                  {cat.items.filter((i) => i.isAvailable).length}
                </span>
              </div>
              {cat.items
                .filter((i) => i.isAvailable)
                .map((item, idx) => (
                  <motion.div
                    key={item._id}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx, 8) * 0.03 }}
                  >
                    <ItemCard
                      item={item}
                      isRoom={isRoom}
                      logoUrl={branding?.logoUrl}
                      onOpen={() => setDetailItem(item)}
                      onAdd={() =>
                        addItem({
                          itemId: item._id,
                          name: item.name,
                          price: item.price,
                          discountPrice: item.discountPrice,
                          quantity: 1,
                          imageUrl: item.imageUrl,
                          isVegetarian: item.isVegetarian,
                        })
                      }
                    />
                  </motion.div>
                ))}
            </section>
            ))}
          </>
        )}
      </main>

      {isRoom && cartCount > 0 && (
        <motion.div
          initial={reduceMotion ? false : { y: 80 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-2"
          style={{
            background: "linear-gradient(to top, #0f0f0f 60%, transparent)",
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`View order, ${cartCount} item${cartCount > 1 ? "s" : ""}`}
            className={`w-full min-h-12 rounded-2xl flex items-center justify-between px-5 font-semibold text-sm cursor-pointer touch-manipulation active:opacity-90 ${FOCUS_RING}`}
            style={{
              background: "var(--menu-accent)",
              color: "var(--menu-on-accent)",
            }}
          >
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              {cartCount}
            </span>
            <span>View Cart</span>
            <ShoppingCart className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {isRoom && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          branding={branding}
          location={location}
        />
      )}
      <ItemDetailSheet
        item={detailItem}
        isRoom={isRoom}
        onClose={() => setDetailItem(null)}
        logoUrl={branding?.logoUrl}
      />
      <FloatingButtons
        branding={branding}
        mode={mode}
        locationCode={location?.code ?? null}
        showScrollTop={showScrollTop}
      />
    </div>
  );
}
