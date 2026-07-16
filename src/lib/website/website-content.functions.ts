// Phase 5/7: Website editor — content fields + child sections + AI drafting.
// Lives alongside website.functions.ts; the editor at /dashboard/website
// calls these to manage subtitle, method, venues, transformations, client
// results, FAQs, plus AI-assisted draft helpers.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { z } from "zod";

/* ===================================================================== */
/* Types                                                                  */
/* ===================================================================== */

export type MethodPillar = { title: string; body: string };
export type Venue = { name: string; address?: string | null };

export type WebsiteContentDTO = {
  subtitle: string | null;
  method_name: string | null;
  method_intro: string | null;
  method_pillars: MethodPillar[];
  venues: Venue[];
  coaching_reach: { cities: string[]; online_worldwide: boolean };
  client_results_intro: string | null;
  faq_auto_generated: boolean;
};

export type TransformationDTO = {
  id: string;
  client_first_name: string | null;
  client_role: string | null;
  duration_label: string | null;
  metric: string | null;
  headline: string | null;
  quote: string | null;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export type ClientResultDTO = {
  id: string;
  headline: string | null;
  body: string | null;
  review_id: string | null;
  sort_order: number;
  is_published: boolean;
};

export type FaqDTO = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  source: string;
};

/* ===================================================================== */
/* JSON coercion helpers (Supabase Json columns)                          */
/* ===================================================================== */

function asPillars(v: unknown): MethodPillar[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      title: String((p as { title?: unknown }).title ?? "").trim(),
      body: String((p as { body?: unknown }).body ?? "").trim(),
    }))
    .filter((p) => p.title || p.body)
    .slice(0, 6);
}

function asVenues(v: unknown): Venue[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      name: String((p as { name?: unknown }).name ?? "").trim(),
      address:
        (p as { address?: unknown }).address != null
          ? String((p as { address?: unknown }).address).trim()
          : null,
    }))
    .filter((p) => !!p.name)
    .slice(0, 8);
}

function asReach(v: unknown): { cities: string[]; online_worldwide: boolean } {
  if (!v || typeof v !== "object") return { cities: [], online_worldwide: false };
  const obj = v as { cities?: unknown; online_worldwide?: unknown };
  const cities = Array.isArray(obj.cities)
    ? obj.cities.map((c) => String(c).trim()).filter(Boolean).slice(0, 12)
    : [];
  return { cities, online_worldwide: !!obj.online_worldwide };
}

/* ===================================================================== */
/* Read                                                                   */
/* ===================================================================== */

export const getMyWebsiteContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(
    async ({
      context,
    }): Promise<{
      content: WebsiteContentDTO;
      transformations: TransformationDTO[];
      clientResults: ClientResultDTO[];
      faqs: FaqDTO[];
    }> => {
      const userId = context.userId;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const [{ data: sf }, { data: t }, { data: r }, { data: f }] = await Promise.all([
        supabaseAdmin
          .from("websites")
          .select(
            "subtitle, method_name, method_intro, method_pillars, venues, coaching_reach, client_results_intro, faq_auto_generated",
          )
          .eq("professional_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("website_transformations")
          .select(
            "id, client_first_name, client_role, duration_label, metric, headline, quote, image_url, sort_order, is_published",
          )
          .eq("user_id", userId)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("website_client_results")
          .select("id, headline, body, review_id, sort_order, is_published")
          .eq("user_id", userId)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("website_faqs")
          .select("id, question, answer, sort_order, source")
          .eq("user_id", userId)
          .order("sort_order", { ascending: true }),
      ]);

      const content: WebsiteContentDTO = {
        subtitle: sf?.subtitle ?? null,
        method_name: sf?.method_name ?? null,
        method_intro: sf?.method_intro ?? null,
        method_pillars: asPillars(sf?.method_pillars),
        venues: asVenues(sf?.venues),
        coaching_reach: asReach(sf?.coaching_reach),
        client_results_intro: sf?.client_results_intro ?? null,
        faq_auto_generated: !!sf?.faq_auto_generated,
      };

      return {
        content,
        transformations: (t ?? []) as TransformationDTO[],
        clientResults: (r ?? []) as ClientResultDTO[],
        faqs: (f ?? []) as FaqDTO[],
      };
    },
  );

/* ===================================================================== */
/* Save core content (subtitle / method / venues / reach / intros)        */
/* ===================================================================== */

const PillarSchema = z.object({
  title: z.string().trim().max(60),
  body: z.string().trim().max(400),
});
const VenueSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(200).nullable().optional(),
});

