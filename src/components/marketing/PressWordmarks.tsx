/**
 * Real publisher wordmarks rendered as inline SVG. Each source SVG is
 * imported as raw text, normalised at module load (all baked fills and
 * gradients replaced with `currentColor`, width/height stripped), and
 * injected via dangerouslySetInnerHTML so the parent text color tints
 * every mark uniformly — matching the existing marquee tint mechanism.
 *
 * The user has confirmed permission to display these marks.
 *
 * Women's Fitness ships as a typographic SVG (no raster source needed) to
 * keep the strip a uniform vector row.
 */

import theTimesRaw from "@/assets/press/the_times.svg?raw";
import bbcSportRaw from "@/assets/press/bbc_sport.svg?raw";
import skyNewsRaw from "@/assets/press/sky_news.svg?raw";
import theIndependentRaw from "@/assets/press/the_independent.svg?raw";
import gqRaw from "@/assets/press/gq.svg?raw";
import mensHealthRaw from "@/assets/press/mens_health.svg?raw";
import runnersWorldRaw from "@/assets/press/runners_world.svg?raw";

type WordmarkProps = { className?: string };

type Normalised = { viewBox: string; inner: string };

/**
 * Strip width/height, force every fill to currentColor (including gradient
 * references and inline style fills), and extract viewBox + inner markup.
 */
function normalise(raw: string): Normalised {
  // Pull viewBox off the root <svg>
  const viewBoxMatch = raw.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 100 32";

  // Extract inner markup
  const openTagEnd = raw.indexOf(">", raw.indexOf("<svg"));
  const closeTagStart = raw.lastIndexOf("</svg>");
  let inner = raw.slice(openTagEnd + 1, closeTagStart);

  // Remove embedded <style> blocks (some uploads bake CSS variables in)
  inner = inner.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Drop gradient + linearGradient defs entirely (they reference colours)
  inner = inner.replace(/<linearGradient[\s\S]*?<\/linearGradient>/gi, "");
  inner = inner.replace(/<radialGradient[\s\S]*?<\/radialGradient>/gi, "");
  // Empty <defs> left behind after gradient removal — leave them; harmless.

  // Replace fill="url(#anything)" with currentColor
  inner = inner.replace(/fill="url\(#[^)]*\)"/gi, 'fill="currentColor"');
  // Replace any fill="#xxxxxx" (3/6/8-hex) with currentColor
  inner = inner.replace(/fill="#[0-9a-f]{3,8}"/gi, 'fill="currentColor"');
  // Replace fill="rgb(...)" / fill="rgba(...)" with currentColor
  inner = inner.replace(/fill="rgba?\([^)]+\)"/gi, 'fill="currentColor"');
  // Replace inline style fills: style="...fill:#xxx;..." → strip fill prop;
  // any remaining style attribute keeps its other rules.
  inner = inner.replace(/fill\s*:\s*[^;"']+;?/gi, "fill:currentColor;");
  // Any var(--primary, ...) fallthrough → currentColor
  inner = inner.replace(/var\(--primary[^)]*\)/gi, "currentColor");

  return { viewBox, inner };
}

const TIMES = normalise(theTimesRaw);
const BBC = normalise(bbcSportRaw);
const SKY = normalise(skyNewsRaw);
const INDEPENDENT = normalise(theIndependentRaw);
const GQ = normalise(gqRaw);
const MENS = normalise(mensHealthRaw);
const RUNNERS = normalise(runnersWorldRaw);

function InlineMark({
  data,
  label,
  className,
}: {
  data: Normalised;
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={data.viewBox}
      className={className}
      role="img"
      aria-label={label}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      dangerouslySetInnerHTML={{ __html: data.inner }}
    />
  );
}

export function TheTimesMark({ className }: WordmarkProps) {
  return <InlineMark data={TIMES} label="The Times" className={className} />;
}

export function BbcSportMark({ className }: WordmarkProps) {
  return <InlineMark data={BBC} label="BBC Sport" className={className} />;
}

export function SkyNewsMark({ className }: WordmarkProps) {
  return <InlineMark data={SKY} label="Sky News" className={className} />;
}

export function TheIndependentMark({ className }: WordmarkProps) {
  return (
    <InlineMark data={INDEPENDENT} label="The Independent" className={className} />
  );
}

export function GqMark({ className }: WordmarkProps) {
  return <InlineMark data={GQ} label="GQ" className={className} />;
}

export function MensHealthMark({ className }: WordmarkProps) {
  return <InlineMark data={MENS} label="Men's Health" className={className} />;
}

export function RunnersWorldMark({ className }: WordmarkProps) {
  return (
    <InlineMark data={RUNNERS} label="Runner's World" className={className} />
  );
}

/**
 * Women's Fitness — typographic SVG so the raster source isn't needed and
 * the mark inherits `currentColor` like every other entry.
 */
export function WomensFitnessMark({ className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 320 60"
      className={className}
      role="img"
      aria-label="Women's Fitness"
      fill="currentColor"
    >
      <text
        x="0"
        y="46"
        fontFamily="'Cooper Black', 'Georgia', 'Times New Roman', serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="48"
        letterSpacing="-1"
      >
        Women&apos;s Fitness
      </text>
    </svg>
  );
}

export const PRESS_WORDMARKS = [
  { key: "the-times", Mark: TheTimesMark, widthClass: "w-[120px]" },
  { key: "bbc-sport", Mark: BbcSportMark, widthClass: "w-[58px]" },
  { key: "sky-news", Mark: SkyNewsMark, widthClass: "w-[130px]" },
  { key: "the-independent", Mark: TheIndependentMark, widthClass: "w-[164px]" },
  { key: "gq", Mark: GqMark, widthClass: "w-[60px]" },
  { key: "mens-health", Mark: MensHealthMark, widthClass: "w-[150px]" },
  { key: "womens-fitness", Mark: WomensFitnessMark, widthClass: "w-[156px]" },
  { key: "runners-world", Mark: RunnersWorldMark, widthClass: "w-[176px]" },
] as const;
