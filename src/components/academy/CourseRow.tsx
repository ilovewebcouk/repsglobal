import { BadgeCheck, BookOpen, Clock, ShieldCheck, Star } from "lucide-react";
import {
  DELIVERY_LABELS,
  LEVEL_LABELS,
  type AcademyCourse,
} from "@/lib/training-academy";

interface CourseRowProps {
  course: AcademyCourse;
}

const priceLabel = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export function CourseRow({ course }: CourseRowProps) {
  const p = course.provider;
  // One shared neutral premium background across every card so the grid reads
  // as a single catalogue — provider identity comes from the initials chip.
  const bg =
    "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 55%, #1a1a1a 100%)";

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-4 rounded-[18px] border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-black/20 hover:shadow-[0_6px_20px_-8px_rgba(0,0,0,0.15)] sm:flex-row sm:gap-5 sm:p-5"
    >
      {/* Thumbnail — fixed 320×180 on desktop (YouTube 16:9) */}
      <div
        className="relative aspect-video w-full shrink-0 overflow-hidden rounded-[12px] sm:w-[320px]"
        style={{ background: bg }}
      >
        {/* Warm brand glow anchored top-right to tie the thumbnail to the brand */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 85% 15%, rgba(255,122,0,0.22) 0%, rgba(255,122,0,0) 55%)",
          }}
        />
        <span
          aria-hidden
          className="absolute left-2.5 top-2.5 grid size-9 place-items-center rounded-[8px] bg-white/95 text-[11px] font-bold tracking-[0.06em] text-black shadow-sm"
        >
          {p.logo}
        </span>
      </div>

      {/* Info column */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="font-display text-[17px] font-bold leading-snug text-black group-hover:text-[#FF7A00] sm:text-[18px]">
          {course.title}
        </h3>
        <p className="line-clamp-2 text-[13.5px] leading-snug text-black/65">
          {course.summary}
        </p>
        <p className="text-[12.5px] text-black/55">{p.name}</p>

        {/* Rating */}
        <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
          <span className="font-bold text-[#8A5A00]">{course.rating.toFixed(1)}</span>
          <span className="inline-flex items-center text-[#E59819]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5"
                fill={i < Math.round(course.rating) ? "currentColor" : "none"}
                strokeWidth={1.8}
              />
            ))}
          </span>
          <span className="text-black/50">({course.ratingCount.toLocaleString()})</span>
        </div>

        {/* Meta */}
        <p className="text-[12.5px] text-black/60">
          <span className="font-semibold text-black/80">{LEVEL_LABELS[course.level]}</span>
          <span aria-hidden> · </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.modules} modules
          </span>
          <span aria-hidden> · </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.durationLabel}
          </span>
          <span aria-hidden> · </span>
          <span>{DELIVERY_LABELS[course.delivery]}</span>
          <span aria-hidden> · </span>
          <span>{course.cpdPoints} CPD</span>
        </p>

        {/* Badges */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
            <BadgeCheck className="h-3 w-3" />
            REPs Endorsed
          </span>
          {course.ofqualRegulated ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#FF7A00]">
              <ShieldCheck className="h-3 w-3" />
              Ofqual-regulated
            </span>
          ) : null}
          {course.bestseller ? (
            <span className="inline-flex items-center rounded-[4px] bg-[#FFF1C4] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#6B4A00]">
              Bestseller
            </span>
          ) : null}
          {course.newRelease ? (
            <span className="inline-flex items-center rounded-[4px] bg-black/85 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
              New
            </span>
          ) : null}
        </div>
      </div>

      {/* Price column */}
      <div className="flex shrink-0 flex-col items-start justify-start sm:w-[110px] sm:items-end sm:text-right">
        <span className="font-display text-[19px] font-bold text-black">
          {priceLabel(course.priceFromGBP)}
        </span>
        <span className="text-[11.5px] text-black/50">From</span>
        <span className="mt-2 hidden text-[12.5px] font-semibold text-[#FF7A00] group-hover:underline sm:inline">
          View course →
        </span>
      </div>
    </a>
  );
}
