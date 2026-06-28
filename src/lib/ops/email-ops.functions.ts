// Email Operations — dedicated dashboard backing.
// All counts dedupe by message_id, taking the latest row per message.
// Admin-only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const RangeInput = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  template: z.string().nullable().optional(),
  status: z
    .enum(["sent", "failed", "dlq", "suppressed", "bounced", "complained", "pending"])
    .nullable()
    .optional(),
});

export interface EmailRowDTO {
  message_id: string;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface EmailStatsDTO {
  total: number;
  sent: number;
  failed: number;
  suppressed: number;
  bounced: number;
  pending: number;
  dlq: number;
  queue_transactional: number;
  queue_auth: number;
  suppression_total: number;
}

const RANGE_DEFAULT_MS = 7 * 86400_000;

function resolveRange(from?: string, to?: string) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - RANGE_DEFAULT_MS);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Latest row per message_id within range, in memory.
 * email_send_log is small enough in practice (<10k/week) for this approach.
 */
async function fetchDeduped(opts: {
  from?: string;
  to?: string;
  template?: string | null;
  status?: string | null;
  limit?: number;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { start, end } = resolveRange(opts.from, opts.to);
  let q = supabaseAdmin
    .from("email_send_log")
    .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
    .gte("created_at", start)
    .lte("created_at", end)
    .not("message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 5000);
  if (opts.template) q = q.eq("template_name", opts.template);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const seen = new Map<string, EmailRowDTO>();
  for (const r of (data ?? []) as EmailRowDTO[]) {
    if (!r.message_id) continue;
    if (!seen.has(r.message_id)) seen.set(r.message_id, r);
  }
  let rows = [...seen.values()];
  if (opts.status) rows = rows.filter((r) => r.status === opts.status);
  return rows;
}

export const getEmailStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RangeInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<EmailStatsDTO> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = await fetchDeduped({
      from: data.from,
      to: data.to,
      template: data.template,
      status: null,
    });

    const stats: EmailStatsDTO = {
      total: rows.length,
      sent: 0,
      failed: 0,
      suppressed: 0,
      bounced: 0,
      pending: 0,
      dlq: 0,
      queue_transactional: 0,
      queue_auth: 0,
      suppression_total: 0,
    };
    for (const r of rows) {
      switch (r.status) {
        case "sent": stats.sent++; break;
        case "failed": stats.failed++; break;
        case "dlq": stats.dlq++; break;
        case "suppressed": stats.suppressed++; break;
        case "bounced": stats.bounced++; break;
        case "complained": stats.bounced++; break;
        case "pending": stats.pending++; break;
      }
    }

    // queue depth + suppression list — best-effort, never throws
    try {
      const ph = await supabaseAdmin.rpc("platform_health_snapshot" as never);
      const snap = (ph.data ?? {}) as { queue_transactional?: number; queue_auth?: number };
      stats.queue_transactional = Number(snap.queue_transactional ?? 0);
      stats.queue_auth = Number(snap.queue_auth ?? 0);
    } catch { /* leave zero */ }
    try {
      const { count } = await supabaseAdmin
        .from("suppressed_emails")
        .select("id", { count: "exact", head: true });
      stats.suppression_total = Number(count ?? 0);
    } catch { /* leave zero */ }

    return stats;
  });

const ListInput = RangeInput.extend({
  q: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listEmailLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const rows = await fetchDeduped({
      from: data.from,
      to: data.to,
      template: data.template,
      status: data.status,
    });
    const search = (data.q ?? "").trim().toLowerCase();
    const filtered = search
      ? rows.filter(
          (r) =>
            (r.recipient_email ?? "").toLowerCase().includes(search) ||
            (r.template_name ?? "").toLowerCase().includes(search) ||
            (r.message_id ?? "").toLowerCase().includes(search),
        )
      : rows;
    const total = filtered.length;
    const page = filtered.slice(data.offset, data.offset + data.limit);
    return { rows: page, total };
  });

export const getEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("email_send_log")
      .select("template_name")
      .gte("created_at", since)
      .not("template_name", "is", null)
      .limit(5000);
    const set = new Set<string>();
    for (const r of (data ?? []) as Array<{ template_name: string | null }>) {
      if (r.template_name) set.add(r.template_name);
    }
    return [...set].sort();
  });

export const getEmailHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ message_id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, metadata, created_at")
      .eq("message_id", data.message_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listSuppressions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      q: z.string().nullable().optional(),
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("suppressed_emails")
      .select("id, email, reason, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.q) q = q.ilike("email", `%${data.q}%`);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

/**
 * Remove an address from the suppression list so it can receive REPS emails again.
 * Use sparingly — typically only after the user has confirmed they want our mail.
 */
export const removeSuppression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("suppressed_emails")
      .delete()
      .eq("email", data.email.toLowerCase());
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
