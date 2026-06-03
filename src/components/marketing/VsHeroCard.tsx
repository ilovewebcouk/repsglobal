import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { DATA_VERIFIED_DATE, type Competitor } from "@/data/competitor-data";

type Props = {
  competitor: Competitor;
};

/**
 * In-page hero card for /compare/reps-vs-* pages.
 * Uses the real REPs wordmark and the real competitor SVG logo, side-by-side
 * with a centered "VS" badge. Static covers (og:image) live in
 * src/assets/compare/*-cover.png and use the same visual language but bolder.
 */
export function VsHeroCard({ competitor }: Props) {
  const competitorPrice = competitor.tiers[0]?.price ?? "";

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-reps-panel p-6 lg:p-8">
      {/* Orange radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 0%, rgba(255,122,0,0.18), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative">
        {/* Eyebrow */}
        <div className="flex items-center justify-between gap-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
          <span>Head-to-head · UK · 2026</span>
          <span className="hidden sm:inline">Last checked {DATA_VERIFIED_DATE}</span>
        </div>

        {/* Tiles + VS */}
        <div className="mt-5 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* REPs tile */}
          <div className="flex h-[120px] items-center justify-center rounded-[18px] bg-reps-orange-soft px-6 lg:h-[140px]">
            <RepsWordmark className="h-9 text-reps-orange lg:h-11" />
          </div>

          {/* VS badge */}
          <div className="relative flex items-center justify-center">
            <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-reps-orange text-[13px] font-display font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_rgba(255,122,0,0.6)] lg:flex lg:h-14 lg:w-14 lg:text-[14px]">
              VS
            </div>
            <div className="flex h-9 w-full items-center justify-center rounded-full bg-reps-orange text-[12px] font-display font-bold uppercase tracking-wider text-white lg:hidden">
              VS
            </div>
          </div>

          {/* Competitor tile */}
          <div className="flex h-[120px] items-center justify-center rounded-[18px] bg-white px-6 lg:h-[140px]">
            <img
              src={competitor.logo}
              alt={competitor.name}
              style={{ height: Math.min(competitor.logoHeight + 14, 56) }}
              className="w-auto"
            />
          </div>
        </div>

        {/* Captions */}
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="text-center lg:text-left">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">
              Verified UK register
            </div>
            <div className="mt-1 text-[13px] text-white/75">
              REPs Pro · £59/mo founding
            </div>
          </div>
          <div className="hidden lg:block lg:w-14" aria-hidden />
          <div className="text-center lg:text-right">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">
              Private coaching software
            </div>
            <div className="mt-1 text-[13px] text-white/75">
              {competitor.name} · from {competitorPrice}
            </div>
          </div>
        </div>

        {/* Mobile last-checked */}
        <div className="mt-5 text-center text-[11px] text-white/45 sm:hidden">
          Last checked {DATA_VERIFIED_DATE}
        </div>
      </div>
    </div>
  );
}
