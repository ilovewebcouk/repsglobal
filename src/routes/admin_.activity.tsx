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
import { AlertTriangle, ChevronRight, Filter, X } from "lucide-react";
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
import { CommandStrip } from "@/components/admin/activity/CommandStrip";
import { LiveActivityRail, type SupabaseVisitorRow } from "@/components/admin/activity/LiveActivityRail";
import { RealtimeSummaryCard } from "@/components/admin/activity/RealtimeSummaryCard";
import { PublicVisitorDrawer } from "@/components/admin/activity/PublicVisitorDrawer";
import { getPublicVisitorsLive, getPublicIngestHealth } from "@/lib/activity/live-visitors.functions";

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

  // ── Queries — realtime queries poll fast (5–8s); heavier aggregates poll slower.
  const realtimeQ = useQuery({ queryKey: ["a-realtime"], queryFn: () => runRealtime(), refetchInterval: 6_000 });
  const kpisQ = useQuery({ queryKey: ["a-kpis"], queryFn: () => runKpis(), refetchInterval: 30_000 });
  const publicRealtimeQ = useQuery({
    queryKey: ["a-public-realtime"],
    queryFn: () => runPublicRealtime(),
    refetchInterval: 6_000, // server TTL 5s → poll every ~6s for a live feel
  });
  const publicVisitorsQ = useQuery({
    queryKey: ["a-public-visitors-live"],
    queryFn: () => runPublicVisitorsLive({ data: { limit: 50 } }),
    refetchInterval: 8_000,
  });
  const publicHealthQ = useQuery({
    queryKey: ["a-public-health"],
    queryFn: () => runPublicIngestHealth(),
    refetchInterval: 20_000,
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

  // High-value events today = enquiries + signup completes from kpi tiles if available;
  // otherwise fall back to a simple sum from feed events (auth signup, enquiry sources).
  const highValueToday = useMemo(() => {
    const tiles = kpisQ.data?.tiles ?? [];
    const enq = tiles.find((t) => t.key.includes("enquir"))?.value ?? 0;
    const sig = tiles.find((t) => t.key.includes("signup") || t.key.includes("new_member"))?.value ?? 0;
    return Number(enq) + Number(sig);
  }, [kpisQ.data]);

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
      <BackfillGeoButton />
    </>
  );

  return (
    <DashboardShell
      role="admin"
      active="Activity"
      title="Activity"
      subtitle="Realtime command centre"
      actions={<div className="hidden items-center gap-2 lg:flex">{controls}</div>}
    >

      <div className="mx-auto max-w-[1500px] space-y-3 px-4 pb-6 md:px-6">
        {/* Desktop controls live in the shell header; mobile keeps them compact here. */}
        <header className="flex flex-wrap items-center justify-end gap-2 lg:hidden">
          {controls}
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

        {/* ── 1. COMMAND STRIP ── */}
        <CommandStrip
          publicOnline={publicOnline}
          membersOnline={membersOnline}
          pageViews5m={pageViews5m}
          highValueToday={highValueToday}
          attentionCount={attentionCount}
          criticalCount={criticalCount}
          ingestStatus={ingestStatus}
          loading={publicRealtimeQ.isLoading && realtimeQ.isLoading}
        />

        {/* ── 2. REALTIME SUMMARY (Supabase live) + Live rail ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <RealtimeSummaryCard
              data={realtimeQ.data}
              loading={realtimeQ.isLoading}
              publicSummary={{
                online_now: (publicVisitorsQ.data ?? []).filter((v: SupabaseVisitorRow) => v.status === "live").length,
                events_30m: (publicVisitorsQ.data ?? []).reduce((s: number, v: SupabaseVisitorRow & { event_count?: number }) => s + (v.event_count ?? 0), 0),
                last_event_at: publicHealthQ.data?.supabase_live.last_journey_at ?? null,
                stale: publicHealthQ.data?.supabase_live.stale ?? false,
              }}
            />
          </div>
          <div className="flex xl:col-span-4">
            <LiveActivityRail
              className="h-full w-full"
              members={onlineQ.data?.users ?? []}
              memberPages={currentQ.data?.pages ?? []}
              membersLoading={onlineQ.isLoading}
              publicRealtime={publicRealtimeQ.data ?? null}
              publicLoading={publicRealtimeQ.isLoading}
              realtime={realtimeQ.data}
              updatedAt={publicVisitorsQ.dataUpdatedAt || publicRealtimeQ.dataUpdatedAt || realtimeQ.dataUpdatedAt || null}
              supabaseVisitors={(publicVisitorsQ.data ?? []) as SupabaseVisitorRow[]}
              supabaseVisitorsLoading={publicVisitorsQ.isLoading}
              onOpenVisitor={(id) => setVisitorDrawerId(id)}
            />
          </div>
          <div className="flex flex-col gap-4 xl:col-span-4">
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
            />
            <NeedsAttentionPanel rows={attentionRows} loading={attentionQ.isLoading} maxRows={5} />
          </div>
        </div>


        {/* ── 3. PUBLIC ANALYTICS · 24h rollup ── */}
        <PublicVisitorsPanel />

        {/* ── 4. MEMBER ACTIVITY (secondary) ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <h2 className="font-display text-[14px] font-semibold text-white">Member activity</h2>
            <span className="text-[11px] text-white/45">Logged-in members only</span>
          </div>
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
        </section>

        {/* ── 5. RECENT ACTIVITY (audit feed — below the fold) ── */}
        <section className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
          <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white/40" />
              <h2 className="font-display text-[13.5px] font-semibold text-white">Recent activity</h2>
              <span className="truncate text-[10.5px] text-white/45">
                Latest {compactEvents.length} of {events.length} · {range.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFeedOpen(true)}
              className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
            >
              Full feed <ChevronRight className="h-3 w-3" />
            </button>
          </header>
          <div>
            <ActivityFeedV2 compact events={compactEvents} loading={feedQ.isLoading} onOpenEvent={(e) => setSelectedEvent(e)} />
          </div>
        </section>


        {/* Footer meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-reps-border/60 pt-3 text-[10.5px] text-white/40">
          <span>
            {events.length} events in view · {publicOnline} public · {membersOnline} members online
          </span>
          <span>Public analytics consent-gated · country-level enrichment · no raw IPs</span>
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




