"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Search, Filter, UserCog, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ILead, LeadStatus, LeadSource } from "@/types";
import { Pill } from "@/components/ui/Pill";
import type { PillVariant } from "@/components/ui/Pill";

const STATUS_PILL: Record<LeadStatus, PillVariant> = {
  new: "info",
  contacted: "primary",
  interested: "accent",
  proposal_sent: "warning",
  negotiating: "secondary",
  won: "success",
  lost: "error",
  cold: "ghost",
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  walk_in: "Walk-in",
  call: "Call",
  whatsapp: "WhatsApp",
  website: "Website",
  referral: "Referral",
  social: "Social",
  other: "Other",
};

interface StaffOption {
  _id: string;
  name: string;
  role: string;
}

export default function AdminLeadsClient() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "">("");
  const [filterSource, setFilterSource] = useState<LeadSource | "">("");
  const [filterManager, setFilterManager] = useState("");

  const {
    data: leads = [],
    isLoading,
    refetch,
  } = useQuery<ILead[]>({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: staffList = [] } = useQuery<StaffOption[]>({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 120_000,
  });

  const managers = staffList.filter((s) => s.role === "lead_manager");

  const filtered = useMemo(() => {
    let list = [...leads];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.interest.toLowerCase().includes(q),
      );
    }
    if (filterStatus) list = list.filter((l) => l.status === filterStatus);
    if (filterSource) list = list.filter((l) => l.source === filterSource);
    if (filterManager)
      list = list.filter((l) => l.leadManagerId === filterManager);
    return list;
  }, [leads, search, filterStatus, filterSource, filterManager]);

  // Funnel stats
  const funnelStats = useMemo(() => {
    const counts: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      interested: 0,
      proposal_sent: 0,
      negotiating: 0,
      won: 0,
      lost: 0,
      cold: 0,
    };
    leads.forEach((l) => {
      counts[l.status] = (counts[l.status] ?? 0) + 1;
    });
    return counts;
  }, [leads]);

  const handleReassign = async (leadId: string, assignedTo: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead reassigned");
      refetch();
    } catch {
      toast.error("Failed to reassign");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Source",
      "Interest",
      "Budget",
      "Status",
      "Priority",
      "Manager ID",
      "Next Follow-up",
      "Created",
    ];
    const rows = filtered.map((l) => [
      l.name,
      l.phone,
      l.email ?? "",
      SOURCE_LABELS[l.source],
      l.interest,
      l.budget ?? "",
      l.status,
      l.priority,
      l.leadManagerId,
      l.nextFollowUpAt
        ? format(new Date(l.nextFollowUpAt), "dd/MM/yyyy HH:mm")
        : "",
      format(new Date(l.createdAt), "dd/MM/yyyy"),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const overdueCount = leads.filter(
    (l) =>
      l.nextFollowUpAt &&
      new Date(l.nextFollowUpAt) < new Date() &&
      !["won", "lost"].includes(l.status),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Funnel Summary */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {(Object.entries(funnelStats) as [LeadStatus, number][]).map(
          ([status, count]) => (
            <div
              key={status}
              className="bg-base-100 rounded-xl p-3 text-center border border-base-300"
            >
              <div className="text-xl font-bold">{count}</div>
              <Pill variant={STATUS_PILL[status]} className="mt-1">
                {status.replace(/_/g, " ")}
              </Pill>
            </div>
          ),
        )}
      </div>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {overdueCount} overdue follow-up{overdueCount > 1 ? "s" : ""} across
            all managers
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            className="input input-bordered input-sm pl-9 w-full"
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-base-content/40" />
          <select
            className="select select-bordered select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "")}
          >
            <option value="">All Status</option>
            {(
              [
                "new",
                "contacted",
                "interested",
                "proposal_sent",
                "negotiating",
                "won",
                "lost",
                "cold",
              ] as LeadStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as LeadSource | "")}
          >
            <option value="">All Sources</option>
            {(Object.keys(SOURCE_LABELS) as LeadSource[]).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            value={filterManager}
            onChange={(e) => setFilterManager(e.target.value)}
          >
            <option value="">All Managers</option>
            {managers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={exportCSV} className="btn btn-ghost btn-sm gap-1">
          <Download className="w-4 h-4" /> CSV
        </button>
        <span className="text-xs text-base-content/40">
          {filtered.length} leads
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-300">
          <table className="table table-sm table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Source</th>
                <th>Interest / Budget</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Next Follow-up</th>
                <th>Reassign</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-base-content/40 py-12"
                  >
                    No leads found
                  </td>
                </tr>
              )}
              {filtered.map((lead) => {
                const overdue =
                  lead.nextFollowUpAt &&
                  new Date(lead.nextFollowUpAt) < new Date() &&
                  !["won", "lost"].includes(lead.status);
                return (
                  <tr
                    key={lead._id}
                    className={
                      overdue ? "bg-error/5 border-l-2 border-error" : ""
                    }
                  >
                    <td>
                      <span className="font-medium">{lead.name}</span>
                      {overdue && (
                        <AlertCircle className="inline w-3.5 h-3.5 text-error ml-1" />
                      )}
                    </td>
                    <td className="text-sm">{lead.phone}</td>
                    <td>
                      <span className="text-xs">
                        {SOURCE_LABELS[lead.source]}
                      </span>
                    </td>
                    <td>
                      <div className="max-w-36 truncate text-sm">
                        {lead.interest}
                      </div>
                      {lead.budget && (
                        <div className="text-xs text-base-content/40">
                          {lead.budget}
                        </div>
                      )}
                    </td>
                    <td>
                      <Pill variant={STATUS_PILL[lead.status]}>
                        {lead.status.replace(/_/g, " ")}
                      </Pill>
                    </td>
                    <td>
                      <span
                        className={`text-xs font-semibold ${lead.priority === "high" ? "text-error" : lead.priority === "medium" ? "text-warning" : "text-base-content/40"}`}
                      >
                        {lead.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {lead.nextFollowUpAt ? (
                        <span
                          className={`text-xs ${overdue ? "text-error font-semibold" : "text-base-content/60"}`}
                        >
                          {format(
                            new Date(lead.nextFollowUpAt),
                            "dd MMM, h:mm a",
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-base-content/30">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <UserCog className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                        <select
                          className="select select-bordered select-xs"
                          value={lead.assignedTo ?? lead.leadManagerId}
                          onChange={(e) =>
                            handleReassign(lead._id, e.target.value)
                          }
                        >
                          {managers.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
