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

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────
export const listTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator(
    (d: {
      status?: "new" | "open" | "pending" | "solved" | "closed" | "spam" | "trash" | "all";
      inbox?: "support" | "pros" | "partners" | "press" | "all";
      q?: string;
    }) => d ?? {},
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, source, inbox, requester_email, requester_name, assignee_id, sla_due_at, first_response_at, solved_at, last_message_at, created_at, tags, is_unread, snoozed_until, last_opened_at, last_opened_by, closed_at, deleted_at, reopened_from_ticket_id, first_viewed_at, first_viewed_by",
      )
      .order("last_message_at", { ascending: false })
      .limit(200);

    if (data?.status === "trash") {
      q = q.not("deleted_at", "is", null);
    } else if (data?.status === "solved") {
      // Solved tab — every solved ticket newest first.
      q = q
        .is("deleted_at", null)
        .eq("status", "solved")
        .order("solved_at", { ascending: false });
    } else if (data?.status === "closed") {
      q = q.is("deleted_at", null).eq("status", "closed");
    } else if (data?.status === "spam") {
      q = q.is("deleted_at", null).eq("status", "spam");
    } else if (data?.status === "new") {
      // Brand-new untouched tickets — drives the notification badge.
      q = q.is("deleted_at", null).eq("status", "new");
    } else if (data?.status === "open") {
      q = q.is("deleted_at", null).eq("status", "open");
    } else if (data?.status === "pending") {
      q = q.is("deleted_at", null).eq("status", "pending");
    } else {
      // "all" — used for client-side count aggregation. Hides Trash only;
      // every lifecycle bucket has its own tab.
      q = q.is("deleted_at", null);
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
  .middleware([requireSupabaseAuthWithImpersonation])
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
  .middleware([requireSupabaseAuthWithImpersonation])
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
  .middleware([requireSupabaseAuthWithImpersonation])
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
        "id, ticket_number, subject, status, priority, created_at, solved_at, last_message_at",
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
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    // Bell + sidebar badge = count of `New` tickets (untouched inbound).
    // The moment an admin opens one, the drawer flips it to Open and it
    // disappears from the badge automatically.
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, requester_name, requester_email, last_message_at, created_at",
      )
      .eq("status", "new")
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);

    return {
      tickets: (data ?? []) as Array<{
        id: string;
        ticket_number: string;
        subject: string;
        requester_name: string | null;
        requester_email: string;
        last_message_at: string | null;
        created_at: string;
      }>,
    };
  });

