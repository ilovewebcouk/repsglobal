// Admin Activity v2.2 — Live Activity Rail.
// - Restores rich member row (avatar, tier, device, flag, page, duration, Open).
// - Honest "Towns" vs "Countries" heading.
// - Collapses to a single empty state when every section is empty.

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Eye, Globe, MonitorSmartphone, Smartphone, Tablet, Users, Wifi,
  ExternalLink, Chrome,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { OnlineNowUser, CurrentPageRow } from "@/lib/ops/activity-panels.functions";
import type { PublicRealtime } from "@/lib/admin/public-realtime.functions";
import type { RealtimeSummary } from "@/lib/ops/activity-realtime.functions";
import { resolveLocation, formatLocationLabel } from "@/lib/geo/resolve-location";
import { tierLabel } from "@/lib/activity/labels";

type Tab = "all" | "public" | "members";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export interface SupabaseVisitorRow {
  journey_id: string;
  session_id: string | null;
  user_id: string | null;
  member_name: string | null;
  masked_ip: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
  latest_path: string | null;
  latest_event: string | null;
  path_history: Array<{ path?: string; at?: string; event?: string }>;
  referrer: string | null;
  source: string | null;
  first_seen_at: string;
  last_seen_at: string;
  status: "live" | "stale";
}

export interface LiveActivityRailProps {
  members: OnlineNowUser[];
  memberPages: CurrentPageRow[];
  membersLoading: boolean;
  publicRealtime: PublicRealtime | null;
  publicLoading: boolean;
  realtime: RealtimeSummary | undefined;
  updatedAt: number | null;
  className?: string;
  /** Phase UI-2 — Supabase-backed public visitors (replaces PostHog Public tab data). */
  supabaseVisitors?: SupabaseVisitorRow[];
  supabaseVisitorsLoading?: boolean;
  onOpenVisitor?: (journeyId: string) => void;
}

