// Server-only scoring helper. Re-usable from both authenticated server fns
// (createLead) and public ones (submitEnquiry). Best-effort: returns null on
// any failure so callers never block the user flow.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";

export async function scoreLeadById(enquiryId: string, professionalId: string): Promise<void> {
  try {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return;

    const { data: lead } = await supabaseAdmin
      .from("enquiries")
      .select("id, message, goals, frequency, start_by, budget, location, source, estimated_value_pence")
      .eq("id", enquiryId)
      .eq("professional_id", professionalId)
      .maybeSingle();
    if (!lead) return;

    const system = `You are a lead-qualification engine for a fitness coach platform (REPs).
Score the lead 0-100 on intent + fit + buying signals. Return STRICT JSON:
{
  "score": int 0-100,
  "band": "cold"|"warm"|"hot",
  "summary": one sentence plain english,
  "recommended_action": one short imperative sentence,
  "predicted_conversion_pct": int 0-100,
  "reasons": array of 2-4 short bullet strings
}
Weight: explicit timeline, defined budget, specific goals, urgency in tone.`;

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

    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPayload },
        ],
      }),
    });
    if (!res.ok) return;
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));
    const band = score >= 80 ? "hot" : score >= 40 ? "warm" : "cold";
    const reasons = Array.isArray(parsed.reasons)
      ? (parsed.reasons as unknown[]).slice(0, 4).map((r) => String(r).slice(0, 160))
      : [];

    await supabaseAdmin
      .from("enquiries")
      .update({
        ai_score: score,
        ai_band: band,
        ai_summary: String(parsed.summary ?? "").slice(0, 400),
        ai_recommended_action: String(parsed.recommended_action ?? "").slice(0, 240),
        ai_predicted_pct: Math.max(0, Math.min(100, Math.round(Number(parsed.predicted_conversion_pct ?? 0)))),
        ai_reasons: reasons,
        ai_updated_at: new Date().toISOString(),
      })
      .eq("id", enquiryId)
      .eq("professional_id", professionalId);
  } catch (e) {
    console.error("[scoreLeadById] best-effort score failed:", e);
  }
}
