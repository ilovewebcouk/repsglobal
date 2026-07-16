// Admin — Member billing-row (SHARED).
//
// SINGLE SOURCE OF TRUTH for the per-member pricing/renewal/trial fields that
// the Professionals list AND the Member 360 workbench both display. Both
// surfaces compute through `computeMemberBillingRow` so they cannot diverge.
//
// Inputs come from the same Supabase tables and the canonical Active Paying
// Member collection used elsewhere in admin. No Stripe live API call — the
// list-page logic deliberately uses local mirror state to stay fast and
// consistent; Member 360 follows the same rule.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type MemberBillingPlan = "free" | "verified" | "pro" | "studio" | "training_provider";
export type MemberBillingState = "ok" | "payment_failed" | "renewal_due";

// MRR pence by tier — must match `planMrrPence` in professionals.functions.ts.
// Training providers are admin-invited comp/trial seats and don't count toward MRR.
const PLAN_MRR_PENCE: Record<MemberBillingPlan, number> = {
  free: 0,
  verified: Math.round(3400 / 12), // £34/yr ÷ 12
  pro: 5900,
  studio: 14900,
  training_provider: 0,
};

const PLAN_RANK: Record<MemberBillingPlan, number> = {
  studio: 4,
  pro: 3,
  training_provider: 2, // ranked alongside verified so it wins over "free"
  verified: 2,
  free: 1,
};

const FAILED_STRIPE_STATUSES = new Set([
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);
// COUNTED_TIERS drives the Active Paying Member collection. Providers are
// intentionally excluded so revenue/MRR metrics stay clean.
const COUNTED_TIERS = new Set<MemberBillingPlan>(["verified", "pro", "studio"]);
const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);
const RENEWAL_DUE_GRACE_DAYS = 7;


export type SubscriptionRowLite = {
  user_id: string;
  tier: string;
  status: string;
  created_at: string;
  current_period_end: string | null;
  billing_period: string | null;
};

export type MemberBillingRowInput = {
  user_id: string;
  /** All subscription rows for this user (live environment). */
  subs: SubscriptionRowLite[];
  /** BD-seed next due date for this user (when present). */
  bdNextDueIso: string | null;
  /** Canonical Active Paying Member tier (when this user appears in the APM collection). */
  activePaidTier: MemberBillingPlan | null;
};

export type MemberBillingRow = {
  user_id: string;
  plan: MemberBillingPlan;
  planMrrPence: number;
  billingState: MemberBillingState;
  renewalDate: string | null;
  renewalDateSource: "stripe" | "bd" | null;
  isTrial: boolean;
  trialDaysLeft: number | null;
  /** True when the resolved plan grants an active entitlement right now. */
  hasActiveEntitlement: boolean;
  /** Stripe sub id for the row driving renewalDate (when source = "stripe"). */
  stripeSubscriptionId: string | null;
  /** Stripe customer id for the row driving renewalDate (when present). */
  stripeCustomerId: string | null;
  /** Status of the row driving renewalDate (when source = "stripe"). */
  stripeStatus: string | null;
  /** cancel_at_period_end of the row driving renewalDate (when present). */
  cancelAtPeriodEnd: boolean;
};

function normaliseTier(t: string | null | undefined): MemberBillingPlan | null {
  if (!t) return null;
  const k = t.toLowerCase();
  if (
    k === "verified" ||
    k === "pro" ||
    k === "studio" ||
    k === "free" ||
    k === "training_provider"
  ) {
    return k as MemberBillingPlan;
  }
  return null;
}


