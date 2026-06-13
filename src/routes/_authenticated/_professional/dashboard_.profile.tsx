import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";


import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  Eye,
  MapPin,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyDashboardProfile,
  updateMyDashboardProfile,
  updateMyAvatar,
  
  type DashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";
import { PhoneField, isValidPhoneNumber } from "@/components/forms/PhoneField";
import { AiCopyAssist, type AiCopyFacts } from "@/components/forms/AiCopyAssist";
import { LanguagePicker } from "@/components/forms/LanguagePicker";
// SocialHandleInput is rendered via SocialLinksPicker now.
import { SocialLinksPicker } from "@/components/profile/SocialLinksPicker";
import { SaveStatusPill, type SaveStatus } from "@/components/profile/SaveStatusPill";
import { EarnedTitlePicker } from "@/components/profile/EarnedTitlePicker";
import { VerifiedBadge, tierFromCounts } from "@/components/verification/VerifiedBadge";
import { getTrustState } from "@/lib/verification/trust.functions";








import {
  getMyPrimaryLocation,
  saveMyPrimaryPostcode,
} from "@/lib/profile/location.functions";
import {
  validateAvatar,
  commitAvatar,
  regenerateAvatar,
} from "@/lib/profile/avatar-ai.functions";
import {
  PROFESSIONS,
  getProfessionLabel,
  type ProfessionSlug,
} from "@/lib/professions";
import {
  SPECIALISMS,
  MAX_SPECIALISMS,
  getSpecialismLabel,
  type SpecialismSlug,
} from "@/lib/specialisms";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DashboardDialog,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogFooter,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogNote,
  DashboardButton,
} from "@/components/dashboard/ui";
import { Sparkles, AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/profile")({
  head: () => ({
    meta: [
      { title: "Public profile — REPS Professional" },
      {
        name: "description",
        content:
          "Manage how your professional profile appears in the REPS directory — photo, bio, services, specialisms and qualifications.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    stripe_identity: typeof s.stripe_identity === "string" ? s.stripe_identity : undefined,
  }),
  pendingComponent: () => (
    <div className="flex h-screen items-center justify-center bg-reps-ink">
      <Skeleton className="h-10 w-40 rounded-[10px]" />
    </div>
  ),
  component: ProfileEditorPage,
});

/* ============================================================
   Form state hook
   ============================================================ */

type FormState = {
  full_name: string;
  headline: string;
  primary_profession: ProfessionSlug | "";
  specialisms: SpecialismSlug[];
  in_person_available: boolean;
  online_available: boolean;
  city: string;
  contact_phone: string;
  bio: string;
  languages: string[];
  social_instagram: string;
  social_linkedin: string;
  social_youtube: string;
  social_tiktok: string;
  social_x: string;
};

function toForm(p: DashboardProfile): FormState {
  return {
    full_name: p.full_name ?? "",
    headline: p.headline ?? "",
    primary_profession: p.primary_profession ?? "",
    specialisms: p.specialisms ?? [],
    in_person_available: p.in_person_available ?? true,
    online_available: p.online_available ?? true,
    city: p.city ?? "",
    contact_phone: p.contact_phone ?? "",
    bio: p.bio ?? "",
    languages: p.languages ?? [],
    social_instagram: p.social_instagram ?? "",
    social_linkedin: p.social_linkedin ?? "",
    social_youtube: p.social_youtube ?? "",
    social_tiktok: p.social_tiktok ?? "",
    social_x: p.social_x ?? "",
  };
}

function equal(a: FormState, b: FormState): boolean {
  return (
    a.full_name === b.full_name &&
    a.headline === b.headline &&
    a.primary_profession === b.primary_profession &&
    a.in_person_available === b.in_person_available &&
    a.online_available === b.online_available &&
    a.city === b.city &&
    a.contact_phone === b.contact_phone &&
    a.bio === b.bio &&
    a.social_instagram === b.social_instagram &&
    a.social_linkedin === b.social_linkedin &&
    a.social_youtube === b.social_youtube &&
    a.social_tiktok === b.social_tiktok &&
    a.social_x === b.social_x &&
    JSON.stringify(a.specialisms) === JSON.stringify(b.specialisms) &&
    JSON.stringify(a.languages) === JSON.stringify(b.languages)
  );
}

function completion(p: DashboardProfile): {
  pct: number;
  checklist: { label: string; done: boolean }[];
} {
  // Polish-only checklist. Verification (Identity / Insurance / Qualifications)
  // is tracked separately in the VerificationCard at the top of the page and
  // is the sole gate for the Verified badge — this meter never affects it.
  const checklist = [
    { label: "Basic information", done: !!(p.full_name && p.primary_profession && p.city) },
    { label: "About and bio", done: !!(p.bio && p.bio.length > 80) },
    { label: "Profile photo", done: !!p.avatar_url },
    { label: "Specialisms", done: (p.specialisms?.length ?? 0) >= 1 },
    { label: "Languages", done: (p.languages?.length ?? 0) >= 1 },
    { label: "Contact details", done: !!p.contact_phone },
    {
      label: "Social link",
      done: !!(
        p.social_instagram ||
        p.social_linkedin ||
        p.social_youtube ||
        p.social_tiktok ||
        p.social_x
      ),
    },
  ];
  const pct = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  return { pct, checklist };
}


/* ============================================================
   Primitives (kept visually identical to the locked mock-up)
   ============================================================ */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[16px] border border-reps-border bg-reps-panel p-5 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ title, subtitle, step }: { title: string; subtitle?: string; step?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[15px] font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[12px] text-white/55">{subtitle}</p> : null}
      </div>
      {step ? (
        <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/60">
          {step}
        </span>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
  error,
  warn,
  counter,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  warn?: string;
  counter?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-white/70">{label}</span>
        {counter ? (
          <span
            className={`text-[10.5px] font-medium tabular-nums ${
              error ? "text-red-300" : warn ? "text-amber-300" : "text-white/40"
            }`}
          >
            {counter}
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <span className="text-[11px] font-medium text-red-300">{error}</span>
      ) : warn ? (
        <span className="text-[11px] font-medium text-amber-300">{warn}</span>
      ) : hint ? (
        <span className="text-[11px] text-white/45">{hint}</span>
      ) : null}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  prefix,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: React.ReactNode;
  type?: "text" | "email" | "tel" | "url";
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white">
      {prefix ? <span className="text-white/45">{prefix}</span> : null}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/35 focus:outline-none"
      />
    </div>
  );
}

function TextArea({
  value,
  rows = 4,
  placeholder,
  onChange,
}: {
  value: string;
  rows?: number;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
    />
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft pl-3 pr-2 text-[12px] font-semibold text-reps-orange">
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-full text-reps-orange/70 hover:bg-reps-orange/10 hover:text-reps-orange"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = React.useState("");
  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.map((s) => s.toLowerCase()).includes(v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink p-2">
      {values.map((v, i) => (
        <Chip key={`${v}-${i}`} onRemove={() => onChange(values.filter((_, idx) => idx !== i))}>
          {v}
        </Chip>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 min-w-[140px] bg-transparent px-2 py-1 text-[12px] text-white placeholder:text-white/35 focus:outline-none"
      />
    </div>
  );
}

function DeliveryModePicker({
  inPerson,
  online,
  onChange,
}: {
  inPerson: boolean;
  online: boolean;
  onChange: (next: { inPerson: boolean; online: boolean }) => void;
}) {
  const value = React.useMemo(() => {
    const v: string[] = [];
    if (inPerson) v.push("in-person");
    if (online) v.push("online");
    return v;
  }, [inPerson, online]);

  const handleChange = (next: string[]) => {
    // Enforce min 1: ignore an attempt to clear the last active mode.
    if (next.length === 0) return;
    onChange({
      inPerson: next.includes("in-person"),
      online: next.includes("online"),
    });
  };

  const isHybrid = inPerson && online;

  return (
    <div
      role="group"
      aria-label="How you work with clients"
      className="inline-flex w-fit max-w-full flex-wrap items-center gap-2"
    >
      <ToggleGroup
        type="multiple"
        value={value}
        onValueChange={handleChange}
        className="w-fit justify-start gap-2"
      >
        <ToggleGroupItem
          value="in-person"
          aria-label="In person"
          className="h-9 w-auto shrink-0 rounded-full border border-reps-border bg-reps-ink px-4 text-[12px] font-semibold text-white/70 hover:bg-reps-ink hover:text-white data-[state=on]:border-reps-orange-border data-[state=on]:bg-reps-orange-soft data-[state=on]:text-reps-orange focus-visible:ring-2 focus-visible:ring-reps-orange/40 focus-visible:ring-offset-0"
        >
          In person
        </ToggleGroupItem>
        <ToggleGroupItem
          value="online"
          aria-label="Online"
          className="h-9 w-auto shrink-0 rounded-full border border-reps-border bg-reps-ink px-4 text-[12px] font-semibold text-white/70 hover:bg-reps-ink hover:text-white data-[state=on]:border-reps-orange-border data-[state=on]:bg-reps-orange-soft data-[state=on]:text-reps-orange focus-visible:ring-2 focus-visible:ring-reps-orange/40 focus-visible:ring-offset-0"
        >
          Online
        </ToggleGroupItem>
      </ToggleGroup>
      <span aria-live="polite" className="contents">
        {isHybrid ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            Hybrid
          </span>
        ) : null}
      </span>
    </div>
  );
}

function SpecialismPicker({
  values,
  onChange,
}: {
  values: SpecialismSlug[];
  onChange: (next: SpecialismSlug[]) => void;
}) {
  const atMax = values.length >= MAX_SPECIALISMS;
  const toggle = (slug: SpecialismSlug) => {
    if (values.includes(slug)) {
      onChange(values.filter((v) => v !== slug));
      return;
    }
    if (atMax) return;
    onChange([...values, slug]);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SPECIALISMS.map((s) => {
          const active = values.includes(s.slug);
          const disabled = !active && atMax;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggle(s.slug)}
              disabled={disabled}
              aria-pressed={active}
              className={
                "h-9 rounded-full border px-3.5 text-[12px] font-semibold transition-colors " +
                (active
                  ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                  : disabled
                    ? "border-reps-border bg-reps-ink text-white/30"
                    : "border-reps-border bg-reps-ink text-white/70 hover:text-white")
              }
            >
              {active ? <span className="mr-1.5">✓</span> : null}
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-white/45">
        {values.length} / {MAX_SPECIALISMS} selected
        {atMax ? " · max reached" : ""}
      </p>
    </div>
  );
}

/* ============================================================
   Upload helpers (client-side, RLS-scoped to user folder)
   ============================================================ */

function pickFile(accept: string, maxBytes: number): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    // Must be attached to the document for `change` to fire reliably across browsers
    // (Safari in particular, and some Chrome/Firefox cases where the first selection
    // silently does nothing on a detached input). Hide it offscreen.
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "-9999px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);

    let settled = false;
    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(file);
    };

    input.onchange = () => {
      const f = input.files?.[0] ?? null;
      if (f && f.size > maxBytes) {
        toast.error(`File too large — max ${Math.round(maxBytes / 1024 / 1024)}MB.`);
        finish(null);
        return;
      }
      finish(f);
    };
    // Native cancel event fires when the user dismisses the picker
    input.oncancel = () => finish(null);
    input.click();
  });
}

async function uploadFileToAvatars(path: string, file: Blob, contentType: string): Promise<void> {
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "31536000", upsert: true, contentType });
  if (error) throw error;
}

