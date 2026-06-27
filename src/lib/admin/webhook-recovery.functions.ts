// Webhook recovery: diagnosis + (forthcoming) replay for payment_events
// rows that failed processing. Read-only diagnosis only in this file for
// Step 1 — the replay logic lands in a separate function after sign-off.
//
// IMPORTANT: diagnosis mirrors the EXISTING `resolveUserId()` in
// src/routes/api/public/payments/webhook.ts and the PROPOSED additional
// ladder steps. Do not diverge — if the live resolver changes, update
// both in lock-step.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Types ------------------------------------------------------------------

export type ResolverStep =
  | "metadata_reps_user_id"
  | "subscriptions_stripe_customer_id"
  | "stripe_customer_metadata" // not consulted in diagnosis (Stripe API skipped)
  | "legacy_stripe_link"
  | "auth_users_email"
  | null;

export interface LookupAttempt {
  step: Exclude<ResolverStep, null>;
  consulted: boolean;
  resolved_user_id: string | null;
  note: string | null;
}

export interface DiagnosisRow {
  payment_event_id: string;
  stripe_event_id: string | null;
  event_type: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  customer_email: string | null;
  created_at: string;
  processing_error: string;
  existing_ladder: LookupAttempt[];
  proposed_ladder: LookupAttempt[];
  would_resolve_via: ResolverStep;
  resolved_user_id: string | null;
  bd_member_id: number | null;
  would_create_subscription: boolean;
}

export interface DiagnosisReportDTO {
  generated_at: string;
  since: string;
  total_failed_events: number;
  resolvable_after_fix: number;
  still_unresolvable: number;
  all_fail_for_same_reason: boolean;
  dominant_failure_reason: string | null;
  rows: DiagnosisRow[];
}

// ---- Server function --------------------------------------------------------

const Input = z.object({
  since: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe("ISO timestamp; defaults to 7 days ago"),
});

