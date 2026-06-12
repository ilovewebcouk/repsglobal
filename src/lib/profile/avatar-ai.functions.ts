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

If you accept, set isHeadshot=true and return a faceBox with normalized coordinates (0..1) relative to the original image, tightly framing the face (forehead to chin, ear to ear). Quality score 1-5 reflects sharpness, lighting, and framing.

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
/* Process avatar (server-side crop + resize)                                  */
/* -------------------------------------------------------------------------- */

export const processAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tempPath: z.string().min(1).max(500),
        faceBox: z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ path: string }> => {
    const { userId } = context;
    if (!data.tempPath.startsWith(`${userId}/`)) {
      throw new Error("Forbidden: path is not in your folder.");
    }

    const { Jimp } = await import("jimp");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { bytes } = await downloadBucketFileAsDataUrl("avatars", data.tempPath);
    const img = await Jimp.read(Buffer.from(bytes));
    const W = img.bitmap.width;
    const H = img.bitmap.height;

    // Compute square crop centred on face, padded ~60% around the face box.
    const fx = data.faceBox.x * W;
    const fy = data.faceBox.y * H;
    const fw = data.faceBox.width * W;
    const fh = data.faceBox.height * H;
    const cx = fx + fw / 2;
    const cy = fy + fh / 2;
    let side = Math.max(fw, fh) * 1.6;
    side = Math.min(side, Math.min(W, H));
    let sx = cx - side / 2;
    let sy = cy - side / 2;
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx + side > W) sx = W - side;
    if (sy + side > H) sy = H - side;

    const sideR = Math.round(side);
    img.crop({ x: Math.round(sx), y: Math.round(sy), w: sideR, h: sideR });
    if (sideR > 1024) img.resize({ w: 1024, h: 1024 });
    const jpegBuf = await img.getBuffer("image/jpeg", { quality: 88 });

    const finalPath = `${userId}/avatar-${Date.now()}.jpg`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("avatars")
      .upload(finalPath, jpegBuf, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });
    if (upErr) throw upErr;

    // Best-effort cleanup of the original upload.
    await supabaseAdmin.storage.from("avatars").remove([data.tempPath]).catch(() => {});

    return { path: finalPath };
  });

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

export const regenerateAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ sourcePath: z.string().min(1).max(500) }).parse(d),
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

      const prompt = `Re-render this person as a cinematic, editorial fitness-professional portrait for a premium directory listing. Match the look of high-end fitness editorial photography (think Lululemon / Nike campaign portraits): photoreal, moody, atmospheric — NOT a studio headshot, NOT a school portrait, NOT a yearbook photo.

Identity (lock — do not change):
- Same face, age, ethnicity, gender presentation, hair, skin tone, and approximate build as the source photo. The person must be unmistakably the same individual.

Framing:
- Square 1:1 aspect, tight head-and-shoulders crop.
- Subject facing the camera straight on, eyes to lens, calm confident expression, relaxed shoulders.

Lighting:
- Soft directional key light on the face plus a subtle rim/edge light separating the subject from the background.
- Cinematic, editorial, photoreal. Gentle film grain. Muted, low-key palette.
- NO flat studio softbox, NO ring-light look, NO bright even lighting, NO yearbook lighting.

Background:
- Dark, heavily blurred gym / training-floor scene behind the subject — racks, plates, turf, brick, low-key tones, warm or cool ambient highlights. Shallow depth of field, creamy bokeh.
- The background must read as a real training environment, not a backdrop.
- NO neutral grey sweep, NO charcoal studio backdrop, NO plain wall, NO white background, NO seamless paper.

Clothing:
- KEEP the subject's own clothing exactly as it appears in the source photo (same garment, same colour, same style).
- Do NOT swap, replace, restyle, or re-colour their clothing.
- Do NOT add any T-shirt, polo, jersey, tank, or branded garment.
- NO logos, NO wordmarks, NO text, NO embroidery, NO "REPS" lettering, NO numbers, NO graphics on the clothing.

Overall:
- Photorealistic, high detail, professional fitness editorial.
- NO illustration, NO cartoon, NO 3D render, NO painterly style.
- NO school-portrait, NO yearbook, NO flat backdrop, NO studio sweep, NO 1990s portrait lighting, NO added branded clothing.`;

      const res = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          modalities: ["image", "text"],
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
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
      // data:image/png;base64,XXXX
      const commaIdx = imgUrl.indexOf(",");
      const meta = imgUrl.slice(5, commaIdx); // image/png;base64
      const b64 = imgUrl.slice(commaIdx + 1);
      const mime = meta.split(";")[0] || "image/png";
      const ext = mime === "image/jpeg" ? "jpg" : "png";

      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);

      const path = `${userId}/avatar-ai-${Date.now()}.${ext}`;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: upErr } = await supabaseAdmin.storage
        .from("avatars")
        .upload(path, arr, { contentType: mime, upsert: true, cacheControl: "31536000" });
      if (upErr) throw upErr;

      const url = await signOneYearUrl(path);
      return { path, url };
    },
  );