async function loadImageBitmap(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't read image."));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Crop a head-and-shoulders portrait around a normalized face box (0..1).
 * Mirrors the previous server crop math: 2.0× padding around the face,
 * face vertical centre at ~38% from the top, square output, max 1024×1024,
 * JPEG q88. Runs entirely in the browser — no server image decoding.
 */
async function cropPortraitToJpegBlob(
  file: File,
  faceBox: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const img = await loadImageBitmap(file);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const fx = faceBox.x * W;
  const fy = faceBox.y * H;
  const fw = faceBox.width * W;
  const fh = faceBox.height * H;
  const cx = fx + fw / 2;
  const cy = fy + fh / 2;
  let side = Math.max(fw, fh) * 2.0;
  side = Math.min(side, Math.min(W, H));
  let sx = cx - side / 2;
  let sy = cy - side * 0.38;
  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;
  if (sx + side > W) sx = W - side;
  if (sy + side > H) sy = H - side;

  const sideR = Math.round(side);
  const out = Math.min(1024, sideR);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, Math.round(sx), Math.round(sy), sideR, sideR, 0, 0, out, out);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Couldn't encode image."))),
      "image/jpeg",
      0.88,
    );
  });
}

/**
 * Strip raw HTML / JSON server error bodies down to a friendly message.
 * Server function failures sometimes surface as a full HTML error page
 * (e.g. h3 500 with `<!doctype html>...`) — never show that to a user.
 */
