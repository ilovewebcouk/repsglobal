/**
 * Admin — Provider profile editor.
 *
 * Mirrors `src/components/dashboard/organisation/ProviderProfilePage.tsx`
 * section-for-section, field-for-field. Writes to the SAME columns the
 * training-provider dashboard reads (websites.tagline / websites.about
 * and professionals.{website_url, contact_email, contact_phone, address,
 * social_*}) — so an admin save reflects on the public /t/{slug} page
 * exactly the way a provider self-save would.
 *
 * Provider name lives in its own rename dialog (admin override) and is
 * not part of the main save button.
 */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Check,
  ExternalLink,
  Instagram,
  Linkedin,
  Loader2,
  Pencil,
  Youtube,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PhoneField, isValidPhoneNumber } from "@/components/forms/PhoneField";
import { SocialHandleInput } from "@/components/forms/SocialHandleInput";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";

import {
  adminUpdateProviderProfileMirror,
  readProviderProfileForAdmin,
  renameProvider,
} from "@/lib/admin/providers.functions";
import { getProviderDomainVerification } from "@/lib/verification/provider-domain.functions";
import type { Member360Snapshot } from "@/lib/admin/member360.functions";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M17.5 3h3.4l-7.4 8.5L22 21h-6.9l-5.4-6.5L3.4 21H0l7.9-9.1L0 3h7l4.9 5.9L17.5 3z" />
    </svg>
  );
}
function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M19.6 6.7a5.6 5.6 0 0 1-3.4-1.2 5.6 5.6 0 0 1-2.1-3.5h-3v13.2a2.6 2.6 0 1 1-1.9-2.5V9.5a5.7 5.7 0 1 0 4.9 5.7V9.1a8.5 8.5 0 0 0 5.5 1.9z" />
    </svg>
  );
}

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40";
const PANEL_HEAD = "border-b border-reps-border px-5 py-4";
const PANEL_BODY = "px-5 py-4";

/* ------------------------------------------------------------------ */
/* Fetch — admin uses service-role backed reads via mirror snapshot     */
/* ------------------------------------------------------------------ */

type ProviderProfileForm = {
  tagline: string;
  about: string;
  website_url: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  social_instagram: string;
  social_linkedin: string;
  social_youtube: string;
  social_tiktok: string;
  social_x: string;
};

const EMPTY_FORM: ProviderProfileForm = {
  tagline: "",
  about: "",
  website_url: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  social_instagram: "",
  social_linkedin: "",
  social_youtube: "",
  social_tiktok: "",
  social_x: "",
};

