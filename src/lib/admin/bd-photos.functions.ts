import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MirrorResult = {
  attempted: number;
  uploaded: number;
  skipped: number;
  failed: number;
  errors: { bd_member_id: number; reason: string }[];
};

const CT_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const mirrorBdSeedPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number; dryRun?: boolean }) => ({
    limit: data?.limit ?? 1000,
    dryRun: data?.dryRun ?? false,
  }))
  .handler(async ({ data, context }): Promise<MirrorResult> => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull candidates: AI-approved photos linked to a claimed user whose profile has no avatar.
    const { data: seeds, error: seedErr } = await supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id, profile_photo_src, claimed_user_id")
      .eq("profile_photo_status", "ok")
      .not("profile_photo_src", "is", null)
      .not("claimed_user_id", "is", null)
      .limit(data.limit);
    if (seedErr) throw new Error(seedErr.message);

    const userIds = Array.from(new Set((seeds ?? []).map((s) => s.claimed_user_id as string)));
    const { data: profs, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, avatar_url")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    if (profErr) throw new Error(profErr.message);
    const noAvatar = new Set((profs ?? []).filter((p) => !p.avatar_url).map((p) => p.id));

    const candidates = (seeds ?? []).filter((s) =>
      noAvatar.has(s.claimed_user_id as string),
    );

    const result: MirrorResult = {
      attempted: candidates.length,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    if (data.dryRun) return result;

    const BATCH = 10;
    for (let i = 0; i < candidates.length; i += BATCH) {
      const batch = candidates.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (row) => {
          const bdId = row.bd_member_id as number;
          const uid = row.claimed_user_id as string;
          const srcRaw = (row.profile_photo_src as string) ?? "";
          const url = srcRaw.replace(
            "https://repsuk.org/pictures/",
            "https://legacy.repsuk.org/pictures/",
          );
          try {
            const res = await fetch(url);
            if (!res.ok) {
              result.failed++;
              result.errors.push({ bd_member_id: bdId, reason: `HTTP ${res.status}` });
              return;
            }
            const ct = (res.headers.get("content-type") ?? "").toLowerCase().split(";")[0].trim();
            const ext = CT_TO_EXT[ct];
            if (!ext) {
              result.failed++;
              result.errors.push({ bd_member_id: bdId, reason: `bad content-type: ${ct}` });
              return;
            }
            const buf = new Uint8Array(await res.arrayBuffer());
            if (buf.byteLength > 5 * 1024 * 1024) {
              result.skipped++;
              result.errors.push({ bd_member_id: bdId, reason: "over 5MB" });
              return;
            }
            const key = `bd-seeds/${uid}/seed-${bdId}.${ext}`;
            const { error: upErr } = await supabaseAdmin.storage
              .from("avatars")
              .upload(key, buf, {
                contentType: ct,
                cacheControl: "31536000",
                upsert: true,
              });
            if (upErr) {
              result.failed++;
              result.errors.push({ bd_member_id: bdId, reason: `upload: ${upErr.message}` });
              return;
            }
            const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(key);
            const publicUrl = pub.publicUrl;

            const { error: profUpdErr } = await supabaseAdmin
              .from("profiles")
              .update({ avatar_url: publicUrl })
              .eq("id", uid)
              .is("avatar_url", null);
            if (profUpdErr) {
              result.failed++;
              result.errors.push({ bd_member_id: bdId, reason: `profile: ${profUpdErr.message}` });
              return;
            }

            await supabaseAdmin
              .from("bd_member_seed")
              .update({ profile_photo_storage_path: key })
              .eq("bd_member_id", bdId);

            result.uploaded++;
          } catch (e: unknown) {
            result.failed++;
            result.errors.push({
              bd_member_id: bdId,
              reason: e instanceof Error ? e.message : "unknown",
            });
          }
        }),
      );
    }

    return result;
  });
