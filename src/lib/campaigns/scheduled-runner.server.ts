// Server-only runner for scheduled broadcasts. Mirrors the logic in
// sendCampaignNow but is callable from outside a server function so the cron
// hook in src/routes/api/public/hooks/send-scheduled-campaigns.ts can invoke
// it without needing an authenticated bearer token.
//
// The campaign row must already be flipped to status='sending' by the caller
// (so two cron workers can't double-fire the same campaign).

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const INBOX_META: Record<
  string,
  { email: string; name: string; label: string }
> = {
  support: { email: "support@repsuk.org", name: "REPS Support", label: "Support" },
  pros: { email: "pros@repsuk.org", name: "REPS Pros", label: "Pros" },
  partners: { email: "partners@repsuk.org", name: "REPS Partners", label: "Partners" },
  press: { email: "press@repsuk.org", name: "REPS Press", label: "Press" },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function runScheduledCampaign(campaignId: string): Promise<{
  sent: number;
  failed: number;
  dailyLimitHit: boolean;
}> {
  const { data: c, error } = await supabaseAdmin
    .from("outbound_campaigns")
    .select(
      "id, inbox, mode, subject, body_text, format, tiers, attachments",
    )
    .eq("id", campaignId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!c) throw new Error("Campaign not found");
  if (c.mode !== "broadcast") {
    throw new Error("Scheduled runner only supports broadcasts");
  }
  if (!c.tiers || c.tiers.length === 0) {
    throw new Error("No tiers selected");
  }
  if (!c.subject || !c.body_text) {
    throw new Error("Subject and body required");
  }

  // Resolve recipients per current tier membership
  const recipients = await resolveTierRecipients(c.tiers as string[]);
  if (recipients.length === 0) throw new Error("No valid recipients matched");

  // Replace prior recipient rows
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

  // Re-download attachments
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

  const inboxMeta = INBOX_META[c.inbox as string];
  if (!inboxMeta) throw new Error(`Unknown inbox: ${c.inbox}`);

  const result = await runBroadcastBatch({
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

  return result;
}

// ─── recipient resolution (mirror of outbound.functions.ts) ──────────────────
async function resolveTierRecipients(
  tiers: string[],
): Promise<Array<{ email: string; name: string | null }>> {
  const VERIFIED_TIERS = tiers.filter((t) => t !== "free");
  const wantsFree = tiers.includes("free");

  let proSet: any[] = [];
  if (VERIFIED_TIERS.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, tier, status")
      .in("tier", VERIFIED_TIERS as any)
      .in("status", ["active", "trialing", "past_due", "unpaid"]);
    const ids = [...new Set((subs ?? []).map((s: any) => s.user_id))];
    if (ids.length > 0) {
      const { data: pros } = await supabaseAdmin
        .from("professionals")
        .select("id")
        .in("id", ids);
      proSet = pros ?? [];
    }
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
    const freePros = (allPros ?? []).filter((p: any) => !paidIds.has(p.id));
    proSet = [...proSet, ...freePros];
  }

  // Dedupe by id
  const byId = new Map<string, any>();
  for (const p of proSet) byId.set(p.id, p);
  proSet = [...byId.values()];

  // Fetch emails via auth.admin per id (batched)
  const emails = new Map<string, string>();
  await Promise.all(
    proSet.map(async (p: any) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(p.id);
      if (data?.user?.email) emails.set(p.id, data.user.email.toLowerCase().trim());
    }),
  );

  // Fetch names from profiles
  const ids = proSet.map((p: any) => p.id);
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, business_name")
    .in("id", ids);
  const names = new Map<string, string>();
  for (const pf of profiles ?? []) {
    names.set(pf.id, (pf.full_name || pf.business_name || "") as string);
  }

  const seen = new Set<string>();
  const out: Array<{ email: string; name: string | null }> = [];
  for (const p of proSet) {
    const email = emails.get(p.id);
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: names.get(p.id) || null });
  }
  return out;
}

// ─── shared Mailgun batch sender (duplicated to keep file self-contained) ────
interface BatchOpts {
  campaignId: string;
  recipients: Array<{ email: string; name: string | null }>;
  inboxMeta: { email: string; name: string; label: string };
  subject: string;
  body: string;
  format: "text" | "html";
  attachmentPayloads: Array<{ filename: string; contentType: string; data: Uint8Array }>;
}

async function runBroadcastBatch(opts: BatchOpts) {
  const { sendViaMailgun, buildMessageId } = await import(
    "@/lib/support/mailgun-send.server"
  );
  const { wrapAndRender } = await import("./email-templating.server");

  const SEND_DELAY_MS = 750;
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
  let failed = 0;
  let dailyLimitHit = false;

  outer: for (const r of opts.recipients) {
    const messageId = buildMessageId(`campaign-${opts.campaignId}`);
    const { html, text } = wrapAndRender({
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
        await supabaseAdmin
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
      failed += 1;
      await supabaseAdmin
        .from("outbound_campaign_recipients")
        .update({ status: "failed", error_message: lastError })
        .eq("campaign_id", opts.campaignId)
        .eq("email", r.email);
    }
    if (dailyLimitHit) break outer;
    await sleep(SEND_DELAY_MS);
  }

  if (dailyLimitHit) {
    await supabaseAdmin
      .from("outbound_campaign_recipients")
      .update({
        status: "failed",
        error_message: "Skipped: Mailgun daily limit reached",
      })
      .eq("campaign_id", opts.campaignId)
      .eq("status", "queued");
  }

  return { sent, failed, dailyLimitHit };
}
