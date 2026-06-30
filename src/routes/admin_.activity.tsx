// /admin/activity — World-class activity console.
// 4 tabs (Live · Page views · Sign-ins · Online now) with a sticky KPI strip,
// an hourly traffic sparkline, and a right rail of top pages / referrers /
// devices / countries. All data is admin-only and excludes /admin/* paths
// from public aggregates so admin browsing doesn't pollute analytics.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  Activity as ActivityIcon,
  Users,
  MousePointerClick,
  LogIn,
  Globe2,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  ExternalLink,
} from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  getActivityKpis,
  getActivityFeed,
  getActivityAggregates,
  getOnlineNow,
  getHourlyTraffic,
  type ActivityKpis,
  type ActivityFeedRow,
  type ActivityAggregates,
  type OnlineRow,
  type HourBucket,
} from "@/lib/admin/activity.functions";

const TAB_VALUES = ["live", "pageviews", "auth", "online"] as const;
type TabValue = (typeof TAB_VALUES)[number];

const searchSchema = z.object({
  tab: z.enum(TAB_VALUES).optional(),
  range: z.coerce.number().int().min(1).max(168).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/admin_/activity")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Activity — REPS Admin" },
      { name: "description", content: "Live activity, sign-ins, page views and visitors." },
    ],
  }),
  component: ActivityConsole,
});

