// Admin — Public Visitor Analytics panel for /admin/activity.
// Combines Supabase rollups (24h/7d) with an admin-only PostHog realtime
// query (last 5 min). Realtime tiles are clearly labelled and separate
// from rollup tiles per Amendment (v1.1 Phase 5).

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe2, Search, TrendingUp, ExternalLink, AlertCircle, Radio, Eye } from "lucide-react";
import { getPublicAnalyticsSummary } from "@/lib/admin/public-analytics.functions";
import type { PublicRealtime } from "@/lib/admin/public-realtime.functions";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}


function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/5 p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-1 font-display text-[22px] font-bold text-white">{value}</div>
      {hint ? <div className="mt-0.5 text-[10.5px] text-white/45">{hint}</div> : null}
    </div>
  );
}

function TopList({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ key: string | number; count: number }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60">
        {icon}
        {title}
      </div>
      {items.length === 0 ? (
        <div className="py-4 text-center text-[11.5px] text-white/40">{emptyText}</div>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 6).map((item, i) => (
            <li
              key={`${item.key}-${i}`}
              className="flex items-center justify-between gap-2 rounded-[8px] px-2 py-1 text-[12px] text-white/80 hover:bg-white/5"
            >
              <span className="truncate">{String(item.key ?? "—")}</span>
              <span className="shrink-0 tabular-nums text-white/60">{fmt(item.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PublicVisitorsPanel({
  realtime = null,
  realtimeLoading = false,
}: {
  realtime?: PublicRealtime | null;
  realtimeLoading?: boolean;
} = {}) {

  const runSummary = useServerFn(getPublicAnalyticsSummary);
  const q = useQuery({
    queryKey: ["public-analytics-summary"],
    queryFn: () => runSummary(),
    refetchInterval: 60_000,
  });

  const data = q.data;
  const today = data?.today;
  const yesterday = data?.yesterday;
  const rollup = today ?? yesterday;

  return (
    <section
      className="rounded-[18px] border border-blue-400/25 bg-gradient-to-br from-blue-500/[0.06] to-white/[0.02] p-4"
      aria-label="Public visitor analytics"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-blue-500/20 text-blue-300">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-[16px] font-bold text-white">
              Public visitor analytics
            </h2>
            <p className="text-[11.5px] text-white/55">
              Anonymous website traffic — separate from member activity. Consent-gated.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10.5px] text-white/45">
          <span className="inline-flex h-2 w-2 rounded-full bg-blue-400" />
          Blue = public · Orange = members
        </div>
      </div>

      {/* Configured banner */}
      {!data?.configured ? (
        <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">PostHog not yet configured</div>
            <div className="mt-0.5 text-[11.5px] text-amber-100/80">
              Tables, consent banner, beacon, proxy and conversion pipeline are all shipped.
              Once <code className="rounded bg-amber-500/20 px-1 py-0.5 text-[10.5px]">POSTHOG_PUBLIC_KEY</code> +{" "}
              <code className="rounded bg-amber-500/20 px-1 py-0.5 text-[10.5px]">POSTHOG_PERSONAL_API_KEY</code>{" "}
              are added and cookie-banner copy approved, public visitor data will appear here.
            </div>
          </div>
        </div>
      ) : null}

      {/* ── REALTIME section (last 5 min, PostHog live) ── */}
      <div className="mb-4 rounded-[14px] border border-blue-400/30 bg-blue-500/[0.06] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider text-blue-200">
            <Radio className="h-3.5 w-3.5" />
            Realtime · last 5 min
          </div>
          {realtime && !realtime.ok ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
              Live query stale
            </span>
          ) : realtime?.ok ? (
            <span className="text-[10px] text-white/45">
              refreshed {new Date(realtime.fetched_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Kpi
            label="Public visitors online"
            value={realtimeLoading ? "…" : fmt(realtime?.online_now ?? 0)}
            hint="distinct sessions · 5 min"
          />
          <Kpi
            label="Page views (5 min)"
            value={realtimeLoading ? "…" : fmt(realtime?.page_views_5m ?? 0)}
            hint="realtime"
          />
          <Kpi
            label="Countries live"
            value={realtimeLoading ? "…" : fmt((realtime?.countries ?? []).filter((c) => c.online > 0).length)}
            hint="with visitors now"
          />
          <Kpi
            label="Ingest"
            value={realtime ? (realtime.ok ? "ok" : "error") : "…"}
            hint={realtime?.error ?? "live PostHog query"}
          />
        </div>
        {realtime?.current_pages && realtime.current_pages.length > 0 ? (
          <div className="mt-3 rounded-[10px] border border-white/10 bg-black/20 p-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/60">
              <Eye className="h-3 w-3" />
              Public pages being viewed now
            </div>
            <ul className="space-y-0.5">
              {realtime.current_pages.slice(0, 6).map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-2 text-[12px] text-white/80">
                  <span className="truncate font-mono text-[11.5px]">{p.path}</span>
                  <span className="shrink-0 tabular-nums text-white/55">{p.viewers} viewer{p.viewers === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* ── ROLLUP section (24h Supabase mirror) ── */}
      <div className="mb-2 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider text-white/60">
        <TrendingUp className="h-3.5 w-3.5" />
        Rollup · last 24h
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">

        <Kpi
          label="Public page views 24h"
          value={fmt(rollup?.public_page_views ?? 0)}
          hint={today ? "today" : yesterday ? "yesterday" : "no data yet"}
        />
        <Kpi
          label="Unique sessions 24h"
          value={fmt(rollup?.public_unique_sessions ?? 0)}
          hint={today ? "today" : "yesterday"}
        />
        <Kpi
          label="Public profile views 24h"
          value={fmt(rollup?.public_profile_views ?? 0)}
          hint="rollup"
        />
        <Kpi
          label="Enquiries created 24h"
          value={fmt(data?.conversions_24h.enquiries_created ?? 0)}
          hint={`${data?.conversions_24h.total ?? 0} conversions today`}
        />
      </div>

      {/* Secondary KPI row */}
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Directory searches 24h" value={fmt(rollup?.directory_searches ?? 0)} hint="rollup" />
        <Kpi label="No-result searches 24h" value={fmt(rollup?.searches_no_results ?? 0)} hint="needs attention" />
        <Kpi label="Result clicks 24h" value={fmt(rollup?.result_clicks ?? 0)} hint="rollup" />
        <Kpi label="Signup starts 24h" value={fmt(data?.conversions_24h.signup_starts ?? 0)} hint="rollup" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Checkout starts 24h" value={fmt(data?.conversions_24h.checkout_starts ?? 0)} hint="rollup" />
        <Kpi label="Signup completes 24h" value={fmt(data?.conversions_24h.signup_completes ?? 0)} hint="rollup" />
      </div>




      {/* Top lists */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <TopList
          title="Top public pages"
          icon={<ExternalLink className="h-3 w-3" />}
          items={rollup?.top_pages ?? []}
          emptyText="No page views yet"
        />
        <TopList
          title="Top public profiles"
          icon={<TrendingUp className="h-3 w-3" />}
          items={rollup?.top_profiles ?? []}
          emptyText="No profile views yet"
        />
        <TopList
          title="Searches with no results"
          icon={<Search className="h-3 w-3" />}
          items={rollup?.top_no_result_searches ?? []}
          emptyText="No no-result searches"
        />
      </div>

      {/* Referrers + Countries */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TopList
          title="Top referrers"
          icon={<ExternalLink className="h-3 w-3" />}
          items={rollup?.top_referrers ?? []}
          emptyText="No external referrers yet"
        />
        <TopList
          title="Top countries"
          icon={<Globe2 className="h-3 w-3" />}
          items={rollup?.countries ?? []}
          emptyText="No country data yet"
        />
      </div>

      {/* Data-source explainer */}
      <div className="mt-4 rounded-[12px] border border-white/10 bg-white/[0.02] px-3 py-2 text-[11.5px] text-white/55">
        Realtime tiles come from a server-side PostHog HogQL query (20s cache, admin-only).
        Rollup tiles and top-lists come from the Supabase daily rollup; today's row auto-refreshes
        when this panel loads (if older than 10 min). No raw visitor IDs or IPs are exposed.

      </div>

      {/* 7d totals + ingest status */}
      {data ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-white/10 bg-white/[0.02] px-3 py-2 text-[11.5px] text-white/60">
          <span>
            <span className="font-medium text-white/80">Last 7 days:</span>{" "}
            {fmt(data.last_7d.public_page_views)} views ·{" "}
            {fmt(data.last_7d.public_unique_sessions)} sessions ·{" "}
            {fmt(data.last_7d.enquiries_created)} enquiries ·{" "}
            {fmt(data.last_7d.signup_starts)} signup starts
          </span>
          {data.last_ingest ? (() => {
            const status = data.last_ingest.last_status ?? "never";
            const runAt = data.last_ingest.last_run_at
              ? new Date(data.last_ingest.last_run_at)
              : null;
            const mins = runAt ? Math.round((Date.now() - runAt.getTime()) / 60000) : null;
            const refreshed =
              mins === null ? "never" : mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
            const ok = status === "ok";
            return (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="text-white/50">
                  Today refreshed <span className="text-white/75">{refreshed}</span>
                </span>
                <span className="text-white/50">
                  Nightly last ran{" "}
                  <span className="text-white/75">
                    {data.last_ingest.last_pulled_date ?? "—"}
                  </span>
                </span>
                <span
                  className={
                    ok
                      ? "inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-emerald-300"
                      : "inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/15 px-2 py-0.5 text-red-300"
                  }
                  title={data.last_ingest.last_error ?? undefined}
                >
                  Ingest: {status}
                </span>
              </span>
            );
          })() : null}
        </div>
      ) : null}
      {data?.last_ingest?.last_status === "error" && data.last_ingest.last_error ? (
        <div className="mt-2 rounded-[12px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          <span className="font-semibold">Rollup error:</span>{" "}
          <span className="font-mono text-red-100/90">{data.last_ingest.last_error}</span>
        </div>
      ) : null}
    </section>
  );
}
