import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* -------------------------------------------------------------------------- */
/* AI tagline + bio assist                                                    */
/*                                                                            */
/* Two actions, both internal-only:                                           */
/*   - draftCopy:   generate 3 variants from facts (blank-state)              */
/*   - rewriteCopy: rewrite existing copy in a chosen tone                    */
/*                                                                            */
/* No fabrication: prompts are explicit that the model may only use the       */
/* facts supplied by the pro. Output goes through a guardrail filter that     */
/* strips emoji + banned cliché phrases.                                      */
/* -------------------------------------------------------------------------- */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";

const TAGLINE_MAX = 160;
const BIO_MAX = 1200;

const TONES = ["tighten", "confident", "warmer", "specific"] as const;
type Tone = (typeof TONES)[number];

const BANNED_PHRASES = [
  "passionate about",
  "take your training to the next level",
  "take it to the next level",
  "your journey",
  "transform your life",
  "results-driven",
  "results driven",
  "game-changer",
  "game changer",
  "unleash your potential",
  "fitness journey",
  "level up your",
  "no excuses",
  "fitness enthusiast",
  "let me help you",
];

const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/gu;

function cleanCopy(text: string): string {
  let out = text.replace(EMOJI_REGEX, "").trim();
  // collapse runs of whitespace introduced by emoji removal
  out = out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
  // strip surrounding quotes the model sometimes adds
  out = out.replace(/^["“'']+|["”'']+$/g, "").trim();
  return out;
}

function hasBannedPhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some((p) => lower.includes(p));
}

/* -------------------------------------------------------------------------- */
/* Shared facts schema                                                         */
/* -------------------------------------------------------------------------- */

const FactsSchema = z.object({
  full_name: z.string().trim().max(120).optional().default(""),
  primary_profession: z.string().trim().max(80).optional().default(""),
  specialisms: z.array(z.string().trim().max(80)).max(8).optional().default([]),
  city: z.string().trim().max(80).optional().default(""),
  in_person_available: z.boolean().optional().default(false),
  online_available: z.boolean().optional().default(false),
  years_experience: z.number().int().min(0).max(60).optional(),
  qualifications: z.array(z.string().trim().max(120)).max(8).optional().default([]),
  service_titles: z.array(z.string().trim().max(120)).max(8).optional().default([]),
  extra: z.string().trim().max(400).optional().default(""),
});

type Facts = z.infer<typeof FactsSchema>;

function factsBlock(f: Facts): string {
  const lines: string[] = [];
  if (f.full_name) lines.push(`- First name: ${f.full_name.split(" ")[0]}`);
  if (f.primary_profession) lines.push(`- Profession: ${f.primary_profession}`);
  if (f.specialisms.length) lines.push(`- Specialisms: ${f.specialisms.join(", ")}`);
  if (f.city) lines.push(`- City: ${f.city}`);
  const modes: string[] = [];
  if (f.in_person_available) modes.push("in-person");
  if (f.online_available) modes.push("online");
  if (modes.length) lines.push(`- Works: ${modes.join(" + ")}`);
  if (typeof f.years_experience === "number")
    lines.push(`- Years of experience: ${f.years_experience}`);
  if (f.qualifications.length)
    lines.push(`- Qualifications: ${f.qualifications.join(", ")}`);
  if (f.service_titles.length)
    lines.push(`- Services offered: ${f.service_titles.join("; ")}`);
  if (f.extra) lines.push(`- Extra context from the pro: ${f.extra}`);
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Voice + guardrails (shared system block)                                    */
/* -------------------------------------------------------------------------- */

const VOICE_RULES = `You write copy for professional fitness, strength, nutrition, yoga and Pilates coaches on the REPs directory.

Voice rules (NON-NEGOTIABLE):
- First person ("I help", "I work with") — never third person, never "we".
- British English spelling.
- Plain, grounded, specific. Direct sentences. No marketing jargon.
- Lead with the client and the outcome, then credentials, then approach.
- Only use facts the pro has supplied below. NEVER invent numbers, certifications, awards, client counts, locations, or outcomes that aren't in the facts. If a fact isn't given, leave it out.
- No emoji. No hashtags. No exclamation marks. No ALL CAPS. No surrounding quotes.
- BANNED phrases (do not use any of these or close paraphrases): "passionate about", "take your training to the next level", "your journey", "transform your life", "results-driven", "unleash your potential", "fitness journey", "level up", "no excuses", "fitness enthusiast", "let me help you", "game-changer".`;

const REFERENCE_TAGLINES = `Reference taglines that hit the bar (do NOT copy — match the tone):
- "Strength and hybrid coaching for people who want to train hard and stay healthy past 40."
- "I help busy professionals build real strength in three sessions a week — online or in London."
- "Pre and post-natal Pilates for mums who want to feel strong again without rushing it."`;

/* -------------------------------------------------------------------------- */
/* Lovable AI plumbing                                                         */
/* -------------------------------------------------------------------------- */

function requireLovableKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}

