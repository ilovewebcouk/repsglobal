import { Camera } from "lucide-react";

import type { Competitor } from "@/data/competitor-data";

/**
 * Placeholder side-by-side UI frames. Real screenshots get dropped in later;
 * for now we render labelled empty frames so the layout is final.
 */
export function UiSideBySide({ c }: { c: Competitor }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Frame label="REPS" caption="Verified profile + branded client portal" isReps />
      <Frame label={c.name} caption={`${c.name} coaching app`} />
    </div>
  );
}

function Frame({
  label,
  caption,
  isReps,
}: {
  label: string;
  caption: string;
  isReps?: boolean;
}) {
  return (
    <div
      className={
        isReps
          ? "overflow-clip rounded-[22px] border border-reps-orange/40 bg-gradient-to-b from-reps-orange/10 to-reps-orange/[0.02]"
          : "overflow-clip rounded-[22px] border border-reps-border bg-reps-panel"
      }
    >
      <div className="flex items-center justify-between border-b border-reps-border/60 bg-reps-ink/40 px-4 py-2.5">
        <span
          className={`text-[12px] font-semibold uppercase tracking-wider ${
            isReps ? "text-reps-orange" : "text-white/65"
          }`}
        >
          {label}
        </span>
        <span className="rounded-full border border-reps-border/60 bg-reps-ink/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
          Screenshot coming soon
        </span>
      </div>
      <div className="flex aspect-[16/10] items-center justify-center bg-[radial-gradient(60%_60%_at_50%_40%,rgba(255,122,0,0.06),transparent)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Camera className="h-8 w-8 text-white/30" />
          <p className="max-w-[240px] text-[12.5px] text-white/55">{caption}</p>
        </div>
      </div>
    </div>
  );
}
