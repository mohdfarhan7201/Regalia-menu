/**
 * Pill — a clean, consistent badge/tag component.
 * Replaces all DaisyUI `badge badge-*` usage across the app.
 *
 * Usage:
 *   <Pill variant="success">Ready</Pill>
 *   <span className={pillCls("warning")}>Pending</span>  // for motion.span etc.
 */

import { cn } from "@/lib/utils";

export const PILL_VARIANTS = {
  info: "bg-info/15 text-info border-info/30",
  primary: "bg-primary/15 text-primary border-primary/30",
  accent: "bg-accent/15 text-accent border-accent/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  secondary: "bg-secondary/15 text-secondary border-secondary/30",
  success: "bg-success/15 text-success border-success/30",
  error: "bg-error/15 text-error border-error/30",
  ghost: "bg-base-300/50 text-base-content/40 border-base-300",
  neutral: "bg-base-content/10 text-base-content/60 border-base-content/20",
  outline: "bg-transparent text-base-content/50 border-base-content/25",
} as const;

export type PillVariant = keyof typeof PILL_VARIANTS;

const BASE =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border leading-none";

/** Returns the full className string — use this on non-span elements (motion.span, select, etc.) */
export function pillCls(variant: PillVariant = "ghost", extra?: string) {
  return cn(BASE, PILL_VARIANTS[variant], extra);
}

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
}

/** Pill component — drop-in replacement for <span className="badge badge-*"> */
export function Pill({
  variant = "ghost",
  className,
  children,
  ...props
}: PillProps) {
  return (
    <span className={pillCls(variant, className)} {...props}>
      {children}
    </span>
  );
}
