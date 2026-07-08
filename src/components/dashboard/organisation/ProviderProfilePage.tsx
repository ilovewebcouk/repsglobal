/**
 * /dashboard/profile — training-provider profile editor.
 *
 * Consolidates the provider's public identity, contact, company details and
 * social links. Uses existing image-upload helpers from
 * dashboard-profile.functions (avatar / logo) and hero.functions (hero image).
 */
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Camera,
  Clock,
  ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  Youtube,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { PhoneField, isValidPhoneNumber } from "@/components/forms/PhoneField";
import { SocialHandleInput } from "@/components/forms/SocialHandleInput";
import {
  getMyProviderProfile,
  updateMyProviderProfile,
} from "@/lib/profile/provider-profile.functions";
import {
  getMyProviderNameStatus,
  submitProviderNameChange,
} from "@/lib/verification/provider-name.functions";
import { getProviderDomainVerification } from "@/lib/verification/provider-domain.functions";
import {
  updateMyAvatar,
  uploadAvatarFromBase64,
} from "@/lib/profile/dashboard-profile.functions";
import {
  updateMyWebsiteHero,
  uploadHeroFromBase64,
} from "@/lib/website/hero.functions";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read file"));
    r.readAsDataURL(file);
  });
}

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

const CURRENT_YEAR = new Date().getFullYear();

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
  const submitName = useServerFn(submitProviderNameChange);

  const uploadAvatar = useServerFn(uploadAvatarFromBase64);
  const setAvatar = useServerFn(updateMyAvatar);
  const uploadHero = useServerFn(uploadHeroFromBase64);
  const setHero = useServerFn(updateMyWebsiteHero);

  const { data, isLoading } = useQuery({
    queryKey: ["my-provider-profile"],
    queryFn: () => fetchProfile(),
  });

  const { data: nameStatus } = useQuery({
    queryKey: ["my-provider-name-status"],
    queryFn: () => fetchNameStatus(),
  });

  const fetchDomainStatus = useServerFn(getProviderDomainVerification);
  const { data: domainStatus } = useQuery({
    queryKey: ["my-provider-domain-status"],
    queryFn: () => fetchDomainStatus(),
  });

  const namePending = !!nameStatus?.pending;
  const approvedName = nameStatus?.approved_name ?? "";

  const websiteLocked = domainStatus?.status === "approved";
  const approvedWebsite = domainStatus?.rawWebsite ?? "";



  const [form, setForm] = React.useState({
    name: "",
    tagline: "",
    about: "",
    website_url: "",
    contact_email: "",
    contact_phone: "",
    year_established: "" as string,
    company_number: "",
    social_instagram: "",
    social_linkedin: "",
    social_youtube: "",
    social_tiktok: "",
    social_x: "",
  });

  React.useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      tagline: data.tagline ?? "",
      about: data.about ?? "",
      website_url: data.website_url ?? "",
      contact_email: data.contact_email ?? "",
      contact_phone: data.contact_phone ?? "",
      year_established:
        data.year_established != null ? String(data.year_established) : "",
      company_number: data.company_number ?? "",
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
      const yearNum = form.year_established.trim()
        ? Number(form.year_established)
        : null;
      if (yearNum != null && (Number.isNaN(yearNum) || yearNum < 1800 || yearNum > CURRENT_YEAR)) {
        throw new Error(`Year established must be between 1800 and ${CURRENT_YEAR}.`);
      }

      // Submit name change for admin approval when it differs from the
      // currently approved name (and isn't already pending).
      let nameSubmitted = false;
      const requestedName = form.name.trim();
      if (!namePending && requestedName && requestedName !== approvedName.trim()) {
        const res = await submitName({ data: { requested_name: requestedName } });
        if ((res as { submitted?: boolean }).submitted) nameSubmitted = true;
      }

      await saveProfile({
        data: {
          tagline: form.tagline || null,
          about: form.about || null,
          website_url: (websiteLocked ? approvedWebsite : form.website_url) || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          year_established: yearNum,
          company_number: form.company_number || null,
          social_instagram: form.social_instagram || null,
          social_linkedin: form.social_linkedin || null,
          social_youtube: form.social_youtube || null,
          social_tiktok: form.social_tiktok || null,
          social_x: form.social_x || null,
        },
      });

      return { nameSubmitted };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-provider-profile"] });
      qc.invalidateQueries({ queryKey: ["my-provider-name-status"] });
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      qc.invalidateQueries({ queryKey: ["website-public"] });
      if (res?.nameSubmitted) {
        toast.success("Profile saved. Name change submitted for admin approval.");
      } else {
        toast.success("Profile saved.");
      }
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save profile"),
  });


  /* -------------------- image uploads -------------------- */

  const [logoBusy, setLogoBusy] = React.useState(false);
  const [heroBusy, setHeroBusy] = React.useState(false);

  const onPickLogo = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5 MB.");
      return;
    }
    setLogoBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { path } = await uploadAvatar({ data: { dataUrl } });
      await setAvatar({ data: { path } });
      qc.invalidateQueries({ queryKey: ["my-provider-profile"] });
      qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      toast.success("Logo updated.");
    } catch (e) {
      toast.error((e as Error).message || "Logo upload failed");
    } finally {
      setLogoBusy(false);
    }
  };

  const onPickHero = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Hero image must be under 8 MB.");
      return;
    }
    setHeroBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await uploadHero({ data: { dataUrl } });
      await setHero({ data: { url } });
      qc.invalidateQueries({ queryKey: ["my-provider-profile"] });
      qc.invalidateQueries({ queryKey: ["website-public"] });
      toast.success("Hero image updated.");
    } catch (e) {
      toast.error((e as Error).message || "Hero upload failed");
    } finally {
      setHeroBusy(false);
    }
  };

  /* -------------------- render -------------------- */

  return (
    <DashboardShell
      role="trainer"
      tier="training_provider"
      active="Profile"
      title="Provider profile"
      subtitle="Public identity, contact details and social links for your REPS listing."
      actions={
        <button
          type="button"
          disabled={saveMut.isPending || isLoading}
          onClick={() => saveMut.mutate()}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange/90 disabled:opacity-50"
        >
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* IDENTITY */}
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h3 className="text-[14px] font-semibold text-white">Identity</h3>
            <p className="mt-0.5 text-[12px] text-white/55">
              The name, logo and hero image people see on your public page.
            </p>
          </div>
          <div className="flex flex-col gap-5 px-5 py-4">
            <Field
              label="Provider name"
              hint={
                namePending
                  ? "Name changes are locked until your submission is reviewed by an admin."
                  : approvedName
                    ? "Changes to your name require admin approval before going live."
                    : "This will be shown in headings, cards and search results — subject to admin approval."
              }
            >
              <div className="flex flex-col gap-2">
                <input
                  className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
                  value={namePending ? (nameStatus?.pending?.requested_name ?? "") : form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Northline Academy"
                  maxLength={120}
                  disabled={namePending}
                />
                {namePending ? (
                  <div className="flex items-start gap-2 rounded-[10px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Awaiting admin approval —{" "}
                      <span className="font-semibold">
                        &ldquo;{nameStatus?.pending?.requested_name}&rdquo;
                      </span>
                      . Your public page still shows{" "}
                      <span className="font-semibold">
                        {approvedName ? `"${approvedName}"` : "no name yet"}
                      </span>{" "}
                      until this is reviewed.
                    </span>
                  </div>
                ) : null}
              </div>
            </Field>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Logo" hint="Square works best. Max 5 MB.">
                <div className="flex items-center gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-reps-border bg-reps-panel-soft">
                    {data?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.logo_url}
                        alt="Provider logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-white/40" />
                    )}
                  </div>
                  <FilePickerButton
                    accept="image/png,image/jpeg,image/webp"
                    onPick={onPickLogo}
                    busy={logoBusy}
                    icon={<Camera className="h-4 w-4" />}
                    label={data?.logo_url ? "Replace logo" : "Upload logo"}
                  />
                </div>
              </Field>

              <Field label="Hero image" hint="Wide banner shown on your public page. Max 8 MB.">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-reps-border bg-reps-panel-soft">
                    {data?.hero_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.hero_image_url}
                        alt="Hero image"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-white/40" />
                    )}
                  </div>
                  <FilePickerButton
                    accept="image/png,image/jpeg,image/webp"
                    onPick={onPickHero}
                    busy={heroBusy}
                    icon={<ImageIcon className="h-4 w-4" />}
                    label={data?.hero_image_url ? "Replace hero" : "Upload hero"}
                  />
                </div>
              </Field>
            </div>
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
            <Field label="Tagline" hint="One line — e.g. “Ofqual-regulated PT courses in Manchester.” (Max 160 chars.)">
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
              How prospective learners get in touch. All optional — but the more you show, the more trust.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
            <Field
              label="Website URL"
              hint={
                websiteLocked
                  ? "Locked — matches the domain approved during verification. Contact support to change it."
                  : "Must start with https://"
              }
            >
              <input
                className={`${inputCls} ${websiteLocked ? "cursor-not-allowed opacity-70" : ""}`}
                type="url"
                inputMode="url"
                value={websiteLocked ? approvedWebsite : form.website_url}
                onChange={(e) => update("website_url", e.target.value)}
                placeholder="https://yourprovider.com"
                maxLength={500}
                readOnly={websiteLocked}
                aria-readonly={websiteLocked}
              />
            </Field>
            <Field label="Contact email" hint="Public — shown on your provider page.">
              <input
                className={inputCls}
                type="email"
                inputMode="email"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                placeholder="hello@yourprovider.com"
                maxLength={254}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Telephone" hint="International format — e.g. +44 7911 123456.">
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
            </div>
          </div>
        </PPanel>

        {/* COMPANY */}
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h3 className="text-[14px] font-semibold text-white">Company</h3>
            <p className="mt-0.5 text-[12px] text-white/55">
              Optional details that add credibility to your listing.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
            <Field label="Year established">
              <input
                className={inputCls}
                type="number"
                inputMode="numeric"
                min={1800}
                max={CURRENT_YEAR}
                value={form.year_established}
                onChange={(e) => update("year_established", e.target.value)}
                placeholder="e.g. 2012"
              />
            </Field>
            <Field label="Company number" hint="Companies House / registrar number, if applicable.">
              <input
                className={inputCls}
                value={form.company_number}
                onChange={(e) => update("company_number", e.target.value)}
                placeholder="e.g. 08123456"
                maxLength={40}
              />
            </Field>
          </div>
        </PPanel>

        {/* SOCIAL */}
        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h3 className="text-[14px] font-semibold text-white">Social links</h3>
            <p className="mt-0.5 text-[12px] text-white/55">
              Paste full URLs or @ handles — we clean them up automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-2">
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
        </PPanel>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={saveMut.isPending || isLoading}
            onClick={() => saveMut.mutate()}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange/90 disabled:opacity-50"
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Small local primitives                                                      */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
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

function FilePickerButton({
  accept,
  onPick,
  busy,
  icon,
  label,
}: {
  accept: string;
  onPick: (f: File) => void;
  busy: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/5 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}
