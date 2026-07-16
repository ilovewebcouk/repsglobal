// Training-provider FAQ management.
//
// All mutations run through `assertCallerIsTrainingProvider` (from
// qualifications.functions.ts) — replicated inline here so we don't
// depend on that module's server-fn splitting. Admin-role callers and
// professionals rows without `account_type='training_provider'` are
// refused. This matches the P0 impersonation hardening pattern.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3.5-flash";
const MAX_ROWS = 8;
const MAX_PUBLIC = 5;

/* -------------------- shared guard -------------------- */

async function assertCallerIsTrainingProvider(
  supabase: any,
  userId: string,
): Promise<void> {
  const [{ data: pro }, { data: roleRow }] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, account_type")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
  ]);
  if (roleRow) {
    throw new Error(
      "This action is only available to training-provider accounts. If you meant to act as a provider, reopen impersonation from the Members page.",
    );
  }
  if (!pro || (pro as { account_type?: string }).account_type !== "training_provider") {
    throw new Error(
      "This action is only available to training-provider accounts.",
    );
  }
}

/* -------------------- shared types -------------------- */

export type ProviderFaqDTO = {
  id: string;
  question: string;
  answer: string;
  status: "draft" | "published" | "hidden";
  source: "ai_suggested" | "manual";
  position: number;
  generated_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

function toDto(row: Record<string, unknown>): ProviderFaqDTO {
  return {
    id: row.id as string,
    question: row.question as string,
    answer: row.answer as string,
    status: row.status as ProviderFaqDTO["status"],
    source: row.source as ProviderFaqDTO["source"],
    position: (row.position as number | null) ?? 0,
    generated_at: (row.generated_at as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/* -------------------- list (owner) -------------------- */

export const listMyProviderFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertCallerIsTrainingProvider(supabase, userId);

    const { data, error } = await supabase
      .from("provider_faqs")
      .select("*")
      .eq("professional_id", userId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    return { faqs: rows.map(toDto), maxRows: MAX_ROWS, maxPublic: MAX_PUBLIC };
  });

/* -------------------- list (public, by slug) -------------------- */

export const listPublicProviderFaqs = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!pro) return { faqs: [] as ProviderFaqDTO[] };
    const { data: rows } = await supabaseAdmin
      .from("provider_faqs")
      .select("*")
      .eq("professional_id", (pro as { id: string }).id)
      .eq("status", "published")
      .order("position", { ascending: true })
      .order("approved_at", { ascending: true })
      .limit(MAX_PUBLIC);
    return { faqs: (rows ?? []).map((r) => toDto(r as Record<string, unknown>)) };
  });

/* -------------------- upsert (manual create/edit) -------------------- */

const upsertInput = z.object({
  id: z.string().uuid().nullable().optional(),
  question: z.string().trim().min(3).max(240),
  answer: z.string().trim().min(3).max(800),
});

export const upsertProviderFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsTrainingProvider(supabase, userId);

    if (data.id) {
      const { error } = await supabase
        .from("provider_faqs")
        .update({ question: data.question, answer: data.answer } as never)
        .eq("id", data.id)
        .eq("professional_id", userId);
      if (error) throw new Error(error.message);
      return { ok: true as const, id: data.id };
    }

    const { count } = await supabase
      .from("provider_faqs")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", userId);
    if ((count ?? 0) >= MAX_ROWS) {
      throw new Error(
        `You already have ${MAX_ROWS} FAQs. Delete or hide one before adding another.`,
      );
    }

    const { data: pos } = await supabase
      .from("provider_faqs")
      .select("position")
      .eq("professional_id", userId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = ((pos as { position?: number } | null)?.position ?? 0) + 1;

    const { data: row, error } = await supabase
      .from("provider_faqs")
      .insert({
        professional_id: userId,
        question: data.question,
        answer: data.answer,
        status: "draft",
        source: "manual",
        position: nextPos,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: (row as { id: string }).id };
  });

/* -------------------- status transitions -------------------- */

const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "published", "hidden"]),
});

export const setProviderFaqStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsTrainingProvider(supabase, userId);

    if (data.status === "published") {
      const { count } = await supabase
        .from("provider_faqs")
        .select("id", { count: "exact", head: true })
        .eq("professional_id", userId)
        .eq("status", "published");
      if ((count ?? 0) >= MAX_PUBLIC) {
        throw new Error(
          `You can only publish ${MAX_PUBLIC} FAQs at a time. Hide one first.`,
        );
      }
    }

    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "published") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = userId;
    }

    const { error } = await supabase
      .from("provider_faqs")
      .update(patch as never)
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* -------------------- delete -------------------- */

export const deleteProviderFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsTrainingProvider(supabase, userId);
    const { error } = await supabase
      .from("provider_faqs")
      .delete()
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* -------------------- reorder -------------------- */

