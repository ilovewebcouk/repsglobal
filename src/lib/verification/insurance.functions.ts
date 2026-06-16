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
    // Ownership check: doc_path must live under the caller's storage folder.
    if (!data.doc_path.startsWith(`${userId}/`)) {
      throw new Error("Forbidden: doc_path does not belong to you");
    }
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

/* -------------------------------------------------------------------------- */
/* AI extraction — mirrors the certificate extractor                          */
/* -------------------------------------------------------------------------- */

const InsuranceExtractionSchema = z.object({
  provider: z.string().nullable(),
  policy_number: z.string().nullable(),
  cover_amount_gbp: z.number().int().nullable(), // total cover in £ (NOT millions)
  start_date: z.string().nullable(), // YYYY-MM-DD
  expiry_date: z.string().nullable(),
  insured_name: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export type InsuranceExtractionResult = z.infer<typeof InsuranceExtractionSchema>;

async function runInsuranceAi(
  fileDataUrl: string,
  filename: string,
): Promise<InsuranceExtractionResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI extraction unavailable");

  const mime = fileDataUrl.match(/^data:([^;]+);/)?.[1] ?? "application/octet-stream";
  const isPdf = mime === "application/pdf";
  const contentBlocks: unknown[] = [
    {
      type: "text",
      text: [
        "You are extracting fields from a professional liability / public liability insurance certificate (UK fitness industry).",
        "Return a single JSON object — no prose, no markdown — matching this exact shape:",
        "{",
        '  "provider": string | null,           // insurer name, e.g. "Insure4Sport", "Hiscox"',
        '  "policy_number": string | null,      // policy reference printed on the certificate',
        '  "cover_amount_gbp": number | null,   // TOTAL cover in pounds (e.g. 5000000 for £5m). Pick the public liability limit if multiple are listed.',
        '  "start_date": string | null,         // YYYY-MM-DD, period of cover start',
        '  "expiry_date": string | null,        // YYYY-MM-DD, period of cover end / renewal date',
        '  "insured_name": string | null,       // name of the insured person/business as printed',
        '  "confidence": number                 // 0..1 overall confidence',
        "}",
        "Rules: if a field is not clearly visible, set it to null. Do not guess. Do not invent dates or amounts.",
        "cover_amount_gbp is pounds, not millions: £1,000,000 → 1000000.",
      ].join("\n"),
    },
  ];
  if (isPdf) {
    contentBlocks.push({ type: "file", file: { filename, file_data: fileDataUrl } });
  } else {
    contentBlocks.push({ type: "image_url", image_url: { url: fileDataUrl } });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: contentBlocks }],
    }),
  });
  if (res.status === 429) throw new Error("AI is busy — please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted — please contact REPs support.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI extraction failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return InsuranceExtractionSchema.parse(JSON.parse(raw));
  } catch {
    return {
      provider: null,
      policy_number: null,
      cover_amount_gbp: null,
      start_date: null,
      expiry_date: null,
      insured_name: null,
      confidence: 0,
    };
  }
}

export const extractInsuranceFromDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        file_data_url: z.string().startsWith("data:").max(15_000_000),
        filename: z.string().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => runInsuranceAi(data.file_data_url, data.filename));

export const extractInsuranceFromPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ doc_path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!data.doc_path.startsWith(`${userId}/`)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: blob, error } = await supabaseAdmin.storage
      .from("insurance-docs")
      .download(data.doc_path);
    if (error || !blob) throw new Error(error?.message ?? "File not found");
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    const mime = blob.type || "application/octet-stream";
    const dataUrl = `data:${mime};base64,${b64}`;
    const filename = data.doc_path.split("/").pop() ?? "insurance";
    return runInsuranceAi(dataUrl, filename);
  });

/* -------------------------------------------------------------------------- */
/* QR "scan with phone" handoff                                               */
/* -------------------------------------------------------------------------- */

export const createInsuranceUploadSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });
    const { data, error } = await supabase
      .from("insurance_upload_sessions")
      .insert({ professional_id: userId } as never)
      .select("id, expires_at")
      .single();
    if (error) throw new Error(error.message);
    return data as { id: string; expires_at: string };
  });

export const getInsuranceUploadSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("insurance_upload_sessions")
      .select("id, status, doc_path, filename, expires_at, created_at")
      .eq("id", data.id)
      .eq("professional_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const markInsuranceUploadSessionConsumed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("insurance_upload_sessions")
      .update({ status: "consumed" } as never)
      .eq("id", data.id)
      .eq("professional_id", userId);
    return { ok: true };
  });

/* --- Public (no auth) endpoints used by the mobile handoff page ----------- */

const lookupInput = z.object({ session_id: z.string().uuid() });

export const lookupInsuranceUploadSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => lookupInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("insurance_upload_sessions")
      .select("id, status, expires_at, professional_id")
      .eq("id", data.session_id)
      .maybeSingle();
    if (!row) return { ok: false as const, reason: "not_found" as const };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, reason: "expired" as const };
    }
    if (row.status !== "pending") {
      return { ok: false as const, reason: row.status as "uploaded" | "consumed" | "expired" };
    }
    return { ok: true as const, expires_at: row.expires_at };
  });

const mobileSubmitInput = z.object({
  session_id: z.string().uuid(),
  file_data_url: z.string().startsWith("data:").max(15_000_000),
  filename: z.string().min(1).max(200),
});

export const submitInsuranceFromMobile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => mobileSubmitInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("insurance_upload_sessions")
      .select("id, status, expires_at, professional_id")
      .eq("id", data.session_id)
      .maybeSingle();
    if (!row) throw new Error("Session not found");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Session expired");
    if (row.status !== "pending") throw new Error("Session already used");

    const match = data.file_data_url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid file payload");
    const [, mime, b64] = match;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(hashBuf), (b) => b.toString(16).padStart(2, "0")).join("");
    const ext = data.filename.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${row.professional_id}/${Date.now()}-${sha256.slice(0, 8)}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("insurance-docs")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { error: updErr } = await supabaseAdmin
      .from("insurance_upload_sessions")
      .update({ status: "uploaded", doc_path: path, filename: data.filename } as never)
      .eq("id", data.session_id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true };
  });

