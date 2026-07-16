// Service-card image pipeline (square 1080x1080).
// Mirrors the hero pipeline but locked to 1:1 instead of 9:16.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

const UploadInput = z.object({
  dataUrl: z.string().min(20).max(8 * 1024 * 1024),
});

export const uploadServiceImageFromBase64 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((data) => UploadInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(supabase, userId);
    const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(data.dataUrl);
    if (!match) throw new Error("Invalid image data URL");
    const ext = match[1].toLowerCase() === "png" ? "png" : match[1].toLowerCase() === "webp" ? "webp" : "jpg";
    const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 2 * 1024 * 1024) {
      throw new Error("Image is over 2 MB after encoding — try a smaller source");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const objectPath = `${userId}/service-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("website-services")
      .upload(objectPath, bytes, { contentType, upsert: true, cacheControl: "31536000" });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: pub } = supabaseAdmin.storage.from("website-services").getPublicUrl(objectPath);
    return { url: pub.publicUrl };
  });

// ---------------------------------------------------------------------------
// AI generation — square service-card image
// ---------------------------------------------------------------------------

const Style = z.enum(["editorial", "studio", "action"]);
const AiInput = z.object({
  prompt: z.string().trim().min(3).max(400),
  style: Style.optional().default("editorial"),
});

const STYLE_DIRECTION: Record<z.infer<typeof Style>, string> = {
  editorial: `STYLE: Cinematic editorial fitness photography. Golden-hour or late-afternoon natural light, soft directional key with a warm rim, filmic falloff into the shadows. Warm highlights, slightly cool shadows, subtle teal-orange grade, gentle film grain. 35mm lens feel, shallow depth of field (f/2). Premium private studio, industrial gym, or outdoor training environment — never a bright commercial chain-gym.`,
  studio: `STYLE: High-end studio shoot. Dark seamless backdrop, single hard key + soft fill, dramatic falloff. Crisp contrast, magazine-cover grade. 85mm lens feel, shallow depth of field.`,
  action: `STYLE: Mid-rep training moment. Motion energy, real sweat detail, dynamic crop. 24-35mm lens feel, slight motion blur in the background only — subject is tack sharp. Warm gym practicals, cinematic colour grade.`,
};

const SERVICE_SYSTEM = `Create a single photorealistic SQUARE 1:1 image to illustrate a fitness coaching service card on a professional coach's website.

LIKENESS (image 1 = the coach, if provided):
- If a reference image is supplied, the subject must match their FACE, build, hair and skin tone exactly.

STYLE ANCHOR (image 2 = brand reference, if provided):
- Match its lighting, colour grade, framing and mood. Do not copy wardrobe, logos or any text from the anchor.

WARDROBE:
- Premium athletic-fit t-shirt, vest, polo or hoodie in a clean neutral / earth tone.
- Plain fabric. NO logos, wordmarks, graphics or printed text on the clothing.

FRAMING:
- Strict 1:1 square aspect ratio.
- Tight, editorial crop — could be a hands-on coaching moment, a kettlebell carry, a deadlift set-up, a 1-to-1 cue, a nutrition table, etc., depending on the brief.
- Subject fills 60-80% of frame. Some breathing room — this image will appear as a small square card thumbnail on the public website.

HARD NEGATIVES:
- No text overlays, captions, watermarks, brand logos, or printed graphics anywhere in the image.
- No bright commercial chain-gym backgrounds.
- No posed gym-bro selfie energy, no smiling-to-camera stock pose.
- No mirroring / horizontal flips.
- Single subject focus.`;

async function loadStyleAnchorBase64(): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), "src/assets/coach-james-coaching.jpg"),
    path.resolve(process.cwd(), "public/assets/coach-james-coaching.jpg"),
  ];
  for (const p of candidates) {
    try {
      const buf = await readFile(p);
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      /* try next */
    }
  }
  return null;
}

export const generateServiceImageFromAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((data) => AiInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(supabase, userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway is not configured");

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", userId)
      .maybeSingle();

    const avatarUrl = profile?.avatar_url ?? null;
    const fullName = profile?.full_name ?? "the coach";

    const styleAnchor = await loadStyleAnchorBase64();
    const styleDirection = STYLE_DIRECTION[data.style];

    const userContent: Array<Record<string, unknown>> = [];
    if (avatarUrl) userContent.push({ type: "image_url", image_url: { url: avatarUrl } });
    if (styleAnchor) userContent.push({ type: "image_url", image_url: { url: styleAnchor } });
    userContent.push({
      type: "text",
      text: `Coach: ${fullName}.
Brief from the coach: ${data.prompt}.

${styleDirection}

${SERVICE_SYSTEM}`,
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI generation is busy — try again in a moment");
      if (res.status === 402) throw new Error("AI credits exhausted for this workspace");
      throw new Error(`Image generation failed (${res.status}): ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as { data?: Array<{ b64_json?: string }>; error?: { message?: string } };
    if (json.error?.message) throw new Error(json.error.message);
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("AI did not return an image — try a different brief");

    return { dataUrl: `data:image/png;base64,${b64}` };
  });