export const reorderProviderFaqs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(MAX_ROWS) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsTrainingProvider(supabase, userId);

    // Verify every id belongs to the caller so a hostile client can't
    // reorder someone else's row via this endpoint. RLS would already
    // block the write, but this returns a cleaner error.
    const { data: rows } = await supabase
      .from("provider_faqs")
      .select("id")
      .eq("professional_id", userId)
      .in("id", data.ids);
    const owned = new Set(((rows ?? []) as Array<{ id: string }>).map((r) => r.id));
    for (const id of data.ids) {
      if (!owned.has(id)) throw new Error("Cannot reorder unknown FAQ.");
    }

    for (let i = 0; i < data.ids.length; i++) {
      await supabase
        .from("provider_faqs")
        .update({ position: i + 1 } as never)
        .eq("id", data.ids[i])
        .eq("professional_id", userId);
    }
    return { ok: true as const };
  });

/* -------------------- AI generate -------------------- */

type AiFaq = { question: string; answer: string };

async function callAiForFaqs(
  facts: string,
  count: number,
): Promise<AiFaq[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const system = [
    "You are drafting Frequently Asked Questions for the public profile page of a REPS-recognised training provider.",
    "REPS is the global register of exercise professionals.",
    "",
    "Grounding rules (non-negotiable):",
    "- Only use facts explicitly listed under 'PROVIDER FACTS'. Never invent qualifications, prices, timelines, awarding bodies, guarantees, employment outcomes, or accreditations that are not in the facts.",
    "- Each question MUST reference a specific fact about THIS provider — a named qualification, a course, the city, or the delivery mode. Absolutely no generic questions like 'What qualifications do you offer?' or 'How do I enrol?'.",
    "- Never mention CIMSPA. Prefer 'Ofqual-regulated' or 'recognised awarding body'.",
    "- Never quote a specific price, start date, or duration unless it is in the facts.",
    "- British English. Warm, plain, direct. No marketing jargon. No emoji. No exclamation marks. No 'unlock', 'transform', 'game-changer', 'journey'.",
    "- Address the reader as 'you'. Refer to the provider by name or as 'we'.",
    "- Questions ≤120 characters. Answers 40–90 words each.",
    "",
    "Output STRICT JSON:",
    `{ "faqs": [ { "question": string, "answer": string }, ... ] } with exactly ${count} entries.`,
  ].join("\n");

  const user = `PROVIDER FACTS:\n${facts}\n\nDraft ${count} FAQs a prospective learner would actually ask about THIS provider.`;

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429)
    throw new Error("AI is rate-limiting — try again in a few seconds.");
  if (res.status === 402)
    throw new Error("AI credits exhausted. Top up in Settings → Workspace → Usage.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI request failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = body.choices?.[0]?.message?.content ?? "";
  let parsed: { faqs?: AiFaq[] };
  try {
    parsed = JSON.parse(raw) as { faqs?: AiFaq[] };
  } catch {
    throw new Error("AI returned invalid JSON.");
  }
  const list = Array.isArray(parsed.faqs) ? parsed.faqs : [];
  return list
    .filter(
      (f) =>
        f &&
        typeof f.question === "string" &&
        typeof f.answer === "string" &&
        f.question.trim().length >= 5 &&
        f.answer.trim().length >= 10,
    )
    .map((f) => ({
      question: f.question.trim().slice(0, 240),
      answer: f.answer.trim().slice(0, 800),
    }));
}

export const generateProviderFaqs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertCallerIsTrainingProvider(supabase, userId);

    // Cap total rows so a "regenerate" spam can't fill the table.
    const { count } = await supabase
      .from("provider_faqs")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", userId);
    const existing = count ?? 0;
    const room = Math.max(0, MAX_ROWS - existing);
    if (room === 0) {
      throw new Error(
        `You already have ${MAX_ROWS} FAQs. Delete or hide one before generating more.`,
      );
    }
    const desired = Math.min(5, room);

    const { loadProviderGroundingFacts, renderGroundingForPrompt, hasEnoughGrounding } =
      await import("./provider-faqs.grounding.server");
    const facts = await loadProviderGroundingFacts(userId);
    if (!hasEnoughGrounding(facts)) {
      throw new Error(
        "Add at least one approved regulated qualification or REPS course first so we can draft real FAQs.",
      );
    }
    const prompt = renderGroundingForPrompt(facts);
    const drafts = await callAiForFaqs(prompt, desired);
    if (drafts.length === 0) throw new Error("AI returned no usable FAQs.");

    // Find the next position for insertion.
    const { data: pos } = await supabase
      .from("provider_faqs")
      .select("position")
      .eq("professional_id", userId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextPos = ((pos as { position?: number } | null)?.position ?? 0) + 1;

    const now = new Date().toISOString();
    const rows = drafts.slice(0, room).map((d) => ({
      professional_id: userId,
      question: d.question,
      answer: d.answer,
      status: "draft" as const,
      source: "ai_suggested" as const,
      position: nextPos++,
      generated_at: now,
    }));

    const { error } = await supabase
      .from("provider_faqs")
      .insert(rows as never);
    if (error) throw new Error(error.message);
    return { ok: true as const, inserted: rows.length };
  });
