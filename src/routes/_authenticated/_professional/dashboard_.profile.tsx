import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  Eye,
  Globe,
  
  Instagram,
  Linkedin,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  X,
  Youtube,
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
import {
  validateAvatar,
  commitAvatar,
  regenerateAvatar,
} from "@/lib/profile/avatar-ai.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  trading_name: string;
  city: string;
  public_phone: string;
  public_email: string;
  website: string;
  bio: string;
  specialisms: string[];
  languages: string[];
  social_instagram: string;
  social_linkedin: string;
  social_youtube: string;
};

function toForm(p: DashboardProfile): FormState {
  return {
    full_name: p.full_name ?? "",
    headline: p.headline ?? "",
    trading_name: p.trading_name ?? "",
    city: p.city ?? "",
    public_phone: p.public_phone ?? "",
    public_email: p.public_email ?? "",
    website: p.website ?? "",
    bio: p.bio ?? "",
    specialisms: p.specialisms ?? [],
    languages: p.languages ?? [],
    social_instagram: p.social_instagram ?? "",
    social_linkedin: p.social_linkedin ?? "",
    social_youtube: p.social_youtube ?? "",
  };
}

function equal(a: FormState, b: FormState): boolean {
  return (
    a.full_name === b.full_name &&
    a.headline === b.headline &&
    a.trading_name === b.trading_name &&
    a.city === b.city &&
    a.public_phone === b.public_phone &&
    a.public_email === b.public_email &&
    a.website === b.website &&
    a.bio === b.bio &&
    a.social_instagram === b.social_instagram &&
    a.social_linkedin === b.social_linkedin &&
    a.social_youtube === b.social_youtube &&
    JSON.stringify(a.specialisms) === JSON.stringify(b.specialisms) &&
    JSON.stringify(a.languages) === JSON.stringify(b.languages)
  );
}

function completion(p: DashboardProfile): {
  pct: number;
  checklist: { label: string; done: boolean }[];
} {
  const checklist = [
    { label: "Basic information", done: !!(p.full_name && p.headline && p.city) },
    { label: "About and bio", done: !!(p.bio && p.bio.length > 80) },
    { label: "Profile photo", done: !!p.avatar_url },
    
    { label: "Specialisms", done: (p.specialisms?.length ?? 0) >= 1 },
    { label: "Languages", done: (p.languages?.length ?? 0) >= 1 },
    { label: "Contact details", done: !!(p.public_email || p.public_phone) },
    { label: "Website or social link", done: !!(p.website || p.social_instagram || p.social_linkedin || p.social_youtube) },
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

function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[12px] font-medium text-white/70">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-white/45">{hint}</span> : null}
    </label>
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

/* ============================================================
   Upload helpers (client-side, RLS-scoped to user folder)
   ============================================================ */

function pickFile(accept: string, maxBytes: number): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0] ?? null;
      if (f && f.size > maxBytes) {
        toast.error(`File too large — max ${Math.round(maxBytes / 1024 / 1024)}MB.`);
        resolve(null);
        return;
      }
      resolve(f);
    };
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
    // Revoke after load
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

