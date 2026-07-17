import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Inbox = "support" | "pros" | "partners" | "press" | "news";
type Tier = "free" | "verified" | "pro" | "studio" | "training_provider" | "former" | "newsletter" | "prospects";

// The "news" inbox is a send-only address for newsletter / campaign blasts.
// Inbound mail to news@notify.repsuk.org is dropped by the Mailgun webhook
// (see src/routes/api/public/email/inbound/mailgun.ts) — do NOT reuse it for
// anything that needs replies.
const INBOX_META: Record<Inbox, { email: string; name: string; label: string }> = {
  support: { email: "support@repsuk.org", name: "REPS", label: "Support" },
  pros: { email: "pros@repsuk.org", name: "REPS Pros", label: "Pros" },
  partners: { email: "partners@repsuk.org", name: "REPS Partners", label: "Partners" },
  press: { email: "press@repsuk.org", name: "REPS Press", label: "Press" },
  news: { email: "news@notify.repsuk.org", name: "REPS Updates", label: "Newsletter (send-only)" },
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

async function resolveUserEmailsById(
  supabaseAdmin: any,
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    [...new Set(userIds)].map(async (id) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
      if (!error && data?.user?.email) map.set(id, data.user.email.toLowerCase().trim());
    }),
  );
  return map;
}

async function searchUserIdsByEmail(
  supabaseAdmin: any,
  q: string,
): Promise<Map<string, string>> {
  const needle = q.toLowerCase().trim();
  const map = new Map<string, string>();
  let page = 1;
  for (let i = 0; i < 50 && map.size < 20; i++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      if (u.email?.toLowerCase().includes(needle)) map.set(u.id, u.email.toLowerCase().trim());
      if (map.size >= 20) break;
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
        tier: z.enum(["free", "verified", "pro", "studio", "training_provider", "former", "newsletter", "prospects"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.q?.trim() ?? "";
    const needle = q.toLowerCase();
    const escaped = q.replace(/[%,]/g, "");
    const like = `%${escaped}%`;

    const matchingIds = new Set<string>();
    const emailById = q.length >= 2 ? await searchUserIdsByEmail(supabaseAdmin, q) : new Map<string, string>();
    for (const id of emailById.keys()) matchingIds.add(id);

    if (q.length >= 2) {
      const [{ data: profileRows, error: profileErr }, { data: proRows, error: proErr }, idRes] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id")
          .or(`full_name.ilike.${like},full_name.ilike.${like}`)
          .limit(50),
        supabaseAdmin
          .from("professionals")
          .select("id")
          .or(`city.ilike.${like},primary_profession.ilike.${like}`)
          .limit(50),
        /^[0-9a-fA-F-]{4,}$/.test(q)
          ? supabaseAdmin.rpc("search_profiles_by_id_prefix", { _q: q })
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (profileErr) throw new Error(profileErr.message);
      if (proErr) throw new Error(proErr.message);
      if (idRes.error) throw new Error(idRes.error.message);
      for (const r of profileRows ?? []) matchingIds.add(r.id);
      for (const r of proRows ?? []) matchingIds.add(r.id);
      for (const r of idRes.data ?? []) matchingIds.add(r.id);
    }

    let proQuery = supabaseAdmin
      .from("professionals")
      .select("id, primary_profession, city, account_type")
      // Exclude organisations (training providers) from individual-pro
      // campaigns at the source — this is authoritative even when the
      // subscriptions row has drifted (e.g. tier still 'free' from a
      // missed webhook mapping).
      .neq("account_type", "training_provider");
    if (matchingIds.size > 0) proQuery = proQuery.in("id", [...matchingIds]);
    else if (q.length >= 2) return [];
    else proQuery = proQuery.limit(500);

    const { data: pros, error } = await proQuery;
    if (error) throw new Error(error.message);

    const ids = (pros ?? []).map((p: any) => p.id);


    // Fetch profile names + full_name separately — no FK between
    // professionals and profiles, so PostgREST can't embed-join them.
    const nameMap = new Map<string, string>();
    const businessMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of profs ?? []) {
        if (p.full_name) nameMap.set(p.id, p.full_name);
        if (p.full_name) businessMap.set(p.id, p.full_name);
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
      for (const s of subs ?? []) {
        if (!s.user_id) continue;
        if (s.tier === "training_provider") continue; // org-owned subs are not part of pro campaigns
        tierMap.set(s.user_id, s.tier as Tier);
      }
    }

    const missingEmailIds = ids.filter((id: string) => !emailById.has(id));
    const resolvedEmails = await resolveUserEmailsById(supabaseAdmin, missingEmailIds);
    for (const [id, email] of resolvedEmails) emailById.set(id, email);

    let rows = (pros ?? []).map((p: any) => ({
      id: p.id,
      full_name: nameMap.get(p.id) ?? businessMap.get(p.id) ?? "Unnamed",
      email: emailById.get(p.id) ?? "",
      tier: tierMap.get(p.id) ?? ("free" as Tier),
      profession: p.primary_profession,
      city: p.city,
    }));

    if (q.length >= 2) {
      rows = rows.filter((r) =>
        [r.id, r.full_name, r.city, r.profession, r.email]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(needle)),
      );
    }
    if (data.tier) rows = rows.filter((r) => r.tier === data.tier);

    return rows.filter((r) => r.email).slice(0, 20);
  });




