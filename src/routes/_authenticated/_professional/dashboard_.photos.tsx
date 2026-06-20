import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { supabase } from "@/integrations/supabase/client";
import {
  deletePhoto,
  listMyPhotos,
  registerUploadedPhoto,
  reorderPhotos,
  type GalleryPhoto,
} from "@/lib/profile/photos.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/photos")({
  head: () => ({
    meta: [
      { title: "Photos — REPS Professional" },
      { name: "description", content: "Upload, reorder and manage the gallery photos shown on your public REPS profile." },
      { property: "og:title", content: "Photos — REPS Professional" },
      { property: "og:description", content: "Manage your profile gallery." },
      { property: "og:url", content: "/dashboard/photos" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/photos" }],
  }),
  component: PhotosPage,
});

const BUCKET = "pro-photos";
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;
const MIN_DIMENSION = 800;

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Couldn't read image."));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function PhotosPage() {
  const qc = useQueryClient();
  const tier = useTrainerTier();
  const shellTier = (tier === "verified" || tier === "pro" || tier === "studio" ? tier : "verified") as
    | "verified"
    | "pro"
    | "studio";

  const { data, isLoading } = useQuery({
    queryKey: ["my-photos"],
    queryFn: () => listMyPhotos(),
    staleTime: 30_000,
  });
  const photos: GalleryPhoto[] = data?.photos ?? [];
  const limit = data?.limit ?? 0;
  const used = photos.length;
  const atCap = limit > 0 && used >= limit;
  const noTier = limit === 0;

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<GalleryPhoto | null>(null);

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => reorderPhotos({ data: { orderedIds } }),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: ["my-photos"] });
      const prev = qc.getQueryData<{ photos: GalleryPhoto[]; limit: number }>(["my-photos"]);
      if (prev) {
        const byId = new Map(prev.photos.map((p) => [p.id, p]));
        const next = orderedIds
          .map((id, i) => {
            const p = byId.get(id);
            return p ? { ...p, sort_order: i } : null;
          })
          .filter((p): p is GalleryPhoto => !!p);
        qc.setQueryData(["my-photos"], { ...prev, photos: next });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["my-photos"], ctx.prev);
      toast.error(e instanceof Error ? e.message : "Couldn't reorder.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["my-photos"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePhoto({ data: { id } }),
    onSuccess: () => {
      toast.success("Photo deleted.");
      qc.invalidateQueries({ queryKey: ["my-photos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't delete."),
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (noTier) {
      toast.error("Subscribe to add gallery photos.");
      return;
    }
    const slots = limit - used;
    const list = Array.from(files).slice(0, slots);
    if (!list.length) {
      toast.error(`You've reached your photo limit (${limit}).`);
      return;
    }
    if (files.length > list.length) {
      toast.warning(`Only ${list.length} of ${files.length} files will be uploaded — limit reached.`);
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in.");

      for (const file of list) {
        if (!ACCEPTED.includes(file.type)) {
          toast.error(`${file.name}: only JPEG, PNG or WebP.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name}: max 8 MB.`);
          continue;
        }
        const dims = await readImageDimensions(file).catch(() => null);
        if (!dims || dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION) {
          toast.error(`${file.name}: must be at least ${MIN_DIMENSION}×${MIN_DIMENSION}px.`);
          continue;
        }

        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = /^(jpe?g|png|webp)$/i.test(ext) ? ext : "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${safeExt}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) {
          toast.error(`${file.name}: ${upErr.message}`);
          continue;
        }

        try {
          await registerUploadedPhoto({
            data: {
              storage_path: path,
              width: dims.width,
              height: dims.height,
              byte_size: file.size,
              mime_type: file.type,
            },
          });
        } catch (e) {
          await supabase.storage.from(BUCKET).remove([path]);
          toast.error(`${file.name}: ${e instanceof Error ? e.message : "couldn't save."}`);
          continue;
        }
      }
      qc.invalidateQueries({ queryKey: ["my-photos"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function move(id: string, dir: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= photos.length) return;
    const ids = photos.map((p) => p.id);
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    reorder.mutate(ids);
  }

  return (
    <DashboardShell
      role="trainer"
      tier={shellTier}
      active="Photos"
      title="Photos"
      subtitle="Photos that appear in the gallery on your public profile."
      actions={
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || atCap || noTier}
          >
            {uploading ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <ImagePlus data-icon="inline-start" />
            )}
            {uploading ? "Uploading…" : "Add photos"}
          </Button>
        </div>
      }
    >
      {/* Status banner */}
      <PCard className="!p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              Gallery
            </div>
            <div className="mt-1 text-[15px] text-white">
              {noTier
                ? "Subscribe to add gallery photos to your profile."
                : limit >= 50
                ? `${used} photo${used === 1 ? "" : "s"} — unlimited on your plan.`
                : `${used} of ${limit} photo${limit === 1 ? "" : "s"} used on your plan.`}
            </div>
          </div>
          {(noTier || (shellTier === "verified" && atCap)) && (
            <a
              href="/pricing"
              className="rounded-[10px] border border-reps-orange/40 bg-reps-orange/10 px-3 py-1.5 text-[13px] font-semibold text-reps-orange hover:bg-reps-orange/20"
            >
              Upgrade for more photos
            </a>
          )}
        </div>
      </PCard>

      {shellTier === "verified" && (
        <Alert>
          <Camera />
          <AlertTitle>Verified plan includes 3 photos</AlertTitle>
          <AlertDescription>
            Upgrade to Pro for an unlimited gallery, plus shop-front, bookings and more.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid */}
      {isLoading ? (
        <PCard className="!p-8 text-center text-white/60">Loading…</PCard>
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Camera />
            </EmptyMedia>
            <EmptyTitle>No photos yet</EmptyTitle>
            <EmptyDescription>
              Add photos of you training, your space or your clients (with permission) to bring your profile to life.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || noTier}
            >
              <ImagePlus data-icon="inline-start" />
              Add your first photo
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p, i) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-[14px] bg-white/5 ring-1 ring-white/10"
            >
              <img
                src={p.url}
                alt={`Gallery photo ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-1 p-2 opacity-0 transition group-hover:opacity-100">
                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                  #{i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(p)}
                  className="rounded-full bg-black/60 p-1.5 text-white hover:bg-rose-500/80"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(p.id, -1)}
                  disabled={i === 0 || reorder.isPending}
                  className="rounded-md bg-white/10 px-2 py-1 text-white disabled:opacity-30"
                  aria-label="Move earlier"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(p.id, 1)}
                  disabled={i === photos.length - 1 || reorder.isPending}
                  className="rounded-md bg-white/10 px-2 py-1 text-white disabled:opacity-30"
                  aria-label="Move later"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from your gallery and your public profile immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) remove.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
