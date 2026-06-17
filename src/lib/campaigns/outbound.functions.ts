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
function isValidEmail(e: string): boolean {
  return EMAIL_RE.test(e.trim());
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// Build a map of userId -> email by paging through auth.users.
// Small admin tool, infrequent calls — adequate for tens of thousands.
async function buildUserEmailMap(
  supabaseAdmin: any,
  userIds: string[],
): Promise<Map<string, string>> {
  const wanted = new Set(userIds);
  const map = new Map<string, string>();
  let page = 1;
  // Hard cap to avoid runaway loops
  for (let i = 0; i < 50 && map.size < wanted.size; i++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      if (u.email && wanted.has(u.id)) map.set(u.id, u.email);
    }
    if (users.length < 1000) break;
    page += 1;
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Trainer search (for 1-to-1 compose)
// ─────────────────────────────────────────────────────────────────────────────
export const searchTrainers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string; tier?: Tier }) =>
    z
      .object({
        q: z.string().max(120).optional(),
        tier: z.enum(["free", "verified", "pro", "studio"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull all professionals (dataset is small on REPs today).
    const { data: pros, error } = await supabaseAdmin
      .from("professionals")
      .select("id, trading_name, primary_profession, city, public_email")
      .limit(500);
    if (error) throw new Error(error.message);

    const ids = (pros ?? []).map((p: any) => p.id);

    // Fetch profile names separately — there's no FK between professionals
    // and profiles, so PostgREST can't embed-join them. Building this map by
    // hand is the only way to get full_name reliably.
    const nameMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of profs ?? []) {
        if (p.full_name) nameMap.set(p.id, p.full_name);
      }
    }

    // Resolve tier from subscriptions
    const tierMap = new Map<string, Tier>();
    if (ids.length > 0) {
      const { data: subs } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, status")
        .in("user_id", ids)
        .in("status", ["active", "trialing", "past_due"]);
      for (const s of subs ?? []) tierMap.set(s.user_id, s.tier);
    }

    // Resolve email: prefer public_email, else auth.users.email
    const missingEmail = (pros ?? []).filter((p: any) => !p.public_email);
    const emailMap = await buildUserEmailMap(
      supabaseAdmin,
      missingEmail.map((p: any) => p.id),
    );

    let rows = (pros ?? [])
      .map((p: any) => ({
        id: p.id,
        full_name: nameMap.get(p.id) ?? p.trading_name ?? "Unnamed",
        trading_name: p.trading_name,
        email: (p.public_email ?? emailMap.get(p.id) ?? "").toLowerCase(),
        tier: tierMap.get(p.id) ?? ("free" as Tier),
        profession: p.primary_profession,
        city: p.city,
      }))
      .filter((r: any) => r.email);

    // Free-text filter across name / trading_name / email / city
    if (data.q && data.q.trim().length > 0) {
      const needle = data.q.trim().toLowerCase();
      rows = rows.filter((r) =>
        [r.full_name, r.trading_name, r.email, r.city]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(needle)),
      );
    }

    const filtered = data.tier ? rows.filter((r) => r.tier === data.tier) : rows;
    return filtered.slice(0, 20);
  });


// ─────────────────────────────────────────────────────────────────────────────
// Broadcast preview — how many trainers match the selected tier(s)?
// ─────────────────────────────────────────────────────────────────────────────
export const previewBroadcastCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tiers: Tier[] }) =>
    z
      .object({
        tiers: z
          .array(z.enum(["free", "verified", "pro", "studio"]))
          .min(1)
          .max(4),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const recipients = await resolveTierRecipients(supabaseAdmin, data.tiers);
    return { count: recipients.length };
  });

