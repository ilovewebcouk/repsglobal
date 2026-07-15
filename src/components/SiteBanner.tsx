import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * Site-wide promotional strip. Audience-aware: training-provider surfaces
 * show a training-provider banner; every other route shows the Core
 * membership offer. Non-dismissible by design.
 */
export function SiteBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isProviderSurface =
    pathname.startsWith("/training-providers") ||
    pathname.startsWith("/for-training-providers");

  if (isProviderSurface) {
    return (
      <div className="w-full bg-reps-orange text-white">
        <div className="mx-auto flex min-h-[36px] max-w-[1320px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-center text-[13px] font-semibold leading-tight lg:px-10">
          <span>
            Training Provider membership — £479/year. Unlimited endorsed courses.
          </span>
          <a
            href="/signup?type=training_provider"
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/25"
          >
            Apply today
            <ArrowRight className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    );
  }

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
