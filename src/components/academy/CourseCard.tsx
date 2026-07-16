import { BadgeCheck, BookOpen, Clock, ShieldCheck, Star } from "lucide-react";
import {
  DELIVERY_LABELS,
  LEVEL_LABELS,
  type AcademyCourse,
} from "@/lib/training-academy";

interface CourseCardProps {
  course: AcademyCourse;
}

const priceLabel = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export function CourseCard({ course }: CourseCardProps) {
  const p = course.provider;
  // Fallback thumbnail — two-stop gradient tinted from provider hue.
  const bg = `linear-gradient(135deg, hsl(${p.hue} 78% 58%) 0%, hsl(${(p.hue + 40) % 360} 62% 40%) 100%)`;

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-[18px] border border-black/10 bg-white transition hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_20px_50px_-25px_rgba(0,0,0,0.22)]"
    >
      {/* 16:9 thumbnail */}
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: bg }}>
        {/* Provider logo tile in the corner */}
        <span
          aria-hidden
          className="absolute left-3 top-3 grid size-11 place-items-center rounded-[10px] bg-white/95 text-[12px] font-bold tracking-[0.06em] text-black shadow-sm"
        >
          {p.logo}
        </span>
        {/* Corner tags */}
        <div className="absolute right-3 top-3 flex flex-wrap items-center gap-1.5">
          {course.bestseller ? (
            <span className="inline-flex items-center rounded-full bg-[#FF7A00] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
              Bestseller
            </span>
          ) : null}
          {course.newRelease ? (
            <span className="inline-flex items-center rounded-full bg-black/85 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
              New
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[12px] font-medium text-black/55">{p.name}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-[16.5px] font-semibold leading-snug text-black">
          {course.title}
        </h3>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5 text-[13px]">
          <span className="font-bold text-black">{course.rating.toFixed(1)}</span>
          <span className="inline-flex items-center text-[#FF7A00]">
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

        {/* Meta row */}
        <p className="mt-2 text-[12.5px] text-black/60">
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
        </p>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-end justify-between border-t border-black/10 pt-3">
          <span className="text-[12px] text-black/55">
            From{" "}
            <span className="text-[15px] font-bold text-black">
              {priceLabel(course.priceFromGBP)}
            </span>
          </span>
          <span className="text-[12.5px] font-semibold text-[#FF7A00] group-hover:underline">
            View course →
          </span>
        </div>
      </div>
    </a>
  );
}
