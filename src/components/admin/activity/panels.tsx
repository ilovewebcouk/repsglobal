// Admin Activity v1.1 — panel components.
// Read-only ops console primitives. Honest empty states, no fake data.

import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight,
  ChevronRight, Circle, ExternalLink, Eye, Globe, MonitorSmartphone,
  Smartphone, Users, Wifi, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  KpiTileData, OnlineNowUser, CurrentPageRow, TopPageRow, GeoRow, AttentionRow,
} from "@/lib/ops/activity-panels.functions";

// ─────────────────────────────────────────────────────────── helpers ──

const COUNTRY_NAMES: Record<string, string> = {
  GB: "United Kingdom", US: "United States", IE: "Ireland", DE: "Germany",
  FR: "France", ES: "Spain", IT: "Italy", NL: "Netherlands", AU: "Australia",
  CA: "Canada", NZ: "New Zealand", ZA: "South Africa", AE: "United Arab Emirates",
  IN: "India", PT: "Portugal", PL: "Poland", SE: "Sweden", NO: "Norway",
  DK: "Denmark", FI: "Finland", BE: "Belgium", CH: "Switzerland", AT: "Austria",
  BR: "Brazil", MX: "Mexico", JP: "Japan", SG: "Singapore",
};

function flag(cc: string): string {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function durationLabel(startIso: string, endIso?: string): string {
  const s = Math.floor(((endIso ? new Date(endIso) : new Date()).getTime() - new Date(startIso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function formatPence(pence: number | null | undefined): string | null {
  if (pence == null) return null;
  return `£${(pence / 100).toFixed(2)}`;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

// ─────────────────────────────────────────────────────────── KPI STRIP ──

function Sparkline({ values, tone = "neutral" }: { values: number[]; tone?: "neutral" | "success" | "warning" | "critical" }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 20;
  const step = w / (values.length - 1 || 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const stroke =
    tone === "success" ? "text-emerald-400" :
    tone === "warning" ? "text-amber-400" :
    tone === "critical" ? "text-rose-400" :
    "text-reps-orange";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-5 w-20", stroke)}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiStrip({ tiles, loading }: { tiles: KpiTileData[]; loading: boolean }) {
  if (loading && !tiles.length) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-reps-border bg-reps-panel p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-6 w-14" />
            <Skeleton className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {tiles.map((t) => {
        const tone = t.tone ?? "info";
        const toneRing =
          tone === "critical" ? "ring-1 ring-rose-500/30" :
          tone === "warning" ? "ring-1 ring-amber-500/30" :
          tone === "success" ? "ring-1 ring-emerald-500/25" :
          "";
        const deltaUp = (t.delta_pct ?? 0) > 0;
        return (
          <div key={t.key} className={cn("rounded-[16px] border border-reps-border bg-reps-panel p-4", toneRing)}>
            <div className="min-w-0 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
              {t.label}
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <div className="font-display text-[22px] font-bold leading-none text-white">
                {t.value.toLocaleString()}
              </div>
              <Sparkline values={t.sparkline} tone={tone === "info" ? "neutral" : tone} />
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px]">
              {t.delta_pct == null ? (
                <span className="text-white/40">—</span>
              ) : (
                <span className={cn("inline-flex items-center gap-0.5 font-medium", deltaUp ? "text-emerald-300" : "text-white/55")}>
                  {deltaUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {deltaUp ? "+" : ""}{t.delta_pct}% vs prev
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────── PANEL SHELL ──

export function PanelShell({
  title, subtitle, icon: Icon, right, children, className,
}: {
  title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-white/60" /> : null}
          <div className="min-w-0">
            <h2 className="truncate font-display text-[14px] font-semibold text-white">{title}</h2>
            {subtitle ? <p className="truncate text-[11px] text-white/45">{subtitle}</p> : null}
          </div>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────── GEO PANEL ──

export function GeoPanel({
  countries, loading, selectedCountry, onSelectCountry,
}: {
  countries: GeoRow[]; loading: boolean;
  selectedCountry?: string; onSelectCountry: (cc: string | undefined) => void;
}) {
  const max = Math.max(1, ...countries.map((c) => c.page_views_24h));
  return (
    <PanelShell
      title="Country activity"
      subtitle="Logged-in member traffic by country"
      icon={Globe}
      right={
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] font-medium text-white/60 hover:bg-white/10">
                Country-level
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[260px] text-xs">
              Based on available country-level request metadata. City-level mapping is planned once geo enrichment is enabled.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    >
      {selectedCountry ? (
        <div className="flex items-center justify-between gap-2 border-b border-reps-border/60 bg-reps-orange/10 px-4 py-2 text-xs text-white/80">
          <span>Filtered by <span className="font-semibold">{flag(selectedCountry)} {COUNTRY_NAMES[selectedCountry] ?? selectedCountry}</span></span>
          <button type="button" onClick={() => onSelectCountry(undefined)} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 hover:bg-white/20">
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      ) : null}
      {loading && !countries.length ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : countries.length === 0 ? (
        <EmptyState icon={Globe} title="No country activity yet" hint="Sessions from logged-in members will appear here." />
      ) : (
        <ul className="max-h-[420px] divide-y divide-reps-border/60 overflow-auto">
          {countries.map((c) => {
            const isSelected = selectedCountry === c.country_code;
            return (
              <li key={c.country_code}>
                <button
                  type="button"
                  onClick={() => onSelectCountry(isSelected ? undefined : c.country_code)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5",
                    isSelected && "bg-reps-orange/10",
                  )}
                >
                  <span className="text-[20px] leading-none">{flag(c.country_code)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-white">
                        {COUNTRY_NAMES[c.country_code] ?? c.country_code}
                      </span>
                      <span className="shrink-0 text-[11px] text-white/45">{c.share_pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-reps-orange/70" style={{ width: `${Math.max(4, (c.page_views_24h / max) * 100)}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-white/55">
                      <span className="inline-flex items-center gap-1"><Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" />{c.online_now} online</span>
                      <span>{c.page_views_24h.toLocaleString()} views</span>
                      <span>{c.sign_ins_24h} sign-ins</span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────── ONLINE NOW ──

export function OnlineNowRail({ users, loading }: { users: OnlineNowUser[]; loading: boolean }) {
  if (loading && !users.length) {
    return (
      <PanelShell title="Online now" subtitle="Members active in the last 5 minutes" icon={Wifi}>
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </PanelShell>
    );
  }
  return (
    <PanelShell
      title="Online now"
      subtitle="Members active in the last 5 minutes"
      icon={Wifi}
      right={<Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10.5px] text-emerald-300">{users.filter((u) => u.badges.includes("Online")).length} live</Badge>}
    >
      {users.length === 0 ? (
        <EmptyState icon={Users} title="Nobody logged in right now" hint="Live sessions appear as members interact with the app." />
      ) : (
        <ul className="max-h-[520px] divide-y divide-reps-border/60 overflow-auto">
          {users.map((u) => (
            <li key={u.session_id} className="flex items-start gap-3 px-4 py-3">
              <Avatar className="h-9 w-9 shrink-0">
                {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={u.name} /> : null}
                <AvatarFallback className="bg-reps-panel-soft text-[11px] text-white/70">{initials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-white">{u.name}</span>
                  {u.tier ? <Badge variant="outline" className="border-reps-border bg-reps-panel-soft text-[9.5px] uppercase tracking-wide text-white/60">{u.tier}</Badge> : null}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-white/50">
                  {u.current_path ? <span className="font-mono">{u.current_path}</span> : <span className="italic text-white/35">Last active page unavailable</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-white/50">
                  <span className="inline-flex items-center gap-1">
                    {u.device === "mobile" ? <Smartphone className="h-3 w-3" /> : <MonitorSmartphone className="h-3 w-3" />}
                    {u.device ?? "device?"}{u.browser ? ` · ${u.browser}` : ""}
                  </span>
                  <span>·</span>
                  <span>{u.country_code ? <>{flag(u.country_code)} {u.country_code}</> : "🌐 —"}</span>
                  <span>·</span>
                  <span>{u.pages_viewed} pages · {durationLabel(u.started_at)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {u.badges.map((b) => (
                    <span
                      key={b}
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9.5px] font-medium",
                        b === "Online" && "bg-emerald-500/15 text-emerald-300",
                        b === "Idle" && "bg-white/10 text-white/60",
                        b === "Long session" && "bg-amber-500/15 text-amber-300",
                        b === "New member" && "bg-reps-orange/15 text-reps-orange",
                      )}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[10.5px] text-white/45">{timeAgo(u.last_seen_at)}</span>
                {u.user_id ? (
                  <Link
                    to="/admin/members/$userId"
                    params={{ userId: u.user_id }}
                    className="inline-flex items-center gap-1 rounded-[8px] bg-white/5 px-2 py-1 text-[10.5px] font-medium text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    Open <ChevronRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────── CURRENT PAGES ──

export function CurrentPagesPanel({ pages, loading }: { pages: CurrentPageRow[]; loading: boolean }) {
  return (
    <PanelShell title="Pages being viewed now" subtitle="Live member locations across the app" icon={Eye}>
      {loading && !pages.length ? (
        <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : pages.length === 0 ? (
        <EmptyState icon={Eye} title="No live page activity" hint="Member pages appear here as sessions move around the app." />
      ) : (
        <ul className="divide-y divide-reps-border/60">
          {pages.map((p) => (
            <li key={p.path} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-10 shrink-0 text-center font-display text-[15px] font-bold text-white">{p.online_count}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[12px] text-white/85">{p.path || "/"}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-white/50">
                  <span>{p.views_24h.toLocaleString()} views 24h</span>
                  {p.trend_pct != null ? (
                    <span className={cn("inline-flex items-center gap-0.5", p.trend_pct >= 0 ? "text-emerald-300" : "text-white/50")}>
                      {p.trend_pct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {p.trend_pct >= 0 ? "+" : ""}{p.trend_pct}%
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex -space-x-1.5">
                {p.avatars.length === 0 ? (
                  <span className="text-[10.5px] text-white/35">No avatars</span>
                ) : (
                  p.avatars.map((a) => (
                    <Avatar key={a.user_id} className="h-6 w-6 border border-reps-panel">
                      {a.avatar_url ? <AvatarImage src={a.avatar_url} alt={a.name} /> : null}
                      <AvatarFallback className="bg-reps-panel-soft text-[9px] text-white/70">{initials(a.name)}</AvatarFallback>
                    </Avatar>
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────── TOP MEMBER PAGES ──

export function TopMemberPagesPanel({ pages, loading }: { pages: TopPageRow[]; loading: boolean }) {
  return (
    <PanelShell
      title="Top member pages · 24h"
      subtitle="Logged-in member activity only"
      icon={Activity}
      right={
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] font-medium text-white/60">Member pages</span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[280px] text-xs">
              Logged-in member traffic only. Public anonymous analytics is planned once privacy approval lands.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    >
      {loading && !pages.length ? (
        <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
      ) : pages.length === 0 ? (
        <EmptyState icon={Activity} title="No member page views in the last 24h" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-[10.5px] uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Page</th>
                <th className="px-3 py-2 text-right font-medium">Views</th>
                <th className="px-3 py-2 text-right font-medium">Members</th>
                <th className="px-3 py-2 text-right font-medium">Trend</th>
                <th className="px-4 py-2 text-right font-medium">Last</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-reps-border/60">
              {pages.map((p) => (
                <tr key={p.path} className="hover:bg-white/5">
                  <td className="px-4 py-2 font-mono text-white/85">{p.path}</td>
                  <td className="px-3 py-2 text-right text-white/80">{p.views.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-white/60">{p.unique_members}</td>
                  <td className="px-3 py-2 text-right">
                    {p.trend_pct == null ? <span className="text-white/40">—</span> : (
                      <span className={cn(p.trend_pct >= 0 ? "text-emerald-300" : "text-white/55")}>
                        {p.trend_pct >= 0 ? "+" : ""}{p.trend_pct}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-white/45">{p.last_viewed_at ? timeAgo(p.last_viewed_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────── NEEDS ATTENTION ──

export function NeedsAttentionPanel({ rows, loading }: { rows: AttentionRow[]; loading: boolean }) {
  const critical = useMemo(() => rows.filter((r) => r.severity === "critical").length, [rows]);
  return (
    <PanelShell
      title="Needs attention"
      subtitle="Actionable issues across billing, support, verification, and auth"
      icon={AlertTriangle}
      className={critical > 0 ? "ring-1 ring-rose-500/30" : undefined}
      right={<Badge variant="outline" className={cn(critical > 0 ? "border-rose-500/50 bg-rose-500/15 text-rose-200" : "border-reps-border bg-white/5 text-white/60", "text-[10.5px]")}>{rows.length} open</Badge>}
    >
      {loading && !rows.length ? (
        <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Circle} title="All clear" hint="No open disputes, failed payments, or pending support right now." />
      ) : (
        <ul className="max-h-[520px] divide-y divide-reps-border/60 overflow-auto">
          {rows.map((r) => (
            <li key={r.id} className={cn(
              "relative flex items-start gap-3 px-4 py-3",
              r.severity === "critical" ? "border-l-2 border-l-rose-500" : "border-l-2 border-l-amber-500",
            )}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "text-[9.5px] uppercase",
                    r.severity === "critical" ? "bg-rose-500/15 text-rose-200" : "bg-amber-500/15 text-amber-200",
                  )}>{r.source}</Badge>
                  <span className="truncate text-[12.5px] font-medium text-white">{r.title}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                  {r.member_label ? <span>{r.member_label}</span> : null}
                  {r.amount_pence != null ? <span className="font-medium text-white/75">{formatPence(r.amount_pence)}</span> : null}
                  {r.subtitle ? <span className="truncate">· {r.subtitle}</span> : null}
                  <span>· {timeAgo(r.ts)}</span>
                </div>
              </div>
              <Link
                to={r.action_url as "/admin/billing"}
                className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1 text-[10.5px] font-medium text-white/80 hover:bg-white/10 hover:text-white"
              >
                {r.action_label} <ExternalLink className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────────── EMPTY ──

export function EmptyState({
  icon: Icon, title, hint,
}: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <Icon className="h-6 w-6 text-white/30" />
      <div className="text-[13px] font-medium text-white/70">{title}</div>
      {hint ? <div className="max-w-[280px] text-[11.5px] text-white/45">{hint}</div> : null}
    </div>
  );
}

export { flag as countryFlag, timeAgo, COUNTRY_NAMES };
