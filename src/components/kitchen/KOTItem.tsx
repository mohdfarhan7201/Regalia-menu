"use client";

import { useState } from "react";
import { getTtlStatus } from "@/lib/utils";
import type { IOrderItem, ItemStatus } from "@/types";
import { FssaiDot } from "@/components/ui/FssaiDot";
import { pillCls } from "@/components/ui/Pill";
import type { PillVariant } from "@/components/ui/Pill";

interface KOTItemProps {
  item: IOrderItem;
  orderId: string;
  orderCreatedAt: Date | string;
  onStatusChange: (
    orderId: string,
    itemId: string,
    status: ItemStatus,
  ) => Promise<void>;
}

const VEG_DOT = <FssaiDot isVeg={true} size="sm" />;
const NON_VEG_DOT = <FssaiDot isVeg={false} size="sm" />;

const STATUS_PILL: Record<ItemStatus, PillVariant> = {
  pending: "error",
  preparing: "warning",
  ready: "success",
  delivered: "ghost",
  cancelled: "outline",
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function KOTItem({
  item,
  orderId,
  orderCreatedAt,
  onStatusChange,
}: KOTItemProps) {
  const [loading, setLoading] = useState(false);
  const ttl = getTtlStatus(orderCreatedAt, item.preparationTtlMinutes ?? 15);
  const isDelivered = item.itemStatus === "delivered";

  const handleClick = async (next: ItemStatus) => {
    setLoading(true);
    try {
      await onStatusChange(orderId, item._id, next);
    } finally {
      setLoading(false);
    }
  };

  const timerBg =
    ttl === "overdue"
      ? "bg-error/5"
      : ttl === "warning"
        ? "bg-amber-500/5"
        : "";

  const isCancelled = item.itemStatus === "cancelled";

  return (
    <div
      className={`px-4 py-2.5 flex items-start gap-3 ${timerBg} ${isDelivered || isCancelled ? "opacity-50" : ""}`}
    >
      {/* Veg/Non-veg indicator */}
      <div className="pt-0.5">{item.isVegetarian ? VEG_DOT : NON_VEG_DOT}</div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-sm leading-snug ${isCancelled ? "line-through text-base-content/40" : ""}`}
          >
            {item.name}
          </span>
          <span className={pillCls("neutral", "font-bold tabular-nums")}>
            ×{item.quantity}
          </span>
          <span className={pillCls(STATUS_PILL[item.itemStatus])}>
            {STATUS_LABEL[item.itemStatus]}
          </span>
        </div>
        {item.notes && (
          <p className="text-xs text-base-content/50 mt-0.5 italic">
            📝 {item.notes}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {!isDelivered && !isCancelled && (
        <div className="flex gap-1 shrink-0">
          {item.itemStatus === "pending" && (
            <button
              disabled={loading}
              onClick={() => handleClick("preparing")}
              className="btn btn-xs btn-warning gap-1"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "🔥"
              )}
              Prep
            </button>
          )}
          {(item.itemStatus === "pending" ||
            item.itemStatus === "preparing") && (
            <button
              disabled={loading}
              onClick={() => handleClick("ready")}
              className="btn btn-xs btn-success gap-1"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "✓"
              )}
              Ready
            </button>
          )}
          {item.itemStatus === "ready" && (
            <button
              disabled={loading}
              onClick={() => handleClick("delivered")}
              className="btn btn-xs btn-ghost text-base-content/50 gap-1"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "✈"
              )}
              Sent
            </button>
          )}
          {/* Kitchen can cancel any non-delivered item */}
          {(item.itemStatus === "pending" ||
            item.itemStatus === "preparing") && (
            <button
              disabled={loading}
              onClick={() => handleClick("cancelled")}
              className="btn btn-xs btn-ghost text-error border border-error/30 gap-1"
              title="Cancel this item"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "✕"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
