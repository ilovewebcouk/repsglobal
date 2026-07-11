import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { nameSimilarity, INSURANCE_MIN_COVER_GBP } from "@/lib/verification/cross-checks";
import { notifyVerificationEvent } from "@/lib/verification/notifications.functions";

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

    // --- Hard reject: certificate is already expired before we even save -----
    // (Mirrors the admin warning. Faster signal to the trainer than "submitted
    //  → admin sees expired → emails you back".)
    const expiryMs = new Date(`${data.expiry_date}T23:59:59`).getTime();
    if (Number.isFinite(expiryMs) && expiryMs < Date.now()) {
      // Best-effort notification — they should hear about this in the bell too.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      const profAny = prof as { full_name?: string | null} | null;
      await notifyVerificationEvent({
        professionalId: userId,
        event: "insurance.rejected_expired",
        context: { expiry_date: data.expiry_date, doc_path: data.doc_path },
        proName: profAny?.full_name ?? undefined,
        alsoEmail: true,
      });
      throw new Error(
        `This certificate expired on ${data.expiry_date}. Please upload your current renewed policy.`,
      );
    }

    await supabase.from("professionals").upsert({ id: userId } as never, { onConflict: "id" });

    // --- AI cross-check on the uploaded certificate -------------------------
    // Best-effort: if AI is unavailable we still persist the row, but with
    // trust_signals.ai = "skipped" so admins can see the gap.
    let aiExtraction: InsuranceExtractionResult | null = null;
    let trustSignals: Record<string, unknown> = {};
    let insuredName: string | null = null;
    let nameMatch: boolean | null = null;
    let autoApprove = false;
    let autoApproveReason: string | null = null;
    let proName: string | null = null;
    try {
      const ai = await runInsuranceAiFromPath(data.doc_path, userId);
      aiExtraction = ai;
      insuredName = ai.insured_name ?? null;

      // Pull the verified legal name (locked at ID approval) to score against.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: pro } = await supabaseAdmin
        .from("professionals")
        .select("identity_verified_name, identity_status")
        .eq("id", userId)
        .maybeSingle();
      const proAny = pro as { identity_verified_name?: string | null; identity_status?: string | null } | null;
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      const profAny = prof as { full_name?: string | null} | null;
      proName = profAny?.full_name ?? null;
      // Name-matching still uses the KYC-locked identity name when present —
      // that IS the point of identity_verified_name — but display always uses
      // profiles.full_name (see mem://index.md, single source of truth).
      const identityName =
        proAny?.identity_verified_name ?? profAny?.full_name ?? null;
      const identityApproved = proAny?.identity_status === "approved";

      const nameScore =
        insuredName && identityName ? nameSimilarity(insuredName, identityName) : null;
      nameMatch = nameScore === null ? null : nameScore >= 0.85;

      const expiryMismatch =
        !!(ai.expiry_date && ai.expiry_date !== data.expiry_date);

      const aiCover =
        typeof ai.cover_amount_gbp === "number" ? ai.cover_amount_gbp : null;
      const effectiveCover = aiCover ?? data.cover_amount_gbp ?? 0;
      const lowCover = effectiveCover < INSURANCE_MIN_COVER_GBP();

      // --- Auto-approval gate -------------------------------------------------
      // All of: identity already approved (so we have a real name to match
      // against), AI extracted cleanly, name match strong, in-date, full cover,
      // and the insurer is on the allow-list. The expiry has already been
      // hard-rejected above if it was in the past.
      const providerKnown = isAllowedInsurer(ai.provider ?? data.provider);
      const aiConfident = (ai.confidence ?? 0) >= 0.7;
      const strongNameMatch = nameScore !== null && nameScore >= 0.92;

      if (
        identityApproved &&
        strongNameMatch &&
        !lowCover &&
        !expiryMismatch &&
        aiConfident &&
        providerKnown
      ) {
        autoApprove = true;
        autoApproveReason = `name ${(nameScore! * 100).toFixed(0)}%, cover £${effectiveCover.toLocaleString()}, insurer "${ai.provider ?? data.provider}", confidence ${(ai.confidence! * 100).toFixed(0)}%`;
      }

      trustSignals = {
        ai: "ok",
        ai_confidence: ai.confidence ?? null,
        name_score: nameScore,
        name_match: nameMatch,
        expiry_mismatch: expiryMismatch,
        low_cover: lowCover,
        provider_known: providerKnown,
        auto_approved: autoApprove,
        auto_approve_reason: autoApproveReason,
        ai_extracted: {
          provider: ai.provider,
          cover_amount_gbp: ai.cover_amount_gbp,
          expiry_date: ai.expiry_date,
          insured_name: insuredName,
        },
      };

      // Soft flags — don't block the save, but raise bell + email so the pro
      // can fix it before an admin sees it.
      if (lowCover) {
        await notifyVerificationEvent({
          professionalId: userId,
          event: "insurance.flagged_low_cover",
          context: {
            expiry_date: data.expiry_date,
            cover_amount_gbp: ai.cover_amount_gbp ?? data.cover_amount_gbp ?? 0,
          },
          proName: proName ?? undefined,
          alsoEmail: true,
        });
      }
      if (nameMatch === false) {
        await notifyVerificationEvent({
          professionalId: userId,
          event: "insurance.flagged_name_mismatch",
          context: {
            insured_name: insuredName,
            identity_name: identityName,
          },
          proName: proName ?? undefined,
          alsoEmail: true,
        });
      }
    } catch (e) {
      trustSignals = { ai: "skipped", ai_error: (e as Error).message };
    }


    const initialStatus = autoApprove ? "active" : "pending";
    const nowIso = new Date().toISOString();

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
        status: initialStatus,
        ai_extraction: (aiExtraction ?? null) as never,
        ai_checked_at: aiExtraction ? nowIso : null,
        trust_signals: trustSignals as never,
        insured_name: insuredName,
        name_match: nameMatch,
        reviewed_at: autoApprove ? nowIso : null,
        reviewed_by: null,
        admin_note: autoApprove ? `Auto-approved by AI — ${autoApproveReason}` : null,
      } as never)
      .select("id, status, expiry_date, created_at")
      .single();
    if (error) throw new Error(error.message);

    // Notify the pro that their cover is live. The DB recompute trigger on
    // insurance_policies will flip professionals.verification → 'verified'
    // automatically when the 3-of-3 gate is satisfied.
    if (autoApprove) {
      await notifyVerificationEvent({
        professionalId: userId,
        event: "insurance.auto_approved",
        policyId: row?.id ?? null,
        context: {
          expiry_date: data.expiry_date,
          insured_name: insuredName,
          reason: autoApproveReason,
        },
        proName: proName ?? undefined,
        alsoEmail: false,
      });
    }

    return row;
  });

