// Step 3 — Dry-run replay for failed payment_events.
//
// STRICTLY READ-ONLY. This function:
//   • Resolves user_id using the SAME ladder as the live webhook handler
//     (mirrors src/routes/api/public/payments/webhook.ts after the Step 2 fix).
//   • Computes the row that WOULD be upserted into `subscriptions` from the
//     stored payload (no Stripe API calls, no DB writes).
//   • Computes the churn stage transition that WOULD fire.
//   • Returns a per-event plan + aggregate totals.
//
// It does NOT:
//   • Mutate any table.
//   • Update Stripe customer metadata.
//   • Send any email.
//   • Call the Stripe API.
//
// The actual replay (Step 4) will reuse the live webhook handler against a
// re-derived event payload — this function only PREVIEWS what that will do.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lookupTierByPriceId } from "@/lib/billing/prices";

// ---- Types ------------------------------------------------------------------

export type ResolverHit =
  | "metadata_reps_user_id"
  | "subscriptions_stripe_customer_id"
  | "legacy_stripe_link"
  | "auth_users_email"
  | null;

export interface PlannedSubscriptionUpsert {
  table: "subscriptions";
  conflict: "user_id,environment";
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  tier: string;
  billing_period: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  is_founding: boolean;
  migrated_from_bd: boolean;
  environment: "live" | "sandbox";
}

export interface PlannedChurnTransition {
  table: "churn_lifecycle (via enter_churn_stage)";
  user_id: string;
  stage: "active" | "grace" | "at_risk";
  reason: string;
  source_event: string;
}

export interface PlannedStripeMetadataBackfill {
  target: "stripe.customers.update";
  stripe_customer_id: string;
  metadata: { reps_user_id: string };
}

export type PlannedWrite =
  | PlannedSubscriptionUpsert
  | PlannedChurnTransition
  | PlannedStripeMetadataBackfill;

export interface ReplayRow {
  payment_event_id: string;
  stripe_event_id: string | null;
  event_type: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  resolved_user_id: string | null;
  resolved_via: ResolverHit;
  bd_member_id: number | null;
  would_succeed: boolean;
  skip_reason: string | null;
  planned_writes: PlannedWrite[];
  notes: string[];
}

export interface ReplayReportDTO {
  generated_at: string;
  since: string;
  total_failed_events: number;
  would_succeed: number;
  would_still_fail: number;
  unique_users_recovered: string[];
  unique_subscriptions_recovered: string[];
  rows: ReplayRow[];
  caveats: string[];
}

// ---- Helpers ----------------------------------------------------------------

interface PayloadSubscription {
  id: string;
  status: string;
  customer: string | { id: string };
  livemode: boolean;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: Record<string, string> | null;
  items?: {
    data?: Array<{
      current_period_end?: number;
      price?: { id?: string; lookup_key?: string | null };
    }>;
  };
}

interface PayloadInvoice {
  id: string;
  customer: string | { id: string };
  livemode: boolean;
  customer_email?: string | null;
  subscription?: string | { id: string } | null;
}

function getObj(payload: unknown): Record<string, unknown> {
  return (
    (payload as { data?: { object?: Record<string, unknown> } })?.data
      ?.object ?? {}
  );
}

function customerIdFrom(obj: Record<string, unknown>): string | null {
  const c = obj.customer;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "id" in (c as object)) {
    return (c as { id?: string }).id ?? null;
  }
  return null;
}

function subIso(sub: PayloadSubscription): string | null {
  const cpe =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null;
  return cpe ? new Date(cpe * 1000).toISOString() : null;
}

// ---- Server function --------------------------------------------------------

const Input = z.object({
  since: z.string().datetime({ offset: true }).optional(),
});

