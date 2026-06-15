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

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────
export const listTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      status?: "open" | "pending" | "resolved" | "closed" | "snoozed" | "all";
      inbox?: "support" | "pros" | "partners" | "press" | "all";
      q?: string;
    }) => d ?? {},
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, source, inbox, requester_email, requester_name, assignee_id, sla_due_at, first_response_at, resolved_at, last_message_at, created_at, tags, is_unread, snoozed_until, last_opened_at, last_opened_by",
      )
      .order("last_message_at", { ascending: false })
      .limit(200);
    const nowIso = new Date().toISOString();
    if (data?.status === "snoozed") {
      q = q.not("snoozed_until", "is", null).gt("snoozed_until", nowIso);
    } else if (data?.status && data.status !== "all") {
      q = q.eq("status", data.status);
      // Active snoozed tickets are hidden from regular status tabs
      q = q.or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`);
    }
    if (data?.inbox && data.inbox !== "all") q = q.eq("inbox", data.inbox);
    if (data?.q && data.q.trim().length > 0) {
      const term = data.q.trim().replace(/[%,]/g, "");
      const like = `%${term}%`;
      q = q.or(
        `ticket_number.ilike.${like},subject.ilike.${like},requester_email.ilike.${like},requester_name.ilike.${like}`,
      );
    }
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
        "id, direction, from_email, from_name, author_user_id, body_text, body_html, created_at, mailgun_message_id, in_reply_to, is_auto, support_attachments(id, filename, mime_type, size_bytes, storage_path)",
      )
      .eq("ticket_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    return { ticket, messages: messages ?? [] };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Signed URL for a single attachment (admin-only, short TTL).
// ─────────────────────────────────────────────────────────────────────────────
export const getAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { attachmentId: string }) =>
    z.object({ attachmentId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: att, error } = await context.supabase
      .from("support_attachments")
      .select("storage_path, filename, mime_type")
      .eq("id", data.attachmentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!att) throw new Error("Attachment not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("support-attachments")
      .createSignedUrl(att.storage_path, 300, { download: att.filename });
    if (sErr || !signed) throw new Error(sErr?.message ?? "Could not sign URL");
    return { url: signed.signedUrl, filename: att.filename, mimeType: att.mime_type };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Previous tickets from the same requester (for drawer context panel)
// ─────────────────────────────────────────────────────────────────────────────
export const listRequesterTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; excludeId?: string }) =>
    z
      .object({
        email: z.string().email().max(320),
        excludeId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, created_at, resolved_at, last_message_at",
      )
      .eq("requester_email", data.email.toLowerCase())
      .order("last_message_at", { ascending: false })
      .limit(10);
    if (data.excludeId) q = q.neq("id", data.excludeId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });



// ─────────────────────────────────────────────────────────────────────────────
// Recent activity feed for the admin notifications bell.
// Returns the latest tickets + latest inbound messages.
// ─────────────────────────────────────────────────────────────────────────────
export const listSupportNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const [ticketsRes, messagesRes] = await Promise.all([
      context.supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, requester_name, requester_email, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      context.supabase
        .from("support_messages")
        .select(
          "id, ticket_id, from_name, from_email, body_text, created_at, support_tickets!inner(ticket_number, subject)",
        )
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    if (ticketsRes.error) throw new Error(ticketsRes.error.message);
    if (messagesRes.error) throw new Error(messagesRes.error.message);

    return {
      tickets: (ticketsRes.data ?? []) as Array<{
        id: string;
        ticket_number: string;
        subject: string;
        requester_name: string | null;
        requester_email: string;
        created_at: string;
      }>,
      messages: (messagesRes.data ?? []) as Array<{
        id: string;
        ticket_id: string;
        from_name: string | null;
        from_email: string | null;
        body_text: string | null;
        created_at: string;
        support_tickets: { ticket_number: string; subject: string } | null;
      }>,
    };
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
      .update(patch as never)
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

    // Render template (server-only imports inside handler so the email
    // template registry never lands in the client bundle).
    const [{ default: React }, { render }, { TEMPLATES }] = await Promise.all([
      import("react"),
      import("@react-email/components"),
      import("@/lib/email-templates/registry"),
    ]);
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
// Mark ticket as read (admin opened it)
// ─────────────────────────────────────────────────────────────────────────────
export const markTicketRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("support_tickets")
      .update({
        is_unread: false,
        last_opened_at: new Date().toISOString(),
        last_opened_by: context.userId,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Snooze / unsnooze
// ─────────────────────────────────────────────────────────────────────────────
export const snoozeTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; until: string }) =>
    z
      .object({ id: z.string().uuid(), until: z.string().datetime() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (new Date(data.until).getTime() <= Date.now()) {
      throw new Error("Snooze time must be in the future");
    }
    const { error } = await context.supabase
      .from("support_tickets")
      .update({ snoozed_until: data.until } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unsnoozeTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("support_tickets")
      .update({ snoozed_until: null } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Open a brand-new outbound ticket — admin reaches out first.
// Creates the ticket, sends the first email via Mailgun, stores the outbound
// message, and sets thread_key so the customer's reply lands back here.
// ─────────────────────────────────────────────────────────────────────────────
export const createOutboundTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      to: string;
      name?: string;
      subject: string;
      body: string;
      priority?: "urgent" | "high" | "normal" | "low";
      inbox?: "support" | "pros" | "partners" | "press";
    }) =>
      z
        .object({
          to: z.string().email(),
          name: z.string().max(120).optional(),
          subject: z.string().min(1).max(200),
          body: z.string().min(1).max(20000),
          priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
          inbox: z.enum(["support", "pros", "partners", "press"]).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    // 1) Create the ticket (status=pending — we're now waiting on the customer).
    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .insert({
        subject: data.subject,
        requester_email: data.to.toLowerCase(),
        requester_name: data.name ?? null,
        priority: data.priority ?? "normal",
        source: "admin",
        inbox: data.inbox ?? "support",
        status: "pending",
        sla_due_at: null,
      } as never)
      .select("id, ticket_number")
      .single();
    if (tErr) throw new Error(tErr.message);

    // 2) Render the outbound template.
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    const agentName = profile?.full_name
      ? `${(profile.full_name as string).split(" ")[0]} at REPS`
      : "REPS Support";

    const [{ default: React }, { render }, { TEMPLATES }] = await Promise.all([
      import("react"),
      import("@react-email/components"),
      import("@/lib/email-templates/registry"),
    ]);
    const tpl = TEMPLATES["support-outbound"];
    const templateData = {
      ticketNumber: ticket.ticket_number,
      agentName,
      bodyText: data.body,
      subject: data.subject,
    };
    const element = React.createElement(tpl.component, templateData as any);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;

    // 3) Send via Mailgun.
    const {
      sendViaMailgun,
      buildMessageId,
      SUPPORT_FROM_EMAIL,
      SUPPORT_FROM_NAME,
    } = await import("./mailgun-send.server");
    const messageId = buildMessageId(ticket.id);

    try {
      await sendViaMailgun({
        from: `${SUPPORT_FROM_NAME} <${SUPPORT_FROM_EMAIL}>`,
        to: data.name ? `${data.name} <${data.to}>` : data.to,
        subject,
        text,
        html,
        messageId,
        inReplyTo: null,
        references: null,
        replyTo: SUPPORT_FROM_EMAIL,
      });
    } catch (err) {
      // Clean up — don't leave an orphan ticket if the send failed.
      await context.supabase.from("support_tickets").delete().eq("id", ticket.id);
      throw new Error(
        `Could not send email: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // 4) Store outbound message + set thread_key for inbound matching.
    const { error: insErr } = await context.supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      direction: "outbound",
      from_email: SUPPORT_FROM_EMAIL,
      from_name: SUPPORT_FROM_NAME,
      author_user_id: context.userId,
      body_text: data.body,
      body_html: html,
      mailgun_message_id: messageId,
    } as never);
    if (insErr) throw new Error(insErr.message);

    await context.supabase
      .from("support_tickets")
      .update({ thread_key: messageId } as never)
      .eq("id", ticket.id);

    return { id: ticket.id, ticket_number: ticket.ticket_number };
  });
