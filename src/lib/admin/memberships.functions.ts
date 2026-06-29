// Admin server fns for /admin/memberships.
//
// Post-launch (Admin v2, Phase A4b-2):
//   Reads ONLY the `subscriptions` Stripe mirror. The pre-launch V7 cohort
//   logic (bd_member_seed.migration_cohort_override + legacy_stripe_link
//   annual roll-forwards) has been retired — those rows are now either real
//   Stripe subscriptions (333 converted) or live in the setup-link cohort
//   (44 awaiting card capture) and will reappear as real subs the moment
//   their checkout completes.
//
// Survivor + anti-ghost model matches `overview.functions.ts`:
//   - One survivor row per user (highest tier; tie-break = most recent).
//   - Drop subs whose user_id no longer exists in `auth.users` (orphans).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LAUNCH_AT_UTC } from "@/lib/launch";
import { FAILED_PAYMENT_STATUSES } from "./metrics-definitions";
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

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const LIVE_STATUSES = new Set(["active", "trialing"]);
const PAST_DUE_STATUSES = new Set<string>([...FAILED_PAYMENT_STATUSES]);
const TIER_RANK: Record<string, number> = { studio: 3, pro: 2, verified: 1 };

// ============================================================================
// Shared helpers
// ============================================================================

type SubRow = {
  user_id: string;
  tier: string;
  status: string;
  current_period_end: string | null;
  billing_period: BillingPeriod | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at?: string | null;
};

/** Best-effort map of auth.users id → email (used as anti-ghost filter). */
async function loadAuthUserIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let page = 1;
    while (page < 50) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      for (const u of data.users) ids.add(u.id);
      if (data.users.length < 200) break;
      page += 1;
    }
  } catch {
    // Best-effort. If lookup fails we keep all subs (caller behaviour).
  }
  return ids;
}

/**
 * One survivor row per user — highest tier wins, tie-break by most recent
 * created_at (or current_period_end as a fallback). Mirrors the rule used by
 * `overview.functions.ts` so KPIs reconcile across pages.
 */
function pickSurvivors(rows: SubRow[]): SubRow[] {
  const map = new Map<string, SubRow>();
  for (const s of rows) {
    if (!s.user_id || !s.tier) continue;
    const prev = map.get(s.user_id);
    if (!prev) { map.set(s.user_id, s); continue; }
    const a = TIER_RANK[s.tier] ?? 0;
    const b = TIER_RANK[prev.tier] ?? 0;
    if (a > b) { map.set(s.user_id, s); continue; }
    if (a === b) {
      const aT = new Date(s.created_at ?? s.current_period_end ?? 0).getTime();
      const bT = new Date(prev.created_at ?? prev.current_period_end ?? 0).getTime();
      if (aT > bT) map.set(s.user_id, s);
    }
  }
  return [...map.values()];
}

// ============================================================================
// getMembershipMetrics — KPIs, tier counts, upcoming, past due
// ============================================================================

export type TierBreakdown = {
  tier: Tier;
  active: number;
  trialing: number;
  scheduled: number; // retained for type-compat; always 0 post-launch
};

export type PaymentListItem = {
  name: string;
  email: string | null;
  tier: Tier;
  dueAt: string | null;
  amountPence: number;
  source: "stripe" | "scheduled";
  cohort?: "honour_window" | "anomaly_launch_charge" | "future_due" | null;
};

