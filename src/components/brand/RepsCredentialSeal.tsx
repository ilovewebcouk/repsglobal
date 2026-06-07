import { cn } from "@/lib/utils";

/**
 * REPs Credential Seal — circular "engraved" badge in the spirit of CSCS / NSCA.
 *
 * Inline SVG so it scales crisply from favicon to hero, recolours via tokens,
 * and reuses the master `RepsWordmark` path data so the centre mark is always
 * in sync with the site header logo.
 *
 *   ┌── outer thin ring
 *   │    "LEVEL 3 PERSONAL TRAINER"            (top arc, curved)
 *   │    ★                                ★    (star separators at 9/3 o'clock)
 *   │           ┌── solid disc ──┐
 *   │           │     REPs       │
 *   │           │   ──────       │
 *   │           │   Est. 2002    │
 *   │           └────────────────┘
 *   │    "REGISTER OF EXERCISE PROFESSIONALS"  (bottom arc, curved, upright)
 *   └── outer thin ring
 */

export type RepsCredentialSealProps = {
  /** Credential name rendered along the top arc. Auto-uppercased. */
  qualification: string;
  /** Year the credential authority was established. Defaults to 2002 (REPs). */
  established?: number;
  /** Long-form name of the issuing register, shown on the bottom arc. */
  authority?: string;
  /** Visual variant. `dark` = ink on ivory (default). `inverse` = ivory on ink. */
  variant?: "dark" | "inverse";
  /** Rendered size in px. ViewBox is fixed so all geometry scales together. */
  size?: number;
  className?: string;
};

// REPs wordmark path data — copied verbatim from `RepsWordmark.tsx`
// (same source-of-truth glyphs, same tracking).
const WORDMARK_VIEWBOX = { minX: 116, minY: -1510, w: 5257.6, h: 1530 };
const WORDMARK_PATHS: { d: string; tx: number }[] = [
  {
    tx: 0,
    d: "M116 0V1490H726Q894 1490 1016.0 1429.5Q1138 1369 1203.5 1258.0Q1269 1147 1269 995Q1269 842 1202.0 733.5Q1135 625 1011.0 569.0Q887 513 716 513H327V792H652Q735 792 790.5 814.0Q846 836 874.5 881.0Q903 926 903 995Q903 1065 874.5 1111.0Q846 1157 790.0 1180.5Q734 1204 651 1204H469V0ZM934 0 571 681H949L1321 0Z",
  },
  {
    tx: 1407.2,
    d: "M116 0V1490H1150V1202H469V894H1096V612H469V288H1149V0Z",
  },
  {
    tx: 2707.4,
    d: "M116 0V1490H726Q894 1490 1016.0 1425.0Q1138 1360 1203.5 1244.0Q1269 1128 1269 975Q1269 821 1202.0 707.0Q1135 593 1011.0 529.0Q887 465 716 465H338V744H652Q735 744 791.0 773.0Q847 802 875.0 854.0Q903 906 903 975Q903 1045 875.0 1096.5Q847 1148 790.5 1176.0Q734 1204 651 1204H469V0Z",
  },
  {
    tx: 4093.6,
    d: "M691 -20Q505 -20 367.0 36.0Q229 92 152.0 206.0Q75 320 72 492H411Q416 420 450.5 371.0Q485 322 545.5 297.5Q606 273 687 273Q760 273 813.0 293.0Q866 313 894.5 349.0Q923 385 923 433Q923 476 896.5 506.0Q870 536 817.0 559.0Q764 582 682 600L524 637Q331 681 221.0 781.0Q111 881 111 1049Q111 1187 186.0 1291.0Q261 1395 391.5 1452.5Q522 1510 691 1510Q864 1510 991.0 1451.5Q1118 1393 1188.0 1288.5Q1258 1184 1260 1046H921Q914 1127 855.0 1172.0Q796 1217 690 1217Q620 1217 572.0 1198.5Q524 1180 500.0 1147.5Q476 1115 476 1073Q476 1027 503.0 995.5Q530 964 580.0 943.0Q630 922 696 907L825 877Q933 854 1017.5 814.5Q1102 775 1160.5 720.0Q1219 665 1249.5 593.0Q1280 521 1280 432Q1280 291 1209.5 189.5Q1139 88 1007.5 34.0Q876 -20 691 -20Z",
  },
];