// ─────────────────────────────────────────────────────────────────────────────
// Broadcast preview — how many trainers match the selected tier(s)?
// ─────────────────────────────────────────────────────────────────────────────
export const previewBroadcastCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tiers: Tier[]; prospectTags?: string[] }) =>
    z
      .object({
        tiers: z
          .array(z.enum(["free", "verified", "pro", "studio", "former", "newsletter", "prospects"]))
          .min(1)
          .max(7),
        prospectTags: z.array(z.string().max(120)).max(50).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tagOpts = { prospectTags: data.prospectTags };

    // Per-tier counts (small dataset — one resolver call per selected tier).
    const byTier: Partial<Record<Tier, number>> = {};
    await Promise.all(
      data.tiers.map(async (t) => {
        const rs = await resolveTierRecipients(supabaseAdmin, [t], tagOpts);
        byTier[t] = rs.length;
      }),
    );

    // Deduped union across all selected tiers.
    const recipients = await resolveTierRecipients(supabaseAdmin, data.tiers, tagOpts);
    return { count: recipients.length, byTier };
  });

async function resolveTierRecipients(
  supabaseAdmin: any,
  tiers: Tier[],
  opts?: { prospectTags?: string[] },
): Promise<Array<{ userId: string; email: string; name: string }>> {
  const wantFormer = tiers.includes("former");
  const wantNewsletter = tiers.includes("newsletter");
  const wantProspects = tiers.includes("prospects");
  const liveTiers = tiers.filter((t) => t !== "former" && t !== "newsletter" && t !== "prospects");
  const wantFree = liveTiers.includes("free");
  const paidTiers = liveTiers.filter((t) => t !== "free");

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
  // fetch full_name / full_name separately below.
  const { data: allPros, error: pErr } = await supabaseAdmin
    .from("professionals")
    .select("id");
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
      .in("tier", ["verified", "pro", "studio", "training_provider"]);
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
      .in("tier", ["verified", "pro", "studio", "training_provider"]);
    const everyPaid = new Set<string>(
      (allPaidSubs.data ?? []).map((s: any) => s.user_id),
    );
    proSet = proSet.filter((p: any) => !everyPaid.has(p.id));
  }

  // Fetch full_name + full_name for the surviving set
  const nameMap = new Map<string, string>();
  const businessMap = new Map<string, string>();
  if (proSet.length > 0) {
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", proSet.map((p: any) => p.id));
    for (const p of profs ?? []) {
      if (p.full_name) nameMap.set(p.id, p.full_name);
      if (p.full_name) businessMap.set(p.id, p.full_name);
    }
  }

  // Email: always the auth.users login email.
  const emailMap = await resolveUserEmailsById(supabaseAdmin, proSet.map((p: any) => p.id));

  const live = proSet
    .map((p: any) => {
      const email = (emailMap.get(p.id) ?? "").toLowerCase().trim();
      return {
        userId: p.id,
        email,
        name: nameMap.get(p.id) ?? businessMap.get(p.id) ?? "",
      };
    })
    .filter((r) => r.email && isValidEmail(r.email));

  const combined = [...live];

  if (wantFormer) {
    // Former members live in `mailing_list_contacts` (populated by the
    // cancel-and-delete flow). We use `former_user_id` as a stable userId so
    // dedupe + downstream send logic don't choke on null ids.
    const { data: formerRows } = await supabaseAdmin
      .from("mailing_list_contacts")
      .select("email, full_name, former_user_id")
      .eq("marketing_opt_in", true);
    const seen = new Set(combined.map((r) => r.email));
    const former = ((formerRows ?? []) as any[])
      .map((r) => ({
        userId: r.former_user_id ?? `former:${r.email}`,
        email: (r.email ?? "").toLowerCase().trim(),
        name: r.full_name ?? "",
      }))
      .filter((r) => r.email && isValidEmail(r.email) && !seen.has(r.email));
    combined.push(...former);
  }

  if (wantNewsletter) {
    const { data: subs } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email")
      .eq("status", "confirmed");
    const seen = new Set(combined.map((r) => r.email));
    const news = ((subs ?? []) as any[])
      .map((r) => ({
        userId: `newsletter:${r.id}`,
        email: (r.email ?? "").toLowerCase().trim(),
        name: "",
      }))
      .filter((r) => r.email && isValidEmail(r.email) && !seen.has(r.email));
    combined.push(...news);
  }

  if (wantProspects) {
    let pQuery = supabaseAdmin
      .from("prospect_contacts")
      .select("id, email, full_name, list_tag")
      .eq("status", "active");
    if (opts?.prospectTags && opts.prospectTags.length > 0) {
      pQuery = pQuery.in("list_tag", opts.prospectTags);
    }
    const { data: pRows } = await pQuery;
    const seen = new Set(combined.map((r) => r.email));
    const pros = ((pRows ?? []) as any[])
      .map((r) => ({
        userId: `prospect:${r.id}`,
        email: (r.email ?? "").toLowerCase().trim(),
        name: (r.full_name ?? "") as string,
      }))
      .filter((r) => r.email && isValidEmail(r.email) && !seen.has(r.email));
    combined.push(...pros);
  }

  return combined;
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
      prospectTags?: string[];
      subject: string;
      body: string;
      format?: "text" | "html";
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
          inbox: z.enum(["support", "pros", "partners", "press", "news"]),
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
            .array(z.enum(["free", "verified", "pro", "studio", "former", "newsletter", "prospects"]))
            .min(1)
            .max(7)
            .optional(),
          prospectTags: z.array(z.string().max(120)).max(50).optional(),
          subject: z.string().min(1).max(200),
          body: z.string().min(1).max(50000),
          format: z.enum(["text", "html"]).optional().default("text"),
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
    const { runBroadcastBatch } = await import("./outbound-extras.functions");


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
      const resolved = await resolveTierRecipients(supabaseAdmin, data.tiers, { prospectTags: data.prospectTags });
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
    const fmt: "text" | "html" = data.format ?? "text";
    // Template preview (with merge tags intact) for the campaign record.
    const previewHtml = wrapEmail(
      fmt === "html" ? sanitiseHtml(data.body) : textToHtml(data.body),
      inboxMeta.label,
    );

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
          body_html: previewHtml,
          created_by: context.userId,
          total_recipients: recipients.length,
          tiers: data.tiers ?? [],
          prospect_tags: data.prospectTags ?? [],
          mode: "broadcast",
          format: fmt,
          status: "sending",
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

      const result = await runBroadcastBatch({
        supabaseAdmin,
        campaignId: campaign.id,
        recipients,
        inboxMeta,
        subject: data.subject,
        body: data.body,
        format: fmt,
        attachmentPayloads,
      });

      await supabaseAdmin
        .from("outbound_campaigns")
        .update({
          sent_count: result.sent,
          failed_count: result.failed,
          status: result.dailyLimitHit ? "failed" : "sent",
          last_error: result.dailyLimitHit ? "Mailgun daily limit reached" : null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      return {
        sent: result.sent,
        failed: result.failed,
        total: recipients.length,
        campaignId: campaign.id as string | null,
        failures: result.failures.slice(0, 10),
        skipped: skipped.slice(0, 20),
      };
    }


    // ── DIRECT (1-to-1) branch ─────────────────────────────────────────────
    // Direct sends still create one ticket per recipient — that's the point
    // of a 1-to-1 conversation. We ALSO log a single `outbound_campaigns`
    // row (+ per-recipient rows) so direct sends are visible in the
    // Campaigns list alongside broadcasts.
    const { data: directCampaign, error: dcErr } = await supabaseAdmin
      .from("outbound_campaigns")
      .insert({
        inbox: data.inbox,
        subject: data.subject,
        body_text: data.body,
        body_html: previewHtml,
        created_by: context.userId,
        total_recipients: recipients.length,
        tiers: [],
        mode: "direct",
        format: fmt,
        status: "sending",
        direct_recipients: recipients,
        attachments: (data.attachments ?? []).map((a) => ({
          filename: a.filename,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
        })),
      })
      .select("id")
      .single();
    if (dcErr || !directCampaign) {
      throw new Error(dcErr?.message ?? "campaign insert failed");
    }

    const directRecipientRows = recipients.map((r) => ({
      campaign_id: directCampaign.id,
      email: r.email,
      name: r.name,
      status: "queued" as const,
    }));
    if (directRecipientRows.length > 0) {
      const { error: rErr } = await supabaseAdmin
        .from("outbound_campaign_recipients")
        .insert(directRecipientRows);
      if (rErr) throw new Error(`recipient insert failed: ${rErr.message}`);
    }

    // Load the inserted rows so we can pass a stable `recipient_id` into
    // Mailgun's custom variables — the event webhook correlates opens /
    // clicks / unsubscribes / bounces back to the row via that id.
    const recipientIds = new Map<string, string>();
    {
      const { data: rows } = await supabaseAdmin
        .from("outbound_campaign_recipients")
        .select("id, email")
        .eq("campaign_id", directCampaign.id);
      for (const row of (rows ?? []) as Array<{ id: string; email: string }>) {
        recipientIds.set(row.email.toLowerCase(), row.id);
      }
    }

    let sent = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const r of recipients) {
      try {
        // Campaign sends create a ticket for reply-threading, but archive it
        // immediately (status=closed, deleted_at=now). Pending is reserved
        // for real human replies. The inbound webhook un-archives on reply.
        const nowIso = new Date().toISOString();
        const { data: ticket, error: tErr } = await supabaseAdmin
          .from("support_tickets")
          .insert({
            subject: data.subject,
            requester_email: r.email,
            requester_name: r.name,
            priority: "normal",
            source: "admin",
            inbox: data.inbox,
            status: "closed",
            deleted_at: nowIso,
            tags: ["outbound"],
            sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .select("id")
          .single();
        if (tErr || !ticket) throw new Error(tErr?.message ?? "ticket insert failed");

        const messageId = buildMessageId(ticket.id);
        const recipientHtml = wrapEmail(
          renderInnerHtml(data.body, fmt, { email: r.email, name: r.name }),
          inboxMeta.label,
        );
        const recipientText = renderPlainText(data.body, fmt, {
          email: r.email,
          name: r.name,
        });

        await sendViaMailgun({
          from: `${inboxMeta.name} <${inboxMeta.email}>`,
          to: r.name ? `${r.name} <${r.email}>` : r.email,
          subject: data.subject,
          text: recipientText,
          html: recipientHtml,
          messageId,
          replyTo: inboxMeta.email,
          attachments: attachmentPayloads.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            data: a.data,
          })),
          tracking: { opens: true, clicks: "htmlonly" },
          tag: `campaign:${directCampaign.id}`,
          variables: {
            campaign_id: directCampaign.id,
            recipient_id: recipientIds.get(r.email.toLowerCase()) ?? "",
            campaign: "1",
          },
        });

        const { data: msg, error: mErr } = await supabaseAdmin
          .from("support_messages")
          .insert({
            ticket_id: ticket.id,
            direction: "outbound",
            from_email: inboxMeta.email,
            from_name: inboxMeta.name,
            author_user_id: context.userId,
            body_text: recipientText,
            body_html: recipientHtml,
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

        await supabaseAdmin
          .from("outbound_campaign_recipients")
          .update({
            status: "sent",
            mailgun_message_id: messageId,
            sent_at: new Date().toISOString(),
          })
          .eq("campaign_id", directCampaign.id)
          .eq("email", r.email);

        sent += 1;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        failures.push({
          email: r.email,
          error: errorMsg,
        });
        await supabaseAdmin
          .from("outbound_campaign_recipients")
          .update({ status: "failed", error_message: errorMsg })
          .eq("campaign_id", directCampaign.id)
          .eq("email", r.email);
      }
    }

    await supabaseAdmin
      .from("outbound_campaigns")
      .update({
        sent_count: sent,
        failed_count: failures.length,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", directCampaign.id);

    return {
      sent,
      failed: failures.length,
      total: recipients.length,
      campaignId: directCampaign.id as string | null,
      failures: failures.slice(0, 10),
      skipped: skipped.slice(0, 20),
    };
  });


// Inline REPS wordmark (letters + peaks) for email headers.
// Uses fill=currentColor on the SVG so `color` cascades to every path,
// avoiding a per-path replacement of the source artwork.
const REPS_WORDMARK_SVG = (height: number, color = "#0F172A") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 65.03" height="${height}" role="img" aria-label="REPS" style="display:block;color:${color}">
    <g fill="currentColor">
      <path d="M109.54,7.03c-.3-3.57,2.36-6.7,5.93-7,.33-.03.65-.03.98,0h15.76c13.72,0,22.31,6.19,22.31,20.24,0,9.73-7.43,15.5-16.57,16.93l15.24,16.22c1.07,1.05,1.71,2.46,1.78,3.96,0,3.74-2.98,6.79-6.71,6.88-1.99,0-3.89-.83-5.22-2.3l-19.82-24h0v19.46c.26,3.72-2.55,6.94-6.26,7.2s-6.94-2.55-7.2-6.26c-.02-.31-.02-.62,0-.93l-.23-50.37ZM123,28.25h9.21c4.19.4,7.91-2.67,8.31-6.86.04-.37.04-.74.02-1.11.22-4.15-2.96-7.69-7.11-7.92-.41-.02-.82-.01-1.22.03h-9.21v15.86Z"/>
      <path d="M166.56,7.81c0-4.48,2.24-7.78,6.97-7.78h29.94c3.28-.29,6.18,2.14,6.47,5.42.02.26.03.52.02.77.08,3.33-2.55,6.1-5.88,6.18-.2,0-.4,0-.6-.02h-23.48v12.97h22.41c3.34-.23,6.24,2.29,6.47,5.63.01.18.02.36.01.53.02,3.4-2.72,6.18-6.12,6.2-.12,0-.24,0-.37,0h-22.41v13.62h24.33c3.26-.31,6.16,2.09,6.47,5.35.03.27.03.54.02.81.08,3.35-2.57,6.13-5.92,6.21-.19,0-.38,0-.57-.01h-30.81c-3.57.24-6.66-2.47-6.9-6.05-.01-.22-.02-.44,0-.67l-.03-49.17Z"/>
      <path d="M222.03,7.03c-.3-3.57,2.36-6.71,5.93-7,.35-.03.7-.03,1.05,0h15.86c13.17,0,22.93,8.6,22.93,21.41s-10.12,21.24-22.38,21.24h-9.96v14.69c0,3.71-3,6.72-6.71,6.72-3.71,0-6.72-3-6.72-6.71h0V7.03ZM235.46,30.84h9.15c4.94.15,9.07-3.73,9.22-8.67,0-.28,0-.56-.01-.83.29-4.94-3.48-9.17-8.41-9.46-.27-.02-.53-.02-.8-.01h-9.15v18.97Z"/>
      <path d="M294.78,36.68c-1.98,0-5.97-3.05-9.37-3.05-1.91,0-3.57.88-3.57,2.89,0,4.9,18.16,4.15,18.16,16.22,0,6.97-5.87,12.29-14.89,12.29-5.9,0-14.63-3.24-14.63-8.08.14-2.45,2.06-4.43,4.51-4.64,4.09,0,5.9,3.54,10.83,3.54,3.24,0,4.15-1.01,4.15-2.95,0-4.83-18.2-4.09-18.2-16.22,0-7.27,5.9-12.23,14.21-12.23,5.16,0,12.97,2.4,12.97,7.56.08,2.42-1.77,4.48-4.18,4.67Z"/>
      <path d="M50.97,9.92c0,2.35-1.9,4.25-4.25,4.25s-4.25-1.9-4.25-4.25,1.9-4.25,4.25-4.25,4.25,1.9,4.25,4.25Z"/>
      <path d="M48.11,13.68c2.63,1.72,4.9-1.75,5.94-3.24s6.49-8.6,7.01-9.28,1.36-1.59,2.34-.94.68,1.36.26,2.08-11.77,17.42-11.77,23.87c0,4.05,7.69,33.99,8.01,36.23s-.94,2.5-1.52,2.5c-.89.05-1.67-.58-1.82-1.46-.32-1.26-8.14-28.22-9.28-28.22h-1.01c-1.17,0-8.98,26.95-9.31,28.22-.15.88-.93,1.5-1.82,1.46-.68,0-1.91-.23-1.59-2.5s8.01-32.18,8.01-36.23c0-6.49-11.29-23.03-11.77-23.84s-.62-1.46.13-2.08,1.82.29,2.37.94c.55.65,5.84,7.69,6.97,9.28s3.24,4.93,5.94,3.24l2.92-.03Z"/>
      <path d="M18.44,18.13c0,2.01-1.63,3.63-3.63,3.63-2.01,0-3.63-1.63-3.63-3.63s1.63-3.63,3.63-3.63,3.63,1.63,3.63,3.63Z"/>
      <path d="M16,21.34c2.21,1.46,4.15-1.52,5.03-2.76s5.48-7.3,5.97-7.88,1.17-1.36,2.17-.94.55,1.17.19,1.78-10.18,14.92-10.18,20.4c0,3.47,6.49,28.9,6.81,30.85s-.78,2.11-1.36,2.11c-.76.04-1.42-.51-1.52-1.26-.42-1.04-6.91-24-7.91-24h-.88c-.97,0-7.62,22.96-7.91,24-.1.75-.76,1.31-1.52,1.26-.58,0-1.65-.19-1.36-2.11s6.81-27.37,6.81-30.85C10.33,26.46.6,12.48.3,11.67s-.58-1.26.19-1.91c.78-.65,1.56.26,2.01.81s4.99,6.49,5.97,7.88,2.82,4.22,5.03,2.76l2.5.13Z"/>
      <path d="M82.23,18.13c0,2.01-1.63,3.63-3.63,3.63-2.01,0-3.63-1.63-3.63-3.63s1.63-3.63,3.63-3.63,3.63,1.63,3.63,3.63Z"/>
      <path d="M79.8,21.34c2.24,1.46,4.15-1.52,5.03-2.76s5.51-7.3,5.97-7.88,1.17-1.36,2.01-.81.55,1.17.19,1.78-10.02,14.79-10.02,20.27c0,3.47,6.49,28.9,6.81,30.85s-.78,2.11-1.36,2.11c-.76.04-1.42-.51-1.52-1.26-.29-1.04-6.94-24-7.91-24h-.84c-1.01,0-7.65,22.96-7.95,24-.09.76-.76,1.32-1.52,1.26-.58,0-1.62-.19-1.36-2.11s6.81-27.37,6.81-30.85c0-5.48-9.73-19.46-10.02-20.27s-.55-1.26.23-1.78,1.52.26,1.98.81,4.99,6.49,5.97,7.88,2.82,4.22,5.03,2.76h2.5Z"/>
    </g>
  </svg>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Replace {{first_name}}, {{last_name}}, {{full_name}}, {{name}}, {{email}}.
function applyMergeTags(
  body: string,
  recipient: { email: string; name: string | null },
): string {
  const full = (recipient.name ?? "").trim();
  const parts = full.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts.slice(1).join("") : "";
  const map: Record<string, string> = {
    first_name: first || "there",
    last_name: last,
    full_name: full,
    name: full || first || "there",
    email: recipient.email,
  };
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key: string) => {
    const k = String(key).toLowerCase();
    return k in map ? map[k] : `{{${key}}}`;
  });
}

