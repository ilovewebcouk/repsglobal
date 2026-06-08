/**
 * Editorial "as featured in" wordmarks rendered as inline SVG with
 * `fill="currentColor"` so parent text color controls the marquee tint.
 *
 * These are typographic credits (not the publications' protected logos):
 * each mark uses a widely-available font stack styled to evoke the
 * masthead — italic serif for The Times / Runner's World, condensed
 * sans for Men's Health, Bodoni-style for GQ, plate-and-italic for BBC
 * Sport, mixed weight serif/sans for Women's Fitness.
 *
 * All viewBoxes are 32 units tall so they line up at a uniform pixel
 * height. Widths are tuned for natural lockup width per name.
 */

const serifItalic =
  "'Times New Roman', 'Georgia', 'Hoefler Text', serif";
const serifTall =
  "'Didot', 'Bodoni MT', 'Big Caslon', 'Times New Roman', serif";
const sansCondensed =
  "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif";
const sansBold =
  "'Helvetica Neue', 'Arial', sans-serif";

type WordmarkProps = { className?: string };

export function TheTimesMark({ className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 180 32"
      className={className}
      role="img"
      aria-label="The Times"
      fill="currentColor"
    >
      <text
        x="0"
        y="25"
        fontFamily={serifItalic}
        fontStyle="italic"
        fontWeight="700"
        fontSize="26"
        letterSpacing="-0.5"
      >
        The Times
      </text>
    </svg>
  );
}

export function BbcSportMark({ className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 200 32"
      className={className}
      role="img"
      aria-label="BBC Sport"
      fill="currentColor"
    >
      {/* Three plates for B B C */}
      <rect x="0" y="6" width="20" height="20" rx="1.5" />
      <rect x="23" y="6" width="20" height="20" rx="1.5" />
      <rect x="46" y="6" width="20" height="20" rx="1.5" />
      {/* Cut letters out of plates using inverted text (paint-order trick: text in bg color) */}
      <text
        x="10"
        y="22"
        textAnchor="middle"
        fontFamily={sansBold}
        fontWeight="900"
        fontSize="17"
        fill="rgb(10,10,12)"
      >
        B
      </text>
      <text
        x="33"
        y="22"
        textAnchor="middle"
        fontFamily={sansBold}
        fontWeight="900"
        fontSize="17"
        fill="rgb(10,10,12)"
      >
        B
      </text>
      <text
        x="56"
        y="22"
        textAnchor="middle"
        fontFamily={sansBold}
        fontWeight="900"
        fontSize="17"
        fill="rgb(10,10,12)"
      >
        C
      </text>
      <text
        x="74"
        y="24"
        fontFamily={sansBold}
        fontStyle="italic"
        fontWeight="900"
        fontSize="22"
        letterSpacing="0.5"
      >
        SPORT
      </text>
    </svg>
  );
}

export function MensHealthMark({ className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 240 32"
      className={className}
      role="img"
      aria-label="Men's Health"
      fill="currentColor"
    >
      <text
        x="0"
        y="25"
        fontFamily={sansCondensed}
        fontWeight="900"
        fontSize="28"
        letterSpacing="2"
      >
        MEN&apos;S HEALTH
      </text>
    </svg>
  );
}

export function WomensFitnessMark({ className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 260 32"
      className={className}
      role="img"
      aria-label="Women's Fitness"
      fill="currentColor"
    >
      <text
        x="0"
        y="24"
        fontFamily={serifItalic}
        fontStyle="italic"
        fontWeight="400"
        fontSize="22"
        letterSpacing="-0.2"
      >
        Women&apos;s
      </text>
      <text
        x="105"
        y="25"
        fontFamily={sansBold}
        fontWeight="800"
        fontSize="22"
        letterSpacing="3"
      >
        FITNESS
      </text>
    </svg>
  );
}

export function RunnersWorldMark({ className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 230 32"
      className={className}
      role="img"
      aria-label="Runner's World"
      fill="currentColor"
    >
      <text
        x="0"
        y="24"
        fontFamily={serifItalic}
        fontStyle="italic"
        fontWeight="700"
        fontSize="22"
      >
        Runner&apos;s
      </text>
      <text
        x="105"
        y="25"
        fontFamily={serifTall}
        fontWeight="700"
        fontSize="24"
        letterSpacing="2"
      >
        WORLD
      </text>
    </svg>
  );
}

export function GqMark({ className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 80 32"
      className={className}
      role="img"
      aria-label="GQ"
      fill="currentColor"
    >
      <text
        x="40"
        y="28"
        textAnchor="middle"
        fontFamily={serifTall}
        fontWeight="700"
        fontSize="32"
        letterSpacing="2"
      >
        GQ
      </text>
    </svg>
  );
}

export const PRESS_WORDMARKS = [
  { key: "the-times", Mark: TheTimesMark, widthClass: "w-[112px]" },
  { key: "bbc-sport", Mark: BbcSportMark, widthClass: "w-[128px]" },
  { key: "mens-health", Mark: MensHealthMark, widthClass: "w-[150px]" },
  { key: "womens-fitness", Mark: WomensFitnessMark, widthClass: "w-[162px]" },
  { key: "runners-world", Mark: RunnersWorldMark, widthClass: "w-[144px]" },
  { key: "gq", Mark: GqMark, widthClass: "w-[50px]" },
] as const;
