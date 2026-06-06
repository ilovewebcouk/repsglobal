interface PillarChapterProps {
  number: number;
  name: string;
  promise: string;
}

/**
 * Lightweight chapter divider used on /for-professionals to group multiple
 * ProductBlock features under a single pillar. Quieter than a ProductBlock
 * title so it reads as a chapter heading, not another section.
 */
export function PillarChapter({ number, name, promise }: PillarChapterProps) {
  return (
    <div className="border-t border-reps-border pt-10 lg:pt-12">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
        Pillar {number}
      </span>
      <h2 className="mt-2 font-display text-[24px] font-bold leading-tight text-white lg:text-[30px]">
        {name}
      </h2>
      <p className="mt-2 max-w-[640px] text-[14.5px] leading-relaxed text-white/65">
        {promise}
      </p>
    </div>
  );
}
