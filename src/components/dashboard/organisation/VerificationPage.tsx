/**
 * /dashboard/verification — training provider variant.
 *
 * Three-step lock-in flow (purpose-built for training providers). Every
 * step is permanent once submitted — the provider cannot self-edit
 * afterwards.
 *   Stage 01 — Identity: Stripe Identity → locks identity name.
 *   Stage 02 — Provider name: one-time free-text lock-in → locks
 *              profiles.full_name and the public /t/<slug> URL.
 *   Stage 03 — Provider domain: confirm an email on the provider's
 *              website → admin approves the domain.
 *
 * Insurance and qualifications are intentionally NOT shown here — they
 * belong to the individual-trainer flow.
 */

import * as React from "react";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

import { getProviderVerificationSummary } from "@/lib/verification/provider-verification.functions";
import { lockInProviderName } from "@/lib/verification/provider-name-lockin.functions";
import { IdentityProfileCard } from "@/components/dashboard/verification/TrustBlock";
import { VerifiedBadge, type VerifiedTier } from "@/components/verification/VerifiedBadge";
import {
  getProviderDomainVerification,
  setProviderWebsite,
  startProviderDomainVerification,
} from "@/lib/verification/provider-domain.functions";
import type { ProviderDomainState } from "@/lib/verification/provider-domain-shared";
import { isEmailShape } from "@/lib/verification/provider-domain-shared";


/* -------------------------------------------------------------------------- */
/* Return-from-flow toasts                                                    */
/* -------------------------------------------------------------------------- */

