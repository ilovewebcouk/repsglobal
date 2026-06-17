// Draft / schedule / send-now / resend / delete server functions for outbound
// campaigns. Split out of outbound.functions.ts to keep that file focused on
// the original Compose-dialog send path.
//
// The throttled Mailgun batch sender lives here too as `runBroadcastBatch`,
// and is re-exported so outbound.functions.ts can call it from its broadcast
// branch — keeps one implementation, one set of retry rules, one daily-cap
// guard.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Inbox = "support" | "pros" | "partners" | "press";
type Tier = "free" | "verified" | "pro" | "studio";

const INBOX_META: Record<Inbox, { email: string; name: string; label: string }> = {
  support: { email: "support@repsuk.org", name: "REPS Support", label: "Support" },
  pros: { email: "pros@repsuk.org", name: "REPS Pros", label: "Pros" },
  partners: { email: "partners@repsuk.org", name: "REPS Partners", label: "Partners" },
  press: { email: "press@repsuk.org", name: "REPS Press", label: "Press" },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (e: string) => EMAIL_RE.test(e);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve tier → recipient list (admin client; mirrors outbound.functions.ts)
// ─────────────────────────────────────────────────────────────────────────────
async function resolveTierRecipients(
  supabaseAdmin: any,
  tiers: Tier[],
): Promise<Array<{ email: string; name: string | null }>> {
  const paid = tiers.filter((t) => t !== "free");
  const wantsFree = tiers.includes("free");

  let proIds: string[] = [];
  if (paid.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, tier, status")
      .in("tier", paid as any)
      .in("status", ["active", "trialing", "past_due", "unpaid"]);
    proIds = [...new Set((subs ?? []).map((s: any) => s.user_id as string))] as string[];
  }

  if (wantsFree) {
    const { data: allPros } = await supabaseAdmin
      .from("professionals")
      .select("id");
    const { data: paidSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .in("status", ["active", "trialing", "past_due", "unpaid"]);
    const paidIds = new Set((paidSubs ?? []).map((s: any) => s.user_id));
    const freeIds = (allPros ?? []).map((p: any) => p.id).filter((id: string) => !paidIds.has(id));
    proIds = [...new Set([...proIds, ...freeIds])];
  }

  if (proIds.length === 0) return [];

  // Fetch names from profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, business_name")
    .in("id", proIds);
  const nameMap = new Map<string, string>();
  for (const pf of profiles ?? []) {
    nameMap.set(pf.id, (pf.full_name || pf.business_name || "") as string);
  }

  // Fetch emails via auth.admin
  const emails = new Map<string, string>();
  await Promise.all(
    proIds.map(async (id: string) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id);
      if (data?.user?.email) emails.set(id, data.user.email.toLowerCase().trim());
    }),
  );

  const seen = new Set<string>();
  const out: Array<{ email: string; name: string | null }> = [];
  for (const id of proIds) {
    const email = emails.get(id);
    if (!email || !isValidEmail(email) || seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: nameMap.get(id) || null });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared throttled Mailgun batch sender. Used by sendAdminOutbound, the new
// sendCampaignNow / resendFailedRecipients server fns, and the cron runner.
// ─────────────────────────────────────────────────────────────────────────────
export interface BroadcastBatchOpts {
  supabaseAdmin: any;
  campaignId: string;
  recipients: Array<{ email: string; name: string | null }>;
  inboxMeta: { email: string; name: string; label: string };
  subject: string;
  body: string;
  format: "text" | "html";
  attachmentPayloads: Array<{ filename: string; contentType: string; data: Uint8Array }>;
}

export async function runBroadcastBatch(opts: BroadcastBatchOpts): Promise<{
  sent: number;
  failed: number;
  failures: Array<{ email: string; error: string }>;
  dailyLimitHit: boolean;
}> {
  const { sendViaMailgun, buildMessageId } = await import(
    "@/lib/support/mailgun-send.server"
  );
  const { renderForRecipient } = await import("./email-render.server");

  // Mailgun probation cap = 100 msgs/hour. 37s spacing ≈ 97/hr — safely under.
  // When probation is lifted (or plan upgraded), drop this to ~750ms.
  const SEND_DELAY_MS = 37_000;
  const MAX_RETRIES = 3;
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const parseRetryAfter = (msg: string): number | null => {
    const m = msg.match(/try again after ([^"}\n]+?)(?:["}]|$)/i);
    if (!m) return null;
    const when = Date.parse(m[1].trim());
    if (!Number.isFinite(when)) return null;
    return Math.max(0, when - Date.now());
  };

  let sent = 0;
  const failures: Array<{ email: string; error: string }> = [];
  let dailyLimitHit = false;

  outer: for (const r of opts.recipients) {
    const messageId = buildMessageId(`campaign-${opts.campaignId}`);
    const { html, text } = renderForRecipient({
      body: opts.body,
      format: opts.format,
      recipient: r,
      inboxLabel: opts.inboxMeta.label,
    });

    let attempt = 0;
    let lastError: string | null = null;
    while (attempt < MAX_RETRIES) {
      try {
        await sendViaMailgun({
          from: `${opts.inboxMeta.name} <${opts.inboxMeta.email}>`,
          to: r.name ? `${r.name} <${r.email}>` : r.email,
          subject: opts.subject,
          text,
          html,
          messageId,
          replyTo: opts.inboxMeta.email,
          attachments: opts.attachmentPayloads.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            data: a.data,
          })),
        });
        await opts.supabaseAdmin
          .from("outbound_campaign_recipients")
          .update({
            status: "sent",
            mailgun_message_id: messageId,
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("campaign_id", opts.campaignId)
          .eq("email", r.email);
        sent += 1;
        lastError = null;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        if (/daily (request )?limit exceeded/i.test(msg)) {
          dailyLimitHit = true;
          break;
        }
        const isThrottle =
          /\b429\b/.test(msg) ||
          /\b420\b/.test(msg) ||
          /request limit exceeded/i.test(msg) ||
          /recipient limit exceeded/i.test(msg);
        if (isThrottle && attempt < MAX_RETRIES - 1) {
          const wait = Math.min(parseRetryAfter(msg) ?? 30_000, 90_000);
          await sleep(wait + 500);
          attempt += 1;
          continue;
        }
        break;
      }
    }

    if (lastError) {
      failures.push({ email: r.email, error: lastError });
      await opts.supabaseAdmin
        .from("outbound_campaign_recipients")
        .update({ status: "failed", error_message: lastError })
        .eq("campaign_id", opts.campaignId)
        .eq("email", r.email);
    }

    if (dailyLimitHit) break outer;
    await sleep(SEND_DELAY_MS);
  }

  if (dailyLimitHit) {
    await opts.supabaseAdmin
      .from("outbound_campaign_recipients")
      .update({
        status: "failed",
        error_message: "Skipped: Mailgun daily limit reached",
      })
      .eq("campaign_id", opts.campaignId)
      .eq("status", "queued");
  }

  return { sent, failed: failures.length, failures, dailyLimitHit };
}

