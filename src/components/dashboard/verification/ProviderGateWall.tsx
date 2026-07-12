import * as React from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardButton } from "@/components/dashboard/ui";
import type { ProviderVerificationSummary } from "@/lib/verification/provider-verification.functions";

type Row = {
  index: "01" | "02" | "03";
  label: string;
  description: string;
  state: "done" | "in_review" | "action_needed" | "not_started";
};

function rowsFor(s: ProviderVerificationSummary): Row[] {
  const id = s.identity;
  const idState: Row["state"] = id.done
    ? "done"
    : id.status === "pending"
      ? "in_review"
      : id.status === "rejected" ||
          id.status === "needs_more_info" ||
          id.status === "expired"
        ? "action_needed"
        : "not_started";

  const nameState: Row["state"] = s.name.locked
    ? "done"
    : s.name.pendingName
      ? "in_review"
      : "not_started";

  const dom = s.domain;
  const domState: Row["state"] = dom.done
    ? "done"
    : dom.status === "pending_admin_review" || dom.status === "email_confirmed"
      ? "in_review"
      : dom.status === "rejected"
        ? "action_needed"
        : "not_started";

  return [
    {
      index: "01",
      label: "Identity",
      description:
        idState === "done"
          ? `Verified as ${id.verifiedName ?? "confirmed"} — locked.`
          : "Verify who you are with Stripe Identity. Encrypted, never shown publicly.",
      state: idState,
    },
    {
      index: "02",
      label: "Training provider name",
      description: s.name.locked
        ? `"${s.name.providerName}" — locked. This is your public REPS name.`
        : s.name.pendingName
          ? `"${s.name.pendingName}" — under review.`
          : "Lock in the trading name of your training provider. Once locked, it can't be changed.",
      state: nameState,
    },
    {
      index: "03",
      label: "Provider domain",
      description: dom.done
        ? `${dom.domain} — verified via ${dom.email}. Locked.`
        : dom.status === "pending_admin_review"
          ? `${dom.email ?? "Your email"} confirmed — awaiting REPS approval.`
          : dom.status === "rejected"
            ? "Domain wasn't approved. Try a different email on your website domain."
            : "Confirm an email on your provider website's domain.",
      state: domState,
    },
  ];
}

function Pill({ state }: { state: Row["state"] }) {
  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Locked
      </span>
    );
  }
  if (state === "in_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        In review
      </span>
    );
  }
  if (state === "action_needed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-300">
        <Circle className="h-3 w-3" />
        Action needed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/70">
      <Circle className="h-3 w-3" />
      Not started
    </span>
  );
}

export function ProviderGateWall({ summary }: { summary: ProviderVerificationSummary }) {
  const rows = rowsFor(summary);
  const remaining = 3 - summary.completedCount;

  return (
    <DashboardShell
      role="trainer"
      tier="training_provider"
      active="Verification"
      title="Complete verification to unlock your dashboard"
      subtitle="Three steps. Once locked, each step is permanent."
    >
      <div className="flex min-h-[60vh] items-start justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl rounded-[22px] border border-reps-border bg-reps-panel p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-ink/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
                Provider Verification
              </div>
              <h2 className="font-display text-[22px] font-bold leading-tight text-white sm:text-[26px]">
                {summary.completedCount === 0
                  ? "Complete 3 steps to unlock your dashboard"
                  : `${summary.completedCount} of 3 — ${remaining} to go`}
              </h2>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-white/70">
                Every step is locked once submitted. Your identity name, provider
                name and domain can't be self-edited afterwards — contact support
                if anything is wrong.
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 shrink-0 text-reps-orange" />
          </div>

          <ul className="flex flex-col gap-2.5">
            {rows.map((r) => (
              <li
                key={r.index}
                className="flex items-start gap-4 rounded-[14px] border border-reps-border bg-reps-ink/40 px-4 py-3.5"
              >
                <span
                  className={`font-display text-[12px] font-semibold tracking-wide ${
                    r.state === "done" ? "text-emerald-300" : "text-reps-orange"
                  }`}
                >
                  {r.index}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-white">
                      {r.label}
                    </span>
                    <Pill state={r.state} />
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">
                    {r.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-white/50">
              Nothing on your dashboard is available until all three are locked.
            </p>
            <DashboardButton asChild size="lg">
              <Link to="/dashboard/verification">
                Go to verification
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </DashboardButton>
          </div>

          <div className="mt-6 border-t border-reps-border pt-4 text-[12px] text-white/55">
            Need help?{" "}
            <Link
              to="/dashboard/support"
              className="font-semibold text-reps-orange hover:text-reps-orange-hover"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
