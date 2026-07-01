// Admin — Public visitor rollup + discovery panel for /admin/activity.
// v2.0: Realtime live block moved to the LiveActivityRail. This panel now
// focuses on 24h rollup KPIs and discovery insight (top pages/profiles/searches).
// Zero-value metrics render as compact rows instead of large empty cards.

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ExternalLink, Globe2, Search, TrendingUp } from "lucide-react";
import { getPublicAnalyticsSummary } from "@/lib/admin/public-analytics.functions";
import { cn } from "@/lib/utils";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

function Kpi({ label, value, hint, isZero }: { label: string; value: number; hint?: string; isZero?: boolean }) {
  return (
    <div className={cn(
      "rounded-[12px] border border-white/10 bg-white/[0.03] p-3 transition",
      isZero && "opacity-70",
    )}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</div>
      <div className={cn(
        "mt-1 font-display text-[20px] font-bold leading-none tabular-nums",
        isZero ? "text-white/45" : "text-white",
      )}>{fmt(value)}</div>
      {hint ? <div className="mt-1 truncate text-[10px] text-white/40">{hint}</div> : null}
    </div>
  );
}

function CompactRow({ label, value }: { label: string; value: number }) {
  const isZero = value === 0;
  return (
    <div className={cn(
      "flex items-center justify-between gap-2 rounded-[8px] border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[11.5px]",
      isZero && "opacity-70",
    )}>
      <span className="truncate text-white/60">{label}</span>
      <span className={cn("shrink-0 tabular-nums", isZero ? "text-white/40" : "text-white/85 font-medium")}>{fmt(value)}</span>
    </div>
  );
}