const EMAIL_FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const REPS_ORANGE = "#E85D2F";

function inlineFormat(s: string): string {
  let out = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g,
    `<a href="$1" style="color:${REPS_ORANGE};text-decoration:underline;">$1</a>`,
  );
  return out;
}

// Plain-text body with light markdown → safe HTML paragraphs/lists.
function textToHtml(text: string): string {
  const escaped = escapeHtml(text);
  const blocks = escaped.split(/\n{2,}/);
  const out: string[] = [];
  for (const raw of blocks) {
    const lines = raw.split(/\n/);
    const isList = lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l));
    if (isList) {
      const items = lines
        .map((l) => l.replace(/^\s*[-*]\s+/, ""))
        .map((l) => `<li style="margin:0 0 6px 0;">${inlineFormat(l)}</li>`)
        .join("");
      out.push(
        `<ul style="margin:0 0 14px 20px;padding:0;font-family:${EMAIL_FONT_STACK};font-size:16px;line-height:1.6;color:#0f172a;">${items}</ul>`,
      );
    } else {
      out.push(
        `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT_STACK};font-size:16px;line-height:1.6;color:#0f172a;">${inlineFormat(
          raw.replace(/\n/g, "<br/>"),
        )}</p>`,
      );
    }
  }
  return out.join("\n");
}

