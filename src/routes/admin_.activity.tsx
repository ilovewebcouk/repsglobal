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
  getActivityKpis, getTopMemberPages, getGeoActivity, getNeedsAttention,
} from "@/lib/ops/activity-panels.functions";

// v5 — one canonical live source of truth. No PostHog anywhere on this page.
import {
  getActivityCommandCenter,
  type CommandCenterPayload,
} from "@/lib/activity/command-center.functions";

import {
  GeoPanel, TopMemberPagesPanel, NeedsAttentionPanel,
} from "@/components/admin/activity/panels";
import { ClientOnlyMap } from "@/components/admin/activity/WorldMapPanel";
import {
  ActivityFeedV2, EventDetailSheet,
} from "@/components/admin/activity/feed-and-sheet";
import { LiveActivityRail, type SupabaseVisitorRow } from "@/components/admin/activity/LiveActivityRail";
import { RealtimeSummaryCard } from "@/components/admin/activity/RealtimeSummaryCard";
import { PublicVisitorDrawer } from "@/components/admin/activity/PublicVisitorDrawer";
import { AnalyticsStrip, type AnalyticsSeries } from "@/components/admin/activity/AnalyticsStrip";
import { CompactStatusStrip } from "@/components/admin/activity/CompactStatusStrip";
import { PagesBeingViewedNow } from "@/components/admin/activity/PagesBeingViewedNow";
import { getPublicConversionsLive } from "@/lib/activity/live-visitors.functions";

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
  const runCommand = useServerFn(getActivityCommandCenter);
  const runKpis = useServerFn(getActivityKpis);
  const runTop = useServerFn(getTopMemberPages);
  const runGeo = useServerFn(getGeoActivity);
  const runAttention = useServerFn(getNeedsAttention);
  const runFeed = useServerFn(getActivityFeed);
  const runPublicConversions = useServerFn(getPublicConversionsLive);

  // ── ONE canonical live query. Everything on the "live" surface reads from
  // this payload so the numbers cannot disagree with each other.
  const ccQ = useQuery<CommandCenterPayload>({
    queryKey: ["a-command-center"],
    queryFn: () => runCommand(),
    refetchInterval: 6_000,
  });
  const cc = ccQ.data;

  // ── Slower / secondary queries (unchanged sources — Supabase only).
  const kpisQ = useQuery({ queryKey: ["a-kpis"], queryFn: () => runKpis(), refetchInterval: 30_000 });
  const topQ = useQuery({ queryKey: ["a-top", topWindow], queryFn: () => runTop({ data: { limit: 10, hours: topWindow } }), refetchInterval: 60_000 });
  const geoQ = useQuery({ queryKey: ["a-geo"], queryFn: () => runGeo(), refetchInterval: 20_000 });
  const attentionQ = useQuery({ queryKey: ["a-attention"], queryFn: () => runAttention(), refetchInterval: 30_000 });

  const KEY_ACTIONS = new Set(["enquiry_started", "enquiry_created", "signup_started", "checkout_started", "signup_complete"]);
  const conversionsQ = useQuery({
    queryKey: ["a-public-conversions"],
    queryFn: () => runPublicConversions({ data: { limit: 100 } }).catch(() => [] as Array<{ event_kind: string; occurred_at: string }>),
    refetchInterval: 30_000,
    retry: false,
  });

  const feedQ = useQuery({
    queryKey: ["a-feed", source ?? "all", severity ?? "all", range.hours],
    queryFn: () => runFeed({ data: { limit: 200, since_hours: range.hours, source, severity } }),
    refetchInterval: 15_000,
  });

  // ── Adapt command-centre payload into the shapes existing components expect.
  const supabaseVisitorRows: SupabaseVisitorRow[] = useMemo(() => {
    return (cc?.public_live ?? []).map((v) => ({
      journey_id: v.journey_id,
      session_id: v.session_id,
      user_id: v.user_id,
      member_name: v.member_name,
      masked_ip: v.masked_ip,
      city: v.city,
      region: v.region,
      country_code: v.country_code,
      latest_path: v.latest_path,
      latest_event: v.latest_event,
      path_history: v.path_history,
      referrer: v.referrer,
      source: v.source,
      first_seen_at: v.first_seen_at,
      last_seen_at: v.last_seen_at,
      status: v.status === "live" ? "live" : "stale",
    }));
  }, [cc?.public_live]);

  const onlineMembers = useMemo(() => (cc?.members_live ?? []).map((m) => ({
    session_id: m.session_id,
    user_id: m.user_id,
    name: m.name,
    email: m.email,
    avatar_url: m.avatar_url,
    current_path: m.current_path,
    device: m.device,
    browser: m.browser,
    country_code: m.country_code,
    city: m.city,
    region: m.region,
    latitude: m.latitude,
    longitude: m.longitude,
    started_at: m.started_at,
    last_seen_at: m.last_seen_at,
    pages_viewed: 0,
    tier: null,
    badges: [] as string[],
  })), [cc?.members_live]);

  const currentPages = useMemo(() => (cc?.pages_being_viewed_now ?? []).map((p) => ({
    path: p.path,
    online_count: p.total,
    avatars: p.member_avatars,
    views_24h: 0,
    trend_pct: null,
  })), [cc?.pages_being_viewed_now]);

  // Realtime card wants the old `RealtimeSummary` shape — adapt from cc slice.
  const realtimeForCard = useMemo(() => {
    if (!cc) return undefined;
    const r = cc.realtime_summary;
    return {
      online_now: r.members_now,
      members_last_30min: r.members_now,
      activity_last_30min: r.events_30m,
      per_minute: r.per_minute,
      devices: r.devices,
      sign_ins_today: 0,
      member_views_24h: 0,
      new_members_24h: 0,
      generated_at: r.updated_at,
      scope_label: "Public visitors (Supabase visitor_journeys) + logged-in members (user_sessions).",
    };
  }, [cc]);

  const memberMapCities = useMemo(() => {
    return (cc?.map_markers ?? [])
      .filter((m) => m.members > 0)
      .map((m) => ({
        city: m.city ?? "",
        region: m.region,
        country_code: m.country_code,
        latitude: m.latitude,
        longitude: m.longitude,
        online: m.members,
      }));
  }, [cc?.map_markers]);

  const publicMapCities = useMemo(() => {
    return (cc?.map_markers ?? [])
      .filter((m) => m.public > 0)
      .map((m) => ({
        city: m.city ?? "",
        country_code: m.country_code,
        latitude: m.latitude,
        longitude: m.longitude,
        online_now: m.public,
      }));
  }, [cc?.map_markers]);

  const events = useMemo(() => {
    const list = feedQ.data?.events ?? [];
    if (!country) return list;
    const usersInCountry = new Set(onlineMembers.filter((u) => u.country_code === country).map((u) => u.user_id).filter(Boolean));
    return list.filter((e) => e.user_id && usersInCountry.has(e.user_id));
  }, [feedQ.data, country, onlineMembers]);

  const compactEvents = useMemo(() => events.slice(0, 8), [events]);

  // ── Command strip metrics — one source: `cc.live_now`.
  const publicOnline = cc?.live_now.public ?? 0;
  const membersOnline = cc?.live_now.members ?? 0;
  const attentionRows = attentionQ.data?.rows ?? [];
  const attentionCount = attentionRows.length;
  const criticalCount = attentionRows.filter((r) => r.severity === "critical").length;

  // Amendment 1 — "Key actions today" counts commercial events only.
  const keyActionsToday = useMemo(() => {
    const rows = (conversionsQ.data ?? []) as Array<{ event_kind: string; occurred_at: string }>;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const cutoff = startOfDay.getTime();
    return rows.filter((r) => KEY_ACTIONS.has(r.event_kind) && new Date(r.occurred_at).getTime() >= cutoff).length;
  }, [conversionsQ.data]);

  const publicStale = Boolean(cc?.stale);
  const ingestStatus: "healthy" | "degraded" | "down" =
    ccQ.error ? "down"
    : publicStale ? "degraded"
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
      { label: "Visitors 7d", value: visitorsSeries.reduce((s, n) => s + n, 0), series: visitorsSeries, color: "#38BDF8" },
      { label: "Signups 7d", value: signupsSeries.reduce((s, n) => s + n, 0), series: signupsSeries, color: "#F97316" },
      { label: "Conversions 7d", value: conversionsSeries.reduce((s, n) => s + n, 0), series: conversionsSeries, color: "#22D3EE" },
      { label: "Enquiries 7d", value: enquiriesSeries.reduce((s, n) => s + n, 0), series: enquiriesSeries, color: "#A78BFA" },
      { label: "Checkouts 7d", value: checkoutSeries.reduce((s, n) => s + n, 0), series: checkoutSeries, color: "#34D399" },
    ];
  }, [conversionsQ.data]);

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

        {/* ── Hero line · plain-English state sentence ── */}
        <p className="px-1 text-[12.5px] text-white/60">
          {(() => {
            const liveNow = publicOnline + membersOnline;
            const parts: string[] = [];
            parts.push(liveNow > 0
              ? `${liveNow} live now — ${publicOnline} public · ${membersOnline} members.`
              : "It's quiet — no one is on the site right now.");
            if (criticalCount > 0) parts.push(`${criticalCount} critical action${criticalCount === 1 ? "" : "s"} need attention.`);
            else if (attentionCount > 0) parts.push(`${attentionCount} item${attentionCount === 1 ? "" : "s"} in the action queue.`);
            if (publicStale) parts.push("Public ingest is quiet — no recent hits.");
            return parts.join(" ");
          })()}
        </p>

        {/* ── Zone 3 · COMPACT STATUS STRIP (six tiles) ── */}
        <CompactStatusStrip
          publicLive={publicOnline}
          membersLive={membersOnline}
          keyActionsToday={keyActionsToday}
          criticalCount={criticalCount}
          warningCount={Math.max(0, attentionCount - criticalCount)}
          health={ingestStatus === "down" ? "broken" : ingestStatus}
          ingestStale={publicStale}
        />

        {/* ── Zone 4 · Needs attention (promoted — action first) ── */}
        <NeedsAttentionPanel rows={attentionRows} loading={attentionQ.isLoading} maxRows={5} />

        {/* ── Zone 5 · Live map (2/3, height-capped) + Realtime Summary (1/3) ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="max-h-[600px] overflow-hidden rounded-[18px]">
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

        {/* ── Zone 6 · Online now (1/2) + Pages being viewed now (1/2) ── */}
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

        {/* ── Zone 7 · Recent activity (1/2) + Last 7 days (1/2) ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <section className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
            <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="font-display text-[13.5px] font-semibold text-white">Recent activity</h2>
                <span className="truncate text-[10.5px] text-white/45">Latest events in your system</span>
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
          <section className="rounded-[18px] border border-reps-border bg-reps-panel p-4">
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[14px] font-semibold text-white">Last 7 days</h2>
                <span className="text-[10.5px] text-white/45">Rolling 7-day snapshot</span>
              </div>
            </header>
            <AnalyticsStrip tiles={analyticsTiles} />
          </section>
        </div>

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





