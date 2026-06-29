// Hero image pipeline for the trainer Website editor.
// - uploadHeroFromBase64: writes a re-encoded 1080x1920 JPEG to the
//   shop-front-hero storage bucket and returns the public URL.
// - generateHeroFromAi: calls Lovable AI Gateway (Gemini Nano Banana 2)
//   with the trainer's profile avatar as a reference image, returns the
//   generated PNG as base64 for the client to crop.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

const AiInput = z.object({
  prompt: z.string().trim().min(3).max(400),
});

const HERO_SYSTEM = `Create a photorealistic editorial hero photograph of the SAME person shown in the reference image — match their face, build, hair, and skin tone exactly. Render them as a professional fitness coach.

HARD RULES:
- Portrait orientation, 9:16 aspect ratio, full-body or 3/4 portrait composition.
- They MUST be wearing a t-shirt or polo with a visible REAL STITCHED EMBROIDERED "REPS" wordmark on the chest. ALL CAPS, white thread, crisp medium weight. Visible thread texture — never a flat decal or sticker.
- Photographic, natural lighting, sharp focus, shallow depth of field.
- No text overlays, no graphic logos, no watermarks, no captions.
- Single subject only — the person from the reference.
- Premium gym, studio or outdoor training environment as appropriate to the brief.`;

export const generateHeroFromAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((data) => AiInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway is not configured");

    // Pull the trainer's avatar to use as a reference (so the generated
    // hero looks like them, not a stock face).
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", userId)
      .maybeSingle();

    const avatarUrl = profile?.avatar_url ?? null;
    const fullName = profile?.full_name ?? "the coach";

    const userContent: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `Coach: ${fullName}. Brief: ${data.prompt}. ${HERO_SYSTEM}`,
      },
    ];
    if (avatarUrl) {
      userContent.unshift({
        type: "image_url",
        image_url: { url: avatarUrl },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
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
