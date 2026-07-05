import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Loader2, RefreshCw, ShieldAlert } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { SitemapHealthCard } from "@/components/admin/seo/SitemapHealthCard";
import {
  acknowledgeSeoEvents,
  listSeoEvents,
  listSeoScanRuns,
  listSeoStatus,
  runSeoIndexScanNow,
  type SeoEventRow,
  type SeoStatusRow,
} from "@/lib/seo/index-monitor.functions";
import { recheckSeoUrl } from "@/lib/seo/sitemap-health.functions";

export const Route = createFileRoute("/admin_/seo")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "SEO indexing monitor — REPS Admin" },
    ],
  }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: SeoMonitorPage,
});

type StatusFilter = "failing" | "all" | "priority_a";

function severityBadge(sev: SeoEventRow["severity"]) {
  if (sev === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
        <AlertTriangle className="size-3" /> Error
      </span>
    );
  }
  if (sev === "warn") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
        <ShieldAlert className="size-3" /> Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[6px] border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
      <CheckCircle2 className="size-3" /> Info
    </span>
  );
}

function verdictPill(v: SeoStatusRow["verdict"]) {
  if (v === "PASS")
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
        Indexed
      </span>
    );
  if (v === "FAIL")
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
        Fail
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-[6px] border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">
      {v ?? "—"}
    </span>
  );
}

function relTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

function SeoMonitorPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("failing");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const listEvents = useServerFn(listSeoEvents);
  const events = useQuery({
    queryKey: ["seo-events", "open"],
    queryFn: () => listEvents({ data: { open: true, limit: 100 } }),
  });

  const listStatus = useServerFn(listSeoStatus);
  const status = useQuery({
    queryKey: ["seo-status", statusFilter],
    queryFn: () => listStatus({ data: { filter: statusFilter, limit: 300 } }),
  });

  const listRuns = useServerFn(listSeoScanRuns);
  const runs = useQuery({
    queryKey: ["seo-runs"],
    queryFn: () => listRuns({ data: { limit: 5 } }),
  });

  const ackFn = useServerFn(acknowledgeSeoEvents);
  const ackMut = useMutation({
    mutationFn: (ids: string[]) => ackFn({ data: { ids } }),
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["seo-events"] });
    },
  });

  const scanFn = useServerFn(runSeoIndexScanNow);
  const scanMut = useMutation({
    mutationFn: (full: boolean) => scanFn({ data: { full } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-events"] });
      qc.invalidateQueries({ queryKey: ["seo-status"] });
      qc.invalidateQueries({ queryKey: ["seo-runs"] });
    },
  });

  const recheckFn = useServerFn(recheckSeoUrl);
  const [recheckingUrl, setRecheckingUrl] = useState<string | null>(null);
  const recheckMut = useMutation({
    mutationFn: (url: string) => {
      setRecheckingUrl(url);
      return recheckFn({ data: { url } });
    },
    onSettled: () => setRecheckingUrl(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-events"] });
      qc.invalidateQueries({ queryKey: ["seo-status"] });
    },
  });

  const openCount = events.data?.rows.length ?? 0;
  const errorCount = events.data?.rows.filter((e) => e.severity === "error").length ?? 0;
  const warnCount = events.data?.rows.filter((e) => e.severity === "warn").length ?? 0;
  const lastRun = runs.data?.rows[0];

  return (
    <DashboardShell
      role="admin"
      active="SEO"
      title="SEO indexing monitor"
      subtitle="Google Search Console verdicts across the sitemap — updated daily."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => scanMut.mutate(false)}
            disabled={scanMut.isPending}
          >
            {scanMut.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            <span>Scan priority pages now</span>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <PCard>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">Open events</div>
          <div className="mt-2 font-display text-[28px] font-bold text-white">{openCount}</div>
          <div className="mt-1 text-[12px] text-white/55">Unacknowledged</div>
        </PCard>
        <PCard>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">Errors</div>
          <div className="mt-2 font-display text-[28px] font-bold text-rose-300">{errorCount}</div>
          <div className="mt-1 text-[12px] text-white/55">Pages that regressed</div>
        </PCard>
        <PCard>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">Warnings</div>
          <div className="mt-2 font-display text-[28px] font-bold text-amber-300">{warnCount}</div>
          <div className="mt-1 text-[12px] text-white/55">Canonical / coverage shifts</div>
        </PCard>
        <PCard>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">Last scan</div>
          <div className="mt-2 font-display text-[20px] font-bold text-white">
            {lastRun ? relTime(lastRun.started_at) : "—"}
          </div>
          <div className="mt-1 text-[12px] text-white/55">
            {lastRun
              ? `${lastRun.urls_checked} checked · ${lastRun.urls_changed} changed · ${lastRun.errors} errors`
              : "No scans yet"}
          </div>
        </PCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PPanel className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-white">Open events</h2>
              <p className="mt-1 text-[12px] text-white/55">
                New crawl or index changes since the last acknowledgement.
              </p>
            </div>
            {selected.size > 0 && (
              <Button
                variant="subtle"
                size="sm"
                onClick={() => ackMut.mutate(Array.from(selected))}
                disabled={ackMut.isPending}
              >
                {ackMut.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>Acknowledge {selected.size}</span>
              </Button>
            )}
          </div>

          {events.isPending ? (
            <div className="mt-6 flex items-center gap-2 text-[13px] text-white/55">
              <Loader2 className="size-3.5 animate-spin" /> Loading events…
            </div>
          ) : openCount === 0 ? (
            <div className="mt-6 flex items-center gap-2 rounded-[10px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-300">
              <CheckCircle2 className="size-4" /> No new indexing issues since the last scan.
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {events.data!.rows.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-3 rounded-[10px] border border-reps-border bg-reps-ink px-3 py-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-white/20 bg-transparent accent-reps-orange"
                    checked={selected.has(e.id)}
                    onChange={(ev) => {
                      const next = new Set(selected);
                      if (ev.target.checked) next.add(e.id);
                      else next.delete(e.id);
                      setSelected(next);
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {severityBadge(e.severity)}
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[13px] font-semibold text-white hover:text-reps-orange"
                      >
                        {new URL(e.url).pathname}
                      </a>
                      <span className="text-[11px] text-white/45">{relTime(e.detected_at)}</span>
                    </div>
                    <div className="mt-1 text-[12px] text-white/75">{e.summary}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <a
                        href={`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent("https://repsuk.org/")}&id=${encodeURIComponent(e.url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-reps-panel/60 px-2 py-1 text-[11px] font-semibold text-white/80 transition hover:text-white"
                        title="Opens Google Search Console URL Inspection. Click 'Request indexing' there (~10/day quota)."
                      >
                        <ExternalLink className="size-3" /> Request indexing in GSC
                      </a>
                      <button
                        type="button"
                        onClick={() => recheckMut.mutate(e.url)}
                        disabled={recheckingUrl === e.url}
                        className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-reps-panel/60 px-2 py-1 text-[11px] font-semibold text-white/80 transition hover:text-white disabled:opacity-60"
                      >
                        {recheckingUrl === e.url ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <RefreshCw className="size-3" />
                        )}
                        Re-check now
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PPanel>

        <div className="space-y-6">
          <PPanel className="p-6">
            <div className="flex items-center gap-2 text-white">
              <Info className="size-4 text-reps-orange" />
              <h2 className="font-display text-[16px] font-semibold">How this works</h2>
            </div>
            <ul className="mt-3 space-y-2 text-[12px] text-white/75">
              <li>
                A daily scheduled job asks Google Search Console for the current
                indexing verdict on each URL in your sitemap.
              </li>
              <li>
                Priority pages (marketing, hubs, profession &amp; city landings)
                are checked every day. Long-tail URLs rotate through in slices of
                ~200 so the whole site cycles every few days.
              </li>
              <li>
                Only meaningful changes create events — regressions, recoveries,
                new canonical mismatches, or new robots blocks. No noise on
                unchanged pages.
              </li>
            </ul>
          </PPanel>
          {lastRun && (
            <PCard>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
                Recent scans
              </div>
              <ul className="mt-3 space-y-2 text-[12px] text-white/75">
                {runs.data!.rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {relTime(r.started_at)}
                      <span className="ml-2 text-white/40">({r.batch_kind})</span>
                    </span>
                    <span className="text-white/60">
                      {r.urls_checked} · {r.urls_changed}Δ · {r.errors}✕
                    </span>
                  </li>
                ))}
              </ul>
            </PCard>
          )}
        </div>
      </div>

      <PPanel className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[16px] font-semibold text-white">URL status</h2>
            <p className="mt-1 text-[12px] text-white/55">
              Latest snapshot per URL. Click a URL to open in a new tab.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-[10px] border border-reps-border bg-reps-ink p-1">
            {(["failing", "priority_a", "all"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={
                  "rounded-[8px] px-3 py-1 text-[11px] font-semibold transition " +
                  (statusFilter === f
                    ? "bg-reps-orange text-white"
                    : "text-white/70 hover:text-white")
                }
              >
                {f === "failing" ? "Failing" : f === "priority_a" ? "Priority" : "All"}
              </button>
            ))}
          </div>
        </div>

        {status.isPending ? (
          <div className="mt-6 flex items-center gap-2 text-[13px] text-white/55">
            <Loader2 className="size-3.5 animate-spin" /> Loading URL status…
          </div>
        ) : status.data && status.data.rows.length === 0 ? (
          <div className="mt-6 rounded-[10px] border border-white/10 bg-white/5 px-3 py-4 text-[13px] text-white/60">
            No rows yet. Run a scan or wait for the daily job.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                  <th className="py-2 font-semibold">URL</th>
                  <th className="py-2 font-semibold">Verdict</th>
                  <th className="py-2 font-semibold">Coverage</th>
                  <th className="py-2 font-semibold">Robots</th>
                  <th className="py-2 font-semibold">Last change</th>
                  <th className="py-2 font-semibold">Last checked</th>
                </tr>
              </thead>
              <tbody>
                {status.data!.rows.map((r) => (
                  <tr key={r.url} className="border-t border-reps-border/60 text-white/80">
                    <td className="max-w-[320px] truncate py-3">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-white hover:text-reps-orange"
                      >
                        {new URL(r.url).pathname}
                      </a>
                      {r.priority === "A" && (
                        <span className="ml-2 rounded-[6px] border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
                          A
                        </span>
                      )}
                    </td>
                    <td className="py-3">{verdictPill(r.verdict)}</td>
                    <td className="py-3 text-white/65">{r.coverage_state ?? "—"}</td>
                    <td className="py-3 text-white/65">{r.robots_state ?? "—"}</td>
                    <td className="py-3 text-white/55">{relTime(r.last_changed_at)}</td>
                    <td className="py-3 text-white/55">{relTime(r.last_checked_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PPanel>
    </DashboardShell>
  );
}
