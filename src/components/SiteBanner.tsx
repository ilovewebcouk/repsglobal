import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * Site-wide promotional strip advertising the reduced Core membership price.
 * Non-dismissible by design (owner requested). Rendered inside each public
 * header container so it stays visible while scrolling.
 */
export function SiteBanner() {
  return (
    <div className="w-full bg-reps-orange text-white">
      <div className="mx-auto flex min-h-[36px] max-w-[1320px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-center text-[13px] font-semibold leading-tight lg:px-10">
        <span>
          Core membership — now £34/year{" "}
          <span className="font-normal text-white/85 line-through decoration-white/60">
            was £99
          </span>
          .
        </span>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/25"
        >
          Join today
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