// HTML mode: trust admin input but strip <script>/<style>.
function sanitiseHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

function renderInnerHtml(
  body: string,
  format: "text" | "html",
  recipient: { email: string; name: string | null },
): string {
  const personalised = applyMergeTags(body, recipient);
  return format === "html" ? sanitiseHtml(personalised) : textToHtml(personalised);
}

function renderPlainText(
  body: string,
  format: "text" | "html",
  recipient: { email: string; name: string | null },
): string {
  const personalised = applyMergeTags(body, recipient);
  if (format === "text") return personalised;
  return personalised
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wrapEmail(innerHtml: string, inboxLabel: string): string {
  const year = new Date().getFullYear();
  const SITE = "https://repsuk.org";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="format-detection" content="telephone=no,address=no,email=no" />
    <title>REPs</title>
    <style>
      img { -ms-interpolation-mode: bicubic; }
      @media only screen and (max-width:600px) {
        .reps-shell { width:100% !important; padding:16px 8px !important; }
        .reps-card  { width:100% !important; border-radius:12px !important; }
        .reps-head  { padding:20px 18px 6px 18px !important; }
        .reps-pad   { padding:22px 18px 6px 18px !important; }
        .reps-foot  { padding:20px 18px 22px 18px !important; }
        .reps-body, .reps-body p, .reps-body li { font-size:16px !important; line-height:1.6 !important; }
        .reps-foot p { font-size:14px !important; line-height:1.6 !important; }
        .reps-foot-meta { font-size:12px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:${EMAIL_FONT_STACK};color:#0f172a;-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">REPs — the global register of exercise professionals.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="reps-shell" style="background:#f4f5f7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="reps-card" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="padding:0;line-height:0;font-size:0;background:${REPS_ORANGE};height:3px;">&nbsp;</td></tr>
          <tr><td class="reps-head" style="padding:24px 32px 8px 32px;border-bottom:1px solid #f1f2f4;">
            ${REPS_WORDMARK_SVG(22)}
          </td></tr>
          <tr><td class="reps-pad reps-body" style="padding:28px 32px 8px 32px;font-family:${EMAIL_FONT_STACK};">
            ${innerHtml}
          </td></tr>
          <tr><td class="reps-foot" style="padding:24px 32px 28px 32px;border-top:1px solid #f1f2f4;font-family:${EMAIL_FONT_STACK};">
            <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#475569;">The professional platform for the modern fitness industry.</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#64748b;">Reply directly to this email — it goes straight to the ${escapeHtml(inboxLabel)} team.</p>
            <p class="reps-foot-meta" style="margin:0 0 6px 0;font-size:13px;line-height:1.55;color:#64748b;">
              <a href="${SITE}" style="color:#64748b;text-decoration:underline;">repsuk.org</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/contact" style="color:#64748b;text-decoration:underline;">Contact</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/privacy" style="color:#64748b;text-decoration:underline;">Privacy</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/terms" style="color:#64748b;text-decoration:underline;">Terms</a>
            </p>
            <p class="reps-foot-meta" style="margin:0;font-size:12px;line-height:1.55;color:#94a3b8;">© ${year} REPs. All rights reserved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
