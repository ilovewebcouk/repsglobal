// /admin/activity — Admin Activity v1.2 (GA-Style Realtime Map Console).
//
// Layout hierarchy (must not regress — Amendment 6):
//   1. World Map + Realtime Summary card (hero row)
//   2. Who's online, Pages being viewed now, Country activity
//   3. Top member pages · 24h, Needs attention
//   4. Compact feed preview (secondary) → drawer for full feed
//
// All figures = logged-in member activity only (Amendment 1).
// Never surfaces raw IPs, "verified" tier, "trialing" status, or "??" country.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, Filter, RefreshCcw, X } from "lucide-react";
import { z } from "zod";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

import {
  getActivityFeed, type ActivityEvent, type ActivitySource, type ActivitySeverity,
} from "@/lib/ops/activity-feed.functions";
import {
  getActivityKpis, getOnlineNow, getCurrentPages, getTopMemberPages,
  getGeoActivity, getNeedsAttention,
} from "@/lib/ops/activity-panels.functions";
import { getRealtimeSummary } from "@/lib/ops/activity-realtime.functions";

import {
  KpiStrip, GeoPanel, OnlineNowRail, CurrentPagesPanel, TopMemberPagesPanel, NeedsAttentionPanel,
} from "@/components/admin/activity/panels";
import { ClientOnlyMap } from "@/components/admin/activity/WorldMapPanel";
import { RealtimeSummaryCard } from "@/components/admin/activity/RealtimeSummaryCard";
import {
  ActivityFeedV2, EventDetailSheet,
} from "@/components/admin/activity/feed-and-sheet";

const SOURCES: ActivitySource[] = [
  "auth", "session", "payment", "subscription", "dispute", "review",
  "verification", "support", "enquiry", "admin_audit", "impersonation", "email",
];
const SEVERITIES: ActivitySeverity[] = ["critical", "warning", "success", "info"];
const RANGES = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
] as const;

const searchSchema = z.object({
  source: z.string().optional(),
  severity: z.enum(["critical", "warning", "success", "info"]).optional(),
  country: z.string().length(2).optional(),
  range: z.number().int().optional(),
  event: z.string().optional(),
});

