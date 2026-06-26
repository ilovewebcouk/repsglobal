/**
 * Verification notifications — bell + email rail for ID / qualification / insurance
 * gating events. Sits alongside review_notifications and support unread but is
 * scoped to the trainer's own verification lifecycle (and admin nudges).
 *
 * Table: public.verification_notifications
 *   (recipient_user_id, professional_id, event, policy_id, threshold_days, payload, read_at)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware";
import { sendTransactionalEmailServer } from "@/lib/email/send.server";

export type VerificationEvent =
  | "insurance.rejected_expired"
  | "insurance.flagged_low_cover"
  | "insurance.flagged_name_mismatch"
  | "insurance.renewal_due"
  | "insurance.renewal_lapsed"
  | "verification.blocked_by_insurance";

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
  recipientUserId: string;
  professionalId: string;
  event: VerificationEvent;
  policyId?: string | null;
  thresholdDays?: number | null;
  payload?: Record<string, unknown>;
}

/**
 * Server-internal helper — insert a notification idempotently and (best-effort)
 * fire the matching transactional email. Safe to call from other server fns.
 */
export async function notifyVerificationEvent(
  params: InsertParams & { recipientEmail?: string | null; proName?: string | null; alsoEmail?: boolean },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("verification_notifications")
    .upsert(
      {
        recipient_user_id: params.recipientUserId,
        professional_id: params.professionalId,
        event: params.event,
        policy_id: params.policyId ?? null,
        threshold_days: params.thresholdDays ?? null,
        payload: params.payload ?? {},
      } as never,
      {
        onConflict: "professional_id,event,policy_id,threshold_days",
        ignoreDuplicates: true,
      },
    );
  if (error) {
    // Log and keep going — bell is best-effort, we still want the email.
    console.error("[verification.notify] insert failed", error.message);
  }

  if (!params.alsoEmail || !params.recipientEmail) return;

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
        recipientEmail: params.recipientEmail,
        idempotencyKey: `verif:${params.professionalId}:${params.event}:${params.policyId ?? "none"}`,
        templateData: {
          proName: params.proName ?? undefined,
          reason,
          expiryDate: (params.payload?.expiry_date as string | undefined) ?? null,
          insuredName: (params.payload?.insured_name as string | undefined) ?? null,
          identityName: (params.payload?.identity_name as string | undefined) ?? null,
          coverGbp: (params.payload?.cover_amount_gbp as number | undefined) ?? null,
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
        recipientEmail: params.recipientEmail,
        idempotencyKey: `verif:${params.professionalId}:${params.event}:${params.policyId ?? "none"}:${days}`,
        templateData: {
          proName: params.proName ?? undefined,
          expiryDate: (params.payload?.expiry_date as string | undefined) ?? "soon",
          daysLeft: days,
          dashboardUrl: "https://repsuk.org/dashboard/verification",
        },
      });
    }
  } catch (e) {
    console.error("[verification.notify] email failed", (e as Error).message);
  }
}

function titleFor(event: VerificationEvent, threshold?: number | null) {
  switch (event) {
    case "insurance.rejected_expired":
      return "Insurance certificate expired";
    case "insurance.flagged_low_cover":
      return "Insurance cover below £1m";
    case "insurance.flagged_name_mismatch":
      return "Insurance name doesn't match ID";
    case "insurance.renewal_due":
      return threshold && threshold > 0
        ? `Insurance renewal due in ${threshold} day${threshold === 1 ? "" : "s"}`
        : "Insurance renewal due";
    case "insurance.renewal_lapsed":
      return "Insurance has lapsed";
    case "verification.blocked_by_insurance":
      return "Verification blocked — insurance needed";
  }
}

export const listMyVerificationNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<{ items: VerificationNotificationItem[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("verification_notifications")
      .select("id, event, threshold_days, payload, created_at")
      .eq("recipient_user_id", context.userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    const rows = (data ?? []) as Array<{
      id: string;
      event: VerificationEvent;
      threshold_days: number | null;
      payload: Record<string, unknown> | null;
      created_at: string;
    }>;
    return {
      items: rows.map((r) => {
        const title = titleFor(r.event, r.threshold_days);
        const payload = r.payload ?? {};
        const preview =
          (payload.message as string | undefined) ??
          (payload.expiry_date
            ? `Expiry on file: ${payload.expiry_date as string}`
            : "Open your verification dashboard for details.");
        return {
          key: `verif:${r.id}`,
          notificationId: r.id,
          event: r.event,
          title,
          preview,
          createdAt: r.created_at,
          href: "/dashboard/verification",
        } satisfies VerificationNotificationItem;
      }),
    };
  });

export const markAllVerificationNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("verification_notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("recipient_user_id", context.userId)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Admin action — send a "please renew your insurance" nudge to a pro.
 * Adds a bell entry + email. Idempotent within the same calendar day per pro.
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
      .select("id, full_name, display_name, email")
      .eq("id", data.professional_id)
      .maybeSingle();
    const { data: ins } = await supabaseAdmin
      .from("insurance_policies")
      .select("id, expiry_date")
      .eq("professional_id", data.professional_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const expiry = ins?.expiry_date as string | undefined;
    const daysLeft = expiry
      ? Math.round((new Date(expiry).getTime() - Date.now()) / 86_400_000)
      : 0;

    // Bucket today (or expired) into a stable threshold so re-clicks don't spam.
    const threshold = daysLeft <= 0 ? 0 : daysLeft <= 7 ? 7 : daysLeft <= 30 ? 30 : 60;

    await notifyVerificationEvent({
      recipientUserId: data.professional_id,
      professionalId: data.professional_id,
      event: daysLeft <= 0 ? "insurance.renewal_lapsed" : "insurance.renewal_due",
      policyId: (ins?.id as string | undefined) ?? null,
      thresholdDays: threshold,
      payload: { expiry_date: expiry ?? null, nudged_by: context.userId },
      recipientEmail: (prof?.email as string | undefined) ?? null,
      proName:
        (prof?.display_name as string | undefined) ??
        (prof?.full_name as string | undefined) ??
        undefined,
      alsoEmail: true,
    });

    return { ok: true, daysLeft };
  });
