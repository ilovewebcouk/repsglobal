import { ArrowUpRight, BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DELIVERY_LABELS,
  LEVEL_LABELS,
  PROFESSION_LABELS,
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
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/40 p-5 text-left shadow-none transition hover:border-white/25 hover:bg-reps-panel/60"
    >
      {/* Top row: provider + endorsement pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-[8px] border border-reps-border bg-reps-ink text-[11px] font-bold tracking-[0.08em] text-white/85"
          >
            {course.provider.logo}
          </span>
          <span className="text-[12.5px] font-medium text-white/70">
            {course.provider.name}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300">
          <BadgeCheck className="h-3 w-3" />
          REPs Endorsed
        </span>
      </div>

      {/* Title + summary */}
      <h3 className="mt-5 font-display text-[19px] font-semibold leading-snug text-white">
        {course.title}
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
        {course.summary}
      </p>

      {/* Meta chips */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="secondary"
          className="rounded-full border-reps-border bg-reps-ink/70 text-[11px] font-medium text-white/80"
        >
          {LEVEL_LABELS[course.level]}
        </Badge>
        <Badge
          variant="secondary"
          className="rounded-full border-reps-border bg-reps-ink/70 text-[11px] font-medium text-white/80"
        >
          {PROFESSION_LABELS[course.profession]}
        </Badge>
        <Badge
          variant="secondary"
          className="rounded-full border-reps-border bg-reps-ink/70 text-[11px] font-medium text-white/80"
        >
          {course.cpdPoints} CPD pts
        </Badge>
        {course.ofqualRegulated ? (
          <Badge
            variant="secondary"
            className="rounded-full border-reps-orange-border bg-reps-orange-soft text-[11px] font-medium text-reps-orange"
          >
            <ShieldCheck className="h-3 w-3" />
            Ofqual-regulated
          </Badge>
        ) : null}
      </div>

      {/* Footer: duration/delivery + price + CTA */}
      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <div className="flex flex-col gap-1 text-[12px] text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {course.durationLabel} · {DELIVERY_LABELS[course.delivery]}
          </span>
          <span className="text-white/75">
            <span className="text-white/50">From</span>{" "}
            <span className="font-semibold text-white">
              {priceLabel(course.priceFromGBP)}
            </span>
          </span>
        </div>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/25 px-3 text-[12.5px] font-semibold text-white transition group-hover:border-reps-orange group-hover:bg-reps-orange group-hover:text-white">
          View course
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  );
}
