import { Star } from "lucide-react";

export function FoundingBanner() {
  return (
    <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-6 py-4 text-center lg:flex-row lg:px-10 lg:text-left">
      <div className="flex items-center gap-3 text-[14px] text-white/85">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
          <Star className="h-3 w-3 fill-reps-orange" /> Founding members
        </span>
        <span>
          Lock in <span className="font-semibold text-white">£59/mo Pro</span> before public launch.
        </span>
      </div>
      <span className="text-[12px] text-white/55">Limited spots · price locked for life · includes a 30-day free trial</span>
    </div>
  );
}
