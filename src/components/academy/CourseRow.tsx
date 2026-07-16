import { ArrowUpRight, BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DELIVERY_LABELS,
  LEVEL_LABELS,
  PROFESSION_LABELS,
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
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-reps-orange/40 hover:shadow-[0_24px_60px_-30px_rgba(15,15,15,0.22)] sm:p-6"
    >
      <div className="flex gap-4 sm:gap-5">
        {/* Provider logo tile */}
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-[10px] border border-reps-stone bg-reps-warm-white text-[13px] font-bold tracking-[0.08em] text-reps-charcoal sm:size-16"
        >
          {course.provider.logo}
        </span>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-reps-muted-light">
                {course.provider.name}
              </p>
              <h3 className="mt-1 font-display text-[18px] font-semibold leading-snug text-reps-charcoal sm:text-[19px]">
                {course.title}
              </h3>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
              <BadgeCheck className="h-3 w-3" />
              REPs Endorsed
            </span>
          </div>

          <p className="mt-2 text-[13.5px] leading-relaxed text-reps-muted-light">
            {course.summary}
          </p>

          {/* Meta chips */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className="rounded-full border border-reps-stone bg-reps-warm-white text-[11px] font-medium text-reps-charcoal"
            >
              {LEVEL_LABELS[course.level]}
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full border border-reps-stone bg-reps-warm-white text-[11px] font-medium text-reps-charcoal"
            >
              {PROFESSION_LABELS[course.profession]}
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full border border-reps-stone bg-reps-warm-white text-[11px] font-medium text-reps-charcoal"
            >
              {course.cpdPoints} CPD pts
            </Badge>
            {course.ofqualRegulated ? (
              <Badge
                variant="secondary"
                className="rounded-full border border-reps-orange/30 bg-reps-orange/10 text-[11px] font-medium text-reps-orange"
              >
                <ShieldCheck className="h-3 w-3" data-icon="inline-start" />
                Ofqual-regulated
              </Badge>
            ) : null}
          </div>

          {/* Footer line */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-reps-stone/70 pt-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-reps-muted-light">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {course.durationLabel}
              </span>
              <span aria-hidden className="text-reps-stone">·</span>
              <span>{DELIVERY_LABELS[course.delivery]}</span>
              <span aria-hidden className="text-reps-stone">·</span>
              <span>
                From{" "}
                <span className="font-semibold text-reps-charcoal">
                  {priceLabel(course.priceFromGBP)}
                </span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange group-hover:text-reps-orange-hover">
              View course
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
