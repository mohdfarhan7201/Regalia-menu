"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Clock } from "lucide-react";
import type { ILocation } from "@/types";

interface TableSelectorProps {
  onSelectTable: (table: ILocation) => void;
}

async function fetchLocations(): Promise<ILocation[]> {
  const res = await fetch("/api/locations", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export default function TableSelector({ onSelectTable }: TableSelectorProps) {
  const { data: locations = [], isLoading } = useQuery<ILocation[]>({
    queryKey: ["captain-locations"],
    queryFn: fetchLocations,
    refetchInterval: 5000,
  });

  const [view, setView] = useState<"table" | "room">("table");

  const tables = locations.filter((l) => l.type === "table");
  const rooms = locations.filter((l) => l.type === "room");
  const list = view === "table" ? tables : rooms;

  const free = list.filter((t) => !t.isOccupied);
  const occupied = list.filter((t) => t.isOccupied);
  const noun = view === "table" ? "Tables" : "Rooms";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-warning" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tables / Rooms toggle */}
      <div className="flex gap-2 bg-base-200 rounded-2xl p-1 w-fit mx-auto">
        <button
          onClick={() => setView("table")}
          className={`btn btn-sm ${view === "table" ? "btn-warning" : "btn-ghost"}`}
        >
          🍽️ Tables ({tables.length})
        </button>
        <button
          onClick={() => setView("room")}
          className={`btn btn-sm ${view === "room" ? "btn-warning" : "btn-ghost"}`}
        >
          🛏️ Rooms ({rooms.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat bg-base-200 rounded-2xl border border-base-300 p-4">
          <div className="stat-figure text-success">
            <Users className="w-6 h-6" />
          </div>
          <div className="stat-title text-xs">Free {noun}</div>
          <div className="stat-value text-success text-3xl">{free.length}</div>
        </div>
        <div className="stat bg-base-200 rounded-2xl border border-base-300 p-4">
          <div className="stat-figure text-error">
            <Clock className="w-6 h-6" />
          </div>
          <div className="stat-title text-xs">Occupied</div>
          <div className="stat-value text-error text-3xl">
            {occupied.length}
          </div>
        </div>
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <p className="text-lg">
            No active {noun.toLowerCase()} found.
          </p>
          <p className="text-sm mt-1">
            Ask admin to add {noun.toLowerCase()} locations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {list.map((table, i) => (
            <motion.button
              key={table._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectTable(table)}
              className={`
                relative flex flex-col items-center justify-center gap-1
                rounded-2xl p-4 border-2 transition-colors text-center
                ${
                  table.isOccupied
                    ? "bg-error/10 border-error/40 text-error hover:bg-error/20"
                    : "bg-success/10 border-success/40 text-success hover:bg-success/20"
                }
              `}
            >
              {/* Status dot */}
              <span
                className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  table.isOccupied ? "bg-error animate-pulse" : "bg-success"
                }`}
              />

              <span className="text-2xl font-bold font-mono-jetbrains">
                {table.code}
              </span>
              <span className="text-xs font-medium truncate w-full text-center opacity-80">
                {table.isOccupied ? "Occupied" : "Free"}
              </span>
              {table.capacity && (
                <span className="text-xs opacity-60">
                  {table.capacity} seats
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <p className="text-xs text-base-content/30 text-center">
        Auto-refreshes every 5 seconds · {list.length} total{" "}
        {noun.toLowerCase()}
      </p>
    </div>
  );
}
