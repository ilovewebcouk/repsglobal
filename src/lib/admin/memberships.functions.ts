// Admin server fns for /admin/memberships.
// Read-only — local synced database state only. No Stripe API calls.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type Tier,
  type BillingEnv,
  TIER_CADENCE_MONTHS,
  TIER_PRICE_PENCE,
  annualPence,
  paymentPence,
  currentBillingEnv,
  londonMonthKey,
  addMonths,
  quarterFor,
  daysFromNow,
  isPaidTier,
} from "./billing-metrics";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const LIVE_STATUSES = new Set(["active", "trialing"]);
const PAST_DUE_STATUSES = new Set(["past_due", "unpaid", "payment_required"]);

// ============================================================================
// getMembershipMetrics — KPIs, tier counts, plan distribution, past-due, etc.
// ============================================================================

export type TierBreakdown = {
  tier: Tier;
  active: number;
  trialing: number;
  scheduled: number; // Verified-only: migrated members with no Stripe sub yet
};

export type PaymentListItem = {
  name: string;
  email: string | null;
  tier: Tier;
  dueAt: string | null;
  amountPence: number;
  source: "stripe" | "scheduled";
};

export type PastDueItem = {
  name: string;
  email: string | null;
  tier: Tier;
  status: string;
  amountPence: number;
};

export type MembershipMetrics = {
  env: BillingEnv;
  forecastArrPence: number;
  activeArrPence: number;
  scheduledArrPence: number;
  upcoming14dPence: number;
  upcoming14dCount: number;
  upcomingItems: PaymentListItem[];
  verifiedActive: number;
  verifiedScheduled: number;
  pastDueCount: number;
  pastDueItems: PastDueItem[];
  tiers: TierBreakdown[];
  distribution: { label: string; count: number; tone: "verified" | "scheduled" | "pro" | "studio" }[];
  diagnostics: {
    nonGbpExcluded: number;
    lifetimeMembers: number;
    activeSubsTotal: number;
    legacyLinkScheduled: number;
    bdSeedFallbackScheduled: number;
  };
};

