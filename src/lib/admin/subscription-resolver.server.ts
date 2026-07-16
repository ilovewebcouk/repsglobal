// Admin — Subscription resolver (Member 360).
//
// Thin adapter over the SHARED `member-billing-row.server.ts` compute. The
// Professionals list and Member 360 BOTH compute through that helper, so
// pricing / renewal / trial / tier readouts cannot diverge between the two
// surfaces. This file exists to expose the result in the
// `AdminSubscriptionState` shape that Member 360 + billing actions already
// consume — it intentionally does NOT add new logic.
//
// Server-only. Never import from client code.

import { TIERS, ORG_TIERS, type TierKey } from "@/lib/billing";
import {
  fetchMemberBillingRow,
  type MemberBillingRow,
  type MemberBillingPlan,
} from "@/lib/admin/member-billing-row.server";

export type AdminSubscriptionSource = "shared-compute" | "none";
export type AdminSubscriptionDiscrepancy = never;

// Widened tier for admin display. `training_provider` sits alongside the
// individual TierKeys so Member 360 can render provider subs with the
// correct label without inflating the checkout catalogue.
export type AdminTierKey = TierKey | "training_provider";

export interface AdminSubscriptionState {
  user_id: string;
  source: AdminSubscriptionSource;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string | null;
  tier: AdminTierKey | null;
  tier_label: string | null;
  renewal_at: string | null;
  is_scheduled_renewal: boolean;
  cancel_at_period_end: boolean;
  price_id: string | null;
  price_lookup_key: string | null;
  unit_amount_pence: number | null;
  currency: string | null;
  interval: string | null;
  trial_days_left: number | null;
  has_active_entitlement: boolean;
  display_status_label: string;
  display_renewal_label: string | null;
  discrepancies: AdminSubscriptionDiscrepancy[];
  fallback_reason: string | null;
}

// Catalogue prices used so the Billing tab shows the published REPs price
// even when we have no row to read from. Mirror of src/lib/billing.ts.
const TIER_CATALOGUE_PRICE: Record<AdminTierKey, { unit_amount_pence: number; currency: string; interval: string } | null> = {
  verified: { unit_amount_pence: 3400, currency: "gbp", interval: "year" },
  pro: { unit_amount_pence: 5900, currency: "gbp", interval: "month" },
  studio: { unit_amount_pence: 14900, currency: "gbp", interval: "month" },
  training_provider: {
    unit_amount_pence: ORG_TIERS.training_provider.amountPence,
    currency: "gbp",
    interval: "year",
  },
};

function planToTierKey(plan: MemberBillingPlan): AdminTierKey | null {
  if (plan === "verified" || plan === "pro" || plan === "studio") return plan;
  if (plan === "training_provider") return "training_provider";
  return null;
}

export function tierLabel(tier: AdminTierKey | null): string | null {
  if (!tier) return null;
  if (tier === "training_provider") return ORG_TIERS.training_provider.label;
  return TIERS[tier]?.label ?? null;
}


function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildDisplayStatus(
  row: MemberBillingRow,
  tierLbl: string | null,
): string {
  const t = tierLbl ?? "Subscription";
  if (row.plan === "free") return "No active subscription";
  if (row.isTrial) return `Scheduled ${t} renewal`;
  if (row.billingState === "payment_failed") return `${t} — past due`;
  if (row.billingState === "renewal_due") return `${t} — renewal due`;
  if (row.cancelAtPeriodEnd) return `${t} — cancelling`;
  return `${t} — active`;
}

/**
 * Map a `MemberBillingRow` (canonical shared compute) → `AdminSubscriptionState`
 * for the Member 360 / Billing-tab UI.
 */