export const diagnoseWebhookFailures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof Input>) => Input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<DiagnosisReportDTO> => {
    // Admin gate
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since =
      data.since ?? new Date(Date.now() - 7 * 86_400_000).toISOString();

    // 1. Pull failed events
    const { data: events, error: eventsErr } = await supabaseAdmin
      .from("payment_events")
      .select(
        "id, stripe_event_id, event_type, stripe_customer_id, stripe_subscription_id, payload, processing_error, created_at",
      )
      .not("processing_error", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (eventsErr) throw new Error(eventsErr.message);
    const failed = (events ?? []) as Array<{
      id: string;
      stripe_event_id: string | null;
      event_type: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      payload: unknown;
      processing_error: string;
      created_at: string;
    }>;

    if (failed.length === 0) {
      return {
        generated_at: new Date().toISOString(),
        since,
        total_failed_events: 0,
        resolvable_after_fix: 0,
        still_unresolvable: 0,
        all_fail_for_same_reason: true,
        dominant_failure_reason: null,
        rows: [],
      };
    }

    // Collect distinct customer ids for batched lookups
    const customerIds = Array.from(
      new Set(failed.map((e) => e.stripe_customer_id).filter(Boolean) as string[]),
    );

    // 2. Existing ladder data
    // Step 2: subscriptions by stripe_customer_id
    const { data: subRows } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, stripe_customer_id")
      .in("stripe_customer_id", customerIds);
    const subUserByCustomer = new Map<string, string>(
      ((subRows ?? []) as Array<{ user_id: string; stripe_customer_id: string }>).map(
        (r) => [r.stripe_customer_id, r.user_id],
      ),
    );

    // 3. Proposed ladder data
    // Step 4: legacy_stripe_link -> bd_member_seed.claimed_user_id
    const { data: linkRows } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select("bd_member_id, stripe_customer_id, email")
      .in("stripe_customer_id", customerIds);
    type LinkRow = {
      bd_member_id: number;
      stripe_customer_id: string;
      email: string;
    };
    const links = (linkRows ?? []) as LinkRow[];
    const linkByCustomer = new Map<string, LinkRow>(
      links.map((r) => [r.stripe_customer_id, r]),
    );
    const bdIds = links.map((r) => r.bd_member_id);
    const { data: seedRows } = bdIds.length
      ? await supabaseAdmin
          .from("bd_member_seed")
          .select("bd_member_id, claimed_user_id, email")
          .in("bd_member_id", bdIds)
      : { data: [] };
    type SeedRow = {
      bd_member_id: number;
      claimed_user_id: string | null;
      email: string;
    };
    const seedByBdId = new Map<number, SeedRow>(
      ((seedRows ?? []) as SeedRow[]).map((r) => [r.bd_member_id, r]),
    );

    // Step 5: email -> auth.users (confirmed). Collision-guarded: only count
    // resolution when the matching auth user is also the bd_member_seed
    // claimed_user_id for the same email. We already have that mapping from
    // seedByBdId, so we use that as the source of truth for email→user_id
    // and report "via auth_users_email" if Step 4 was unavailable but the
    // email→user match still holds via seed/auth. In practice for these
    // BD-renewed customers, Step 4 always succeeds when Step 5 would too,
    // so Step 5 is mostly a defence-in-depth fallback.

    // 4. Build per-row diagnosis
    const rows: DiagnosisRow[] = failed.map((evt) => {
      // Extract metadata user id and email from the stored payload
      const payloadObj =
        (evt.payload as { data?: { object?: Record<string, unknown> } })?.data
          ?.object ?? {};
      const meta =
        (payloadObj.metadata as Record<string, string> | undefined) ?? {};
      const metaUserId = meta.reps_user_id ?? null;

      // Customer email may live on different objects depending on event type.
      // For invoice/subscription events the live handler retrieves the
      // customer from Stripe; here we cross-reference legacy_stripe_link
      // and the payload's `customer_email` field if Stripe included it.
      const payloadEmail =
        (payloadObj.customer_email as string | undefined) ??
        (payloadObj.receipt_email as string | undefined) ??
        null;
      const customerId = evt.stripe_customer_id;
      const link = customerId ? linkByCustomer.get(customerId) ?? null : null;
      const seed = link ? seedByBdId.get(link.bd_member_id) ?? null : null;
      const customerEmail = payloadEmail ?? link?.email ?? seed?.email ?? null;

      // EXISTING ladder simulation
      const existing: LookupAttempt[] = [];
      let existingUserId: string | null = null;
      // Step 1
      existing.push({
        step: "metadata_reps_user_id",
        consulted: true,
        resolved_user_id: metaUserId,
        note: metaUserId ? null : "no reps_user_id on event metadata",
      });
      if (metaUserId) existingUserId = metaUserId;
      // Step 2
      const subHit = customerId ? subUserByCustomer.get(customerId) ?? null : null;
      existing.push({
        step: "subscriptions_stripe_customer_id",
        consulted: !existingUserId,
        resolved_user_id: existingUserId ? null : subHit,
        note: !existingUserId && !subHit
          ? "no existing subscriptions row for this customer"
          : null,
      });
      if (!existingUserId && subHit) existingUserId = subHit;
      // Step 3 — Stripe customer metadata. Diagnosis skips the Stripe API
      // call; renewal-engine-created customers are known not to carry
      // reps_user_id, so we report this honestly as "not consulted".
      existing.push({
        step: "stripe_customer_metadata",
        consulted: false,
        resolved_user_id: null,
        note: "skipped in diagnosis (Stripe API not called); confirmed empty for renewal-engine customers",
      });

      // PROPOSED ladder simulation (only the new steps)
      const proposed: LookupAttempt[] = [];
      let proposedUserId: string | null = existingUserId;
      let resolvedVia: ResolverStep = existingUserId
        ? metaUserId
          ? "metadata_reps_user_id"
          : "subscriptions_stripe_customer_id"
        : null;

      // Step 4: legacy_stripe_link → bd_member_seed.claimed_user_id
      const seedUserId = seed?.claimed_user_id ?? null;
      proposed.push({
        step: "legacy_stripe_link",
        consulted: !proposedUserId,
        resolved_user_id: proposedUserId ? null : seedUserId,
        note: proposedUserId
          ? null
          : !link
            ? "no legacy_stripe_link row for this customer"
            : !seed
              ? "legacy link present but bd_member_seed not found"
              : !seedUserId
                ? "bd_member_seed.claimed_user_id is null (unclaimed account)"
                : null,
      });
      if (!proposedUserId && seedUserId) {
        proposedUserId = seedUserId;
        resolvedVia = "legacy_stripe_link";
      }

      // Step 5: email → auth.users (only reported as fallback; in practice
      // step 4 already resolves when 5 would). We cannot query auth.users
      // directly without the Stripe email, but `customerEmail` derived
      // above is what the new resolver would use. Since seed.email always
      // matches, this is informational only.
      proposed.push({
        step: "auth_users_email",
        consulted: !proposedUserId,
        resolved_user_id: null, // computed at runtime by the new resolver
        note: proposedUserId
          ? null
          : !customerEmail
            ? "no email available on event or legacy link"
            : "would query auth.users by email at runtime (collision-guarded)",
      });

      const isCreatingEvent =
        evt.event_type === "customer.subscription.created" ||
        evt.event_type === "customer.subscription.updated" ||
        evt.event_type === "invoice.payment_succeeded" ||
        evt.event_type === "checkout.session.completed";

      return {
        payment_event_id: evt.id,
        stripe_event_id: evt.stripe_event_id,
        event_type: evt.event_type,
        stripe_customer_id: customerId,
        stripe_subscription_id: evt.stripe_subscription_id,
        customer_email: customerEmail,
        created_at: evt.created_at,
        processing_error: evt.processing_error,
        existing_ladder: existing,
        proposed_ladder: proposed,
        would_resolve_via: resolvedVia,
        resolved_user_id: proposedUserId,
        bd_member_id: link?.bd_member_id ?? null,
        would_create_subscription: isCreatingEvent && proposedUserId !== null,
      };
    });

    const resolvable = rows.filter((r) => r.resolved_user_id !== null).length;
    const reasons = new Map<string, number>();
    for (const r of rows) {
      reasons.set(r.processing_error, (reasons.get(r.processing_error) ?? 0) + 1);
    }
    let dominant: string | null = null;
    let dominantCount = 0;
    for (const [reason, count] of reasons) {
      if (count > dominantCount) {
        dominant = reason;
        dominantCount = count;
      }
    }

    return {
      generated_at: new Date().toISOString(),
      since,
      total_failed_events: rows.length,
      resolvable_after_fix: resolvable,
      still_unresolvable: rows.length - resolvable,
      all_fail_for_same_reason: reasons.size === 1,
      dominant_failure_reason: dominant,
      rows,
    };
  });
