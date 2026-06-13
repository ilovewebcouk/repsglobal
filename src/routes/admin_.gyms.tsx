import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, MapPin, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import {
  adminGeocodeBackfill,
  adminListGyms,
  adminPromoteGym,
  adminUpdateGym,
} from "@/lib/gyms.functions";

export const Route = createFileRoute("/admin_/gyms")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Gyms — REPS Admin" },
      { name: "description", content: "Moderate gym submissions and curate the venue directory." },
    ],
  }),
  component: AdminGyms,
});

type StatusFilter = "pending_review" | "active" | "rejected" | "all";

function AdminGyms() {
  const [filter, setFilter] = React.useState<StatusFilter>("pending_review");
  const qc = useQueryClient();
  const fetchList = useServerFn(adminListGyms);
  const runUpdate = useServerFn(adminUpdateGym);

  const listQ = useQuery({
    queryKey: ["admin-gyms", filter],
    queryFn: () => fetchList({ data: { status: filter } }),
    staleTime: 10_000,
  });

  const updateM = useMutation({
    mutationFn: (p: { id: string; status: "active" | "rejected" }) =>
      runUpdate({ data: p }),
    onSuccess: () => {
      toast.success("Updated.");
      void qc.invalidateQueries({ queryKey: ["admin-gyms"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't update gym."),
  });

  const rows = listQ.data ?? [];

  return (
    <DashboardShell
      role="admin"
      active="Gyms"
      title="Gyms"
      subtitle="Moderate gym submissions from professionals and curate the venue directory."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending_review", "active", "rejected", "all"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`h-9 rounded-full border px-4 text-[12px] font-semibold transition ${
              filter === s
                ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                : "border-reps-border bg-reps-panel-soft text-white/70 hover:text-white"
            }`}
          >
            {s === "pending_review" ? "Pending review" : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === filter && rows.length > 0 ? ` · ${rows.length}` : ""}
          </button>
        ))}
      </div>

      <PPanel className="p-0">
        {listQ.isPending ? (
          <div className="flex items-center justify-center p-10 text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-white/55">
            No gyms in this view.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                <th className="px-5 py-3 font-semibold">Gym</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Chain</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="border-b border-reps-border/50 last:border-b-0">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-white">{g.name}</div>
                    <div className="text-[11px] text-white/45">{g.slug}</div>
                  </td>
                  <td className="px-5 py-3 text-white/75">
                    {g.area ? `${g.area} · ` : ""}{g.city ?? ""}
                  </td>
                  <td className="px-5 py-3 text-white/65">{g.chain_name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        g.status === "active"
                          ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                          : g.status === "pending_review"
                            ? "border border-amber-400/30 bg-amber-500/15 text-amber-200"
                            : "border border-red-400/30 bg-red-500/15 text-red-300"
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[11.5px] text-white/55">
                    {new Date(g.created_at as string).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {g.status !== "active" ? (
                        <button
                          type="button"
                          onClick={() => updateM.mutate({ id: g.id, status: "active" })}
                          disabled={updateM.isPending}
                          className="inline-flex h-8 items-center gap-1 rounded-[10px] border border-emerald-400/30 bg-emerald-500/15 px-3 text-[11.5px] font-semibold text-emerald-300 shadow-none hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                      ) : null}
                      {g.status !== "rejected" ? (
                        <button
                          type="button"
                          onClick={() => updateM.mutate({ id: g.id, status: "rejected" })}
                          disabled={updateM.isPending}
                          className="inline-flex h-8 items-center gap-1 rounded-[10px] border border-red-400/30 bg-red-500/15 px-3 text-[11.5px] font-semibold text-red-300 shadow-none hover:bg-red-500/25 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PPanel>

      <PCard className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
          Phase 1
        </div>
        <p className="mt-2 text-[12.5px] text-white/65">
          Pros can submit new gyms with a 1-per-hour throttle and a max of 2 pending at a time. Approve to surface a gym
          publicly and unlock it for other pros to add. Public gym pages (<code>/at/$slug</code>) ship in Phase 2 once a
          venue has ≥3 linked coaches.
        </p>
      </PCard>
    </DashboardShell>
  );
}
