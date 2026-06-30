import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";


// ─────────────────────────────────────────────────────────────────────────────
// User-facing support tickets. All ops scoped to the signed-in user via RLS.
// Admin replies and internal notes from admins land via the admin server fns
// in ./tickets.functions.ts — this module never touches admin-only state.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "account",
  "billing",
  "verification",
  "profile",
  "technical",
  "feedback",
  "other",
] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  account: "Account",
  billing: "Billing",
  verification: "Verification",
  profile: "Public profile",
  technical: "Technical issue",
  feedback: "Feedback / feature request",
  other: "Other",
};

export type MyTicketRow = {
  id: string;
  ticket_number: string;
  subject: string;
  status: "new" | "open" | "pending" | "solved" | "closed" | "spam" | "trash";
  priority: "urgent" | "high" | "normal" | "low";
  last_message_at: string | null;
  created_at: string;
  tags: string[];
  requester_unread?: boolean;
};

export type MyTicketAttachment = {
  id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
};

export type MyTicketMessage = {
  id: string;
  direction: "inbound" | "outbound";
  from_name: string | null;
  from_email: string | null;
  body_text: string | null;
  created_at: string;
  is_auto: boolean;
  attachments: MyTicketAttachment[];
};

// ─────────────────────────────────────────────────────────────────────────────
// List my tickets
// ─────────────────────────────────────────────────────────────────────────────
export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, last_message_at, created_at, tags, requester_unread",
      )
      .eq("requester_user_id", context.userId)
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return (data ?? []) as MyTicketRow[];
  });

// ─────────────────────────────────────────────────────────────────────────────
// Get a single ticket + thread (inbound/outbound only — RLS hides internal notes)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, last_message_at, created_at, tags, requester_unread",
      )
      .eq("id", data.id)
      .eq("requester_user_id", context.userId)

      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    const { data: messages, error: mErr } = await context.supabase
      .from("support_messages")
      .select(
        "id, direction, from_name, from_email, body_text, created_at, is_auto, support_attachments(id, filename, mime_type, size_bytes, storage_path)",
      )
      .eq("ticket_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    const normalisedMessages = (messages ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      direction: m.direction as "inbound" | "outbound",
      from_name: (m.from_name as string | null) ?? null,
      from_email: (m.from_email as string | null) ?? null,
      body_text: (m.body_text as string | null) ?? null,
      created_at: m.created_at as string,
      is_auto: !!m.is_auto,
      attachments: ((m.support_attachments as MyTicketAttachment[] | null) ?? []).map((a) => ({
        id: a.id,
        filename: a.filename,
        mime_type: a.mime_type,
        size_bytes: a.size_bytes,
        storage_path: a.storage_path,
      })),
    })) as MyTicketMessage[];

    return {
      ticket: ticket as MyTicketRow,
      messages: normalisedMessages,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Create a new ticket (with the opening message)
// ─────────────────────────────────────────────────────────────────────────────
export const createMyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { subject: string; body: string; category: string }) =>
    z
      .object({
        subject: z.string().trim().min(3).max(200),
        body: z.string().trim().min(10).max(10000),
        category: z.enum(CATEGORIES),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const email =
      (context.claims as { email?: string } | null)?.email ?? null;
    if (!email) throw new Error("Your account has no email on file.");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    const fullName = (profile?.full_name as string | null) ?? null;

    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .insert({
        subject: data.subject,
        source: "web",
        inbox: "support",
        requester_user_id: context.userId,
        requester_email: email.toLowerCase(),
        requester_name: fullName,
        tags: [`category:${data.category}`],
      } as never)
      .select("id, ticket_number")
      .single();
    if (tErr) throw new Error(tErr.message);

    const ticketRow = ticket as { id: string; ticket_number: string };

    const { data: msg, error: mErr } = await context.supabase
      .from("support_messages")
      .insert({
        ticket_id: ticketRow.id,
        direction: "inbound",
        author_user_id: context.userId,
        from_email: email.toLowerCase(),
        from_name: fullName,
        body_text: data.body,
      } as never)
      .select("id")
      .single();
    if (mErr) throw new Error(mErr.message);

    // Await both emails (admin notify + requester confirmation). On Cloudflare
    // Workers, fire-and-forget promises are killed when the response returns,
    // which silently dropped these in production. We still swallow errors so
    // email failures never block ticket creation — the in-app inbox is the
    // canonical channel; email is a nudge.
    try {
      await Promise.allSettled([
        notifyAdminOfNewTicket({
          ticketId: ticketRow.id,
          ticketNumber: ticketRow.ticket_number,
          subject: data.subject,
          body: data.body,
          category: data.category,
          requesterEmail: email.toLowerCase(),
          requesterName: fullName,
        }),
        sendRequesterConfirmation({
          ticketId: ticketRow.id,
          ticketNumber: ticketRow.ticket_number,
          subject: data.subject,
          body: data.body,
          requesterEmail: email.toLowerCase(),
          requesterName: fullName,
        }),
      ]);
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error("[support] ticket emails failed", e);
    }

    return {
      id: ticketRow.id,
      ticket_number: ticketRow.ticket_number,
      message_id: (msg as { id: string }).id,
    };
  });

