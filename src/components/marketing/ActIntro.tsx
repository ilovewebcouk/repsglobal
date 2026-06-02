import * as React from "react";

export interface ActIntroProps {
  act: "Act 1" | "Act 2";
  kicker: string;
  eyebrow: string;
  title: string;
  body?: string;
}

export function ActIntro({ act, kicker, eyebrow, title, body }: ActIntroProps) {
  return (
    <div className="max-w-[820px]">
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
        <span className="rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-reps-orange">
          {act}
        </span>
        <span className="text-white/55">· {kicker}</span>
      </div>
      <span className="mt-5 block text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
        {eyebrow}
      </span>
      <h2 className="mt-2 font-display text-[34px] font-bold leading-[1.05] text-white lg:text-[46px]">
        {title}
      </h2>
      {body && (
        <p className="mt-4 max-w-[640px] text-[15.5px] leading-relaxed text-white/70">
          {body}
        </p>
      )}
    </div>
  );
}