function TopList({
  title, icon, items, emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ key: string | number; count: number }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/60">
        {icon}
        {title}
      </div>
      {items.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/10 bg-white/[0.02] px-2 py-2 text-[11px] italic text-white/45">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-0.5">
          {items.slice(0, 6).map((item, i) => (
            <li
              key={`${item.key}-${i}`}
              className="flex items-center justify-between gap-2 rounded-[6px] px-2 py-1 text-[12px] text-white/80 hover:bg-white/5"
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

export function PublicVisitorsPanel() {
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
  const rollupLabel = today ? "today" : yesterday ? "yesterday" : "no data yet";

  // Split KPIs into "primary" (main tiles) and "secondary" (compact rows when zero).
  const primaryKpis = [
    { label: "Page views", value: rollup?.public_page_views ?? 0, hint: rollupLabel },
    { label: "Unique sessions", value: rollup?.public_unique_sessions ?? 0, hint: rollupLabel },
    { label: "Profile views", value: rollup?.public_profile_views ?? 0, hint: rollupLabel },
    { label: "Enquiries", value: data?.conversions_24h.enquiries_created ?? 0, hint: `${data?.conversions_24h.total ?? 0} conversions` },
  ];

  const secondaryKpis = [
    { label: "Directory searches", value: rollup?.directory_searches ?? 0 },
    { label: "No-result searches", value: rollup?.searches_no_results ?? 0 },
    { label: "Result clicks", value: rollup?.result_clicks ?? 0 },
    { label: "Signup starts", value: data?.conversions_24h.signup_starts ?? 0 },
    { label: "Checkout starts", value: data?.conversions_24h.checkout_starts ?? 0 },
    { label: "Signup completes", value: data?.conversions_24h.signup_completes ?? 0 },
  ];

  // Show any non-zero secondary as tile, rest as compact rows.
  const nonZeroSecondary = secondaryKpis.filter((k) => k.value > 0);
  const zeroSecondary = secondaryKpis.filter((k) => k.value === 0);

  return (
    <section
      className="rounded-[18px] border border-blue-400/25 bg-gradient-to-br from-blue-500/[0.05] to-white/[0.01] p-4"
      aria-label="Public visitor rollup + discovery"
    >
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-blue-500/20 text-blue-300">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-[15px] font-bold text-white">
              Public analytics · 24h rollup
            </h2>
            <p className="text-[11px] text-white/50">
              Anonymous website traffic (consent-gated). Live figures sit in the command strip and live rail above.
            </p>
          </div>
        </div>
        {data?.last_ingest ? (
          (() => {
            const status = data.last_ingest.last_status ?? "never";
            const runAt = data.last_ingest.last_run_at ? new Date(data.last_ingest.last_run_at) : null;
            const mins = runAt ? Math.round((Date.now() - runAt.getTime()) / 60000) : null;
            const refreshed = mins === null ? "never" : mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
            const ok = status === "ok";
            return (
              <div className="flex flex-wrap items-center gap-2 text-[10.5px]">
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/55">Rollup refreshed <span className="text-white/80">{refreshed}</span></span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                    ok ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                       : "border border-red-400/30 bg-red-500/15 text-red-300",
                  )}
                  title={data.last_ingest.last_error ?? undefined}
                >
                  Ingest {status}
                </span>
              </div>
            );
          })()
        ) : null}
      </div>

      {/* Configured banner */}
      {!data?.configured ? (
        <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11.5px] text-amber-100">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <div className="font-semibold">PostHog not yet configured</div>
            <div className="mt-0.5 text-[11px] text-amber-100/80">
              Waiting for consented public traffic. Set <code className="rounded bg-amber-500/20 px-1 py-0.5">POSTHOG_PERSONAL_API_KEY</code> to enable realtime.
            </div>
          </div>
        </div>
      ) : null}

      {/* Primary KPI tiles */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {primaryKpis.map((k) => (
          <Kpi key={k.label} label={k.label} value={k.value} hint={k.hint} isZero={k.value === 0} />
        ))}
      </div>

      {/* Secondary: promoted tiles for non-zero, compact rows for zero */}
      {nonZeroSecondary.length > 0 ? (
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          {nonZeroSecondary.map((k) => (
            <Kpi key={k.label} label={k.label} value={k.value} hint="24h" />
          ))}
        </div>
      ) : null}

      {zeroSecondary.length > 0 ? (
        <div className="mt-2 grid grid-cols-2 gap-1.5 md:grid-cols-3">
          {zeroSecondary.map((k) => (
            <CompactRow key={k.label} label={k.label} value={k.value} />
          ))}
        </div>
      ) : null}

      {/* Discovery — top pages / referrers / countries are visible by default */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <TopList
          title="Top public pages"
          icon={<ExternalLink className="h-3 w-3" />}
          items={rollup?.top_pages ?? []}
          emptyText="No public page views yet today"
        />
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

      {/* Secondary discovery — collapsed by default to keep the section tight */}
      <details className="group mt-3 rounded-[12px] border border-white/[0.08] bg-white/[0.02] open:bg-white/[0.03]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/60 hover:text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Show discovery details
          </span>
          <span className="text-[10px] font-medium normal-case tracking-normal text-white/40 group-open:hidden">
            Top profiles · searches · no-result searches
          </span>
        </summary>
        <div className="border-t border-white/[0.06] p-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <TopList
              title="Top public profiles"
              icon={<TrendingUp className="h-3 w-3" />}
              items={rollup?.top_profiles ?? []}
              emptyText="No public profile views yet today"
            />
            <TopList
              title="Searches with no results"
              icon={<Search className="h-3 w-3" />}
              items={rollup?.top_no_result_searches ?? []}
              emptyText="No no-result searches — good sign"
            />
          </div>
        </div>
      </details>



      {/* 7d totals */}
      {data ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/55">
          <span className="font-medium text-white/80">Last 7 days:</span>
          <span>{fmt(data.last_7d.public_page_views)} views</span>
          <span>· {fmt(data.last_7d.public_unique_sessions)} sessions</span>
          <span>· {fmt(data.last_7d.enquiries_created)} enquiries</span>
          <span>· {fmt(data.last_7d.signup_starts)} signup starts</span>
        </div>
      ) : null}

      {data?.last_ingest?.last_status === "error" && data.last_ingest.last_error ? (
        <div className="mt-2 rounded-[10px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          <span className="font-semibold">Rollup error:</span>{" "}
          <span className="font-mono text-red-100/90">{data.last_ingest.last_error}</span>
        </div>
      ) : null}
    </section>
  );
}
