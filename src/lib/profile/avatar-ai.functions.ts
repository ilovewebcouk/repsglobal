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

/* Identity-similarity scoring (server-side gate) */

const IDENTITY_SYSTEM = `You are a strict face-identity verifier. Compare two photos and decide if they show the SAME individual.

Score 1-5 (5 = unmistakably the same person; 4 = clearly the same with very minor cosmetic differences; 3 = probably the same but with notable drift; 2 = ambiguous; 1 = clearly a different person).

Check: overall face shape, jawline, cheekbone structure, nose shape, lip shape, eye shape and colour, eyebrow shape, hairline, hair colour/texture, facial hair, skin tone, apparent age, ethnicity, gender presentation.

Return ONLY valid JSON: { "score": 1|2|3|4|5, "reason": "<one sentence>" }`;

async function scoreIdentity(
  originalDataUrl: string,
  generatedDataUrl: string,
  apiKey: string,
): Promise<{ score: number; reason: string }> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: IDENTITY_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Image A (original source):" },
            { type: "image_url", image_url: { url: originalDataUrl } },
            { type: "text", text: "Image B (AI re-render):" },
            { type: "image_url", image_url: { url: generatedDataUrl } },
            { type: "text", text: "Score per the schema." },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return { score: 3, reason: "verifier unavailable" };
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = body.choices?.[0]?.message?.content ?? "";
  try {
    const p = JSON.parse(raw) as { score?: number; reason?: string };
    const s = Math.max(1, Math.min(5, Math.round(Number(p.score) || 3)));
    return { score: s, reason: (p.reason ?? "").toString().slice(0, 200) };
  } catch {
    return { score: 3, reason: "unparseable verifier response" };
  }
}

const EDITORIAL_PROMPT_BASE = `Re-render this exact person as a premium editorial portrait for a verified fitness-professional directory. Target aesthetic: world-class editorial photography — the look of a Vogue / Esquire / Equinox brand portrait. Real DSLR, real photographer, real studio. NOT an AI portrait filter. NOT a LinkedIn auto-enhance. NOT moody fashion-campaign. NOT cinematic film-still.

Identity lock (NON-NEGOTIABLE — the output must be unmistakably the same human):
- Preserve face shape, jawline, cheekbones, nose, lips, eye shape, eye colour, eyebrow shape, hairline, hair colour, hair texture, hair length, facial hair, skin tone, apparent age, ethnicity, gender presentation, and build EXACTLY as in the source.
- Do not slim, smooth, beautify, restructure, re-age, lighten, or stylise the face. No "ideal" features. No plastic skin. Keep real skin texture, real pores, natural blemishes, real freckles, real asymmetry.
- If you cannot preserve identity, return the closest possible likeness — do not invent a new face.

Clothing (their own, tidied):
- KEEP the subject's own clothing — same garment type, same colour, same neckline, same fit.
- You MAY tidy: remove wrinkles, lint, stains, and any visible third-party brand logos/text on the garment.
- Do NOT restyle, recolour, redesign, swap, or replace the garment.
- Do NOT add any logo, wordmark, text, embroidery, badge, graphic, or branding of any kind. The garment must be completely unbranded in the output.

Background (contextual fitness environment — heavily defocused):
- Place the subject inside a real premium training environment, but render it HEAVILY out of focus (shallow depth of field, f/1.4–f/2 look). The environment must read as atmosphere, NEVER as a recognisable scene.
- Pick whichever fits the subject best (vary across portraits — do NOT default to the same one every time):
  • Dark high-end gym floor: hints of a power rack, plate tree, dumbbell row, or turf lane dissolving into shadow.
  • Boutique studio: warm tungsten pools, blurred mirrors, soft concrete/brick wall, ambient cable highlights.
  • Outdoor athletic: pre-dawn track, shaded park, stadium tunnel, sea wall — natural cool ambient light.
  • Combat / strength loft: blurred heavy bag, chalk haze, industrial windows far behind.
- Dominant tonality must stay DARK and moody (charcoal, near-black, deep slate, warm shadow) so the face is the hero. NO bright daylit gyms. NO white walls. NO mid-grey seamless studio backdrops. NO commercial chain-gym look. NO clinic / corporate office / home interior.
- Background must contain NO readable text, NO logos, NO brand marks, NO other people, NO equipment in sharp focus.
- Subject is razor-sharp; background bokeh is creamy and continuous with gentle coloured highlights. Subject cleanly separated with natural falloff and a faint atmospheric haze.

Lighting (premium editorial):
- Directional soft key light from camera-left at roughly 45°, short-side lit, sculpting the jaw and cheekbone.
- Subtle fill on the shadow side so the face stays readable but retains dimension.
- Gentle rim/hair light from behind-right to separate the subject from the backdrop.
- Sharp focus on the closer eye. Catchlights present in both eyes.
- NOT flat frontal wash. NOT high-key beauty-dish look. NOT harsh single-source. NOT dramatic film-noir.

Framing & pose:
- Square 1:1. Head-and-shoulders. Shoulders square to camera, weight forward, chest open.
- Head level, chin slightly forward and down (not up), eyes directly to lens.
- Small headroom above the hair; both shoulders fully visible.

Expression:
- Warm, grounded, confident. Closed-mouth micro-smile or relaxed natural smile. Eyes engaged.
- {{VARIATION}}
- NOT stern. NOT scowling. NOT laughing. NOT posing hard.

Output quality:
- Photoreal, crisp, high-detail, true-to-life colour. Looks like a real medium-format DSLR portrait by a competent professional photographer.
- NO illustration, NO painting, NO 3D, NO cartoon, NO smoothing filter, NO HDR look, NO film-grain overlay, NO Instagram preset, NO over-saturation.`;