export function adaptBillingRowToState(row: MemberBillingRow): AdminSubscriptionState {
  const tier = planToTierKey(row.plan);
  const lbl = tierLabel(tier);
  const catalogue = tier ? TIER_CATALOGUE_PRICE[tier] : null;

  if (row.plan === "free") {
    return {
      user_id: row.user_id,
      source: "none",
      stripe_subscription_id: null,
      stripe_customer_id: null,
      status: null,
      tier: null,
      tier_label: null,
      renewal_at: row.renewalDate,
      is_scheduled_renewal: false,
      cancel_at_period_end: false,
      price_id: null,
      price_lookup_key: null,
      unit_amount_pence: null,
      currency: null,
      interval: null,
      trial_days_left: null,
      has_active_entitlement: false,
      display_status_label: "No active subscription",
      display_renewal_label: row.renewalDate ? `Renews ${fmtDate(row.renewalDate)}` : null,
      discrepancies: [],
      fallback_reason: null,
    };
  }

  // Derive a UI status that mirrors what the list shows.
  const status: string =
    row.isTrial ? "trialing"
    : row.billingState === "payment_failed" ? "past_due"
    : row.billingState === "renewal_due" ? "past_due"
    : "active";

  return {
    user_id: row.user_id,
    source: "shared-compute",
    stripe_subscription_id: row.stripeSubscriptionId,
    stripe_customer_id: row.stripeCustomerId,
    status,
    tier,
    tier_label: lbl,
    renewal_at: row.renewalDate,
    is_scheduled_renewal: row.isTrial,
    cancel_at_period_end: row.cancelAtPeriodEnd,
    price_id: null,
    price_lookup_key: null,
    unit_amount_pence: catalogue?.unit_amount_pence ?? null,
    currency: catalogue?.currency ?? null,
    interval: catalogue?.interval ?? null,
    trial_days_left: row.trialDaysLeft,
    has_active_entitlement: row.hasActiveEntitlement,
    display_status_label: buildDisplayStatus(row, lbl),
    display_renewal_label: row.renewalDate ? `Renews ${fmtDate(row.renewalDate)}` : null,
    discrepancies: [],
    fallback_reason: null,
  };
}

/** Resolve one user's subscription state via the shared compute, augmented
 *  with LIVE Stripe price/amount/interval truth via the Stripe mirror. */
export async function resolveSubscriptionStateForUser(
  userId: string,
): Promise<AdminSubscriptionState> {
  const row = await fetchMemberBillingRow(userId);
  const state = adaptBillingRowToState(row);

  // Live-augment price details from Stripe so M360 surfaces the real
  // price_id / lookup_key / unit_amount even when the DB mirror still holds
  // a legacy alias like "verified_annual".
  if (state.stripe_subscription_id) {
    try {
      const { getMirrorSubscription } = await import("@/lib/billing/stripe-mirror.server");
      const mirror = await getMirrorSubscription(state.stripe_subscription_id, "live");
      if (mirror) {
        state.price_id = mirror.price_id;
        state.price_lookup_key = mirror.price_lookup_key;
        if (mirror.unit_amount_pence !== null) state.unit_amount_pence = mirror.unit_amount_pence;
        if (mirror.currency) state.currency = mirror.currency;
        if (mirror.interval) state.interval = mirror.interval;
        state.cancel_at_period_end = mirror.cancel_at_period_end;
      }
    } catch {
      // Stripe unreachable — fall back to catalogue values already on state.
    }
  }
  return state;
}

/** Bulk variant. */
export async function resolveSubscriptionStatesForUsers(
  userIds: string[],
): Promise<Map<string, AdminSubscriptionState>> {
  const out = new Map<string, AdminSubscriptionState>();
  await Promise.all(
    userIds.map(async (id) => {
      try {
        out.set(id, await resolveSubscriptionStateForUser(id));
      } catch {
        out.set(id, adaptBillingRowToState({
          user_id: id,
          plan: "free",
          planMrrPence: 0,
          billingState: "ok",
          renewalDate: null,
          renewalDateSource: null,
          isTrial: false,
          trialDaysLeft: null,
          hasActiveEntitlement: false,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          stripeStatus: null,
          cancelAtPeriodEnd: false,
        }));
      }
    }),
  );
  return out;
}
