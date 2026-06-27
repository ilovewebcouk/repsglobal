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
  type BillingPeriod,
  type BillingEnv,
  TIER_PRICE_PENCE,
  annualPenceFor,
  paymentPenceFor,
  cadenceMonthsFor,
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
    nonGbpExcluded: 0;
    lifetimeMembers: number;
    activeSubsTotal: number;
    cohortHonour: number;
    cohortAnomaly: number;
    cohortFutureDue: number;
    orphanedSubsLive: number;
    orphanedSubsList: Array<{
      stripe_subscription_id: string | null;
      tier: string;
      status: string;
      billing_period: BillingPeriod | null;
    }>;
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
      .select("user_id, tier, status, current_period_end, environment, billing_period, stripe_subscription_id")
      .eq("environment", env);

    const allSubs = (subsRaw ?? []) as Array<{
      user_id: string;
      tier: string;
      status: string;
      current_period_end: string | null;
      billing_period: BillingPeriod | null;
      stripe_subscription_id: string | null;
    }>;

    // Orphan exclusion: any sub whose user_id no longer exists in auth.users
    // is excluded from every KPI/forecast and surfaced via diagnostics only.
    const allUserIds = Array.from(new Set(allSubs.map((s) => s.user_id)));
    const validUserIds = new Set<string>();
    if (allUserIds.length > 0) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .in("id", allUserIds);
      for (const p of (existing ?? []) as Array<{ id: string }>) validUserIds.add(p.id);
    }
    const orphanSubs = allSubs.filter((s) => !validUserIds.has(s.user_id));
    const subs = allSubs.filter((s) => validUserIds.has(s.user_id));

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
      activeArr += annualPenceFor(t, s.billing_period);
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

    // 3. Upcoming payments — unified rolling 14-day window of every expected
    //    charge: Stripe renewals (active) + trial conversions (trialing subs
    //    whose trial ends in the window) + V7 cohort (honour_window /
    //    anomaly_launch_charge) if LAUNCH_AT_UTC falls in the window.
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

    for (const s of live) {
      if (!s.current_period_end) continue;
      const due = new Date(s.current_period_end);
      if (due >= now && due <= in14d) {
        const amt = paymentPenceFor(s.tier, s.billing_period);
        upcomingPence += amt;
        upcomingCount += 1;
        upcomingLive.push({
          userId: s.user_id,
          tier: s.tier as Tier,
          dueAt: due,
          amountPence: amt,
        });
      }
    }
    if (LAUNCH_AT_UTC >= now && LAUNCH_AT_UTC <= in14d) {
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
      amountPence: paymentPenceFor(s.tier, s.billing_period),
    }));

    const distribution = [
      { label: "Core", count: verifiedActive + verifiedScheduledCount, tone: "verified" as const },
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
        orphanedSubsLive: orphanSubs.filter((s) => LIVE_STATUSES.has(s.status)).length,
        orphanedSubsList: orphanSubs.map((s) => ({
          stripe_subscription_id: s.stripe_subscription_id,
          tier: s.tier,
          status: s.status,
          billing_period: s.billing_period,
        })),
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
    //    Orphans (subs whose user_id is no longer in `profiles`) are excluded.
    const { data: subsRaw } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, tier, status, current_period_end, environment, billing_period")
      .eq("environment", env);

    const subsAll = (subsRaw ?? []) as Array<{
      user_id: string;
      tier: string;
      status: string;
      current_period_end: string | null;
      billing_period: BillingPeriod | null;
    }>;
    const forecastUserIds = Array.from(new Set(subsAll.map((s) => s.user_id)));
    const validForecastUsers = new Set<string>();
    if (forecastUserIds.length > 0) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .in("id", forecastUserIds);
      for (const p of (existing ?? []) as Array<{ id: string }>) validForecastUsers.add(p.id);
    }
    const subsLinked = subsAll.filter((s) => validForecastUsers.has(s.user_id));

    for (const s of subsLinked) {
      if (!LIVE_STATUSES.has(s.status)) continue;
      if (!isPaidTier(s.tier)) continue;
      if (!s.current_period_end) continue;
      const tier = s.tier as Tier;
      const cadence = cadenceMonthsFor(tier, s.billing_period);
      const amount = paymentPenceFor(tier, s.billing_period);
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

    // 2. Project V7 cohort members.
    //    honour_window  → £34 at LAUNCH_AT_UTC, then £99 annually.
    //    anomaly_launch → £99 at LAUNCH_AT_UTC, then £99 annually.
    //    future_due     → £99 at bd_next_due_date if ≥ LAUNCH_AT_UTC,
    //                     else rolled forward 1 year at a time until ≥ launch,
    //                     then £99 annually.
    const { data: bdSeeds } = await supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id, bd_next_due_date, claimed_user_id, migration_cohort_override");

    const liveUserIds = new Set<string>(
      subsLinked
        .filter((s) => LIVE_STATUSES.has(s.status))
        .map((s) => s.user_id),
    );

    function projectAnnual(firstDue: Date, firstAmount: number) {
      let due = new Date(firstDue);
      let isFirst = true;
      while (due <= horizonEnd) {
        if (due >= now) {
          applyPayment(due, isFirst ? firstAmount : TIER_PRICE_PENCE.verified, "verified");
        }
        isFirst = false;
        const d = new Date(due);
        d.setUTCFullYear(d.getUTCFullYear() + 1);
        due = d;
      }
    }

    for (const seed of (bdSeeds ?? []) as any[]) {
      const cohort = seed.migration_cohort_override as string | null;
      if (
        cohort !== "honour_window" &&
        cohort !== "anomaly_launch_charge" &&
        cohort !== "future_due"
      )
        continue;
      const claimedUserId: string | null = seed.claimed_user_id ?? null;
      if (claimedUserId && liveUserIds.has(claimedUserId)) continue;

      if (cohort === "honour_window") {
        projectAnnual(LAUNCH_AT_UTC, LEGACY_HONOUR_PENCE);
      } else if (cohort === "anomaly_launch_charge") {
        projectAnnual(LAUNCH_AT_UTC, TIER_PRICE_PENCE.verified);
      } else {
        // future_due — anchor on bd_next_due_date, roll forward until on/after launch.
        if (!seed.bd_next_due_date) continue;
        let due = new Date(seed.bd_next_due_date as string);
        while (due < LAUNCH_AT_UTC) {
          const d = new Date(due);
          d.setUTCFullYear(d.getUTCFullYear() + 1);
          due = d;
        }
        projectAnnual(due, TIER_PRICE_PENCE.verified);
      }
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