async function callJSON(
  systemPrompt: string,
  userPrompt: string,
): Promise<unknown> {
  const key = requireLovableKey();
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
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (res.status === 429) {
    throw new Error(
      "Lovable AI is rate-limiting right now — give it a few seconds and try again.",
    );
  }
  if (res.status === 402) {
    throw new Error(
      "Workspace AI credits are exhausted. Top up credits in Settings → Workspace → Usage.",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request failed: ${res.status} ${text.slice(0, 240)}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = body.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON.");
  }
}

/* -------------------------------------------------------------------------- */
/* draftCopy                                                                   */
/* -------------------------------------------------------------------------- */

const DraftInput = z.object({
  field: z.enum(["tagline", "bio"]),
  facts: FactsSchema,
});

export const draftCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DraftInput.parse(d))
  .handler(async ({ data }): Promise<{ variants: string[] }> => {
    const isTagline = data.field === "tagline";
    const limit = isTagline ? TAGLINE_MAX : BIO_MAX;
    const target = isTagline
      ? "ONE line, 90-130 characters, never over 160."
      : "3-5 short paragraphs, 600-900 characters total, never over 1200.";

    const angles = isTagline
      ? `Generate THREE distinct taglines:
1. outcome-led — lead with the client transformation
2. credentials-led — lead with what makes the pro trustworthy
3. personality-led — lead with the kind of person they are to work with`
      : `Generate THREE distinct bios:
1. outcome-led — open with the client and what they get
2. credentials-led — open with experience and qualifications
3. personality-led — open with the pro's approach and what it's like to work with them
Each bio must be self-contained and end with a single sentence on how to get started (e.g. "Send me an enquiry to chat about what you're after.").`;

    const system = `${VOICE_RULES}\n\n${REFERENCE_TAGLINES}\n\nReturn ONLY valid JSON: { "variants": [string, string, string] }. Each string is a complete ${isTagline ? "tagline" : "bio"}. ${target}`;

    const user = `Facts about the pro (use ONLY these — do not invent anything else):
${factsBlock(data.facts) || "(no facts supplied)"}

${angles}

Hard limit: ${limit} characters per variant.`;

    const parsed = (await callJSON(system, user)) as { variants?: unknown };
    if (!Array.isArray(parsed.variants)) {
      throw new Error("AI response missing variants.");
    }

    const variants = parsed.variants
      .map((v) => (typeof v === "string" ? cleanCopy(v) : ""))
      .filter((v) => v.length > 0)
      .map((v) => (v.length > limit ? v.slice(0, limit) : v))
      .filter((v) => !hasBannedPhrase(v));

    if (variants.length === 0) {
      throw new Error(
        "The AI couldn't produce variants that meet our quality bar — try again, or add a few more facts.",
      );
    }

    return { variants };
  });

/* -------------------------------------------------------------------------- */
/* rewriteCopy                                                                 */
/* -------------------------------------------------------------------------- */

const RewriteInput = z.object({
  field: z.enum(["tagline", "bio"]),
  tone: z.enum(TONES),
  current: z.string().trim().min(1).max(BIO_MAX),
  facts: FactsSchema.optional(),
});

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  tighten:
    "Cut every unnecessary word. Same meaning, fewer characters. Preserve every concrete fact.",
  confident:
    "Sharpen the voice. Direct, grounded, no hedging. Replace soft phrases with clearer claims — but only claims the original already implied.",
  warmer:
    "Make it feel more human and approachable. Soften any blunt phrasing. Keep all the facts.",
  specific:
    "Make it more concrete. Replace vague claims with the specifics that ARE already in the original or facts. Do NOT invent specifics that aren't given.",
};

export const rewriteCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RewriteInput.parse(d))
  .handler(async ({ data }): Promise<{ rewrite: string }> => {
    const isTagline = data.field === "tagline";
    const limit = isTagline ? TAGLINE_MAX : BIO_MAX;

    const system = `${VOICE_RULES}\n\nYou rewrite an existing ${isTagline ? "tagline" : "bio"} in a chosen tone.

Tone for this rewrite: ${TONE_INSTRUCTIONS[data.tone]}

Hard rules:
- Preserve every concrete fact in the original. Do not add new facts.
- Match the original's length within ±20%. Hard cap: ${limit} characters.
- ${isTagline ? "Return ONE line." : "Return 3-5 short paragraphs."}

Return ONLY valid JSON: { "rewrite": string }.`;

    const factBlock = data.facts ? factsBlock(data.facts) : "";

    const user = `Original ${isTagline ? "tagline" : "bio"}:
"""
${data.current}
"""

${factBlock ? `Facts about the pro (for context — do not introduce facts that aren't here):\n${factBlock}\n` : ""}
Rewrite per the system instructions.`;

    const parsed = (await callJSON(system, user)) as { rewrite?: unknown };
    if (typeof parsed.rewrite !== "string") {
      throw new Error("AI response missing rewrite.");
    }

    let out = cleanCopy(parsed.rewrite);
    if (out.length > limit) out = out.slice(0, limit);
    if (!out) throw new Error("AI returned empty rewrite.");

    return { rewrite: out };
  });
