// Admin server fns for /admin/memberships.
// Read-only — local synced database state only. No Stripe API calls.
//
// SOURCE OF TRUTH for pre-launch billing forecasts and the launch-day
// charges card: `bd_member_seed.migration_cohort_override` (the locked V7
// dry-run in docs/10_phase2_migration_dry_run_v7_approved.md). On launch
// day exactly 7 charges happen: 6 × £34 (honour_window) + 1 × £99
// (anomaly_launch_charge) = £303. `future_due` members (383) are NOT
// charged at launch — they renew on their Stripe anniversary post-launch.
//
// After launch this file's "upcoming" + "past due" cards switch to
// reading real Stripe `subscriptions` state.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LAUNCH_AT_UTC } from "@/lib/launch";
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

/** Year-1 honour price = £34. Matches Stripe price `verified_legacy_annual`. */
const LEGACY_HONOUR_PENCE = 3400;


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
  cohort?: "honour_window" | "anomaly_launch_charge" | null;
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
  preLaunch: boolean;
  launchAt: string;
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
    cohortHonour: number;
    cohortAnomaly: number;
    cohortFutureDue: number;
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
    // them as "scheduled Verified" if they also appear in bd_member_seed.
    const liveUserIds = new Set(live.map((s) => s.user_id));

    const preLaunch = now < LAUNCH_AT_UTC;

    // 2. V7 cohort-driven Verified pipeline. Source of truth =
    //    bd_member_seed.migration_cohort_override. Locked spec lives in
    //    docs/10_phase2_migration_dry_run_v7_approved.md.
    const { data: bdSeeds } = await supabaseAdmin
      .from("bd_member_seed")
      .select(
        "bd_member_id, email, first_name, last_name, bd_next_due_date, claimed_user_id, migration_cohort_override",
      );

    type Cohort = "honour_window" | "anomaly_launch_charge" | "future_due";
    type CohortRow = {
      memberId: number;
      email: string;
      name: string;
      cohort: Cohort;
      claimedUserId: string | null;
      bdNextDue: Date | null;
    };

    const cohortRows: CohortRow[] = [];
    for (const seed of (bdSeeds ?? []) as any[]) {
      const c = seed.migration_cohort_override as Cohort | null;
      if (c !== "honour_window" && c !== "anomaly_launch_charge" && c !== "future_due") continue;
      const claimedUserId: string | null = seed.claimed_user_id ?? null;
      // If already on a live Stripe sub, that sub is the source of truth — skip.
      if (claimedUserId && liveUserIds.has(claimedUserId)) continue;
      const nm = `${seed.first_name ?? ""} ${seed.last_name ?? ""}`.trim();
      cohortRows.push({
        memberId: seed.bd_member_id,
        email: String(seed.email ?? ""),
        name: nm || String(seed.email ?? "Verified member"),
        cohort: c,
        claimedUserId,
        bdNextDue: seed.bd_next_due_date ? new Date(seed.bd_next_due_date as string) : null,
      });
    }

    const cohortHonour = cohortRows.filter((r) => r.cohort === "honour_window").length;
    const cohortAnomaly = cohortRows.filter((r) => r.cohort === "anomaly_launch_charge").length;
    const cohortFutureDue = cohortRows.filter((r) => r.cohort === "future_due").length;
    const verifiedScheduledCount = cohortRows.length;
    // ARR = steady-state run-rate at £99/member (honour window is year-1 only).
    const scheduledArr = verifiedScheduledCount * TIER_PRICE_PENCE.verified;

    // 3. Upcoming payments.
    //    Pre-launch: launch-day V7 charges (6 × £34 + 1 × £99 = £303).
    //    Post-launch: live Stripe renewals in the next 14 days only.
    let upcomingPence = 0;
    let upcomingCount = 0;
    const upcomingLive: Array<{
      userId: string;
      tier: Tier;
      dueAt: Date;
      amountPence: number;
    }> = [];
    const upcomingCohort: Array<{
      email: string;
      name: string;
      userId: string | null;
      dueAt: Date;
      amountPence: number;
      cohort: "honour_window" | "anomaly_launch_charge";
    }> = [];

    if (!preLaunch) {
      for (const s of live) {
        if (!s.current_period_end) continue;
        const due = new Date(s.current_period_end);
        if (due >= now && due <= in14d) {
          upcomingPence += paymentPence(s.tier);
          upcomingCount += 1;
          upcomingLive.push({
            userId: s.user_id,
            tier: s.tier as Tier,
            dueAt: due,
            amountPence: paymentPence(s.tier),
          });
        }
      }
    } else {
      for (const r of cohortRows) {
        if (r.cohort === "future_due") continue;
        const amount =
          r.cohort === "honour_window" ? LEGACY_HONOUR_PENCE : TIER_PRICE_PENCE.verified;
        upcomingPence += amount;
        upcomingCount += 1;
        upcomingCohort.push({
          email: r.email,
          name: r.name,
          userId: r.claimedUserId,
          dueAt: LAUNCH_AT_UTC,
          amountPence: amount,
          cohort: r.cohort,
        });
      }
    }

    // 4. Lifetime members (kept in Verified count, excluded from forecast).
    const { count: lifetimeCount } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select("bd_member_id", { count: "exact", head: true })
      .eq("is_lifetime", true);
    const lifetimeMembers = lifetimeCount ?? 0;

    const verifiedActive = tierMap.verified.active + tierMap.verified.trialing;

    // 5. Resolve names for upcoming + past-due lists.
    const userIdsForNames = new Set<string>();
    for (const it of upcomingLive) userIdsForNames.add(it.userId);
    for (const it of upcomingCohort) if (it.userId) userIdsForNames.add(it.userId);
    for (const s of pastDue) userIdsForNames.add(s.user_id);

    const profileMap = new Map<string, { full_name: string | null }>();
    if (userIdsForNames.size > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIdsForNames));
      for (const p of (profs ?? []) as any[]) profileMap.set(p.id, { full_name: p.full_name });
    }

    // Emails (for past-due lookup if name missing)
    const pastDueUserIds = pastDue.map((s) => s.user_id);
    const userEmailMap = new Map<string, string | null>();
    if (pastDueUserIds.length > 0) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      for (const u of authUsers?.users ?? []) {
        if (pastDueUserIds.includes(u.id)) userEmailMap.set(u.id, u.email ?? null);
      }
    }

    const upcomingItems: PaymentListItem[] = [
      ...upcomingLive.map((it) => ({
        name: profileMap.get(it.userId)?.full_name ?? "Member",
        email: null,
        tier: it.tier,
        dueAt: it.dueAt.toISOString(),
        amountPence: it.amountPence,
        source: "stripe" as const,
        cohort: null,
      })),
      ...upcomingCohort.map((it) => {
        const fromProfile = it.userId ? profileMap.get(it.userId)?.full_name : null;
        return {
          name: fromProfile || it.name,
          email: it.email || null,
          tier: "verified" as Tier,
          dueAt: it.dueAt.toISOString(),
          amountPence: it.amountPence,
          source: "scheduled" as const,
          cohort: it.cohort,
        };
      }),
    ].sort((a, b) => {
      // honour_window first, then anomaly, then by dueAt
      const order = (c: string | null | undefined) =>
        c === "honour_window" ? 0 : c === "anomaly_launch_charge" ? 1 : 2;
      const d = order(a.cohort) - order(b.cohort);
      if (d !== 0) return d;
      return (a.dueAt ?? "").localeCompare(b.dueAt ?? "");
    });

    const pastDueItems: PastDueItem[] = pastDue.map((s) => ({
      name: profileMap.get(s.user_id)?.full_name || userEmailMap.get(s.user_id) || "Member",
      email: userEmailMap.get(s.user_id) ?? null,
      tier: s.tier as Tier,
      status: s.status,
      amountPence: paymentPence(s.tier),
    }));

    const distribution = [
      { label: "Verified", count: verifiedActive + verifiedScheduledCount, tone: "verified" as const },
      { label: "Pro", count: tierMap.pro.active + tierMap.pro.trialing, tone: "pro" as const },
      { label: "Studio", count: tierMap.studio.active + tierMap.studio.trialing, tone: "studio" as const },
    ].filter((d) => d.count > 0);

    return {
      env,
      preLaunch,
      launchAt: LAUNCH_AT_UTC.toISOString(),
      forecastArrPence: activeArr + scheduledArr,
      activeArrPence: activeArr,
      scheduledArrPence: scheduledArr,
      upcoming14dPence: upcomingPence,
      upcoming14dCount: upcomingCount,
      upcomingItems,
      verifiedActive,
      verifiedScheduled: verifiedScheduledCount,
      pastDueCount: pastDue.length,
      pastDueItems,
      tiers: [
        { tier: "verified", ...tierMap.verified, scheduled: verifiedScheduledCount },
        { tier: "pro", ...tierMap.pro, scheduled: 0 },
        { tier: "studio", ...tierMap.studio, scheduled: 0 },
      ],
      distribution,
      diagnostics: {
        nonGbpExcluded: 0,
        lifetimeMembers,
        activeSubsTotal: live.length,
        cohortHonour,
        cohortAnomaly,
        cohortFutureDue,
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
      .select("bd_member_id, next_due_at, is_lifetime, last_paid_amount_pence, eligible_for_legacy_price")
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

    // First scheduled payment honours the year-1 legacy price (e.g. £34); every
    // subsequent annual renewal reverts to the standard Verified price (£99).
    function projectVerifiedRenewals(
      firstDue: Date,
      claimedUserId: string | null,
      firstDuePence: number,
    ) {
      if (claimedUserId && liveUserIds.has(claimedUserId)) return;
      let due = new Date(firstDue);
      let isFirst = true;
      while (due <= horizonEnd) {
        if (due >= now) {
          const amount = isFirst ? firstDuePence : TIER_PRICE_PENCE.verified;
          applyPayment(due, amount, "verified");
        }
        isFirst = false;
        const d = new Date(due);
        d.setUTCFullYear(d.getUTCFullYear() + 1);
        due = d;
      }
    }


    for (const link of (legacyLinks ?? []) as any[]) {
      legacyMemberIds.add(link.bd_member_id);
      if (!link.next_due_at) continue;
      const seed = bdSeedByMember.get(link.bd_member_id);
      const firstDuePence =
        link.eligible_for_legacy_price && link.last_paid_amount_pence && link.last_paid_amount_pence > 0
          ? link.last_paid_amount_pence
          : TIER_PRICE_PENCE.verified;
      projectVerifiedRenewals(new Date(link.next_due_at), seed?.claimed_user_id ?? null, firstDuePence);
    }
    for (const seed of (bdSeeds ?? []) as any[]) {
      if (legacyMemberIds.has(seed.bd_member_id)) continue;
      if (!seed.bd_next_due_date) continue;
      projectVerifiedRenewals(
        new Date(seed.bd_next_due_date as string),
        seed.claimed_user_id ?? null,
        TIER_PRICE_PENCE.verified,
      );
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