export type PastDueItem = {
  name: string;
  email: string | null;
  tier: Tier;
  status: string;
  amountPence: number;
  lastFailedAttemptPence: number | null;
  lastFailedAt: string | null;
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

    const { data: subsRaw } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "user_id, tier, status, current_period_end, environment, billing_period, stripe_subscription_id, stripe_customer_id, created_at",
      )
      .eq("environment", env);

    const allSubs = (subsRaw ?? []) as SubRow[];

    // Anti-ghost: drop subs whose user is gone from auth.users.
    const authIds = await loadAuthUserIds();
    const orphanSubs = authIds.size > 0
      ? allSubs.filter((s) => !authIds.has(s.user_id))
      : [];
    const linkedSubs = authIds.size > 0
      ? allSubs.filter((s) => authIds.has(s.user_id))
      : allSubs;

    // One survivor per user.
    const survivors = pickSurvivors(linkedSubs);

    const live = survivors.filter((s) => LIVE_STATUSES.has(s.status) && isPaidTier(s.tier));
    const pastDue = survivors.filter((s) => PAST_DUE_STATUSES.has(s.status));

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

    // Upcoming charges = live subs with current_period_end ∈ [now, now+14d].
    const upcomingLive: Array<{ userId: string; tier: Tier; dueAt: Date; amountPence: number }> = [];
    let upcomingPence = 0;
    let upcomingCount = 0;
    for (const s of live) {
      if (!s.current_period_end) continue;
      const due = new Date(s.current_period_end);
      if (due >= now && due <= in14d) {
        const amt = paymentPenceFor(s.tier, s.billing_period);
        upcomingPence += amt;
        upcomingCount += 1;
        upcomingLive.push({ userId: s.user_id, tier: s.tier as Tier, dueAt: due, amountPence: amt });
      }
    }

    // Resolve names for upcoming + past-due lists.
    const userIdsForNames = new Set<string>();
    for (const it of upcomingLive) userIdsForNames.add(it.userId);
    for (const s of pastDue) userIdsForNames.add(s.user_id);

    const profileMap = new Map<string, { full_name: string | null }>();
    if (userIdsForNames.size > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIdsForNames));
      for (const p of (profs ?? []) as any[]) profileMap.set(p.id, { full_name: p.full_name });
    }

    const pastDueUserIds = pastDue.map((s) => s.user_id);
    const userEmailMap = new Map<string, string | null>();
    if (pastDueUserIds.length > 0) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      for (const u of authUsers?.users ?? []) {
        if (pastDueUserIds.includes(u.id)) userEmailMap.set(u.id, u.email ?? null);
      }
    }

    const upcomingItems: PaymentListItem[] = upcomingLive
      .map((it) => ({
        name: profileMap.get(it.userId)?.full_name ?? "Member",
        email: null,
        tier: it.tier,
        dueAt: it.dueAt.toISOString(),
        amountPence: it.amountPence,
        source: "stripe" as const,
        cohort: null,
      }))
      .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));

    // Last failed payment per past-due user (display only).
    const lastFailedMap = new Map<string, { amountPence: number | null; at: string }>();
    if (pastDueUserIds.length > 0) {
      const { data: failedEvents } = await supabaseAdmin
        .from("payment_events")
        .select("user_id, created_at, payload")
        .in("user_id", pastDueUserIds)
        .eq("event_type", "invoice.payment_failed")
        .order("created_at", { ascending: false })
        .limit(500);
      for (const e of (failedEvents ?? []) as any[]) {
        if (!e.user_id || lastFailedMap.has(e.user_id)) continue;
        const obj = e.payload?.data?.object ?? {};
        const raw = obj.amount_due ?? obj.amount_paid ?? obj.amount ?? null;
        const amt = typeof raw === "number" ? raw : raw != null ? Number(raw) : null;
        lastFailedMap.set(e.user_id, {
          amountPence: Number.isFinite(amt as number) ? (amt as number) : null,
          at: e.created_at,
        });
      }
    }

    const pastDueItems: PastDueItem[] = pastDue.map((s) => {
      const last = lastFailedMap.get(s.user_id) ?? null;
      return {
        name: profileMap.get(s.user_id)?.full_name || userEmailMap.get(s.user_id) || "Member",
        email: userEmailMap.get(s.user_id) ?? null,
        tier: s.tier as Tier,
        status: s.status,
        amountPence: paymentPenceFor(s.tier, s.billing_period),
        lastFailedAttemptPence: last?.amountPence ?? null,
        lastFailedAt: last?.at ?? null,
      };
    });

    const verifiedActive = tierMap.verified.active + tierMap.verified.trialing;

    const distribution = [
      { label: "Core", count: verifiedActive, tone: "verified" as const },
      { label: "Pro", count: tierMap.pro.active + tierMap.pro.trialing, tone: "pro" as const },
      { label: "Studio", count: tierMap.studio.active + tierMap.studio.trialing, tone: "studio" as const },
    ].filter((d) => d.count > 0);

    return {
      env,
      preLaunch: false,
      launchAt: LAUNCH_AT_UTC.toISOString(),
      forecastArrPence: activeArr,
      activeArrPence: activeArr,
      scheduledArrPence: 0,
      upcoming14dPence: upcomingPence,
      upcoming14dCount: upcomingCount,
      upcomingItems,
      verifiedActive,
      verifiedScheduled: 0,
      pastDueCount: pastDue.length,
      pastDueItems,
      tiers: [
        { tier: "verified", ...tierMap.verified, scheduled: 0 },
        { tier: "pro", ...tierMap.pro, scheduled: 0 },
        { tier: "studio", ...tierMap.studio, scheduled: 0 },
      ],
      distribution,
      diagnostics: {
        nonGbpExcluded: 0,
        lifetimeMembers: 0,
        activeSubsTotal: live.length,
        cohortHonour: 0,
        cohortAnomaly: 0,
        cohortFutureDue: 0,
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
// getRevenueForecast — 24-month projected cash, mirror-only
// ============================================================================

export type ForecastMonth = {
  monthKey: string;
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

    const monthKeys: string[] = [];
    for (let i = 0; i < FORECAST_MONTHS; i++) monthKeys.push(addMonths(startKey, i));

    const buckets = new Map<string, ForecastMonth>();
    for (const k of monthKeys) {
      buckets.set(k, { monthKey: k, verifiedPence: 0, proPence: 0, studioPence: 0, totalPence: 0 });
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

    const { data: subsRaw } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "user_id, tier, status, current_period_end, environment, billing_period, stripe_subscription_id, stripe_customer_id, created_at",
      )
      .eq("environment", env);

    const allSubs = (subsRaw ?? []) as SubRow[];
    const authIds = await loadAuthUserIds();
    const linked = authIds.size > 0 ? allSubs.filter((s) => authIds.has(s.user_id)) : allSubs;
    const survivors = pickSurvivors(linked);

    for (const s of survivors) {
      if (!LIVE_STATUSES.has(s.status)) continue;
      if (!isPaidTier(s.tier)) continue;
      if (!s.current_period_end) continue;
      const tier = s.tier as Tier;
      const cadence = cadenceMonthsFor(tier, s.billing_period);
      const amount = paymentPenceFor(tier, s.billing_period);
      let due = new Date(s.current_period_end);
      while (due <= horizonEnd) {
        if (due >= now) applyPayment(due, amount, tier);
        const d = new Date(due);
        d.setUTCMonth(d.getUTCMonth() + cadence);
        due = d;
      }
    }

    const months = monthKeys.map((k) => buckets.get(k)!);

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

    // Silence unused-import linter (TIER_PRICE_PENCE retained for future use).
    void TIER_PRICE_PENCE;

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
    const nameMap = new Map<string, string | null>();
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