function ActivityConsole() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab: TabValue = search.tab ?? "live";
  const range = search.range ?? 24;
  const q = search.q ?? "";

  const setTab = (next: TabValue) => navigate({ search: { ...search, tab: next } });
  const setRange = (next: number) => navigate({ search: { ...search, range: next } });
  const setQ = (next: string) => navigate({ search: { ...search, q: next || undefined } });

  const kpisFn = useServerFn(getActivityKpis);
  const aggFn = useServerFn(getActivityAggregates);
  const hourlyFn = useServerFn(getHourlyTraffic);

  const kpisQ = useQuery<ActivityKpis>({
    queryKey: ["admin", "activity", "kpis"],
    queryFn: () => kpisFn(),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
  const aggQ = useQuery<ActivityAggregates>({
    queryKey: ["admin", "activity", "agg", range],
    queryFn: () => aggFn({ data: { rangeHours: range } }),
    refetchInterval: 60_000,
  });
  const hourlyQ = useQuery<HourBucket[]>({
    queryKey: ["admin", "activity", "hourly"],
    queryFn: () => hourlyFn(),
    refetchInterval: 60_000,
  });

  return (
    <DashboardShell
      role="admin"
      active="Activity"
      title="Activity"
      subtitle="Real-time sessions, sign-ins, page views and visitor analytics."
    >
      <KpiStrip data={kpisQ.data} loading={kpisQ.isLoading} />
      <HourlySpark data={hourlyQ.data} loading={hourlyQ.isLoading} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <TabsList className="bg-reps-panel border border-reps-border h-auto p-1">
              <TabsTrigger value="live" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
                <ActivityIcon className="h-4 w-4" /> Live feed
              </TabsTrigger>
              <TabsTrigger value="pageviews" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
                <MousePointerClick className="h-4 w-4" /> Page views
              </TabsTrigger>
              <TabsTrigger value="auth" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
                <LogIn className="h-4 w-4" /> Sign-ins
              </TabsTrigger>
              <TabsTrigger value="online" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
                <Users className="h-4 w-4" /> Online now
              </TabsTrigger>
            </TabsList>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RangeChips value={range} onChange={setRange} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter path or email…"
                className="h-9 max-w-xs bg-reps-panel border-reps-border text-white placeholder:text-white/40"
              />
            </div>

            <TabsContent value="live" className="mt-4">
              <FeedTab kind="all" range={range} q={q} />
            </TabsContent>
            <TabsContent value="pageviews" className="mt-4">
              <FeedTab kind="page_view" range={range} q={q} />
            </TabsContent>
            <TabsContent value="auth" className="mt-4">
              <FeedTab kind="auth" range={range} q={q} />
            </TabsContent>
            <TabsContent value="online" className="mt-4">
              <OnlineTab />
            </TabsContent>
          </Tabs>
        </div>

        <RightRail data={aggQ.data} loading={aggQ.isLoading} />
      </div>
    </DashboardShell>
  );
}

// ---------------------------------------------------------------------------
// KPI strip
// ---------------------------------------------------------------------------

function KpiStrip({ data, loading }: { data?: ActivityKpis; loading: boolean }) {
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-panel/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-white/55">Last 24 hours · live</div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Auto-refresh
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <Kpi label="Online now" value={loading ? "—" : String(data!.onlineNow)} accent="emerald" />
        <Kpi label="Sessions" value={loading ? "—" : String(data!.sessions24h)} />
        <Kpi label="Page views" value={loading ? "—" : String(data!.pageViews24h)} />
        <Kpi label="Unique visitors" value={loading ? "—" : String(data!.uniqueVisitors24h)} accent="orange" />
        <Kpi label="Sign-ins" value={loading ? "—" : String(data!.signins24h)} />
        <Kpi label="Failed sign-ins" value={loading ? "—" : String(data!.signinsFailed24h)} accent={data && data.signinsFailed24h > 0 ? "amber" : undefined} />
        <Kpi label="New signups" value={loading ? "—" : String(data!.newSignups24h)} />
        <Kpi label="Top country" value={loading ? "—" : data!.topCountry24h ?? "—"} />
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "orange" | "emerald" | "amber" | "red" }) {
  const tone =
    accent === "orange" ? "text-reps-orange" :
    accent === "emerald" ? "text-emerald-300" :
    accent === "amber" ? "text-amber-300" :
    accent === "red" ? "text-red-300" :
    "text-white";
  return (
    <div className="rounded-[10px] border border-reps-border bg-reps-panel p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/55">{label}</div>
      <div className={cn("mt-1 text-[20px] font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hourly traffic sparkline (last 24h)
// ---------------------------------------------------------------------------

function HourlySpark({ data, loading }: { data?: HourBucket[]; loading: boolean }) {
  if (loading) return <Skeleton className="mt-4 h-24 rounded-[12px] bg-reps-panel/60" />;
  if (!data || data.length === 0) return null;
  const maxV = Math.max(1, ...data.map((d) => d.views));
  return (
    <div className="mt-4 rounded-[12px] border border-reps-border bg-reps-panel/60 p-4">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-white/55">
        <span>Page views · last 24h</span>
        <span className="text-white/45">peak {maxV}</span>
      </div>
      <div className="flex h-20 items-end gap-1">
        {data.map((b) => {
          const h = Math.max(2, Math.round((b.views / maxV) * 76));
          const label = new Date(b.hour).toLocaleTimeString("en-GB", { hour: "2-digit" });
          return (
            <div key={b.hour} className="flex flex-1 flex-col items-center gap-1" title={`${label} · ${b.views} views, ${b.visitors} visitors`}>
              <div className="w-full rounded-sm bg-reps-orange/80 hover:bg-reps-orange" style={{ height: `${h}px` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/40">
        <span>24h ago</span><span>now</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Range chips
// ---------------------------------------------------------------------------

function RangeChips({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const opts: Array<{ v: number; label: string }> = [
    { v: 1, label: "1h" },
    { v: 24, label: "24h" },
    { v: 72, label: "3d" },
    { v: 168, label: "7d" },
  ];
  return (
    <div className="inline-flex rounded-md border border-reps-border bg-reps-panel p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "px-2.5 py-1 text-xs rounded",
            value === o.v ? "bg-reps-orange-soft text-reps-orange" : "text-white/65 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed tab (live / pageviews / auth)
// ---------------------------------------------------------------------------

function FeedTab({ kind, range, q }: { kind: "all" | "page_view" | "auth"; range: number; q: string }) {
  const fn = useServerFn(getActivityFeed);
  const query = useQuery<ActivityFeedRow[]>({
    queryKey: ["admin", "activity", "feed", kind, range, q],
    queryFn: () => fn({ data: { rangeHours: range, kind, search: q || undefined, limit: 200 } }),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  return (
    <TableShell loading={query.isLoading} empty={!query.isLoading && (query.data?.length ?? 0) === 0}>
      <table className="w-full text-[13px]">
        <thead className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/55">
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Event</Th>
            <Th>Where</Th>
            <Th>Device</Th>
          </tr>
        </thead>
        <tbody>
          {(query.data ?? []).map((r) => (
            <tr key={r.id} className="border-b border-reps-border/60 hover:bg-white/[0.02]">
              <Td className="text-white/70 whitespace-nowrap">{formatTime(r.createdAt)}</Td>
              <Td>
                {r.userId ? (
                  <Link
                    to="/admin/members/$userId"
                    params={{ userId: r.userId }}
                    className="text-white hover:text-reps-orange"
                  >
                    {r.userName ?? r.userEmail ?? "Member"}
                  </Link>
                ) : (
                  <span className="text-white/55">Anonymous</span>
                )}
                {r.userEmail && r.userName && (
                  <div className="text-[11px] text-white/45">{r.userEmail}</div>
                )}
              </Td>
              <Td>
                <EventCell row={r} />
              </Td>
              <Td className="text-white/70">
                <GeoCell country={r.countryCode} city={r.city} />
              </Td>
              <Td>
                <DeviceCell device={r.device} browser={r.browser} os={r.os} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

function EventCell({ row }: { row: ActivityFeedRow }) {
  if (row.kind === "page_view") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-reps-border bg-white/[0.04] text-white/70">view</Badge>
        <span className="truncate text-white/85" title={row.path ?? undefined}>{row.path}</span>
        {row.isAdminView && <Badge className="bg-reps-orange-soft text-reps-orange border-0">admin</Badge>}
      </div>
    );
  }
  const tone =
    row.event === "sign_in_failed" ? "bg-red-500/15 text-red-300 border-red-500/30" :
    row.event === "sign_in"        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
    row.event === "sign_out"       ? "bg-white/[0.06] text-white/70 border-reps-border" :
                                     "bg-white/[0.06] text-white/70 border-reps-border";
  return (
    <Badge variant="outline" className={tone}>{row.event.replace(/_/g, " ")}</Badge>
  );
}

function GeoCell({ country, city }: { country: string | null; city: string | null }) {
  if (!country && !city) return <span className="text-white/40">—</span>;
  const flag = country ? countryFlag(country) : "";
  return (
    <span className="inline-flex items-center gap-1.5">
      {flag && <span aria-hidden>{flag}</span>}
      <span>{city ? `${city}${country ? ", " + country : ""}` : country}</span>
    </span>
  );
}

function DeviceCell({ device, browser, os }: { device: string | null; browser: string | null; os: string | null }) {
  const Icon =
    device === "mobile" ? Smartphone :
    device === "tablet" ? Tablet :
    device === "bot" ? Bot :
    Monitor;
  return (
    <span className="inline-flex items-center gap-1.5 text-white/75">
      <Icon className="h-3.5 w-3.5 text-white/50" />
      <span className="text-[12px]">{[browser, os].filter(Boolean).join(" · ") || (device ?? "—")}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Online now tab
// ---------------------------------------------------------------------------

function OnlineTab() {
  const fn = useServerFn(getOnlineNow);
  const query = useQuery<OnlineRow[]>({
    queryKey: ["admin", "activity", "online"],
    queryFn: () => fn(),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  return (
    <TableShell loading={query.isLoading} empty={!query.isLoading && (query.data?.length ?? 0) === 0} emptyMessage="No one online right now.">
      <table className="w-full text-[13px]">
        <thead className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/55">
          <tr>
            <Th>Last seen</Th>
            <Th>Who</Th>
            <Th>Current page</Th>
            <Th>Pages</Th>
            <Th>Where</Th>
            <Th>Device</Th>
          </tr>
        </thead>
        <tbody>
          {(query.data ?? []).map((r) => (
            <tr key={r.sessionId} className="border-b border-reps-border/60 hover:bg-white/[0.02]">
              <Td className="text-white/70 whitespace-nowrap">{formatRelative(r.lastSeenAt)}</Td>
              <Td>
                {r.userId ? (
                  <Link to="/admin/members/$userId" params={{ userId: r.userId }} className="text-white hover:text-reps-orange">
                    {r.userName ?? r.userEmail ?? "Member"}
                  </Link>
                ) : (
                  <span className="text-white/55">Anonymous</span>
                )}
                {r.isAdminView && <Badge className="ml-2 bg-reps-orange-soft text-reps-orange border-0">admin</Badge>}
              </Td>
              <Td className="text-white/80">
                {r.currentPath ? (
                  <a href={r.currentPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-reps-orange">
                    {r.currentPath} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : <span className="text-white/40">—</span>}
              </Td>
              <Td className="tabular-nums text-white/70">{r.pagesViewed}</Td>
              <Td className="text-white/70"><GeoCell country={r.countryCode} city={r.city} /></Td>
              <Td><DeviceCell device={r.device} browser={r.browser} os={r.os} /></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

// ---------------------------------------------------------------------------
// Right rail
// ---------------------------------------------------------------------------

function RightRail({ data, loading }: { data?: ActivityAggregates; loading: boolean }) {
  return (
    <div className="space-y-4">
      <RailCard title="Top pages" icon={<MousePointerClick className="h-4 w-4" />} loading={loading} buckets={data?.topPaths} />
      <RailCard title="Top referrers" icon={<Globe2 className="h-4 w-4" />} loading={loading} buckets={data?.topReferrers} />
      <RailCard title="Devices" icon={<Monitor className="h-4 w-4" />} loading={loading} buckets={data?.byDevice} />
      <RailCard title="Browsers" icon={<Globe2 className="h-4 w-4" />} loading={loading} buckets={data?.byBrowser} />
      <RailCard title="Countries" icon={<Globe2 className="h-4 w-4" />} loading={loading} buckets={data?.byCountry?.map((b) => ({ ...b, key: `${countryFlag(b.key)}  ${b.key}` }))} />
    </div>
  );
}

function RailCard({ title, icon, buckets, loading }: { title: string; icon: React.ReactNode; buckets?: { key: string; count: number }[]; loading: boolean }) {
  const max = Math.max(1, ...(buckets?.map((b) => b.count) ?? [1]));
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-panel/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/55">
        {icon}{title}
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 bg-white/[0.06]" />
          <Skeleton className="h-3 bg-white/[0.06]" />
          <Skeleton className="h-3 bg-white/[0.06]" />
        </div>
      ) : !buckets || buckets.length === 0 ? (
        <div className="text-[12px] text-white/45">No data yet.</div>
      ) : (
        <div className="space-y-1.5">
          {buckets.map((b) => (
            <div key={b.key} className="space-y-0.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="truncate pr-2 text-white/80" title={b.key}>{b.key}</span>
                <span className="tabular-nums text-white/60">{b.count}</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.05]">
                <div className="h-1 rounded-full bg-reps-orange/70" style={{ width: `${Math.round((b.count / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function TableShell({ children, loading, empty, emptyMessage = "Nothing to show yet." }: { children: React.ReactNode; loading: boolean; empty: boolean; emptyMessage?: string }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-reps-border bg-reps-panel/40">
      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 bg-white/[0.04]" />)}
        </div>
      ) : empty ? (
        <div className="p-8 text-center text-sm text-white/55">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-top", className)}>{children}</td>;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatRelative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.max(1, Math.floor(ms / 1000))}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
}

function countryFlag(cc: string) {
  if (!cc || cc.length !== 2) return "";
  const A = 0x1f1e6;
  const codes = cc.toUpperCase().split("").map((c) => A + (c.charCodeAt(0) - 65));
  try { return String.fromCodePoint(...codes); } catch { return ""; }
}

// Avoid unused-import warnings for `useMemo` from earlier iterations.
void useMemo;