async function notifyAdminOfNewTicket(args: {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  body: string;
  category: string;
  requesterEmail: string;
  requesterName: string | null;
}) {
  const {
    sendViaMailgun,
    buildMessageId,
    SUPPORT_FROM_EMAIL,
    SUPPORT_FROM_NAME,
  } = await import("./mailgun-send.server");

  const messageId = buildMessageId(args.ticketId, "new");
  const categoryLabel =
    CATEGORY_LABELS[args.category as keyof typeof CATEGORY_LABELS] ?? args.category;
  const fromName = args.requesterName?.trim() || args.requesterEmail;
  const adminUrl = `https://repsuk.org/admin/support?ticket=${args.ticketId}`;

  const subjectLine = `[REPS Support #${args.ticketNumber}] ${args.subject}`;
  const text =
    `New support ticket from ${fromName} (${args.requesterEmail})\n` +
    `Category: ${categoryLabel}\n` +
    `Ticket: ${args.ticketNumber}\n\n` +
    `${args.body}\n\n` +
    `Open in admin: ${adminUrl}\n`;
  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111;background:#ffffff;padding:20px;">
<h2 style="margin:0 0 8px 0;">New support ticket</h2>
<p style="margin:0 0 4px 0;"><strong>From:</strong> ${safe(fromName)} &lt;${safe(args.requesterEmail)}&gt;</p>
<p style="margin:0 0 4px 0;"><strong>Category:</strong> ${safe(categoryLabel)}</p>
<p style="margin:0 0 12px 0;"><strong>Ticket:</strong> ${safe(args.ticketNumber)}</p>
<div style="border-left:3px solid #f15a29;padding:12px 16px;background:#fafafa;white-space:pre-wrap;font-size:14px;line-height:1.5;">${safe(args.body)}</div>
<p style="margin:16px 0 0 0;"><a href="${adminUrl}" style="background:#f15a29;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Open in admin</a></p>
</body></html>`;

  await sendViaMailgun({
    from: `${SUPPORT_FROM_NAME} <${SUPPORT_FROM_EMAIL}>`,
    to: SUPPORT_FROM_EMAIL,
    subject: subjectLine,
    text,
    html,
    messageId,
    replyTo: args.requesterEmail,
  });
}

async function sendRequesterConfirmation(args: {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  body: string;
  requesterEmail: string;
  requesterName: string | null;
}) {
  // Use the existing branded React Email template + queued send pipeline so
  // this matches every other trainer-facing email (consistent REPS SUPPORT
  // brand bar, card, footer) instead of the old hand-rolled HTML.
  const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
  const firstName = args.requesterName?.split(" ")[0] || "there";
  await sendTransactionalEmailServer({
    templateName: "contact-autoresponse",
    recipientEmail: args.requesterEmail,
    idempotencyKey: `support-ack-${args.ticketId}`,
    templateData: {
      firstName,
      ticketNumber: args.ticketNumber,
      summary: args.body,
    },
    replyTo: "support@repsuk.org",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reply to my own ticket
// ─────────────────────────────────────────────────────────────────────────────
export const replyToMyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { ticketId: string; body: string }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        body: z.string().trim().min(1).max(10000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const email =
      (context.claims as { email?: string } | null)?.email ?? null;

    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select("id, requester_name, requester_email, status")
      .eq("id", data.ticketId)
      .eq("requester_user_id", context.userId)

      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    const { data: msg, error: mErr } = await context.supabase
      .from("support_messages")
      .insert({
        ticket_id: data.ticketId,
        direction: "inbound",
        author_user_id: context.userId,
        from_email: email ?? (ticket as { requester_email: string }).requester_email,
        from_name: (ticket as { requester_name: string | null }).requester_name,
        body_text: data.body,
      } as never)
      .select("id")
      .single();
    if (mErr) throw new Error(mErr.message);

    return { ok: true, message_id: (msg as { id: string }).id };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Attachments on my own messages
// ─────────────────────────────────────────────────────────────────────────────
export const attachToMyMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator(
    (d: {
      messageId: string;
      files: { storage_path: string; filename: string; mime_type?: string; size_bytes?: number }[];
    }) =>
      z
        .object({
          messageId: z.string().uuid(),
          files: z
            .array(
              z.object({
                storage_path: z.string().min(1).max(500),
                filename: z.string().min(1).max(255),
                mime_type: z.string().max(100).optional(),
                size_bytes: z.number().int().nonnegative().max(20 * 1024 * 1024).optional(),
              }),
            )
            .min(1)
            .max(5),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const rows = data.files.map((f) => ({
      message_id: data.messageId,
      storage_path: f.storage_path,
      filename: f.filename,
      mime_type: f.mime_type ?? null,
      size_bytes: f.size_bytes ?? null,
    }));
    const { error } = await context.supabase
      .from("support_attachments")
      .insert(rows as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Signed download URL for a single attachment (15 min)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { storage_path: string }) =>
    z.object({ storage_path: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("support-attachments")
      .createSignedUrl(data.storage_path, 60 * 15);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Unread / notifications (trainer side)
// ─────────────────────────────────────────────────────────────────────────────
export type MyUnreadTicket = {
  id: string;
  ticket_number: string;
  subject: string;
  last_message_at: string | null;
  created_at: string;
};

export const listMyUnreadTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    // Direct query (not RPC) so impersonation works — RPC uses auth.uid()
    // which is the admin during impersonation; context.userId is the
    // impersonated user.
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, last_message_at, created_at")
      .eq("requester_user_id", context.userId)
      .eq("requester_unread", true)
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { tickets: (data ?? []) as MyUnreadTicket[] };
  });

export const markMyTicketRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: { ticketId: string }) =>
    z.object({ ticketId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("support_tickets")
      .update({ requester_unread: false, updated_at: new Date().toISOString() } as never)
      .eq("id", data.ticketId)
      .eq("requester_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllMySupportRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("support_tickets")
      .update({ requester_unread: false, updated_at: new Date().toISOString() } as never)
      .eq("requester_user_id", context.userId)
      .eq("requester_unread", true);
    if (error) throw new Error(error.message);
    return { ok: true };

  });
