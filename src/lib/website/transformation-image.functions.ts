// Transformation (Client Results proof card) image uploader.
// Client crops to 4:3 → 1600×1200 JPEG, sends as data URL, we re-verify
// and write to the website-results bucket. Owner-scoped by folder.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

const UploadInput = z.object({
  dataUrl: z.string().min(20).max(8 * 1024 * 1024),
});

export const uploadTransformationImageFromBase64 = createServerFn({ method: "POST" })
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
    if (bytes.byteLength > 3 * 1024 * 1024) {
      throw new Error("Image is over 3 MB after encoding — try a smaller source");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const objectPath = `${userId}/result-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("website-results")
      .upload(objectPath, bytes, { contentType, upsert: true, cacheControl: "31536000" });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: pub } = supabaseAdmin.storage.from("website-results").getPublicUrl(objectPath);
    return { url: pub.publicUrl };
  });
