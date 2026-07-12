/**
 * Verification notifications — bell + email rail for the trainer's verification
 * lifecycle (insurance gating, renewal nudges). Sits alongside review and
 * support unread feeds.
 *
 * Table: public.verification_notifications
 *   columns: id, professional_id, event, policy_id, threshold_days, context (jsonb), read_at
 *
 * Recipient = the pro themselves. (`professional_id` is the user id.) Admin
 * actions like "nudge to renew" insert with the pro as the target.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { sendTransactionalEmailServer } from "@/lib/email/send.server";

export type VerificationEvent =
  | "identity.approved"
  | "identity.rejected"
  | "identity.needs_more_info"
  | "insurance.rejected_expired"
  | "insurance.flagged_low_cover"
  | "insurance.flagged_name_mismatch"
  | "insurance.auto_approved"
  | "insurance.approved"
  | "insurance.rejected"
  | "insurance.renewal_due"
  | "insurance.renewal_lapsed"
  | "verification.blocked_by_insurance"
  | "qualification.approved"
  | "qualification.rejected"
  | "qualification.changes_requested"
  | "provider_change.approved"
  | "provider_change.rejected"
  | "provider_name.approved"
  | "provider_name.rejected"
  | "provider_domain.approved"
  | "provider_domain.rejected";

export interface VerificationNotificationItem {
  key: string;
  notificationId: string;
  event: VerificationEvent;
  title: string;
  preview: string;
  createdAt: string;
  href: string;
}

interface InsertParams {
  professionalId: string;
  event: VerificationEvent;
  policyId?: string | null;
  thresholdDays?: number | null;
  context?: Record<string, unknown>;
  recipientEmail?: string | null;
  proName?: string | null;
  alsoEmail?: boolean;
}

async function lookupProEmail(professionalId: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.getUserById(professionalId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Server-internal helper — insert a notification idempotently and (best-effort)
 * fire the matching transactional email. Safe to call from other server fns.
 */
export async function notifyVerificationEvent(params: InsertParams) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("verification_notifications")
    .upsert(
      {
        professional_id: params.professionalId,
        event: params.event,
        policy_id: params.policyId ?? null,
        threshold_days: params.thresholdDays ?? null,
        context: (params.context ?? {}) as never,
      } as never,
      {
        onConflict: "professional_id, event, policy_id, threshold_days",
        ignoreDuplicates: true,
      },
    );
  if (error) {
    console.error("[verification.notify] insert failed", error.message);
  }

  if (!params.alsoEmail) return;
  const email = params.recipientEmail ?? (await lookupProEmail(params.professionalId));
  if (!email) return;

  try {
    if (
      params.event === "insurance.rejected_expired" ||
      params.event === "verification.blocked_by_insurance" ||
      params.event === "insurance.flagged_low_cover" ||
      params.event === "insurance.flagged_name_mismatch"
    ) {
      const reason =
        params.event === "insurance.rejected_expired"
          ? "expired"
          : params.event === "insurance.flagged_low_cover"
            ? "low_cover"
            : params.event === "insurance.flagged_name_mismatch"
              ? "name_mismatch"
              : "missing";
      await sendTransactionalEmailServer({
        templateName: "insurance-blocked",
        recipientEmail: email,
        idempotencyKey: `verif:${params.professionalId}:${params.event}:${params.policyId ?? "none"}`,
        templateData: {
          proName: params.proName ?? undefined,
          reason,
          expiryDate: (params.context?.expiry_date as string | undefined) ?? null,
          insuredName: (params.context?.insured_name as string | undefined) ?? null,
          identityName: (params.context?.identity_name as string | undefined) ?? null,
          coverGbp: (params.context?.cover_amount_gbp as number | undefined) ?? null,
          dashboardUrl: "https://repsuk.org/dashboard/verification",
        },
      });
    } else if (
      params.event === "insurance.renewal_due" ||
      params.event === "insurance.renewal_lapsed"
    ) {
      const days = params.thresholdDays ?? 0;
      await sendTransactionalEmailServer({
        templateName: "insurance-renewal-due",
        recipientEmail: email,
        idempotencyKey: `verif:${params.professionalId}:${params.event}:${params.policyId ?? "none"}:${days}`,
        templateData: {
          proName: params.proName ?? undefined,
          expiryDate: (params.context?.expiry_date as string | undefined) ?? "soon",
          daysLeft: days,
          dashboardUrl: "https://repsuk.org/dashboard/verification",
        },
      });
    }
  } catch (e) {
    console.error("[verification.notify] email failed", (e as Error).message);
  }
}

