/**
 * Trust surfaces for the canonical "verification" flow on /dashboard/profile.
 *
 * Tier-blind: identical UI and behaviour for every paying member (Core
 * or Pro). Three exports:

 *
 *   - `TrustStatusStrip`     slim 3-tick status strip (Identity / Insurance /
 *                            Qualifications). Qualifications is read-only and
 *                            links to /dashboard/cpd.
 *   - `IdentityProfileCard`  numbered profile card (step 05) — Stripe Identity
 *                            with manual fallback.
 *   - `InsuranceProfileCard` numbered profile card (step 06) — public liability.
 *
 * No "Core vs Pro" copy. No "What you unlock". Qualifications is NOT
 * editable here — its status mirrors what Education & courses says.
 */

import { useEffect, useState } from "react";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { myIdentity } from "@/lib/verification/identity.functions";
import { createStripeIdentitySession } from "@/lib/verification/stripe-identity.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
import { myInsurance } from "@/lib/verification/insurance.functions";
import { getTrustState } from "@/lib/verification/trust.functions";
import { InsuranceUploadDialog } from "@/components/verification/InsuranceUploadDialog";


/* -------------------------------------------------------------------------- */
/* Shared "profile card" wrapper — visually identical to Profile photo / Bio  */
/* -------------------------------------------------------------------------- */