// Bell "Mark all read" — promote every New ticket to Open in one shot.
export const markAllSupportRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const nowIso = new Date().toISOString();
    const { error } = await context.supabase
      .from("support_tickets")
      .update({
        status: "open",
        is_unread: false,
        first_viewed_at: nowIso,
        first_viewed_by: context.userId,
      } as never)
      .eq("status", "new")
      .is("deleted_at", null)
      .is("first_viewed_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });



// ─────────────────────────────────────────────────────────────────────────────
// Update ticket (status, priority, assignee, tags)
// ─────────────────────────────────────────────────────────────────────────────
export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  // Drawer dropdown is restricted to Open / Pending / Solved.
  // `new` is system-set (auto-promoted on first view).
  // `closed` is system-set (auto-promoted by cron after 28d).
  // `spam` is set via the separate Spam moderation button (still allowed here
  // for bulk ops and the drawer's spam button).
  .inputValidator((d: {
    id: string;
    status?: "open" | "pending" | "solved" | "spam";
    priority?: "urgent" | "high" | "normal" | "low";
    assignee_id?: string | null;
    tags?: string[];
    subject?: string;
  }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "pending", "solved", "spam"]).optional(),
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
      const nowIso = new Date().toISOString();
      if (data.status === "solved") {
        patch.solved_at = nowIso;
        patch.closed_at = null;
      } else {
        // open / pending / spam — clear terminal-state stamps.
        patch.solved_at = null;
        patch.closed_at = null;
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
  .middleware([requireSupabaseAuthWithImpersonation])
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
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { ticketId: string; body: string; afterStatus?: "pending" | "solved" | "closed" }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        body: z.string().min(1).max(20000),
        afterStatus: z.enum(["pending", "solved", "closed"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, requester_email, requester_name, thread_key, status")
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

    const afterStatus = data.afterStatus ?? "pending";
    const nowIso = new Date().toISOString();
    if (afterStatus === "solved") {
      await context.supabase
        .from("support_tickets")
        .update({ status: "solved", solved_at: nowIso, closed_at: null })
        .eq("id", ticket.id);
    } else if (afterStatus === "closed") {
      await context.supabase
        .from("support_tickets")
        .update({ status: "closed", closed_at: nowIso })
        .eq("id", ticket.id);
    } else {
      await context.supabase
        .from("support_tickets")
        .update({ status: "pending", solved_at: null, closed_at: null })
        .eq("id", ticket.id);
    }

    return { ok: true, messageId };
  });


// ─────────────────────────────────────────────────────────────────────────────
// Mark ticket as read (admin opened it)
// ─────────────────────────────────────────────────────────────────────────────
export const markTicketRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const nowIso = new Date().toISOString();

    // If this is the first time anyone has opened the ticket, promote
    // status `new` → `open` and stamp the first-view metadata. This is the
    // mechanism that drops the notification badge.
    const { data: row } = await context.supabase
      .from("support_tickets")
      .select("status, first_viewed_at")
      .eq("id", data.id)
      .maybeSingle();

    const patch: Record<string, any> = {
      is_unread: false,
      last_opened_at: nowIso,
      last_opened_by: context.userId,
    };
    if (row && row.status === "new") {
      patch.status = "open";
    }
    if (row && !row.first_viewed_at) {
      patch.first_viewed_at = nowIso;
      patch.first_viewed_by = context.userId;
    }

    const { error } = await context.supabase
      .from("support_tickets")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Snooze / unsnooze
// ─────────────────────────────────────────────────────────────────────────────
export const snoozeTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
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
  .middleware([requireSupabaseAuthWithImpersonation])
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
  .middleware([requireSupabaseAuthWithImpersonation])
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

// ─────────────────────────────────────────────────────────────────────────────
// Search recipients (trainers, clients, recent ticket contacts) for compose
// ─────────────────────────────────────────────────────────────────────────────
export type RecipientHit = {
  email: string;
  name: string | null;
  kind: "professional" | "client" | "contact";
  tier?: "verified" | "pro" | "studio" | null;
  slug?: string | null;
};

export const searchSupportRecipients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { q: string }) =>
    z.object({ q: z.string().trim().min(2).max(80) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<RecipientHit[]> => {
    await assertAdmin(context);
    const q = data.q.toLowerCase();
    const like = `%${q.replace(/[%,]/g, "")}%`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Profiles matching by full_name OR business_name (the user-editable
    // settings fields). Note: professionals.trading_name / public_email were
    // removed — the source of truth is now profiles + auth.users.
    const { data: nameMatches, error: nameErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, business_name")
      .or(`full_name.ilike.${like},business_name.ilike.${like}`)
      .limit(20);
    if (nameErr) throw new Error(nameErr.message);

    // 1b) Partial UUID match on profiles.id (e.g. admin pastes "a1b2c3").
    // PostgREST can't ilike a uuid column, so we use a SECURITY DEFINER rpc.
    let idMatches: Array<{ id: string; full_name: string | null; business_name: string | null }> = [];
    if (/^[0-9a-fA-F-]{4,}$/.test(q)) {
      const { data: idRows, error: idErr } = await supabaseAdmin.rpc(
        "search_profiles_by_id_prefix",
        { _q: q },
      );
      if (!idErr && Array.isArray(idRows)) idMatches = idRows as any[];
    }

    const idsFromName = Array.from(
      new Set([
        ...(nameMatches ?? []).map((r: any) => r.id as string),
        ...idMatches.map((r) => r.id),
      ]),
    );

    // 2) Resolve emails for name-matched IDs via the Auth Admin API.
    // The PostgREST path to auth.users is not always available, so this
    // lookup is more reliable than supabaseAdmin.schema("auth").from("users").
    const emailById = new Map<string, string>();
    if (idsFromName.length > 0) {
      await Promise.all(
        idsFromName.map(async (id) => {
          try {
            const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
            if (u?.user?.email) emailById.set(id, u.user.email);
          } catch (err) {
            console.error(`searchSupportRecipients getUserById ${id} failed:`, err);
          }
        }),
      );
    }

    // 3) Direct email match from auth.users (for users typing an email address).
    // Try PostgREST first; if it fails, fall back to paging auth.admin.listUsers.
    try {
      const { data: usersByEmail, error: emailErr } = await supabaseAdmin
        .schema("auth" as never)
        .from("users")
        .select("id, email")
        .ilike("email", like)
        .limit(20);
      if (!emailErr) {
        for (const u of (usersByEmail ?? []) as any[]) {
          if (u.email) emailById.set(u.id, u.email);
        }
      }
    } catch (err) {
      console.error("searchSupportRecipients auth.users email query failed, falling back:", err);
      // Fallback: page through auth users and collect email matches.
      let page = 1;
      for (let i = 0; i < 10; i++) {
        const { data: pageData, error: pageErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (pageErr) {
          console.error("searchSupportRecipients listUsers fallback error:", pageErr);
          break;
        }
        const users = pageData?.users ?? [];
        if (users.length === 0) break;
        for (const u of users) {
          if (u.email && u.email.toLowerCase().includes(q)) emailById.set(u.id, u.email);
        }
        if (users.length < 1000) break;
        page += 1;
      }
    }

    const allUserIds = Array.from(emailById.keys());

    // 4) Resolve names + flags
    const [profilesRes, prosRes, clientsRes, subsRes] = allUserIds.length
      ? await Promise.all([
          supabaseAdmin.from("profiles").select("id, full_name, business_name").in("id", allUserIds),
          supabaseAdmin.from("professionals").select("id, slug").in("id", allUserIds),
          supabaseAdmin.from("clients").select("id").in("id", allUserIds),
          supabaseAdmin
            .from("subscriptions")
            .select("user_id, tier, status")
            .in("user_id", allUserIds)
            .in("status", ["active", "trialing", "past_due"]),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

    const nameById = new Map<string, string>(
      ((profilesRes.data ?? []) as any[]).map((r) => [r.id, r.full_name || r.business_name]),
    );
    const proById = new Map<string, string | null>(
      ((prosRes.data ?? []) as any[]).map((r) => [r.id, r.slug]),
    );
    const clientIds = new Set<string>(((clientsRes.data ?? []) as any[]).map((r) => r.id));
    const tierById = new Map<string, "verified" | "pro" | "studio">(
      ((subsRes.data ?? []) as any[])
        .filter((s) => ["verified", "pro", "studio"].includes(s.tier))
        .map((s) => [s.user_id, s.tier as "verified" | "pro" | "studio"]),
    );

    const accountHits: RecipientHit[] = allUserIds
      .map((id) => {
        const email = emailById.get(id);
        if (!email) return null;
        const isPro = proById.has(id);
        const isClient = clientIds.has(id);
        if (!isPro && !isClient) return null;
        return {
          email,
          name: nameById.get(id) ?? null,
          kind: isPro ? ("professional" as const) : ("client" as const),
          tier: isPro ? tierById.get(id) ?? null : null,
          slug: isPro ? proById.get(id) ?? null : null,
        };
      })
      .filter(Boolean) as RecipientHit[];

    // 5) Recent ticket contacts (covers people without a REPs account)
    const ninetyDays = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: contactRows } = await context.supabase
      .from("support_tickets")
      .select("requester_email, requester_name, created_at")
      .or(`requester_email.ilike.${like},requester_name.ilike.${like}`)
      .gte("created_at", ninetyDays)
      .order("created_at", { ascending: false })
      .limit(40);

    const seenEmails = new Set(accountHits.map((h) => h.email.toLowerCase()));
    const contactHits: RecipientHit[] = [];
    for (const r of (contactRows ?? []) as any[]) {
      const email = (r.requester_email ?? "").toLowerCase();
      if (!email || seenEmails.has(email)) continue;
      seenEmails.add(email);
      contactHits.push({
        email: r.requester_email,
        name: r.requester_name ?? null,
        kind: "contact",
      });
    }

    // Professionals first, then clients, then contacts
    const ordered = [
      ...accountHits.filter((h) => h.kind === "professional"),
      ...accountHits.filter((h) => h.kind === "client"),
      ...contactHits,
    ];
    return ordered.slice(0, 8);
  });