export function ProviderProfileMirror({
  userId,
  snapshot,
}: {
  userId: string;
  snapshot: Member360Snapshot;
}) {
  const qc = useQueryClient();
  const save = useServerFn(adminUpdateProviderProfileMirror);

  // Read current values with an ad-hoc admin server fn call: piggyback on
  // the shared /admin fetch by loading through a dedicated query. Simpler:
  // we run a small SELECT via a server function we already have — but to
  // avoid adding another endpoint, we load through the member360 snapshot
  // plus a lightweight direct fetch of websites via the mirror save's
  // dry read (return { ok, changed:0 } on identity submit). Instead, use
  // a dedicated read: reuse getProviderDomainVerification for the lock
  // state, and read profile fields by calling the mirror save with an
  // empty patch to fetch the persisted "before" — but that's ugly.
  //
  // Cleaner: derive baseline from a single fresh server call.

  const readFn = useServerFn(readProviderProfileForAdmin);
  const readQ = useQuery({
    queryKey: ["admin-provider-profile-mirror", userId],
    queryFn: () => readFn({ data: { user_id: userId } }),
  });

  const domainFn = useServerFn(getProviderDomainVerification);
  const domainQ = useQuery({
    queryKey: ["admin-provider-domain", userId],
    queryFn: () => domainFn(),
    // Fetch is scoped to the caller (the admin) — not this provider.
    // Provider self-service reads their own state; for the admin surface
    // we cannot use the impersonation-scoped fn cleanly. Instead we
    // rely on the readProviderProfileForAdmin result to report the lock
    // state. Keep this query disabled by default.
    enabled: false,
  });
  void domainQ;

  const [form, setForm] = React.useState<ProviderProfileForm>(EMPTY_FORM);
  const [overrideDomain, setOverrideDomain] = React.useState(false);
  const [overrideEmail, setOverrideEmail] = React.useState(false);

  React.useEffect(() => {
    if (!readQ.data) return;
    const d = readQ.data;
    setForm({
      tagline: d.tagline ?? "",
      about: d.about ?? "",
      website_url: d.website_url ?? "",
      contact_email: d.contact_email ?? "",
      contact_phone: d.contact_phone ?? "",
      address: d.address ?? "",
      social_instagram: d.social_instagram ?? "",
      social_linkedin: d.social_linkedin ?? "",
      social_youtube: d.social_youtube ?? "",
      social_tiktok: d.social_tiktok ?? "",
      social_x: d.social_x ?? "",
    });
  }, [readQ.data]);

  const websiteLocked = readQ.data?.domain_status === "approved";
  const emailLocked = websiteLocked;
  const approvedName = readQ.data?.approved_name ?? "";
  const approvedSlug = readQ.data?.slug ?? snapshot.slug ?? null;

  const update = <K extends keyof ProviderProfileForm>(k: K, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const phoneValid = !form.contact_phone || isValidPhoneNumber(form.contact_phone);

  const baseline = React.useMemo<ProviderProfileForm | null>(() => {
    if (!readQ.data) return null;
    const d = readQ.data;
    return {
      tagline: d.tagline ?? "",
      about: d.about ?? "",
      website_url: d.website_url ?? "",
      contact_email: d.contact_email ?? "",
      contact_phone: d.contact_phone ?? "",
      address: d.address ?? "",
      social_instagram: d.social_instagram ?? "",
      social_linkedin: d.social_linkedin ?? "",
      social_youtube: d.social_youtube ?? "",
      social_tiktok: d.social_tiktok ?? "",
      social_x: d.social_x ?? "",
    };
  }, [readQ.data]);

  const changedCount = React.useMemo(() => {
    if (!baseline) return 0;
    let n = 0;
    for (const k of Object.keys(EMPTY_FORM) as (keyof ProviderProfileForm)[]) {
      if ((form[k] ?? "") !== (baseline[k] ?? "")) n += 1;
    }
    return n;
  }, [baseline, form]);

  const dirty = changedCount > 0;

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!phoneValid) throw new Error("Phone number looks invalid.");
      return save({
        data: {
          user_id: userId,
          patch: {
            tagline: form.tagline || null,
            about: form.about || null,
            website_url: (websiteLocked && !overrideDomain
              ? baseline?.website_url ?? ""
              : form.website_url) || null,
            contact_email: (emailLocked && !overrideEmail
              ? baseline?.contact_email ?? ""
              : form.contact_email) || null,
            contact_phone: form.contact_phone || null,
            address: form.address || null,
            social_instagram: form.social_instagram || null,
            social_linkedin: form.social_linkedin || null,
            social_youtube: form.social_youtube || null,
            social_tiktok: form.social_tiktok || null,
            social_x: form.social_x || null,
          },
          override_domain_lock: overrideDomain,
          override_email_lock: overrideEmail,
          reason: null,
        },
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-member-360", userId] });
      qc.invalidateQueries({ queryKey: ["admin-provider-profile-mirror", userId] });
      const n = (res as { changed?: number } | undefined)?.changed ?? 0;
      if (n === 0) toast.success("No changes to save.");
      else toast.success(`${n} ${n === 1 ? "field" : "fields"} saved.`);
      setOverrideDomain(false);
      setOverrideEmail(false);
    },
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });

  if (readQ.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className={`${PANEL} h-24 animate-pulse`} />
        <div className={`${PANEL} h-72 animate-pulse`} />
      </div>
    );
  }

  const btnDisabled = !dirty || saveMut.isPending || !phoneValid;
  const btnLabel = saveMut.isPending
    ? "Saving…"
    : dirty
      ? `Save ${changedCount} ${changedCount === 1 ? "change" : "changes"}`
      : "No changes";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] border border-sky-400/25 bg-sky-500/[0.06] px-4 py-3 text-[12.5px] text-sky-100/90">
        Admin override — changes save directly and skip the provider change-request queue.
        Every save is audited.
      </div>

      {/* IDENTITY */}
      <section className={PANEL}>
        <div className={PANEL_HEAD}>
          <h3 className="text-[14px] font-semibold text-white">Identity</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            The name and public URL people see on <span className="font-mono">/t/&lt;slug&gt;</span>.
          </p>
        </div>
        <div className={`${PANEL_BODY} flex flex-col gap-4`}>
          <ProviderNameRow
            userId={userId}
            currentName={approvedName || snapshot.business_name || ""}
            slug={approvedSlug}
          />
        </div>
      </section>

      {/* ABOUT */}
      <section className={PANEL}>
        <div className={PANEL_HEAD}>
          <h3 className="text-[14px] font-semibold text-white">About</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            A short tagline and a longer public description of the training organisation.
          </p>
        </div>
        <div className={`${PANEL_BODY} flex flex-col gap-4`}>
          <Field
            label="Tagline"
            hint={`One line — e.g. “Ofqual-regulated PT courses in Manchester.” (Max 160 chars.)`}
          >
            <Input
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              maxLength={160}
              placeholder="Short one-liner"
            />
          </Field>
          <Field
            label="Public description"
            hint="What they offer, who they train, what makes them different."
          >
            <Textarea
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
              maxLength={800}
              placeholder="Public description…"
              className="min-h-[128px]"
            />
            <div className="mt-1 text-right text-[11px] text-white/40">
              {form.about.length}/800
            </div>
          </Field>
        </div>
      </section>

      {/* CONTACT */}
      <section className={PANEL}>
        <div className={PANEL_HEAD}>
          <h3 className="text-[14px] font-semibold text-white">Contact</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            How prospective learners get in touch.
          </p>
        </div>
        <div className={`${PANEL_BODY} grid grid-cols-1 gap-4 md:grid-cols-2`}>
          <Field
            label="Website URL"
            hint={
              websiteLocked
                ? overrideDomain
                  ? "Override active — provider will see the new URL after save."
                  : "Domain-locked (verified). Tick Override to change."
                : "Must start with https://"
            }
          >
            <Input
              type="url"
              inputMode="url"
              value={form.website_url}
              onChange={(e) => update("website_url", e.target.value)}
              placeholder="https://yourprovider.com"
              maxLength={500}
              readOnly={websiteLocked && !overrideDomain}
              className={websiteLocked && !overrideDomain ? "cursor-not-allowed opacity-70" : ""}
            />
            {websiteLocked && (
              <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-white/70">
                <Checkbox
                  checked={overrideDomain}
                  onCheckedChange={(v) => setOverrideDomain(v === true)}
                />
                Override domain lock
              </label>
            )}
          </Field>
          <Field
            label="Contact email"
            hint={
              emailLocked
                ? overrideEmail
                  ? "Override active — email will change on save."
                  : "Domain-locked (verified). Tick Override to change."
                : "Public — shown on the provider page."
            }
          >
            <Input
              type="email"
              inputMode="email"
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              placeholder="hello@yourprovider.com"
              maxLength={254}
              readOnly={emailLocked && !overrideEmail}
              className={emailLocked && !overrideEmail ? "cursor-not-allowed opacity-70" : ""}
            />
            {emailLocked && (
              <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-white/70">
                <Checkbox
                  checked={overrideEmail}
                  onCheckedChange={(v) => setOverrideEmail(v === true)}
                />
                Override email lock
              </label>
            )}
          </Field>
          <div className="md:col-span-2">
            <Field label="Telephone" hint="International format — e.g. +44 7911 123456.">
              <PhoneField
                value={form.contact_phone}
                onChange={(v) => update("contact_phone", v)}
                invalid={!phoneValid}
              />
              {!phoneValid && (
                <p className="mt-2 text-[12px] text-rose-300">
                  That doesn't look like a valid phone number.
                </p>
              )}
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field
              label="Address"
              hint="Public — shown on the provider page. Start typing to pick from suggestions."
            >
              <AddressAutocomplete
                value={form.address}
                onChange={(v: string) => update("address", v.slice(0, 500))}
                placeholder="Start typing address…"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* SOCIAL */}
      <section className={PANEL}>
        <div className={PANEL_HEAD}>
          <h3 className="text-[14px] font-semibold text-white">Social links</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            Paste full URLs or @ handles — normalised on save.
          </p>
        </div>
        <div className={`${PANEL_BODY} grid grid-cols-1 gap-3 md:grid-cols-2`}>
          <SocialHandleInput
            value={form.social_instagram}
            onChange={(v) => update("social_instagram", v)}
            prefix="instagram.com/"
            icon={<Instagram className="h-3.5 w-3.5" />}
            ariaLabel="Instagram handle"
          />
          <SocialHandleInput
            value={form.social_tiktok}
            onChange={(v) => update("social_tiktok", v)}
            prefix="tiktok.com/@"
            icon={<TiktokIcon />}
            ariaLabel="TikTok handle"
          />
          <SocialHandleInput
            value={form.social_youtube}
            onChange={(v) => update("social_youtube", v)}
            prefix="youtube.com/@"
            icon={<Youtube className="h-3.5 w-3.5" />}
            ariaLabel="YouTube handle"
          />
          <SocialHandleInput
            value={form.social_linkedin}
            onChange={(v) => update("social_linkedin", v)}
            prefix="linkedin.com/company/"
            icon={<Linkedin className="h-3.5 w-3.5" />}
            ariaLabel="LinkedIn handle"
          />
          <SocialHandleInput
            value={form.social_x}
            onChange={(v) => update("social_x", v)}
            prefix="x.com/"
            icon={<XIcon />}
            ariaLabel="X (Twitter) handle"
          />
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          disabled={btnDisabled}
          onClick={() => saveMut.mutate()}
          className={`inline-flex h-10 items-center gap-2 rounded-[10px] px-5 text-[13px] font-semibold transition-colors ${
            btnDisabled
              ? "border border-reps-border bg-reps-panel-soft text-white/55"
              : "bg-reps-orange text-white hover:bg-reps-orange/90"
          }`}
        >
          {saveMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : dirty ? null : (
            <Check className="h-4 w-4" />
          )}
          {btnLabel}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Provider name rename dialog (admin override)                        */
