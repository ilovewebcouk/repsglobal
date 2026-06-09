/**
 * HeroOverlay — the LOCKED REPs marketing-hero overlay system.
 *
 * Use on every full-bleed image hero (pillar pages + /for-professionals when
 * applicable). The recipe (do not modify ad-hoc — change the primitive instead):
 *
 *   Layer 1  Mobile-only flat ink wash (/55) for legibility on small screens.
 *   Layer 2  Desktop directional linear gradient on the COPY side
 *            (0.72 → 0.55 → 0.20 → 0 across ~78%). Opposite side stays clear so
 *            the hero photo reads at full strength.
 *   Layer 3  Soft radial darken anchored behind the copy column (~0.32) for
 *            headline anchoring without crushing the photo.
 *   Layer 4  Small warm brand-orange wash (≤0.12) in the top corner on the
 *            copy side — atmospheric only.
 *   Layer 5  Bottom fade to reps-ink for section handoff (h-32 mobile / h-56 lg).
 *
 * Tune via:
 *   copySide   — which side the headline sits on (default "left").
 *   intensity  — "standard" (operations baseline) or "soft" (bright/low-contrast
 *                photos where the standard wash crushes detail).
 *
 * Never re-implement these layers inline in a route file. See
 * mem://design/hero-overlay-system.
 */

type Side = "left" | "right";

export interface HeroOverlayProps {
  copySide?: Side;
  intensity?: "standard" | "soft";
}

const LINEAR_STOPS = {
  standard: {
    left: "linear-gradient(90deg,rgba(10,10,12,0.72)_0%,rgba(10,10,12,0.55)_30%,rgba(10,10,12,0.20)_58%,rgba(10,10,12,0)_78%)",
    right: "linear-gradient(270deg,rgba(10,10,12,0.72)_0%,rgba(10,10,12,0.55)_30%,rgba(10,10,12,0.20)_58%,rgba(10,10,12,0)_78%)",
  },
  soft: {
    left: "linear-gradient(90deg,rgba(10,10,12,0.62)_0%,rgba(10,10,12,0.45)_30%,rgba(10,10,12,0.15)_58%,rgba(10,10,12,0)_78%)",
    right: "linear-gradient(270deg,rgba(10,10,12,0.62)_0%,rgba(10,10,12,0.45)_30%,rgba(10,10,12,0.15)_58%,rgba(10,10,12,0)_78%)",
  },
} as const;

const RADIAL_ANCHOR = {
  left: "radial-gradient(50%_80%_at_15%_55%,rgba(10,10,12,0.32),transparent_72%)",
  right: "radial-gradient(50%_80%_at_85%_55%,rgba(10,10,12,0.32),transparent_72%)",
} as const;

const BRAND_GLOW = {
  left: "radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.10),transparent_70%)",
  right: "radial-gradient(40%_45%_at_85%_20%,rgba(255,122,0,0.10),transparent_70%)",
} as const;

export function HeroOverlay({ copySide = "left", intensity = "standard" }: HeroOverlayProps) {
  const linear = LINEAR_STOPS[intensity][copySide];
  const radial = RADIAL_ANCHOR[copySide];
  const glow = BRAND_GLOW[copySide];

  return (
    <>
      {/* Mobile: flat dim for legibility (copy spans the full width). */}
      <div aria-hidden className="absolute inset-0 bg-reps-ink/55 lg:hidden" />

      {/* Desktop: directional gradient on the copy side, photo side stays clear. */}
      <div aria-hidden className={`absolute inset-0 hidden lg:block bg-[${linear}]`} />

      {/* Soft anchor behind the headline. */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_45%,rgba(10,10,12,0.55),transparent_75%)] lg:bg-[${radial}]`}
      />

      {/* Warm brand glow on the copy-side top corner. */}
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.12),transparent_72%)] lg:bg-[${glow}]`}
      />

      {/* Bottom fade to reps-ink for section handoff. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-reps-ink/65 to-reps-ink lg:h-56 lg:via-reps-ink/70"
      />
    </>
  );
}
