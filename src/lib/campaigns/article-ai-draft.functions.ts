import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM = `You are the newsletter editor for REPS — the global register of exercise professionals.
You are drafting a newsletter email that promotes a REPS resource article.

Voice rules (non-negotiable):
- British English. Warm, grounded, plain. No marketing jargon, no emoji, no exclamation marks.
- Address the reader as "you". Never "we". Say "REPS" not "we".
- Only use facts present in the supplied article content. Never invent numbers, features, dates, credentials, quotes or names.
- Banned phrases: "unlock", "level up", "next level", "game-changer", "transform your life", "your journey", "results-driven", "passionate about", "let's dive in".
- Do not include unsubscribe, sign-off, footer, links, or the article title itself in the body — the shell provides them.

Output STRICT JSON with this exact shape (no prose, no markdown):
{
  "subject": string,            // 40–70 chars, curiosity-driven, no clickbait, no emoji
  "preheader": string,          // 60–110 chars, complements (does not repeat) the subject
  "intro": string,              // one short opening sentence, 90–160 chars
  "paragraphs": string[],       // 2 to 3 body paragraphs, 240–420 chars each, no bullet lists
  "cta": string                 // 3–6 word call-to-action button label (e.g. "Read the full guide")
}`;

async function callAiJson(user: string): Promise<Record<string, unknown>> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("AI is rate-limiting — try again in a few seconds.");
  if (res.status === 402)
    throw new Error("AI credits exhausted. Top up in Settings → Workspace → Usage.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI request failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = body.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("AI returned invalid JSON.");
  }
}

const InputSchema = z.object({
  title: z.string().min(3).max(220),
  category: z.string().min(1).max(80),
  excerpt: z.string().min(3).max(600),
  readTime: z.string().max(40).optional().default(""),
  dateLabel: z.string().max(40).optional().default(""),
  paragraphs: z.array(z.string().min(1).max(2000)).min(1).max(12),
  headings: z.array(z.string().min(1).max(200)).max(20).optional().default([]),
});

export const draftArticleEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Admin only.
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const articleBrief = [
      `Article title: ${data.title}`,
      `Category: ${data.category}`,
      data.readTime ? `Read time: ${data.readTime}` : "",
      data.dateLabel ? `Published: ${data.dateLabel}` : "",
      "",
      `Excerpt: ${data.excerpt}`,
      "",
      data.headings.length ? `Section headings:\n- ${data.headings.join("\n- ")}` : "",
      "",
      "Article body (verbatim paragraphs):",
      data.paragraphs.slice(0, 8).join("\n\n"),
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await callAiJson(articleBrief);

    // Coerce / defensively narrow the response.
    const subject = String(raw.subject ?? "").trim();
    const preheader = String(raw.preheader ?? "").trim();
    const intro = String(raw.intro ?? "").trim();
    const cta = String(raw.cta ?? "Read the full article").trim();
    const paragraphsRaw = Array.isArray(raw.paragraphs) ? raw.paragraphs : [];
    const paragraphs = paragraphsRaw
      .map((p) => String(p ?? "").trim())
      .filter((p) => p.length > 0)
      .slice(0, 3);

    if (!subject || paragraphs.length < 1) {
      throw new Error("AI returned an incomplete draft. Try again.");
    }

    return { subject, preheader, intro, paragraphs, cta };
  });