export function LiveActivityRail(props: LiveActivityRailProps) {
  const {
    members, memberPages, membersLoading, publicRealtime, publicLoading, realtime, updatedAt, className,
    supabaseVisitors, supabaseVisitorsLoading, onOpenVisitor,
  } = props;
  const [tab, setTab] = useState<Tab>("all");

  const publicOnline = supabaseVisitors?.length ?? publicRealtime?.online_now ?? 0;
  const membersOnline = realtime?.online_now ?? members.length;

  const locationsLive = useMemo(() => {
    const cities = (publicRealtime?.cities ?? [])
      .filter((c) => c.online > 0)
      .map((c) => ({
        id: `${c.city}-${c.country_code}`,
        label: c.city,
        cc: c.country_code,
        online: c.online,
        detail: c.region,
      }));
    if (cities.length > 0) return cities.slice(0, 8);
    return (publicRealtime?.countries ?? [])
      .filter((c) => c.online > 0)
      .map((c) => ({ id: c.country_code, label: countryDisplay(c.country_code).label, cc: c.country_code, online: c.online, detail: "country fallback" }))
      .slice(0, 8);
  }, [publicRealtime]);

  const devices = realtime?.devices;
  const totalDevices = devices ? devices.mobile + devices.desktop + devices.tablet + devices.unknown : 0;

  return (
    <section className={cn("flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel", className)}>

      <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative flex h-6 w-6 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/25" />
            <span className="relative flex h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-[14px] font-semibold text-white">Live activity</h2>
            <p className="truncate text-[10.5px] text-white/45">
              <span className="text-blue-300">{publicOnline} public</span> · <span className="text-orange-300">{membersOnline} members</span>
              {updatedAt ? <> · updated {Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))}s ago</> : null}
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-reps-border/60 bg-black/20 px-2 py-1.5">
        {(["all", "public", "members"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-[8px] px-2 py-1.5 text-[11px] font-semibold capitalize transition",
                active
                  ? t === "public"
                    ? "bg-blue-500/20 text-blue-100"
                    : t === "members"
                      ? "bg-orange-500/20 text-orange-100"
                      : "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white/80",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 divide-y divide-reps-border/60 overflow-y-auto">
        {(tab === "all" || tab === "public") && supabaseVisitors ? (
          <RailSection
            title="Public visitors · Supabase live"
            icon={Eye}
            accent="blue"
            loading={supabaseVisitorsLoading ?? false}
            empty="No public visitors active right now"
            items={supabaseVisitors.slice(0, 8)}
            render={(v) => (
              <button
                type="button"
                onClick={() => onOpenVisitor?.(v.journey_id)}
                className="w-full rounded-[8px] px-1 py-1.5 text-left transition hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    {v.member_name ? (
                      <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[9.5px] font-semibold text-orange-100">
                        {v.member_name}
                      </span>
                    ) : (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9.5px] text-white/60">anon</span>
                    )}
                    <span className="truncate font-mono text-[11px] text-white/85">{v.latest_path ?? "/"}</span>
                  </span>
                  <span className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-medium tabular-nums",
                    v.status === "live" ? "bg-emerald-500/15 text-emerald-200" : "bg-white/5 text-white/45",
                  )}>
                    {v.status}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-white/45">
                  <span className="truncate">
                    {[v.city, v.country_code].filter(Boolean).join(", ") || "—"}
                    {v.masked_ip ? <span className="ml-1 font-mono text-white/55">· {v.masked_ip}</span> : null}
                  </span>
                  <span className="shrink-0">{timeAgo(v.last_seen_at)}</span>
                </div>
              </button>
            )}
            keyFn={(v) => v.journey_id}
          />
        ) : null}

        {(tab === "all" || tab === "public") ? (
          <RailSection
            title="Public pages now"
            icon={Eye}
            accent="blue"
            loading={publicLoading}
            empty={publicOnline === 0 ? "No public visitors on the site right now" : "No public pageviews in last 5 min"}
            items={publicRealtime?.current_pages ?? []}
            render={(p) => (
              <div className="flex items-center justify-between gap-2 py-1.5">
                <span className="truncate font-mono text-[11.5px] text-white/85">{p.path}</span>
                <span className="shrink-0 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-200 tabular-nums">
                  {p.viewers}
                </span>
              </div>
            )}
            keyFn={(p) => p.path}
          />
        ) : null}

        {(tab === "all" || tab === "public") ? (
          <RailSection
            title="Towns live"
            icon={Globe}
            accent="blue"
            loading={publicLoading}
            empty="No town-level public activity right now"
            items={locationsLive}
            render={(c) => {
              const d = countryDisplay(c.cc);
              return (
                <div className="flex items-center justify-between gap-2 py-1.5">
                  <span className="min-w-0 inline-flex items-center gap-1.5 truncate text-[12px] text-white/85">
                    <span>{d.flag}</span>
                    <span className="truncate">{c.label}</span>
                    {c.detail ? <span className="truncate text-[10px] text-white/40">· {c.detail}</span> : null}
                  </span>
                  <span className="shrink-0 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-200 tabular-nums">
                    {c.online}
                  </span>
                </div>
              );
            }}
            keyFn={(c) => c.id}
          />
        ) : null}

        {(tab === "all" || tab === "members") ? (
          <RailSection
            title="Members online"
            icon={Users}
            accent="orange"
            loading={membersLoading}
            empty="No members online right now"
            items={members.slice(0, 6)}
            render={(u) => (
              <div className="flex items-center gap-2.5 py-1.5">
                <Avatar className="h-7 w-7 shrink-0">
                  {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={u.name} /> : null}
                  <AvatarFallback className="bg-reps-panel-soft text-[10px] text-white/70">{initials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium text-white">{u.name}</span>
                  </div>
                  <div className="truncate text-[10.5px] text-white/50">
                    {u.current_path ? <span className="font-mono">{u.current_path}</span> : "—"}
                    {u.city ? <span className="font-sans text-white/40"> · {u.city}</span> : null}
                  </div>
                </div>
                {u.user_id ? (
                  <Link
                    to="/admin/members/$userId"
                    params={{ userId: u.user_id }}
                    className="shrink-0 text-[10px] text-white/45 hover:text-orange-300"
                  >
                    {timeAgo(u.last_seen_at)}
                  </Link>
                ) : (
                  <span className="shrink-0 text-[10px] text-white/45">{timeAgo(u.last_seen_at)}</span>
                )}
              </div>
            )}
            keyFn={(u) => u.session_id}
          />
        ) : null}

        {(tab === "all" || tab === "members") ? (
          <RailSection
            title="Member pages now"
            icon={Eye}
            accent="orange"
            loading={membersLoading}
            empty="No members viewing pages right now"
            items={memberPages.slice(0, 5)}
            render={(p) => (
              <div className="flex items-center justify-between gap-2 py-1.5">
                <span className="truncate font-mono text-[11.5px] text-white/85">{p.path || "/"}</span>
                <span className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-medium text-orange-200 tabular-nums">
                  {p.online_count}
                </span>
              </div>
            )}
            keyFn={(p) => p.path}
          />
        ) : null}

        {(tab === "all" || tab === "members") && devices && totalDevices > 0 ? (
          <div className="px-3 py-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/55">
              <Wifi className="h-3 w-3" /> Member devices
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
              <DevicePill icon={<Smartphone className="h-3 w-3" />} label="Mobile" value={devices.mobile} total={totalDevices} color="#F97316" />
              <DevicePill icon={<MonitorSmartphone className="h-3 w-3" />} label="Desktop" value={devices.desktop} total={totalDevices} color="#38bdf8" />
              <DevicePill icon={<Tablet className="h-3 w-3" />} label="Tablet" value={devices.tablet} total={totalDevices} color="#a78bfa" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RailSection<T>({
  title, icon: Icon, accent, loading, empty, items, render, keyFn,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "blue" | "orange";
  loading: boolean;
  empty: string;
  items: T[];
  render: (item: T) => React.ReactNode;
  keyFn: (item: T) => string;
}) {
  return (
    <div className="px-3 py-2.5">
      <div className={cn(
        "mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider",
        accent === "blue" ? "text-blue-300/85" : "text-orange-300/85",
      )}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      {loading && items.length === 0 ? (
        <div className="space-y-1.5 py-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/10 bg-white/[0.02] px-2 py-2 text-[11px] italic text-white/45">
          {empty}
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {items.map((it) => <li key={keyFn(it)}>{render(it)}</li>)}
        </ul>
      )}
    </div>
  );
}

function DevicePill({ icon, label, value, total, color }: {
  icon: React.ReactNode; label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/70">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {icon}
      <span className="font-medium text-white/85">{value}</span>
      <span className="text-white/45">· {pct}%</span>
      <span className="text-white/40">{label}</span>
    </span>
  );
}
