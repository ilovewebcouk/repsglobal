import * as React from "react";
import { cn } from "@/lib/utils";

type Aspect = "video" | "wide" | "square";

const ASPECT: Record<Aspect, string> = {
  video: "aspect-video",
  wide: "aspect-[21/9]",
  square: "aspect-square",
};

export interface MockupPlaceholderProps {
  label: string;
  aspect?: Aspect;
  className?: string;
}

/**
 * Premium faux-UI placeholder. Renders a browser-framed dark dashboard mock
 * with sidebar, header, and content blocks tuned per `label`. No real data,
 * pure CSS — but reads as a real product screenshot.
 */
export function MockupPlaceholder({
  label,
  aspect = "video",
  className,
}: MockupPlaceholderProps) {
  const variant = pickVariant(label);

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-[18px]",
        "border border-reps-border bg-reps-ink",
        "shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]",
        ASPECT[aspect],
        className,
      )}
      role="img"
      aria-label={`${label} preview`}
    >
      {/* Ambient orange glow */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_55%_at_85%_0%,rgba(255,122,0,0.16),transparent_60%)]"
      />

      {/* Browser chrome */}
      <div className="relative flex h-7 items-center gap-2 border-b border-reps-border bg-reps-panel/70 px-3">
        <span className="h-2 w-2 rounded-full bg-reps-red/70" />
        <span className="h-2 w-2 rounded-full bg-reps-gold/70" />
        <span className="h-2 w-2 rounded-full bg-reps-green/70" />
        <div className="ml-3 flex h-3.5 w-40 items-center rounded-[4px] bg-reps-ink/70 px-2 text-[8px] font-medium text-white/40">
          reps.global / {variant.slug}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-white/30">
            Preview
          </span>
        </div>
      </div>

      {/* App body */}
      <div className="relative flex h-[calc(100%-1.75rem)]">
        {/* Sidebar */}
        <div className="hidden w-[18%] shrink-0 flex-col gap-1 border-r border-reps-border bg-reps-panel/40 p-2 sm:flex">
          <div className="mb-1 flex items-center gap-1.5 px-1.5 py-1">
            <span className="h-3 w-3 rounded-[3px] bg-reps-orange" />
            <span className="h-1.5 w-10 rounded-full bg-white/30" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1.5 rounded-[5px] px-1.5 py-1",
                i === variant.activeNav && "bg-reps-orange-soft",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === variant.activeNav ? "bg-reps-orange" : "bg-white/25",
                )}
              />
              <span
                className={cn(
                  "h-1 rounded-full",
                  i === variant.activeNav ? "bg-reps-orange/80" : "bg-white/20",
                )}
                style={{ width: `${50 + ((i * 13) % 30)}%` }}
              />
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
          {/* Top bar: title + CTA */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-reps-orange/90">
                {variant.eyebrow}
              </span>
              <span className="text-[11px] font-bold text-white/90">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-12 rounded-[4px] border border-reps-border bg-reps-panel" />
              <span className="h-4 w-14 rounded-[4px] bg-reps-orange" />
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-1.5">
            {variant.stats.map((s, i) => (
              <div
                key={i}
                className="rounded-[6px] border border-reps-border bg-reps-panel/70 p-1.5"
              >
                <div className="h-1 w-10 rounded-full bg-white/25" />
                <div className="mt-1 h-2 w-12 rounded-full bg-white/70" />
                <div className="mt-1 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-reps-green" />
                  <span className="h-1 w-6 rounded-full bg-reps-green/60" />
                </div>
              </div>
            ))}
          </div>

          {/* Main content area */}
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
            {/* Big panel: chart or list depending on variant */}
            <div className="col-span-2 rounded-[6px] border border-reps-border bg-reps-panel/70 p-2">
              {variant.kind === "chart" ? (
                <MiniChart />
              ) : variant.kind === "calendar" ? (
                <MiniCalendar />
              ) : (
                <MiniList />
              )}
            </div>

            {/* Side panel: activity */}
            <div className="rounded-[6px] border border-reps-border bg-reps-panel/70 p-2">
              <div className="h-1 w-10 rounded-full bg-white/30" />
              <div className="mt-2 flex flex-col gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-reps-panel-soft" />
                    <div className="min-w-0 flex-1">
                      <div
                        className="h-1 rounded-full bg-white/35"
                        style={{ width: `${60 + ((i * 11) % 30)}%` }}
                      />
                      <div className="mt-1 h-1 w-8 rounded-full bg-white/15" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Variant picker ---------- */

type Variant = {
  slug: string;
  eyebrow: string;
  activeNav: number;
  kind: "chart" | "list" | "calendar";
  stats: string[];
};

function pickVariant(label: string): Variant {
  const l = label.toLowerCase();
  if (l.includes("booking") || l.includes("calendar"))
    return {
      slug: "bookings",
      eyebrow: "This week",
      activeNav: 1,
      kind: "calendar",
      stats: ["Booked", "Pending", "Revenue"],
    };
  if (l.includes("client") || l.includes("crm"))
    return {
      slug: "clients",
      eyebrow: "Active roster",
      activeNav: 2,
      kind: "list",
      stats: ["Active", "At risk", "New"],
    };
  if (l.includes("payment") || l.includes("revenue") || l.includes("insight"))
    return {
      slug: "payments",
      eyebrow: "Last 30 days",
      activeNav: 3,
      kind: "chart",
      stats: ["MRR", "Payouts", "Growth"],
    };
  if (l.includes("profile"))
    return {
      slug: "profile",
      eyebrow: "Live profile",
      activeNav: 0,
      kind: "list",
      stats: ["Views", "Saves", "Enquiries"],
    };
  return {
    slug: "dashboard",
    eyebrow: "Overview",
    activeNav: 0,
    kind: "chart",
    stats: ["Revenue", "Sessions", "Retention"],
  };
}

/* ---------- Mini visualisations ---------- */

function MiniChart() {
  const points = [22, 38, 30, 52, 44, 68, 58, 78, 70, 90, 82, 96];
  const max = 100;
  const w = 100;
  const h = 100;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(h - (p / max) * h).toFixed(2)}`)
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div className="h-1 w-10 rounded-full bg-white/30" />
        <div className="flex gap-1">
          <span className="h-1 w-3 rounded-full bg-reps-orange" />
          <span className="h-1 w-3 rounded-full bg-white/20" />
        </div>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="mt-1 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="mp-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(255 122 0)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(255 122 0)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mp-area)" />
        <path
          d={path}
          fill="none"
          stroke="rgb(255 122 0)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function MiniCalendar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div className="h-1 w-12 rounded-full bg-white/30" />
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-[2px] border border-reps-border" />
          <span className="h-2 w-2 rounded-[2px] border border-reps-border" />
        </div>
      </div>
      <div className="mt-1.5 grid flex-1 grid-cols-7 gap-[3px]">
        {Array.from({ length: 35 }).map((_, i) => {
          const filled = [3, 7, 9, 12, 14, 17, 19, 22, 25, 28, 30, 33].includes(i);
          const accent = [9, 17, 25].includes(i);
          return (
            <div
              key={i}
              className={cn(
                "rounded-[2px] border border-reps-border/70",
                accent
                  ? "bg-reps-orange/80"
                  : filled
                    ? "bg-reps-panel-soft"
                    : "bg-reps-ink/40",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function MiniList() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div className="h-1 w-10 rounded-full bg-white/30" />
        <div className="h-1 w-6 rounded-full bg-white/20" />
      </div>
      <div className="mt-1.5 flex flex-1 flex-col gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-[4px] border border-reps-border/70 bg-reps-ink/30 p-1.5"
          >
            <span className="h-4 w-4 shrink-0 rounded-full bg-reps-panel-soft" />
            <div className="min-w-0 flex-1">
              <div
                className="h-1 rounded-full bg-white/40"
                style={{ width: `${55 + ((i * 9) % 35)}%` }}
              />
              <div className="mt-1 h-1 w-12 rounded-full bg-white/15" />
            </div>
            <span
              className={cn(
                "h-1.5 w-6 rounded-full",
                i % 3 === 0 ? "bg-reps-orange/70" : "bg-white/15",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
