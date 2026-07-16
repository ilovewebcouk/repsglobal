import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Camera, Loader2, Sparkles, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  getMyDashboardProfile,
  updateMyAvatar,
} from "@/lib/profile/dashboard-profile.functions";
import {
  validateAvatar,
  commitAvatar,
  regenerateAvatar,
  createAvatarUploadUrl,
} from "@/lib/profile/avatar-ai.functions";

import { initialsFromName } from "@/lib/initials";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { PPanel } from "@/components/dashboard/primitives";

/* ------------------------------- helpers ------------------------------- */

function pickFile(accept: string, maxBytes: number): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
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

function humanizeAvatarError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;
  const trimmed = raw.trim();
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
  const stripped = trimmed.replace(/<[^>]+>/g, "").replace(/\s+/g, "").trim();
  if (stripped.length > 180) return fallback;
  return stripped || fallback;
}

/* ------------------------------- component ------------------------------ */

export function ProfilePhotoPanel() {
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const { data: profile } = useSuspenseQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
  });

  const saveAvatar = useServerFn(updateMyAvatar);
  const runValidate = useServerFn(validateAvatar);
  const runCommit = useServerFn(commitAvatar);
  const runRegenerate = useServerFn(regenerateAvatar);

  // Resolve the current signed-in user id at click time, refreshing the
  // JWT first so storage RLS sees a valid auth.uid(). A stale/rotated
  // token silently fails the avatars INSERT policy with the generic
  // "new row violates row-level security policy" error.
  const resolveUserId = React.useCallback(async (): Promise<string | null> => {
    try {
      await supabase.auth.refreshSession();
    } catch {
      /* ignore — fall through to getUser() which will surface the real state */
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }, []);


  const [avatarBusy, setAvatarBusy] = React.useState<
    null | "uploading" | "validating" | "cropping" | "generating"
  >(null);
  const [rejection, setRejection] = React.useState<null | { reason: string; category: string }>(null);
  const [lastUploadedPath, setLastUploadedPath] = React.useState<string | null>(null);
  const [regenState, setRegenState] = React.useState<
    | { step: "confirm"; sourcePath: string; attempt: number }
    | {
        step: "preview";
        sourcePath: string;
        originalUrl: string;
        aiPath: string;
        aiUrl: string;
        attempt: number;
        identityScore: number;
        identityReason: string;
      }
    | null
  >(null);

  const invalidateProfile = () => {
    void queryClient.invalidateQueries({ queryKey: ["my-dashboard-profile"] });
    void queryClient.invalidateQueries({ queryKey: ["account-profile"] });
  };

  const removeMutation = useMutation({
    mutationFn: async () => {
      const id = await resolveUserId();
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
    // Open the OS file picker FIRST, synchronously in the same tick as the
    // click. Any await before pickFile() (e.g. refreshing the Supabase
    // session) drops the user-gesture context, which makes Safari/iOS —
    // and increasingly Chrome — silently ignore input.click(). Do auth
    // work AFTER the user has chosen a file.
    const filePromise = pickFile("image/png,image/jpeg", 4 * 1024 * 1024);

    const [f, id] = await Promise.all([filePromise, resolveUserId()]);
    if (!f) return;
    if (!id) {
      toast.error("Not signed in.");
      return;
    }

    if (f.type === "image/svg+xml" || /\.svg$/i.test(f.name)) {
      setRejection({
        reason: "SVGs and vector graphics aren't accepted — please upload a real photo of yourself.",
        category: "logo",
      });
      return;
    }

    try {
      const img = await loadImageBitmap(f);
      if (img.naturalWidth < 512 || img.naturalHeight < 512) {
        setRejection({
          reason: "This image is too small — please upload a photo at least 512 × 512 pixels.",
          category: "low_quality",
        });
        return;
      }
    } catch {
      toast.error("Couldn't read this image.");
      return;
    }

    let tempPath: string | null = null;
    try {
      setAvatarBusy("uploading");
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      tempPath = `${id}/pending-${Date.now()}.${ext}`;
      await uploadFileToAvatars(tempPath, f, f.type || "image/jpeg");

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
        tempPath = null;
        setAvatarBusy(null);
        setRejection({ reason: result.reason, category: result.category });
        return;
      }

      setAvatarBusy("cropping");
      const croppedBlob = await cropPortraitToJpegBlob(f, result.faceBox);

      const finalPath = `${id}/avatar-${Date.now()}.jpg`;
      await uploadFileToAvatars(finalPath, croppedBlob, "image/jpeg");
      await supabase.storage.from("avatars").remove([tempPath]).catch(() => {});
      tempPath = null;

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
    const id = await resolveUserId();
    if (!id) return;
    let sourcePath = lastUploadedPath;
    if (!sourcePath && profile.avatar_url) {
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

  return (
    <>
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4">
          <h3 className="text-[14px] font-semibold text-white">Profile photo</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            A clear photo of you (head-and-shoulders or waist-up) helps clients trust and recognise you.
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-20 rounded-[8px] ring-2 ring-reps-border">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="" className="rounded-[8px]" />
                ) : null}
                <AvatarFallback className="rounded-[8px] bg-reps-orange text-white">
                  {initialsFromName(profile.full_name)}
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
                  {avatarBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
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
                Real photo of you (head-and-shoulders or waist-up) · JPG or PNG · min 512 × 512 · max 4 MB · we check uploads with AI to keep the directory trustworthy
              </p>
            </div>
          </div>
        </div>
      </PPanel>

      {/* Rejection dialog */}
      <DashboardDialog open={rejection !== null} onOpenChange={(o: boolean) => !o && setRejection(null)}>
        <DashboardDialogContent className="sm:max-w-[420px]">
          <DashboardDialogHeader>
            <DashboardDialogTitle>
              <AlertTriangle className="h-4 w-4 text-reps-orange" />
              That photo can't be used
            </DashboardDialogTitle>
            <DashboardDialogDescription>{rejection?.reason}</DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogNote>
            <p className="mb-1 text-[12px] font-semibold text-white">What we need</p>
            <ul className="list-disc space-y-0.5 pl-4 text-white/70">
              <li>A clear photograph of you (not a logo, illustration or graphic)</li>
              <li>Just you — no group photos</li>
              <li>Head-and-shoulders or waist-up, face clearly visible</li>
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
                Most pros prefer their real photo. Use AI only if you don't have a good photo of yourself yet.
              </DashboardDialogNote>
              <DashboardDialogFooter>
                <DashboardButton
                  variant="ghost"
                  onClick={() => setRegenState(null)}
                  disabled={avatarBusy === "generating"}
                >
                  Cancel
                </DashboardButton>
                <DashboardButton
                  variant="primary"
                  onClick={handleConfirmRegenerate}
                  disabled={avatarBusy === "generating"}
                >
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
                  onClick={() =>
                    setRegenState({
                      step: "confirm",
                      sourcePath: regenState.sourcePath,
                      attempt: regenState.attempt + 1,
                    })
                  }
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
    </>
  );
}
