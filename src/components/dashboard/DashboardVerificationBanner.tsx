import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { useSessionUser } from "@/hooks/use-session-user";
import { getTrustState } from "@/lib/verification/trust.functions";
import { VerifiedBadge, tierFromCounts } from "@/components/verification/VerifiedBadge";

export function DashboardVerificationBanner() {
  const { user } = useSessionUser();
  const fetchTrust = useServerFn(getTrustState);
  const { data } = useQuery({
    queryKey: ["my-trust-state"],
    queryFn: () => fetchTrust(),
    staleTime: 30_000,
    enabled: !!user,
  });

  if (!data) return null;

  const ticks = data.ticks;
  const tier = tierFromCounts({
    identity: !!ticks?.identity,
    insurance: !!ticks?.insurance,
    qualifications: !!ticks?.qualifications,
  });
  const completed = data.completedCount ?? 0;
  const allDone = completed === 3;
  const profession =
    data.qualifications?.professionLabel ??
    data.qualifications?.primaryTitle ??
    data.qualifications?.titles?.[0] ??
    null;

  const heading = allDone ? "Your REPS credential is live" : `You're ${completed} of 3 verified`;
  const subcopy = allDone
    ? "Identity, insurance and qualifications all verified."
    : "Finish verification to unlock your full REPS credential.";

  return (
    <Link
      to="/dashboard/verification"
      aria-label={heading}
      className="group flex items-center gap-4 rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
    >
      <VerifiedBadge tier={tier} size="md" profession={profession} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-white">{heading}</div>
        <div className="truncate text-[12.5px] text-white/60">{subcopy}</div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-reps-orange transition-transform group-hover:translate-x-0.5">
        Manage
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