// ─────────────────────────────────────────────────────────────────────────────
// Save / update a draft (or scheduled) campaign.
// ─────────────────────────────────────────────────────────────────────────────
const draftSchema = z.object({
  id: z.string().uuid().optional(),
  inbox: z.enum(["support", "pros", "partners", "press"]),
  mode: z.enum(["direct", "broadcast"]),
  subject: z.string().max(200).default(""),
  body: z.string().max(50000).default(""),
  format: z.enum(["text", "html"]).default("text"),
  recipients: z
    .array(z.object({ email: z.string(), name: z.string().nullable().optional() }))
    .max(500)
    .optional(),
  tiers: z.array(z.enum(["free", "verified", "pro", "studio"])).max(4).optional(),
  attachments: z
    .array(
      z.object({
        storagePath: z.string().min(1).max(500),
        filename: z.string().min(1).max(200),
        mimeType: z.string().min(1).max(150),
        sizeBytes: z.number().int().min(0).max(20 * 1024 * 1024),
      }),
    )
    .max(10)
    .optional(),
});

export const saveCampaignDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload: any = {
      inbox: data.inbox,
      mode: data.mode,
      subject: data.subject,
      body_text: data.body,
      format: data.format,
      tiers: data.mode === "broadcast" ? data.tiers ?? [] : [],
      direct_recipients: data.mode === "direct" ? data.recipients ?? [] : [],
      attachments: (data.attachments ?? []).map((a) => ({
        filename: a.filename,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        storagePath: a.storagePath,
      })),
      status: "draft",
      scheduled_at: null,
      created_by: context.userId,
    };

    if (data.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("outbound_campaigns")
        .update(payload)
        .eq("id", data.id)
        .in("status", ["draft", "scheduled"])
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) throw new Error("Draft not found or already sent");
      return { id: updated.id as string };
    }

    const { data: row, error } = await supabaseAdmin
      .from("outbound_campaigns")
      .insert({ ...payload, total_recipients: 0, sent_count: 0, failed_count: 0 })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "draft insert failed");
    return { id: row.id as string };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Schedule a draft to send at a future time.
