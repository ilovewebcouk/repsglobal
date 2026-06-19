import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * BD avatar re-crop — admin-only batch job that re-frames the 124 BD-seeded
 * "ok" photos through the dashboard's face-box + square-crop step. Validation
 * (Gemini) and storage I/O are server-side; the actual canvas crop runs
 * client-side from the admin page because Jimp's PNG decoder is incompatible
 * with our Cloudflare Workers runtime (see comments in avatar-ai.functions.ts).
 */

export type BdRecropCandidate = {
  bd_member_id: number;
  user_id: string;
  full_name: string;
  src_path: string; // "bd-seeds/{uid}/seed-{bdId}.{ext}"
  src_public_url: string;
};

export type BdRecropStats = {
  total_ok_bd: number; // BD seeds with profile_photo_status='ok' AND a storage path
  recropped: number;
  rejected: number;
  pending: number;
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const SYSTEM_PROMPT = `You are a strict gatekeeper for professional headshots on a verified fitness-professional directory.

REJECT the image unless ALL of these are true:
- It is a real photograph (not an illustration, drawing, 3D render, AI-generated cartoon, logo, icon, or text/wordmark).
- It shows exactly ONE human being.
- The face is clearly visible, roughly front-facing, well-lit, in focus.
- It is a head-and-shoulders or similar portrait — NOT a full-body, distant, or group shot.
- The face is not heavily obscured (e.g. both sunglasses AND a hat covering the face = reject; mask covering most of face = reject).

If you reject, set isHeadshot=false and pick the single best matching category and a short, user-facing reason in plain English (1 sentence).

If you accept, set isHeadshot=true and return a faceBox with normalized coordinates (0..1) relative to the original image. The faceBox MUST enclose the WHOLE HEAD — from the top of the hair (NOT the eyebrows) down to the chin, and from the left ear to the right ear. Always include any hair above the forehead. Quality score 1-5 reflects sharpness, lighting, and framing.

Return ONLY valid JSON.`;

const VALIDATION_SCHEMA = `{
  "isHeadshot": boolean,
  "rejectionReason": string | null,
  "rejectionCategory": "logo" | "illustration" | "group" | "full_body" | "face_obscured" | "low_quality" | "not_a_person" | "other" | null,
  "faceBox": { "x": number, "y": number, "width": number, "height": number } | null,
  "qualityScore": 1 | 2 | 3 | 4 | 5
}`;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Response("Forbidden", { status: 403 });
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                       */
/* -------------------------------------------------------------------------- */

export const getBdRecropStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BdRecropStats> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [okRows, recrop] = await Promise.all([
      supabaseAdmin
        .from("bd_member_seed")
        .select("bd_member_id, recrop_status", { count: "exact" })
        .eq("profile_photo_status", "ok")
        .not("profile_photo_storage_path", "is", null),
      supabaseAdmin
        .from("bd_member_seed")
        .select("recrop_status")
        .eq("profile_photo_status", "ok")
        .not("profile_photo_storage_path", "is", null),
    ]);

    const total = okRows.count ?? 0;
    let recropped = 0;
    let rejected = 0;
    for (const r of recrop.data ?? []) {
      if (r.recrop_status === "ok") recropped++;
      else if (r.recrop_status === "rejected") rejected++;
    }
    return {
      total_ok_bd: total,
      recropped,
      rejected,
      pending: Math.max(0, total - recropped - rejected),
    };
  });

/* -------------------------------------------------------------------------- */
/* Candidates                                                                  */
/* -------------------------------------------------------------------------- */

