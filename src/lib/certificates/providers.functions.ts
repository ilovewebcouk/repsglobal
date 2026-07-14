/**
 * Admin server functions for managing training provider certificate settings
 * (centre number + certificate logo).
 *
 * The centre number is printed on issued certificates as "Centre No. <n>"
 * under the provider name. The certificate logo is drawn at the
 * `provider_logo` slot in the template field map and is enforced to be
 * exactly 160x60 px (no exceptions).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuthWithImpersonation as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware-impersonation";

export type ProviderCenterNumberDTO = {
  provider_id: string;
  provider_name: string | null;
  center_number: string | null;
  certificate_logo_url: string | null;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listProviderCenterNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderCenterNumberDTO[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Providers = professionals with account_type = 'organisation'
    const { data: pros } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("account_type", "organisation");
    const ids = ((pros ?? []) as any[]).map((r) => r.id as string);
    if (ids.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, center_number, certificate_logo_url")
      .in("id", ids)
      .order("full_name", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as any[]).map((r) => ({
      provider_id: r.id as string,
      provider_name: (r.full_name as string | null) ?? null,
      center_number: (r.center_number as string | null) ?? null,
      certificate_logo_url: (r.certificate_logo_url as string | null) ?? null,
    }));
  });

export const setProviderCenterNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        provider_id: z.string().uuid(),
        center_number: z.string().trim().max(64).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const value = data.center_number && data.center_number.length > 0 ? data.center_number : null;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ center_number: value } as never)
      .eq("id", data.provider_id);
    if (error) throw error;
    return { ok: true } as const;
  });

// ─────────────────────────────────────────────────────────── Logo upload

const REQUIRED_LOGO_W = 160;
const REQUIRED_LOGO_H = 60;
const LOGO_BUCKET = "certificate-provider-logos";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Reads intrinsic width/height from a PNG or JPEG byte stream. Workers-safe (no sharp). */
function readImageDimensions(
  bytes: Uint8Array,
): { w: number; h: number; format: "png" | "jpeg" } {
  // PNG: signature 89 50 4E 47 0D 0A 1A 0A, IHDR chunk starts at byte 8; width @16, height @20 (big-endian uint32)
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const w = dv.getUint32(16, false);
    const h = dv.getUint32(20, false);
    return { w, h, format: "png" };
  }
  // JPEG: starts FF D8; scan for SOF0/SOF2 markers (C0..CF except C4, C8, CC)
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length) {
      if (bytes[i] !== 0xff) throw new Error("Invalid JPEG");
      // skip fill bytes
      while (bytes[i] === 0xff && i < bytes.length) i++;
      const marker = bytes[i];
      i++;
      if (marker === 0xd8 || marker === 0xd9) continue; // SOI/EOI, no length
      const len = (bytes[i] << 8) | bytes[i + 1];
      if (
        (marker >= 0xc0 && marker <= 0xcf) &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const h = (bytes[i + 3] << 8) | bytes[i + 4];
        const w = (bytes[i + 5] << 8) | bytes[i + 6];
        return { w, h, format: "jpeg" };
      }
      i += len;
    }
    throw new Error("Could not read JPEG dimensions");
  }
  throw new Error("Unsupported image format — use PNG or JPEG");
}

export const setProviderCertificateLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        provider_id: z.string().uuid(),
        data_base64: z.string().min(1),
        mime: z.enum(["image/png", "image/jpeg"]),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    const bytes = base64ToBytes(data.data_base64);
    // Hard cap: certificate logos are tiny — reject anything absurd
    if (bytes.length > 2 * 1024 * 1024) throw new Error("Logo file too large (max 2MB)");

    const dims = readImageDimensions(bytes);
    if (dims.w !== REQUIRED_LOGO_W || dims.h !== REQUIRED_LOGO_H) {
      throw new Error(
        `Logo must be exactly ${REQUIRED_LOGO_W}×${REQUIRED_LOGO_H} px — got ${dims.w}×${dims.h}`,
      );
    }
    if (
      (data.mime === "image/png" && dims.format !== "png") ||
      (data.mime === "image/jpeg" && dims.format !== "jpeg")
    ) {
      throw new Error("Image contents don't match the declared file type");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = data.mime === "image/png" ? "png" : "jpg";
    // Cache-bust filename so PDF renderer never picks up a stale cached logo
    const path = `${data.provider_id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(LOGO_BUCKET)
      .upload(path, bytes, { contentType: data.mime, upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: pub } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ certificate_logo_url: publicUrl } as never)
      .eq("id", data.provider_id);
    if (updateErr) throw updateErr;

    return { ok: true, url: publicUrl } as const;
  });

export const clearProviderCertificateLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ provider_id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort clean-up of stored files under the provider folder
    const { data: files } = await supabaseAdmin.storage
      .from(LOGO_BUCKET)
      .list(data.provider_id);
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from(LOGO_BUCKET)
        .remove(files.map((f) => `${data.provider_id}/${f.name}`));
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ certificate_logo_url: null } as never)
      .eq("id", data.provider_id);
    if (error) throw error;
    return { ok: true } as const;
  });
