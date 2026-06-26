import type { ReactNode } from "react";
import { AlertTriangle, Info, Lightbulb, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "note" | "tip" | "warning" | "success";

const TONE_MAP: Record<
  Tone,
  { icon: typeof Info; ring: string; bg: string; text: string; iconClass: string; label: string }
> = {
  note: {
    icon: Info,
    ring: "ring-white/15",
    bg: "bg-white/[0.04]",
    text: "text-white/85",
    iconClass: "text-sky-300",
    label: "Note",
  },
  tip: {
    icon: Lightbulb,
    ring: "ring-reps-orange/30",
    bg: "bg-reps-orange/10",
    text: "text-white/90",
    iconClass: "text-reps-orange",
    label: "Tip",
  },
  warning: {
    icon: AlertTriangle,
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/10",
    text: "text-white/90",
    iconClass: "text-amber-300",
    label: "Heads up",
  },
  success: {
    icon: CheckCircle2,
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-500/15",
    text: "text-white/90",
    iconClass: "text-emerald-300",
    label: "Good",
  },
};

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  const t = TONE_MAP[tone];
  const Icon = t.icon;
  return (
    <div className={cn("my-6 rounded-[16px] p-5 ring-1", t.ring, t.bg, t.text)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", t.iconClass)} aria-hidden />
        <div className="min-w-0 flex-1 text-[14.5px] leading-relaxed">
          <p className="font-semibold text-white">{title ?? t.label}</p>
          <div className="mt-1 [&>p]:my-2 [&>ul]:mt-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:my-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