function trialDaysLeftFor(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/**
 * Pure compute. Given the same inputs the Professionals list batches,
 * produces the same canonical row. Used by both surfaces.
 */
export function computeMemberBillingRow(input: MemberBillingRowInput): MemberBillingRow {
  const { user_id, subs, bdNextDueIso, activePaidTier } = input;

  // ─── Entitlement / renewal source (matches professionals.functions.ts `subDetailMap`) ──
  // First entitled (active|trialing|past_due) sub wins as the renewal-driver.
  const subDetail =
    subs.find((s) => ENTITLED_STATUSES.has(s.status)) ?? null;

  // ─── Failed-sub tier (matches professionals.functions.ts `failedSubTier`) ──
  // Only counts when no concurrently-active paid record exists.
  let failedTier: MemberBillingPlan | null = null;
  if (!activePaidTier) {
    for (const s of subs) {
      if (!FAILED_STRIPE_STATUSES.has(s.status)) continue;
      const t = normaliseTier(s.tier);
      if (!t || !COUNTED_TIERS.has(t)) continue;
      if (!failedTier || PLAN_RANK[t] > PLAN_RANK[failedTier]) {
        failedTier = t;
      }
    }
  }

  // ─── BD renewal-due window ───
  let renewalDue = false;
  if (!activePaidTier && !failedTier && bdNextDueIso) {
    const dueMs = new Date(bdNextDueIso).getTime();
    const nowMs = Date.now();
    if (
      Number.isFinite(dueMs) &&
      dueMs <= nowMs &&
      nowMs - dueMs <= RENEWAL_DUE_GRACE_DAYS * 86_400_000
    ) {
      renewalDue = true;
    }
  }

  // ─── Training-provider entitlement (not counted in APM, but still active) ───
  // Providers are admin-invited and don't appear in the Active Paying Member
  // collection, so `activePaidTier` is null even when they have a live trialing
  // Stripe sub. Detect them directly from the entitled sub row.
  const providerTier: MemberBillingPlan | null =
    subDetail && normaliseTier(subDetail.tier) === "training_provider"
      ? "training_provider"
      : null;

  // ─── Plan + billing state (same precedence as the list) ───
  const billingState: MemberBillingState = activePaidTier || providerTier
    ? "ok"
    : failedTier
      ? "payment_failed"
      : renewalDue
        ? "renewal_due"
        : "ok";

  const plan: MemberBillingPlan =
    activePaidTier ?? providerTier ?? failedTier ?? (renewalDue ? "verified" : "free");


  // ─── Renewal date + source (identical formula to list) ───
  const renewalDate = subDetail?.current_period_end ?? bdNextDueIso ?? null;
  const renewalDateSource: "stripe" | "bd" | null = subDetail?.current_period_end
    ? "stripe"
    : bdNextDueIso
      ? "bd"
      : null;

  const isTrial = subDetail?.status === "trialing";
  const trialDaysLeft =
    isTrial && subDetail?.current_period_end
      ? trialDaysLeftFor(subDetail.current_period_end)
      : null;

  return {
    user_id,
    plan,
    planMrrPence: PLAN_MRR_PENCE[plan],
    billingState,
    renewalDate,
    renewalDateSource,
    isTrial,
    trialDaysLeft,
    hasActiveEntitlement: plan !== "free",
    stripeSubscriptionId: null, // not modelled in SubscriptionRowLite; resolver augments
    stripeCustomerId: null, // not modelled in SubscriptionRowLite; resolver augments
    stripeStatus: subDetail?.status ?? null,
    cancelAtPeriodEnd: false, // not modelled in SubscriptionRowLite; resolver augments
  };
}

/**
 * Per-user fetch. Builds exactly the same input shape the list batches and
 * delegates to `computeMemberBillingRow`. Member 360 calls this.
 */
export async function fetchMemberBillingRow(
  userId: string,
  client?: SupabaseClient<Database>,
): Promise<MemberBillingRow> {
  const supabaseAdmin =
    client ??
    (await import("@/integrations/supabase/client.server")).supabaseAdmin;
  const { fetchActivePayingMemberCollection } = await import(
    "@/lib/members/active-paying-member.server"
  );

  const [subsRes, bdRes, apm] = await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .select(
        "user_id, tier, status, created_at, current_period_end, billing_period, stripe_subscription_id, stripe_customer_id, cancel_at_period_end, environment",
      )
      .eq("user_id", userId)
      .eq("environment", "live"),
    supabaseAdmin
      .from("bd_member_seed")
      .select("claimed_user_id, bd_next_due_date")
      .eq("claimed_user_id", userId)
      .not("bd_next_due_date", "is", null)
      .maybeSingle(),
    fetchActivePayingMemberCollection(supabaseAdmin),
  ]);

  const rawSubs = (subsRes.data ?? []) as Array<
    SubscriptionRowLite & {
      stripe_subscription_id: string | null;
      stripe_customer_id: string | null;
      cancel_at_period_end: boolean | null;
    }
  >;
  const subs: SubscriptionRowLite[] = rawSubs.map((s) => ({
    user_id: s.user_id,
    tier: s.tier,
    status: s.status,
    created_at: s.created_at,
    current_period_end: s.current_period_end,
    billing_period: s.billing_period,
  }));

  const bdNextDueIso =
    (bdRes.data as { bd_next_due_date: string | null } | null)?.bd_next_due_date ?? null;

  const apmMember = apm.members.find((m) => m.user_id === userId);
  const activePaidTier = (apmMember?.tier as MemberBillingPlan | undefined) ?? null;

  const row = computeMemberBillingRow({
    user_id: userId,
    subs,
    bdNextDueIso,
    activePaidTier,
  });

  // Augment Stripe-specific fields from the same entitled row the compute picked.
  // Fall back to any sub row for customer id so we still surface it for cancelled members.
  const driver = rawSubs.find((s) => ENTITLED_STATUSES.has(s.status)) ?? null;
  if (driver) {
    row.stripeSubscriptionId = driver.stripe_subscription_id ?? null;
    row.cancelAtPeriodEnd = !!driver.cancel_at_period_end;
  }
  const anyWithCustomer = rawSubs.find((s) => !!s.stripe_customer_id) ?? null;
  row.stripeCustomerId =
    driver?.stripe_customer_id ?? anyWithCustomer?.stripe_customer_id ?? null;
  return row;
}
