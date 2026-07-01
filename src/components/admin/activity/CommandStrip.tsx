// Admin Activity v2.1 — Command Strip.
// 7 tiles, one row: Live · Public · Members · Views 5m · Key events · Action queue · Ingest.
// Zero-value tiles render in "quiet" style so alert/live tiles dominate.

import {
  AlertTriangle, Eye, Radio, Users, Zap, ShieldCheck, ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type CommandTone = "public" | "members" | "alert" | "warn" | "neutral" | "healthy";
export type IngestStatus = "healthy" | "degraded" | "down";

export interface CommandTile {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  tone: CommandTone;
  icon: LucideIcon;
  loading?: boolean;
  forceQuiet?: boolean;
}

export interface CommandStripProps {
  publicOnline: number;
  membersOnline: number;
  pageViews5m: number;
  highValueToday: number;
  attentionCount: number;
  criticalCount: number;
  ingestStatus: IngestStatus;
  loading?: boolean;
}

const TONE: Record<CommandTone, { ring: string; dot: string; iconBg: string; iconFg: string; valueColor: string }> = {
  public:   { ring: "border-blue-400/25 hover:border-blue-400/50",       dot: "bg-blue-400",    iconBg: "bg-blue-500/15",    iconFg: "text-blue-300",    valueColor: "text-blue-50" },
  members:  { ring: "border-orange-400/25 hover:border-orange-400/50",   dot: "bg-orange-400",  iconBg: "bg-orange-500/15",  iconFg: "text-orange-300",  valueColor: "text-orange-50" },
  alert:    { ring: "border-rose-500/40 hover:border-rose-500/60",       dot: "bg-rose-400",    iconBg: "bg-rose-500/15",    iconFg: "text-rose-300",    valueColor: "text-white" },
  warn:     { ring: "border-amber-500/35 hover:border-amber-500/55",     dot: "bg-amber-400",   iconBg: "bg-amber-500/15",   iconFg: "text-amber-300",   valueColor: "text-white" },
  healthy:  { ring: "border-emerald-400/25 hover:border-emerald-400/45", dot: "bg-emerald-400", iconBg: "bg-emerald-500/15", iconFg: "text-emerald-300", valueColor: "text-emerald-50" },
  neutral:  { ring: "border-white/[0.08] hover:border-white/20",         dot: "bg-white/40",    iconBg: "bg-white/[0.06]",   iconFg: "text-white/60",    valueColor: "text-white" },
};

function Tile({ tile }: { tile: CommandTile }) {
  const t = TONE[tile.tone];
  const Icon = tile.icon;
  const isQuiet = tile.forceQuiet ?? tile.value === 0;
  const showLiveDot =
    !isQuiet && (tile.tone === "public" || tile.tone === "members" || tile.tone === "healthy");
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[14px] border bg-reps-panel px-3.5 py-3 transition",
        isQuiet ? "border-white/[0.06]" : t.ring,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]",
          isQuiet ? "bg-white/[0.04]" : t.iconBg,
        )}>
          <Icon className={cn("h-3.5 w-3.5", isQuiet ? "text-white/35" : t.iconFg)} />
        </div>
        {tile.tone === "alert" && !isQuiet ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
          </span>
        ) : showLiveDot ? (
          <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
        ) : null}
      </div>
      <div className="mt-2 min-w-0">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/45">
          {tile.label}
        </div>
        {tile.loading ? (
          <Skeleton className="mt-1 h-6 w-12" />
        ) : (
          <div className={cn(
            "mt-0.5 font-display text-[24px] font-bold leading-none tracking-tight tabular-nums",
            isQuiet ? "text-white/45" : t.valueColor,
          )}>
            {typeof tile.value === "number" ? tile.value.toLocaleString() : tile.value}
          </div>
        )}
        {tile.hint ? (
          <div className="mt-1 truncate text-[10px] text-white/40">{tile.hint}</div>
        ) : null}
      </div>
    </div>
  );
}

export function CommandStrip(props: CommandStripProps) {
  const totalLive = props.publicOnline + props.membersOnline;
  const ingestLabel =
    props.ingestStatus === "down" ? "Down" :
    props.ingestStatus === "degraded" ? "Degraded" : "Healthy";
  const ingestTone: CommandTone =
    props.ingestStatus === "down" ? "alert" :
    props.ingestStatus === "degraded" ? "warn" : "healthy";
  const ingestIcon = props.ingestStatus === "healthy" ? ShieldCheck : ShieldAlert;

  const tiles: CommandTile[] = [
    {
      key: "live",
      label: "Live sessions",
      value: totalLive,
      hint: totalLive === 0 ? "No sessions right now" : `${props.publicOnline} public · ${props.membersOnline} members`,
      tone: totalLive > 0 ? "healthy" : "neutral",
      icon: Radio,
      loading: props.loading,
    },
    {
      key: "public",
      label: "Public now",
      value: props.publicOnline,
      hint: props.publicOnline === 0 ? "Waiting for consented traffic" : "anonymous · live",
      tone: "public",
      icon: Eye,
      loading: props.loading,
    },
    {
      key: "members",
      label: "Members now",
      value: props.membersOnline,
      hint: props.membersOnline === 0 ? "No members active" : "logged in · live",
      tone: "members",
      icon: Users,
      loading: props.loading,
    },
    {
      key: "views_5m",
      label: "Views 5m",
      value: props.pageViews5m,
      hint: props.pageViews5m === 0 ? "No views in 5 min" : "public · rolling",
      tone: "public",
      icon: Eye,
      loading: props.loading,
    },
    {
      key: "key_events",
      label: "Key events",
      value: props.highValueToday,
      hint: props.highValueToday === 0 ? "No enquiries or signups today" : "enquiries + signups · today",
      tone: "members",
      icon: Zap,
      loading: props.loading,
    },
    {
      key: "action_queue",
      label: "Action queue",
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
    {
      key: "ingest",
      label: "Ingest",
      value: ingestLabel,
      hint: props.ingestStatus === "healthy" ? "All feeds nominal" : "Some feeds degraded",
      tone: ingestTone,
      icon: ingestIcon,
      loading: props.loading,
      forceQuiet: false,
    },
  ];

  return (
    <section aria-label="Live command strip" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {tiles.map((t) => <Tile key={t.key} tile={t} />)}
    </section>
  );
}