function titleFor(event: VerificationEvent, threshold?: number | null): string {
  switch (event) {
    case "insurance.rejected_expired":
      return "Insurance certificate expired";
    case "insurance.flagged_low_cover":
      return "Insurance cover below £1m";
    case "insurance.flagged_name_mismatch":
      return "Insurance name doesn't match ID";
    case "insurance.auto_approved":
    case "insurance.approved":
      return "Insurance approved";
    case "insurance.rejected":
      return "Insurance certificate rejected";
    case "insurance.renewal_due":
      return threshold && threshold > 0
        ? `Insurance renewal due in ${threshold} day${threshold === 1 ? "" : "s"}`
        : "Insurance renewal due";
    case "insurance.renewal_lapsed":
      return "Insurance has lapsed";
    case "verification.blocked_by_insurance":
      return "Verification blocked — insurance needed";
    case "qualification.approved":
      return "Qualification approved";
    case "qualification.rejected":
      return "Qualification rejected";
    case "qualification.changes_requested":
      return "Qualification needs changes";
    case "provider_change.approved":
      return "Profile change approved";
    case "provider_change.rejected":
      return "Profile change rejected";
    case "provider_name.approved":
      return "Provider name approved";
    case "provider_name.rejected":
      return "Provider name rejected";
    case "provider_domain.approved":
      return "Domain verification approved";
    case "provider_domain.rejected":
      return "Domain verification rejected";
  }
}

function hrefFor(event: VerificationEvent): string {
  if (event.startsWith("provider_")) return "/dashboard/profile";
  return "/dashboard/verification";
}

export const listMyVerificationNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<{ items: VerificationNotificationItem[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("verification_notifications")
      .select("id, event, threshold_days, context, created_at")
      .eq("professional_id", context.userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<{
      id: string;
      event: VerificationEvent;
      threshold_days: number | null;
      context: Record<string, unknown> | null;
      created_at: string;
    }>;
    return {
      items: rows.map((r) => {
        const title = titleFor(r.event, r.threshold_days);
        const ctx = r.context ?? {};
        const preview =
          (ctx.message as string | undefined) ??
          (ctx.admin_note as string | undefined) ??
          (ctx.expiry_date
            ? `Expiry on file: ${ctx.expiry_date as string}`
            : r.event.startsWith("provider_")
              ? "Open your provider profile for details."
              : "Open your verification dashboard for details.");
        return {
          key: `verif:${r.id}`,
          notificationId: r.id,
          event: r.event,
          title,
          preview,
          createdAt: r.created_at,
          href: hrefFor(r.event),
        } satisfies VerificationNotificationItem;
      }),
    };
  });

export const markAllVerificationNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("verification_notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("professional_id", context.userId)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Admin action — send a "please renew your insurance" nudge to a pro.
 * Adds a bell entry + email. Bucketed by threshold so repeated clicks for the
 * same window don't spam.
 */
export const adminNudgeInsuranceRenewal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z.object({ professional_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("id", data.professional_id)
      .maybeSingle();
    const profAny = prof as { full_name?: string | null} | null;

    const { data: ins } = await supabaseAdmin
      .from("insurance_policies")
      .select("id, expiry_date")
      .eq("professional_id", data.professional_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const insAny = ins as { id?: string; expiry_date?: string | null } | null;

    const expiry = insAny?.expiry_date ?? null;
    const daysLeft = expiry
      ? Math.round((new Date(expiry).getTime() - Date.now()) / 86_400_000)
      : 0;
    const threshold = daysLeft <= 0 ? 0 : daysLeft <= 7 ? 7 : daysLeft <= 30 ? 30 : 60;

    await notifyVerificationEvent({
      professionalId: data.professional_id,
      event: daysLeft <= 0 ? "insurance.renewal_lapsed" : "insurance.renewal_due",
      policyId: insAny?.id ?? null,
      thresholdDays: threshold,
      context: { expiry_date: expiry, nudged_by: context.userId },
      proName: profAny?.full_name ?? undefined,
      alsoEmail: true,
    });

    return { ok: true, daysLeft };
  });
