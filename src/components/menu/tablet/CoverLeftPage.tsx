"use client";

import type { IBranding } from "@/types";
import { resolveMenuAccent } from "@/lib/menu-theme";

interface Props {
  branding: IBranding | null;
  width: number;
  height: number;
}

export default function CoverLeftPage({ branding, width, height }: Props) {
  const primary = resolveMenuAccent(branding);

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-between"
      style={{
        width,
        height,
        background:
          "linear-gradient(160deg, #0a0a0a 0%, #111008 60%, #0d0a00 100%)",
      }}
    >
      {/* Subtle radial gold glow from centre */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 55%, ${primary}18 0%, transparent 70%)`,
        }}
      />

      {/* Top ornament strip */}
      <div className="relative z-10 flex flex-col items-center pt-10 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-px w-10" style={{ background: `${primary}40` }} />
          <span
            style={{
              color: `${primary}60`,
              fontSize: 9,
              letterSpacing: "0.3em",
            }}
          >
            ✦ ✦ ✦
          </span>
          <div className="h-px w-10" style={{ background: `${primary}40` }} />
        </div>
        <p
          className="text-[9px] tracking-[0.4em] uppercase"
          style={{ color: `${primary}40` }}
        >
          Est. 2024
        </p>
      </div>

      {/* Centre — vertical restaurant name */}
      <div className="relative z-10 flex flex-col items-center gap-6 flex-1 justify-center">
        {/* Vertical rule */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-px h-16"
            style={{
              background: `linear-gradient(to bottom, transparent, ${primary}50)`,
            }}
          />
          <div
            className="w-2.5 h-2.5 rotate-45"
            style={{
              background: primary,
              boxShadow: `0 0 10px 3px ${primary}60`,
            }}
          />
          <div
            className="w-px h-16"
            style={{
              background: `linear-gradient(to top, transparent, ${primary}50)`,
            }}
          />
        </div>

        {/* Rotated name */}
        <div
          className="font-playfair font-bold tracking-widest uppercase select-none"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            fontSize: 13,
            letterSpacing: "0.35em",
            color: `${primary}70`,
          }}
        >
          {branding?.restaurantName ?? "Regalia Resort"}
        </div>

        {/* Vertical rule (bottom) */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-px h-16"
            style={{
              background: `linear-gradient(to bottom, transparent, ${primary}50)`,
            }}
          />
          <div
            className="w-1.5 h-1.5 rotate-45"
            style={{ background: `${primary}60` }}
          />
          <div
            className="w-px h-12"
            style={{
              background: `linear-gradient(to top, transparent, ${primary}30)`,
            }}
          />
        </div>
      </div>

      {/* Bottom — "Dine In Menu" label */}
      <div className="relative z-10 flex flex-col items-center pb-10 gap-3">
        <p
          className="text-[8px] tracking-[0.5em] uppercase"
          style={{ color: `${primary}35` }}
        >
          Dine In Menu
        </p>
        <div className="flex items-center gap-3">
          <div className="h-px w-8" style={{ background: `${primary}30` }} />
          <span style={{ color: `${primary}35`, fontSize: 7 }}>✦</span>
          <div className="h-px w-8" style={{ background: `${primary}30` }} />
        </div>
      </div>

      {/* Right-edge soft shadow (blends into spine) */}
      <div
        className="absolute inset-y-0 right-0 w-8 pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, rgba(0,0,0,0.5))",
        }}
      />
    </div>
  );
}
