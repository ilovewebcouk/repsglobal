import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const SYSTEM_PROMPT = `You are a support agent for REPs (Register of Exercise Professionals), a global directory and CRM platform for personal trainers, instructors and coaches.

Write a reply to the customer's most recent message. Rules:
- Professional, warm, plain English. UK spelling.
- Be concise. Do not pad. Do not restate the whole question.
- Only commit to things you can clearly infer from the thread. Never invent ticket numbers, refund amounts, account details, or names.
- If the request needs more info, ask one focused question.
- Sign off as "Best, REPS Support". No subject line, no greetings to specific names unless the customer's name is obvious from the thread.
- Output the reply body only — no preamble, no markdown headings, no quotation marks around the whole thing.`;

export const draftSupportReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string }) =>
    z.object({ ticketId: z.string().uuid() }).parse(d),
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

    const userPrompt = `Subject: ${ticket.subject}
Customer: ${ticket.requester_name ?? "(unknown)"} <${ticket.requester_email}>

Conversation so far:
${thread}

Draft the next reply to the customer.`;

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

// ─────────────────────────────────────────────────────────────────────────────
// Rephrase the admin's own draft in REPS support tone (no thread required).
// ─────────────────────────────────────────────────────────────────────────────
const REPHRASE_PROMPT = `You are an editor for REPs Support. Rewrite the agent's draft reply so it reads as a polished REPs Support message:
- Professional, warm, plain English. UK spelling.
- Keep the agent's meaning and any specific facts, numbers, names or commitments — do not invent new ones.
- Tighten wording. Remove filler. Fix grammar and punctuation.
- Keep it roughly the same length unless the original is rambling.
- Sign off as "Best, REPS Support" only if the draft has no sign-off already.
- Output the rewritten reply body only — no preamble, no commentary, no quotes around it.`;

export const rephraseSupportReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { draft: string; ticketId?: string }) =>
    z
      .object({
        draft: z.string().min(1).max(20000),
        ticketId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    let contextBlock = "";
    if (data.ticketId) {
      const { data: ticket } = await context.supabase
        .from("support_tickets")
        .select("subject")
        .eq("id", data.ticketId)
        .maybeSingle();
      if (ticket?.subject) {
        contextBlock = `Ticket subject: ${ticket.subject}\n\n`;
      }
    }

    const userPrompt = `${contextBlock}Agent draft:
"""
${data.draft}
"""

Rewrite the draft.`;

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
          { role: "system", content: REPHRASE_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit hit. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Top up to continue.");
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status}): ${t.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("AI returned an empty rewrite");
    return { text };
  });
