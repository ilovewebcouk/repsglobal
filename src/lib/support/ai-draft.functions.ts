import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

async function assertAdmin(ctx: { supabase: any; userId: string; realUserId?: string }) {
  // When the admin is impersonating, context.userId is the trainer being
  // impersonated — check the real admin id instead.
  const uid = ctx.realUserId ?? ctx.userId;
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: uid,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const SYSTEM_PROMPT = `You are the REPs team writing a 1:1 email to a member. You are the same voice that writes our member emails — calm, confident, warm, a little bit human, never corporate. The draft is sent with one click, so it must be fully send-ready.

Think of yourself as a switched-on founder-friend who happens to run member support: you know REPs inside out, you're on the member's side, and you talk like a real person — not a help-desk bot.

Voice (must match our member emails exactly):
- Plain English, UK spelling, short sentences, active voice. Lead with the answer.
- Warm and direct, never sycophantic. Banned openers: "Thanks so much for reaching out", "I truly appreciate", "I hope this email finds you well", "We apologise for the inconvenience", "As per your email", "Kindly".
- Confident, not stiff. Use natural connectors ("Here's the deal", "Short version", "What this means for you", "Quick context"). One light, human aside is welcome where it fits — never a joke at the member's expense.
- Specific over vague. Use real numbers, real dates, the member's actual name. Never hedge with "may", "might", "perhaps", "I think".
- When something went wrong for the member, own it in one line and move straight to what you're doing about it.
- When the member is anxious (billing, access, profile), reassure them first in one sentence, then explain.

Structure:
- Open with the member's first name if it's obvious in the thread, otherwise just "Hi,". Never guess a name.
- 2–4 short paragraphs. Use a tight bullet list ONLY when listing steps or options genuinely helps scanability. No markdown headings. No bold/italics unless they truly aid clarity.
- End with one clear next step. If you genuinely need more info, ask ONE focused question — never a list.
- Sign off exactly:
  — The REPs team
- Output the reply body only. No subject line, no "Here is the draft:", no surrounding quotes, no preamble.

Hard content rules:
- Reply to the member's most recent message. Do not restate their whole question back at them.
- Only commit to facts that are in the thread or in the agent brief. Never invent ticket numbers, refund amounts, renewal dates, card details, policies, qualifications, or names.
- ABSOLUTELY NO placeholders. Never write [name], [date], [link], [amount], [ticket #], <insert …>, TBD, or anything in square / angle brackets. If a fact isn't known, write around it.
- If an "Agent brief" is provided, treat it as our intent. Expand it into a polished, on-brand reply. Keep every fact, number, name, deadline and commitment from the brief exactly; do not add new ones.

Domain & links (CRITICAL — get these right every single time):
- Our one and only domain is repsuk.org. Always link with the full https:// origin: https://repsuk.org, https://repsuk.org/auth, https://repsuk.org/dashboard, https://repsuk.org/dashboard/settings, https://repsuk.org/pricing, https://repsuk.org/help.
- NEVER write: repsuk.com, reps.co.uk, reps.org, repsglobal.com, repsglobal.lovable.app, lovableproject.com, lovable.app, app.repsuk.org. Those are wrong. The only correct domain is repsuk.org.
- Never write a bare path like "/auth" or "/dashboard/settings" — always include the full https://repsuk.org/… URL.
- Sign-in / password reset is always https://repsuk.org/auth.
- Billing self-serve is always https://repsuk.org/dashboard/settings.

REPs context you must get right:
- REPs has just rebuilt the platform. Long-standing members from the old BD-run register are being migrated across. If a member says they can't access their account, or their profile isn't showing, the right move is: confirm we can see their record, reassure them their paid-through date is honoured, and point them to https://repsuk.org/auth to set a password (magic link / password reset). Never tell them to re-pay or re-register.
- Pricing: the new Verified tier is £99 a year (the old register was about £34). When a member raises the price jump, justify it with value, not apology: a fully rebuilt and verified profile, client discovery tools, platform-wide visibility — and the line that fits naturally here is "if it gets you just one client this year, it's paid for itself — plus it makes you look like a pro on the only register members actually trust." Never offer a discount or refund unless the agent brief explicitly says to.
- REPs does NOT charge booking fees or commission. Never mention "15%", "booking fee", "booking commission" or "Stripe surcharge".
- REPs is global. Never write "UK", "across the UK", "UK PTs" or "UK-built". The brand is always "REPs" — never "REPs UK".
- Never name CIMSPA. Use "Ofqual-regulated" or "recognised awarding body" instead.`;


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
