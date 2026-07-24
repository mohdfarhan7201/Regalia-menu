"use client";

import { useRef, useState, useEffect, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, RotateCcw, Sparkles, BellRing } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { menuThemeVars } from "@/lib/menu-theme";
import CoverPage from "./CoverPage";
import CoverLeftPage from "./CoverLeftPage";
import CategoryIndexPage from "./CategoryIndexPage";
import MenuPage from "./MenuPage";
import BackCoverPage from "./BackCoverPage";
import FlipControls from "./FlipControls";
import TabletCartPanel from "./TabletCartPanel";
import TabletFloatingButtons from "./TabletFloatingButtons";
import TabletOnboardingWizard from "./TabletOnboardingWizard";
import type { IBranding, ILocation, MenuMode } from "@/types";
import type { FlipbookPageData } from "@/app/menu/page";

interface Props {
  branding: IBranding | null;
  pages: FlipbookPageData[];
  location: ILocation | null;
  mode: MenuMode;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

// react-pageflip requires forwardRef pages
const FlipPage = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className = "" }, ref) => (
  <div
    ref={ref}
    className={`overflow-hidden ${className}`}
    style={{
      background: "#0f0f0f",
      // Subtle page-edge gradient on the right side for depth
      backgroundImage:
        "linear-gradient(to right, #141414 0%, #0f0f0f 4%, #0f0f0f 96%, #0a0a0a 100%)",
      boxShadow:
        "inset -4px 0 12px rgba(0,0,0,0.6), inset 4px 0 8px rgba(0,0,0,0.4)",
    }}
  >
    {children}
  </div>
));
FlipPage.displayName = "FlipPage";

