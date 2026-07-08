// Provider dashboard welcome banner with inline branding uploads.
// - Cover background = websites.hero_image_url (also shown on the
//   /find-a-training-provider card and the /t/$slug hero).
// - Logo chip = profiles.avatar_url (also shown as the logo on the
//   directory card, on /t/$slug, and as the dashboard avatar).
//
// Wiring reuses existing endpoints:
//   Logo → client uploads to `avatars` bucket, then updateMyAvatar(path)
//   Cover → uploadHeroFromBase64(dataUrl) → updateMyWebsiteHero(url)
//
// Provider-only. The trainer dashboard keeps the plain WelcomeBanner.
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Camera,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import { PPanel } from "@/components/dashboard/primitives";
import { DashboardButton } from "@/components/dashboard/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  updateMyAvatar,
  uploadAvatarFromBase64,
} from "@/lib/profile/dashboard-profile.functions";
import {
  updateMyWebsiteHero,
  uploadHeroFromBase64,
} from "@/lib/website/hero.functions";
import type { TrustState } from "@/lib/verification/trust.functions";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB source cap
const ACCEPTED = "image/jpeg,image/png,image/webp";

export function ProviderWelcomeBanner({
  name,
  avatarUrl,
  headline,
  tierLabel,
  isPublished,
  slug,
  trust,
  heroUrl,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  headline: string | null | undefined;
  tierLabel: string;
  isPublished: boolean;
  slug: string | null | undefined;
  trust: TrustState | null | undefined;
  heroUrl: string | null | undefined;
}) {
  const qc = useQueryClient();
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const publicUrl = slug ? `/t/${slug}` : null;

  const [copied, setCopied] = React.useState(false);
  const copyUrl = React.useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }, [publicUrl]);

  const fullyVerified =
    !!trust &&
    trust.ticks.identity &&
    trust.ticks.insurance &&
    trust.ticks.qualifications;

  /* ---------------------- logo upload (avatars bucket) --------------------- */

  const saveAvatarFn = useServerFn(updateMyAvatar);
  const uploadAvatarFn = useServerFn(uploadAvatarFromBase64);

  const invalidateBranding = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["dashboard-status"] });
    qc.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
    qc.invalidateQueries({ queryKey: ["website", "mine"] });
    qc.invalidateQueries({ queryKey: ["providers"] });
  }, [qc]);

  const logoMut = useMutation({
    mutationFn: async (file: File) => {
      const dataUrl = await fileToDataUrl(file);
      const resized = await resizeForLogo(dataUrl);
      const { path } = await uploadAvatarFn({ data: { dataUrl: resized } });
      return saveAvatarFn({ data: { path } });
    },
    onSuccess: () => {
      toast.success("Logo updated");
      invalidateBranding();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save logo"),
  });


  const logoClearMut = useMutation({
    mutationFn: () => saveAvatarFn({ data: { path: null } }),
    onSuccess: () => {
      toast.success("Logo removed");
      invalidateBranding();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't remove logo"),
  });

  /* ------------------- cover upload (website-hero bucket) ------------------ */

  const uploadHeroFn = useServerFn(uploadHeroFromBase64);
  const saveHeroFn = useServerFn(updateMyWebsiteHero);

  const coverMut = useMutation({
    mutationFn: async (file: File) => {
      const dataUrl = await fileToDataUrl(file);
      const resized = await resizeForCover(dataUrl);
      const { url } = await uploadHeroFn({ data: { dataUrl: resized } });
      await saveHeroFn({ data: { url } });
      return url;
    },
    onSuccess: () => {
      toast.success("Cover image updated");
      invalidateBranding();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save cover"),
  });

  const coverClearMut = useMutation({
    mutationFn: () => saveHeroFn({ data: { url: null } }),
    onSuccess: () => {
      toast.success("Cover removed");
      invalidateBranding();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't remove cover"),
  });

  /* --------------------------------- UI ----------------------------------- */

  const logoFileRef = React.useRef<HTMLInputElement>(null);
  const coverFileRef = React.useRef<HTMLInputElement>(null);

  function pickAndUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    run: (f: File) => void,
  ) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
      toast.error("Use a JPG, PNG or WebP image");
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      toast.error("Image must be under 8 MB");
      return;
    }
    run(f);
  }

  const busy = logoMut.isPending || coverMut.isPending;

  return (
    <PPanel className="overflow-hidden p-0">
      {/* Cover strip ------------------------------------------------------- */}
      <div className="relative h-[168px] w-full">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-reps-orange/25 via-reps-panel to-reps-panel-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-reps-panel via-reps-panel/40 to-transparent" />

        {/* Cover upload button (top-right) */}
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={() => coverFileRef.current?.click()}
            disabled={coverMut.isPending}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-white/15 bg-black/45 px-3 text-[12px] font-medium text-white backdrop-blur hover:bg-black/60 disabled:opacity-60"
          >
            {coverMut.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="size-3.5" />
                {heroUrl ? "Replace cover" : "Add cover"}
              </>
            )}
          </button>
        </div>

        <input
          ref={coverFileRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => pickAndUpload(e, coverMut.mutate)}
        />
      </div>

      {/* Body -------------------------------------------------------------- */}
      <div className="relative -mt-10 flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-end gap-4">
          {/* Logo tile with camera hover overlay */}
          <div className="relative">
            <Avatar className="size-20 rounded-[16px] border border-reps-border bg-reps-panel-soft shadow-lg">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
              <AvatarFallback className="rounded-[16px] bg-reps-panel-soft text-[18px] font-semibold text-white/85">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => logoFileRef.current?.click()}
              disabled={logoMut.isPending}
              aria-label={avatarUrl ? "Replace logo" : "Add logo"}
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-[16px] bg-black/55 text-white opacity-0 backdrop-blur-[1px] transition-opacity hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed",
                logoMut.isPending && "opacity-100",
              )}
            >
              {logoMut.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Camera className="size-5" />
              )}
            </button>
            <input
              ref={logoFileRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => pickAndUpload(e, logoMut.mutate)}
            />
          </div>

          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-[20px] font-semibold text-white">
                {name}
              </h1>
              {fullyVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <BadgeCheck className="size-3" />
                  REPS Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Unverified
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel-soft/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                {tierLabel} plan
              </span>
            </div>
            {headline ? (
              <p className="mt-1 truncate text-[13px] text-white/55">
                {headline}
              </p>
            ) : null}
            <div className="mt-2 flex items-center gap-2 text-[12px] text-white/65">
              <span
                className={cn(
                  "inline-block size-2 rounded-full",
                  isPublished ? "bg-emerald-400" : "bg-amber-400",
                )}
                aria-hidden
              />
              {isPublished ? (
                <span>Your listing is live on REPS</span>
              ) : (
                <span>Draft — complete your profile to go live</span>
              )}
            </div>
            {!avatarUrl && !heroUrl ? (
              <p className="mt-2 text-[12px] text-white/45">
                Add a logo and cover so your provider card stands out on the
                directory.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-1">
          {/* Branding manage menu — replace / remove either image */}
          <Popover>
            <PopoverTrigger asChild>
              <DashboardButton size="sm" variant="ghost" disabled={busy}>
                <ImagePlus className="mr-1.5 size-4" />
                Branding
              </DashboardButton>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 border-reps-border bg-reps-panel p-3 text-white"
            >
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-white/55">
                Provider branding
              </div>
              <BrandingRow
                label="Logo"
                hint="Appears on your card and profile."
                hasImage={!!avatarUrl}
                onReplace={() => logoFileRef.current?.click()}
                onRemove={
                  avatarUrl ? () => logoClearMut.mutate() : undefined
                }
                busy={logoMut.isPending || logoClearMut.isPending}
              />
              <div className="my-2 h-px bg-reps-border" />
              <BrandingRow
                label="Cover image"
                hint="Shows behind your card and profile hero."
                hasImage={!!heroUrl}
                onReplace={() => coverFileRef.current?.click()}
                onRemove={heroUrl ? () => coverClearMut.mutate() : undefined}
                busy={coverMut.isPending || coverClearMut.isPending}
              />
            </PopoverContent>
          </Popover>

          {publicUrl ? (
            <>
              <DashboardButton
                size="sm"
                variant="ghost"
                onClick={copyUrl}
                title="Copy public URL"
              >
                {copied ? (
                  <>
                    <BadgeCheck className="mr-1.5 size-4 text-emerald-400" />{" "}
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" /> Copy link
                  </>
                )}
              </DashboardButton>
              <DashboardButton asChild size="sm" variant="primary">
                <Link to={publicUrl as string} target="_blank">
                  View provider page
                  <ExternalLink className="ml-1.5 size-4" />
                </Link>
              </DashboardButton>
            </>
          ) : (
            <DashboardButton asChild size="sm" variant="primary">
              <Link to="/dashboard/provider-website">Finish profile</Link>
            </DashboardButton>
          )}
        </div>
      </div>
    </PPanel>
  );
}

function BrandingRow({
  label,
  hint,
  hasImage,
  onReplace,
  onRemove,
  busy,
}: {
  label: string;
  hint: string;
  hasImage: boolean;
  onReplace: () => void;
  onRemove?: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-white">{label}</div>
        <div className="text-[11px] text-white/55">{hint}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onReplace}
          disabled={busy}
          className="inline-flex h-7 items-center gap-1 rounded-[8px] border border-reps-border bg-reps-panel-soft px-2 text-[11px] font-medium text-white/80 hover:bg-reps-panel disabled:opacity-60"
        >
          <Upload className="size-3" />
          {hasImage ? "Replace" : "Upload"}
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="inline-flex size-7 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/60 hover:bg-reps-panel hover:text-white disabled:opacity-60"
          >
            <Trash2 className="size-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ----------------------------- helpers ---------------------------------- */

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that file"));
    r.readAsDataURL(file);
  });
}

// Resize down so we stay under the 2 MB server cap on `uploadHeroFromBase64`.
// Max long-edge ~1920px, JPEG quality 0.85. Preserves original aspect ratio —
// the directory card and /t/$slug hero both use `object-cover` so any framing works.
async function resizeForCover(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Couldn't decode image"));
    i.src = dataUrl;
  });
  const MAX = 1920;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const scale = Math.min(1, MAX / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Logo/avatar: cap to 512px square-ish, JPEG 0.9. Keeps the payload well
// under the server's 5 MB base64 cap and matches how the avatar is rendered.
async function resizeForLogo(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Couldn't decode image"));
    i.src = dataUrl;
  });
  const MAX = 512;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const scale = Math.min(1, MAX / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", 0.9);
}
