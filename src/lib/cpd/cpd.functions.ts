import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { matchAwardingBody } from "./awarding-bodies";

/* -------------------------------------------------------------------------- *
 * AI extraction
 * -------------------------------------------------------------------------- */

// Zod schema we expect the model to populate. Kept loose (everything nullable)
// because real certificates are messy — we'd rather leave a field blank than
// hallucinate.
const ExtractionSchema = z.object({
  awarding_body: z.string().nullable(),
  qualification: z.string().nullable(),
  issue_date: z.string().nullable(), // YYYY-MM-DD if confident
  expiry_date: z.string().nullable(),
  certificate_number: z.string().nullable(),
  holder_name: z.string().nullable(),
  regulator: z.string().nullable(), // e.g. "Ofqual"
  confidence: z.number().min(0).max(1).nullable(),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema> & {
  awarding_body_slug: string | null;
};

const extractInput = z.object({
  file_data_url: z.string().startsWith("data:").max(15_000_000), // ~10MB base64
  filename: z.string().min(1).max(200),
});

export const extractCertificateFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => extractInput.parse(d))
  .handler(async ({ data }): Promise<ExtractionResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI extraction unavailable");

    // Build multimodal content block: PDF → file, image → image_url
    const mime = data.file_data_url.match(/^data:([^;]+);/)?.[1] ?? "application/octet-stream";
    const isPdf = mime === "application/pdf";
    const contentBlocks: unknown[] = [
      {
        type: "text",
        text: [
          "You are extracting fields from a fitness / coaching qualification certificate.",
          "Return a single JSON object — no prose, no markdown — matching this exact shape:",
          "{",
          '  "awarding_body": string | null,        // body that issued it, e.g. "Active IQ"',
          '  "qualification": string | null,        // full title, e.g. "Level 3 Diploma in Personal Training"',
          '  "issue_date": string | null,           // YYYY-MM-DD if confident',
          '  "expiry_date": string | null,          // YYYY-MM-DD if printed on the cert',
          '  "certificate_number": string | null,',
          '  "holder_name": string | null,          // person the cert is awarded to',
          '  "regulator": string | null,            // e.g. "Ofqual" if mentioned',
          '  "confidence": number                   // 0..1 overall confidence in the extraction',
          "}",
          "Rules: if a field is not clearly visible, set it to null. Do not guess. Do not invent dates.",
        ].join("\n"),
      },
    ];

    if (isPdf) {
      contentBlocks.push({
        type: "file",
        file: { filename: data.filename, file_data: data.file_data_url },
      });
    } else {
      contentBlocks.push({ type: "image_url", image_url: { url: data.file_data_url } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
    let parsed: z.infer<typeof ExtractionSchema>;
    try {
      parsed = ExtractionSchema.parse(JSON.parse(raw));
    } catch {
      // Model returned malformed output — return a blank extraction rather than crash
      parsed = {
        awarding_body: null,
        qualification: null,
        issue_date: null,
        expiry_date: null,
        certificate_number: null,
        holder_name: null,
        regulator: null,
        confidence: 0,
      };
    }

    // Low-confidence sanity: drop any single field whose confidence is the only signal of life
    const minConf = parsed.confidence ?? 0;
    const lowConf = minConf < 0.5;

    return {
      ...parsed,
      // If overall confidence is low, blank issue/expiry to avoid bad pre-fills
      issue_date: lowConf ? null : parsed.issue_date,
      expiry_date: lowConf ? null : parsed.expiry_date,
      awarding_body_slug: matchAwardingBody(parsed.awarding_body)?.slug ?? null,
    };
  });

/* -------------------------------------------------------------------------- *
 * Submit a certificate (after AI extract + pro confirmation)
 * -------------------------------------------------------------------------- */

const submitInput = z.object({
  awarding_body: z.string().min(2).max(160),
  awarding_body_slug: z.string().max(60).nullable().optional(),
  qualification: z.string().min(2).max(200),
  issue_year: z.number().int().min(1980).max(2100).nullable().optional(),
  expiry_date: z.string().nullable().optional(), // YYYY-MM-DD
  certificate_number: z.string().max(120).nullable().optional(),
  holder_name: z.string().max(160).nullable().optional(),
  file_sha256: z.string().length(64),
  doc_paths: z.array(z.string().min(1)).min(1).max(5),
  ai_extraction: z.record(z.unknown()).nullable().optional(),
});

function randomToken(): string {
  // 22-char URL-safe random — collision-resistant for verify links
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const submitCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    // Holder name match vs identity-verified name (if available)
    const { data: pro } = await supabase
      .from("professionals")
      .select("identity_verified_name")
      .eq("id", userId)
      .maybeSingle();
    const verifiedName = (pro as { identity_verified_name?: string | null } | null)?.identity_verified_name ?? null;
    const nameMatch =
      verifiedName && data.holder_name
        ? verifiedName.toLowerCase().trim() === data.holder_name.toLowerCase().trim()
        : null;

    // Duplicate detection across the whole platform via service role
    let duplicateOf: string | null = null;
    {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: dup } = await supabaseAdmin
        .from("verification_submissions")
        .select("id")
        .eq("file_sha256", data.file_sha256)
        .neq("professional_id", userId)
        .limit(1)
        .maybeSingle();
      duplicateOf = (dup as { id?: string } | null)?.id ?? null;
    }

    const verifyToken = randomToken();

    const { data: row, error } = await supabase
      .from("verification_submissions")
      .insert({
        professional_id: userId,
        awarding_body: data.awarding_body,
        awarding_body_slug: data.awarding_body_slug ?? null,
        qualification: data.qualification,
        year: data.issue_year ?? null,
        expiry_date: data.expiry_date ?? null,
        certificate_number: data.certificate_number ?? null,
        holder_name: data.holder_name ?? null,
        file_sha256: data.file_sha256,
        doc_paths: data.doc_paths,
        ai_extraction: data.ai_extraction ?? null,
        verify_token: verifyToken,
        name_match: nameMatch,
        duplicate_of: duplicateOf,
      } as never)
      .select("id, status, created_at, verify_token")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("professionals")
      .update({ cert_uploaded_at: new Date().toISOString() } as never)
      .eq("id", userId);

    return row;
  });

/* -------------------------------------------------------------------------- *
 * My certificates (for the dashboard)
 * -------------------------------------------------------------------------- */

export const myCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("verification_submissions")
      .select(
        "id, awarding_body, awarding_body_slug, qualification, year, expiry_date, certificate_number, holder_name, status, admin_note, verify_token, created_at, reviewed_at",
      )
      .eq("professional_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* -------------------------------------------------------------------------- *
 * Delete a pending submission
 * -------------------------------------------------------------------------- */

export const deletePendingCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("verification_submissions")
      .delete()
      .eq("id", data.id)
      .eq("professional_id", userId)
      .in("status", ["submitted", "changes_requested"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------------------------------------------------- *
 * Upload a file to verification-docs bucket (returns the storage path)
 * -------------------------------------------------------------------------- */

const uploadInput = z.object({
  file_data_url: z.string().startsWith("data:").max(15_000_000),
  filename: z.string().min(1).max(200),
});

export const uploadCertificateFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Decode base64 payload
    const match = data.file_data_url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid file payload");
    const [, mime, b64] = match;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    // SHA-256 hash for duplicate detection
    const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(hashBuf), (b) => b.toString(16).padStart(2, "0")).join("");

    const ext = data.filename.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${userId}/${Date.now()}-${sha256.slice(0, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("verification-docs")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error(error.message);

    return { path, sha256 };
  });