function ProfileCard({
  title,
  subtitle,
  step,
  children,
  id,
  badge,
}: {
  title: string;
  subtitle?: string;
  step?: string;
  children: React.ReactNode;
  id?: string;
  badge?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[16px] border border-reps-border bg-reps-panel p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[15px] font-semibold text-white">{title}</h2>
            {badge}
          </div>
          {subtitle ? <p className="mt-0.5 text-[12px] text-white/55">{subtitle}</p> : null}
        </div>
        {step ? (
          <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
            {step}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Stripe Identity return → toast + invalidate + scroll                       */
/* -------------------------------------------------------------------------- */

type StripeIdentitySearch = { stripe_identity?: string };

function useStripeIdentityReturn() {
  const qc = useQueryClient();
  const router = useRouter();
  const search = useSearch({ strict: false }) as StripeIdentitySearch;
  useEffect(() => {
    if (search.stripe_identity === "complete") {
      qc.invalidateQueries({ queryKey: ["my-identity"] });
      qc.invalidateQueries({ queryKey: ["my-trust-state"] });
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

/* -------------------------------------------------------------------------- */
/* TrustStatusStrip — slim 3-tick header                                      */
/* -------------------------------------------------------------------------- */

export function TrustStatusStrip() {
  useStripeIdentityReturn();
  const fetchTrust = useServerFn(getTrustState);
  const trust = useQuery({ queryKey: ["my-trust-state"], queryFn: () => fetchTrust() });

  const t = trust.data;
  const completed = t?.completedCount ?? 0;
  const allDone = completed === 3;

  const chip = (label: string, done: boolean, pending: boolean, href: string, external: boolean) => {
    const cls = done
      ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
      : pending
        ? "border border-amber-400/30 bg-amber-500/15 text-amber-300"
        : "border border-white/10 bg-white/5 text-white/55";
    const inner = (
      <>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
        {label}
      </>
    );
    return external ? (
      <Link
        to={href}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition hover:text-white ${cls}`}
      >
        {inner}
      </Link>
    ) : (
      <a
        href={href}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition hover:text-white ${cls}`}
      >
        {inner}
      </a>
    );
  };

  return (
    <section className="rounded-[16px] border border-reps-border bg-reps-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-white">
            {allDone ? "Fully verified" : `${completed} of 3 verification checks complete`}
          </h2>
          <p className="mt-0.5 text-[12px] text-white/55">
            {allDone
              ? "All three checks passed — your profile carries every trust mark."
              : "Verification is universal to every member — identity, insurance, and your qualifications."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chip("Identity", !!t?.ticks.identity, t?.identity.status === "pending", "#identity", false)}
          {chip("Insurance", !!t?.ticks.insurance, t?.insurance.status === "pending", "#insurance", false)}
          {chip("Qualifications", !!t?.ticks.qualifications, false, "/dashboard/cpd", true)}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* IdentityProfileCard                                                        */
/* -------------------------------------------------------------------------- */

type IdentityRow = {
  id: string;
  status: string;
  vendor?: string | null;
  doc_type?: string | null;
  doc_path_front?: string | null;
  selfie_path?: string | null;
  name_on_doc?: string | null;
  dob_on_doc?: string | null;
  admin_note?: string | null;
  stripe_vs_id?: string | null;
  stripe_vs_url?: string | null;
  stripe_status?: string | null;
  stripe_reason?: string | null;
  created_at?: string | null;
};

export function IdentityProfileCard({ step }: { step?: string }) {
  const qc = useQueryClient();
  const fetchIdentity = useServerFn(myIdentity);
  const identityQ = useQuery({ queryKey: ["my-identity"], queryFn: () => fetchIdentity() });
  const identity = identityQ.data as IdentityRow | null | undefined;

  const identityBadge = identity ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        identity.status === "approved"
          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
          : identity.status === "rejected" || identity.status === "expired"
            ? "border-red-400/30 bg-red-500/15 text-red-300"
            : "border-amber-400/30 bg-amber-500/15 text-amber-300"
      }`}
    >
      {identity.status === "approved"
        ? "ID-checked"
        : identity.status === "rejected"
          ? "Rejected"
          : identity.status === "needs_more_info"
            ? "More info needed"
            : identity.status === "expired"
              ? "Expired"
              : "In review"}
    </span>
  ) : undefined;

  // Poll while Stripe Identity is pending.
  const pendingStripe = identity?.vendor === "stripe" && identity?.status === "pending";
  useQuery({
    queryKey: ["identity-poll", identity?.id],
    queryFn: async () => {
      await qc.invalidateQueries({ queryKey: ["my-identity"] });
      await qc.invalidateQueries({ queryKey: ["my-trust-state"] });
      return true;
    },
    enabled: !!pendingStripe,
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });

  const onSaved = () => {
    qc.invalidateQueries({ queryKey: ["my-identity"] });
    qc.invalidateQueries({ queryKey: ["my-trust-state"] });
  };

  return (
    <ProfileCard
      id="identity"
      step={step}
      title="Identity"
      subtitle="Confirm who you are with Stripe Identity. Encrypted, never shown on your public profile."
      badge={identityBadge}
    >
      <IdentityBody identity={identity} onSaved={onSaved} />
    </ProfileCard>
  );
}

function IdentityBody({
  identity,
}: {
  identity: IdentityRow | null | undefined;
  onSaved: () => void;
}) {
  const startStripe = useServerFn(createStripeIdentitySession);

  const stripeId = useMutation({
    mutationFn: async () =>
      startStripe({
        data: {
          return_path: "/dashboard/verification",
          environment: getStripeEnvironment(),
        },
      }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't start ID check"),
  });

  if (identity) {
    const isStripe = identity.vendor === "stripe";
    const ageMs = identity.created_at ? Date.now() - new Date(identity.created_at).getTime() : 0;
    const staleStripe = isStripe && identity.status === "pending" && ageMs > 60 * 60 * 1000; // 1h → treat the stored URL as expired
    const stripeInProgress =
      isStripe && identity.status === "pending" && !!identity.stripe_vs_url && !staleStripe;

    const reason = identity.admin_note || identity.stripe_reason;

    return (
      <div>
        <p className="text-[12px] text-white/65">
          Stripe Identity check
          {identity.name_on_doc ? ` · ${identity.name_on_doc}` : ""}
        </p>
        {reason && identity.status !== "approved" && (
          <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{reason}</span>
          </div>
        )}
        {identity.status === "pending" && !reason && (() => {
          const overTenMin = ageMs > 10 * 60 * 1000;
          return (
            <div className="mt-3 rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/65">
              {staleStripe
                ? "This ID check session has expired. Start a new one to continue."
                : "Usually takes 1–5 minutes — refresh or check back shortly."}
              {!staleStripe && overTenMin && (
                <>
                  {" "}
                  <a href="mailto:support@repsuk.org" className="text-reps-orange hover:underline">
                    Taking longer than expected? Contact support.
                  </a>
                </>
              )}
            </div>
          );
        })()}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {stripeInProgress && identity.stripe_vs_url && (
            <a
              href={identity.stripe_vs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Continue ID check
            </a>
          )}
          {(staleStripe ||
            identity.status === "rejected" ||
            identity.status === "needs_more_info" ||
            identity.status === "expired") && (
            <Button
              variant="primary"
              size="md"
              disabled={stripeId.isPending}
              onClick={() => stripeId.mutate()}
            >
              {stripeId.isPending ? <Loader2 className="size-4 animate-spin" /> : "Restart ID check"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="primary"
        size="md"
        disabled={stripeId.isPending}
        onClick={() => stripeId.mutate()}
      >
        {stripeId.isPending ? <Loader2 className="size-4 animate-spin" /> : "Start ID check"}
      </Button>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* InsuranceProfileCard                                                       */
/* -------------------------------------------------------------------------- */

type InsuranceRow = {
  id: string;
  status: string;
  provider: string;
  expiry_date: string;
  cover_amount_gbp?: number | null;
  admin_note?: string | null;
} | null | undefined;

export function InsuranceProfileCard({ step }: { step?: string }) {
  const qc = useQueryClient();
  const fetchInsurance = useServerFn(myInsurance);
  const insuranceQ = useQuery({ queryKey: ["my-insurance"], queryFn: () => fetchInsurance() });
  const insurance = insuranceQ.data as InsuranceRow;
  const [dialogOpen, setDialogOpen] = useState(false);

  const insuranceBadge = (() => {
    if (!insurance) return undefined;
    const today = new Date().toISOString().slice(0, 10);
    const isExpired = insurance.expiry_date < today;
    const daysToExpiry = Math.round(
      (new Date(insurance.expiry_date).getTime() - Date.now()) / 86_400_000,
    );
    const expiringSoon = !isExpired && daysToExpiry <= 30;

    const label = isExpired
      ? "Expired"
      : insurance.status === "active"
        ? expiringSoon
          ? `Expiring in ${daysToExpiry}d`
          : "Insured"
        : insurance.status === "rejected"
          ? "Rejected"
          : "In review";

    const cls = isExpired || insurance.status === "rejected"
      ? "border-red-400/30 bg-red-500/15 text-red-300"
      : insurance.status === "active"
        ? expiringSoon
          ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
          : "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
        : "border-amber-400/30 bg-amber-500/15 text-amber-300";

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
        {label}
      </span>
    );
  })();

  const onSubmitted = () => {
    qc.invalidateQueries({ queryKey: ["my-insurance"] });
    qc.invalidateQueries({ queryKey: ["my-trust-state"] });
  };

  return (
    <ProfileCard
      id="insurance"
      step={step}
      title="Insurance"
      subtitle="Public liability — required to take clients through REPs. Upload your certificate or scan it with your phone; we'll read it for you."
      badge={insuranceBadge}
    >
      <InsuranceBody insurance={insurance} onOpenDialog={() => setDialogOpen(true)} />
      <InsuranceUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={onSubmitted}
      />
    </ProfileCard>
  );
}

function InsuranceBody({

  insurance,
  onOpenDialog,
}: {
  insurance: InsuranceRow;
  onOpenDialog: () => void;
}) {
  if (insurance) {
    const today = new Date().toISOString().slice(0, 10);
    const isExpired = insurance.expiry_date < today;
    const daysToExpiry = Math.round(
      (new Date(insurance.expiry_date).getTime() - Date.now()) / 86_400_000,
    );
    const expiringSoon = !isExpired && daysToExpiry <= 30;

    return (
      <div>
        <p className="text-[12px] text-white/65">
          {insurance.provider} · expires {insurance.expiry_date}
          {insurance.cover_amount_gbp ? ` · £${insurance.cover_amount_gbp.toLocaleString()} cover` : ""}
        </p>
        {insurance.admin_note && insurance.status !== "active" && (
          <div className="mt-3 rounded-[10px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
            {insurance.admin_note}
          </div>
        )}
        {(isExpired || expiringSoon || insurance.status === "rejected") && (
          <div className="mt-3">
            <Button variant="primary" size="md" onClick={onOpenDialog}>
              Replace certificate
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-white/65">
        Add a current public liability certificate. We'll extract the details — you confirm before submitting.
      </p>
      <div>
        <Button variant="primary" size="md" onClick={onOpenDialog}>
          <Upload className="size-4" />
          Upload certificate
        </Button>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Back-compat: legacy `<TrustBlock />` import is deliberately not exported.  */
/* Compose `TrustStatusStrip` + `IdentityProfileCard` + `InsuranceProfileCard` */
/* directly inside the Public Profile route.                                   */
/* -------------------------------------------------------------------------- */

// Re-export ArrowRight for any external consumers that imported it via this module.
export { ArrowRight };