async function resolveTierRecipients(
  supabaseAdmin: any,
  tiers: Tier[],
): Promise<Array<{ userId: string; email: string; name: string }>> {
  const wantFree = tiers.includes("free");
  const paidTiers = tiers.filter((t) => t !== "free");

  // Find user IDs with one of the paid tiers
  const paidUserIds = new Set<string>();
  if (paidTiers.length > 0) {
    const { data: subs, error } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, tier, status")
      .in("tier", paidTiers)
      .in("status", ["active", "trialing", "past_due"]);
    if (error) throw new Error(error.message);
    for (const s of subs ?? []) paidUserIds.add(s.user_id);
  }

  // Pull all professionals (we filter in-memory; small dataset on REPs today).
  // No FK exists between professionals and profiles, so we can't embed-join —
  // fetch full_name separately below.
  const { data: allPros, error: pErr } = await supabaseAdmin
    .from("professionals")
    .select("id, public_email, trading_name");
  if (pErr) throw new Error(pErr.message);

  let proSet: any[] = allPros ?? [];
  if (!wantFree) {
    proSet = proSet.filter((p: any) => paidUserIds.has(p.id));
  } else if (paidTiers.length > 0) {
    // wantFree=true AND specific paid tiers selected: include paid set + free (anyone without a paid sub)
    const allPaidSubs = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .in("status", ["active", "trialing", "past_due"])
      .in("tier", ["verified", "pro", "studio"]);
    const everyPaid = new Set<string>(
      (allPaidSubs.data ?? []).map((s: any) => s.user_id),
    );
    proSet = proSet.filter(
      (p: any) => paidUserIds.has(p.id) || !everyPaid.has(p.id),
    );
  }
  // Else (only free): all pros without any active paid sub
  if (wantFree && paidTiers.length === 0) {
    const allPaidSubs = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .in("status", ["active", "trialing", "past_due"])
      .in("tier", ["verified", "pro", "studio"]);
    const everyPaid = new Set<string>(
      (allPaidSubs.data ?? []).map((s: any) => s.user_id),
    );
    proSet = proSet.filter((p: any) => !everyPaid.has(p.id));
  }

  // Fetch full_name for the surviving set
  const nameMap = new Map<string, string>();
  if (proSet.length > 0) {
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", proSet.map((p: any) => p.id));
    for (const p of profs ?? []) {
      if (p.full_name) nameMap.set(p.id, p.full_name);
    }
  }

  const needEmailIds = proSet
    .filter((p: any) => !p.public_email)
    .map((p: any) => p.id);
  const emailMap = await buildUserEmailMap(supabaseAdmin, needEmailIds);

  return proSet
    .map((p: any) => {
      const email = (p.public_email ?? emailMap.get(p.id) ?? "").toLowerCase().trim();
      return {
        userId: p.id,
        email,
        name: nameMap.get(p.id) ?? p.trading_name ?? "",
      };
    })
    .filter((r) => r.email && isValidEmail(r.email));
}


