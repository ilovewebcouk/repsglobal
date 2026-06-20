import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "pro-photos";

export type GalleryPhoto = {
  id: string;
  storage_path: string;
  url: string;
  sort_order: number;
  width: number | null;
  height: number | null;
};

/** Tier-based gallery cap. Verified = 3, Pro/Studio = 50 (soft cap), free = 0. */
async function getPhotoLimit(supabase: any, userId: string): Promise<number> {
  const { data: isProOrStudio } = await supabase.rpc("has_active_tier", {
    _user_id: userId,
    _tiers: ["pro", "studio"],
  });
  if (isProOrStudio) return 50;
  const { data: isVerified } = await supabase.rpc("has_active_tier", {
    _user_id: userId,
    _tiers: ["verified"],
  });
  if (isVerified) return 3;
  return 0;
}

function publicUrl(path: string): string {
  const base = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

export const listMyPhotos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ photos: GalleryPhoto[]; limit: number }> => {
    const { supabase, userId } = context;
    const [{ data, error }, limit] = await Promise.all([
      supabase
        .from("professional_photos")
        .select("id, storage_path, sort_order, width, height")
        .eq("professional_id", userId)
        .order("sort_order", { ascending: true }),
      getPhotoLimit(supabase, userId),
    ]);
    if (error) throw new Error(error.message);
    const photos = (data ?? []).map((r: any) => ({
      id: r.id,
      storage_path: r.storage_path,
      url: publicUrl(r.storage_path),
      sort_order: r.sort_order,
      width: r.width,
      height: r.height,
    }));
    return { photos, limit };
  });

const RegisterSchema = z.object({
  storage_path: z.string().min(1).max(500),
  width: z.number().int().positive().max(20000).nullable().optional(),
  height: z.number().int().positive().max(20000).nullable().optional(),
  byte_size: z.number().int().positive().max(20_000_000).nullable().optional(),
  mime_type: z.string().max(100).nullable().optional(),
});

export const registerUploadedPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RegisterSchema.parse(d))
  .handler(async ({ data, context }): Promise<GalleryPhoto> => {
    const { supabase, userId } = context;

    // Path safety — must live in the caller's folder
    if (!data.storage_path.startsWith(`${userId}/`)) {
      throw new Error("Forbidden: path is not in your folder.");
    }

    // Enforce tier cap
    const limit = await getPhotoLimit(supabase, userId);
    if (limit <= 0) {
      throw new Error(
        "Adding gallery photos requires a Verified, Pro or Studio subscription.",
      );
    }
    const { count, error: countErr } = await supabase
      .from("professional_photos")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", userId);
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) >= limit) {
      throw new Error(
        `You've reached your photo limit (${limit}). Upgrade to add more.`,
      );
    }

    // Append to the end
    const { data: maxRow } = await supabase
      .from("professional_photos")
      .select("sort_order")
      .eq("professional_id", userId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxRow?.sort_order ?? -1) + 1;

    const { data: inserted, error } = await supabase
      .from("professional_photos")
      .insert({
        professional_id: userId,
        storage_path: data.storage_path,
        sort_order: nextOrder,
        width: data.width ?? null,
        height: data.height ?? null,
        byte_size: data.byte_size ?? null,
        mime_type: data.mime_type ?? null,
      })
      .select("id, storage_path, sort_order, width, height")
      .single();
    if (error) throw new Error(error.message);

    return {
      id: inserted.id,
      storage_path: inserted.storage_path,
      url: publicUrl(inserted.storage_path),
      sort_order: inserted.sort_order,
      width: inserted.width,
      height: inserted.height,
    };
  });

export const reorderPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderedIds: z.array(z.string().uuid()).min(1).max(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Update each row's sort_order; RLS ensures we can only touch our own rows
    await Promise.all(
      data.orderedIds.map((id, idx) =>
        supabase
          .from("professional_photos")
          .update({ sort_order: idx })
          .eq("id", id)
          .eq("professional_id", userId),
      ),
    );
    return { ok: true };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error: selErr } = await supabase
      .from("professional_photos")
      .select("storage_path")
      .eq("id", data.id)
      .eq("professional_id", userId)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (!row) throw new Error("Photo not found.");

    const { error: delErr } = await supabase
      .from("professional_photos")
      .delete()
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (delErr) throw new Error(delErr.message);

    // Best-effort storage cleanup
    await supabase.storage.from(BUCKET).remove([row.storage_path]);

    return { ok: true };
  });
