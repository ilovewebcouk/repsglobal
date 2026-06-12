import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const insuranceInput = z.object({
  provider: z.string().min(2).max(160),
  policy_number: z.string().max(120).optional().nullable(),
  cover_amount_gbp: z.number().int().min(0).max(100_000_000).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  doc_path: z.string().min(1),
});

export const saveInsurance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => insuranceInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });
    const { data: row, error } = await supabase
      .from("insurance_policies")
      .insert({
        professional_id: userId,
        provider: data.provider,
        policy_number: data.policy_number ?? null,
        cover_amount_gbp: data.cover_amount_gbp ?? null,
        start_date: data.start_date ?? null,
        expiry_date: data.expiry_date,
        doc_path: data.doc_path,
        status: "pending",
      } as never)
      .select("id, status, expiry_date, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const myInsurance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("insurance_policies")
      .select("*")
      .eq("professional_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const getInsuranceForPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ professional_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("insurance_policies")
      .select("*")
      .eq("professional_id", data.professional_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return row;
  });

export const getDocSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ bucket: z.enum(["identity-docs", "insurance-docs", "verification-docs"]), path: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    // Owner can read their own files via RLS-scoped supabase; admins use admin client
    if (isAdmin) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed, error } = await supabaseAdmin.storage.from(data.bucket).createSignedUrl(data.path, 600);
      if (error) throw new Error(error.message);
      return { url: signed.signedUrl };
    }
    // Non-admin: only their own folder (path starts with userId/)
    if (!data.path.startsWith(`${userId}/`)) throw new Error("Forbidden");
    const { data: signed, error } = await supabase.storage.from(data.bucket).createSignedUrl(data.path, 600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

/* -------------------------------------------------------------------------- */
/* Generic upload to identity-docs / insurance-docs                           */
/* -------------------------------------------------------------------------- */

const uploadInput = z.object({
  bucket: z.enum(["identity-docs", "insurance-docs"]),
  file_data_url: z.string().startsWith("data:").max(15_000_000),
  filename: z.string().min(1).max(200),
});

export const uploadVerificationAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const match = data.file_data_url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid file payload");
    const [, mime, b64] = match;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(hashBuf), (b) => b.toString(16).padStart(2, "0")).join("");
    const ext = data.filename.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${userId}/${Date.now()}-${sha256.slice(0, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(data.bucket)
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error(error.message);
    return { path, sha256 };
  });