// ─────────────────────────────────────────────────────────────────────────────
// Send outbound email (1-to-1 or broadcast). Logs as support ticket(s).
// ─────────────────────────────────────────────────────────────────────────────
export const sendAdminOutbound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      inbox: Inbox;
      mode: "direct" | "broadcast";
      // direct mode
      recipients?: Array<{ email: string; name?: string | null }>;
      // broadcast mode
      tiers?: Tier[];
      subject: string;
      body: string;
      // attachments uploaded to support-attachments bucket via signed URL
      attachments?: Array<{
        storagePath: string;
        filename: string;
        mimeType: string;
        sizeBytes: number;
      }>;
    }) =>
      z
        .object({
          inbox: z.enum(["support", "pros", "partners", "press"]),
          mode: z.enum(["direct", "broadcast"]),
          recipients: z
            .array(
              z.object({
                email: z.string().email(),
                name: z.string().max(120).nullable().optional(),
              }),
            )
            .max(500)
            .optional(),
          tiers: z
            .array(z.enum(["free", "verified", "pro", "studio"]))
            .min(1)
            .max(4)
            .optional(),
          subject: z.string().min(1).max(200),
          body: z.string().min(1).max(50000),
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
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      sendViaMailgun,
      buildMessageId,
    } = await import("@/lib/support/mailgun-send.server");

    // Resolve recipients
    let recipients: Array<{ email: string; name: string | null }> = [];
    if (data.mode === "direct") {
      recipients = (data.recipients ?? []).map((r) => ({
        email: r.email.toLowerCase(),
        name: r.name ?? null,
      }));
    } else {
      if (!data.tiers || data.tiers.length === 0) {
        throw new Error("Pick at least one tier for broadcast");
      }
      const resolved = await resolveTierRecipients(supabaseAdmin, data.tiers);
      recipients = resolved.map((r) => ({ email: r.email, name: r.name || null }));
    }

    if (recipients.length === 0) {
      throw new Error("No recipients matched");
    }

    // Dedupe by email
    const seen = new Set<string>();
    recipients = recipients.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    // Download attachments once (reused per recipient)
    const attachmentPayloads: Array<{
      filename: string;
      contentType: string;
      data: Uint8Array;
      storagePath: string;
      sizeBytes: number;
    }> = [];
    for (const att of data.attachments ?? []) {
      const { data: file, error } = await supabaseAdmin.storage
        .from("support-attachments")
        .download(att.storagePath);
      if (error || !file) throw new Error(`Attachment fetch failed: ${att.filename}`);
      const buf = new Uint8Array(await file.arrayBuffer());
      attachmentPayloads.push({
        filename: att.filename,
        contentType: att.mimeType,
        data: buf,
        storagePath: att.storagePath,
        sizeBytes: att.sizeBytes,
      });
    }

    const inboxMeta = INBOX_META[data.inbox];
    const html = bodyToHtml(data.body);

    // ── BROADCAST branch ────────────────────────────────────────────────────
    // Broadcasts become a single `outbound_campaigns` row + one recipient
    // row per address. We do NOT create a ticket per recipient — that floods
    // the queue. When a recipient replies, the inbound webhook creates a
    // single ticket tagged `campaign:<id>` for that conversation only.
    if (data.mode === "broadcast") {
      const { data: campaign, error: cErr } = await supabaseAdmin
        .from("outbound_campaigns")
        .insert({
          inbox: data.inbox,
          subject: data.subject,
          body_text: data.body,
          body_html: html,
          created_by: context.userId,
          total_recipients: recipients.length,
          tiers: data.tiers ?? [],
          attachments: (data.attachments ?? []).map((a) => ({
            filename: a.filename,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
          })),
        })
        .select("id")
        .single();
      if (cErr || !campaign) {
        throw new Error(cErr?.message ?? "campaign insert failed");
      }

      // Bulk-insert recipient rows up-front (queued).
      const recipientRows = recipients.map((r) => ({
        campaign_id: campaign.id,
        email: r.email,
        name: r.name,
        status: "queued" as const,
      }));
      if (recipientRows.length > 0) {
        const { error: rErr } = await supabaseAdmin
          .from("outbound_campaign_recipients")
          .insert(recipientRows);
        if (rErr) throw new Error(`recipient insert failed: ${rErr.message}`);
      }

      let sent = 0;
      const failures: Array<{ email: string; error: string }> = [];

      for (const r of recipients) {
        const messageId = buildMessageId(`campaign-${campaign.id}`);
        try {
          await sendViaMailgun({
            from: `${inboxMeta.name} <${inboxMeta.email}>`,
            to: r.name ? `${r.name} <${r.email}>` : r.email,
            subject: data.subject,
            text: data.body,
            html,
            messageId,
            replyTo: inboxMeta.email,
            attachments: attachmentPayloads.map((a) => ({
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
            })
            .eq("campaign_id", campaign.id)
            .eq("email", r.email);
          sent += 1;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          failures.push({ email: r.email, error: errorMsg });
          await supabaseAdmin
            .from("outbound_campaign_recipients")
            .update({ status: "failed", error_message: errorMsg })
            .eq("campaign_id", campaign.id)
            .eq("email", r.email);
        }
      }

      await supabaseAdmin
        .from("outbound_campaigns")
        .update({
          sent_count: sent,
          failed_count: failures.length,
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      return {
        sent,
        failed: failures.length,
        total: recipients.length,
        campaignId: campaign.id,
        failures: failures.slice(0, 10),
      };
    }

    // ── DIRECT (1-to-1) branch ─────────────────────────────────────────────
    // Direct sends still create one ticket per recipient — that's the point
    // of a 1-to-1 conversation. Same behaviour as before.
    let sent = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const r of recipients) {
      try {
        const { data: ticket, error: tErr } = await supabaseAdmin
          .from("support_tickets")
          .insert({
            subject: data.subject,
            requester_email: r.email,
            requester_name: r.name,
            priority: "normal",
            source: "admin",
            inbox: data.inbox,
            status: "pending",
            tags: ["outbound"],
            sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .select("id")
          .single();
        if (tErr || !ticket) throw new Error(tErr?.message ?? "ticket insert failed");

        const messageId = buildMessageId(ticket.id);

        await sendViaMailgun({
          from: `${inboxMeta.name} <${inboxMeta.email}>`,
          to: r.name ? `${r.name} <${r.email}>` : r.email,
          subject: data.subject,
          text: data.body,
          html,
          messageId,
          replyTo: inboxMeta.email,
          attachments: attachmentPayloads.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            data: a.data,
          })),
        });

        const { data: msg, error: mErr } = await supabaseAdmin
          .from("support_messages")
          .insert({
            ticket_id: ticket.id,
            direction: "outbound",
            from_email: inboxMeta.email,
            from_name: inboxMeta.name,
            author_user_id: context.userId,
            body_text: data.body,
            body_html: html,
            mailgun_message_id: messageId,
          })
          .select("id")
          .single();
        if (mErr || !msg) throw new Error(mErr?.message ?? "message insert failed");

        if (attachmentPayloads.length > 0) {
          const attRows = attachmentPayloads.map((a) => ({
            message_id: msg.id,
            storage_path: a.storagePath,
            filename: a.filename,
            mime_type: a.contentType,
            size_bytes: a.sizeBytes,
          }));
          await supabaseAdmin.from("support_attachments").insert(attRows);
        }

        await supabaseAdmin
          .from("support_tickets")
          .update({ thread_key: messageId })
          .eq("id", ticket.id);

        sent += 1;
      } catch (err) {
        failures.push({
          email: r.email,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      sent,
      failed: failures.length,
      total: recipients.length,
      campaignId: null,
      failures: failures.slice(0, 10),
    };
  });


function bodyToHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px 0">${escape(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#0f172a">${paragraphs}</div>`;
}
