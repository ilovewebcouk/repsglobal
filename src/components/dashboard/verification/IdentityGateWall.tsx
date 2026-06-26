import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardButton } from "@/components/dashboard/ui";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import type { TrustState } from "@/lib/verification/trust.functions";

type Status = TrustState["identity"]["status"];

export function IdentityGateWall({ status }: { status: Status }) {
  const tier = useTrainerTier();
  const pending = status === "pending";
  const rejected = status === "rejected" || status === "needs_more_info" || status === "expired";

  const Icon = pending ? Loader2 : rejected ? AlertCircle : ShieldCheck;
  const accentCls = pending
    ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
    : rejected
      ? "border-red-400/30 bg-red-500/15 text-red-300"
      : "border-reps-orange/30 bg-reps-orange/15 text-reps-orange";

  const title = pending
    ? "We're reviewing your ID"
    : rejected
      ? "We need another look at your ID"
      : "Verify your identity to continue";

  const body = pending
    ? "Usually under 24 hours. We'll email you the moment it's approved — then your dashboard unlocks automatically."
    : rejected
      ? "Something didn't pass our check. Head to the verification page to see what we need and re-submit."
      : "REPs is an identity-verified register. Before you can take enquiries, publish your profile or manage clients, we need to confirm who you are. It takes about 2 minutes.";

  const primaryCta = pending ? null : (
    <DashboardButton asChild size="lg">
      <Link to="/dashboard/verification" hash="identity">
        {rejected ? "Restart ID check" : "Start ID check"}
      </Link>
    </DashboardButton>
  );

  return (
    <DashboardShell role="trainer" tier={tier} active="dashboard" title="Verify your identity" subtitle="Required before your dashboard unlocks">
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[22px] border border-reps-border bg-reps-panel p-8 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] sm:p-10">
          <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border ${accentCls}`}>
            <Icon className={`h-7 w-7 ${pending ? "animate-spin" : ""}`} />
          </div>
          <h2 className="mt-5 font-display text-[22px] font-bold leading-tight text-white sm:text-[26px]">{title}</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-white/70">{body}</p>

          <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-[13px] text-white/65">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-reps-orange" />
              Encrypted upload — your documents are never shown publicly.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-reps-orange" />
              Drives the verified badge clients see on your profile.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-reps-orange" />
              Required by the register — no paid bypass.
            </li>
          </ul>

          {primaryCta ? <div className="mt-7 flex flex-col items-center gap-3">{primaryCta}</div> : null}

          <div className="mt-6 border-t border-reps-border pt-4 text-[12px] text-white/55">
            Need help?{" "}
            <Link to="/dashboard/support" className="font-semibold text-reps-orange hover:text-reps-orange-hover">
              Contact support
            </Link>
            {" · "}
            <Link to="/dashboard/settings" className="font-semibold text-white/75 hover:text-white">
              Billing & account
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