export const getMembershipMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MembershipMetrics> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const env = currentBillingEnv();
    const now = new Date();
    const in14d = daysFromNow(14, now);

    // 1. Active/trialing subscriptions in the current env, paid tiers only.
    const { data: subsRaw } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, tier, status, current_period_end, environment")
      .eq("environment", env);

    const subs = (subsRaw ?? []) as Array<{
      user_id: string;
      tier: string;
      status: string;
      current_period_end: string | null;
    }>;

    const live = subs.filter((s) => LIVE_STATUSES.has(s.status) && isPaidTier(s.tier));
    const pastDue = subs.filter((s) => PAST_DUE_STATUSES.has(s.status));

    let activeArr = 0;
    const tierMap: Record<Tier, { active: number; trialing: number }> = {
      verified: { active: 0, trialing: 0 },
      pro: { active: 0, trialing: 0 },
      studio: { active: 0, trialing: 0 },
    };
    for (const s of live) {
      const t = s.tier as Tier;
      activeArr += annualPence(t);
      if (s.status === "trialing") tierMap[t].trialing += 1;
      else tierMap[t].active += 1;
    }

    // Set of user_ids already covered by a live Stripe sub — don't double-count
    // them as "scheduled Verified" if they also appear in legacy_stripe_link.
    const liveUserIds = new Set(live.map((s) => s.user_id));

    // 2. Verified scheduled members (migrated, no live Stripe sub yet).
    //    Source: legacy_stripe_link.next_due_at (primary), bd_member_seed.bd_next_due_date (fallback).
    const { data: legacyLinks } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select("bd_member_id, email, next_due_at, is_lifetime")
      .eq("is_lifetime", false);

    const { data: bdSeeds } = await supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id, email, bd_next_due_date, claim_status, claimed_user_id");

    const bdSeedByMember = new Map<number, any>();
    for (const row of (bdSeeds ?? []) as any[]) {
      bdSeedByMember.set(row.bd_member_id, row);
    }

    // Build the scheduled list. Each row is one upcoming £99 payment.
    type ScheduledRow = {
      memberId: number;
      email: string;
      dueAt: Date;
      source: "legacy_link" | "bd_seed";
      userId: string | null;
    };
    const scheduled: ScheduledRow[] = [];
    const legacyMemberIds = new Set<number>();

    for (const link of (legacyLinks ?? []) as any[]) {
      legacyMemberIds.add(link.bd_member_id);
      if (!link.next_due_at) continue;
      const seed = bdSeedByMember.get(link.bd_member_id);
      const claimedUserId: string | null = seed?.claimed_user_id ?? null;
      if (claimedUserId && liveUserIds.has(claimedUserId)) continue;
      scheduled.push({
        memberId: link.bd_member_id,
        email: link.email,
        dueAt: new Date(link.next_due_at),
        source: "legacy_link",
        userId: claimedUserId,
      });
    }

    let bdFallbackCount = 0;
    for (const seed of (bdSeeds ?? []) as any[]) {
      if (legacyMemberIds.has(seed.bd_member_id)) continue;
      if (!seed.bd_next_due_date) continue;
      const claimedUserId: string | null = seed.claimed_user_id ?? null;
      if (claimedUserId && liveUserIds.has(claimedUserId)) continue;
      scheduled.push({
        memberId: seed.bd_member_id,
        email: seed.email,
        dueAt: new Date(seed.bd_next_due_date as string),
        source: "bd_seed",
        userId: claimedUserId,
      });
      bdFallbackCount += 1;
    }

    const verifiedScheduledCount = scheduled.length;
    const scheduledArr = verifiedScheduledCount * TIER_PRICE_PENCE.verified;

    // 3. Upcoming payments (14d): live sub renewals + scheduled Verified due.
    let upcomingPence = 0;
    let upcomingCount = 0;
    for (const s of live) {
      if (!s.current_period_end) continue;
      const due = new Date(s.current_period_end);
      if (due >= now && due <= in14d) {
        upcomingPence += paymentPence(s.tier);
        upcomingCount += 1;
      }
    }
    for (const r of scheduled) {
      if (r.dueAt >= now && r.dueAt <= in14d) {
        upcomingPence += TIER_PRICE_PENCE.verified;
        upcomingCount += 1;
      }
    }

    // 4. Lifetime members (excluded from forecast but kept in Verified count).
    const lifetimeMembers = ((legacyLinks ?? []) as any[]).length
      ? (await supabaseAdmin
          .from("legacy_stripe_link")
          .select("bd_member_id", { count: "exact", head: true })
          .eq("is_lifetime", true)
          .then((r) => r.count ?? 0))
      : 0;

    const verifiedActive = tierMap.verified.active + tierMap.verified.trialing;
    const verifiedTotal = verifiedActive + verifiedScheduledCount + lifetimeMembers;

    const distribution = [
      { label: "Verified", count: verifiedActive + verifiedScheduledCount, tone: "verified" as const },
      { label: "Pro", count: tierMap.pro.active + tierMap.pro.trialing, tone: "pro" as const },
      { label: "Studio", count: tierMap.studio.active + tierMap.studio.trialing, tone: "studio" as const },
    ].filter((d) => d.count > 0);


    return {
      env,
      forecastArrPence: activeArr + scheduledArr,
      activeArrPence: activeArr,
      scheduledArrPence: scheduledArr,
      upcoming14dPence: upcomingPence,
      upcoming14dCount: upcomingCount,
      verifiedActive,
      verifiedScheduled: verifiedScheduledCount,
      pastDueCount: pastDue.length,
      tiers: [
        { tier: "verified", ...tierMap.verified, scheduled: verifiedScheduledCount },
        { tier: "pro", ...tierMap.pro, scheduled: 0 },
        { tier: "studio", ...tierMap.studio, scheduled: 0 },
      ],
      distribution,
      diagnostics: {
        nonGbpExcluded: 0, // subscriptions table has no currency column; all GBP by spec
        lifetimeMembers,
        activeSubsTotal: live.length,
        legacyLinkScheduled: ((legacyLinks ?? []) as any[]).filter((l) => l.next_due_at).length,
        bdSeedFallbackScheduled: bdFallbackCount,
      },
    };
  });