function humanizeAvatarError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;
  const trimmed = raw.trim();
  // Looks like HTML or a stringified server error envelope
  if (
    trimmed.startsWith("<") ||
    /<!doctype/i.test(trimmed) ||
    trimmed.includes("HTTPError") ||
    trimmed.includes("unhandled") ||
    /Server function info not found/i.test(trimmed) ||
    /Failed to fetch/i.test(trimmed)
  ) {
    return "Our image check hit a server problem — please try again in a moment.";
  }
  // Too long or contains markup — sanitize to first sentence
  const stripped = trimmed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length > 180) return fallback;
  return stripped || fallback;
}

import { initialsFromName } from "@/lib/initials";



/* ============================================================
   Verification status pill — links to /dashboard/verification
   ============================================================ */

function VerificationStatusPill() {
  const fetchTrust = useServerFn(getTrustState);
  const { data } = useQuery({
    queryKey: ["my-trust-state"],
    queryFn: () => fetchTrust(),
    staleTime: 30_000,
  });
  const ticks = data?.ticks;
  const tier = tierFromCounts({
    identity: !!ticks?.identity,
    insurance: !!ticks?.insurance,
    qualifications: !!ticks?.qualifications,
  });
  const completed = data?.completedCount ?? 0;
  const allDone = completed === 3;
  const profession = data?.qualifications.titles?.[0] ?? null;

  return (
    <Link
      to="/dashboard/verification"
      className="group flex items-center justify-between gap-4 rounded-[16px] border border-reps-border bg-reps-panel px-5 py-4 transition hover:border-reps-orange-border"
    >
      <div className="flex items-center gap-3">
        <VerifiedBadge tier={tier} size="md" profession={profession} />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white">
            {allDone ? "Your REPS credential is live" : `Verification · ${completed} of 3 complete`}
          </div>
          <div className="text-[12px] text-white/55">
            {allDone
              ? "Identity, insurance and qualifications all verified."
              : "Verification is managed on its own page — keep going to earn every layer."}
          </div>
        </div>
      </div>
      <span className="hidden text-[12px] font-semibold text-reps-orange transition-transform group-hover:translate-x-0.5 sm:inline-flex">
        {allDone ? "Manage" : "Continue"} →
      </span>
    </Link>
  );
}

/* ============================================================
   Page
   ============================================================ */