export const dryRunReplayWebhookFailures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof Input>) => Input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<ReplayReportDTO> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const since =
      data.since ?? new Date(Date.now() - 7 * 86_400_000).toISOString();

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
      created_at: string;
    }>;

    if (failed.length === 0) {
      return {
        generated_at: new Date().toISOString(),
        since,
        total_failed_events: 0,
        would_succeed: 0,
        would_still_fail: 0,
        unique_users_recovered: [],
        unique_subscriptions_recovered: [],
        rows: [],
        caveats: DEFAULT_CAVEATS,
      };
    }

    // ---- Batch lookups for resolver ladder --------------------------------
    const customerIds = Array.from(
      new Set(
        failed.map((e) => e.stripe_customer_id).filter(Boolean) as string[],
      ),
    );

    const { data: subRows } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, stripe_customer_id")
      .in("stripe_customer_id", customerIds);
    const subByCustomer = new Map<string, string>(
      ((subRows ?? []) as Array<{ user_id: string; stripe_customer_id: string }>).map(
        (r) => [r.stripe_customer_id, r.user_id],
      ),
    );

    const { data: linkRows } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select("bd_member_id, stripe_customer_id, email")
      .in("stripe_customer_id", customerIds);
    type LinkRow = { bd_member_id: number; stripe_customer_id: string; email: string };
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

    // ---- Resolver mirroring the live handler ------------------------------
    function resolve(
      customerId: string | null,
      metadataUserId: string | null,
    ): { userId: string | null; via: ResolverHit; bdId: number | null } {
      if (metadataUserId) {
        return { userId: metadataUserId, via: "metadata_reps_user_id", bdId: null };
      }
      if (!customerId) return { userId: null, via: null, bdId: null };
      const sub = subByCustomer.get(customerId);
      if (sub) {
        return { userId: sub, via: "subscriptions_stripe_customer_id", bdId: null };
      }
      const link = linkByCustomer.get(customerId);
      if (link) {
        const seed = seedByBdId.get(link.bd_member_id);
        if (seed?.claimed_user_id) {
          return {
            userId: seed.claimed_user_id,
            via: "legacy_stripe_link",
            bdId: link.bd_member_id,
          };
        }
      }
      // Step 5 (email→auth.users) is not previewed here without a live Stripe
      // lookup. In production the seed path covers every BD-renewed customer.
      return { userId: null, via: null, bdId: link?.bd_member_id ?? null };
    }

    // ---- Build per-row plans ---------------------------------------------
    const rows: ReplayRow[] = [];
    const recoveredUsers = new Set<string>();
    const recoveredSubs = new Set<string>();
    // Track customers we've already issued a backfill plan for to avoid dupes.
    const backfillEmitted = new Set<string>();
    // Track which subs we've already planned to upsert in this batch (so
    // the follow-up invoice.payment_succeeded for the same sub doesn't
    // double-count).
    const subsPlanned = new Set<string>();

    for (const evt of failed) {
      const obj = getObj(evt.payload);
      const meta = (obj.metadata as Record<string, string> | undefined) ?? {};
      const metaUserId = meta.reps_user_id ?? null;
      const customerId = evt.stripe_customer_id;
      const { userId, via, bdId } = resolve(customerId, metaUserId);

      const planned: PlannedWrite[] = [];
      const notes: string[] = [];

      if (!userId) {
        rows.push({
          payment_event_id: evt.id,
          stripe_event_id: evt.stripe_event_id,
          event_type: evt.event_type,
          stripe_customer_id: customerId,
          stripe_subscription_id: evt.stripe_subscription_id,
          created_at: evt.created_at,
          resolved_user_id: null,
          resolved_via: null,
          bd_member_id: bdId,
          would_succeed: false,
          skip_reason:
            "Resolver returned null even after Step 4. Manual review required.",
          planned_writes: [],
          notes,
        });
        continue;
      }

      recoveredUsers.add(userId);

      // Plan Stripe metadata backfill once per customer (only when resolved
      // via a NEW ladder step — not when meta or existing-sub already had it).
      if (
        customerId &&
        (via === "legacy_stripe_link" || via === "auth_users_email") &&
        !backfillEmitted.has(customerId)
      ) {
        planned.push({
          target: "stripe.customers.update",
          stripe_customer_id: customerId,
          metadata: { reps_user_id: userId },
        });
        backfillEmitted.add(customerId);
      }

      switch (evt.event_type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = obj as unknown as PayloadSubscription;
          const upsert = buildSubscriptionUpsert(sub, userId, customerId);
          if (upsert) {
            planned.push(upsert);
            subsPlanned.add(upsert.stripe_subscription_id);
            recoveredSubs.add(upsert.stripe_subscription_id);
          } else {
            notes.push("Subscription payload missing required fields.");
          }
          if (evt.event_type === "customer.subscription.deleted") {
            planned.push({
              table: "churn_lifecycle (via enter_churn_stage)",
              user_id: userId,
              stage: "grace",
              reason: "Stripe subscription deleted",
              source_event: evt.event_type,
            });
          } else if (sub.status === "active" || sub.status === "trialing") {
            planned.push({
              table: "churn_lifecycle (via enter_churn_stage)",
              user_id: userId,
              stage: "active",
              reason: "Active subscription",
              source_event: evt.event_type,
            });
          }
          break;
        }
        case "invoice.payment_succeeded":
        case "invoice.payment_failed": {
          const inv = obj as unknown as PayloadInvoice;
          const subRef = inv.subscription;
          const subId =
            typeof subRef === "string" ? subRef : subRef?.id ?? null;
          if (subId && subsPlanned.has(subId)) {
            notes.push(
              `Subscription ${subId} already planned for upsert by a sibling event in this batch.`,
            );
          } else if (subId) {
            notes.push(
              `Replay will call stripe.subscriptions.retrieve(${subId}) to upsert (live), not previewed here.`,
            );
          }
          if (evt.event_type === "invoice.payment_failed") {
            planned.push({
              table: "churn_lifecycle (via enter_churn_stage)",
              user_id: userId,
              stage: "at_risk",
              reason: "Invoice payment failed",
              source_event: evt.event_type,
            });
            notes.push(
              "Replay will also mint a renewal token and send 'renewal-payment-failed' email.",
            );
          }
          break;
        }
        default:
          notes.push(`No replay action for event type ${evt.event_type}.`);
      }

      rows.push({
        payment_event_id: evt.id,
        stripe_event_id: evt.stripe_event_id,
        event_type: evt.event_type,
        stripe_customer_id: customerId,
        stripe_subscription_id: evt.stripe_subscription_id,
        created_at: evt.created_at,
        resolved_user_id: userId,
        resolved_via: via,
        bd_member_id: bdId,
        would_succeed: true,
        skip_reason: null,
        planned_writes: planned,
        notes,
      });
    }

    return {
      generated_at: new Date().toISOString(),
      since,
      total_failed_events: rows.length,
      would_succeed: rows.filter((r) => r.would_succeed).length,
      would_still_fail: rows.filter((r) => !r.would_succeed).length,
      unique_users_recovered: [...recoveredUsers],
      unique_subscriptions_recovered: [...recoveredSubs],
      rows,
      caveats: DEFAULT_CAVEATS,
    };
  });

