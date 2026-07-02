// /admin/activity — Admin Activity v2.0 (Realtime Command Centre).
//
// Layout hierarchy (v2.0 — do not regress):
//   1. Header + freshness/filters/refresh
//   2. Command strip (6 tiles: live, public, members, views 5m, high-value, attention)
//   3. Hero row — World map (2/3) + Live activity rail with All/Public/Members tabs (1/3)
//   4. Needs Attention rail (elevated) + Recent activity feed side-by-side
//   5. Public analytics — 24h rollup + discovery insight (live is in the rail)
//   6. Member activity — top pages + country activity + supporting KPIs
//
// All logic/data sources unchanged from v1.1 — layout & UX polish only.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Filter, X } from "lucide-react";
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
import { getPublicRealtime } from "@/lib/admin/public-realtime.functions";
import { runGeoBackfill } from "@/lib/ops/backfill-geo.functions";

import {
  GeoPanel, TopMemberPagesPanel, NeedsAttentionPanel,
} from "@/components/admin/activity/panels";
import { ClientOnlyMap } from "@/components/admin/activity/WorldMapPanel";
import {
  ActivityFeedV2, EventDetailSheet,
} from "@/components/admin/activity/feed-and-sheet";
import { PublicVisitorsPanel } from "@/components/admin/activity/PublicVisitorsPanel";
import { LiveActivityRail, type SupabaseVisitorRow } from "@/components/admin/activity/LiveActivityRail";
import { RealtimeSummaryCard } from "@/components/admin/activity/RealtimeSummaryCard";
import { PublicVisitorDrawer } from "@/components/admin/activity/PublicVisitorDrawer";

