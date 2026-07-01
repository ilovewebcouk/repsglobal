// Admin Activity v2.0 — Command Strip.
// Top-of-page live tiles. Blue = public, orange = members, red/amber = alerts.
// Muted styling for zero-value tiles so they don't compete visually.

import { AlertTriangle, Eye, Radio, Users, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type CommandTone = "public" | "members" | "alert" | "warn" | "neutral";

export interface CommandTile {
  key: string;
  label: string;
  value: number;
  hint?: string;
  tone: CommandTone;
  icon: LucideIcon;
  loading?: boolean;
}

export interface CommandStripProps {
  publicOnline: number;
  membersOnline: number;
  pageViews5m: number;
  highValueToday: number;
  attentionCount: number;
  criticalCount: number;
  loading?: boolean;
}

const TONE: Record<CommandTone, { ring: string; dot: string; iconBg: string; iconFg: string; valueColor: string }> = {
  public:   { ring: "border-blue-400/25 hover:border-blue-400/50",   dot: "bg-blue-400",    iconBg: "bg-blue-500/15",    iconFg: "text-blue-300",    valueColor: "text-white" },
  members:  { ring: "border-orange-400/25 hover:border-orange-400/50", dot: "bg-orange-400",  iconBg: "bg-orange-500/15",  iconFg: "text-orange-300",  valueColor: "text-white" },
  alert:    { ring: "border-rose-500/40 hover:border-rose-500/60",   dot: "bg-rose-400",    iconBg: "bg-rose-500/15",    iconFg: "text-rose-300",    valueColor: "text-white" },
  warn:     { ring: "border-amber-500/35 hover:border-amber-500/55", dot: "bg-amber-400",   iconBg: "bg-amber-500/15",   iconFg: "text-amber-300",   valueColor: "text-white" },
  neutral:  { ring: "border-reps-border hover:border-white/25",     dot: "bg-white/40",    iconBg: "bg-white/10",       iconFg: "text-white/70",    valueColor: "text-white" },
};

function Tile({ tile }: { tile: CommandTile }) {
  const t = TONE[tile.tone];
  const Icon = tile.icon;
  const isZero = tile.value === 0;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[14px] border bg-reps-panel px-4 py-3 transition",
        t.ring,
        isZero && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", t.iconBg)}>
          <Icon className={cn("h-4 w-4", t.iconFg)} />
        </div>
        {tile.tone === "alert" && tile.value > 0 ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
          </span>
        ) : tile.tone === "members" && tile.value > 0 ? (
          <span className={cn("h-2 w-2 rounded-full", t.dot)} />
        ) : tile.tone === "public" && tile.value > 0 ? (
          <span className={cn("h-2 w-2 rounded-full", t.dot)} />
        ) : null}
      </div>
      <div className="mt-2.5 min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
          {tile.label}
        </div>
        {tile.loading ? (
          <Skeleton className="mt-1.5 h-7 w-16" />
        ) : (
          <div className={cn("mt-0.5 font-display text-[26px] font-bold leading-none tracking-tight tabular-nums", isZero ? "text-white/50" : t.valueColor)}>
            {tile.value.toLocaleString()}
          </div>
        )}
        {tile.hint ? (
          <div className="mt-1 truncate text-[10.5px] text-white/45">{tile.hint}</div>
        ) : null}
      </div>
    </div>
  );
}

export function CommandStrip(props: CommandStripProps) {
  const totalLive = props.publicOnline + props.membersOnline;
  const tiles: CommandTile[] = [
    {
      key: "live_sessions",
      label: "Live sessions",
      value: totalLive,
      hint: totalLive === 0 ? "No one on the site right now" : `${props.publicOnline} public · ${props.membersOnline} members`,
      tone: "neutral",
      icon: Radio,
      loading: props.loading,
    },
    {
      key: "public_online",
      label: "Public online",
      value: props.publicOnline,
      hint: props.publicOnline === 0 ? "Waiting for consented traffic" : "anonymous visitors · now",
      tone: "public",
      icon: Eye,
      loading: props.loading,
    },
    {
      key: "members_online",
      label: "Members online",
      value: props.membersOnline,
      hint: props.membersOnline === 0 ? "No members active right now" : "logged in · now",
      tone: "members",
      icon: Users,
      loading: props.loading,
    },
    {
      key: "views_5m",
      label: "Page views · 5m",
      value: props.pageViews5m,
      hint: props.pageViews5m === 0 ? "No public views in last 5 min" : "public · rolling window",
      tone: "public",
      icon: Eye,
      loading: props.loading,
    },
    {
      key: "high_value",
      label: "High-value events · today",
      value: props.highValueToday,
      hint: props.highValueToday === 0 ? "No enquiries or signups today" : "enquiries + signup completes",
      tone: "members",
      icon: Zap,
      loading: props.loading,
    },
    {
      key: "attention",
      label: "Needs attention",
      value: props.attentionCount,
      hint:
        props.criticalCount > 0
          ? `${props.criticalCount} critical`
          : props.attentionCount === 0
            ? "All clear"
            : `${props.attentionCount} open`,
      tone: props.criticalCount > 0 ? "alert" : props.attentionCount > 0 ? "warn" : "neutral",
      icon: AlertTriangle,
      loading: props.loading,
    },
  ];

  return (
    <section aria-label="Live command strip" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {tiles.map((t) => <Tile key={t.key} tile={t} />)}
    </section>
  );
}
