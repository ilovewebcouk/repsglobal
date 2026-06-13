// Phase 2.0 Leads AI layer — score, draft reply, suggest next actions.
// All calls are server-side via Lovable AI Gateway. Never exposes LOVABLE_API_KEY.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";

function requireKey(): string {
  const k = process.env.LOVABLE_API_KEY;
  if (!k) throw new Error("Missing LOVABLE_API_KEY");
  return k;
}

async function callAiJson(system: string, user: string): Promise<unknown> {
  const key = requireKey();
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("AI is rate-limiting. Try again in a moment.");
  if (res.status === 402) throw new Error("Workspace AI credits exhausted. Top up in Settings → Usage.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI request failed ${res.status}: ${t.slice(0, 200)}`);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = body.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}

/* -------------------- Score a single lead -------------------- */

const ScoreSchema = z.object({ enquiryId: z.string().uuid() });

export type LeadAiResult = {
  score: number;
  band: "cold" | "warm" | "hot";
  summary: string;
  recommended_action: string;
  predicted_conversion_pct: number;
  reasons: string[];
};

export const scoreLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScoreSchema.parse(d))
  .handler(async ({ data, context }): Promise<LeadAiResult> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lead, error } = await supabaseAdmin
      .from("enquiries")
      .select(
        "id, sender_name, message, goals, frequency, start_by, budget, location, source, estimated_value_pence",
      )
      .eq("id", data.enquiryId)
      .eq("professional_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!lead) throw new Error("Lead not found");

    const system = `You are a lead-qualification engine for a fitness coach platform (REPs).
Score the lead 0-100 on intent + fit + buying signals. Return STRICT JSON:
{
  "score": int 0-100,
  "band": "cold"|"warm"|"hot",   // cold <40, warm 40-79, hot >=80
  "summary": one sentence, plain english, what the lead wants and why it matters,
  "recommended_action": one short imperative sentence (the next best action for the trainer),
  "predicted_conversion_pct": int 0-100,
  "reasons": array of 2-4 short bullet strings citing the strongest signals
}
Weight: explicit timeline ("start_by"), defined budget, specific goals, clear contact details, urgency in tone.`;

    const userPayload = JSON.stringify({
      message: lead.message,
      goals: lead.goals,
      frequency: lead.frequency,
      start_by: lead.start_by,
      budget: lead.budget,
      location: lead.location,
      source: lead.source,
      estimated_value_pence: lead.estimated_value_pence,
    });

    const parsed = (await callAiJson(system, userPayload)) as Partial<LeadAiResult>;
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));
    const band: "cold" | "warm" | "hot" =
      score >= 80 ? "hot" : score >= 40 ? "warm" : "cold";
    const result: LeadAiResult = {
      score,
      band,
      summary: String(parsed.summary ?? "").slice(0, 400),
      recommended_action: String(parsed.recommended_action ?? "").slice(0, 240),
      predicted_conversion_pct: Math.max(
        0,
        Math.min(100, Math.round(Number(parsed.predicted_conversion_pct ?? 0))),
      ),
      reasons: Array.isArray(parsed.reasons)
        ? parsed.reasons.slice(0, 4).map((r) => String(r).slice(0, 160))
        : [],
    };

    await supabaseAdmin
      .from("enquiries")
      .update({
        ai_score: result.score,
        ai_band: result.band,
        ai_summary: result.summary,
        ai_recommended_action: result.recommended_action,
        ai_predicted_pct: result.predicted_conversion_pct,
        ai_reasons: result.reasons,
        ai_updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id)
      .eq("professional_id", userId);

    return result;
  });

/* -------------------- Draft a reply -------------------- */

const DraftSchema = z.object({
  enquiryId: z.string().uuid(),
  tone: z.enum(["warm", "direct", "concise"]).default("warm").optional(),
});

export type DraftReply = { subject: string; body: string };

export const draftLeadReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DraftSchema.parse(d))
  .handler(async ({ data, context }): Promise<DraftReply> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: lead }, { data: prof }] = await Promise.all([
      supabaseAdmin
        .from("enquiries")
        .select("sender_name, message, goals, frequency, start_by, budget, location")
        .eq("id", data.enquiryId)
        .eq("professional_id", userId)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    if (!lead) throw new Error("Lead not found");
    const proFirstName = (prof?.full_name ?? "").split(" ")[0] || "your coach";
    const tone = data.tone ?? "warm";

    const system = `You draft email replies for fitness coaches replying to enquiries from prospective clients on the REPs platform.

Voice rules (NON-NEGOTIABLE):
- First person ("I"), British English, plain and grounded. Direct, no marketing jargon.
- Tone: ${tone}.
- Address them by first name when known. Acknowledge their specific goal. Suggest one clear next step (15-min call, trial session, or reply with availability).
- Length: 4-7 sentences max. No emojis. No exclamation marks. No "Hope you're well" filler.
- Sign off with the coach's first name only.

Return STRICT JSON:
{ "subject": short subject line, "body": full email body as plain text with \\n line breaks }`;

    const userPayload = JSON.stringify({
      coach_first_name: proFirstName,
      lead: {
        name: lead.sender_name,
        message: lead.message,
        goals: lead.goals,
        frequency: lead.frequency,
        start_by: lead.start_by,
        budget: lead.budget,
        location: lead.location,
      },
    });

    const parsed = (await callAiJson(system, userPayload)) as Partial<DraftReply>;
    return {
      subject: String(parsed.subject ?? "Re: your enquiry").slice(0, 140),
      body: String(parsed.body ?? "").slice(0, 4000),
    };
  });

/* -------------------- Forecast 30d revenue -------------------- */

export const forecastRevenue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ forecast_pence: number; basis: string }> => {
      const userId = context.userId;
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data, error } = await supabaseAdmin
        .from("enquiries")
        .select("estimated_value_pence, ai_predicted_pct, stage")
        .eq("professional_id", userId)
        .not("stage", "in", "(converted,lost)");
      if (error) throw error;
      const rows = data ?? [];
      const forecast = rows.reduce(
        (a, r) =>
          a +
          (r.estimated_value_pence ?? 0) * ((r.ai_predicted_pct ?? 0) / 100),
        0,
      );
      return {
        forecast_pence: Math.round(forecast),
        basis: `${rows.length} active leads, AI-weighted by predicted conversion %`,
      };
    },
  );
