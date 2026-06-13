/**
 * /dashboard/verification — the credential page.
 *
 * Three independent checks, any order. Each one earns a visible trust layer.
 *   1. Identity         → "Verified"
 *   2. Insurance        → "Verified · Insured"
 *   3. Qualifications   → "Verified · Insured · <Profession>"
 *
 * Reuses the existing IdentityProfileCard / InsuranceProfileCard from
 * /components/dashboard/verification/TrustBlock for the Identity and
 * Insurance step bodies, and a small Qualifications summary card that
 * links to /dashboard/cpd (read-only here — CPD owns the editor).
 */

import * as React from "react";
import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, GraduationCap, Loader2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { getTrustState, type TrustState } from "@/lib/verification/trust.functions";
import {
  IdentityProfileCard,
  InsuranceProfileCard,
} from "@/components/dashboard/verification/TrustBlock";
import {
  VerifiedBadge,
  tierFromCounts,
  tierLabel,
} from "@/components/verification/VerifiedBadge";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/verification")({
  head: () => ({
    meta: [
      { title: "Verification — REPS Professional" },
      {
        name: "description",
        content:
          "Earn your REPS credential. Three independent checks — identity, insurance, qualifications — each one earns a visible trust layer.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    stripe_identity: typeof s.stripe_identity === "string" ? s.stripe_identity : undefined,
  }),
  component: VerificationPage,
});

function useStripeIdentityReturn() {
  const qc = useQueryClient();
  const router = useRouter();
  const search = useSearch({ from: Route.id }) as { stripe_identity?: string };
  React.useEffect(() => {
    if (search.stripe_identity === "complete") {
      void qc.invalidateQueries({ queryKey: ["my-identity"] });
      void qc.invalidateQueries({ queryKey: ["my-trust-state"] });
      toast.success("ID check submitted — we'll confirm shortly.");
      router.navigate({
        to: "/dashboard/verification",
        search: {},
        hash: "identity",
        replace: true,
      });
      setTimeout(() => {
        document.getElementById("identity")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.stripe_identity]);
}

function VerificationPage() {
  useStripeIdentityReturn();
  const tier = useTrainerTier();
  const fetchTrust = useServerFn(getTrustState);
  const trustQ = useQuery({
    queryKey: ["my-trust-state"],
    queryFn: () => fetchTrust(),
  });
  const t = trustQ.data;

  const badgeTier = tierFromCounts({
    identity: !!t?.ticks.identity,
    insurance: !!t?.ticks.insurance,
    qualifications: !!t?.ticks.qualifications,
  });
  const completed = t?.completedCount ?? 0;
  const profession = t?.qualifications.titles?.[0] ?? null;

  return (
    <DashboardShell
      role="trainer"
      tier={tier === "verified" ? "verified" : "pro"}
      active="Verification"
      title="Verification"
      subtitle="Three checks. Each one earns a visible layer on your REPS credential."
    >
      <div className="flex flex-col gap-6">
        <Hero trust={t} completed={completed} badgeTier={badgeTier} profession={profession} loading={trustQ.isLoading} />

        <div className="flex flex-col gap-4">
          <IdentityProfileCard step="01" />
          <InsuranceProfileCard step="02" />
          <QualificationsCard trust={t} />
        </div>
      </div>
    </DashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

function Hero({
  trust,
  completed,
  badgeTier,
  profession,
  loading,
}: {
  trust: TrustState | undefined;
  completed: number;
  badgeTier: ReturnType<typeof tierFromCounts>;
  profession: string | null;
  loading: boolean;
}) {
  const allDone = completed === 3;
  const empty = completed === 0;

  const headline = empty
    ? "Earn your REPS credential"
    : allDone
      ? "You're fully credentialed"
      : `${completed} of 3 — keep going`;

  const sub = empty
    ? "Complete three checks — in any order. Each one adds a visible trust layer to your public profile."
    : allDone
      ? "All three checks passed. Your full credential is live on every public surface."
      : "Each remaining check adds another visible layer to your credential.";

  return (
    <section className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
      <div className="relative grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_85%_50%,rgba(255,122,0,0.10),transparent_55%)]" />
        <div className="relative z-10 min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-ink/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
            REPS Credential
          </div>
          <h2 className="font-display text-[24px] font-bold leading-tight text-white lg:text-[28px]">
            {headline}
          </h2>
          <p className="mt-2 max-w-[56ch] text-[14px] text-white/65">{sub}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <LayerChip label="Verified" earned={!!trust?.ticks.identity} loading={loading} />
            <LayerChip label="Insured" earned={!!trust?.ticks.insurance} loading={loading} />
            <LayerChip
              label={profession ?? "Qualified"}
              earned={!!trust?.ticks.qualifications}
              loading={loading}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-3 lg:items-end">
          <VerifiedBadge tier={badgeTier} size="lg" profession={profession} />
          <p className="text-[11px] text-white/45 lg:text-right">
            {allDone
              ? "Live on every public surface."
              : "Updates the moment a check passes."}
          </p>
        </div>
      </div>
    </section>
  );
}

function LayerChip({
  label,
  earned,
  loading,
}: {
  label: string;
  earned: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-semibold text-white/40">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </span>
    );
  }
  const cls = earned
    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
    : "border-white/12 bg-white/[0.05] text-white/55";
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold ${cls}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${earned ? "bg-emerald-300" : "bg-white/30"}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Qualifications card — read-only summary; CPD page owns the editor          */
/* -------------------------------------------------------------------------- */

function QualificationsCard({ trust }: { trust: TrustState | undefined }) {
  const count = trust?.qualifications.count ?? 0;
  const titles = trust?.qualifications.titles ?? [];
  const earned = count > 0;

  return (
    <section
      id="qualifications"
      className="scroll-mt-24 rounded-[16px] border border-reps-border bg-reps-panel p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[15px] font-semibold text-white">Qualifications</h2>
            {earned ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-white/60">
                Not started
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-white/55">
            {earned
              ? `${count} approved qualification${count === 1 ? "" : "s"} — managed in Education & CPD.`
              : "Upload your first certificate in Education & CPD. Approval unlocks your profession title."}
          </p>
        </div>
        <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
          03
        </span>
      </div>

      {earned && titles.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {titles.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-ink/40 px-2.5 py-1 text-[12px] font-medium text-white/80"
            >
              <GraduationCap className="h-3.5 w-3.5 text-reps-orange" />
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <Link
        to="/dashboard/cpd"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-reps-orange hover:text-reps-orange-hover"
      >
        {earned ? "Manage in Education & CPD" : "Add your first certificate"}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