function ProfileEditorPage() {
  const tier = useTrainerTier();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const saveProfile = useServerFn(updateMyDashboardProfile);
  const saveAvatar = useServerFn(updateMyAvatar);
  const fetchLocation = useServerFn(getMyPrimaryLocation);
  const savePostcode = useServerFn(saveMyPrimaryPostcode);

  const profileQuery = useSuspenseQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });
  const profile = profileQuery.data;

  const locationQuery = useSuspenseQuery({
    queryKey: ["my-primary-location"],
    queryFn: () => fetchLocation(),
  });
  const primaryLocation = locationQuery.data;

  const [form, setForm] = React.useState<FormState>(() => toForm(profile));
  React.useEffect(() => {
    // When server data refreshes after a save, reset the form baseline.
    setForm(toForm(profile));
  }, [profile]);

  const initialPostcode = primaryLocation?.postcode ?? "";
  const [postcode, setPostcode] = React.useState<string>(initialPostcode);
  React.useEffect(() => {
    setPostcode(primaryLocation?.postcode ?? "");
  }, [primaryLocation?.postcode]);

  const original = React.useMemo(() => toForm(profile), [profile]);
  const profileDirty = !equal(form, original);
  const postcodeDirty = postcode.trim().toUpperCase() !== (initialPostcode ?? "").toUpperCase();
  const dirty = profileDirty || postcodeDirty;

  // Facts passed to the AI copy assistant — never sent to a public surface.
  const aiFacts = React.useMemo<AiCopyFacts>(
    () => ({
      full_name: form.full_name,
      primary_profession: form.primary_profession
        ? getProfessionLabel(form.primary_profession) || form.primary_profession
        : "",
      specialisms: form.specialisms
        .map((s) => getSpecialismLabel(s) ?? s)
        .filter(Boolean) as string[],
      city: primaryLocation?.town || form.city || "",
      in_person_available: form.in_person_available,
      online_available: form.online_available,
    }),
    [
      form.full_name,
      form.primary_profession,
      form.specialisms,
      form.city,
      form.in_person_available,
      form.online_available,
      primaryLocation?.town,
    ],
  );

  // Track whether the in-flight save was kicked off manually (toast)
  // vs by the debounced auto-save (silent — status pill only).
  const manualSaveRef = React.useRef(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save profile fields first (fast, in-DB).
      if (profileDirty) {
        await saveProfile({
          data: {
            full_name: form.full_name,
            headline: form.headline || null,
            primary_profession: form.primary_profession || null,
            specialisms: form.specialisms,
            in_person_available: form.in_person_available,
            online_available: form.online_available,
            city: form.city || null,
            contact_phone: form.contact_phone || null,
            bio: form.bio || null,
            languages: form.languages,
            social_instagram: form.social_instagram || null,
            social_linkedin: form.social_linkedin || null,
            social_youtube: form.social_youtube || null,
            social_tiktok: form.social_tiktok || null,
            social_x: form.social_x || null,
          },
        });
      }
      // Then resolve + save postcode (external API call).
      if (postcodeDirty && postcode.trim().length > 0) {
        await savePostcode({ data: { postcode } });
      }
    },
    onSuccess: () => {
      if (manualSaveRef.current) toast.success("Profile saved.");
      setLastSavedAt(Date.now());
      manualSaveRef.current = false;
      void queryClient.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["my-primary-location"] });
      void queryClient.invalidateQueries({ queryKey: ["account-profile"] });
    },
    onError: (e: unknown) => {
      if (manualSaveRef.current) {
        const msg = e instanceof Error ? e.message : "Save failed.";
        toast.error(msg);
      }
      manualSaveRef.current = false;
    },
  });

  const triggerManualSave = React.useCallback(() => {
    manualSaveRef.current = true;
    saveMutation.mutate();
  }, [saveMutation]);

  const userId = React.useMemo(() => {
    // We need the user id for the storage path. Pull from supabase auth synchronously via cache.
    return supabase.auth.getSession().then((r) => r.data.session?.user.id ?? null);
  }, []);

  // Bind server fns
  const runValidate = useServerFn(validateAvatar);
  
  const runCommit = useServerFn(commitAvatar);
  const runRegenerate = useServerFn(regenerateAvatar);

  // Avatar UI state
  const [avatarBusy, setAvatarBusy] = React.useState<null | "uploading" | "validating" | "cropping" | "generating">(null);
  const [rejection, setRejection] = React.useState<null | { reason: string; category: string }>(null);
  const [lastUploadedPath, setLastUploadedPath] = React.useState<string | null>(null);
  const [regenState, setRegenState] = React.useState<
    | { step: "confirm"; sourcePath: string; attempt: number }
    | { step: "preview"; sourcePath: string; originalUrl: string; aiPath: string; aiUrl: string; attempt: number; identityScore: number; identityReason: string }
    | null
  >(null);

  const invalidateProfile = () => {
    void queryClient.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
    void queryClient.invalidateQueries({ queryKey: ["account-profile"] });
  };

  const removeMutation = useMutation({
    mutationFn: async () => {
      const id = await userId;
      if (!id) throw new Error("Not signed in.");
      return saveAvatar({ data: { path: null } });
    },
    onSuccess: () => {
      toast.success("Profile photo removed.");
      setLastUploadedPath(null);
      invalidateProfile();
    },
    onError: (e: unknown) => toast.error(humanizeAvatarError(e, "Couldn't remove photo.")),
  });

  const handlePickAvatar = async () => {
    const id = await userId;
    if (!id) {
      toast.error("Not signed in.");
      return;
    }
    const f = await pickFile("image/png,image/jpeg", 4 * 1024 * 1024);
    if (!f) return;

    // Pre-checks
    if (f.type === "image/svg+xml" || /\.svg$/i.test(f.name)) {
      setRejection({ reason: "SVGs and vector graphics aren't accepted — please upload a real photo of yourself.", category: "logo" });
      return;
    }
    // Quick dimension check
    try {
      const img = await loadImageBitmap(f);
      if (img.naturalWidth < 512 || img.naturalHeight < 512) {
        setRejection({ reason: "This image is too small — please upload a photo at least 512 × 512 pixels.", category: "low_quality" });
        return;
      }
    } catch {
      toast.error("Couldn't read this image.");
      return;
    }

    let tempPath: string | null = null;
    try {
      // 1. Upload original to temp path
      setAvatarBusy("uploading");
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      tempPath = `${id}/pending-${Date.now()}.${ext}`;
      await uploadFileToAvatars(tempPath, f, f.type || "image/jpeg");

      // 2. Validate with AI — one retry on transient failure
      setAvatarBusy("validating");
      let result;
      try {
        result = await runValidate({ data: { path: tempPath } });
      } catch (firstErr) {
        await new Promise((r) => setTimeout(r, 600));
        try {
          result = await runValidate({ data: { path: tempPath } });
        } catch {
          throw firstErr;
        }
      }
      if (!result.ok) {
        // Server already deleted the temp file on reject
        tempPath = null;
        setAvatarBusy(null);
        setRejection({ reason: result.reason, category: result.category });
        return;
      }

      // 3. Client-side crop + resize using the AI face box
      setAvatarBusy("cropping");
      const croppedBlob = await cropPortraitToJpegBlob(f, result.faceBox);

      // 4. Upload cropped image to final path, then clean up temp.
      const finalPath = `${id}/avatar-${Date.now()}.jpg`;
      await uploadFileToAvatars(finalPath, croppedBlob, "image/jpeg");
      await supabase.storage.from("avatars").remove([tempPath]).catch(() => {});
      tempPath = null;

      // 5. Commit
      await runCommit({ data: { path: finalPath, isAiGenerated: false } });

      setLastUploadedPath(finalPath);
      setAvatarBusy(null);
      toast.success("Profile photo updated.");
      invalidateProfile();
    } catch (e) {
      setAvatarBusy(null);
      if (tempPath) {
        await supabase.storage.from("avatars").remove([tempPath]).catch(() => {});
      }
      toast.error(humanizeAvatarError(e, "Upload failed — please try again."));
    }
  };

  const handleRemoveAvatar = () => removeMutation.mutate();

  const handleStartRegenerate = async () => {
    const id = await userId;
    if (!id) return;
    // Use the just-uploaded path, or derive from current avatar_url if it points to user's folder.
    let sourcePath = lastUploadedPath;
    if (!sourcePath && profile.avatar_url) {
      // We can't reliably get a storage path from a signed URL; require a fresh upload.
      toast.error("Please upload a fresh photo first, then generate a professional version.");
      return;
    }
    if (!sourcePath) return;
    setRegenState({ step: "confirm", sourcePath, attempt: 0 });
  };

  const handleConfirmRegenerate = async () => {
    if (!regenState || regenState.step !== "confirm") return;
    const sourcePath = regenState.sourcePath;
    const attempt = regenState.attempt;
    try {
      setAvatarBusy("generating");
      const out = await runRegenerate({ data: { sourcePath, attempt } });
      const { data: orig } = await supabase.storage
        .from("avatars")
        .createSignedUrl(sourcePath, 60 * 10);
      setRegenState({
        step: "preview",
        sourcePath,
        originalUrl: orig?.signedUrl ?? "",
        aiPath: out.path,
        aiUrl: out.url,
        attempt,
        identityScore: out.identityScore,
        identityReason: out.identityReason,
      });
      setAvatarBusy(null);
    } catch (e) {
      setAvatarBusy(null);
      toast.error(humanizeAvatarError(e, "Couldn't generate AI portrait."));
    }
  };

  const handleUseAiVersion = async () => {
    if (!regenState || regenState.step !== "preview") return;
    try {
      await runCommit({ data: { path: regenState.aiPath, isAiGenerated: true } });
      setLastUploadedPath(regenState.aiPath);
      setRegenState(null);
      toast.success("AI portrait saved as your profile photo.");
      invalidateProfile();
    } catch (e) {
      toast.error(humanizeAvatarError(e, "Couldn't save AI portrait."));
    }
  };

  const avatarPending = avatarBusy !== null || removeMutation.isPending;


  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const { pct, checklist } = completion(profile);

  /* ----------------------------------------------------------------
     Inline validation — pure client-side, runs on every render.
     ---------------------------------------------------------------- */
  type FieldKey =
    | "full_name"
    | "headline"
    | "bio"
    | "contact_phone"
    | "postcode";
  const errors = React.useMemo<Partial<Record<FieldKey, string>>>(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    else if (form.full_name.trim().length > 80) e.full_name = "Keep your name under 80 characters.";
    if (form.headline.length > 160) e.headline = "Tagline must be 160 characters or fewer.";
    if (form.bio.length > 1200) e.bio = "About must be 1200 characters or fewer.";
    if (form.contact_phone.length > 0 && !isValidPhoneNumber(form.contact_phone))
      e.contact_phone = "Enter a valid phone number with country code.";
    const pc = postcode.trim();
    if (pc.length > 0 && pc.length > 10) e.postcode = "Postcode looks too long.";
    return e;
  }, [form.full_name, form.headline, form.bio, form.contact_phone, postcode]);

  const warns = React.useMemo<Partial<Record<FieldKey, string>>>(() => {
    const w: Partial<Record<FieldKey, string>> = {};
    if (form.headline.length >= 144 && form.headline.length <= 160)
      w.headline = "Approaching the 160-character limit.";
    if (form.bio.length >= 1080 && form.bio.length <= 1200)
      w.bio = "Approaching the 1,200-character limit.";
    return w;
  }, [form.headline, form.bio]);

  const hasErrors = Object.keys(errors).length > 0;

  /* ----------------------------------------------------------------
     Auto-save — 1.5s debounce after last edit. Silent (status pill).
     ---------------------------------------------------------------- */
  const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!dirty) return;
    if (hasErrors) return;
    if (avatarBusy !== null) return;
    if (saveMutation.isPending) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      manualSaveRef.current = false;
      saveMutation.mutate();
    }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, postcode, dirty, hasErrors, avatarBusy, saveMutation.isPending]);

  /* ----------------------------------------------------------------
     Tab-close guard — warn if dirty edits are unsaved.
     ---------------------------------------------------------------- */
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty || saveMutation.isPending) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, saveMutation.isPending]);

  /* ----------------------------------------------------------------
     Derived status pill state.
     ---------------------------------------------------------------- */
  const status: SaveStatus = React.useMemo(() => {
    if (saveMutation.isPending) return { kind: "saving" };
    if (saveMutation.isError) return { kind: "error", onRetry: triggerManualSave };
    if (dirty) return { kind: "editing" };
    if (lastSavedAt && Date.now() - lastSavedAt < 5 * 60_000)
      return { kind: "saved", at: lastSavedAt };
    return { kind: "idle" };
  }, [saveMutation.isPending, saveMutation.isError, dirty, lastSavedAt, triggerManualSave]);

  /* ----------------------------------------------------------------
     Manual save — scroll to first error if validation blocks save.
     ---------------------------------------------------------------- */
  const handleManualSave = () => {
    if (hasErrors) {
      const firstKey = Object.keys(errors)[0];
      if (firstKey) {
        const el = document.querySelector(`[data-field="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          (el.querySelector("input, textarea") as HTMLElement | null)?.focus();
        }
      }
      return;
    }
    triggerManualSave();
  };


  return (
    <DashboardShell
      role="trainer"
      active="Public Profile"
      tier={tier}
      title="Profile editor"
      subtitle="Manage how your professional profile appears in the REPS directory."
      actions={
        <>
          <DashboardButton variant="ghost" disabled={!profile.is_published} asChild>
            <a href="/find-a-professional" target="_blank" rel="noreferrer">
              <Eye className="h-3.5 w-3.5" />
              Preview public profile
            </a>
          </DashboardButton>
          <SaveStatusPill status={status} />
          <Button
            onClick={handleManualSave}
            disabled={(!dirty || saveMutation.isPending) && status.kind !== "error"}
          >
            <Save data-icon="inline-start" />
            {saveMutation.isPending ? "Saving…" : dirty ? "Save now" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <VerificationStatusPill />






        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            {/* Profile photo */}
            <Card>
              <SectionHeader
                title="Profile photo"
                subtitle="A clear headshot helps clients trust and recognise you."
                step="01"
              />
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="size-20 rounded-[8px] ring-2 ring-reps-border">
                      {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" className="rounded-[8px]" /> : null}
                      <AvatarFallback className="rounded-[8px] bg-reps-orange text-white">
                        {initialsFromName(form.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-reps-panel bg-reps-orange text-white">
                      <Camera className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePickAvatar}
                        disabled={avatarPending}
                        className="flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-60"
                      >
                        {avatarBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                        {avatarBusy === "uploading" && "Uploading…"}
                        {avatarBusy === "validating" && "Checking photo…"}
                        {avatarBusy === "cropping" && "Cropping…"}
                        {avatarBusy === "generating" && "Generating…"}
                        {!avatarBusy && "Change photo"}
                      </button>
                      <DashboardButton
                        type="button"
                        variant="ghost"
                        onClick={handleRemoveAvatar}
                        disabled={!profile.avatar_url || avatarPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </DashboardButton>
                      {lastUploadedPath ? (
                        <button
                          type="button"
                          onClick={handleStartRegenerate}
                          disabled={avatarPending}
                          className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none transition-colors hover:text-white disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-reps-orange" />
                          Generate AI portrait
                        </button>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-white/45">
                      Real headshot only · JPG or PNG · min 512 × 512 · max 4 MB · we check uploads with AI to keep the directory trustworthy
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 02 Identity — single column, no half-empty rail */}
            <Card>
              <SectionHeader
                title="Identity"
                subtitle="Your name and the title clients see first."
                step="02"
              />
              <div className="flex flex-col gap-4">
                <div data-field="full_name">
                  <Field label="Full name" error={errors.full_name}>
                    <TextInput value={form.full_name} onChange={(v) => set("full_name", v)} />
                  </Field>
                </div>
                <Field label="Profession">
                  <EarnedTitlePicker />
                </Field>
              </div>
            </Card>

            {/* 03 Where you work — location + work mode together */}
            <Card>
              <SectionHeader
                title="Where you work"
                subtitle="Your base and how clients can train with you."
                step="03"
              />
              <div className="flex flex-col gap-4">
                <div data-field="postcode">
                  <Field label="Primary training postcode" error={errors.postcode}>
                    <TextInput
                      value={postcode}
                      onChange={(v) => setPostcode(v.toUpperCase())}
                      prefix={<MapPin className="h-3.5 w-3.5" />}
                      placeholder="e.g. SW1A 1AA"
                    />
                    <p className="mt-1.5 text-[11px] text-white/50">
                      We use this to calculate distance and show your town. Your full postcode is never shown publicly.
                    </p>
                    {primaryLocation?.town ? (
                      <p className="mt-1 text-[11px] text-white/60">
                        Public location: <span className="text-white/80">{primaryLocation.town}{primaryLocation.region ? ` · ${primaryLocation.region}` : ""}</span> · <span className="text-white/80">{primaryLocation.postcode_outward}</span>
                      </p>
                    ) : null}
                  </Field>
                </div>
                <Field label="How you work with clients" hint="Pick at least one. Both selected = Hybrid.">
                  <DeliveryModePicker
                    inPerson={form.in_person_available}
                    online={form.online_available}
                    onChange={(next) => {
                      set("in_person_available", next.inPerson);
                      set("online_available", next.online);
                    }}
                  />
                </Field>
              </div>
            </Card>

            {/* 04 Your pitch — tagline + bio together (both marketing copy) */}
            <Card>
              <SectionHeader
                title="Your pitch"
                subtitle="What clients read on your directory card and profile."
                step="04"
              />
              <div className="flex flex-col gap-5">
                <div data-field="headline">
                  <Field
                    label="Tagline"
                    hint="One line that appears under your name on the directory card."
                    counter={`${form.headline.length} / 160`}
                    error={errors.headline}
                    warn={warns.headline}
                  >
                    <TextInput
                      value={form.headline}
                      onChange={(v) => set("headline", v.slice(0, 160))}
                      placeholder="e.g. Helping busy professionals build strength and feel their best"
                    />
                    <div className="mt-2 flex justify-end">
                      <AiCopyAssist
                        field="tagline"
                        value={form.headline}
                        facts={aiFacts}
                        onApply={(v) => set("headline", v.slice(0, 160))}
                      />
                    </div>
                  </Field>
                </div>
                <div data-field="bio">
                  <Field
                    label="About"
                    hint="Lead with credibility — credentials, results, and who you help."
                    counter={`${form.bio.length} / 1,200`}
                    error={errors.bio}
                    warn={warns.bio}
                  >
                    <TextArea
                      rows={8}
                      value={form.bio}
                      onChange={(v) => set("bio", v.slice(0, 1200))}
                      placeholder="Tell clients about your experience, approach and who you help."
                    />
                    <div className="mt-2 flex justify-end">
                      <AiCopyAssist
                        field="bio"
                        value={form.bio}
                        facts={aiFacts}
                        onApply={(v) => set("bio", v.slice(0, 1200))}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </Card>

            {/* 05 Specialisms */}
            <Card>
              <SectionHeader
                title="Specialisms"
                subtitle={`What clients should hire you for — pick up to ${MAX_SPECIALISMS}.`}
                step="05"
              />
              <SpecialismPicker
                values={form.specialisms}
                onChange={(v) => set("specialisms", v)}
              />
            </Card>

            {/* 06 Languages & socials — public extras */}
            <Card>
              <SectionHeader
                title="Languages & socials"
                subtitle="Extras that help the right clients find you."
                step="06"
              />
              <div className="flex flex-col gap-5">
                <Field label="Languages spoken" hint="Pick up to 4 — clients filter by language.">
                  <LanguagePicker
                    values={form.languages}
                    onChange={(v) => set("languages", v)}
                  />
                </Field>
                <Field label="Social links" hint="Add the platforms you use. Paste a full URL or @ handle — we clean it up automatically.">
                  <SocialLinksPicker
                    values={{
                      social_instagram: form.social_instagram,
                      social_tiktok: form.social_tiktok,
                      social_x: form.social_x,
                      social_youtube: form.social_youtube,
                      social_linkedin: form.social_linkedin,
                    }}
                    onChange={(field, value) => set(field, value)}
                  />
                </Field>
              </div>
            </Card>

            {/* 07 Private contact — admin-only, visually demoted */}
            <section className="rounded-[16px] border border-dashed border-reps-border bg-reps-panel/40 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-[14px] font-semibold text-white/85">Private contact</h2>
                  <p className="mt-0.5 text-[11.5px] text-white/45">
                    Only used by REPs for account recovery and booking alerts. Never shown on your public profile.
                  </p>
                </div>
                <span className="rounded-full bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-semibold text-white/55">
                  07
                </span>
              </div>
              <div data-field="contact_phone">
                <Field label="Contact phone" error={errors.contact_phone}>
                  <PhoneField
                    value={form.contact_phone}
                    onChange={(v) => set("contact_phone", v)}
                    invalid={!!errors.contact_phone}
                  />
                </Field>
              </div>
            </section>

          </div>



          <aside className="flex flex-col gap-4 xl:col-span-4">
            {/* Preview */}
            <Card className="p-0">
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 className="font-display text-[15px] font-semibold text-white">
                  Public profile preview
                </h2>
                <span className="rounded-full bg-reps-panel-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                  Live
                </span>
              </div>
              <p className="px-5 pt-1 text-[12px] text-white/55">
                How your profile appears in the REPS directory.
              </p>
              <div className="p-5">
                <div className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-ink">
                  <div className="relative h-[88px] bg-gradient-to-br from-reps-orange/30 via-reps-panel to-reps-ink">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,122,0,0.35),transparent_55%)]" />
                  </div>
                  <div className="-mt-8 px-4 pb-4">
                    <div className="flex items-end justify-between">
                      <Avatar className="size-16 rounded-[8px] ring-4 ring-reps-panel">
                        {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" className="rounded-[8px]" /> : null}
                        <AvatarFallback className="rounded-[8px] bg-reps-orange text-white">
                          {initialsFromName(form.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      {profile.verification_status === "verified" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold text-reps-orange">
                          <ShieldCheck className="h-3 w-3" />
                          REPS Verified
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <div className="text-[14px] font-semibold text-white">
                        {form.full_name || "Your name"}
                      </div>
                      <div className="text-[12px] text-white/60">
                        {getProfessionLabel(form.primary_profession) || "Set your profession"}
                      </div>
                      {form.specialisms.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {form.specialisms.map((s) => {
                            const label = getSpecialismLabel(s);
                            return label ? (
                              <span
                                key={s}
                                className="rounded-full bg-reps-panel-soft px-2 py-0.5 text-[10px] font-medium text-white/70"
                              >
                                {label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      ) : null}
                      <div className="mt-1 text-[10.5px] text-white/45">
                        {[
                          form.in_person_available ? "In person" : null,
                          form.online_available ? "Online" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Pick how you work with clients"}
                      </div>
                      {form.headline ? (
                        <p className="mt-2 text-[11.5px] leading-relaxed text-white/55">
                          {form.headline}
                        </p>
                      ) : null}
                      {form.city ? (
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-white/55">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {form.city}
                          </span>
                          <span className="flex items-center gap-1 text-reps-orange">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="font-semibold">New</span>
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {form.bio ? (
                      <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-white/65">
                        {form.bio}
                      </p>
                    ) : null}
                    <DashboardButton asChild variant="ghost" className="mt-4 w-full">
                      <Link to="/find-a-professional">
                        View full profile <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </DashboardButton>
                  </div>
                </div>
              </div>
            </Card>

            {/* Completion */}
            <Card>
              <SectionHeader
                title="Profile polish"
                subtitle="Optional — make your profile irresistible to clients. Doesn't affect your Verified badge."
              />
              <CompletionRing pct={pct} />
              <ul className="mt-4 space-y-2">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-[12px] text-white/75">
                    {c.done ? (
                      <CheckCircle2 className="h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-reps-border" />
                    )}
                    <span className={c.done ? "" : "text-white/45"}>{c.label}</span>
                    {!c.done ? (
                      <span className="ml-auto text-[11px] font-semibold text-reps-orange">Incomplete</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Verification trust block lives at the top of the page now. */}
          </aside>
        </div>
      </div>

      {/* Rejection dialog */}
      <DashboardDialog open={rejection !== null} onOpenChange={(o: boolean) => !o && setRejection(null)}>
        <DashboardDialogContent className="sm:max-w-[420px]">
          <DashboardDialogHeader>
            <DashboardDialogTitle>
              <AlertTriangle className="h-4 w-4 text-reps-orange" />
              That photo can't be used
            </DashboardDialogTitle>
            <DashboardDialogDescription>
              {rejection?.reason}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogNote>
            <p className="mb-1 text-[12px] font-semibold text-white">What we need</p>
            <ul className="list-disc space-y-0.5 pl-4 text-white/70">
              <li>A clear photograph of you (not a logo, illustration or graphic)</li>
              <li>Just you — no group photos</li>
              <li>Head-and-shoulders, face clearly visible</li>
              <li>Good lighting, in focus</li>
            </ul>
          </DashboardDialogNote>
          <DashboardDialogFooter>
            <DashboardButton variant="ghost" onClick={() => setRejection(null)}>
              Close
            </DashboardButton>
            <DashboardButton
              variant="primary"
              onClick={() => {
                setRejection(null);
                void handlePickAvatar();
              }}
            >
              Try a different photo
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </DashboardDialog>

      {/* Regenerate confirm + preview */}
      <DashboardDialog
        open={regenState !== null}
        onOpenChange={(o: boolean) => {
          if (!o && avatarBusy !== "generating") setRegenState(null);
        }}
      >
        <DashboardDialogContent className="sm:max-w-[520px]">
          {regenState?.step === "confirm" ? (
            <>
              <DashboardDialogHeader>
                <DashboardDialogTitle>
                  <Sparkles className="h-4 w-4 text-reps-orange" />
                  Generate a professional AI portrait?
                </DashboardDialogTitle>
                <DashboardDialogDescription>
                  We'll create a studio-style portrait based on your photo. It will look like you, but it is an AI-generated image — not a real photograph. Your original photo stays available.
                </DashboardDialogDescription>
              </DashboardDialogHeader>
              <DashboardDialogNote>
                Most pros prefer their real photo. Use AI only if you don't have a good headshot yet.
              </DashboardDialogNote>
              <DashboardDialogFooter>
                <DashboardButton variant="ghost" onClick={() => setRegenState(null)} disabled={avatarBusy === "generating"}>
                  Cancel
                </DashboardButton>
                <DashboardButton variant="primary" onClick={handleConfirmRegenerate} disabled={avatarBusy === "generating"}>
                  {avatarBusy === "generating" ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      Generate
                    </>
                  )}
                </DashboardButton>
              </DashboardDialogFooter>
            </>
          ) : regenState?.step === "preview" ? (
            <>
              <DashboardDialogHeader>
                <DashboardDialogTitle>Choose your photo</DashboardDialogTitle>
                <DashboardDialogDescription>
                  Editorial studio re-render of your photo. Same person, shot properly.
                </DashboardDialogDescription>
              </DashboardDialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] uppercase tracking-wide text-white/55">Original</div>
                  <div className="aspect-square overflow-hidden rounded-[14px] border border-reps-border bg-reps-panel-soft">
                    {regenState.originalUrl ? (
                      <img src={regenState.originalUrl} alt="Original" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-reps-orange">
                    <Sparkles className="h-3 w-3" /> AI portrait
                  </div>
                  <div className="aspect-square overflow-hidden rounded-[14px] border border-reps-orange/40 bg-reps-panel-soft">
                    <img src={regenState.aiUrl} alt="AI portrait" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
              {regenState.identityScore >= 4 ? (
                <div className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
                  Likeness verified
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  Likeness may have drifted — try again or keep your original
                </div>
              )}
              <DashboardDialogFooter className="flex-wrap gap-2">
                <DashboardButton variant="ghost" onClick={() => setRegenState(null)}>
                  Keep original
                </DashboardButton>
                <DashboardButton
                  variant="ghost"
                  onClick={() => setRegenState({ step: "confirm", sourcePath: regenState.sourcePath, attempt: regenState.attempt + 1 })}
                >
                  Try again
                </DashboardButton>
                <DashboardButton variant="primary" onClick={handleUseAiVersion}>
                  Use AI version
                </DashboardButton>
              </DashboardDialogFooter>
            </>
          ) : null}
        </DashboardDialogContent>
      </DashboardDialog>
    </DashboardShell>
  );
}

function CompletionRing({ pct }: { pct: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[72px] w-[72px]">
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--reps-border)" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="var(--reps-orange)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-white">
          {pct}%
        </div>
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-white">
          {pct === 100 ? "Polished" : pct >= 70 ? "Almost there" : "Keep going"}
        </div>
        <p className="text-[11px] text-white/55">
          Cosmetic — helps you convert. Verification (above) is what unlocks your badge.
        </p>
      </div>
    </div>
  );
}
