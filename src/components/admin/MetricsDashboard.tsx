"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Users,
  ChefHat,
  CreditCard,
  ExternalLink,
  CalendarRange,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface MetricsData {
  period: { from: string; to: string };
  totals: {
    totalOrders: number;
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    paidOrders: number;
    clearedOrders: number;
  };
  revenueByDay: { date: string; revenue: number; orders: number }[];
  paymentBreakdown: { method: string; count: number; revenue: number }[];
  topItems: {
    name: string;
    count: number;
    revenue: number;
    isVegetarian: boolean;
  }[];
  captainVolume: { captain: string; orders: number; revenue: number }[];
  hourlyHeatmap: { hour: string; count: number }[];
  avgPrepMinutes: number | null;
  avgDeliveryMinutes: number | null;
}

const CHART_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
];
const PAYMENT_COLORS: Record<string, string> = {
  cash: "#22c55e",
  card: "#3b82f6",
  upi: "#a855f7",
  room_charge: "#f97316",
  unknown: "#6b7280",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card bg-base-200 border border-base-300 p-4 flex flex-row items-center gap-4">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-base-content/50 truncate">{label}</p>
        <p className="font-bold text-lg leading-tight">{value}</p>
        {sub && <p className="text-xs text-base-content/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

async function fetchMetrics(from: string, to: string): Promise<MetricsData> {
  const res = await fetch(`/api/orders/metrics?from=${from}&to=${to}`);
  if (!res.ok) throw new Error("Failed to load metrics");
  return res.json();
}

export default function MetricsDashboard() {
  const router = useRouter();
  const [rangeDays, setRangeDays] = useState(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const isCustom = !!(customFrom && customTo && customFrom <= customTo);

  const from = isCustom
    ? customFrom
    : format(subDays(new Date(), rangeDays - 1), "yyyy-MM-dd");
  const to = isCustom ? customTo : format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, isError } = useQuery<MetricsData>({
    queryKey: ["metrics", from, to],
    queryFn: () => fetchMetrics(from, to),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-base-content/70">
          Efficiency Metrics
        </h2>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1.5 flex-wrap justify-end">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => {
                  setRangeDays(r.days);
                  setCustomFrom("");
                  setCustomTo("");
                }}
                className={`btn btn-xs ${!isCustom && rangeDays === r.days ? "btn-primary" : "btn-ghost"}`}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() =>
                setCustomFrom((v) =>
                  v ? "" : format(subDays(new Date(), 6), "yyyy-MM-dd"),
                )
              }
              className={`btn btn-xs gap-1 ${isCustom ? "btn-primary" : "btn-ghost"}`}
            >
              <CalendarRange className="w-3 h-3" />
              Custom
            </button>
          </div>
          {(isCustom || customFrom !== "") && (
            <div className="flex items-center gap-2 text-sm">
              <label className="text-base-content/50 text-xs">From</label>
              <input
                type="date"
                value={customFrom}
                max={customTo || format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input input-xs input-bordered w-36"
              />
              <label className="text-base-content/50 text-xs">To</label>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input input-xs input-bordered w-36"
              />
            </div>
          )}
        </div>
      </div>

      {isError && (
        <div className="alert alert-error text-sm">Failed to load metrics.</div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-base-content/40 text-sm">
          <span className="loading loading-spinner loading-sm" />
          Loading metrics…
        </div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard
              label="Total Orders"
              value={data.totals.totalOrders.toString()}
              icon={ShoppingBag}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              label="Revenue (collected)"
              value={formatPrice(data.totals.totalRevenue)}
              sub={
                data.totals.totalRefunds > 0
                  ? `net ${formatPrice(data.totals.netRevenue)} after refunds`
                  : `${data.totals.paidOrders + data.totals.clearedOrders} collected`
              }
              icon={TrendingUp}
              color="bg-success/10 text-success"
            />
            <StatCard
              label="Avg Prep Time"
              value={
                data.avgPrepMinutes != null ? `${data.avgPrepMinutes} min` : "—"
              }
              sub="per item (ordered → ready)"
              icon={Clock}
              color="bg-warning/10 text-warning"
            />
            <StatCard
              label="Avg Delivery"
              value={
                data.avgDeliveryMinutes != null
                  ? `${data.avgDeliveryMinutes} min`
                  : "—"
              }
              sub="ordered → delivered"
              icon={ChefHat}
              color="bg-info/10 text-info"
            />
            <StatCard
              label="Captains Active"
              value={data.captainVolume.length.toString()}
              icon={Users}
              color="bg-secondary/10 text-secondary"
            />
            <StatCard
              label="Payment Methods"
              value={data.paymentBreakdown.length.toString()}
              icon={CreditCard}
              color="bg-accent/10 text-accent"
            />
          </div>

          {/* Revenue area chart */}
          <div className="card bg-base-200 border border-base-300 p-4">
            <h3 className="text-sm font-semibold mb-4 text-base-content/70">
              Revenue by Day (₹)
            </h3>
            {data.revenueByDay.length === 0 ? (
              <div className="flex items-center justify-center h-50 text-sm text-base-content/30">
                No revenue data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={data.revenueByDay}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `₹${v}`}
                    width={55}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [
                      `₹${Number(val).toFixed(0)}`,
                      "Revenue",
                    ]}
                    labelFormatter={(l) =>
                      format(new Date(l as string), "dd MMM")
                    }
                    contentStyle={{
                      background: "oklch(var(--b2))",
                      border: "1px solid oklch(var(--b3))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top items */}
            <div className="card bg-base-200 border border-base-300 p-4">
              <h3 className="text-sm font-semibold mb-3 text-base-content/70">
                Top Items (qty)
              </h3>
              {data.topItems.length === 0 ? (
                <div className="flex items-center justify-center h-55 text-sm text-base-content/30">
                  No orders yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.topItems.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 9 }}
                      width={90}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [Number(val), "Orders"]}
                      contentStyle={{
                        background: "oklch(var(--b2))",
                        border: "1px solid oklch(var(--b3))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.topItems.slice(0, 8).map((item, i) => (
                        <Cell
                          key={i}
                          fill={item.isVegetarian ? "#22c55e" : "#f97316"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <p className="text-xs text-base-content/30 mt-1">
                🟢 veg 🟠 non-veg
              </p>
            </div>

            {/* Payment breakdown */}
            <div className="card bg-base-200 border border-base-300 p-4">
              <h3 className="text-sm font-semibold mb-3 text-base-content/70">
                Payment Methods
              </h3>
              {data.paymentBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-base-content/30 text-xs">
                  No paid orders yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.paymentBreakdown}
                      dataKey="count"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ method, percent }) =>
                        `${method} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.paymentBreakdown.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            PAYMENT_COLORS[entry.method] ??
                            CHART_COLORS[i % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown, name: unknown) => [
                        Number(val),
                        String(name),
                      ]}
                      contentStyle={{
                        background: "oklch(var(--b2))",
                        border: "1px solid oklch(var(--b3))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Hourly heatmap as bar chart */}
            <div className="card bg-base-200 border border-base-300 p-4">
              <h3 className="text-sm font-semibold mb-3 text-base-content/70">
                Peak Hours
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data.hourlyHeatmap}
                  margin={{ top: 0, right: 5, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 8 }}
                    tickFormatter={(h) => {
                      const n = Number(h);
                      if (n === 0) return "12a";
                      if (n < 12) return `${n}a`;
                      if (n === 12) return "12p";
                      return `${n - 12}p`;
                    }}
                    interval={2}
                  />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip
                    labelFormatter={(h) => {
                      const n = Number(h);
                      const start =
                        n === 0
                          ? "12 AM"
                          : n < 12
                            ? `${n} AM`
                            : n === 12
                              ? "12 PM"
                              : `${n - 12} PM`;
                      const end =
                        n + 1 === 0
                          ? "12 AM"
                          : n + 1 < 12
                            ? `${n + 1} AM`
                            : n + 1 === 12
                              ? "12 PM"
                              : `${n + 1 - 12} PM`;
                      return `${start} – ${end}`;
                    }}
                    formatter={(v: unknown) => [Number(v), "Orders"]}
                    contentStyle={{
                      background: "oklch(var(--b2))",
                      border: "1px solid oklch(var(--b3))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Captain volume table */}
          {data.captainVolume.length > 0 && (
            <div className="card bg-base-200 border border-base-300 p-4">
              <h3 className="text-sm font-semibold mb-3 text-base-content/70">
                Captain Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="table table-sm text-sm">
                  <thead>
                    <tr className="text-xs text-base-content/40 border-b border-base-300">
                      <th>#</th>
                      <th>Captain</th>
                      <th className="text-right">Orders</th>
                      <th className="text-right">Revenue</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.captainVolume.map((c, i) => {
                      const pct =
                        data.totals.totalOrders > 0
                          ? Math.round(
                              (c.orders / data.totals.totalOrders) * 100,
                            )
                          : 0;
                      return (
                        <tr
                          key={c.captain}
                          className="border-b border-base-300/50 hover cursor-pointer group"
                          title={`View orders for ${c.captain}`}
                          onClick={() =>
                            router.push(
                              `/admin/orders?captain=${encodeURIComponent(c.captain)}`,
                            )
                          }
                        >
                          <td className="text-base-content/30">{i + 1}</td>
                          <td className="font-medium">
                            <span className="flex items-center gap-1 group-hover:text-primary">
                              {c.captain}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                            </span>
                          </td>
                          <td className="text-right">{c.orders}</td>
                          <td className="text-right text-success">
                            {formatPrice(c.revenue)}
                          </td>
                          <td className="w-32">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-base-300 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-base-content/40 w-7">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