export function RepsCredentialSeal({
  qualification,
  established = 2002,
  authority = "Register of Exercise Professionals",
  variant = "dark",
  size = 240,
  className,
}: RepsCredentialSealProps) {
  // Fixed viewBox — all geometry below is in these coordinates.
  const VB = 400;
  const cx = VB / 2;
  const cy = VB / 2;

  // Ring geometry
  const rOuter = 196; // outermost stroke
  const rTextBandOuter = 180;
  const rTextBandInner = 152;
  const rInnerStroke = 150; // thicker inner ring
  const rDisc = 146; // solid centre disc
  const rText = 168; // radius for curved text baseline

  // Colours — pull semantic tokens via CSS vars so this auto-themes.
  const isInverse = variant === "inverse";
  const fg = isInverse ? "var(--reps-ivory)" : "var(--reps-ink)";
  const bg = isInverse ? "var(--reps-ink)" : "var(--reps-ivory)";
  const fgSoft = isInverse ? "var(--reps-text-soft)" : "var(--reps-charcoal)";

  // Curved text paths.
  // Top: arc OVER the top, left→right, sweep=1 → text reads upright.
  const topPath = `M ${cx - rText} ${cy} A ${rText} ${rText} 0 0 1 ${cx + rText} ${cy}`;
  // Bottom: arc UNDER the bottom, right→left, sweep=1 → clockwise from 3→6→9
  // o'clock in y-down screen coords = lower half, and reversed direction keeps
  // characters upright with their tops pointing toward the centre of the disc.
  const bottomPath = `M ${cx + rText} ${cy} A ${rText} ${rText} 0 0 1 ${cx - rText} ${cy}`;

  // Centre wordmark — scale REPs glyphs to fit ~135px wide inside disc.
  const wordmarkTargetWidth = 138;
  const wmScale = wordmarkTargetWidth / WORDMARK_VIEWBOX.w;
  const wmHeight = WORDMARK_VIEWBOX.h * wmScale;
  // Wordmark glyphs are drawn in their native em-box and then translated to
  // sit centred horizontally and slightly above vertical centre of the disc.
  const wmCx = cx;
  const wmCy = cy - 6;

  // 5-point star at the seal's "waist" (9 and 3 o'clock).
  const starPath = (px: number, py: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? r : r * 0.42;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const x = px + radius * Math.cos(angle);
      const y = py + radius * Math.sin(angle);
      pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return `M${pts.join(" L")} Z`;
  };

  const trackingTop = 4.2;
  const trackingBottom = 3.6;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VB} ${VB}`}
      width={size}
      height={size}
      role="img"
      aria-label={`${qualification} — ${authority}, established ${established}`}
      className={cn("block select-none", className)}
    >
      <defs>
        <path id="seal-top-arc" d={topPath} />
        <path id="seal-bottom-arc" d={bottomPath} />
      </defs>

      {/* Outer thin ring — the seal's silhouette */}
      <circle
        cx={cx}
        cy={cy}
        r={rOuter}
        fill={bg}
        stroke={fg}
        strokeWidth={2}
      />

      {/* Inner thicker ring that frames the centre disc */}
      <circle
        cx={cx}
        cy={cy}
        r={rInnerStroke}
        fill="none"
        stroke={fg}
        strokeWidth={5}
      />
      {/* Hairline accent just outside the thick ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rInnerStroke + 6}
        fill="none"
        stroke={fg}
        strokeWidth={1}
        opacity={0.55}
      />
      {/* Hairline accent just inside the outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rTextBandOuter + 9}
        fill="none"
        stroke={fg}
        strokeWidth={1}
        opacity={0.55}
      />

      {/* Centre solid disc */}
      <circle cx={cx} cy={cy} r={rDisc} fill={bg} />

      {/* Top curved text — qualification name */}
      <text
        fill={fg}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fontSize={20}
        letterSpacing={trackingTop}
      >
        <textPath
          href="#seal-top-arc"
          startOffset="50%"
          textAnchor="middle"
        >
          {qualification.toUpperCase()}
        </textPath>
      </text>

      {/* Bottom curved text — issuing authority */}
      <text
        fill={fg}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fontSize={15}
        letterSpacing={trackingBottom}
      >
        <textPath
          href="#seal-bottom-arc"
          startOffset="50%"
          textAnchor="middle"
        >
          {authority.toUpperCase()}
        </textPath>
      </text>

      {/* Star separators at 9 and 3 o'clock, sitting on the text band */}
      <path d={starPath(cx - rText, cy, 7)} fill={fg} />
      <path d={starPath(cx + rText, cy, 7)} fill={fg} />

      {/* Centre stack: wordmark + divider + Est. line */}
      <g
        transform={`translate(${wmCx - wordmarkTargetWidth / 2} ${wmCy - wmHeight / 2}) scale(${wmScale})`}
      >
        {/* The wordmark paths are authored with y flipped (negative y up); we
            wrap in a (1, -1) scale and translate so they sit upright. */}
        <g transform={`scale(1 -1) translate(${-WORDMARK_VIEWBOX.minX} ${-WORDMARK_VIEWBOX.minY - WORDMARK_VIEWBOX.h})`}>
          {WORDMARK_PATHS.map((p, i) => (
            <path key={i} d={p.d} transform={`translate(${p.tx} 0)`} fill={fg} />
          ))}
        </g>
      </g>

      {/* ® mark sitting top-right of the wordmark */}
      <text
        x={wmCx + wordmarkTargetWidth / 2 + 4}
        y={wmCy - wmHeight / 2 + 8}
        fill={fg}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fontSize={9}
      >
        ®
      </text>

      {/* Hairline divider under the wordmark */}
      <line
        x1={cx - 36}
        y1={wmCy + wmHeight / 2 + 12}
        x2={cx + 36}
        y2={wmCy + wmHeight / 2 + 12}
        stroke={fg}
        strokeWidth={1.25}
      />

      {/* Est. YEAR */}
      <text
        x={cx}
        y={wmCy + wmHeight / 2 + 30}
        fill={fgSoft}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fontSize={13}
        letterSpacing={1.2}
        textAnchor="middle"
      >
        Est. {established}
      </text>
    </svg>
  );
}