/**
 * Allow-list of UK fitness-industry insurers we trust enough to auto-approve
 * against (when every other signal also passes). Matched as a case-insensitive
 * substring on the AI-extracted provider name OR the user-entered provider.
 * Anything outside this list still goes to the admin queue.
 */
const ALLOWED_INSURERS = [
  "insure4sport",
  "westminster",
  "protectivity",
  "salon gold",
  "insurance protector group",
  "hiscox",
  "markel",
  "sportscover",
  "towergate",
  "fitpro",
  "fitness industry education",
  "insurefor",
  "axa",
] as const;

function isAllowedInsurer(name: string | null | undefined): boolean {
  if (!name) return false;
  const haystack = name.toLowerCase();
  return ALLOWED_INSURERS.some((needle) => haystack.includes(needle));
}



export const myInsurance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
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
        "You are extracting fields from a professional liability / public liability insurance certificate (UK fitness industry).", "Return a single JSON object — no prose, no markdown — matching this exact shape:", "{",
        '  "provider": string | null,           // insurer name, e.g. "Insure4Sport", "Hiscox"',
        '  "policy_number": string | null,      // policy reference printed on the certificate',
        '  "cover_amount_gbp": number | null,   // TOTAL cover in pounds (e.g. 5000000 for £5m). Pick the public liability limit if multiple are listed.',
        '  "start_date": string | null,         // YYYY-MM-DD, period of cover start',
        '  "expiry_date": string | null,        // YYYY-MM-DD, period of cover end / renewal date',
        '  "insured_name": string | null,       // name of the insured person/business as printed',
        '  "confidence": number                 // 0..1 overall confidence',
        "}", "Rules: if a field is not clearly visible, set it to null. Do not guess. Do not invent dates or amounts.", "cover_amount_gbp is pounds, not millions: £1,000,000 → 1000000.",
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

