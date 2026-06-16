import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CT_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const DRY = process.argv.includes("--dry");

async function main() {
  const { data: seeds, error } = await supabase
    .from("bd_member_seed")
    .select("bd_member_id, profile_photo_src, claimed_user_id")
    .eq("profile_photo_status", "ok")
    .not("profile_photo_src", "is", null)
    .not("claimed_user_id", "is", null);
  if (error) throw error;

  const uids = Array.from(new Set(seeds!.map((s) => s.claimed_user_id as string)));
  const { data: profs } = await supabase.from("profiles").select("id, avatar_url").in("id", uids);
  const noAvatar = new Set((profs ?? []).filter((p) => !p.avatar_url).map((p) => p.id));
  const candidates = seeds!.filter((s) => noAvatar.has(s.claimed_user_id as string));

  console.log(`candidates: ${candidates.length} (of ${seeds!.length} approved)`);
  if (DRY) {
    console.log("sample:", candidates.slice(0, 3));
    return;
  }

  let uploaded = 0,
    failed = 0;
  const errs: { id: number; reason: string }[] = [];

  const BATCH = 10;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (row) => {
        const bdId = row.bd_member_id as number;
        const uid = row.claimed_user_id as string;
        const url = ((row.profile_photo_src as string) ?? "").replace(
          "https://repsuk.org/pictures/",
          "https://legacy.repsuk.org/pictures/",
        );
        try {
          const res = await fetch(url);
          if (!res.ok) {
            failed++;
            errs.push({ id: bdId, reason: `HTTP ${res.status}` });
            return;
          }
          const ct = (res.headers.get("content-type") ?? "").toLowerCase().split(";")[0].trim();
          const ext = CT_TO_EXT[ct];
          if (!ext) {
            failed++;
            errs.push({ id: bdId, reason: `ct=${ct}` });
            return;
          }
          const buf = new Uint8Array(await res.arrayBuffer());
          if (buf.byteLength > 5 * 1024 * 1024) {
            failed++;
            errs.push({ id: bdId, reason: "over 5MB" });
            return;
          }
          const key = `bd-seeds/${uid}/seed-${bdId}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("avatars")
            .upload(key, buf, { contentType: ct, cacheControl: "31536000", upsert: true });
          if (upErr) {
            failed++;
            errs.push({ id: bdId, reason: `up: ${upErr.message}` });
            return;
          }
          const { data: pub } = supabase.storage.from("avatars").getPublicUrl(key);
          const { error: pErr } = await supabase
            .from("profiles")
            .update({ avatar_url: pub.publicUrl })
            .eq("id", uid)
            .is("avatar_url", null);
          if (pErr) {
            failed++;
            errs.push({ id: bdId, reason: `prof: ${pErr.message}` });
            return;
          }
          await supabase
            .from("bd_member_seed")
            .update({ profile_photo_storage_path: key })
            .eq("bd_member_id", bdId);
          uploaded++;
        } catch (e) {
          failed++;
          errs.push({ id: bdId, reason: e instanceof Error ? e.message : "?" });
        }
      }),
    );
    process.stdout.write(`.`);
  }
  console.log(`\nuploaded=${uploaded} failed=${failed}`);
  if (errs.length) console.log("errors (first 20):", errs.slice(0, 20));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