async function cropToSquareJpeg(
  file: File,
  faceBox: { x: number; y: number; width: number; height: number },
  maxSize = 1024,
): Promise<Blob> {
  const img = await loadImageBitmap(file);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  // face box in px
  const fx = faceBox.x * W;
  const fy = faceBox.y * H;
  const fw = faceBox.width * W;
  const fh = faceBox.height * H;
  const cx = fx + fw / 2;
  const cy = fy + fh / 2;
  // Square side: pad face by ~60% (so the face fills ~62% of the crop).
  const pad = 1.6;
  let side = Math.max(fw, fh) * pad;
  // Clamp side so the square stays inside the image when possible.
  side = Math.min(side, Math.min(W, H));
  let sx = cx - side / 2;
  let sy = cy - side / 2;
  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;
  if (sx + side > W) sx = W - side;
  if (sy + side > H) sy = H - side;

  const out = Math.min(maxSize, Math.round(side));
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available.");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Couldn't encode image."))),
      "image/jpeg",
      0.88,
    );
  });
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
  

  const profileQuery = useSuspenseQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });
  const profile = profileQuery.data;

  const [form, setForm] = React.useState<FormState>(() => toForm(profile));
  React.useEffect(() => {
    // When server data refreshes after a save, reset the form baseline.
    setForm(toForm(profile));
  }, [profile]);

  const original = React.useMemo(() => toForm(profile), [profile]);
  const dirty = !equal(form, original);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveProfile({
        data: {
          full_name: form.full_name,
          headline: form.headline || null,
          trading_name: form.trading_name || null,
          city: form.city || null,
          public_phone: form.public_phone || null,
          public_email: form.public_email || null,
          website: form.website || null,
          bio: form.bio || null,
          specialisms: form.specialisms,
          languages: form.languages,
          social_instagram: form.social_instagram || null,
          social_linkedin: form.social_linkedin || null,
          social_youtube: form.social_youtube || null,
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved.");
      void queryClient.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["account-profile"] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Save failed.";
      toast.error(msg);
    },
  });

  const userId = React.useMemo(() => {
    // We need the user id for the storage path. Pull from supabase auth synchronously via cache.
    return supabase.auth.getSession().then((r) => r.data.session?.user.id ?? null);
  }, []);

  const avatarMutation = useMutation({
    mutationFn: async (file: File | null) => {
      const id = await userId;
      if (!id) throw new Error("Not signed in.");
      const path = file ? await uploadToAvatars(id, "avatar", file) : null;
      return saveAvatar({ data: { path } });
    },
    onSuccess: () => {
      toast.success("Profile photo updated.");
      void queryClient.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["account-profile"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    },
  });


  const handlePickAvatar = async () => {
    const f = await pickFile("image/png,image/jpeg", 4 * 1024 * 1024);
    if (!f) return;
    avatarMutation.mutate(f);
  };
  const handleRemoveAvatar = () => avatarMutation.mutate(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const { pct, checklist } = completion(profile);

  return (
    <DashboardShell
      role="trainer"
      active="Public Profile"
      tier={tier}
      title="Profile editor"
      subtitle="Manage how your professional profile appears in the REPS directory."
      actions={
        <>
          <Button variant="outline" disabled={!profile.is_published} asChild>
            <a href="/find-a-professional" target="_blank" rel="noreferrer">
              <Eye data-icon="inline-start" />
              Preview public profile
            </a>
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isPending}
          >
            <Save data-icon="inline-start" />
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Status bar */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-[22px] border border-reps-border bg-reps-panel px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-reps-orange-soft text-reps-orange">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-white">Public profile</div>
              <div className="text-[12px] text-white/55">
                {profile.is_published ? "Visible in REPS directory" : "Draft — not visible yet"}
              </div>
            </div>
          </div>
        </div>

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
                    <Avatar className="size-20 ring-2 ring-reps-border">
                      {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                      <AvatarFallback className="bg-reps-orange text-white">
                        {(form.full_name || "?").slice(0, 2).toUpperCase()}
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
                        disabled={avatarMutation.isPending}
                        className="flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-60"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {avatarMutation.isPending ? "Uploading…" : "Change photo"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={!profile.avatar_url || avatarMutation.isPending}
                        className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/70 shadow-none transition-colors hover:text-white disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                    <p className="text-[11px] text-white/45">
                      Square image, at least 512 × 512 · JPG or PNG · max 4MB
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Basic information */}
            <Card>
              <SectionHeader
                title="Basic information"
                subtitle="The essentials clients see at the top of your profile."
                step="02"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <TextInput value={form.full_name} onChange={(v) => set("full_name", v)} />
                </Field>
                <Field label="Professional title">
                  <TextInput
                    value={form.headline}
                    onChange={(v) => set("headline", v)}
                    placeholder="e.g. Strength & Conditioning Coach"
                  />
                </Field>
                <Field label="Business / gym name">
                  <TextInput
                    value={form.trading_name}
                    onChange={(v) => set("trading_name", v)}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Location">
                  <TextInput
                    value={form.city}
                    onChange={(v) => set("city", v)}
                    prefix={<MapPin className="h-3.5 w-3.5" />}
                    placeholder="City"
                  />
                </Field>
                <Field label="Public phone">
                  <TextInput
                    type="tel"
                    value={form.public_phone}
                    onChange={(v) => set("public_phone", v)}
                  />
                </Field>
                <Field label="Public email">
                  <TextInput
                    type="email"
                    value={form.public_email}
                    onChange={(v) => set("public_email", v)}
                  />
                </Field>
                <Field label="Website" className="sm:col-span-2">
                  <TextInput
                    type="url"
                    value={form.website}
                    onChange={(v) => set("website", v)}
                    prefix={<Globe className="h-3.5 w-3.5" />}
                    placeholder="yourwebsite.com"
                  />
                </Field>
                <Field label="Languages spoken" className="sm:col-span-2">
                  <ChipInput
                    values={form.languages}
                    onChange={(v) => set("languages", v)}
                    placeholder="Type and press Enter"
                  />
                </Field>
                <Field label="Social links" className="sm:col-span-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <TextInput
                      value={form.social_instagram}
                      onChange={(v) => set("social_instagram", v)}
                      prefix={<Instagram className="h-3.5 w-3.5" />}
                      placeholder="@handle"
                    />
                    <TextInput
                      value={form.social_linkedin}
                      onChange={(v) => set("social_linkedin", v)}
                      prefix={<Linkedin className="h-3.5 w-3.5" />}
                      placeholder="profile-slug"
                    />
                    <TextInput
                      value={form.social_youtube}
                      onChange={(v) => set("social_youtube", v)}
                      prefix={<Youtube className="h-3.5 w-3.5" />}
                      placeholder="@channel"
                    />
                  </div>
                </Field>
              </div>
            </Card>

            {/* Public bio */}
            <Card>
              <SectionHeader
                title="Public bio"
                subtitle="Lead with credibility — credentials, results, and who you help."
                step="03"
              />
              <Field
                label="About"
                hint={`${form.bio.length} / 1200 characters`}
              >
                <TextArea
                  rows={8}
                  value={form.bio}
                  onChange={(v) => set("bio", v.slice(0, 1200))}
                  placeholder="Tell clients about your experience, approach and who you help."
                />
              </Field>
            </Card>

            {/* Specialisms */}
            <Card>
              <SectionHeader
                title="Specialisms"
                subtitle="What clients should hire you for — keep it focused."
                step="04"
              />
              <ChipInput
                values={form.specialisms}
                onChange={(v) => set("specialisms", v)}
                placeholder="Type and press Enter"
              />
            </Card>
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
                      <Avatar className="size-16 ring-4 ring-reps-panel">
                        {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                        <AvatarFallback className="bg-reps-orange text-white">
                          {(form.full_name || "?").slice(0, 2).toUpperCase()}
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
                        {form.headline || "Your professional title"}
                      </div>
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
                    <Button asChild variant="outline" className="mt-4 w-full">
                      <Link to="/find-a-professional">
                        View full profile <ExternalLink data-icon="inline-end" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Completion */}
            <Card>
              <SectionHeader title="Profile completion" />
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

            {/* Verification status (read-only summary) */}
            <Card>
              <SectionHeader
                title="Verification status"
                subtitle="Trust signals shown on your public profile."
              />
              <div className="flex items-center justify-between gap-3 rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-reps-orange" />
                  <span className="text-[12px] font-medium text-white/85">REPS Verified Member</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[11px] font-semibold text-reps-orange">
                  <CheckCircle2 className="h-3 w-3" />
                  {profile.verification_status === "verified" ? "Verified" : "Pending"}
                </span>
              </div>
            </Card>
          </aside>
        </div>
      </div>
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
          {pct === 100 ? "Profile complete" : pct >= 70 ? "Almost there" : "Keep going"}
        </div>
        <p className="text-[11px] text-white/55">
          Complete every section to unlock priority directory placement.
        </p>
      </div>
    </div>
  );
}
