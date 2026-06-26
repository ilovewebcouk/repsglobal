import * as React from "react";
import { cn } from "@/lib/utils";

type Point = { date: string; count: number };

export function HeaderSparkline({
  data,
  width = 124,
  height = 30,
  className,
}: {
  data: Point[] | null | undefined;
  width?: number;
  height?: number;
  className?: string;
}) {
  const pts = data ?? [];
  const hasData = pts.some((p) => p.count > 0);
  const total = pts.reduce((a, b) => a + b.count, 0);

  // Empty state: dotted baseline with helper copy.
  if (!hasData) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-[12px] text-white/55",
          className,
        )}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden
          className="shrink-0"
        >
          <line
            x1={0}
            x2={width}
            y1={height - 4}
            y2={height - 4}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.5}
            strokeDasharray="2 3"
            strokeLinecap="round"
          />
        </svg>
        <span className="truncate">Tracking views — your first visitor lands here.</span>
      </span>
    );
  }

  const max = Math.max(1, ...pts.map((p) => p.count));
  const stepX = pts.length > 1 ? width / (pts.length - 1) : 0;
  const padY = 3;
  const usableH = height - padY * 2;
  const coords = pts.map((p, i) => {
    const x = i * stepX;
    const y = padY + (1 - p.count / max) * usableH;
    return [x, y] as const;
  });
  const path = coords
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`))
    .join(" ");
  const fillPath = `${path} L ${width.toFixed(1)} ${height} L 0 ${height} Z`;

  // Draw-in animation. Length ≈ width * 1.6 is generous and works for any path.
  const dash = Math.round(width * 1.6);

  const lastIdx = pts.length - 1;
  const lastPt = pts[lastIdx];

  return (
    <span
      className={cn(
        "group/sparkline inline-flex items-center gap-2 text-[12px] text-white/65",
        className,
      )}
      title={`${total} view${total === 1 ? "" : "s"} in the last 14 days`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-label={`Last 14 days: ${total} profile view${total === 1 ? "" : "s"}`}
        className="shrink-0"
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#sparkFill)" opacity={0.9} />
        <path
          d={path}
          fill="none"
          stroke="var(--reps-orange)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: dash,
            strokeDashoffset: dash,
            animation: "spark-draw 700ms ease-out forwards",
          }}
        />
        {lastPt ? (
          <circle
            cx={coords[lastIdx][0]}
            cy={coords[lastIdx][1]}
            r={2.5}
            fill="var(--reps-orange)"
            style={{ opacity: 0, animation: "spark-dot 240ms ease-out 600ms forwards" }}
          />
        ) : null}
      </svg>
      <span className="truncate">
        <span className="font-medium text-white">{total}</span>{" "}
        <span className="text-white/55">views · 14d</span>
      </span>
      <style>{`
        @keyframes spark-draw { to { stroke-dashoffset: 0; } }
        @keyframes spark-dot { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .group\\/sparkline svg path[style] { animation: none !important; stroke-dashoffset: 0 !important; }
          .group\\/sparkline svg circle[style] { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
    </span>
  );
}
