// Hero image pipeline for the trainer Website editor.
// - uploadHeroFromBase64: writes a re-encoded 1080x1920 JPEG to the
//   shop-front-hero storage bucket and returns the public URL.
// - generateHeroFromAi: calls Lovable AI Gateway (Gemini 3 Pro Image)
//   with TWO references — the trainer's avatar (for likeness) AND the
//   locked James Carter cinematic hero (for style), returns the
//   generated PNG as base64 for the client to crop.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

const UploadInput = z.object({
  // data URL: "data:image/jpeg;base64,...."
  dataUrl: z.string().min(20).max(8 * 1024 * 1024),
});

export const uploadHeroFromBase64 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((data) => UploadInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(data.dataUrl);
    if (!match) throw new Error("Invalid image data URL");
    const ext = match[1].toLowerCase() === "png" ? "png" : match[1].toLowerCase() === "webp" ? "webp" : "jpg";
    const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 2 * 1024 * 1024) {
      throw new Error("Image is over 2 MB after encoding — try a smaller source");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${userId}/hero-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("shop-front-hero")
      .upload(path, bytes, { contentType, upsert: true, cacheControl: "31536000" });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: pub } = supabaseAdmin.storage.from("shop-front-hero").getPublicUrl(path);
    return { url: pub.publicUrl };
  });

// ---------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------

const Style = z.enum(["editorial", "studio", "action"]);
const AiInput = z.object({
  prompt: z.string().trim().min(3).max(400),
  style: Style.optional().default("editorial"),
});

const STYLE_DIRECTION: Record<z.infer<typeof Style>, string> = {
  editorial: `STYLE: Cinematic editorial fitness photography. Golden-hour or late-afternoon natural light, soft directional key with a warm rim, filmic falloff into the shadows. Warm highlights / slightly cool shadows, subtle teal-orange grade, gentle film grain. 35mm lens feel, shallow depth of field (f/2). Premium private studio, industrial gym, or outdoor training environment — never a bright commercial chain-gym. Subject confident, intentional, mid-action or grounded still.`,
  studio: `STYLE: High-end studio cover shoot. Dark seamless backdrop, single hard key + soft fill, dramatic falloff. Crisp contrast, magazine-cover grade, fabric and skin texture razor sharp. 85mm lens feel, shallow depth of field. Subject confident, direct, powerful stance.`,
  action: `STYLE: Mid-rep training moment. Motion energy, real sweat detail, dynamic crop. 24-35mm lens feel, slight motion blur in the background only — subject is tack sharp. Warm gym practical lights, cinematic colour grade.`,
};

const HERO_SYSTEM = `Create a single photorealistic 9:16 portrait hero photograph for a professional fitness coach's website.

LIKENESS (image 1 = the coach):
- The first reference image is the coach. Match their FACE, build, hair, skin tone exactly. This is non-negotiable — it must clearly be the same person.

STYLE ANCHOR (image 2 = REPs brand reference):
- The second reference image is the REPs brand style anchor. Match its lighting, colour grade, framing, mood and the REPS wordmark execution on the t-shirt. This is the quality bar.

WARDROBE (HARD RULE):
- Premium athletic-fit t-shirt or polo in a neutral / earth tone (charcoal, oat, olive, washed black, deep navy).
- Visible REAL STITCHED EMBROIDERED "REPS" wordmark on the chest. ALL CAPS, white thread, crisp medium weight (NOT extra-bold). Visible thread texture and slight raised stitching — never a flat printed decal, sticker, or pasted-on logo. Small left-chest placement OR centred chest. Reads forward (never mirrored).

FRAMING:
- Portrait orientation, strict 9:16 aspect ratio.
- Full-body or 3/4 portrait. Subject fills 60-70% of frame.
- Leave clean negative space on the LEFT for hero copy overlay.

HARD NEGATIVES:
- No text overlays, captions, watermarks, or graphic logos other than the REPS wordmark.
- No flat decals or pasted logos.
- No bright commercial chain-gym backgrounds.
- No posed gym-bro selfie energy, no smiling-to-camera stock pose.
- No mirroring / horizontal flips.
- Single subject only — the coach from image 1.`;

async function loadStyleAnchorBase64(): Promise<string | null> {
  // The locked James Carter cinematic hero — our brand quality bar.
  const candidates = [
    path.resolve(process.cwd(), "src/assets/coach-james-coaching.jpg"),
    path.resolve(process.cwd(), "public/assets/coach-james-coaching.jpg"),
  ];
  for (const p of candidates) {
    try {
      const buf = await readFile(p);
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export const generateHeroFromAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((data) => AiInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway is not configured");

    // Pull the trainer's avatar to use as a likeness reference.
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", userId)
      .maybeSingle();

    const avatarUrl = profile?.avatar_url ?? null;
    const fullName = profile?.full_name ?? "the coach";

    const styleAnchor = await loadStyleAnchorBase64();
    const styleDirection = STYLE_DIRECTION[data.style];

    // Content order matters: image 1 = likeness, image 2 = style anchor,
    // then the text brief. The system prompt names them in that order.
    const userContent: Array<Record<string, unknown>> = [];
    if (avatarUrl) {
      userContent.push({ type: "image_url", image_url: { url: avatarUrl } });
    }
    if (styleAnchor) {
      userContent.push({ type: "image_url", image_url: { url: styleAnchor } });
    }
    userContent.push({
      type: "text",
      text: `Coach: ${fullName}.
Brief from the coach: ${data.prompt}.

${styleDirection}

${HERO_SYSTEM}`,
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
