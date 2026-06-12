import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type FaceBox = { x: number; y: number; width: number; height: number };

export type AvatarValidation =
  | {
      ok: true;
      faceBox: FaceBox; // normalized 0..1 relative to original image
      qualityScore: 1 | 2 | 3 | 4 | 5;
    }
  | {
      ok: false;
      reason: string;
      category:
        | "logo"
        | "illustration"
        | "group"
        | "full_body"
        | "face_obscured"
        | "low_quality"
        | "not_a_person"
        | "other";
    };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function requireLovableKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}

async function downloadBucketFileAsDataUrl(
  bucket: string,
  path: string,
): Promise<{ dataUrl: string; mime: string; bytes: ArrayBuffer }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !data) throw error ?? new Error("Failed to download file");
  const mime = data.type || "image/jpeg";
  const bytes = await data.arrayBuffer();
  // base64 encode
  let bin = "";
  const arr = new Uint8Array(bytes);
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(arr.subarray(i, i + chunk)));
  }
  const b64 = btoa(bin);
  return { dataUrl: `data:${mime};base64,${b64}`, mime, bytes };
}

async function signOneYearUrl(path: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("avatars")
    .createSignedUrl(path, ONE_YEAR_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

/* -------------------------------------------------------------------------- */
/* Validate avatar (vision)                                                    */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You are a strict gatekeeper for professional headshots on a verified fitness-professional directory.

REJECT the image unless ALL of these are true:
- It is a real photograph (not an illustration, drawing, 3D render, AI-generated cartoon, logo, icon, or text/wordmark).
- It shows exactly ONE human being.
- The face is clearly visible, roughly front-facing, well-lit, in focus.
- It is a head-and-shoulders or similar portrait — NOT a full-body, distant, or group shot.
- The face is not heavily obscured (e.g. both sunglasses AND a hat covering the face = reject; mask covering most of face = reject).

If you reject, set isHeadshot=false and pick the single best matching category and a short, user-facing reason in plain English (1 sentence, no jargon, no markdown).

If you accept, set isHeadshot=true and return a faceBox with normalized coordinates (0..1) relative to the original image. The faceBox MUST enclose the WHOLE HEAD — from the top of the hair (NOT the eyebrows) down to the chin, and from the left ear to the right ear. Always include any hair above the forehead. NEVER return a box that only covers the lower face, mouth, or chin. Quality score 1-5 reflects sharpness, lighting, and framing.

Return ONLY valid JSON matching the schema. No prose.`;

const VALIDATION_SCHEMA = `{
  "isHeadshot": boolean,
  "rejectionReason": string | null,
  "rejectionCategory": "logo" | "illustration" | "group" | "full_body" | "face_obscured" | "low_quality" | "not_a_person" | "other" | null,
  "faceBox": { "x": number, "y": number, "width": number, "height": number } | null,
  "qualityScore": 1 | 2 | 3 | 4 | 5
}`;

export const validateAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ path: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<AvatarValidation> => {
    const { userId } = context;
    // Safety: path must live under the user's folder.
    if (!data.path.startsWith(`${userId}/`)) {
      throw new Error("Forbidden: path is not in your folder.");
    }

    const key = requireLovableKey();
    const { dataUrl } = await downloadBucketFileAsDataUrl("avatars", data.path);

    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
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
    let parsed: {
      isHeadshot?: boolean;
      rejectionReason?: string | null;
      rejectionCategory?: AvatarValidation extends { ok: false } ? string : string;
      faceBox?: FaceBox | null;
      qualityScore?: number;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }

    if (!parsed.isHeadshot) {
      // Clean up the uploaded temp file on rejection.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.storage.from("avatars").remove([data.path]);
      const cat = (parsed.rejectionCategory ?? "other") as
        | "logo"
        | "illustration"
        | "group"
        | "full_body"
        | "face_obscured"
        | "low_quality"
        | "not_a_person"
        | "other";
      return {
        ok: false,
        reason:
          parsed.rejectionReason?.toString().trim() ||
          "This image doesn't look like a professional headshot.",
        category: cat,
      };
    }

    const box = parsed.faceBox;
    if (
      !box ||
      typeof box.x !== "number" ||
      typeof box.y !== "number" ||
      typeof box.width !== "number" ||
      typeof box.height !== "number"
    ) {
      // Accept but no usable box — fall back to centered square (handled client side).
      return {
        ok: true,
        faceBox: { x: 0.15, y: 0.1, width: 0.7, height: 0.8 },
        qualityScore: (parsed.qualityScore as 1 | 2 | 3 | 4 | 5) ?? 3,
      };
    }

    return {
      ok: true,
      faceBox: {
        x: Math.max(0, Math.min(1, box.x)),
        y: Math.max(0, Math.min(1, box.y)),
        width: Math.max(0.05, Math.min(1, box.width)),
        height: Math.max(0.05, Math.min(1, box.height)),
      },
      qualityScore: (parsed.qualityScore as 1 | 2 | 3 | 4 | 5) ?? 3,
    };
  });

/* -------------------------------------------------------------------------- */
/* Process avatar — REMOVED                                                    */
/* -------------------------------------------------------------------------- */
/* The server-side crop used Jimp, whose PNG decoder (pngjs → pako Inflate)
   is incompatible with the Cloudflare Workers runtime and threw
   "Class constructor Inflate cannot be invoked without 'new'".
   Cropping now happens in the browser (canvas) inside the upload flow,
   which uploads the final square JPEG directly to storage. */

/* -------------------------------------------------------------------------- */
/* Commit avatar (sign + write to profiles)                                    */
/* -------------------------------------------------------------------------- */

export const commitAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        path: z.string().min(1).max(500),
        isAiGenerated: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.path.startsWith(`${userId}/`)) {
      throw new Error("Forbidden: path is not in your folder.");
    }
    const url = await signOneYearUrl(data.path);
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: url,
        avatar_is_ai_generated: data.isAiGenerated ?? false,
      })
      .eq("id", userId);
    if (error) throw error;
    return { url };
  });

/* -------------------------------------------------------------------------- */
/* Regenerate avatar (AI portrait)                                             */
/* -------------------------------------------------------------------------- */

/* Note: post-AI face-detect + crop was removed — Jimp's PNG decoder
   (pngjs → pako Inflate) is not compatible with the Cloudflare Workers
   runtime and throws "Class constructor Inflate cannot be invoked
   without 'new'". The image model is prompted for a square 1:1
   head-and-shoulders portrait, so we save its output directly. */

export const regenerateAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sourcePath: z.string().min(1).max(500),
        attempt: z.number().int().min(0).max(20).optional(),
      })
      .parse(d),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{ path: string; url: string }> => {
      const { userId } = context;
      if (!data.sourcePath.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: source path is not in your folder.");
      }
      const key = requireLovableKey();
      const { dataUrl } = await downloadBucketFileAsDataUrl(
        "avatars",
        data.sourcePath,
      );

      // Per-attempt variation. Vary BACKDROP TONE only. Identity, wardrobe
      // and lighting stay constant so the directory looks consistent across
      // 400 trainers without making everyone look like the same person.
      const attempt = data.attempt ?? 0;
      const backdropVariants = [
        "deep charcoal falling to warm grey, very subtle vignette",
        "cool slate falling to soft graphite, very subtle vignette",
        "warm taupe falling to deep brown, very subtle vignette",
        "neutral mid-grey seamless studio paper, very subtle vignette",
        "soft near-black with a gentle radial falloff, very subtle vignette",
      ];
      const backdrop = backdropVariants[attempt % backdropVariants.length];

      const callImageModel = async (
        textPrompt: string,
        inputDataUrl: string,
      ): Promise<{ rawArr: Uint8Array; mime: string }> => {
        const res = await fetch(`${GATEWAY}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            modalities: ["image", "text"],
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: textPrompt },
                  { type: "image_url", image_url: { url: inputDataUrl } },
                ],
              },
            ],
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`AI regenerate failed: ${res.status} ${text.slice(0, 300)}`);
        }
        const body = (await res.json()) as {
          choices?: Array<{
            message?: {
              images?: Array<{ image_url?: { url?: string } }>;
              content?: string;
            };
          }>;
        };
        const imgUrl = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imgUrl || !imgUrl.startsWith("data:")) {
          throw new Error("AI did not return an image.");
        }
        const commaIdx = imgUrl.indexOf(",");
        const meta = imgUrl.slice(5, commaIdx);
        const b64 = imgUrl.slice(commaIdx + 1);
        const mime = meta.split(";")[0] || "image/png";
        const bin = atob(b64);
        const rawArr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) rawArr[i] = bin.charCodeAt(i);
        return { rawArr, mime };
      };

      // Single-pass "studio retouch". Identity, wardrobe, hair and age are
      // preserved exactly — we only replace the background and clean up the
      // lighting so a self-shot phone photo reads like a competent
      // photographer took it. No industrial gym. No wardrobe recolour.
      const prompt = `Re-render this exact person as a clean, professional studio headshot — as if a competent portrait photographer reshot the same person, on the same day, in their current clothes, in a neutral studio. Square 1:1, head-and-shoulders, eyeline ~38% from the top with ~12% headroom.

Identity lock (CRITICAL — do not change ANY of these):
- The person in the output must be unmistakably the same individual as the source photo.
- Preserve face shape, jawline, cheekbones, nose, lips, eye shape, eye colour, eyebrow shape, hairline, hair colour, hair texture, hair length, hair STYLE (do not restyle, do not shorten, do not change parting), facial hair (beard/stubble exactly as in source), skin tone, skin texture, wrinkles, age, ethnicity, gender presentation, and build EXACTLY as in the source.
- Do NOT de-age. Do NOT slim or reshape the face. Do NOT smooth or beautify the skin. Keep real skin texture, real pores, natural lines and blemishes.
- Output must read forward — never horizontally flip or mirror the face.

Wardrobe lock (CRITICAL):
- Keep the subject's ORIGINAL garment from the source photo — same garment type, same colour, same fit, same neckline, same fabric, same visible logos/branding (if any).
- Do NOT recolour the garment. A coral top stays coral. A North Face fleece stays a North Face fleece. A white t-shirt stays white.
- Do NOT swap the garment for a "fitness" outfit. Do NOT add logos, wordmarks, text, embroidery or badges that were not in the source.

Background:
- Replace whatever is behind the subject with a soft neutral studio backdrop: ${backdrop}. No props. No furniture. No gym equipment. No windows. No text.

Lighting:
- Soft large key light from camera-left at ~45°, gentle fill from camera-right, subtle hair light. Natural skin tones. No heavy orange rim. No split or Rembrandt drama. No coloured gels. Sharp focus on the eyes.

Expression:
- Keep the subject's expression from the source where possible. If the source is smiling, keep the smile. If the source is neutral, keep it neutral. Relaxed shoulders. Eyes to lens.

Output quality:
- Photoreal, crisp, true-to-life colour and skin texture. Looks like a real DSLR portrait, not an AI render.
- NO illustration, NO painting, NO 3D, NO cartoon, NO smoothing filter, NO HDR look, NO heavy film grain.

Negative prompt (do NOT do any of these):
- No industrial gym, no warehouse, no rack silhouettes, no cage lights, no orange rim light, no warm orange ambient wash.
- No wardrobe change, no garment recolour, no added logos or text.
- No age change, no hair restyle, no face slimming, no plastic-skin beauty retouch.
- No mirroring or horizontal flip.`;

      const { rawArr, mime } = await callImageModel(prompt, dataUrl);

      const ext = mime === "image/jpeg" ? "jpg" : "png";
      const path = `${userId}/avatar-ai-${Date.now()}.${ext}`;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: upErr } = await supabaseAdmin.storage
        .from("avatars")
        .upload(path, rawArr, {
          contentType: mime,
          upsert: true,
          cacheControl: "31536000",
        });
      if (upErr) throw upErr;

      const url = await signOneYearUrl(path);
      return { path, url };
    },
  );