export const Route = createFileRoute("/admin_/activity")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: (s) => searchSchema.parse(s ?? {}),
  head: () => ({
    meta: [
      { title: "Activity — REPS Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminActivityPage,
});

function AdminActivityPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const source = (search.source ?? undefined) as ActivitySource | undefined;
  const severity = search.severity;
  const country = search.country;
  const range = RANGES.find((r) => r.hours === search.range) ?? RANGES[1];

  const setSearch = useCallback((patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }), replace: true });
  }, [navigate]);

  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [feedOpen, setFeedOpen] = useState(false);
  const [topWindow, setTopWindow] = useState<24 | 168 | 720>(24);

  // ── Server function bindings
  const runKpis = useServerFn(getActivityKpis);
  const runRealtime = useServerFn(getRealtimeSummary);
  const runOnline = useServerFn(getOnlineNow);
  const runCurrent = useServerFn(getCurrentPages);
  const runTop = useServerFn(getTopMemberPages);
  const runGeo = useServerFn(getGeoActivity);
  const runAttention = useServerFn(getNeedsAttention);
  const runFeed = useServerFn(getActivityFeed);

  // ── Queries. Each panel independent; a slow panel degrades alone.
  const realtimeQ = useQuery({ queryKey: ["a-realtime"], queryFn: () => runRealtime(), refetchInterval: 10_000 });
  const kpisQ = useQuery({ queryKey: ["a-kpis"], queryFn: () => runKpis(), refetchInterval: 30_000 });
  const onlineQ = useQuery({ queryKey: ["a-online"], queryFn: () => runOnline({ data: { limit: 50 } }), refetchInterval: 15_000 });
  const currentQ = useQuery({ queryKey: ["a-current"], queryFn: () => runCurrent({ data: { limit: 8 } }), refetchInterval: 20_000 });
  const topQ = useQuery({ queryKey: ["a-top", topWindow], queryFn: () => runTop({ data: { limit: 10, hours: topWindow } }), refetchInterval: 60_000 });
  const geoQ = useQuery({ queryKey: ["a-geo"], queryFn: () => runGeo(), refetchInterval: 30_000 });
  const attentionQ = useQuery({ queryKey: ["a-attention"], queryFn: () => runAttention(), refetchInterval: 30_000 });

  const feedQ = useQuery({
    queryKey: ["a-feed", source ?? "all", severity ?? "all", range.hours],
    queryFn: () => runFeed({ data: { limit: 200, since_hours: range.hours, source, severity } }),
    refetchInterval: 20_000,
  });

  const events = useMemo(() => {
    const list = feedQ.data?.events ?? [];
    if (!country) return list;
    const online = onlineQ.data?.users ?? [];
    const usersInCountry = new Set(online.filter((u) => u.country_code === country).map((u) => u.user_id).filter(Boolean));
    return list.filter((e) => e.user_id && usersInCountry.has(e.user_id));
  }, [feedQ.data, country, onlineQ.data]);

  const compactEvents = useMemo(() => events.slice(0, 6), [events]);

  // Drop `online_now` from the KPI strip — the Realtime card owns it.
  const dedupedKpis = useMemo(
    () => (kpisQ.data?.tiles ?? []).filter((t) => t.key !== "online_now"),
    [kpisQ.data],
  );

  // ── Timing / degraded panels
  const timings = useMemo(() => {
    return [
      kpisQ.data?.timing, onlineQ.data?.timing, currentQ.data?.timing,
      topQ.data?.timing, geoQ.data?.timing, attentionQ.data?.timing,
    ].filter((t): t is NonNullable<typeof t> => Boolean(t));
  }, [kpisQ.data, onlineQ.data, currentQ.data, topQ.data, geoQ.data, attentionQ.data]);
  const degraded = timings.filter((t) => t.degraded);
  const slow = timings.filter((t) => !t.degraded && t.ms > 1500);
  const feedDegraded = feedQ.data?.degraded_sources ?? [];

  const refreshAll = useCallback(() => {
    realtimeQ.refetch(); kpisQ.refetch(); onlineQ.refetch(); currentQ.refetch();
    topQ.refetch(); geoQ.refetch(); attentionQ.refetch(); feedQ.refetch();
  }, [realtimeQ, kpisQ, onlineQ, currentQ, topQ, geoQ, attentionQ, feedQ]);

  const filterChipsActive = Boolean(source || severity || country || search.range);

  return (
    <DashboardShell role="admin" active="Activity" title="Activity" subtitle="Realtime member activity — map-first">
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
        {/* ── Header ── */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[24px] font-bold text-white">Activity</h1>
            <p className="mt-1 text-[12.5px] text-white/55">
              Realtime map of logged-in member activity.{" "}
              <span className="text-white/40">Anonymous public analytics is disabled in v1.2.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RangeSwitcher value={range.hours} onChange={(h) => setSearch({ range: h })} />
            <FiltersPopover
              source={source} severity={severity} country={country}
              onChange={(patch) => setSearch(patch)}
              onClear={() => setSearch({ source: undefined, severity: undefined, country: undefined })}
            />
            <Button variant="outline" size="sm" onClick={refreshAll} className="gap-1.5">
              <RefreshCcw className={cn("h-3.5 w-3.5", (feedQ.isFetching || kpisQ.isFetching) && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </header>

        {/* ── Ops banner ── */}
        {(degraded.length > 0 || feedDegraded.length > 0) ? (
          <div className="flex items-start gap-2 rounded-[14px] border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">Partial data</div>
              <div className="mt-0.5 text-[11.5px] text-amber-100/80">
                Degraded: {[...degraded.map((d) => d.panel), ...feedDegraded].join(", ")}. Other panels are live.
              </div>
            </div>
          </div>
        ) : slow.length > 0 ? (
          <div className="rounded-[14px] border border-reps-border bg-white/5 px-3 py-2 text-[11px] text-white/60">
            Slow: {slow.map((s) => `${s.panel} (${s.ms}ms)`).join(" · ")}
          </div>
        ) : null}

        {filterChipsActive ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {source ? <FilterChip label={`source: ${source}`} onClear={() => setSearch({ source: undefined })} /> : null}
            {severity ? <FilterChip label={`severity: ${severity}`} onClear={() => setSearch({ severity: undefined })} /> : null}
            {country ? <FilterChip label={`country: ${country}`} onClear={() => setSearch({ country: undefined })} /> : null}
          </div>
        ) : null}

        {/* ── HERO ROW: Map (2/3) + Realtime Summary (1/3) ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ClientOnlyMap
              countries={geoQ.data?.countries ?? []}
              loading={geoQ.isLoading}
              selectedCountry={country}
              onSelectCountry={(cc) => setSearch({ country: cc })}
            />
          </div>
          <div className="xl:col-span-1">
            <RealtimeSummaryCard data={realtimeQ.data} loading={realtimeQ.isLoading} />
          </div>
        </div>

        {/* ── KPI strip (below hero — reference numbers) ── */}
        <KpiStrip tiles={kpisQ.data?.tiles ?? []} loading={kpisQ.isLoading} />

        {/* ── ROW 2: Online now (4) · Pages now (4) · Country list (4) ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <OnlineNowRail users={onlineQ.data?.users ?? []} loading={onlineQ.isLoading} />
          </div>
          <div className="xl:col-span-4">
            <CurrentPagesPanel pages={currentQ.data?.pages ?? []} loading={currentQ.isLoading} />
          </div>
          <div className="xl:col-span-4">
            <GeoPanel
              countries={geoQ.data?.countries ?? []}
              loading={geoQ.isLoading}
              selectedCountry={country}
              onSelectCountry={(cc) => setSearch({ country: cc })}
            />
          </div>
        </div>

        {/* ── ROW 3: Top pages (7) · Needs Attention (5) ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <TopMemberPagesPanel pages={topQ.data?.pages ?? []} loading={topQ.isLoading} />
          </div>
          <div className="xl:col-span-5">
            <NeedsAttentionPanel rows={attentionQ.data?.rows ?? []} loading={attentionQ.isLoading} />
          </div>
        </div>

        {/* ── ROW 4: Compact feed preview (secondary) ── */}
        <section className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
          <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-4 py-2.5">
            <div className="min-w-0">
              <h2 className="font-display text-[13px] font-semibold text-white">Recent activity</h2>
              <p className="truncate text-[10.5px] text-white/45">Latest {compactEvents.length} of {events.length} events</p>
            </div>
            <button
              type="button"
              onClick={() => setFeedOpen(true)}
              className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
            >
              View full feed <ChevronRight className="h-3 w-3" />
            </button>
          </header>
          <ActivityFeedV2 compact events={compactEvents} loading={feedQ.isLoading} onOpenEvent={(e) => setSelectedEvent(e)} />
        </section>

        {/* Footer meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-reps-border/60 pt-3 text-[10.5px] text-white/40">
          <span>
            {events.length} events in view · online now {realtimeQ.data?.online_now ?? 0}
          </span>
          <span>Logged-in member activity only · no raw IPs stored · country-level enrichment</span>
        </div>
      </div>

      <EventDetailSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Full feed drawer */}
      <Sheet open={feedOpen} onOpenChange={setFeedOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-reps-border bg-reps-ink p-0 sm:max-w-2xl">
          <SheetHeader className="border-b border-reps-border p-5 text-left">
            <SheetTitle className="text-[16px] font-semibold text-white">Full activity feed</SheetTitle>
            <p className="text-[11.5px] text-white/55">{events.length} events · {range.label}</p>
          </SheetHeader>
          <div className="p-3">
            <ActivityFeedV2 events={events} loading={feedQ.isLoading} onOpenEvent={(e) => setSelectedEvent(e)} />
          </div>
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}

// ─────────────────────────────────────────────────────── controls ──

function RangeSwitcher({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.hours}
          type="button"
          onClick={() => onChange(r.hours)}
          className={cn(
            "px-2.5 py-1 text-[11px] font-medium rounded-[8px] transition",
            value === r.hours ? "bg-reps-orange text-white" : "text-white/60 hover:text-white/90",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function FiltersPopover({
  source, severity, country, onChange, onClear,
}: {
  source?: ActivitySource; severity?: ActivitySeverity; country?: string;
  onChange: (patch: Partial<z.infer<typeof searchSchema>>) => void;
  onClear: () => void;
}) {
  const active = Number(Boolean(source)) + Number(Boolean(severity)) + Number(Boolean(country));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filters {active > 0 ? <Badge className="ml-1 h-4 min-w-4 bg-reps-orange px-1 text-[9.5px] text-white">{active}</Badge> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 border border-reps-border bg-reps-panel p-4">
        <div>
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/50">Source</div>
          <div className="flex flex-wrap gap-1">
            {SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ source: source === s ? undefined : s })}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10.5px]",
                  source === s
                    ? "border-reps-orange bg-reps-orange text-white"
                    : "border-reps-border bg-white/5 text-white/70 hover:bg-white/10",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/50">Severity</div>
          <div className="flex flex-wrap gap-1">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ severity: severity === s ? undefined : s })}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10.5px] capitalize",
                  severity === s
                    ? "border-reps-orange bg-reps-orange text-white"
                    : "border-reps-border bg-white/5 text-white/70 hover:bg-white/10",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {country ? (
          <div className="rounded-[10px] bg-white/5 px-2 py-1.5 text-[11px] text-white/75">
            Country filter: <span className="font-semibold">{country}</span>
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear} className="text-[11px] text-white/60 hover:text-white">
            Clear all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1 rounded-full border border-reps-border bg-reps-panel px-2 py-0.5 text-[10.5px] text-white/70 hover:bg-white/10"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}