// ============================================================================
// getRevenueForecast — 24-month projected cash flow + summary tiles
// ============================================================================

export type ForecastMonth = {
  monthKey: string; // "YYYY-MM"
  verifiedPence: number;
  proPence: number;
  studioPence: number;
  totalPence: number;
};


export type ForecastQuarter = {
  label: string;
  totalPence: number;
  months: string[];
};

export type RevenueForecast = {
  env: BillingEnv;
  months: ForecastMonth[];
  quarters: ForecastQuarter[];
  yearOneTotalPence: number;
  yearTwoTotalPence: number;
  currentMonthPence: number;
  next14dPence: number;
};

const FORECAST_MONTHS = 24;

export const getRevenueForecast = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RevenueForecast> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const env = currentBillingEnv();
    const now = new Date();
    const in14d = daysFromNow(14, now);
    const startKey = londonMonthKey(now);

    // Build month-key buckets.
    const monthKeys: string[] = [];
    for (let i = 0; i < FORECAST_MONTHS; i++) monthKeys.push(addMonths(startKey, i));

    const buckets = new Map<string, ForecastMonth>();
    for (const k of monthKeys) {
      buckets.set(k, {
        monthKey: k,
        verifiedPence: 0,
        proPence: 0,
        studioPence: 0,
        totalPence: 0,
      });
    }
    const horizonEnd = new Date(now.getTime() + FORECAST_MONTHS * 31 * 86400 * 1000);

    let currentMonthPence = 0;
    let next14dPence = 0;

    function applyPayment(at: Date, amount: number, lane: "verified" | "pro" | "studio") {
      const key = londonMonthKey(at);
      const bucket = buckets.get(key);
      if (!bucket) return;
      if (lane === "verified") bucket.verifiedPence += amount;
      else if (lane === "pro") bucket.proPence += amount;
      else bucket.studioPence += amount;
      bucket.totalPence += amount;
      if (key === startKey) currentMonthPence += amount;
      if (at >= now && at <= in14d) next14dPence += amount;
    }


    // 1. Project active/trialing Stripe subs forward.
    const { data: subsRaw } = await supabaseAdmin
      .from("subscriptions")
      .select("tier, status, current_period_end, environment")
      .eq("environment", env);

    for (const s of (subsRaw ?? []) as any[]) {
      if (!LIVE_STATUSES.has(s.status)) continue;
      if (!isPaidTier(s.tier)) continue;
      if (!s.current_period_end) continue;
      const tier = s.tier as Tier;
      const cadence = TIER_CADENCE_MONTHS[tier];
      const amount = paymentPence(tier);
      let due = new Date(s.current_period_end);
      // Walk forward through the 24-month horizon.
      while (due <= horizonEnd) {
        if (due >= now) applyPayment(due, amount, tier);
        // Advance by cadence months.
        const d = new Date(due);
        d.setUTCMonth(d.getUTCMonth() + cadence);
        due = d;
      }
    }

    // 2. Project scheduled Verified payments (legacy_stripe_link + bd_seed fallback).
    const { data: legacyLinks } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select("bd_member_id, next_due_at, is_lifetime")
      .eq("is_lifetime", false);

    const { data: bdSeeds } = await supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id, bd_next_due_date, claimed_user_id");

    const liveUserIds = new Set<string>(
      ((subsRaw ?? []) as any[])
        .filter((s) => LIVE_STATUSES.has(s.status))
        .map((s) => s.user_id),
    );

    const bdSeedByMember = new Map<number, any>();
    for (const r of (bdSeeds ?? []) as any[]) bdSeedByMember.set(r.bd_member_id, r);
    const legacyMemberIds = new Set<number>();

    function projectVerifiedRenewals(firstDue: Date, claimedUserId: string | null) {
      if (claimedUserId && liveUserIds.has(claimedUserId)) return;
      let due = new Date(firstDue);
      while (due <= horizonEnd) {
        if (due >= now) applyPayment(due, TIER_PRICE_PENCE.verified, "verified");
        const d = new Date(due);
        d.setUTCFullYear(d.getUTCFullYear() + 1);
        due = d;
      }
    }


    for (const link of (legacyLinks ?? []) as any[]) {
      legacyMemberIds.add(link.bd_member_id);
      if (!link.next_due_at) continue;
      const seed = bdSeedByMember.get(link.bd_member_id);
      projectVerifiedRenewals(new Date(link.next_due_at), seed?.claimed_user_id ?? null);
    }
    for (const seed of (bdSeeds ?? []) as any[]) {
      if (legacyMemberIds.has(seed.bd_member_id)) continue;
      if (!seed.bd_next_due_date) continue;
      projectVerifiedRenewals(new Date(seed.bd_next_due_date as string), seed.claimed_user_id ?? null);
    }

    const months = monthKeys.map((k) => buckets.get(k)!);

    // Quarterly totals.
    const qMap = new Map<string, ForecastQuarter>();
    for (const m of months) {
      const q = quarterFor(m.monthKey);
      const key = `${q.year}-Q${q.quarter}`;
      const cur = qMap.get(key) ?? { label: q.label, totalPence: 0, months: [] };
      cur.totalPence += m.totalPence;
      cur.months.push(m.monthKey);
      qMap.set(key, cur);
    }

    const yearOneTotal = months.slice(0, 12).reduce((s, m) => s + m.totalPence, 0);
    const yearTwoTotal = months.slice(12, 24).reduce((s, m) => s + m.totalPence, 0);

    return {
      env,
      months,
      quarters: [...qMap.values()],
      yearOneTotalPence: yearOneTotal,
      yearTwoTotalPence: yearTwoTotal,
      currentMonthPence,
      next14dPence,
    };
  });

