/**
 * VerificationCard — hero block at the top of /dashboard/profile.
 *
 * Single source of truth for "Am I cleared to take clients on REPs?"
 * Distinct from Profile Polish (the meter below), which is pure marketing.
 *
 * Three numbered rows: 01 Identity · 02 Insurance · 03 Qualifications.
 * When all three are approved → flips to a "Verified — badge live" state.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { getTrustState, type TrustState } from "@/lib/verification/trust.functions";

type StepStatus = "not_started" | "in_review" | "verified" | "expiring" | "expired" | "rejected";

type StepDef = {
  index: "01" | "02" | "03";
  label: string;
  description: string;
  status: StepStatus;
  cta: { label: string; href: string; external?: boolean };
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / 86_400_000);
}

function deriveSteps(t: TrustState | undefined): StepDef[] {
  // Identity
  const idStatus: StepStatus = (() => {
    const s = t?.identity.status;
    if (s === "approved") return "verified";
    if (s === "pending") return "in_review";
    if (s === "rejected") return "rejected";
    if (s === "expired") return "expired";
    if (s === "needs_more_info") return "rejected";
    return "not_started";
  })();
  const identityCta =
    idStatus === "verified"
      ? "View details"
      : idStatus === "in_review"
        ? "View status"
        : idStatus === "not_started"
          ? "Start ID check"
          : "Restart ID check";

  // Insurance
  const insExpiryDays = daysUntil(t?.insurance.expiryDate ?? null);
  const insStatus: StepStatus = (() => {
    const s = t?.insurance.status;
    if (s === "active") {
      if (insExpiryDays !== null && insExpiryDays <= 30) return "expiring";
      return "verified";
    }
    if (s === "pending") return "in_review";
    if (s === "rejected") return "rejected";
    if (s === "expired") return "expired";
    return "not_started";
  })();
  const insuranceCta =
    insStatus === "verified"
      ? "View policy"
      : insStatus === "in_review"
        ? "View status"
        : insStatus === "expiring" || insStatus === "expired"
          ? "Replace document"
          : insStatus === "rejected"
            ? "Re-upload"
            : "Upload insurance";

  // Qualifications
  const qualStatus: StepStatus = (t?.qualifications.count ?? 0) > 0 ? "verified" : "not_started";

  return [
    {
      index: "01",
      label: "Identity",
      description: "Confirm who you are. Encrypted, never shown publicly.",
      status: idStatus,
      cta: { label: identityCta, href: "#identity" },
    },
    {
      index: "02",
      label: "Insurance",
      description: "Public liability cover on file with a valid expiry.",
      status: insStatus,
      cta: { label: insuranceCta, href: "#insurance" },
    },
    {
      index: "03",
      label: "Qualifications",
      description:
        (t?.qualifications.count ?? 0) > 0
          ? `${t!.qualifications.count} approved · managed in Education & CPD`
          : "Upload a qualification certificate in Education & CPD.",
      status: qualStatus,
      cta: { label: qualStatus === "verified" ? "Manage" : "Add qualification", href: "/dashboard/cpd", external: true },
    },
  ];
}

function StatusPill({ status }: { status: StepStatus }) {
  const map: Record<StepStatus, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
    verified: {
      label: "Verified",
      cls: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
      Icon: CheckCircle2,
    },
    in_review: {
      label: "In review",
      cls: "border-amber-400/30 bg-amber-500/15 text-amber-300",
      Icon: Loader2,
    },
    expiring: {
      label: "Expiring soon",
      cls: "border-amber-400/30 bg-amber-500/15 text-amber-300",
      Icon: Circle,
    },
    expired: {
      label: "Expired",
      cls: "border-red-400/30 bg-red-500/15 text-red-300",
      Icon: Circle,
    },
    rejected: {
      label: "Action needed",
      cls: "border-red-400/30 bg-red-500/15 text-red-300",
      Icon: Circle,
    },
    not_started: {
      label: "Not started",
      cls: "border-white/12 bg-white/[0.06] text-white/70",
      Icon: Circle,
    },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      <Icon className={`h-3 w-3 ${status === "in_review" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function StepRow({ step }: { step: StepDef }) {
  const cta = step.cta.external ? (
    <Link
      to={step.cta.href}
      className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:text-reps-orange-hover"
    >
      {step.cta.label}
      <ArrowRight className="h-3 w-3" />
    </Link>
  ) : (
    <a
      href={step.cta.href}
      className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:text-reps-orange-hover"
    >
      {step.cta.label}
      <ArrowRight className="h-3 w-3" />
    </a>
  );

  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-reps-border bg-reps-ink/40 px-4 py-3">
      <span className="font-display text-[12px] font-semibold tracking-wide text-white/45">
        {step.index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-white">{step.label}</span>
          <StatusPill status={step.status} />
        </div>
        <p className="mt-0.5 truncate text-[12px] text-white/55">{step.description}</p>
      </div>
      <div className="shrink-0">{cta}</div>
    </div>
  );
}

export function VerificationCard() {
  const fetchTrust = useServerFn(getTrustState);
  const trustQ = useQuery({ queryKey: ["my-trust-state"], queryFn: () => fetchTrust() });
  const t = trustQ.data;
  const steps = deriveSteps(t);
  const verifiedCount = steps.filter((s) => s.status === "verified" || s.status === "expiring").length;
  const allVerified = steps.every((s) => s.status === "verified");
  const anyExpiring = steps.some((s) => s.status === "expiring");

  return (
    <section className="rounded-[16px] border border-reps-border bg-reps-panel p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={`h-4 w-4 ${allVerified ? "text-emerald-300" : "text-reps-orange"}`}
            />
            <h2 className="font-display text-[15px] font-semibold text-white">
              {allVerified ? "Verified — your badge is live" : "Get verified"}
            </h2>
          </div>
          <p className="mt-0.5 text-[12px] text-white/55">
            {allVerified
              ? anyExpiring
                ? "All checks passed — one renewal is due soon."
                : "All three checks passed. Your Verified badge shows on your public profile."
              : `${verifiedCount} of 3 steps complete. All three are required to earn your Verified badge.`}
          </p>
        </div>
        {allVerified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="h-3 w-3" />
            REPS Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/70">
            <Circle className="h-3 w-3" />
            Badge locked
          </span>
        )}
      </header>
      <div className="flex flex-col gap-2">
        {steps.map((s) => (
          <StepRow key={s.index} step={s} />
        ))}
      </div>
    </section>
  );
}
