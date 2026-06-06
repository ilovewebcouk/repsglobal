import { AlertTriangle, ScanLine, Sparkles, TrendingUp } from "lucide-react";

const ITEMS = [
  {
    icon: ScanLine,
    label: "Lead scoring",
    body: "Tom W. scored 92/100. Asked about price + insurance — high intent. Draft sent at 09:02.",
    impact: "+1 likely booking",
  },
  {
    icon: AlertTriangle,
    label: "Risk alert",
    body: "Emma R. missed 2 of 3 sessions and hasn't replied in 5 days. Drafted check-in ready.",
    impact: "Retain £450 block",
  },
  {
    icon: TrendingUp,
    label: "Plateau detection",
    body: "Marcus B. squat stalled 3 weeks. Suggests deload + tempo work — programme drafted.",
    impact: "Restart progress",
  },
  {
    icon: Sparkles,
    label: "Next move",
    body: "3 leads from last week unreplied. Replying within 24h converts 2.4× more often.",
    impact: "+£180 est. this week",
  },
];

export function AiNoticedFeed() {
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            This week, REPs noticed
          </div>
          <div className="mt-1 font-display text-[18px] font-bold text-white">
            Four things you'd have missed.
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink px-2.5 py-1 text-[10.5px] text-white/55 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-reps-orange" /> Live
        </span>
      </div>
      <ul className="space-y-2.5">
        {ITEMS.map((it, i) => (
          <li
            key={i}
            className="group rounded-[14px] border border-reps-border bg-reps-ink/60 p-3.5 transition-colors hover:border-reps-orange-border"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <it.icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
                    {it.label}
                  </span>
                  <span className="text-[10.5px] font-semibold text-reps-orange">
                    {it.impact}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-white/80">{it.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
