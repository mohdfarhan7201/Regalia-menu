import type { CSSProperties } from "react";
import type { IBranding } from "@/types";

/** Fallback accent when branding has no colour set (legacy gold). */
export const DEFAULT_MENU_ACCENT = "#C9A96E";

/** Pick readable on-accent text (black/white) via WCAG relative luminance. */
function onAccentColor(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return "#0f0f0f";
  const toLin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = toLin(parseInt(full.slice(0, 2), 16));
  const g = toLin(parseInt(full.slice(2, 4), 16));
  const b = toLin(parseInt(full.slice(4, 6), 16));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.45 ? "#0f0f0f" : "#ffffff";
}

/** `color-mix` alpha helper — works for any CSS colour, unlike 8-digit hex. */
const mix = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/**
 * Resolve the menu accent from branding.
 * Priority: accentColor → primaryColor → legacy gold default.
 */
export function resolveMenuAccent(branding: IBranding | null): string {
  return branding?.accentColor || branding?.primaryColor || DEFAULT_MENU_ACCENT;
}

/**
 * Build the menu CSS custom properties from branding. Spread onto the menu
 * root element so the whole subtree (list, cards, carts, overlays) inherits a
 * single source of truth. Also overrides DaisyUI/shadcn `--color-primary` /
 * `--primary` so component utilities (`text-primary`, `bg-primary`) brand too.
 */
export function menuThemeVars(
  branding: IBranding | null,
): CSSProperties & Record<string, string> {
  const accent = resolveMenuAccent(branding);
  const onAccent = onAccentColor(accent);

  return {
    // ── Brand accent ────────────────────────────────────────────────
    "--menu-accent": accent,
    "--menu-on-accent": onAccent,
    "--menu-accent-soft": mix(accent, 12),
    "--menu-accent-border": mix(accent, 28),
    "--menu-accent-dim": mix(accent, 65),
    "--menu-accent-glow": mix(accent, 35),

    // ── Dark surfaces (theme, not brand) ────────────────────────────
    // Layered: a soft accent glow band pinned to the very top (hero
    // ambiance behind the header) over a warm vertical base that settles
    // into near-black — kills the flat-black look while raising contrast.
    "--menu-bg": `radial-gradient(140% 380px at 50% 0%, ${mix(accent, 9)} 0%, transparent 100%), linear-gradient(180deg, #15110b 0%, #100f0d 26%, #0b0a09 100%)`,
    "--menu-bg-solid": "#0f0f0f",
    "--menu-bg-deep": "#0a0a0a",
    // Tablet flipbook leaf — warm "dark paper" with a faint accent near the
    // spine corner. Softer than --menu-bg so it doesn't repeat distractingly
    // across every page of the book.
    "--menu-page-bg": `radial-gradient(90% 60% at 0% 0%, ${mix(accent, 6)} 0%, transparent 55%), linear-gradient(165deg, #161109 0%, #100f0d 42%, #0c0b09 100%)`,
    "--menu-surface": "rgba(255,255,255,0.05)",
    "--menu-surface-2": "rgba(255,255,255,0.08)",
    "--menu-border": "rgba(255,255,255,0.09)",

    // ── Text (contrast-tuned for #0f0f0f → all ≥4.5:1) ──────────────
    "--menu-text": "#f5f5f5",
    "--menu-text-muted": "rgba(255,255,255,0.62)",
    "--menu-text-faint": "rgba(255,255,255,0.45)",

    // ── Override DaisyUI + shadcn primary so components brand too ────
    "--color-primary": accent,
    "--color-primary-content": onAccent,
    "--primary": accent,
    "--primary-foreground": onAccent,
  };
}