function useReturnToasts() {
  const qc = useQueryClient();
  const router = useRouter();
  const search = useSearch({
    from: "/_authenticated/_professional/dashboard_/verification",
  }) as { stripe_identity?: string; domain_confirm?: string };

  React.useEffect(() => {
    if (search.stripe_identity === "complete") {
      void qc.invalidateQueries({ queryKey: ["my-identity"] });
      void qc.invalidateQueries({ queryKey: ["my-trust-state"] });
      void qc.invalidateQueries({ queryKey: ["provider-verification-summary"] });
      toast.success("ID check submitted — we'll confirm shortly.");
    }
    if (search.domain_confirm === "ok") {
      void qc.invalidateQueries({ queryKey: ["provider-domain-verification"] });
      void qc.invalidateQueries({ queryKey: ["provider-verification-summary"] });
      toast.success("Email confirmed. Our team will review your domain shortly.");
    } else if (search.domain_confirm === "expired") {
      toast.error("That confirmation link expired. Send yourself a new one below.");
    } else if (search.domain_confirm === "invalid") {
      toast.error("That confirmation link isn't valid. Send yourself a new one.");
    } else if (search.domain_confirm === "already") {
      toast.info("Your provider domain is already verified.");
    } else if (search.domain_confirm === "error") {
      toast.error("Something went wrong confirming your email. Please try again.");
    }
    if (search.stripe_identity || search.domain_confirm) {
      router.navigate({
        to: "/dashboard/verification",
        search: {},
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.stripe_identity, search.domain_confirm]);
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function ProviderVerificationPage() {
  useReturnToasts();

  const fetchSummary = useServerFn(getProviderVerificationSummary);
  const summaryQ = useQuery({
    queryKey: ["provider-verification-summary"],
    queryFn: () => fetchSummary(),
  });
  const s = summaryQ.data;

  const fetchDomain = useServerFn(getProviderDomainVerification);
  const domainQ = useQuery({
    queryKey: ["provider-domain-verification"],
    queryFn: () => fetchDomain(),
  });
  const d = domainQ.data;

  const identityDone = !!s?.identity.done;
  const nameLocked = !!s?.name.locked;
  const domainDone = !!s?.domain.done;
  const completed = (Number(identityDone) + Number(nameLocked) + Number(domainDone)) as
    | 0
    | 1
    | 2
    | 3;
  const badgeTier: VerifiedTier =
    completed === 3 ? "full" : identityDone ? "identity" : "none";

  return (
    <DashboardShell
      role="trainer"
      tier="training_provider"
      active="Verification"
      title="Verification"
      subtitle="Three checks. Once locked, each step is permanent."
    >
      <div className="flex flex-col gap-6">
        <Hero
          identityDone={identityDone}
          identityStatus={s?.identity.status ?? "none"}
          nameLocked={nameLocked}
          namePending={!!s?.name.pendingName}
          domainDone={domainDone}
          domainStatus={d?.status ?? "unstarted"}
          completed={completed}
          badgeTier={badgeTier}
          loading={summaryQ.isLoading || domainQ.isLoading}
        />

        <div className="flex flex-col gap-4">
          <IdentityProfileCard step="01" />
          <ProviderNameCard
            step="02"
            summary={s}
            loading={summaryQ.isLoading}
          />
          <DomainEmailCard state={d} loading={domainQ.isLoading} />
        </div>
      </div>
    </DashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

function Hero({
  identityDone,
  identityStatus,
  nameLocked,
  namePending,
  domainDone,
  domainStatus,
  completed,
  badgeTier,
  loading,
}: {
  identityDone: boolean;
  identityStatus: string;
  nameLocked: boolean;
  namePending: boolean;
  domainDone: boolean;
  domainStatus: ProviderDomainState["status"];
  completed: 0 | 1 | 2 | 3;
  badgeTier: VerifiedTier;
  loading: boolean;
}) {
  const allDone = completed === 3;
  const empty = completed === 0;
  const pending = domainStatus === "pending_admin_review";

  const headline = allDone
    ? "You're verified"
    : empty
      ? "Verify your training provider"
      : pending
        ? "Awaiting REPS review"
        : `${completed} of 3 — keep going`;

  const sub = allDone
    ? "All three checks locked in. Your provider is verified across REPS."
    : empty
      ? "Three checks: prove your identity, lock in your provider name, and confirm your domain. Each is permanent once submitted."
      : pending
        ? "You've confirmed your provider email. Our team will review your domain shortly."
        : `${3 - completed} more ${3 - completed === 1 ? "check" : "checks"} to complete your provider verification.`;

  const identityLabel = identityDone
    ? "Identity locked"
    : identityStatus === "pending"
      ? "Identity — in review"
      : identityStatus === "rejected" ||
          identityStatus === "needs_more_info"
        ? "Identity — action needed"
        : identityStatus === "expired"
          ? "Identity — expired"
          : "Identity — not started";

  const nameLabel = nameLocked
    ? "Provider name locked"
    : namePending
      ? "Provider name — in review"
      : "Provider name — not started";

  const domainLabel = domainDone
    ? "Domain locked"
    : domainStatus === "pending_admin_review"
      ? "Domain — in review"
      : domainStatus === "email_sent"
        ? "Domain — email sent"
        : domainStatus === "rejected"
          ? "Domain — action needed"
          : "Domain — not started";

  return (
    <section className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
      <div className="relative grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_85%_50%,rgba(255,122,0,0.10),transparent_55%)]" />
        <div className="relative z-10 min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-ink/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
            Provider Verification
          </div>
          <h2 className="font-display text-[24px] font-bold leading-tight text-white lg:text-[28px]">
            {headline}
          </h2>
          <p className="mt-2 max-w-[56ch] text-[14px] text-white/65">{sub}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <LayerChip label={identityLabel} earned={identityDone} loading={loading} />
            <LayerChip label={nameLabel} earned={nameLocked} loading={loading} />
            <LayerChip label={domainLabel} earned={domainDone} loading={loading} />
          </div>

        </div>

        <div className="relative z-10 flex flex-col items-start gap-3 lg:items-end">
          <VerifiedBadge
            tier={badgeTier}
            size="lg"
            label={
              badgeTier === "full"
                ? "Identity · Name · Domain"
                : badgeTier === "identity"
                  ? "Identity verified"
                  : "Not yet verified"
            }
          />
          <p className="text-[11px] text-white/45 lg:text-right">
            {allDone
              ? "Live on every public surface."
              : "Updates the moment all three checks lock in."}
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
/* Provider name lock-in card (step 02)                                        */
/* -------------------------------------------------------------------------- */

function ProviderNameCard({
  step,
  summary,
  loading,
}: {
  step: string;
  summary: import("@/lib/verification/provider-verification.functions").ProviderVerificationSummary | undefined;
  loading: boolean;
}) {
  const qc = useQueryClient();
  const lockIn = useServerFn(lockInProviderName);
  const locked = !!summary?.name.locked;
  const lockedName = summary?.name.providerName ?? null;
  const [value, setValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleLockIn() {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      toast.error("Enter your training provider name.");
      return;
    }
    if (
      !window.confirm(
        `Lock in "${trimmed}" as your training provider name?\n\nThis is permanent — you won't be able to change it yourself afterwards.`,
      )
    ) {
      return;
    }
    try {
      setSubmitting(true);
      await lockIn({ data: { provider_name: trimmed } });
      toast.success("Provider name locked in.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["provider-verification-summary"] }),
        qc.invalidateQueries({ queryKey: ["my-provider-name-status"] }),
        qc.invalidateQueries({ queryKey: ["my-provider-profile"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="provider-name"
      className="scroll-mt-24 rounded-[16px] border border-reps-border bg-reps-panel p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[15px] font-semibold text-white">
              Training provider name
            </h2>
            {locked ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <Lock className="h-3 w-3" /> Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-white/60">
                Action needed
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-white/55">
            The trading name of your training provider — shown on your public
            page and used in your REPS URL. Permanent once locked.
          </p>
        </div>
        <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
          {step}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-white/55">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : locked ? (
        <div className="rounded-[12px] border border-emerald-400/25 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-white">
                Locked as &ldquo;{lockedName}&rdquo;
              </p>
              <p className="mt-1 text-[12.5px] text-white/60">
                This is your public REPS name. Contact support if it needs to
                change.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-white/50">
              Training provider name
            </span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Smart Dog Training"
              maxLength={120}
              className="h-10 rounded-[12px] border border-reps-border bg-reps-ink/60 px-3 text-[13.5px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
            />
            <span className="text-[11px] text-white/40">
              This is what learners see. Once locked, only REPS support can
              change it — there's no self-service edit.
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLockIn}
              disabled={submitting || value.trim().length < 2}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white transition hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              Lock in provider name
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Domain email card                                                          */
/* -------------------------------------------------------------------------- */


function DomainEmailCard({
  state,
  loading,
}: {
  state: ProviderDomainState | undefined;
  loading: boolean;
}) {
  const qc = useQueryClient();
  const start = useServerFn(startProviderDomainVerification);

  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const status = state?.status ?? "unstarted";
  const domain = state?.expectedDomain ?? null;
  const websiteMissing = state?.websiteMissing ?? false;
  const suggested = domain ? `hello@${domain}` : "";

  React.useEffect(() => {
    if (!email && domain && (status === "unstarted" || status === "email_sent")) {
      setEmail(state?.email ?? suggested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, state?.email, status]);

  const pill = statusPill(status);

  async function handleSend() {
    if (!email || !isEmailShape(email)) {
      toast.error("Enter a valid email address on your provider's domain.");
      return;
    }
    try {
      setSubmitting(true);
      await start({ data: { email: email.trim().toLowerCase() } });
      toast.success(`Confirmation email sent to ${email}.`);
      await qc.invalidateQueries({ queryKey: ["provider-domain-verification"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="domain"
      className="scroll-mt-24 rounded-[16px] border border-reps-border bg-reps-panel p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[15px] font-semibold text-white">Provider domain</h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pill.cls}`}
            >
              {pill.icon}
              {pill.label}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-white/55">
            {domain
              ? `Confirm an email on ${domain} — the domain of your provider website.`
              : "Confirm a business email on your provider's website domain."}
          </p>
        </div>
        <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
          03
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-white/55">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : websiteMissing ? (
        <WebsiteMissingBlock currentWebsite={state?.rawWebsite ?? null} />

      ) : status === "approved" ? (
        <ApprovedBlock state={state} />
      ) : status === "rejected" ? (
        <RejectedBlock state={state} onRetry={handleSend} email={email} setEmail={setEmail} submitting={submitting} domain={domain} />
      ) : status === "pending_admin_review" || status === "email_confirmed" ? (
        <AwaitingReviewBlock state={state} />
      ) : (
        <SendBlock
          email={email}
          setEmail={setEmail}
          onSend={handleSend}
          submitting={submitting}
          state={state}
          domain={domain}
          suggested={suggested}
        />
      )}
    </section>
  );
}

function WebsiteMissingBlock({ currentWebsite }: { currentWebsite: string | null }) {
  const qc = useQueryClient();
  const save = useServerFn(setProviderWebsite);
  const [website, setWebsite] = React.useState(currentWebsite ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave() {
    if (!website.trim()) {
      toast.error("Enter your provider website URL.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await save({ data: { website: website.trim() } });
      toast.success(`Website saved. You'll verify against ${res.domain}.`);
      await qc.invalidateQueries({ queryKey: ["provider-domain-verification"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[12px] border border-amber-400/25 bg-amber-500/5 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-white">Set your provider website</p>
          <p className="mt-1 text-[12.5px] text-white/60">
            We derive the domain to verify against from your provider website. Enter your URL below
            — we'll match your confirmation email to this domain.
          </p>

          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-white/50">
              Provider website URL
            </span>
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://your-provider.com"
              className="h-10 rounded-[12px] border border-reps-border bg-reps-ink/60 px-3 text-[13.5px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
            />
          </label>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || !website.trim()}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white transition hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendBlock({
  email,
  setEmail,
  onSend,
  submitting,
  state,
  domain,
  suggested,
}: {
  email: string;
  setEmail: (v: string) => void;
  onSend: () => void;
  submitting: boolean;
  state: ProviderDomainState | undefined;
  domain: string | null;
  suggested: string;
}) {
  const sentAt = state?.emailSentAt ? new Date(state.emailSentAt) : null;
  const alreadySent = state?.status === "email_sent";

  return (
    <div className="flex flex-col gap-3">
      {alreadySent && sentAt ? (
        <div className="rounded-[12px] border border-reps-border bg-reps-ink/40 p-3.5">
          <div className="flex items-start gap-2.5">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white">
                We sent a link to {state?.email}
              </p>
              <p className="mt-0.5 text-[12px] text-white/55">
                Click the button in that email to confirm. Didn't get it? Check spam, or resend below.
                Sent {sentAt.toLocaleString()}.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-white/50">
          Email on {domain ?? "your domain"}
        </span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={suggested}
          className="h-10 rounded-[12px] border border-reps-border bg-reps-ink/60 px-3 text-[13.5px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
        />
        <span className="text-[11px] text-white/40">
          Must be on {domain ?? "your provider's domain"} — free providers (Gmail, Outlook, Yahoo…) aren't accepted.
        </span>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSend}
          disabled={submitting || !email}
          className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white transition hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : alreadySent ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          {alreadySent ? "Resend confirmation" : "Send confirmation email"}
        </button>
      </div>
    </div>
  );
}

function AwaitingReviewBlock({ state }: { state: ProviderDomainState | undefined }) {
  return (
    <div className="rounded-[12px] border border-amber-400/25 bg-amber-500/5 p-4">
      <div className="flex items-start gap-2.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-white">Awaiting REPS review</p>
          <p className="mt-1 text-[12.5px] text-white/60">
            You confirmed <strong>{state?.email}</strong>. Our team will review your provider domain
            and approve it — usually within 1 working day. You'll get an email once it's live.
          </p>
        </div>
      </div>
    </div>
  );
}

function ApprovedBlock({ state }: { state: ProviderDomainState | undefined }) {
  return (
    <div className="rounded-[12px] border border-emerald-400/25 bg-emerald-500/5 p-4">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-white">Domain verified</p>
          <p className="mt-1 text-[12.5px] text-white/60">
            <strong>{state?.expectedDomain}</strong> is confirmed via <strong>{state?.email}</strong>.
            {state?.adminReviewedAt
              ? ` Approved ${new Date(state.adminReviewedAt).toLocaleDateString()}.`
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function RejectedBlock({
  state,
  email,
  setEmail,
  onRetry,
  submitting,
  domain,
}: {
  state: ProviderDomainState | undefined;
  email: string;
  setEmail: (v: string) => void;
  onRetry: () => void;
  submitting: boolean;
  domain: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[12px] border border-rose-400/25 bg-rose-500/5 p-4">
        <div className="flex items-start gap-2.5">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-white">Domain not approved</p>
            <p className="mt-1 text-[12.5px] text-white/60">
              {state?.adminDecisionReason ?? "Our team couldn't approve this domain."}
              {state?.adminNotes ? ` — ${state.adminNotes}` : ""}
            </p>
          </div>
        </div>
      </div>
      <SendBlock
        email={email}
        setEmail={setEmail}
        onSend={onRetry}
        submitting={submitting}
        state={state}
        domain={domain}
        suggested={domain ? `hello@${domain}` : ""}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function statusPill(status: ProviderDomainState["status"]): {
  label: string;
  cls: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "approved":
      return {
        label: "Verified",
        cls: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    case "pending_admin_review":
    case "email_confirmed":
      return {
        label: "Awaiting review",
        cls: "border-amber-400/30 bg-amber-500/15 text-amber-300",
        icon: <Clock className="h-3 w-3" />,
      };
    case "email_sent":
      return {
        label: "Email sent",
        cls: "border-amber-400/30 bg-amber-500/15 text-amber-300",
        icon: <Mail className="h-3 w-3" />,
      };
    case "rejected":
      return {
        label: "Rejected",
        cls: "border-rose-400/30 bg-rose-500/15 text-rose-300",
        icon: <XCircle className="h-3 w-3" />,
      };
    default:
      return {
        label: "Not started",
        cls: "border-white/12 bg-white/[0.05] text-white/60",
        icon: <Mail className="h-3 w-3" />,
      };
  }
}