const SaveContentSchema = z.object({
  subtitle: z.string().trim().max(200).nullable().optional(),
  method_name: z.string().trim().max(80).nullable().optional(),
  method_intro: z.string().trim().max(600).nullable().optional(),
  method_pillars: z.array(PillarSchema).max(6).optional(),
  venues: z.array(VenueSchema).max(8).optional(),
  coaching_reach: z
    .object({
      cities: z.array(z.string().trim().max(80)).max(12).optional(),
      online_worldwide: z.boolean().optional(),
    })
    .optional(),
  client_results_intro: z.string().trim().max(600).nullable().optional(),
});

export const saveMyWebsiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => SaveContentSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { professional_id: userId };
    if (data.subtitle !== undefined) patch.subtitle = data.subtitle;
    if (data.method_name !== undefined) patch.method_name = data.method_name;
    if (data.method_intro !== undefined) patch.method_intro = data.method_intro;
    if (data.method_pillars !== undefined) patch.method_pillars = data.method_pillars;
    if (data.venues !== undefined) patch.venues = data.venues;
    if (data.coaching_reach !== undefined) patch.coaching_reach = data.coaching_reach;
    if (data.client_results_intro !== undefined)
      patch.client_results_intro = data.client_results_intro;

    const { error } = await supabaseAdmin
      .from("websites")
      .upsert(patch as never, { onConflict: "professional_id" });
    if (error) throw error;
    return { ok: true };
  });

/* ===================================================================== */
/* Transformations CRUD                                                   */
/* ===================================================================== */

const TransformationSchema = z.object({
  id: z.string().uuid().optional(),
  client_first_name: z.string().trim().max(60).nullable().optional(),
  client_role: z.string().trim().max(60).nullable().optional(),
  duration_label: z.string().trim().max(40).nullable().optional(),
  metric: z.string().trim().max(80).nullable().optional(),
  headline: z.string().trim().max(120).nullable().optional(),
  quote: z.string().trim().max(600).nullable().optional(),
  image_url: z.string().trim().url().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(99).default(0),
  is_published: z.boolean().default(true),
});

async function assertOwnsRow(
  supabaseAdmin: { from: (t: string) => any },
  table: string,
  id: string | undefined,
  userId: string,
  ownerCol: "user_id" | "professional_id",
): Promise<void> {
  if (!id) return;
  const { data: existing } = await supabaseAdmin
    .from(table)
    .select(ownerCol)
    .eq("id", id)
    .maybeSingle();
  if (existing && (existing as Record<string, string>)[ownerCol] !== userId) {
    throw new Error("Not found");
  }
}

export const upsertTransformation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => TransformationSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, context.userId);
    await assertOwnsRow(supabaseAdmin, "website_transformations", data.id, context.userId, "user_id");
    const row = { ...data, user_id: context.userId };
    const { data: out, error } = await supabaseAdmin
      .from("website_transformations")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return out as TransformationDTO;
  });

export const deleteTransformation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("website_transformations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/* ===================================================================== */
/* Client results CRUD                                                    */
/* ===================================================================== */

const ResultSchema = z.object({
  id: z.string().uuid().optional(),
  headline: z.string().trim().max(120).nullable().optional(),
  body: z.string().trim().max(800).nullable().optional(),
  review_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().min(0).max(99).default(0),
  is_published: z.boolean().default(true),
});

export const upsertClientResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => ResultSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, context.userId);
    await assertOwnsRow(supabaseAdmin, "website_client_results", data.id, context.userId, "user_id");
    const row = { ...data, user_id: context.userId };
    const { data: out, error } = await supabaseAdmin
      .from("website_client_results")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return out as ClientResultDTO;
  });

export const deleteClientResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("website_client_results")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/* ===================================================================== */
/* FAQs CRUD                                                              */
/* ===================================================================== */

const FaqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(3).max(200),
  answer: z.string().trim().min(3).max(1200),
  sort_order: z.number().int().min(0).max(99).default(0),
  source: z.enum(["manual", "ai"]).default("manual"),
});

export const upsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => FaqSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, context.userId);
    await assertOwnsRow(supabaseAdmin, "website_faqs", data.id, context.userId, "user_id");
    const row = { ...data, user_id: context.userId };
    const { data: out, error } = await supabaseAdmin
      .from("website_faqs")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return out as FaqDTO;
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("website_faqs")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/* ===================================================================== */
/* AI drafting (Method pillars, FAQs)                                     */
/* Voice rules mirror src/lib/profile/bio-ai.functions.ts                 */
/* ===================================================================== */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";

