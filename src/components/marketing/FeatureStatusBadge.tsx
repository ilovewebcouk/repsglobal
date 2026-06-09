import { CheckCircle2, FlaskConical, Clock, Map, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type FeatureStatus = "available" | "beta" | "soon" | "planned";

type StatusMeta = {
  label: string;
  icon: LucideIcon;
  /** Status accent classes — emerald is reserved for "Available now" per design tokens. */
  className: string;
};

const STATUS_MAP: Record<FeatureStatus, StatusMeta> = {
  available: {
    label: "Available now",
    icon: CheckCircle2,
    className: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  },
  beta: {
    label: "In beta",
    icon: FlaskConical,
    className: "border-reps-orange/35 bg-reps-orange-soft text-reps-orange",
  },
  soon: {
    label: "Coming soon",
    icon: Clock,
    className: "border-white/15 bg-white/10 text-white/80",
  },
  planned: {
    label: "Planned",
    icon: Map,
    className: "border-white/10 bg-white/5 text-white/60",
  },
};

export const FEATURE_STATUS_LABEL: Record<FeatureStatus, string> = {
  available: STATUS_MAP.available.label,
  beta: STATUS_MAP.beta.label,
  soon: STATUS_MAP.soon.label,
  planned: STATUS_MAP.planned.label,
};

export const FEATURE_STATUS_BLURB: Record<FeatureStatus, string> = {
  available: "This feature is available in the current beta.",
  beta: "This feature is being tested and improved with early members.",
  soon: "This feature is planned for an upcoming release.",
  planned: "This feature is on the product roadmap but is not yet available.",
};

type Props = {
  status: FeatureStatus;
  className?: string;
  /** When true, hides the icon and uses tighter padding for inline use. */
  compact?: boolean;
};

export function FeatureStatusBadge({ status, className, compact = false }: Props) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        meta.className,
        className,
      )}
    >
      {!compact ? <Icon className="size-3" /> : null}
      {meta.label}
    </span>
  );
}