const DEFAULT_CAVEATS = [
  "No Stripe API calls were made. Subscription upsert rows are derived from the stored event payload only.",
  "No rows were written. No emails were sent. No Stripe customer metadata was updated.",
  "Step 5 (email → auth.users) is not previewed; in production every BD-renewed customer resolves at Step 4.",
  "Invoice events do not preview their own subscription upsert — the live handler refetches the sub from Stripe. The sibling 'customer.subscription.created' event already plans that upsert in the same batch.",
];

function buildSubscriptionUpsert(
  sub: PayloadSubscription,
  userId: string,
  fallbackCustomerId: string | null,
): PlannedSubscriptionUpsert | null {
  if (!sub?.id) return null;
  const customerId =
    typeof sub.customer === "string"
      ? sub.customer
      : sub.customer?.id ?? fallbackCustomerId;
  const item = sub.items?.data?.[0];
  const priceLookup = item?.price?.lookup_key ?? item?.price?.id ?? null;
  const lookup = priceLookup ? lookupTierByPriceId(priceLookup) : null;
  const isLiveStatus = ["active", "trialing", "past_due", "unpaid"].includes(
    sub.status,
  );
  return {
    table: "subscriptions",
    conflict: "user_id,environment",
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceLookup,
    tier: isLiveStatus && lookup ? lookup.tier : "free",
    billing_period: isLiveStatus && lookup ? lookup.period : null,
    status: sub.status,
    current_period_end: subIso(sub),
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    is_founding: lookup?.founding ?? false,
    migrated_from_bd: sub.metadata?.migrated_from === "bd",
    environment: sub.livemode ? "live" : "sandbox",
  };
}

// =============================================================================
// Step 4 — Live replay (idempotent writes)
// =============================================================================
//
// Re-processes failed payment_events end-to-end:
//   • Re-derives userId using the live resolver (incl. Step 4 legacy_stripe_link).
//   • Retrieves the fresh Stripe subscription (the live handler already does
//     this — we must too, so the upsert row matches what the live handler
//     would have written).
//   • Upserts `subscriptions` (idempotent on user_id+environment).
//   • Calls `enter_churn_stage` RPC (active / grace / at_risk).
//   • Clears processing_error / sets processed_at on payment_events.
//
// Idempotency:
//   • subscriptions upsert is keyed on (user_id, environment) — re-running
//     produces the same row.
//   • enter_churn_stage is itself idempotent (the RPC no-ops if already in
//     the target stage).
//   • payment_events row is only mutated to clear the error + record user_id.
//
// Deliberately out of scope (per plan acceptance):
//   • Outbound emails. The original failure window already ran (or didn't);
//     replay must not re-mint renewal tokens or fire dunning email duplicates.
//   • bd_member_seed.bd_next_due_date / legacy_stripe_link.last_paid_at —
//     the canonical Active Paying Member model already counts these members
//     once subscriptions rows exist. Forward billing cycles will advance
//     these fields naturally.
//   • Stripe customer metadata backfill — already wired into the LIVE
//     resolver (Step 2 fix), so the next legitimate event will set it.

