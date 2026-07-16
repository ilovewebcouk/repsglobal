/**
 * /dashboard/profile — training-provider profile editor.
 *
 * Consolidates the provider's public identity, contact and social links.
 * Identity trio (name / legal / domain) is locked from verification.
 * Website URL is intentionally omitted — it's the verified domain.
 */
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Clock, ExternalLink, Loader2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { PhoneField, isValidPhoneNumber } from "@/components/forms/PhoneField";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import { SocialLinksPicker, type SocialField } from "@/components/profile/SocialLinksPicker";

import {
  getMyProviderProfile,
  updateMyProviderProfile,
} from "@/lib/profile/provider-profile.functions";
import { getMyProviderNameStatus } from "@/lib/verification/provider-name.functions";
import { getProviderDomainVerification } from "@/lib/verification/provider-domain.functions";
import { getProviderVerificationSummary } from "@/lib/verification/provider-verification.functions";
import { listMyProviderChanges } from "@/lib/verification/provider-changes.functions";
import { ProviderFaqsSection } from "./ProviderFaqsSection";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const inputCls =
  "h-10 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none";
const textareaCls =
  "min-h-[128px] w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none";

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function ProviderProfilePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProviderProfile);
  const saveProfile = useServerFn(updateMyProviderProfile);
  const fetchNameStatus = useServerFn(getMyProviderNameStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["my-provider-profile"],
    queryFn: () => fetchProfile(),
  });

  const { data: nameStatus } = useQuery({
    queryKey: ["my-provider-name-status"],
    queryFn: () => fetchNameStatus(),
  });

  const fetchVerifSummary = useServerFn(getProviderVerificationSummary);
  const { data: verifSummary } = useQuery({
    queryKey: ["provider-verification-summary"],
    queryFn: () => fetchVerifSummary(),
  });

  const fetchDomainStatus = useServerFn(getProviderDomainVerification);
  const { data: domainStatus } = useQuery({
    queryKey: ["my-provider-domain-status"],
    queryFn: () => fetchDomainStatus(),
  });

  const fetchChanges = useServerFn(listMyProviderChanges);
  const { data: changes } = useQuery({
    queryKey: ["my-provider-changes"],
    queryFn: () => fetchChanges(),
  });
  const pendingChanges = changes?.pending ?? {};
  const pendingKeys = Object.keys(pendingChanges);

  const namePending = !!nameStatus?.pending;
  const approvedName = nameStatus?.approved_name ?? "";

  const emailLocked = domainStatus?.status === "approved";
  const approvedEmail = domainStatus?.email ?? "";

  const [form, setForm] = React.useState({
    tagline: "",
    about: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    social_instagram: "",
    social_linkedin: "",
    social_youtube: "",
    social_tiktok: "",
    social_x: "",
  });

  React.useEffect(() => {
    if (!data) return;
    setForm({
      tagline: data.tagline ?? "",
      about: data.about ?? "",
      contact_email: data.contact_email ?? "",
      contact_phone: data.contact_phone ?? "",
      address: data.address ?? "",
      social_instagram: data.social_instagram ?? "",
      social_linkedin: data.social_linkedin ?? "",
      social_youtube: data.social_youtube ?? "",
      social_tiktok: data.social_tiktok ?? "",
      social_x: data.social_x ?? "",
    });
  }, [data]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const phoneValid = !form.contact_phone || isValidPhoneNumber(form.contact_phone);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!phoneValid) throw new Error("Phone number looks invalid.");

      const res = await saveProfile({
        data: {
          tagline: form.tagline || null,
          about: form.about || null,
          contact_email: (emailLocked ? approvedEmail : form.contact_email) || null,
          contact_phone: form.contact_phone || null,
          address: form.address || null,
          social_instagram: form.social_instagram || null,
          social_linkedin: form.social_linkedin || null,
          social_youtube: form.social_youtube || null,
          social_tiktok: form.social_tiktok || null,
          social_x: form.social_x || null,
        },
      });

      const submitted = (res as { submitted?: number } | undefined)?.submitted ?? 0;
      return { submitted };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-provider-profile"] });
      qc.invalidateQueries({ queryKey: ["my-provider-changes"] });
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["website-public"] });
      const total = res?.submitted ?? 0;
      if (total === 0) toast.success("No changes to submit.");
      else if (total === 1) toast.success("1 change submitted for admin approval.");
      else toast.success(`${total} changes submitted for admin approval.`);
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save profile"),
  });

  /* -------------------- dirty / submit-button state -------------------- */

  const baseline = React.useMemo(() => {
    if (!data) return null;
    return {
      tagline: data.tagline ?? "",
      about: data.about ?? "",
      contact_email: data.contact_email ?? "",
      contact_phone: data.contact_phone ?? "",
      address: data.address ?? "",
      social_instagram: data.social_instagram ?? "",
      social_linkedin: data.social_linkedin ?? "",
      social_youtube: data.social_youtube ?? "",
      social_tiktok: data.social_tiktok ?? "",
      social_x: data.social_x ?? "",
    };
  }, [data]);

  const changedCount = React.useMemo(() => {
    if (!baseline) return 0;
    let n = 0;
    const pairs: Array<[keyof typeof form, string, boolean]> = [
      ["tagline", baseline.tagline, false],
      ["about", baseline.about, false],
      ["contact_email", baseline.contact_email, emailLocked],
      ["contact_phone", baseline.contact_phone, false],
      ["address", baseline.address, false],
      ["social_instagram", baseline.social_instagram, false],
      ["social_linkedin", baseline.social_linkedin, false],
      ["social_youtube", baseline.social_youtube, false],
      ["social_tiktok", baseline.social_tiktok, false],
      ["social_x", baseline.social_x, false],
    ];
    for (const [key, base, locked] of pairs) {
      if (locked) continue;
      if ((form[key] ?? "") !== (base ?? "")) n += 1;
    }
    return n;
  }, [baseline, form, emailLocked]);

  const dirty = changedCount > 0;

  const [justSubmitted, setJustSubmitted] = React.useState(false);
  React.useEffect(() => {
    if (!saveMut.isSuccess) return;
    setJustSubmitted(true);
    const t = setTimeout(() => setJustSubmitted(false), 4000);
    return () => clearTimeout(t);
  }, [saveMut.isSuccess, saveMut.submittedAt]);

  const hasPending = pendingKeys.length > 0 || namePending;

  const socialPending =
    "social_instagram" in pendingChanges ||
    "social_tiktok" in pendingChanges ||
    "social_x" in pendingChanges ||
    "social_youtube" in pendingChanges ||
    "social_linkedin" in pendingChanges;

  type BtnState =
    | { kind: "loading" }
    | { kind: "saving" }
    | { kind: "invalid" }
    | { kind: "submitted" }
    | { kind: "dirty"; count: number }
    | { kind: "pending" }
    | { kind: "clean" };

  const btnState: BtnState = isLoading
    ? { kind: "loading" }
    : saveMut.isPending
      ? { kind: "saving" }
      : dirty && !phoneValid
        ? { kind: "invalid" }
        : justSubmitted && !dirty
          ? { kind: "submitted" }
          : dirty
            ? { kind: "dirty", count: changedCount }
            : hasPending
              ? { kind: "pending" }
              : { kind: "clean" };

  const btnBase =
    "inline-flex h-9 items-center gap-2 rounded-[10px] px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed";
  const btnStyles: Record<BtnState["kind"], string> = {
    loading: "bg-reps-orange text-white opacity-60",
    saving: "bg-reps-orange text-white opacity-80",
    invalid: "border border-amber-400/40 bg-amber-500/15 text-amber-200",
    submitted: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    dirty: "bg-reps-orange text-white hover:bg-reps-orange/90",
    pending: "border border-reps-border bg-reps-panel-soft text-white/60",
    clean: "border border-reps-border bg-reps-panel-soft text-white/55",
  };
  const btnLabel: Record<BtnState["kind"], string> = {
    loading: "Submit for review",
    saving: "Submitting…",
    invalid: "Fix phone number",
    submitted: "Submitted",
    dirty:
      btnState.kind === "dirty"
        ? `Submit ${btnState.count} ${btnState.count === 1 ? "change" : "changes"} for review`
        : "Submit for review",
    pending: "Awaiting admin review",
    clean: "No changes to submit",
  };
  const btnDisabled = btnState.kind !== "dirty";

  /* -------------------- render -------------------- */

  return (
    <DashboardShell
      role="trainer"
      tier="training_provider"
      active="Profile"
      title="Provider profile"
      subtitle="Public identity, contact details and social links for your REPS listing."
      actions={
        <div className="flex items-center gap-2">
          {data?.slug ? (
            <a
              href={`/t/${data.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.06]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View public page
            </a>
          ) : null}
          <button
            type="button"
            disabled={btnDisabled}
            onClick={() => saveMut.mutate()}
            className={`${btnBase} ${btnStyles[btnState.kind]}`}
            aria-live="polite"
          >
            {btnState.kind === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : btnState.kind === "submitted" ? (
              <Check className="h-4 w-4" />
            ) : btnState.kind === "pending" ? (
              <Clock className="h-3.5 w-3.5" />
            ) : null}
            {btnLabel[btnState.kind]}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* IDENTITY — read-only. All three values are locked during verification. */}
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-white">Identity</h3>
                <p className="mt-0.5 text-[12px] text-white/55">
                  Locked during verification. Contact support to change any of these.
                </p>
              </div>
              <Link
                to="/dashboard/verification"
                className="shrink-0 text-[12px] font-semibold text-reps-orange hover:text-reps-orange-hover"
              >
                View verification
              </Link>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-reps-border">
            <LockedRow
              label="Provider name"
              value={approvedName || verifSummary?.name.providerName || null}
              missingHint="Not yet locked in. Complete step 02 of verification."
              hint={
                data?.slug ? (
                  <>
                    Public URL:{" "}
                    <a
                      href={`/t/${data.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-reps-orange hover:underline"
                    >
                      repsuk.org/t/{data.slug}
                    </a>
                  </>
                ) : null
              }
              pending={
                namePending
                  ? `Awaiting review: "${nameStatus?.pending?.requested_name}"`
                  : null
              }
            />
            <LockedRow
              label="Legal identity (from Stripe)"
              value={verifSummary?.identity.verifiedName ?? null}
              missingHint="Not yet verified. Complete step 01 of verification."
              hint="Private. Only REPS admin can see this."
            />
            <LockedRow
              label="Provider domain"
              value={verifSummary?.domain.domain ?? null}
              missingHint="Not yet verified. Complete step 03 of verification."
              hint={
                verifSummary?.domain.email
                  ? `Verified via ${verifSummary.domain.email}`
                  : null
              }
            />
          </div>
        </PPanel>

        {/* ABOUT */}
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h3 className="text-[14px] font-semibold text-white">About</h3>
            <p className="mt-0.5 text-[12px] text-white/55">
              A short tagline and a longer public description of your training organisation.
            </p>
          </div>
          <div className="flex flex-col gap-5 px-5 py-4">
            <Field
              label="Tagline"
              hint="One line — e.g. “Ofqual-regulated PT courses in Manchester.” (Max 160 chars.)"
              pending={"tagline" in pendingChanges}
            >
              <input
                className={inputCls}
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                maxLength={160}
                placeholder="Short one-liner"
              />
            </Field>
            <Field
              label="Public description"
              hint="What you offer, who you train, what makes you different."
              pending={"about" in pendingChanges}
            >
              <textarea
                className={textareaCls}
                value={form.about}
                onChange={(e) => update("about", e.target.value)}
                maxLength={800}
                placeholder="Tell prospective learners about your provider…"
              />
              <div className="mt-1 text-right text-[11px] text-white/40">
                {form.about.length}/800
              </div>
            </Field>
          </div>
        </PPanel>

        {/* CONTACT */}
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h3 className="text-[14px] font-semibold text-white">Contact</h3>
            <p className="mt-0.5 text-[12px] text-white/55">
              How prospective learners get in touch.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
            <Field
              label="Contact email"
              hint={
                emailLocked
                  ? "Locked — matches the email confirmed during verification. Contact support to change it."
                  : "Public — shown on your provider page."
              }
              pending={!emailLocked && "contact_email" in pendingChanges}
            >
              <input
                className={`${inputCls} ${emailLocked ? "cursor-not-allowed opacity-70" : ""}`}
                type="email"
                inputMode="email"
                value={emailLocked ? approvedEmail : form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                placeholder="hello@yourprovider.com"
                maxLength={254}
                readOnly={emailLocked}
                aria-readonly={emailLocked}
              />
            </Field>
            <Field
              label="Telephone"
              hint="International format — e.g. +44 7911 123456."
              pending={"contact_phone" in pendingChanges}
            >
              <PhoneField
                value={form.contact_phone}
                onChange={(v) => update("contact_phone", v)}
                invalid={!phoneValid}
              />
              {!phoneValid ? (
                <p className="mt-2 text-[12px] text-rose-300">
                  That doesn't look like a valid phone number.
                </p>
              ) : null}
            </Field>
            <div className="md:col-span-2">
              <Field
                label="Address"
                hint="Public — shown on your provider page. Start typing and pick from Google's suggestions."
                pending={"address" in pendingChanges}
              >
                <AddressAutocomplete
                  value={form.address}
                  onChange={(v: string) => update("address", v.slice(0, 500))}
                  placeholder="Start typing your address…"
                />
              </Field>
            </div>
          </div>
        </PPanel>

        {/* SOCIAL */}
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-white">Social links</h3>
                <p className="mt-0.5 text-[12px] text-white/55">
                  Paste full URLs or @ handles — we clean them up automatically.
                </p>
              </div>
              {socialPending ? <PendingPill /> : null}
            </div>
          </div>
          <div className="px-5 py-4">
            <SocialLinksPicker
              values={{
                social_instagram: form.social_instagram,
                social_tiktok: form.social_tiktok,
                social_x: form.social_x,
                social_youtube: form.social_youtube,
                social_linkedin: form.social_linkedin,
              }}
              onChange={(field: SocialField, value: string) => update(field, value)}
            />
          </div>
        </PPanel>

        {/* FAQs */}
        <ProviderFaqsSection />
      </div>
    </DashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Small local primitives                                                      */
/* -------------------------------------------------------------------------- */

function PendingPill() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
      <Clock className="h-3 w-3" /> Awaiting admin approval
    </span>
  );
}

function Field({
  label,
  hint,
  pending,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-white/85">{label}</span>
        {pending ? <PendingPill /> : null}
      </span>
      {children}
      {hint ? <span className="text-[11.5px] text-white/45">{hint}</span> : null}
    </label>
  );
}

function LockedRow({
  label,
  value,
  missingHint,
  hint,
  pending,
}: {
  label: string;
  value: string | null;
  missingHint: string;
  hint?: React.ReactNode;
  pending?: string | null;
}) {
  const hasValue = !!value && value.trim().length > 0;
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] font-medium text-white/85">{label}</span>
        {hasValue ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300">
            <Check className="h-3 w-3" /> Locked
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10.5px] font-semibold text-white/60">
            Not yet locked
          </span>
        )}
      </div>
      <div
        className={`text-[14px] font-semibold ${
          hasValue ? "text-white" : "text-white/40"
        }`}
      >
        {hasValue ? value : missingHint}
      </div>
      {hint ? <span className="text-[11.5px] text-white/45">{hint}</span> : null}
      {pending ? (
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-[8px] border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11.5px] font-semibold text-amber-200">
          <Clock className="h-3 w-3" /> {pending}
        </span>
      ) : null}
    </div>
  );
}
