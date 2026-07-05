// Newsletter subscribers — public double opt-in flow + admin helpers.
// All writes go through service_role; the table has no anon/authenticated
// grants, so nothing about a subscriber's status is readable client-side.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://repsuk.org";
const FROM_EMAIL = "pros@repsuk.org";
const FROM_NAME = "REPS";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine((v) => EMAIL_RE.test(v), "Enter a valid email address");

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: subscribe (double opt-in — sends a confirm email, does not add to
// the sendable audience until confirmed).
// ─────────────────────────────────────────────────────────────────────────────
export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; sourceUrl?: string | null; source?: "article" | "footer" }) =>
    z
      .object({
        email: emailSchema,
        sourceUrl: z.string().url().max(500).nullish(),
        source: z.enum(["article", "footer"]).default("article"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;

    // Suppression check — respect existing bounces / complaints / global unsubs
    const { data: sup } = await admin
      .from("suppressed_emails")
      .select("email")
      .eq("email", data.email)
      .maybeSingle();
    if (sup) {
      // Silent success — don't leak suppression status
      return { ok: true, status: "suppressed" as const };
    }

    // Fetch existing row (unique on email)
    const { data: existing } = await admin
      .from("newsletter_subscribers")
      .select("id, status, confirm_token")
      .eq("email", data.email)
      .maybeSingle();

    let confirmToken: string;
    let statusNow: "pending" | "confirmed" | "unsubscribed" | "bounced";

    if (existing) {
      if (existing.status === "confirmed") {
        return { ok: true, status: "already_confirmed" as const };
      }
      // pending / unsubscribed / bounced → reset to pending + new token so old
      // confirm links can't be reused. Bounced stays bounced (don't spam).
      if (existing.status === "bounced") {
        return { ok: true, status: "suppressed" as const };
      }
      const newToken = crypto.randomUUID();
      const { error } = await admin
        .from("newsletter_subscribers")
        .update({
          status: "pending",
          confirm_token: newToken,
          unsubscribed_at: null,
          source: data.source,
          source_url: data.sourceUrl ?? null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      confirmToken = newToken;
      statusNow = "pending";
    } else {
      const { data: row, error } = await admin
        .from("newsletter_subscribers")
        .insert({
          email: data.email,
          status: "pending",
          source: data.source,
          source_url: data.sourceUrl ?? null,
        })
        .select("confirm_token")
        .single();
      if (error || !row) throw new Error(error?.message ?? "subscribe failed");
      confirmToken = row.confirm_token as string;
      statusNow = "pending";
    }

    // Send confirm email
    const { sendViaMailgun } = await import("@/lib/support/mailgun-send.server");
    const confirmUrl = `${SITE_URL}/newsletter/confirm?token=${encodeURIComponent(confirmToken)}`;
    const messageId = `<newsletter-confirm-${confirmToken}@repsuk.org>`;

    try {
      await sendViaMailgun({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: data.email,
        subject: "Confirm your REPS newsletter subscription",
        text: `Thanks for signing up to the REPS newsletter.\n\nConfirm your subscription:\n${confirmUrl}\n\nIf you didn't request this, ignore this email — you won't be added.\n\nREPS\n${SITE_URL}`,
        html: confirmEmailHtml(confirmUrl),
        messageId,
      });
    } catch (err) {
      // Don't leak provider errors — user sees generic success. Log server-side.
      console.error("[newsletter] confirm-email send failed", err);
    }

    return { ok: true, status: statusNow };
  });

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: confirm subscription via one-click token
// ─────────────────────────────────────────────────────────────────────────────
export const confirmNewsletterSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) =>
    z.object({ token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;

    const { data: row } = await admin
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("confirm_token", data.token)
      .maybeSingle();

    if (!row) return { ok: false as const, reason: "invalid" as const };
    if (row.status === "confirmed") return { ok: true as const, reason: "already" as const };
    if (row.status === "unsubscribed" || row.status === "bounced") {
      return { ok: false as const, reason: "invalid" as const };
    }

    const { error } = await admin
      .from("newsletter_subscribers")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(error.message);

    return { ok: true as const, reason: "confirmed" as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: unsubscribe via token (linked from newsletter footer)
// ─────────────────────────────────────────────────────────────────────────────
export const unsubscribeFromNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) =>
    z.object({ token: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;

    const { data: row } = await admin
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("confirm_token", data.token)
      .maybeSingle();

    if (!row) return { ok: false as const, reason: "invalid" as const };
    if (row.status === "unsubscribed") return { ok: true as const, reason: "already" as const };

    const { error } = await admin
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true as const, reason: "unsubscribed" as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: list subscribers (paginated summary)
// ─────────────────────────────────────────────────────────────────────────────
export const listNewsletterSubscribers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: "pending" | "confirmed" | "unsubscribed" | "bounced"; limit?: number }) =>
    z
      .object({
        status: z.enum(["pending", "confirmed", "unsubscribed", "bounced"]).optional(),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;
    let q = admin
      .from("newsletter_subscribers")
      .select("id, email, status, source, source_url, confirmed_at, created_at, unsubscribed_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: import a batch of pre-confirmed subscribers (e.g. legacy list)
// ─────────────────────────────────────────────────────────────────────────────
export const importNewsletterSubscribers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { emails: string[] }) =>
    z
      .object({
        emails: z.array(emailSchema).min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;
    const unique = [...new Set(data.emails)];
    let inserted = 0;
    let skipped = 0;
    for (const email of unique) {
      const { error } = await admin.from("newsletter_subscribers").upsert(
        {
          email,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          source: "admin_import",
        },
        { onConflict: "email", ignoreDuplicates: true },
      );
      if (error) skipped++;
      else inserted++;
    }
    return { inserted, skipped };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function confirmEmailHtml(confirmUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
        <tr><td>
          <div style="font-size:12px;letter-spacing:0.08em;color:#f97316;text-transform:uppercase;font-weight:700;">REPS Newsletter</div>
          <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;color:#0f172a;">Confirm your subscription</h1>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#334155;">Thanks for signing up to the REPS newsletter — the occasional email about the register, industry standards and product updates from the REPS team.</p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#334155;">Click below to confirm. If you didn't request this, ignore this email — you won't be added.</p>
          <div style="margin:28px 0;">
            <a href="${confirmUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Confirm subscription</a>
          </div>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;">Or copy this link:<br><a href="${confirmUrl}" style="color:#f97316;word-break:break-all;">${confirmUrl}</a></p>
          <hr style="margin:28px 0;border:none;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">REPS · <a href="${SITE_URL}" style="color:#94a3b8;">repsuk.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
