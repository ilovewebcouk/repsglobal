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
    const skipped: Array<{ email: string; reason: string }> = [];
    if (data.mode === "direct") {
      for (const r of data.recipients ?? []) {
        const email = r.email.toLowerCase().trim();
        if (!isValidEmail(email)) {
          skipped.push({ email: r.email, reason: "Invalid email format" });
          continue;
        }
        recipients.push({ email, name: r.name ?? null });
      }
    } else {
      if (!data.tiers || data.tiers.length === 0) {
        throw new Error("Pick at least one tier for broadcast");
      }
      const resolved = await resolveTierRecipients(supabaseAdmin, data.tiers);
      for (const r of resolved) {
        if (!isValidEmail(r.email)) {
          skipped.push({ email: r.email, reason: "Invalid email format" });
          continue;
        }
        recipients.push({ email: r.email, name: r.name || null });
      }
    }

    if (recipients.length === 0) {
      throw new Error("No valid recipients matched");
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
    const html = wrapEmail(data.body, inboxMeta.label);

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
        campaignId: campaign.id as string | null,
        failures: failures.slice(0, 10),
        skipped: skipped.slice(0, 20),
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
      campaignId: null as string | null,
      failures: failures.slice(0, 10),
      skipped: skipped.slice(0, 20),
    };
  });


// Inline black REPS wordmark — copied from src/components/brand/RepsWordmark.tsx
const REPS_WORDMARK_SVG = (height: number, color = "#0F172A") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 267.34 48.17" height="${height}" fill="${color}" role="img" aria-label="REPS" style="display:block">
    <path d="M53.86,33.34c7.34-2.81,11.59-8.28,11.59-15.77C65.45,6.55,56.31,0,41.19,0H0v48.17h14.83v-12.82h21.82l12.1,12.82h19.66l-14.54-14.83ZM42.7,23.33H14.83v-10.8h27.79c5.4,0,7.92,1.73,7.92,5.62,0,3.6-2.38,5.18-7.85,5.18Z"/>
    <polygon points="119.96 12.53 129.68 12.53 129.68 0 129.6 0 119.96 0 73.8 0 73.8 48.17 120.17 48.17 129.68 48.17 129.68 35.64 120.17 35.64 88.7 35.64 88.7 29.38 118.16 29.38 126.8 29.38 126.8 18.72 118.16 18.72 88.7 18.72 88.7 12.53 119.96 12.53"/>
    <path d="M175.32,0h-40.68v48.17h14.83v-12.46h25.85c14.11,0,22.97-6.91,22.97-17.71S189.29,0,175.32,0ZM176.98,23.4h-27.51v-10.87h27.51c3.96,0,6.48,2.09,6.48,5.4s-2.45,5.47-6.48,5.47Z"/>
    <path d="M249.05,18.79h-26.28c-3.1,0-4.54-1.01-4.54-3.17s1.44-3.1,4.54-3.1h43.28V0h-42.12c-13.61,0-20.31,4.97-20.31,14.91,0,9.15,6.77,14.47,18.51,14.47h26.07c3.1,0,4.54.94,4.54,3.17s-1.37,3.1-4.39,3.1h-44.72v12.53h44.28c13.39,0,19.44-4.82,19.44-15.41,0-9.15-6.34-13.97-18.29-13.97Z"/>
  </svg>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmail(text: string, inboxLabel: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#0f172a">${escapeHtml(
          p,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n");

  const year = new Date().getFullYear();
  const SITE = "https://repsuk.org";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>REPs</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">REPs — the global register of exercise professionals.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f5f7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="padding:24px 32px 8px 32px;border-bottom:1px solid #f1f2f4;">
            ${REPS_WORDMARK_SVG(22)}
          </td></tr>
          <tr><td style="padding:28px 32px 8px 32px;">
            ${paragraphs}
          </td></tr>
          <tr><td style="padding:24px 32px 28px 32px;border-top:1px solid #f1f2f4;">
            <div style="margin-bottom:12px;">${REPS_WORDMARK_SVG(16)}</div>
            <p style="margin:0 0 8px 0;font-size:13px;line-height:1.55;color:#475569;">REPs — the global register of exercise professionals.</p>
            <p style="margin:0 0 14px 0;font-size:12.5px;line-height:1.55;color:#64748b;">Reply directly to this email — it goes straight to the ${escapeHtml(inboxLabel)} team.</p>
            <p style="margin:0 0 6px 0;font-size:12px;line-height:1.55;color:#64748b;">
              <a href="${SITE}" style="color:#64748b;text-decoration:underline;">repsuk.org</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/contact" style="color:#64748b;text-decoration:underline;">Contact</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/privacy" style="color:#64748b;text-decoration:underline;">Privacy</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/terms" style="color:#64748b;text-decoration:underline;">Terms</a>
            </p>
            <p style="margin:0;font-size:11.5px;line-height:1.55;color:#94a3b8;">© ${year} REPs. All rights reserved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