async function generateOnce(
  sourceDataUrl: string,
  variation: string,
  apiKey: string,
): Promise<{ dataUrl: string; mime: string; bytes: Uint8Array }> {
  const prompt = EDITORIAL_PROMPT_BASE.replace("{{VARIATION}}", variation);
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: sourceDataUrl } },
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
    choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
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
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { dataUrl: imgUrl, mime, bytes };
}

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
    }): Promise<{
      path: string;
      url: string;
      identityScore: number;
      identityReason: string;
      attemptsUsed: number;
    }> => {
      const { userId } = context;
      if (!data.sourcePath.startsWith(`${userId}/`)) {
        throw new Error("Forbidden: source path is not in your folder.");
      }
      const key = requireLovableKey();
      const { dataUrl: sourceDataUrl } = await downloadBucketFileAsDataUrl(
        "avatars",
        data.sourcePath,
      );

      const variants = [
        "Head perfectly square to camera, micro-smile, eyes to lens.",
        "Head turned ~3° to camera-left, warm half-smile, eyes to lens.",
        "Head turned ~3° to camera-right, warm half-smile, eyes to lens.",
      ];

      const MAX_ATTEMPTS = 3;
      const THRESHOLD = 4;
      const startAttempt = data.attempt ?? 0;
      let best: {
        bytes: Uint8Array;
        mime: string;
        score: number;
        reason: string;
      } | null = null;
      let attemptsUsed = 0;

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        attemptsUsed++;
        const variation = variants[(startAttempt + i) % variants.length];
        const gen = await generateOnce(sourceDataUrl, variation, key);
        const { score, reason } = await scoreIdentity(sourceDataUrl, gen.dataUrl, key);
        if (!best || score > best.score) {
          best = { bytes: gen.bytes, mime: gen.mime, score, reason };
        }
        if (score >= THRESHOLD) break;
      }

      if (!best) throw new Error("AI generation produced no usable result.");

      const ext = best.mime === "image/jpeg" ? "jpg" : "png";
      const path = `${userId}/avatar-ai-${Date.now()}.${ext}`;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: upErr } = await supabaseAdmin.storage
        .from("avatars")
        .upload(path, best.bytes, {
          contentType: best.mime,
          upsert: true,
          cacheControl: "31536000",
        });
      if (upErr) throw upErr;

      const url = await signOneYearUrl(path);
      return {
        path,
        url,
        identityScore: best.score,
        identityReason: best.reason,
        attemptsUsed,
      };
    },
  );