export const getBdRecropCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(200).default(25) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<BdRecropCandidate[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("bd_member_seed")
      .select(
        "bd_member_id, first_name, last_name, claimed_user_id, profile_photo_storage_path",
      )
      .eq("profile_photo_status", "ok")
      .eq("recrop_status", "pending")
      .not("claimed_user_id", "is", null)
      .not("profile_photo_storage_path", "is", null)
      .order("bd_member_id", { ascending: true })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const base = process.env.SUPABASE_URL!.replace(/\/+$/, "");
    return (rows ?? []).map((r) => ({
      bd_member_id: r.bd_member_id as number,
      user_id: r.claimed_user_id as string,
      full_name:
        `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || `Member ${r.bd_member_id}`,
      src_path: r.profile_photo_storage_path as string,
      src_public_url: `${base}/storage/v1/object/public/avatars/${r.profile_photo_storage_path}`,
    }));
  });

/* -------------------------------------------------------------------------- */
/* Validate (admin variant — no folder restriction)                            */
/* -------------------------------------------------------------------------- */

type ValidationResult =
  | {
      ok: true;
      faceBox: { x: number; y: number; width: number; height: number };
      qualityScore: 1 | 2 | 3 | 4 | 5;
    }
  | { ok: false; reason: string; category: string };

export const validateBdAvatarBytes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        path: z.string().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ValidationResult> => {
    await assertAdmin(context);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: file, error } = await supabaseAdmin.storage
      .from("avatars")
      .download(data.path);
    if (error || !file) throw new Error(`Download failed: ${error?.message ?? "unknown"}`);

    const mime = file.type || "image/jpeg";
    const arr = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < arr.length; i += chunk) {
      bin += String.fromCharCode.apply(null, Array.from(arr.subarray(i, i + chunk)));
    }
    const dataUrl = `data:${mime};base64,${btoa(bin)}`;

    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nSchema:\n${VALIDATION_SCHEMA}` },
          {
            role: "user",
            content: [
              { type: "text", text: "Classify this image per the schema." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI validation failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }

    if (!parsed.isHeadshot) {
      return {
        ok: false,
        reason: (parsed.rejectionReason ?? "").toString().trim() || "Not a headshot.",
        category: (parsed.rejectionCategory ?? "other").toString(),
      };
    }
    const box = parsed.faceBox;
    const safe =
      box && ["x", "y", "width", "height"].every((k) => typeof box[k] === "number")
        ? {
            x: Math.max(0, Math.min(1, box.x)),
            y: Math.max(0, Math.min(1, box.y)),
            width: Math.max(0.05, Math.min(1, box.width)),
            height: Math.max(0.05, Math.min(1, box.height)),
          }
        : { x: 0.15, y: 0.1, width: 0.7, height: 0.8 };
    return {
      ok: true,
      faceBox: safe,
      qualityScore: (parsed.qualityScore as 1 | 2 | 3 | 4 | 5) ?? 3,
    };
  });

/* -------------------------------------------------------------------------- */
/* Commit cropped JPEG                                                         */
/* -------------------------------------------------------------------------- */

export const commitBdRecrop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bd_member_id: z.number().int().positive(),
        user_id: z.string().uuid(),
        jpeg_base64: z.string().min(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const bin = atob(data.jpeg_base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.byteLength > 4 * 1024 * 1024) {
      throw new Error("Cropped JPEG exceeds 4MB");
    }

    const ts = Date.now();
    const key = `${data.user_id}/avatar-bdrecrop-${data.bd_member_id}-${ts}.jpg`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("avatars")
      .upload(key, bytes, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: true,
      });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("avatars")
      .createSignedUrl(key, 60 * 60 * 24 * 365);
    if (signErr || !signed?.signedUrl) {
      throw new Error(`Sign failed: ${signErr?.message ?? "no url"}`);
    }

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: signed.signedUrl, avatar_is_ai_generated: false })
      .eq("id", data.user_id);
    if (profErr) throw new Error(`Profile update failed: ${profErr.message}`);

    const { error: seedErr } = await supabaseAdmin
      .from("bd_member_seed")
      .update({
        recrop_status: "ok",
        recrop_reason: null,
        recropped_at: new Date().toISOString(),
      })
      .eq("bd_member_id", data.bd_member_id);
    if (seedErr) throw new Error(`Seed update failed: ${seedErr.message}`);

    return { ok: true, url: signed.signedUrl };
  });

/* -------------------------------------------------------------------------- */
/* Reject — clear avatar_url so card falls back to initials                    */
/* -------------------------------------------------------------------------- */

export const rejectBdRecrop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bd_member_id: z.number().int().positive(),
        user_id: z.string().uuid(),
        reason: z.string().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", data.user_id);
    if (profErr) throw new Error(`Profile clear failed: ${profErr.message}`);

    const { error: seedErr } = await supabaseAdmin
      .from("bd_member_seed")
      .update({
        recrop_status: "rejected",
        recrop_reason: data.reason.slice(0, 500),
        recropped_at: new Date().toISOString(),
      })
      .eq("bd_member_id", data.bd_member_id);
    if (seedErr) throw new Error(`Seed update failed: ${seedErr.message}`);

    return { ok: true };
  });