import { AnalyticsStrip, type AnalyticsSeries } from "@/components/admin/activity/AnalyticsStrip";
import { DiagnosticsDrawer } from "@/components/admin/activity/DiagnosticsDrawer";
import { CompactStatusStrip } from "@/components/admin/activity/CompactStatusStrip";
import { PagesBeingViewedNow } from "@/components/admin/activity/PagesBeingViewedNow";
import { getPublicVisitorsLive, getPublicIngestHealth, getPublicConversionsLive } from "@/lib/activity/live-visitors.functions";

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
  const [mapLayer, setMapLayer] = useState<"members" | "public" | "both">("both");
  const [visitorDrawerId, setVisitorDrawerId] = useState<string | null>(null);

  // ── Server function bindings
  const runKpis = useServerFn(getActivityKpis);
  const runRealtime = useServerFn(getRealtimeSummary);
  const runOnline = useServerFn(getOnlineNow);
  const runCurrent = useServerFn(getCurrentPages);
  const runTop = useServerFn(getTopMemberPages);
  const runGeo = useServerFn(getGeoActivity);
  const runAttention = useServerFn(getNeedsAttention);
  const runFeed = useServerFn(getActivityFeed);
  const runPublicRealtime = useServerFn(getPublicRealtime);

  const runPublicVisitorsLive = useServerFn(getPublicVisitorsLive);
  const runPublicIngestHealth = useServerFn(getPublicIngestHealth);
  const runPublicConversions = useServerFn(getPublicConversionsLive);

  // ── Queries — realtime queries poll fast (5–8s); heavier aggregates poll slower.
  const realtimeQ = useQuery({ queryKey: ["a-realtime"], queryFn: () => runRealtime(), refetchInterval: 6_000 });
  const kpisQ = useQuery({ queryKey: ["a-kpis"], queryFn: () => runKpis(), refetchInterval: 30_000 });
  const publicRealtimeQ = useQuery({
    queryKey: ["a-public-realtime"],
    queryFn: () => runPublicRealtime().catch(() => null),
    refetchInterval: 6_000, // server TTL 5s → poll every ~6s for a live feel
    retry: false,
  });

  const publicVisitorsQ = useQuery({
    queryKey: ["a-public-visitors-live"],
    queryFn: () => runPublicVisitorsLive({ data: { limit: 50 } }).catch(() => null),
    refetchInterval: 8_000,
    retry: false,
  });
  const publicHealthQ = useQuery({
    queryKey: ["a-public-health"],
    queryFn: () => runPublicIngestHealth().catch(() => null),
    refetchInterval: 20_000,
    retry: false,
  });
  const KEY_ACTIONS = new Set(["enquiry_started", "enquiry_created", "signup_started", "checkout_started", "signup_complete"]);
  const conversionsQ = useQuery({
    queryKey: ["a-public-conversions"],
    queryFn: () => runPublicConversions({ data: { limit: 100 } }).catch(() => [] as Array<{ event_kind: string; occurred_at: string }>),
    refetchInterval: 30_000,
    retry: false,
  });


  const onlineQ = useQuery({ queryKey: ["a-online"], queryFn: () => runOnline({ data: { limit: 50 } }), refetchInterval: 8_000 });
  const currentQ = useQuery({ queryKey: ["a-current"], queryFn: () => runCurrent({ data: { limit: 8 } }), refetchInterval: 8_000 });
  const topQ = useQuery({ queryKey: ["a-top", topWindow], queryFn: () => runTop({ data: { limit: 10, hours: topWindow } }), refetchInterval: 60_000 });
  const geoQ = useQuery({ queryKey: ["a-geo"], queryFn: () => runGeo(), refetchInterval: 20_000 });
  const attentionQ = useQuery({ queryKey: ["a-attention"], queryFn: () => runAttention(), refetchInterval: 30_000 });

  const feedQ = useQuery({
    queryKey: ["a-feed", source ?? "all", severity ?? "all", range.hours],
    queryFn: () => runFeed({ data: { limit: 200, since_hours: range.hours, source, severity } }),
    refetchInterval: 15_000,
  });

  const events = useMemo(() => {
    const list = feedQ.data?.events ?? [];
    if (!country) return list;
    const online = onlineQ.data?.users ?? [];
    const usersInCountry = new Set(online.filter((u) => u.country_code === country).map((u) => u.user_id).filter(Boolean));
    return list.filter((e) => e.user_id && usersInCountry.has(e.user_id));
  }, [feedQ.data, country, onlineQ.data]);

  const compactEvents = useMemo(() => events.slice(0, 8), [events]);

  // ── Command strip metrics
  // Reconcile: sometimes `online_now` lags behind the sum of per-country
  // online counts (or vice versa). Show the max so the strip never reads 0
  // when the map clearly shows live users.
  const rawPublicOnline = publicRealtimeQ.data?.online_now ?? 0;
  const publicCountrySum = (publicRealtimeQ.data?.countries ?? []).reduce(
    (sum, c) => sum + (c.online ?? 0),
    0,
  );
  const publicOnline = Math.max(rawPublicOnline, publicCountrySum);
  const membersOnline = realtimeQ.data?.online_now ?? 0;
  const pageViews5m = publicRealtimeQ.data?.page_views_5m ?? 0;
  const attentionRows = attentionQ.data?.rows ?? [];
  const attentionCount = attentionRows.length;
  const criticalCount = attentionRows.filter((r) => r.severity === "critical").length;

  const memberMapCities = useMemo(() => {
    const map = new Map<string, {
      city: string;
      region: string | null;
      country_code: string;
      latitude: number;
      longitude: number;
      online: number;
    }>();
    for (const u of onlineQ.data?.users ?? []) {
      if (!u.city || !u.country_code || typeof u.latitude !== "number" || typeof u.longitude !== "number") continue;
      const key = `${u.city}|${u.region ?? ""}|${u.country_code}|${u.latitude.toFixed(3)}|${u.longitude.toFixed(3)}`;
      const existing = map.get(key);
      if (existing) existing.online += 1;
      else map.set(key, {
        city: u.city,
        region: u.region,
        country_code: u.country_code,
        latitude: u.latitude,
        longitude: u.longitude,
        online: 1,
      });
    }
    return Array.from(map.values()).sort((a, b) => b.online - a.online);
  }, [onlineQ.data]);

  // Amendment 1 — "Key actions today" counts commercial events only.
  const keyActionsToday = useMemo(() => {
    const rows = (conversionsQ.data ?? []) as Array<{ event_kind: string; occurred_at: string }>;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const cutoff = startOfDay.getTime();
    return rows.filter((r) => KEY_ACTIONS.has(r.event_kind) && new Date(r.occurred_at).getTime() >= cutoff).length;
  }, [conversionsQ.data]);

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

  const ingestStatus: "healthy" | "degraded" | "down" =
    realtimeQ.error || publicRealtimeQ.error ? "down"
    : degraded.length > 0 || feedDegraded.length > 0 ? "degraded"
    : "healthy";



  const filterChipsActive = Boolean(source || severity || country || search.range);

  const controls = (
    <>
      <RangeSwitcher value={range.hours} onChange={(h) => setSearch({ range: h })} />
      <FiltersPopover
        source={source} severity={severity} country={country}
        onChange={(patch) => setSearch(patch)}
        onClear={() => setSearch({ source: undefined, severity: undefined, country: undefined })}
      />
    </>
  );

  // 7-day sparkline series derived from conversions feed (last 7 buckets @ 24h).
  const analyticsTiles = useMemo<AnalyticsSeries[]>(() => {
    const rows = (conversionsQ.data ?? []) as Array<{ event_kind: string; occurred_at: string }>;
    const now = Date.now();
    const bucketsFor = (kinds: Set<string>) => {
      const arr = new Array(7).fill(0) as number[];
      for (const r of rows) {
        if (!kinds.has(r.event_kind)) continue;
        const days = Math.floor((now - new Date(r.occurred_at).getTime()) / (24 * 3600 * 1000));
        if (days >= 0 && days < 7) arr[6 - days] += 1;
      }
      return arr;
    };
    const visitorsSeries = bucketsFor(new Set(["$pageview"]));
    const signupsSeries = bucketsFor(new Set(["signup_complete", "signup_started"]));
    const conversionsSeries = bucketsFor(new Set(["signup_complete", "checkout_completed"]));
    const enquiriesSeries = bucketsFor(new Set(["enquiry_started", "enquiry_created"]));
    const checkoutSeries = bucketsFor(new Set(["checkout_started", "checkout_completed"]));
    return [
      { label: "Visitors 24h", value: publicOnline + membersOnline, series: visitorsSeries, color: "#38BDF8" },
      { label: "Signups 7d", value: signupsSeries.reduce((s, n) => s + n, 0), series: signupsSeries, color: "#F97316" },
      { label: "Conversions 7d", value: conversionsSeries.reduce((s, n) => s + n, 0), series: conversionsSeries, color: "#22D3EE" },
      { label: "Enquiries 7d", value: enquiriesSeries.reduce((s, n) => s + n, 0), series: enquiriesSeries, color: "#A78BFA" },
      { label: "Checkouts 7d", value: checkoutSeries.reduce((s, n) => s + n, 0), series: checkoutSeries, color: "#34D399" },
    ];
  }, [conversionsQ.data, publicOnline, membersOnline]);

  return (
    <DashboardShell
      role="admin"
      active="Activity"
      title="Activity"
      subtitle="Live analytics command centre"
      actions={<div className="hidden items-center gap-2 lg:flex">{controls}</div>}
    >

      <div className="mx-auto max-w-[1500px] space-y-3 px-4 pb-6 md:px-6">
        {/* Desktop controls live in the shell header; mobile keeps them compact here. */}
        <header className="flex flex-wrap items-center justify-end gap-2 lg:hidden">
          {controls}
        </header>

        {filterChipsActive ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {source ? <FilterChip label={`source: ${source}`} onClear={() => setSearch({ source: undefined })} /> : null}
            {severity ? <FilterChip label={`severity: ${severity}`} onClear={() => setSearch({ severity: undefined })} /> : null}
            {country ? <FilterChip label={`country: ${country}`} onClear={() => setSearch({ country: undefined })} /> : null}
          </div>
        ) : null}

        {/* ── Zone 3 · COMPACT STATUS STRIP (six tiles) ── */}
        <CompactStatusStrip
          publicLive={publicOnline}
          membersLive={membersOnline}
          keyActionsToday={keyActionsToday}
          criticalCount={criticalCount}
          warningCount={Math.max(0, attentionCount - criticalCount)}
          health={ingestStatus === "down" ? "broken" : ingestStatus}
        />

        {/* ── Zone 4 · Live map (2/3) + Realtime Summary (1/3) ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <ClientOnlyMap
              countries={geoQ.data?.countries ?? []}
              loading={geoQ.isLoading}
              selectedCountry={country}
              onSelectCountry={(cc) => setSearch({ country: cc })}
              layer={mapLayer}
              onLayerChange={setMapLayer}
              memberCities={memberMapCities}
              publicCountries={publicRealtimeQ.data?.countries ?? []}
              publicCities={publicRealtimeQ.data?.cities ?? []}
              publicOnline={publicOnline}
              publicStale={Boolean(publicRealtimeQ.data && !publicRealtimeQ.data.ok)}
              updatedAt={publicRealtimeQ.dataUpdatedAt || realtimeQ.dataUpdatedAt || null}
              onOpenVisitorAtCity={(city) => {
                const rows = (publicVisitorsQ.data ?? []) as unknown as SupabaseVisitorRow[];
                const match = rows.find((r) => r.status === "live" && (r.city ?? null) === city.city && (r.country_code ?? null) === city.country_code)
                  ?? rows.find((r) => (r.city ?? null) === city.city && (r.country_code ?? null) === city.country_code);
                if (match) setVisitorDrawerId(match.journey_id);
              }}
            />
          </div>
          <div className="xl:col-span-4">
            <RealtimeSummaryCard
              data={realtimeQ.data}
              loading={realtimeQ.isLoading}
              publicSummary={{
                online_now: ((publicVisitorsQ.data ?? []) as unknown as SupabaseVisitorRow[]).filter((v) => v.status === "live").length,
                events_30m: ((publicVisitorsQ.data ?? []) as unknown as Array<SupabaseVisitorRow & { event_count?: number }>).reduce((s, v) => s + (v.event_count ?? 0), 0),
                last_event_at: publicHealthQ.data?.supabase_live.last_journey_at ?? null,
                stale: publicHealthQ.data?.supabase_live.stale ?? false,
              }}
            />
          </div>
        </div>

        {/* ── Zone 5 · Online now (1/2) + Pages being viewed now (1/2) ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <LiveActivityRail
            className="h-full w-full"
            members={onlineQ.data?.users ?? []}
            memberPages={currentQ.data?.pages ?? []}
            membersLoading={onlineQ.isLoading}
            publicRealtime={publicRealtimeQ.data ?? null}
            publicLoading={publicRealtimeQ.isLoading}
            realtime={realtimeQ.data}
            updatedAt={publicVisitorsQ.dataUpdatedAt || publicRealtimeQ.dataUpdatedAt || realtimeQ.dataUpdatedAt || null}
            supabaseVisitors={(publicVisitorsQ.data ?? []) as unknown as SupabaseVisitorRow[]}
            supabaseVisitorsLoading={publicVisitorsQ.isLoading}
            onOpenVisitor={(id) => setVisitorDrawerId(id)}
          />
          <PagesBeingViewedNow
            memberPages={currentQ.data?.pages ?? []}
            publicVisitors={((publicVisitorsQ.data ?? []) as unknown as SupabaseVisitorRow[]).map((v) => ({
              latest_path: v.latest_path ?? null,
              status: v.status,
              last_seen_at: v.last_seen_at,
            }))}
            loading={currentQ.isLoading || publicVisitorsQ.isLoading}
          />
        </div>

        {/* ── Zone 6 + 7 · Needs attention (1/2) + 24h analytics summary (1/2) ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <NeedsAttentionPanel rows={attentionRows} loading={attentionQ.isLoading} maxRows={5} />
          <section className="rounded-[18px] border border-reps-border bg-reps-panel p-4">
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[14px] font-semibold text-white">24h analytics summary</h2>
                <span className="text-[10.5px] text-white/45">Historical data · 7-day rollup</span>
              </div>
            </header>
            <AnalyticsStrip tiles={analyticsTiles} />
          </section>
        </div>

        {/* ── Recent activity strip (compact horizontal feed) ── */}
        <section className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
          <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="font-display text-[13.5px] font-semibold text-white">Recent activity</h2>
              <span className="truncate text-[10.5px] text-white/45">
                Latest events in your system
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFeedOpen(true)}
              className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
            >
              View full feed <ChevronRight className="h-3 w-3" />
            </button>
          </header>
          <div>
            <ActivityFeedV2 compact events={compactEvents} loading={feedQ.isLoading} onOpenEvent={(e) => setSelectedEvent(e)} />
          </div>
        </section>

        {/* ── Secondary (below the fold): member activity + public analytics rollup ── */}
        <details className="group rounded-[18px] border border-reps-border bg-reps-panel/60">
          <summary className="cursor-pointer list-none px-4 py-3 text-[12px] font-medium text-white/70 hover:text-white">
            <span className="inline-flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 transition group-open:rotate-90" />
              Historical analytics · member activity, top pages, public rollup
            </span>
          </summary>
          <div className="space-y-4 border-t border-reps-border/70 p-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <TopMemberPagesPanel
                  pages={topQ.data?.pages ?? []}
                  loading={topQ.isLoading}
                  window={topWindow}
                  onWindowChange={setTopWindow}
                />
              </div>
              <div className="xl:col-span-5">
                <GeoPanel
                  countries={geoQ.data?.countries ?? []}
                  loading={geoQ.isLoading}
                  selectedCountry={country}
                  onSelectCountry={(cc) => setSearch({ country: cc })}
                />
              </div>
            </div>
            <PublicVisitorsPanel />
          </div>
        </details>


        {/* ── 6. DIAGNOSTICS (collapsed by default) ── */}
        <DiagnosticsDrawer
          ingestStatus={ingestStatus}
          degradedPanels={[...degraded.map((d) => d.panel), ...feedDegraded]}
          slowPanels={slow}
          lastJourneyAt={publicHealthQ.data?.supabase_live.last_journey_at ?? null}
          publicOnline={publicOnline}
          membersOnline={membersOnline}
        />

      </div>

      <EventDetailSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <PublicVisitorDrawer journeyId={visitorDrawerId} onClose={() => setVisitorDrawerId(null)} />

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

function BackfillGeoButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = useServerFn(runGeoBackfill);
  const onClick = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await run({ data: { days: 30 } });
      setMsg(`ok ${r.rows_updated}u · ${r.unique_ips}ips · ${r.cache_hits}hit · ${r.provider_calls}call`);
    } catch (e) {
      setMsg("failed");
      console.error(e);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 8000);
    }
  }, [run]);
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
        {busy ? "Backfilling…" : "Backfill geo"}
      </Button>
      {msg ? <span className="text-[10.5px] text-white/60">{msg}</span> : null}
    </div>
  );
}