// ─────────────────────────────────────────────────────────────────────────────
export const scheduleCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; scheduledAt: string }) =>
    z
      .object({
        id: z.string().uuid(),
        scheduledAt: z
          .string()
          .refine((s) => {
            const t = Date.parse(s);
            return Number.isFinite(t) && t > Date.now() + 30_000;
          }, "Schedule time must be at least 30 seconds in the future"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("outbound_campaigns")
      .update({ status: "scheduled", scheduled_at: data.scheduledAt })
      .eq("id", data.id)
      .in("status", ["draft", "scheduled"])
      .select("id, scheduled_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Campaign not found or already sent");
    return { id: row.id as string, scheduledAt: row.scheduled_at as string };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Cancel a scheduled campaign — moves it back to draft.
// ─────────────────────────────────────────────────────────────────────────────
export const unscheduleCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("outbound_campaigns")
      .update({ status: "draft", scheduled_at: null })
      .eq("id", data.id)
      .eq("status", "scheduled");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Delete a draft / scheduled / failed campaign (refuses sent / sending).
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: campaign, error: fetchErr } = await supabaseAdmin
      .from("outbound_campaigns")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!campaign) throw new Error("Campaign not found");
    if (!["draft", "scheduled", "failed"].includes(campaign.status as string)) {
      throw new Error("Only drafts, scheduled, or failed campaigns can be deleted");
    }

    await supabaseAdmin
      .from("outbound_campaign_recipients")
      .delete()
      .eq("campaign_id", data.id);
    const { error } = await supabaseAdmin
      .from("outbound_campaigns")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Send a draft / scheduled broadcast NOW.
// ─────────────────────────────────────────────────────────────────────────────
export const sendCampaignNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: c, error } = await supabaseAdmin
      .from("outbound_campaigns")
      .select(
        "id, inbox, mode, subject, body_text, format, tiers, direct_recipients, attachments, status",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!c) throw new Error("Campaign not found");
    if (!["draft", "scheduled", "failed"].includes(c.status as string)) {
      throw new Error(`Campaign is already ${c.status}`);
    }
    if (c.mode !== "broadcast") {
      throw new Error("Only broadcast campaigns can be sent from drafts.");
    }
    if (!c.subject || !c.body_text) {
      throw new Error("Subject and body are required");
    }

    await supabaseAdmin
      .from("outbound_campaigns")
      .update({ status: "sending" })
      .eq("id", c.id);

    if (!c.tiers || (c.tiers as string[]).length === 0) {
      await supabaseAdmin
        .from("outbound_campaigns")
        .update({ status: "failed", last_error: "No tiers selected" })
        .eq("id", c.id);
      throw new Error("Pick at least one tier before sending");
    }
    const recipients = await resolveTierRecipients(supabaseAdmin, c.tiers as Tier[]);

    if (recipients.length === 0) {
      await supabaseAdmin
        .from("outbound_campaigns")
        .update({ status: "failed", last_error: "No valid recipients matched" })
        .eq("id", c.id);
      throw new Error("No valid recipients matched");
    }

    await supabaseAdmin
      .from("outbound_campaign_recipients")
      .delete()
      .eq("campaign_id", c.id);
    await supabaseAdmin.from("outbound_campaign_recipients").insert(
      recipients.map((r) => ({
        campaign_id: c.id,
        email: r.email,
        name: r.name,
        status: "queued" as const,
      })),
    );

    const attachmentPayloads: Array<{
      filename: string;
      contentType: string;
      data: Uint8Array;
    }> = [];
    for (const att of ((c.attachments as any[]) ?? [])) {
      if (!att.storagePath) continue;
      const { data: file } = await supabaseAdmin.storage
        .from("support-attachments")
        .download(att.storagePath);
      if (!file) continue;
      attachmentPayloads.push({
        filename: att.filename,
        contentType: att.mimeType,
        data: new Uint8Array(await file.arrayBuffer()),
      });
    }

    const inboxMeta = INBOX_META[c.inbox as Inbox];
    const result = await runBroadcastBatch({
      supabaseAdmin,
      campaignId: c.id,
      recipients,
      inboxMeta,
      subject: c.subject,
      body: c.body_text,
      format: (c.format as "text" | "html") ?? "text",
      attachmentPayloads,
    });

    await supabaseAdmin
      .from("outbound_campaigns")
      .update({
        total_recipients: recipients.length,
        sent_count: result.sent,
        failed_count: result.failed,
        status: result.dailyLimitHit ? "failed" : "sent",
        last_error: result.dailyLimitHit ? "Mailgun daily limit reached" : null,
        sent_at: new Date().toISOString(),
        scheduled_at: null,
      })
      .eq("id", c.id);

    return {
      sent: result.sent,
      failed: result.failed,
      total: recipients.length,
      campaignId: c.id,
      dailyLimitHit: result.dailyLimitHit,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Resend a campaign to recipients that previously failed.
// ─────────────────────────────────────────────────────────────────────────────
export const resendFailedRecipients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { campaignId: string }) =>
    z.object({ campaignId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: c, error } = await supabaseAdmin
      .from("outbound_campaigns")
      .select("id, inbox, subject, body_text, format, attachments, mode")
      .eq("id", data.campaignId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!c) throw new Error("Campaign not found");
    if (c.mode === "direct") {
      throw new Error(
        "Direct (1-to-1) campaigns can't be bulk-resent — open the ticket instead.",
      );
    }

    // Cloudflare Workers cap each request's wall-time, so process at most
    // RESEND_BATCH_LIMIT recipients per call. The client can re-trigger to
    // continue, and the remaining count is returned in the response.
    const RESEND_BATCH_LIMIT = 25;
    const { data: failedRows, error: fErr } = await supabaseAdmin
      .from("outbound_campaign_recipients")
      .select("email, name")
      .eq("campaign_id", c.id)
      .eq("status", "failed")
      .limit(RESEND_BATCH_LIMIT);
    if (fErr) throw new Error(fErr.message);
    if (!failedRows || failedRows.length === 0) {
      return { sent: 0, failed: 0, total: 0, remaining: 0, dailyLimitHit: false };
    }

    const recipients = failedRows.map((r: any) => ({
      email: r.email as string,
      name: (r.name ?? null) as string | null,
    }));

    await supabaseAdmin
      .from("outbound_campaign_recipients")
      .update({ status: "queued", error_message: null })
      .eq("campaign_id", c.id)
      .in("email", recipients.map((r) => r.email));

    const attachmentPayloads: Array<{
      filename: string;
      contentType: string;
      data: Uint8Array;
    }> = [];
    for (const att of ((c.attachments as any[]) ?? [])) {
      if (!att.storagePath) continue;
      const { data: file } = await supabaseAdmin.storage
        .from("support-attachments")
        .download(att.storagePath);
      if (!file) continue;
      attachmentPayloads.push({
        filename: att.filename,
        contentType: att.mimeType,
        data: new Uint8Array(await file.arrayBuffer()),
      });
    }

    const inboxMeta = INBOX_META[c.inbox as Inbox];
    const result = await runBroadcastBatch({
      supabaseAdmin,
      campaignId: c.id,
      recipients,
      inboxMeta,
      subject: c.subject,
      body: c.body_text,
      format: (c.format as "text" | "html") ?? "text",
      attachmentPayloads,
    });

    const { data: totals } = await supabaseAdmin
      .from("outbound_campaign_recipients")
      .select("status")
      .eq("campaign_id", c.id);
    const sentCount = (totals ?? []).filter((r: any) => r.status === "sent").length;
    const failedCount = (totals ?? []).filter((r: any) => r.status === "failed").length;
    await supabaseAdmin
      .from("outbound_campaigns")
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: failedCount === 0 ? "sent" : result.dailyLimitHit ? "failed" : "sent",
        last_error: result.dailyLimitHit ? "Mailgun daily limit reached" : null,
      })
      .eq("id", c.id);

    return {
      sent: result.sent,
      failed: result.failed,
      total: recipients.length,
      remaining: failedCount,
      dailyLimitHit: result.dailyLimitHit,
    };
  });

