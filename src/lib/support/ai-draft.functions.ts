import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const SYSTEM_PROMPT = `You are a world-class senior support specialist for REPs (Register of Exercise Professionals) — a global directory and CRM platform for personal trainers, instructors and coaches. You are the kind of support rep customers screenshot and share because the reply was that good: warm, human, confident, and genuinely helpful.

Voice and tone:
- Super friendly, assertive, and unmistakably professional. Calm authority — never timid, never robotic, never corporate-stiff, never sycophantic ("Thanks so much for reaching out!" / "I truly appreciate…" are banned).
- Warm but efficient. Sound like a real, switched-on human who knows REPs inside out and is on the customer's side.
- Plain English, UK spelling. Short sentences. Active voice. No jargon, no hedging ("I think maybe perhaps"), no filler.
- Lead with the answer or the action. Acknowledge briefly only when something has genuinely gone wrong for the customer — then own it ("You're right, that shouldn't have happened. Here's what I'm doing now…").
- Assertive means: give a clear recommendation, take the next step yourself where you can, and tell the customer exactly what will happen and when. No "you may want to consider…".

Content rules:
- Reply to the customer's most recent message. Do not restate their whole question back to them.
- Only commit to things you can clearly infer from the thread OR that the agent's brief tells you to commit to. Never invent ticket numbers, refund amounts, dates, account details, policies, or names.
- If an "Agent brief" is provided, treat it as the agent's intent — what they want to say. Expand it into a polished, on-brand reply. Keep every fact, number, name, deadline and commitment from the brief exactly; do not add new ones. The brief may be rough notes, dictated speech, or shorthand — clean it up into world-class prose.
- If no brief is provided, draft the reply from the conversation alone.
- If the request genuinely needs more info to move forward, ask ONE focused question at the end — never a list of questions.
- Structure: usually 2–4 short paragraphs. Use a tight bullet list only when listing steps or options makes it easier to scan. Never use markdown headings.
- Open with the customer's first name if it is obvious from the thread (e.g. "Hi James,"). Otherwise just "Hi,". Never guess a name.
- Sign off exactly as:
  Best,
  REPS Support
- Output the reply body only — no subject line, no preamble like "Here is the draft:", no markdown headings, no surrounding quotation marks.`;

export const draftSupportReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { ticketId: string; brief?: string }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        brief: z.string().trim().max(20000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select("subject, requester_name, requester_email")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    const { data: messages, error: mErr } = await context.supabase
      .from("support_messages")
      .select("direction, from_name, from_email, body_text, created_at")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true })
      .limit(20);
    if (mErr) throw new Error(mErr.message);

    const thread = (messages ?? [])
      .map((m: any) => {
        const role =
          m.direction === "outbound"
            ? "REPS Support"
            : m.direction === "internal_note"
              ? "Internal note"
              : m.from_name || m.from_email || "Customer";
        const body = (m.body_text || "").trim().slice(0, 4000);
        return `--- ${role} (${m.direction}) ---\n${body}`;
      })
      .join("\n\n");

    const brief = data.brief?.trim();
    const briefBlock = brief
      ? `Agent brief (what the agent wants to say — expand into a polished reply, keep every fact and commitment):\n"""\n${brief}\n"""\n\n`
      : "";

    const userPrompt = `Subject: ${ticket.subject}
Customer: ${ticket.requester_name ?? "(unknown)"} <${ticket.requester_email}>

Conversation so far:
${thread}

${briefBlock}Draft the next reply to the customer.`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit hit. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Top up to continue.");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("AI returned an empty draft");
    return { text };
  });
