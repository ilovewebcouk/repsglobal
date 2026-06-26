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
import type { TrustState } from "@/lib/verification/trust.functions";

type Step = {
  index: "01" | "02" | "03";
  label: string;
  description: string;
  status: "verified" | "in_review" | "not_started" | "action_needed";
  href: string;
  cta: string;
};

function buildSteps(t: TrustState): Step[] {
  const idS = t.identity.status;
  const idStatus: Step["status"] =
    idS === "approved" ? "verified" : idS === "pending" ? "in_review" : "not_started";

  const qualStatus: Step["status"] = t.qualifications.count > 0 ? "verified" : "not_started";

  const insS = t.insurance.status;
  const insStatus: Step["status"] =
    insS === "active"
      ? "verified"
      : insS === "pending"
        ? "in_review"
        : insS === "rejected" || insS === "expired"
          ? "action_needed"
          : "not_started";

  return [
    {
      index: "01",
      label: "Verify your identity",
      description: "Confirm who you are. Encrypted, never shown publicly.",
      status: idStatus,
      href: "/dashboard/verification",
      cta: idStatus === "verified" ? "Done" : idStatus === "in_review" ? "View status" : "Start ID check",
    },
    {
      index: "02",
      label: "Add your qualifications",
      description:
        t.qualifications.count > 0
          ? `${t.qualifications.count} approved`
          : "Upload a qualification certificate so clients see real credentials.",
      status: qualStatus,
      href: "/dashboard/cpd",
      cta: qualStatus === "verified" ? "Manage" : "Add qualification",
    },
    {
      index: "03",
      label: "Upload insurance",
      description: "Public liability cover on file with a valid expiry.",
      status: insStatus,
      href: "/dashboard/verification",
      cta:
        insStatus === "verified"
          ? "View policy"
          : insStatus === "in_review"
            ? "View status"
            : insStatus === "action_needed"
              ? "Re-upload"
              : "Upload insurance",
    },
  ];
}

function StatusBadge({ status }: { status: Step["status"] }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </span>
    );
  }
  if (status === "in_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        In review
      </span>
    );
  }
  if (status === "action_needed") {
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

function StepRow({ step, onAction }: { step: Step; onAction: () => void }) {
  const isDone = step.status === "verified";
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
          <p className="truncate font-display text-[14px] font-semibold text-white">{step.label}</p>
          <StatusBadge status={step.status} />
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">{step.description}</p>
      </div>
      {!isDone ? (
        <Link
          to={step.href}
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-reps-orange hover:text-reps-orange-hover"
        >
          {step.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}

export function VerificationPromptDialog({
  trust,
  userId,
}: {
  trust: TrustState;
  userId: string;
}) {
  const sessionKey = React.useMemo(() => `reps.verify-prompt.dismissed.${userId}`, [userId]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (trust.completedCount >= 3) return;
    if (trust.identity.status !== "approved") return; // hard gate handles this
    try {
      const dismissed = window.sessionStorage.getItem(sessionKey) === "1";
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [trust, sessionKey]);

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

  const steps = React.useMemo(() => buildSteps(trust), [trust]);
  const remaining = 3 - trust.completedCount;

  return (
    <DashboardDialog open={open} onOpenChange={handleOpenChange}>
      <DashboardDialogContent className="max-w-lg">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Finish setting up your REPs profile</DashboardDialogTitle>
          <DashboardDialogDescription>
            {remaining === 1
              ? "One step left to earn your full verified badge."
              : `${remaining} steps left to earn your full verified badge.`}
          </DashboardDialogDescription>
        </DashboardDialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          {steps.map((s) => (
            <StepRow key={s.index} step={s} onAction={() => handleOpenChange(false)} />
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
            </Link>
          </DashboardButton>
        </div>
      </DashboardDialogContent>
    </DashboardDialog>
  );
}
