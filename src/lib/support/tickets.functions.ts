import * as React from "react";
import { render } from "@react-email/components";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEMPLATES } from "@/lib/email-templates/registry";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────
export const listTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: "open" | "pending" | "resolved" | "closed" | "all" }) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, source, requester_email, requester_name, assignee_id, sla_due_at, first_response_at, resolved_at, last_message_at, created_at, tags",
      )
      .order("last_message_at", { ascending: false })
      .limit(200);
    if (data?.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ─────────────────────────────────────────────────────────────────────────────
// Get ticket + messages
// ─────────────────────────────────────────────────────────────────────────────
export const getTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    const { data: messages, error: mErr } = await context.supabase
      .from("support_messages")
      .select(
        "id, direction, from_email, from_name, author_user_id, body_text, body_html, created_at, mailgun_message_id, in_reply_to",
      )
      .eq("ticket_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    return { ticket, messages: messages ?? [] };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Update ticket (status, priority, assignee, tags)
// ─────────────────────────────────────────────────────────────────────────────
export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    status?: "open" | "pending" | "resolved" | "closed";
    priority?: "urgent" | "high" | "normal" | "low";
    assignee_id?: string | null;
    tags?: string[];
    subject?: string;
  }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
        priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
        assignee_id: z.string().uuid().nullable().optional(),
        tags: z.array(z.string()).optional(),
        subject: z.string().min(1).max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, any> = {};
    if (data.status !== undefined) {
      patch.status = data.status;
      if (data.status === "resolved" || data.status === "closed") {
        patch.resolved_at = new Date().toISOString();
      } else {
        patch.resolved_at = null;
      }
    }
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.assignee_id !== undefined) patch.assignee_id = data.assignee_id;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.subject !== undefined) patch.subject = data.subject;

    const { error } = await context.supabase
      .from("support_tickets")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Internal note (no email sent)
// ─────────────────────────────────────────────────────────────────────────────
export const addInternalNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; body: string }) =>
    z.object({ ticketId: z.string().uuid(), body: z.string().min(1).max(10000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("support_messages").insert({
      ticket_id: data.ticketId,
      direction: "internal_note",
      author_user_id: context.userId,
      body_text: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Reply (sends real email via Mailgun, stores outbound message)
// ─────────────────────────────────────────────────────────────────────────────
export const replyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; body: string; closeAfter?: boolean }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        body: z.string().min(1).max(20000),
        closeAfter: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, requester_email, requester_name, thread_key")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    // Most recent inbound for In-Reply-To
    const { data: lastInbound } = await context.supabase
      .from("support_messages")
      .select("mailgun_message_id")
      .eq("ticket_id", data.ticketId)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Agent display name
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();

    const agentName = profile?.full_name
      ? `${(profile.full_name as string).split(" ")[0]} at REPS`
      : "REPS Support";

    // Render template
    const tpl = TEMPLATES["support-reply"];
    const templateData = {
      ticketNumber: ticket.ticket_number,
      agentName,
      bodyText: data.body,
      subject: ticket.subject,
    };
    const element = React.createElement(tpl.component, templateData as any);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;

    // Send via Mailgun (server-only import inside handler)
    const {
      sendViaMailgun,
      buildMessageId,
      SUPPORT_FROM_EMAIL,
      SUPPORT_FROM_NAME,
    } = await import("./mailgun-send.server");

    const messageId = buildMessageId(ticket.id);
    const inReplyTo = lastInbound?.mailgun_message_id ?? ticket.thread_key ?? null;
    const references = inReplyTo;

    try {
      await sendViaMailgun({
        from: `${SUPPORT_FROM_NAME} <${SUPPORT_FROM_EMAIL}>`,
        to: ticket.requester_name
          ? `${ticket.requester_name} <${ticket.requester_email}>`
          : ticket.requester_email,
        subject,
        text,
        html,
        messageId,
        inReplyTo,
        references,
        replyTo: SUPPORT_FROM_EMAIL,
      });
    } catch (err) {
      throw new Error(
        `Could not send reply: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Store outbound message
    const { error: insErr } = await context.supabase.from("support_messages").insert({
      ticket_id: data.ticketId,
      direction: "outbound",
      from_email: SUPPORT_FROM_EMAIL,
      from_name: SUPPORT_FROM_NAME,
      author_user_id: context.userId,
      body_text: data.body,
      body_html: html,
      mailgun_message_id: messageId,
      in_reply_to: inReplyTo,
    });
    if (insErr) throw new Error(insErr.message);

    // Ensure thread_key is set (used as fallback for future inbound matching)
    if (!ticket.thread_key) {
      await context.supabase
        .from("support_tickets")
        .update({ thread_key: messageId })
        .eq("id", ticket.id);
    }

    if (data.closeAfter) {
      await context.supabase
        .from("support_tickets")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", ticket.id);
    }

    return { ok: true, messageId };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Manually create a ticket from admin (e.g. logging a call)
// ─────────────────────────────────────────────────────────────────────────────
export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    subject: string;
    requesterEmail: string;
    requesterName?: string;
    body: string;
    priority?: "urgent" | "high" | "normal" | "low";
  }) =>
    z
      .object({
        subject: z.string().min(1).max(200),
        requesterEmail: z.string().email(),
        requesterName: z.string().max(120).optional(),
        body: z.string().min(1).max(20000),
        priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: ticket, error } = await context.supabase
      .from("support_tickets")
      .insert({
        subject: data.subject,
        requester_email: data.requesterEmail.toLowerCase(),
        requester_name: data.requesterName ?? null,
        priority: data.priority ?? "normal",
        source: "admin",
        sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: mErr } = await context.supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      direction: "internal_note",
      author_user_id: context.userId,
      body_text: data.body,
    });
    if (mErr) throw new Error(mErr.message);

    return { id: ticket.id };
  });
