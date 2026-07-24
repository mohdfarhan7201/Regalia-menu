import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slugify a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format price in INR */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Chargeable amount for an order line. No-Charge (complimentary) items are made
// and served but billed ₹0; the original price is kept on the item for cost
// reporting. Cancelled items are excluded by the caller before summing.
export function lineTotal(i: {
  price: number;
  quantity: number;
  isNoCharge?: boolean;
}): number {
  return i.isNoCharge ? 0 : i.price * i.quantity;
}

/** Format date for display */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/** Format time only */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

/** Get elapsed minutes since a date */
export function elapsedMinutes(from: string | Date): number {
  return Math.floor((Date.now() - new Date(from).getTime()) / 60000);
}

/** Format elapsed time as mm:ss string */
export function formatElapsed(from: string | Date): string {
  const totalSeconds = Math.floor(
    (Date.now() - new Date(from).getTime()) / 1000,
  );
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Get TTL status for KDS coloring */
export function getTtlStatus(
  orderedAt: string | Date,
  ttlMinutes: number,
): "ok" | "warning" | "overdue" {
  const elapsed = elapsedMinutes(orderedAt);
  const ratio = elapsed / ttlMinutes;
  if (ratio >= 1) return "overdue";
  if (ratio >= 0.5) return "warning";
  return "ok";
}

/** Split array into chunks */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** Generate daily KOT number sequence string */
export function formatKotNumber(seq: number): string {
  return `KOT-${String(seq).padStart(3, "0")}`;
}

/** Encode WhatsApp message URL */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

/** Build WhatsApp order message for room service */
export function buildRoomOrderMessage(
  restaurantName: string,
  roomLabel: string,
  items: {
    name: string;
    quantity: number;
    price: number;
    discountPrice?: number;
  }[],
  total: number,
  specialInstructions?: string,
): string {
  const itemLines = items
    .map((i) => {
      const effectivePrice = (i.discountPrice ?? i.price) * i.quantity;
      const original = i.price * i.quantity;
      const wasStr =
        i.discountPrice && i.discountPrice < i.price
          ? ` _(was ₹${original})_`
          : "";
      return `• ${i.name} ×${i.quantity} — ₹${effectivePrice}${wasStr}`;
    })
    .join("\n");

  const instructionLine = specialInstructions
    ? `\n📝 *Special Instructions:* ${specialInstructions}`
    : "";

  return `🛏️ *Room Service Order*
🏨 *${restaurantName}*

🚪 *${roomLabel}*

📋 *Items:*
${itemLines}

💰 *Total: ₹${total}*${instructionLine}

_Sent via Regalia Digital Menu_`;
}

/** Detect if User-Agent is mobile */
export function isMobileUserAgent(ua: string): boolean {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    ua.toLowerCase(),
  );
}
