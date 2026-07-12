import * as React from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react";

import {
  DashboardDialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardButton,
} from "@/components/dashboard/ui";
import type { ProviderVerificationSummary } from "@/lib/verification/provider-verification.functions";

type StepState = "done" | "in_review" | "action_needed" | "not_started";
type Step = {
  index: "01" | "02" | "03";
  label: string;
  description: string;
  state: StepState;
};

function buildSteps(s: ProviderVerificationSummary): Step[] {
  const id = s.identity;
  const idState: StepState = id.done
    ? "done"
    : id.status === "pending"
      ? "in_review"
      : id.status === "rejected" ||
          id.status === "needs_more_info" ||
          id.status === "expired"
        ? "action_needed"
        : "not_started";

  const nameState: StepState = s.name.locked
    ? "done"
    : s.name.pendingName
      ? "in_review"
      : "not_started";

  const dom = s.domain;
  const domState: StepState = dom.done
    ? "done"
    : dom.status === "pending_admin_review" || dom.status === "email_confirmed"
      ? "in_review"
      : dom.status === "rejected"
        ? "action_needed"
        : "not_started";

  return [
    {
      index: "01",
      label: "Verify your identity",
      description: id.done
        ? `Locked as ${id.verifiedName ?? "confirmed"}.`
        : "Confirm who you are with Stripe Identity. Encrypted, never shown publicly.",
      state: idState,
    },
    {
      index: "02",
      label: "Lock in your training provider name",
      description: s.name.locked
        ? `"${s.name.providerName}" — locked.`
        : "The trading name of your training provider. Locked once submitted.",
      state: nameState,
    },
    {
      index: "03",
      label: "Verify your provider domain",
      description: dom.done
        ? `${dom.domain} — locked.`
        : "Confirm an email on your provider website's domain.",
      state: domState,
    },
  ];
}

function StatusBadge({ state }: { state: StepState }) {
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

function StepRow({ step }: { step: Step }) {
  const isDone = step.state === "done";
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-reps-border bg-reps-ink/40 px-4 py-3.5">
      <span
        className={`font-display text-[12px] font-semibold tracking-wide ${
          isDone ? "text-emerald-300" : "text-reps-orange"
        }`}
      >
        {step.index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-[14px] font-semibold text-white">
            {step.label}
          </p>
          <StatusBadge state={step.state} />
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export function ProviderVerificationPromptDialog({
  summary,
  userId,
}: {
  summary: ProviderVerificationSummary;
  userId: string;
}) {
  const sessionKey = React.useMemo(
    () => `reps.provider-verify-prompt.dismissed.${userId}`,
    [userId],
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (summary.completedCount >= 3) return;
    // Hard gate handles the "identity not done yet" case entirely.
    if (!summary.identity.done) return;
    try {
      const dismissed = window.sessionStorage.getItem(sessionKey) === "1";
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [summary, sessionKey]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      try {
        window.sessionStorage.setItem(sessionKey, "1");
      } catch {
        /* ignore */
      }
    }
  }

  const steps = React.useMemo(() => buildSteps(summary), [summary]);
  const remaining = 3 - summary.completedCount;

  return (
    <DashboardDialog open={open} onOpenChange={handleOpenChange}>
      <DashboardDialogContent className="max-w-lg">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Finish locking in your provider</DashboardDialogTitle>
          <DashboardDialogDescription>
            {remaining === 1
              ? "One step left. Once locked, it can't be changed — contact support to correct anything."
              : `${remaining} steps left. Once locked, each is permanent — contact support to correct anything.`}
          </DashboardDialogDescription>
        </DashboardDialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          {steps.map((s) => (
            <StepRow key={s.index} step={s} />
          ))}
        </div>

        <div className="mt-5 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="text-[13px] font-semibold text-white/60 hover:text-white"
          >
            Remind me later
          </button>
          <DashboardButton asChild>
            <Link to="/dashboard/verification" onClick={() => handleOpenChange(false)}>
              Go to verification
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </DashboardButton>
        </div>
      </DashboardDialogContent>
    </DashboardDialog>
  );
}
