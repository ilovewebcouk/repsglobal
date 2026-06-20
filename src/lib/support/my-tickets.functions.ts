import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export type MyTicketRow = {
  id: string;
  ticket_number: string;
  subject: string;
  status: "new" | "open" | "pending" | "solved" | "closed" | "spam" | "trash";
  priority: "urgent" | "high" | "normal" | "low";
  last_message_at: string | null;
  created_at: string;
  tags: string[];
};

export type MyTicketMessage = {
  id: string;
  direction: "inbound" | "outbound";
  from_name: string | null;
  from_email: string | null;
  body_text: string | null;
  created_at: string;
  is_auto: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// List my tickets
// ─────────────────────────────────────────────────────────────────────────────
export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, last_message_at, created_at, tags",
      )
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, subject, status, priority, last_message_at, created_at, tags",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    const { data: messages, error: mErr } = await context.supabase
      .from("support_messages")
      .select(
        "id, direction, from_name, from_email, body_text, created_at, is_auto",
      )
      .eq("ticket_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    return {
      ticket: ticket as MyTicketRow,
      messages: (messages ?? []) as MyTicketMessage[],
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Create a new ticket (with the opening message)
// ─────────────────────────────────────────────────────────────────────────────
export const createMyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

    const { error: mErr } = await context.supabase
      .from("support_messages")
      .insert({
        ticket_id: (ticket as { id: string }).id,
        direction: "inbound",
        author_user_id: context.userId,
        from_email: email.toLowerCase(),
        from_name: fullName,
        body_text: data.body,
      } as never);
    if (mErr) throw new Error(mErr.message);

    return { id: (ticket as { id: string }).id, ticket_number: (ticket as { ticket_number: string }).ticket_number };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Reply to my own ticket
// ─────────────────────────────────────────────────────────────────────────────
export const replyToMyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

    // RLS already guarantees we own this ticket; we still re-read to grab the
    // requester name for the message envelope.
    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select("id, requester_name, requester_email, status")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    const { error: mErr } = await context.supabase
      .from("support_messages")
      .insert({
        ticket_id: data.ticketId,
        direction: "inbound",
        author_user_id: context.userId,
        from_email: email ?? (ticket as { requester_email: string }).requester_email,
        from_name: (ticket as { requester_name: string | null }).requester_name,
        body_text: data.body,
      } as never);
    if (mErr) throw new Error(mErr.message);

    return { ok: true };
  });