/** Internal helper — download a stored insurance certificate and run AI on it. */
async function runInsuranceAiFromPath(docPath: string, userId: string): Promise<InsuranceExtractionResult> {
  if (!docPath.startsWith(`${userId}/`)) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: blob, error } = await supabaseAdmin.storage
    .from("insurance-docs")
    .download(docPath);
  if (error || !blob) throw new Error(error?.message ?? "File not found");
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const b64 = btoa(bin);
  const mime = blob.type || "application/octet-stream";
  const dataUrl = `data:${mime};base64,${b64}`;
  const filename = docPath.split("/").pop() ?? "insurance";
  return runInsuranceAi(dataUrl, filename);
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

/* -------------------------------------------------------------------------- */
/* Admin: insurance review queue                                              */
/* -------------------------------------------------------------------------- */

async function assertAdmin(supabase: unknown, userId: string) {
  const sb = supabase as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  const { data } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const INSURANCE_STATUSES = ["pending", "active", "rejected", "expired"] as const;
type InsuranceListStatus = (typeof INSURANCE_STATUSES)[number];

export const listInsurancePolicies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ statuses: z.array(z.enum(INSURANCE_STATUSES)).min(1).default(["pending"]) })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("insurance_policies")
      .select(
        "id, professional_id, provider, policy_number, cover_amount_gbp, start_date, expiry_date, doc_path, status, insured_name, name_match, ai_checked_at, ai_extraction, trust_signals, admin_note, reviewed_at, reviewed_by, created_at",
      )
      .in("status", data.statuses as unknown as string[])
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.professional_id))).filter(Boolean) as string[];
    const profilesById = new Map<string, { full_name: string | null}>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null}>) {
        profilesById.set(p.id, { full_name: p.full_name });
      }
    }
    return (rows ?? []).map((r) => ({
      ...r,
      professional: profilesById.get(r.professional_id) ?? null,
    }));
  });

const reviewInsuranceInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  admin_note: z.string().max(2000).optional().nullable(),
});

export const reviewInsurance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reviewInsuranceInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.decision === "rejected" && !(data.admin_note ?? "").trim()) {
      throw new Error("Note required to reject an insurance policy.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: getErr } = await supabaseAdmin
      .from("insurance_policies")
      .select("id, professional_id, expiry_date, status")
      .eq("id", data.id)
      .maybeSingle();
    if (getErr || !existing) throw new Error(getErr?.message ?? "Policy not found");

    const newStatus = data.decision === "approved" ? "active" : "rejected";
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabaseAdmin
      .from("insurance_policies")
      .update({
        status: newStatus,
        reviewed_at: nowIso,
        reviewed_by: context.userId,
        admin_note: (data.admin_note ?? "").trim() || null,
      } as never)
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    // Notify the pro. DB trigger recomputes professionals.verification.
    try {
      await notifyVerificationEvent({
        professionalId: existing.professional_id,
        event: data.decision === "approved" ? "insurance.approved" : "insurance.rejected",
        policyId: data.id,
        context: { expiry_date: existing.expiry_date, note: data.admin_note ?? null },
        alsoEmail: true,
      });
    } catch {
      /* notification best-effort */
    }

    return { ok: true, status: newStatus };
  });

export const recheckInsuranceAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("insurance_policies")
      .select("id, professional_id, doc_path")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error(error?.message ?? "Policy not found");

    // Download via admin client (admin paths bypass folder ownership).
    const { data: blob, error: dlErr } = await supabaseAdmin.storage
      .from("insurance-docs")
      .download(row.doc_path);
    if (dlErr || !blob) throw new Error(dlErr?.message ?? "Document not found");
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    const mime = blob.type || "application/octet-stream";
    const dataUrl = `data:${mime};base64,${b64}`;
    const filename = row.doc_path.split("/").pop() ?? "insurance";
    const ai = await runInsuranceAi(dataUrl, filename);

    // Score against identity name if available.
    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("identity_verified_name")
      .eq("id", row.professional_id)
      .maybeSingle();
    const proAny = pro as { identity_verified_name?: string | null } | null;
    const score =
      ai.insured_name && proAny?.identity_verified_name
        ? nameSimilarity(ai.insured_name, proAny.identity_verified_name)
        : null;

    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabaseAdmin
      .from("insurance_policies")
      .update({
        ai_extraction: ai as never,
        ai_checked_at: nowIso,
        insured_name: ai.insured_name ?? null,
        name_match: score === null ? null : score >= 0.85,
        trust_signals: {
          ai: "ok",
          ai_confidence: ai.confidence ?? null,
          name_score: score,
          ai_extracted: ai,
          rechecked_at: nowIso,
        } as never,
      } as never)
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);
    return { ok: true, ai, name_score: score };
  });