// ============================================================================
// getMembershipActivity — real payment_events only; empty state otherwise
// ============================================================================

export type MembershipActivityRow = {
  id: string;
  eventType: string;
  createdAt: string;
  userId: string | null;
  fullName: string | null;
  summary: string;
  deltaPence: number | null;
};

const EVENT_MAP: Record<string, { summary: string; sign: 1 | -1 | 0 }> = {
  "customer.subscription.created": { summary: "Subscription started", sign: 1 },
  "customer.subscription.updated": { summary: "Subscription updated", sign: 0 },
  "customer.subscription.deleted": { summary: "Subscription cancelled", sign: -1 },
  "invoice.paid": { summary: "Invoice paid", sign: 1 },
  "invoice.payment_failed": { summary: "Payment failed", sign: 0 },
  "checkout.session.completed": { summary: "Checkout completed", sign: 1 },
};

export const getMembershipActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MembershipActivityRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const { data: events } = await supabaseAdmin
      .from("payment_events")
      .select("id, event_type, created_at, user_id")
      .in("event_type", Object.keys(EVENT_MAP))
      .order("created_at", { ascending: false })
      .limit(10);

    const rows = (events ?? []) as any[];
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
    let nameMap = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      for (const p of (profiles ?? []) as any[]) nameMap.set(p.id, p.full_name);
    }

    return rows.map((r) => {
      const meta = EVENT_MAP[r.event_type] ?? { summary: r.event_type, sign: 0 };
      return {
        id: r.id,
        eventType: r.event_type,
        createdAt: r.created_at,
        userId: r.user_id,
        fullName: r.user_id ? nameMap.get(r.user_id) ?? null : null,
        summary: meta.summary,
        deltaPence: null,
      };
    });
  });