import type Stripe from "stripe";
import type { StripeEnv } from "@/lib/billing/stripe.server";

export interface ReplayResultRow {
  payment_event_id: string;
  stripe_event_id: string | null;
  event_type: string;
  status: "ok" | "skipped" | "error";
  resolved_user_id: string | null;
  resolved_via: ResolverHit;
  subscription_upserted: string | null;
  churn_stage_set: "active" | "grace" | "at_risk" | null;
  error: string | null;
  notes: string[];
}

export interface ReplayResultDTO {
  generated_at: string;
  since: string;
  total_failed_events: number;
  ok: number;
  skipped: number;
  errored: number;
  rows: ReplayResultRow[];
}

const ReplayInput = z.object({
  since: z.string().datetime({ offset: true }).optional(),
  confirm: z.literal("REPLAY"),
});

export const replayWebhookFailures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ReplayInput>) => ReplayInput.parse(d))
  .handler(async ({ data, context }): Promise<ReplayResultDTO> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { createStripeClient } = await import("@/lib/billing/stripe.server");

    const since =
      data.since ?? new Date(Date.now() - 7 * 86_400_000).toISOString();

    const { data: events, error: eventsErr } = await supabaseAdmin
      .from("payment_events")
      .select(
        "id, stripe_event_id, event_type, stripe_customer_id, stripe_subscription_id, payload, created_at",
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
      created_at: string;
    }>;

    const results: ReplayResultRow[] = [];

    for (const evt of failed) {
      const row: ReplayResultRow = {
        payment_event_id: evt.id,
        stripe_event_id: evt.stripe_event_id,
        event_type: evt.event_type,
        status: "skipped",
        resolved_user_id: null,
        resolved_via: null,
        subscription_upserted: null,
        churn_stage_set: null,
        error: null,
        notes: [],
      };

      try {
        const payload = evt.payload as {
          livemode?: boolean;
          data?: { object?: Record<string, unknown> };
        };
        const obj = payload?.data?.object ?? {};
        const env: StripeEnv = payload?.livemode === false ? "sandbox" : "live";
        const meta =
          (obj.metadata as Record<string, string> | undefined) ?? {};
        const metaUserId = meta.reps_user_id ?? null;
        const customerId = evt.stripe_customer_id;

        // ---- Resolve user via live ladder (DB-only steps; admin-side) ----
        let userId: string | null = metaUserId;
        let via: ResolverHit = metaUserId ? "metadata_reps_user_id" : null;
        if (!userId && customerId) {
          const { data: subHit } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .limit(1)
            .maybeSingle();
          if (subHit?.user_id) {
            userId = subHit.user_id;
            via = "subscriptions_stripe_customer_id";
          }
        }
        if (!userId && customerId) {
          const { data: link } = await supabaseAdmin
            .from("legacy_stripe_link")
            .select("bd_member_id")
            .eq("stripe_customer_id", customerId)
            .limit(1)
            .maybeSingle();
          if (link?.bd_member_id) {
            const { data: seed } = await supabaseAdmin
              .from("bd_member_seed")
              .select("claimed_user_id")
              .eq("bd_member_id", link.bd_member_id)
              .limit(1)
              .maybeSingle();
            if (seed?.claimed_user_id) {
              userId = seed.claimed_user_id;
              via = "legacy_stripe_link";
            }
          }
        }
        row.resolved_user_id = userId;
        row.resolved_via = via;

        if (!userId) {
          row.status = "skipped";
          row.notes.push("Resolver returned null. Manual review required.");
          results.push(row);
          continue;
        }

        // ---- Re-process by event type -----------------------------------
        const stripe = createStripeClient(env);
        const isSubEvent =
          evt.event_type === "customer.subscription.created" ||
          evt.event_type === "customer.subscription.updated" ||
          evt.event_type === "customer.subscription.deleted";
        const isInvoiceEvent =
          evt.event_type === "invoice.payment_succeeded" ||
          evt.event_type === "invoice.payment_failed";

        let liveSub: Stripe.Subscription | null = null;
        if (isSubEvent) {
          // Refetch (it's cheap and matches what the live handler does)
          const subFromPayload = obj as { id?: string };
          if (subFromPayload.id) {
            liveSub = await stripe.subscriptions.retrieve(subFromPayload.id);
          }
        } else if (isInvoiceEvent) {
          const inv = obj as {
            subscription?: string | { id: string } | null;
          };
          const subRef = inv.subscription;
          const subId =
            typeof subRef === "string" ? subRef : subRef?.id ?? null;
          if (subId) liveSub = await stripe.subscriptions.retrieve(subId);
        }

        if (liveSub) {
          // ---- Upsert subscriptions row (mirrors upsertSubscriptionFromStripe) -
          const subCustomerId =
            typeof liveSub.customer === "string"
              ? liveSub.customer
              : liveSub.customer.id;
          const item = liveSub.items.data[0];
          const priceLookup =
            item?.price.lookup_key ?? item?.price.id ?? null;
          const lookup = priceLookup
            ? lookupTierByPriceId(priceLookup)
            : null;
          const isLiveStatus = [
            "active",
            "trialing",
            "past_due",
            "unpaid",
          ].includes(liveSub.status);
          const cpe =
            (liveSub as unknown as { current_period_end?: number })
              .current_period_end ??
            item?.current_period_end ??
            null;

          const upsertRow = {
            user_id: userId,
            stripe_customer_id: subCustomerId,
            stripe_subscription_id: liveSub.id,
            stripe_price_id: priceLookup,
            tier: isLiveStatus && lookup ? lookup.tier : "free",
            billing_period: isLiveStatus && lookup ? lookup.period : null,
            status: liveSub.status,
            current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
            cancel_at_period_end: liveSub.cancel_at_period_end ?? false,
            is_founding: lookup?.founding ?? false,
            migrated_from_bd: liveSub.metadata?.migrated_from === "bd",
            metadata: liveSub.metadata as unknown as object,
            environment: env,
            updated_at: new Date().toISOString(),
          };
          const { error: upErr } = await supabaseAdmin
            .from("subscriptions")
            .upsert(upsertRow as never, {
              onConflict: "user_id,environment",
            });
          if (upErr) throw new Error(`subscriptions upsert: ${upErr.message}`);
          row.subscription_upserted = liveSub.id;

          // ---- Churn lifecycle -----------------------------------------
          if (evt.event_type === "customer.subscription.deleted") {
            const { error: csErr } = await supabaseAdmin.rpc(
              "enter_churn_stage" as never,
              {
                _user_id: userId,
                _stage: "grace",
                _reason: "Stripe subscription deleted (replay)",
                _source_event: evt.event_type,
                _metadata: { subscription_id: liveSub.id, replay: true },
              } as never,
            );
            if (csErr) row.notes.push(`churn(grace): ${csErr.message}`);
            else row.churn_stage_set = "grace";
          } else if (
            liveSub.status === "active" ||
            liveSub.status === "trialing"
          ) {
            const { error: csErr } = await supabaseAdmin.rpc(
              "enter_churn_stage" as never,
              {
                _user_id: userId,
                _stage: "active",
                _reason: "Active subscription (replay)",
                _source_event: evt.event_type,
              } as never,
            );
            if (csErr) row.notes.push(`churn(active): ${csErr.message}`);
            else row.churn_stage_set = "active";
          }
          if (evt.event_type === "invoice.payment_failed") {
            const { error: csErr } = await supabaseAdmin.rpc(
              "enter_churn_stage" as never,
              {
                _user_id: userId,
                _stage: "at_risk",
                _reason: "Invoice payment failed (replay)",
                _source_event: evt.event_type,
                _metadata: { replay: true },
              } as never,
            );
            if (csErr) row.notes.push(`churn(at_risk): ${csErr.message}`);
            else row.churn_stage_set = "at_risk";
            row.notes.push(
              "Replay does NOT re-send the dunning email (would duplicate the original failure-window send).",
            );
          }
        } else {
          row.notes.push(
            `No subscription to upsert (event type ${evt.event_type}).`,
          );
        }

        // ---- Clear payment_events error ------------------------------------
        const { error: clrErr } = await supabaseAdmin
          .from("payment_events")
          .update({
            user_id: userId,
            processed_at: new Date().toISOString(),
            processing_error: null,
          } as never)
          .eq("id", evt.id);
        if (clrErr) throw new Error(`payment_events clear: ${clrErr.message}`);

        row.status = "ok";
      } catch (err) {
        row.status = "error";
        row.error = err instanceof Error ? err.message : String(err);
      }

      results.push(row);
    }

    return {
      generated_at: new Date().toISOString(),
      since,
      total_failed_events: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errored: results.filter((r) => r.status === "error").length,
      rows: results,
    };
  });