const VOICE = `You write copy for professional fitness, strength, nutrition, yoga and Pilates coaches on the REPs directory.
Voice rules (non-negotiable):
- First person ("I help", "I work with") — never third person, never "we".
- British English. Plain, grounded, specific. No marketing jargon, no emoji, no exclamation marks.
- Only use facts the pro supplied. Never invent numbers, credentials, awards or client counts.
- Banned: "passionate about", "your journey", "transform your life", "next level", "results-driven", "unleash your potential", "fitness journey", "level up", "no excuses", "game-changer", "let me help you".`;

async function callJSON(system: string, user: string): Promise<unknown> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
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
  if (res.status === 429) throw new Error("AI is rate-limiting — try again in a few seconds.");
  if (res.status === 402) throw new Error("AI credits exhausted. Top up in Settings → Workspace → Usage.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI request failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = body.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON.");
  }
}

async function loadFacts(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: pro }, { data: prof }, { data: svc }] = await Promise.all([
    supabaseAdmin
      .from("professionals")
      .select(
        "primary_profession, specialisms, city, in_person_available, online_available",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabaseAdmin
      .from("services")
      .select("title")
      .eq("professional_id", userId)
      .eq("is_published", true)
      .limit(8),
  ]);
  const firstName = (prof?.full_name ?? "").split("")[0] ?? "";
  const modes: string[] = [];
  if (pro?.in_person_available) modes.push("in-person");
  if (pro?.online_available) modes.push("online");
  return [
    firstName ? `- First name: ${firstName}` : "",
    pro?.primary_profession ? `- Profession: ${pro.primary_profession}` : "",
    pro?.specialisms?.length ? `- Specialisms: ${pro.specialisms.join(", ")}` : "",
    pro?.city ? `- City: ${pro.city}` : "",
    modes.length ? `- Works: ${modes.join(" + ")}` : "",
    svc?.length ? `- Services: ${svc.map((s) => s.title).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const aiDraftMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z.object({ extra: z.string().trim().max(400).optional().default("") }).parse(d),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{ method_name: string; method_intro: string; pillars: MethodPillar[] }> => {
      const facts = await loadFacts(context.userId);
      const sys = `${VOICE}\nReturn STRICT JSON: { "method_name": string, "method_intro": string (max 280 chars), "pillars": [{"title": string (max 40 chars), "body": string (max 240 chars)}] }. Exactly 3 pillars.`;
      const user = `Facts about the coach:\n${facts}\n${data.extra ? `Extra context: ${data.extra}` : ""}\n\nWrite a short "How I coach" / Foundation Method block — name + one-paragraph intro + 3 pillars. Pillars describe the actual stages of how the coach works (e.g. Assess, Build, Sustain). Grounded, specific, first person.`;
      const parsed = (await callJSON(sys, user)) as {
        method_name?: string;
        method_intro?: string;
        pillars?: Array<{ title?: string; body?: string }>;
      };
      return {
        method_name: String(parsed.method_name ?? "").trim().slice(0, 80),
        method_intro: String(parsed.method_intro ?? "").trim().slice(0, 600),
        pillars: (parsed.pillars ?? [])
          .map((p) => ({
            title: String(p.title ?? "").trim().slice(0, 60),
            body: String(p.body ?? "").trim().slice(0, 400),
          }))
          .filter((p) => p.title && p.body)
          .slice(0, 3),
      };
    },
  );

export const aiDraftFaqs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z.object({ count: z.number().int().min(3).max(8).default(5) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ faqs: Array<{ question: string; answer: string }> }> => {
    const facts = await loadFacts(context.userId);
    const sys = `${VOICE}\nReturn STRICT JSON: { "faqs": [{"question": string (max 140 chars), "answer": string (max 600 chars)}] }. Exactly ${data.count} items.`;
    const user = `Facts:\n${facts}\n\nWrite ${data.count} FAQs a prospective client would ask before enquiring. Cover at least: what to expect in the first session, who this is best for, where + how sessions run (in-person/online), how pricing works (don't invent prices — say "see Services"), what makes the coach's approach different, results timeline. Answers in first person.`;
    const parsed = (await callJSON(sys, user)) as {
      faqs?: Array<{ question?: string; answer?: string }>;
    };
    return {
      faqs: (parsed.faqs ?? [])
        .map((f) => ({
          question: String(f.question ?? "").trim().slice(0, 200),
          answer: String(f.answer ?? "").trim().slice(0, 1200),
        }))
        .filter((f) => f.question && f.answer)
        .slice(0, data.count),
    };
  });

const TaglineContextSchema = z.object({
  audience: z.string().trim().max(400).optional().default(""),
  specialisms: z.array(z.string().trim().max(60)).max(10).optional().default([]),
});

export const aiDraftTagline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => TaglineContextSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ tagline: string }> => {
    const facts = await loadFacts(context.userId);
    const extras = [
      data.audience ? `- Who they help / how: ${data.audience}` : "",
      data.specialisms.length ? `- Focus areas: ${data.specialisms.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const sys = `${VOICE}\nReturn STRICT JSON: { "tagline": string }.\nRules for the tagline:\n- 4 to 10 words, sentence case.\n- Outcome- or client-led. Concrete, not slogan-y.\n- No emojis, no exclamation marks, no all caps.\n- No city name, no "certified", no "qualified", no "coach"/"trainer" job-title words.\n- Never invent numbers or timeframes not implied by the facts.`;
    const user = `Facts about the coach:\n${facts}${extras ? `\nCoach's own context:\n${extras}` : ""}\n\nWrite one tagline that could sit as the H1 on their public REPS page.`;
    const parsed = (await callJSON(sys, user)) as { tagline?: string };
    const tagline = String(parsed.tagline ?? "").trim().replace(/^["']|["']$/g, "").slice(0, 200);
    if (!tagline) throw new Error("AI could not draft a tagline. Try again.");
    return { tagline };
  });

const SubtitleContextSchema = z.object({
  tagline: z.string().trim().max(200).optional().default(""),
  audience: z.string().trim().max(400).optional().default(""),
});

export const aiDraftSubtitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => SubtitleContextSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ subtitle: string }> => {
    const facts = await loadFacts(context.userId);
    const extras = [
      data.tagline ? `- Current tagline (do NOT repeat it): ${data.tagline}` : "",
      data.audience ? `- Who they help / how: ${data.audience}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const sys = `${VOICE}\nReturn STRICT JSON: { "subtitle": string }.\nRules for the subtitle:\n- 6 to 16 words. Sentence case. One line.\n- Sits directly under the H1 tagline — it supports the tagline, does not repeat it.\n- Concrete: who it's for, how it's delivered, or the concrete promise.\n- No emojis, no exclamation marks, no all caps, no job-title words ("coach", "trainer").\n- No invented numbers, credentials or timeframes.`;
    const user = `Facts about the coach:\n${facts}${extras ? `\nExtra context:\n${extras}` : ""}\n\nWrite one supporting subtitle line for their public REPS page.`;
    const parsed = (await callJSON(sys, user)) as { subtitle?: string };
    const subtitle = String(parsed.subtitle ?? "").trim().replace(/^["']|["']$/g, "").slice(0, 200);
    if (!subtitle) throw new Error("AI could not draft a subtitle. Try again.");
    return { subtitle };
  });

const AboutContextSchema = z.object({
  audience: z.string().trim().max(400).optional().default(""),
  differentiator: z.string().trim().max(400).optional().default(""),
  tone: z.enum(["warm", "direct", "professional", "playful"]).optional().default("warm"),
});

export const aiDraftAbout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => AboutContextSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ about: string }> => {
    const facts = await loadFacts(context.userId);
    const extras = [
      data.audience ? `- Who they help / how: ${data.audience}` : "",
      data.differentiator ? `- What makes them different: ${data.differentiator}` : "",
      `- Tone: ${data.tone}`,
    ]
      .filter(Boolean)
      .join("\n");
    const sys = `${VOICE}\nReturn STRICT JSON: { "about": string }.\nRules for the About:\n- 60 to 110 words total, written as 2 short paragraphs separated by a single blank line.\n- First person. Grounded and specific. Plain English.\n- No bullet lists, no hashtags, no pricing, no unverifiable stats or client counts.\n- Do not repeat the tagline verbatim.\n- Match the requested tone without becoming cheesy.`;
    const user = `Facts about the coach:\n${facts}\nCoach's own context:\n${extras}\n\nWrite the About paragraphs for their public REPS page.`;
    const parsed = (await callJSON(sys, user)) as { about?: string };
    const about = String(parsed.about ?? "").trim().slice(0, 4000);
    if (!about) throw new Error("AI could not draft an About. Try again.");
    return { about };
  });
