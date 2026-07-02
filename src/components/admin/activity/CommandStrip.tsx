// Admin Activity — Command Strip (v2.2).
// 6 tiles max, banded: Live (3) + Ops (3).
// Removed: standalone "Views 5m" and standalone "Ingest".
// Added: "Key actions" (commercial conversions today).
// Health tile subsumes ingest/linker/rollup health.

import {
  AlertTriangle, Eye, Radio, Users, Zap, ShieldCheck, ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type CommandTone = "public" | "members" | "alert" | "warn" | "neutral" | "healthy" | "success";
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
  onClick?: () => void;
}

export interface CommandStripProps {
  publicOnline: number;
  membersOnline: number;
  keyActionsToday: number;
  attentionCount: number;
  criticalCount: number;
  ingestStatus: IngestStatus;
  loading?: boolean;
  onOpenActionQueue?: () => void;
  onOpenKeyActions?: () => void;
}

const TONE: Record<CommandTone, { ring: string; dot: string; iconBg: string; iconFg: string; valueColor: string }> = {
  public:   { ring: "border-blue-400/25 hover:border-blue-400/50",       dot: "bg-blue-400",    iconBg: "bg-blue-500/15",    iconFg: "text-blue-300",    valueColor: "text-blue-50" },
  members:  { ring: "border-orange-400/25 hover:border-orange-400/50",   dot: "bg-orange-400",  iconBg: "bg-orange-500/15",  iconFg: "text-orange-300",  valueColor: "text-orange-50" },
  alert:    { ring: "border-rose-500/40 hover:border-rose-500/60",       dot: "bg-rose-400",    iconBg: "bg-rose-500/15",    iconFg: "text-rose-300",    valueColor: "text-white" },
  warn:     { ring: "border-amber-500/35 hover:border-amber-500/55",     dot: "bg-amber-400",   iconBg: "bg-amber-500/15",   iconFg: "text-amber-300",   valueColor: "text-white" },
  healthy:  { ring: "border-emerald-400/25 hover:border-emerald-400/45", dot: "bg-emerald-400", iconBg: "bg-emerald-500/15", iconFg: "text-emerald-300", valueColor: "text-emerald-50" },
  success:  { ring: "border-emerald-400/30 hover:border-emerald-400/60", dot: "bg-emerald-400", iconBg: "bg-emerald-500/15", iconFg: "text-emerald-300", valueColor: "text-emerald-50" },
  neutral:  { ring: "border-white/[0.08] hover:border-white/20",         dot: "bg-white/40",    iconBg: "bg-white/[0.06]",   iconFg: "text-white/60",    valueColor: "text-white" },
};

function Tile({ tile }: { tile: CommandTile }) {
  const t = TONE[tile.tone];
  const Icon = tile.icon;
  const isQuiet = tile.forceQuiet ?? tile.value === 0;
  const showLiveDot =
    !isQuiet && (tile.tone === "public" || tile.tone === "members" || tile.tone === "healthy" || tile.tone === "success");
  const clickable = typeof tile.onClick === "function";
  const Wrapper: React.ElementType = clickable ? "button" : "div";
  return (
    <Wrapper
      {...(clickable ? { type: "button", onClick: tile.onClick } : {})}
      data-command-tile={tile.key}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[14px] border bg-reps-panel px-3.5 py-3 text-left transition",
        isQuiet ? "border-white/[0.06]" : t.ring,
        clickable && "cursor-pointer hover:bg-white/[0.03]",
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
    </Wrapper>
  );
}

function BandLabel({ label, dot }: { label: string; dot: string }) {
  return (
    <div className="mb-1 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/40">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </div>
  );
}

export function CommandStrip(props: CommandStripProps) {
  const ingestLabel =
    props.ingestStatus === "down" ? "Down" :
    props.ingestStatus === "degraded" ? "Degraded" : "Healthy";
  const ingestTone: CommandTone =
    props.ingestStatus === "down" ? "alert" :
    props.ingestStatus === "degraded" ? "warn" : "healthy";
  const ingestIcon = props.ingestStatus === "healthy" ? ShieldCheck : ShieldAlert;

  const live: CommandTile[] = [
    {
      key: "live_now",
      label: "Live now",
      value: props.publicOnline + props.membersOnline,
      hint: (props.publicOnline + props.membersOnline) === 0
        ? "No sessions right now"
        : `${props.publicOnline} public · ${props.membersOnline} members`,
      tone: (props.publicOnline + props.membersOnline) > 0 ? "healthy" : "neutral",
      icon: Radio,
      loading: props.loading,
    },
    {
      key: "public_now",
      label: "Public now",
      value: props.publicOnline,
      hint: props.publicOnline === 0 ? "Waiting for consented traffic" : "anonymous · live",
      tone: "public",
      icon: Eye,
      loading: props.loading,
    },
    {
      key: "members_now",
      label: "Members now",
      value: props.membersOnline,
      hint: props.membersOnline === 0 ? "No members active" : "logged in · live",
      tone: "members",
      icon: Users,
      loading: props.loading,
    },
  ];

  const ops: CommandTile[] = [
    {
      key: "key_actions",
      label: "Key actions today",
      value: props.keyActionsToday,
      hint: props.keyActionsToday === 0
        ? "No enquiries, signups or checkouts today"
        : "enquiries · signups · checkouts",
      tone: props.keyActionsToday > 0 ? "success" : "neutral",
      icon: Zap,
      loading: props.loading,
      onClick: props.onOpenKeyActions,
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
      onClick: props.onOpenActionQueue,
    },
    {
      key: "health",
      label: "Health",
      value: ingestLabel,
      hint: props.ingestStatus === "healthy" ? "Ingest · linker · rollup nominal" : "Some feeds degraded",
      tone: ingestTone,
      icon: ingestIcon,
      loading: props.loading,
    },
  ];

  return (
    <section aria-label="Live command strip" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <BandLabel label="Live" dot="bg-emerald-400" />
        <div className="grid grid-cols-3 gap-2">
          {live.map((t) => <Tile key={t.key} tile={t} />)}
        </div>
      </div>
      <div>
        <BandLabel label="Ops" dot="bg-white/40" />
        <div className="grid grid-cols-3 gap-2">
          {ops.map((t) => <Tile key={t.key} tile={t} />)}
        </div>
      </div>
    </section>
  );
}