/* ------------------------------------------------------------------ */

function ProviderNameRow({
  userId,
  currentName,
  slug,
}: {
  userId: string;
  currentName: string;
  slug: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5 text-[13px] text-white">
        <span className="truncate">
          {currentName || <span className="text-white/40">Unnamed provider</span>}
          {slug ? (
            <span className="ml-2 font-mono text-[12px] text-white/45">/t/{slug}</span>
          ) : null}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="h-8 shrink-0 rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
        >
          <Pencil data-icon="inline-start" /> Rename (override)
        </Button>
      </div>
      <p className="text-[11.5px] text-white/45">
        Renaming bypasses the provider name-change queue, regenerates the slug, and writes a
        legacy redirect from the old public URL.
      </p>
      {slug && (
        <a
          href={`/t/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Open public page
        </a>
      )}
      <RenameDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        currentName={currentName}
      />
    </div>
  );
}

function RenameDialog({
  open,
  onOpenChange,
  userId,
  currentName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  currentName: string;
}) {
  const rename = useServerFn(renameProvider);
  const qc = useQueryClient();
  const [name, setName] = React.useState(currentName);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(currentName);
      setReason("");
    }
  }, [open, currentName]);

  async function submit() {
    if (busy || !name.trim() || !reason.trim()) return;
    setBusy(true);
    try {
      const res = await rename({
        data: { user_id: userId, name: name.trim(), reason: reason.trim() },
      });
      const r = res as { new_slug?: string; old_slug?: string };
      toast.success(
        `Renamed. New slug: ${r.new_slug ?? "—"}${
          r.old_slug && r.old_slug !== r.new_slug ? " (redirect written)" : ""
        }`,
      );
      await qc.invalidateQueries({ queryKey: ["admin-member-360", userId] });
      await qc.invalidateQueries({ queryKey: ["admin-provider-profile-mirror", userId] });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message ?? "Rename failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-reps-border bg-reps-ink text-white">
        <DialogHeader>
          <DialogTitle>Rename provider</DialogTitle>
          <DialogDescription className="text-white/60">
            Bypasses the provider self-service name-request flow. A legacy redirect is
            written for the old public URL so links keep working.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>New provider name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason (required)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy || !name.trim() || !reason.trim()}
            className="bg-reps-orange text-white hover:bg-reps-orange-hover"
          >
            {busy ? "Renaming…" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Small local field wrapper                                            */
/* ------------------------------------------------------------------ */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-white/85">{label}</span>
      {children}
      {hint ? <span className="text-[11.5px] text-white/45">{hint}</span> : null}
    </label>
  );
}