export default function TabletMenuShell({
  branding,
  pages,
  location,
  mode,
}: Props) {
  const isRoom = mode === "room";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 550, height: 780 });
  const [flipbookReady, setFlipbookReady] = useState(false);
  const { totalItems, setLocation } = useCartStore();

  useEffect(() => {
    if (location) setLocation(location.code, location.label);
  }, [location, setLocation]);

  useEffect(() => {
    const update = () => {
      // Each page = exactly half screen width; height = full screen height
      const w = Math.floor(window.innerWidth / 2);
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const onFlip = (e: { data: number }) => {
    setCurrentPage(e.data);
    if (!flipbookReady) setFlipbookReady(true);
  };
  const goPrev = () => flipBookRef.current?.pageFlip().flipPrev();
  const goNext = () => flipBookRef.current?.pageFlip().flipNext();
  const goToPage = (n: number) => flipBookRef.current?.pageFlip().turnToPage(n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cartCount = totalItems();

  // Accent-derived spine colours (brand-aware via --menu-accent)
  const mix = (pct: number) =>
    `color-mix(in srgb, var(--menu-accent) ${pct}%, transparent)`;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        ...menuThemeVars(branding),
        background:
          "radial-gradient(120% 60% at 50% 0%, #14110d 0%, #080808 60%)",
        overscrollBehavior: "none",
        touchAction: "pan-x",
      }}
      data-theme="dark"
    >
      {/* ── Flipbook loading skeleton ─────────────────────────────── */}
      {!flipbookReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#080808]">
          <div className="flex gap-4 w-full h-full p-4 animate-pulse">
            <div className="flex-1 rounded-2xl bg-white/5" />
            <div className="flex-1 rounded-2xl bg-white/5" />
          </div>
          <div className="absolute flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: "2px solid var(--menu-accent-border)",
                borderTopColor: "var(--menu-accent)",
              }}
            />
            <p
              className="text-sm font-medium tracking-widest uppercase"
              style={{ color: "var(--menu-accent-dim)" }}
            >
              Loading Menu…
            </p>
          </div>
        </div>
      )}

      {/* ── Centre spine — above pages but hidden during flip ────────── */}
      <div
        className="pointer-events-none absolute inset-y-0"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          width: 60,
          zIndex: 3,
          // Hide on cover spread (pages 0-1) and during flip
          opacity: currentPage <= 1 || isFlipping ? 0 : 1,
          transition: "opacity 0.25s ease",
        }}
      >
        {/* Left-side depth shadow (falls onto left page) */}
        <div
          className="absolute inset-y-0"
          style={{
            right: "50%",
            width: 40,
            background: `linear-gradient(to left, rgba(0,0,0,0.55) 0%, ${mix(4)} 40%, transparent 100%)`,
          }}
        />
        {/* Right-side depth shadow (falls onto right page) */}
        <div
          className="absolute inset-y-0"
          style={{
            left: "50%",
            width: 40,
            background: `linear-gradient(to right, rgba(0,0,0,0.55) 0%, ${mix(4)} 40%, transparent 100%)`,
          }}
        />
        {/* Wide accent ambient glow */}
        <div
          className="absolute inset-y-0"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            width: 36,
            background: `radial-gradient(ellipse 18px 80% at 50% 50%, ${mix(22)} 0%, ${mix(6)} 60%, transparent 100%)`,
          }}
        />
        {/* Hard spine line */}
        <div
          className="absolute inset-y-0"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            width: 1.5,
            background: `linear-gradient(to bottom, transparent 0%, ${mix(12)} 6%, ${mix(60)} 25%, ${mix(85)} 50%, ${mix(60)} 75%, ${mix(12)} 94%, transparent 100%)`,
          }}
        />
        {/* Centre diamond */}
        <div
          className="absolute left-1/2"
          style={{
            top: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: 8,
            height: 8,
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--menu-accent) 65%, white), var(--menu-accent))",
            boxShadow: `0 0 12px 4px ${mix(70)}, 0 0 24px 8px ${mix(25)}`,
          }}
        />
        {/* Top ornament */}
        <div
          className="absolute left-1/2"
          style={{
            top: "7%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: 4,
            height: 4,
            background: "var(--menu-accent)",
            boxShadow: `0 0 6px 2px ${mix(50)}`,
          }}
        />
        {/* Bottom ornament */}
        <div
          className="absolute left-1/2"
          style={{
            top: "93%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: 4,
            height: 4,
            background: "var(--menu-accent)",
            boxShadow: `0 0 6px 2px ${mix(50)}`,
          }}
        />
      </div>

      {/* ── Flipbook fills entire screen (z-index above spine) ───────── */}
      <div
        className="absolute inset-0"
        style={{ touchAction: "pan-x", overscrollBehavior: "none", zIndex: 2 }}
      >
        <HTMLFlipBook
          ref={flipBookRef}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={100}
          maxWidth={2000}
          minHeight={100}
          maxHeight={2000}
          drawShadow
          flippingTime={700}
          usePortrait={false}
          startZIndex={0}
          autoSize={false}
          maxShadowOpacity={0.8}
          showCover={false}
          mobileScrollSupport={false}
          onFlip={onFlip}
          onInit={() => setFlipbookReady(true)}
          onChangeState={(e: { data: string }) =>
            setIsFlipping(e.data === "flipping" || e.data === "user_fold")
          }
          className="flipbook-shadow"
          style={{}}
          startPage={0}
          clickEventForward
          useMouseEvents
          swipeDistance={40}
          showPageCorners
          disableFlipByClick={false}
        >
          {pages.map((page, i) => (
            <FlipPage key={i}>
              {page.type === "cover_left" && (
                <CoverLeftPage
                  branding={branding}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              )}
              {page.type === "cover" && (
                <CoverPage
                  branding={branding}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              )}
              {page.type === "index" && (
                <CategoryIndexPage
                  categories={page.categories}
                  onCategoryClick={(catId: string) => {
                    const idx = pages.findIndex(
                      (p) => p.type === "menu" && p.category._id === catId,
                    );
                    if (idx !== -1) goToPage(idx);
                  }}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              )}
              {page.type === "menu" && (
                <MenuPage
                  category={page.category}
                  items={page.items}
                  chunkIndex={page.chunkIndex}
                  totalChunks={page.totalChunks}
                  isRoom={isRoom}
                  width={dimensions.width}
                  height={dimensions.height}
                  logoUrl={branding?.logoUrl}
                />
              )}
              {page.type === "blank" && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/10 text-6xl font-playfair">
                    ✦
                  </span>
                </div>
              )}
              {page.type === "back_cover" && (
                <BackCoverPage
                  branding={branding}
                  location={location}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              )}
            </FlipPage>
          ))}
        </HTMLFlipBook>
      </div>

      {/* ── Top gradient vignette (UI chrome readability) ─────────────── */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-16 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)",
        }}
      />

      {/* ── Bottom gradient vignette ──────────────────────────────────── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
        }}
      />

      {/* ── Table mode instruction banner ────────────────────────────── */}
      {mode === "table" && (
        <div
          className="pointer-events-none absolute top-9 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-[11px] text-center whitespace-nowrap inline-flex items-center gap-1"
          style={{
            background: "rgba(0,0,0,0.5)",
            color: "var(--menu-accent-dim)",
            border: "1px solid var(--menu-accent-border)",
          }}
        >
          Your captain will take your order · Tap
          <BellRing
            className="inline w-3 h-3"
            style={{ color: "var(--menu-accent)" }}
            aria-hidden="true"
          />
          to call
        </div>
      )}

      {/* ── Top-right toolbar ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed right-3 flex items-center gap-2"
        style={{
          zIndex: 9999,
          isolation: "isolate",
          top: "max(0.5rem, env(safe-area-inset-top))",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reload */}
        <motion.button
          whileTap={{ scale: 0.85, rotate: -180 }}
          transition={{ duration: 0.35 }}
          onClick={() => window.location.reload()}
          className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer touch-manipulation ${FOCUS_RING}`}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid var(--menu-border)",
          }}
          title="Reload app"
          aria-label="Reload menu"
        >
          <RotateCcw
            className="w-4 h-4"
            style={{ color: "rgba(255,255,255,0.6)" }}
          />
        </motion.button>

        {/* New User Wizard */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            flipBookRef.current?.pageFlip().turnToPage(0);
            setWizardOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3.5 h-11 rounded-full text-xs font-semibold cursor-pointer touch-manipulation ${FOCUS_RING}`}
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid var(--menu-accent-border)",
            color: "var(--menu-accent)",
          }}
          aria-label="Show how-to-use guide"
        >
          <Sparkles className="w-3.5 h-3.5" /> New User
        </motion.button>

        {/* Cart (room only) */}
        {isRoom && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCartOpen(true)}
            className={`w-11 h-11 rounded-full flex items-center justify-center relative cursor-pointer touch-manipulation ${FOCUS_RING}`}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid var(--menu-border)",
            }}
            aria-label={`Open order${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <ShoppingCart
              className="w-4 h-4"
              style={{ color: "rgba(255,255,255,0.7)" }}
            />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold tabular-nums"
                style={{
                  background: "var(--menu-accent)",
                  color: "var(--menu-on-accent)",
                }}
              >
                {cartCount}
              </span>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* ── Flip Controls (bottom-center overlay) ────────────────────── */}
      <div
        className="fixed left-1/2 -translate-x-1/2"
        style={{
          zIndex: 9999,
          bottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <FlipControls
          currentPage={currentPage}
          totalPages={pages.length}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>

      {/* ── Cart Panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRoom && cartOpen && (
          <TabletCartPanel
            branding={branding}
            location={location}
            onClose={() => setCartOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Floating Buttons ─────────────────────────────────────────── */}
      <TabletFloatingButtons
        branding={branding}
        mode={mode}
        locationCode={location?.code ?? null}
      />

      {/* ── Onboarding Wizard ────────────────────────────────────────── */}
      <TabletOnboardingWizard
        key={String(wizardOpen)}
        forceShow={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}
