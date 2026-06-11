import type * as React from "react";

/**
 * Editorial "Where you'll find our trainers" wordmarks rendered as inline SVG
 * with `fill="currentColor"` so the parent text color controls the marquee tint.
 *
 * These are typographic credits (NOT the gyms' protected logos) — each mark
 * uses a widely-available font stack chosen to evoke that brand's visual tone.
 * They live alongside REPS' independent professionals; the parent strip
 * carries the legal hygiene line ("not affiliated with the gyms shown").
 *
 * All viewBoxes are 32 units tall so they line up at a uniform pixel height.
 */

const sansBold =
  "'Helvetica Neue', 'Arial', sans-serif";
const sansHeavy =
  "'Helvetica Neue', 'Arial Black', sans-serif";
const sansCondensed =
  "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif";
const serifTall =
  "'Didot', 'Bodoni MT', 'Big Caslon', 'Times New Roman', serif";
const serifClassic =
  "'Georgia', 'Times New Roman', serif";

type WordmarkProps = { className?: string };

export function PureGymMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 170 32" className={className} role="img" aria-label="PureGym" fill="currentColor">
      <text x="0" y="25" fontFamily={sansHeavy} fontWeight="900" fontSize="26" letterSpacing="-0.6">
        PureGym
      </text>
    </svg>
  );
}

export function GymGroupMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 220 32" className={className} role="img" aria-label="The Gym Group" fill="currentColor">
      <text x="0" y="25" fontFamily={sansBold} fontWeight="800" fontSize="22" letterSpacing="-0.3">
        THE GYM GROUP
      </text>
    </svg>
  );
}

export function VirginActiveMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 230 32" className={className} role="img" aria-label="Virgin Active" fill="currentColor">
      <text x="0" y="25" fontFamily={sansBold} fontStyle="italic" fontWeight="800" fontSize="24" letterSpacing="-0.6">
        Virgin Active
      </text>
    </svg>
  );
}

export function BannatyneMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 210 32" className={className} role="img" aria-label="Bannatyne" fill="currentColor">
      <text x="0" y="25" fontFamily={serifTall} fontWeight="700" fontSize="24" letterSpacing="0.6">
        BANNATYNE
      </text>
    </svg>
  );
}

export function DavidLloydMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 230 32" className={className} role="img" aria-label="David Lloyd" fill="currentColor">
      <text x="0" y="25" fontFamily={serifClassic} fontWeight="700" fontSize="24" letterSpacing="-0.2">
        David Lloyd
      </text>
    </svg>
  );
}

export function NuffieldHealthMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 250 32" className={className} role="img" aria-label="Nuffield Health" fill="currentColor">
      <text x="0" y="25" fontFamily={sansBold} fontWeight="700" fontSize="22" letterSpacing="-0.1">
        Nuffield Health
      </text>
    </svg>
  );
}

export function ThirdSpaceMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 210 32" className={className} role="img" aria-label="Third Space" fill="currentColor">
      <text x="0" y="25" fontFamily={sansCondensed} fontWeight="700" fontSize="24" letterSpacing="2">
        THIRD SPACE
      </text>
    </svg>
  );
}

export function AnytimeFitnessMark({ className }: WordmarkProps) {
  return (
    <svg viewBox="0 0 250 32" className={className} role="img" aria-label="Anytime Fitness" fill="currentColor">
      <text x="0" y="25" fontFamily={sansBold} fontWeight="800" fontSize="22" letterSpacing="-0.2">
        ANYTIME FITNESS
      </text>
    </svg>
  );
}

export type VenueEntry = {
  key: string;
  slug: string;
  label: string;
  Mark: (props: WordmarkProps) => React.ReactElement;
  widthClass: string;
};

/**
 * Canonical venue list. `slug` is used in the `?venue=` filter on
 * /find-a-professional and in pro.venues[]. `label` is the human-readable
 * gym name used in chips and the filter dropdown.
 */
export const VENUES: VenueEntry[] = [
  { key: "puregym", slug: "puregym", label: "PureGym", Mark: PureGymMark, widthClass: "w-[124px]" },
  { key: "gym-group", slug: "gym-group", label: "The Gym Group", Mark: GymGroupMark, widthClass: "w-[168px]" },
  { key: "virgin-active", slug: "virgin-active", label: "Virgin Active", Mark: VirginActiveMark, widthClass: "w-[176px]" },
  { key: "bannatyne", slug: "bannatyne", label: "Bannatyne", Mark: BannatyneMark, widthClass: "w-[160px]" },
  { key: "david-lloyd", slug: "david-lloyd", label: "David Lloyd", Mark: DavidLloydMark, widthClass: "w-[164px]" },
  { key: "nuffield-health", slug: "nuffield-health", label: "Nuffield Health", Mark: NuffieldHealthMark, widthClass: "w-[188px]" },
  { key: "third-space", slug: "third-space", label: "Third Space", Mark: ThirdSpaceMark, widthClass: "w-[162px]" },
  { key: "anytime-fitness", slug: "anytime-fitness", label: "Anytime Fitness", Mark: AnytimeFitnessMark, widthClass: "w-[196px]" },
];
