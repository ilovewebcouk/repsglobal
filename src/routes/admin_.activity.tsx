// /admin/activity — Admin Activity v1 console.
//
// Read-only operational intelligence. Source-of-truth for billing/visibility
// remains elsewhere; this page renders intelligence from getActivityFeed.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Wifi } from "lucide-react";
import { toast } from "sonner";
import {
  getActivityFeed,
  type ActivityEvent,
  type ActivityFeedResult,
  type ActivitySeverity,
} from "@/lib/ops/activity-feed.functions";

export const Route = createFileRoute("/admin_/activity")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Activity — REPS Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminActivityPage,
});

const SEVERITY_CLASS: Record<ActivitySeverity, string> = {
  info: "bg-white/10 text-white/80",
  success: "bg-emerald-500/15 text-emerald-200",
  warning: "bg-amber-500/15 text-amber-200",
  critical: "bg-rose-500/15 text-rose-200",
};

const SOURCES = [
  "all", "auth", "session", "payment", "subscription",
  "dispute", "review", "verification", "support",
  "enquiry", "admin_audit", "impersonation", "email",
] as const;

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function AdminActivityPage() {
  const runFeed = useServerFn(getActivityFeed);
  const [data, setData] = useState<ActivityFeedResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<(typeof SOURCES)[number]>("all");
  const [hours, setHours] = useState(24);

  async function refresh() {
    setBusy(true);
    try {
      const res = await runFeed({
        data: {
          since_hours: hours,
          limit: 200,
          source: source === "all" ? undefined : source,
        },
      });
      setData(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load activity");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, hours]);

  const events = data?.events ?? [];
  const counts = data?.counts.bySeverity ?? { info: 0, success: 0, warning: 0, critical: 0 };

  return (
    <DashboardShell role="admin" active="Activity">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Activity</h1>
            <p className="text-sm text-white/60">
              Operational intelligence — what's happening across REPS right now. Read-only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={busy}>
              <RefreshCcw className="mr-2 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiTile label="Online now" value={data?.online_now ?? 0} icon={<Wifi className="h-4 w-4" />} />
          <KpiTile label="Total events" value={data?.counts.total ?? 0} />
          <KpiTile label="Critical" value={counts.critical} tone="critical" />
          <KpiTile label="Warnings" value={counts.warning} tone="warning" />
          <KpiTile label="Success" value={counts.success} tone="success" />
        </div>

        {/* Degraded sources banner */}
        {data?.degraded_sources && data.degraded_sources.length > 0 ? (
          <PPanel className="border-amber-500/40 bg-amber-500/5">
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div className="text-sm text-amber-100">
                <div className="font-medium">Partial feed</div>
                <div className="text-amber-200/80">
                  Some sources failed to load: {data.degraded_sources.join(", ")}. Logged to
                  ops_alerts.
                </div>
              </div>
            </div>
          </PPanel>
        ) : null}

        {/* Needs attention */}
        {data && data.needs_attention.length > 0 ? (
          <PPanel>
            <div className="border-b border-white/10 px-4 py-3 text-sm font-medium text-white">
              Needs attention
            </div>
            <ul className="divide-y divide-white/5">
              {data.needs_attention.map((e) => (
                <EventRow key={`a:${e.id}`} e={e} />
              ))}
            </ul>
          </PPanel>
        ) : null}

        {/* Filters */}
        <PPanel>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={
                    "rounded-full px-3 py-1 text-xs " +
                    (source === s
                      ? "bg-white text-reps-ink"
                      : "bg-white/5 text-white/70 hover:bg-white/10")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {[1, 6, 24, 24 * 7].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={
                    "rounded-md px-2 py-1 text-xs " +
                    (hours === h ? "bg-white text-reps-ink" : "bg-white/5 text-white/70 hover:bg-white/10")
                  }
                >
                  {h === 1 ? "1h" : h === 6 ? "6h" : h === 24 ? "24h" : "7d"}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          {events.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/50">
              {busy ? "Loading…" : "No events in this window."}
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {events.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </ul>
          )}

          {data ? (
            <div className="border-t border-white/10 px-4 py-2 text-[11px] text-white/40">
              Updated {timeAgo(data.generated_at)} · auto-refresh 60s · read-only intelligence; not billing or
              visibility truth.
            </div>
          ) : null}
        </PPanel>
      </div>
    </DashboardShell>
  );
}

function KpiTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: ActivitySeverity;
}) {
  const toneClass =
    tone === "critical" ? "text-rose-200" :
    tone === "warning" ? "text-amber-200" :
    tone === "success" ? "text-emerald-200" :
    "text-white";
  return (
    <PPanel>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-white/60">
          {icon}
          {label}
        </div>
        <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value.toLocaleString()}</div>
      </div>
    </PPanel>
  );
}

function EventRow({ e }: { e: ActivityEvent }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 text-sm">
      <Badge className={`mt-0.5 shrink-0 ${SEVERITY_CLASS[e.severity]}`}>{e.source}</Badge>
      <div className="min-w-0 flex-1">
        <div className="truncate text-white">{e.summary}</div>
        <div className="text-[11px] text-white/40">{e.type} · {timeAgo(e.ts)}</div>
      </div>
      {e.url ? (
        <a href={e.url} className="text-xs text-reps-orange hover:underline">
          Open
        </a>
      ) : null}
    </li>
  );
}
