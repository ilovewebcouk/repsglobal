import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  enumerateDays,
  forecastWindowFor,
  londonDayKey,
} from "./overview-period";
import {
  ACTIVE_STATUSES,
  COUNTED_TIERS,
  TIER_RANK,
  TIER_RENEWAL_PENCE,
  LEGACY_AMOUNT_PENCE,
  COUNTED_PAYMENT_EVENT_TYPES,
  TERMINAL_CHURN_STAGES,
  asString,
  type ForecastHorizon,
} from "./metrics-definitions";

const Input = z.object({
  // Historical window — drives Active Members, Revenue Received,
  // Net Member Growth, and all actuals charts.
  from: z.string(),
  to: z.string(),
  // Forecast horizon window — drives Projected Cash Due only.
  // MUST be passed separately so the two windows can never silently
  // share a date range.
  forecastFrom: z.string().optional(),
  forecastTo: z.string().optional(),
});

type DayPoint = { day: string; value: number };

export interface AdminOverviewDTO {
  period: { from: string; to: string };
  forecast: { from: string; to: string };

  // KPI 1 — Active Members
  totalMembers: number;
  joinedInPeriod: number;
  churnedInPeriod: number;

  // KPI 2 — Revenue Received
  revenuePence: number;

  // KPI 3 — Projected Cash Due (independent horizon)
  forecastPence: number;

  // KPI 4 — Net Member Growth (joinedInPeriod - churnedInPeriod)
  netMemberGrowth: number;

  // Demoted from headline tile to supporting info
  newRegistrations: number;

  // Series for sparklines / supporting charts
  membersSeries: DayPoint[] | null;
  revenueSeries: DayPoint[] | null;
  signupsSeries: DayPoint[] | null;
  forecastSeries: DayPoint[] | null;
  churnSeries: DayPoint[] | null;

  mix: { verified: number; pro: number; studio: number };
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<AdminOverviewDTO> => {
    const { supabase, userId } = context;

    // Admin gate
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // Forecast window defaults to "Next 30 days" when not provided —
    // matches the previous behaviour. It is ALWAYS distinct from the
    // historical window.
    const fcast = data.forecastFrom && data.forecastTo
      ? { from: data.forecastFrom, to: data.forecastTo }
      : forecastWindowFor("next_30d");

    // -------------------------------------------------------------------
    // KPI 1 — Active Members (point-in-time)
    //
    // Canonical Active Paying Member model — unions Stripe subs,
    // legacy_stripe_link, and bd_member_seed and dedupes to one survivor
    // per person. See `src/lib/members/active-paying-member.ts`.
    // -------------------------------------------------------------------
    const { data: subsRaw, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, user_id, tier, status, current_period_end, created_at, environment");
    if (subsErr) throw subsErr;

    const { data: legacyLinksAll } = await supabase
      .from("legacy_stripe_link")
      .select("bd_member_id, email, claimed_user_id, access_expires_at, created_at, stripe_customer_id");

    const { data: bdSeedsAll } = await supabase
      .from("bd_member_seed")
      .select("bd_member_id, email, claimed_user_id, bd_next_due_date, bd_signup_date");

    // Email lookup for subs → email (used for cross-source dedupe).
    const authEmailById = new Map<string, string>();
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      let page = 1;
      while (page < 50) {
        const { data: users, error: uErr } =
          await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        if (uErr) break;
        for (const u of users.users) {
          if (u.email) authEmailById.set(u.id, u.email.toLowerCase());
        }
        if (users.users.length < 200) break;
        page += 1;
      }
    } catch {
      // Email lookup is a best-effort enrichment for dedupe — collection
      // still works without it (subs vs bd will fall through to bd_member_id).
    }

    const nowIso = new Date().toISOString();
    const activeCollection = buildActivePayingMemberCollection({
      subs: (subsRaw ?? []).map((s) => ({
        id: s.id,
        user_id: s.user_id ?? null,
        tier: s.tier ?? null,
        status: s.status ?? null,
        environment: s.environment ?? null,
        created_at: s.created_at ?? null,
        current_period_end: s.current_period_end ?? null,
      })),
      legacyLinks: (legacyLinksAll ?? []).map((l) => ({
        bd_member_id: (l as { bd_member_id: number | string | null })
          .bd_member_id,
        email: (l as { email?: string | null }).email ?? null,
        claimed_user_id: (l as { claimed_user_id?: string | null })
          .claimed_user_id ?? null,
        access_expires_at: (l as { access_expires_at: string | null })
          .access_expires_at,
        created_at: (l as { created_at?: string | null }).created_at ?? null,
        stripe_customer_id: (l as { stripe_customer_id?: string | null })
          .stripe_customer_id ?? null,
      })),
      bdSeeds: (bdSeedsAll ?? []).map((b) => ({
        bd_member_id: (b as { bd_member_id: number | string | null })
          .bd_member_id,
        email: (b as { email?: string | null }).email ?? null,
        claimed_user_id: (b as { claimed_user_id?: string | null })
          .claimed_user_id ?? null,
        bd_next_due_date: (b as { bd_next_due_date: string | null })
          .bd_next_due_date,
        bd_signup_date: (b as { bd_signup_date?: string | null })
          .bd_signup_date ?? null,
      })),
      authEmailById,
      nowIso,
    });

    const totalMembers = activeCollection.counts.final_active_members;
    const mix = {
      verified: activeCollection.counts.by_tier.verified,
      pro: activeCollection.counts.by_tier.pro,
      studio: activeCollection.counts.by_tier.studio,
    };


    // -------------------------------------------------------------------
    // KPI 2 — Revenue Received (historical window)
    // -------------------------------------------------------------------
    const { data: paymentsRaw, error: payErr } = await supabase
      .from("payment_events")
      .select("stripe_event_id, event_type, payload, created_at")
      .in("event_type", Array.from(COUNTED_PAYMENT_EVENT_TYPES))
      .gte("created_at", data.from)
      .lt("created_at", data.to);
    if (payErr) throw payErr;

    const seenEvents = new Set<string>();
    const moneyByPayment = new Map<
      string,
      { amount: number; createdAt: string; rank: number }
    >();

    for (const ev of paymentsRaw ?? []) {
      if (ev.stripe_event_id && seenEvents.has(ev.stripe_event_id)) continue;
      if (ev.stripe_event_id) seenEvents.add(ev.stripe_event_id);

      const payload = (ev.payload ?? {}) as Record<string, unknown>;
      const eventData = (payload.data ?? {}) as Record<string, unknown>;
      const obj = (eventData.object ?? {}) as Record<string, unknown>;

      let amount =
        typeof obj.amount_paid === "number"
          ? obj.amount_paid
          : typeof obj.amount === "number"
            ? obj.amount
            : 0;

      if (ev.event_type === "charge.succeeded") {
        if (obj.refunded === true) amount = 0;
        else if (typeof obj.amount_refunded === "number") {
          amount = Math.max(0, amount - obj.amount_refunded);
        }
      }
      if (!amount || !ev.created_at) continue;

      const objectId = asString(obj.id);
      const paymentIntent = asString(obj.payment_intent);
      const chargeId =
        asString(obj.charge) ??
        (ev.event_type === "charge.succeeded" ? objectId : null);
      const paymentKey = paymentIntent
        ? `pi:${paymentIntent}`
        : chargeId
          ? `charge:${chargeId}`
          : objectId
            ? `object:${objectId}`
            : `event:${ev.stripe_event_id ?? ev.created_at}`;

      const rank = ev.event_type === "invoice.payment_succeeded" ? 1 : 2;
      const previous = moneyByPayment.get(paymentKey);
      if (!previous || rank < previous.rank) {
        moneyByPayment.set(paymentKey, {
          amount,
          createdAt: ev.created_at,
          rank,
        });
      }
    }

    let revenuePence = 0;
    const revBuckets = new Map<string, number>();
    for (const payment of moneyByPayment.values()) {
      revenuePence += payment.amount;
      const key = londonDayKey(payment.createdAt);
      revBuckets.set(key, (revBuckets.get(key) ?? 0) + payment.amount);
    }

    // -------------------------------------------------------------------
    // KPI 3 — Projected Cash Due (forecast horizon window)
    // -------------------------------------------------------------------
    const fcastFrom = new Date(fcast.from).getTime();
    const fcastTo = new Date(fcast.to).getTime();
    let forecastPence = 0;
    const fcastBuckets = new Map<string, number>();
    const countedUsers = new Set<string>();
    const countedMembers = new Set<string>();

    const addForecast = (iso: string, amount: number) => {
      if (!amount) return;
      forecastPence += amount;
      const key = londonDayKey(iso);
      fcastBuckets.set(key, (fcastBuckets.get(key) ?? 0) + amount);
    };

    for (const s of subs) {
      if (!s.current_period_end || !s.user_id) continue;
      const t = new Date(s.current_period_end).getTime();
      if (t < fcastFrom || t >= fcastTo) continue;
      const amount = TIER_RENEWAL_PENCE[s.tier!] ?? 0;
      if (!amount) continue;
      addForecast(s.current_period_end, amount);
      countedUsers.add(s.user_id);
    }

    const { data: seeds } = await supabase
      .from("bd_member_seed")
      .select("bd_member_id, claimed_user_id, bd_next_due_date");
    const seedByMember = new Map<
      string,
      { claimed_user_id: string | null; bd_next_due_date: string | null }
    >();
    for (const s of seeds ?? []) {
      if (s.bd_member_id != null) {
        seedByMember.set(String(s.bd_member_id), {
          claimed_user_id: (s.claimed_user_id as string | null) ?? null,
          bd_next_due_date: (s.bd_next_due_date as string | null) ?? null,
        });
      }
    }

    const { data: links } = await supabase
      .from("legacy_stripe_link")
      .select("bd_member_id, access_expires_at")
      .not("access_expires_at", "is", null)
      .gte("access_expires_at", new Date(fcastFrom).toISOString())
      .lt("access_expires_at", new Date(fcastTo).toISOString());
    for (const l of links ?? []) {
      const memberKey = l.bd_member_id != null ? String(l.bd_member_id) : null;
      const seed = memberKey ? seedByMember.get(memberKey) : null;
      const uid = seed?.claimed_user_id ?? null;
      if (uid && countedUsers.has(uid)) continue;
      if (memberKey && countedMembers.has(memberKey)) continue;
      addForecast(l.access_expires_at as string, LEGACY_AMOUNT_PENCE);
      if (uid) countedUsers.add(uid);
      if (memberKey) countedMembers.add(memberKey);
    }

    for (const [memberId, seed] of seedByMember) {
      if (!seed.bd_next_due_date) continue;
      const t = new Date(seed.bd_next_due_date).getTime();
      if (t < fcastFrom || t >= fcastTo) continue;
      if (seed.claimed_user_id && countedUsers.has(seed.claimed_user_id)) continue;
      if (countedMembers.has(memberId)) continue;
      addForecast(seed.bd_next_due_date, LEGACY_AMOUNT_PENCE);
      if (seed.claimed_user_id) countedUsers.add(seed.claimed_user_id);
      countedMembers.add(memberId);
    }

    // -------------------------------------------------------------------
    // KPI 4 — Net Member Growth (historical window)
    // Joined = first paid sub `created_at` per user inside window.
    // Churned = users whose latest churn_lifecycle row is in a terminal
    //   stage AND entered that stage inside the window.
    // -------------------------------------------------------------------
    const sigBuckets = new Map<string, number>();
    let newRegistrations = 0;
    const firstSubAt = new Map<string, string>();
    for (const s of subsRaw ?? []) {
      if (s.environment !== "live") continue;
      if (!(COUNTED_TIERS as readonly string[]).includes(s.tier ?? "")) continue;
      if (!s.user_id || !s.created_at) continue;
      const prev = firstSubAt.get(s.user_id);
      if (!prev || new Date(s.created_at).getTime() < new Date(prev).getTime()) {
        firstSubAt.set(s.user_id, s.created_at);
      }
    }
    const fromMs = new Date(data.from).getTime();
    const toMs = new Date(data.to).getTime();
    let joinedInPeriod = 0;
    for (const ts of firstSubAt.values()) {
      const t = new Date(ts).getTime();
      if (t < fromMs || t >= toMs) continue;
      joinedInPeriod += 1;
      const key = londonDayKey(ts);
      sigBuckets.set(key, (sigBuckets.get(key) ?? 0) + 1);
    }
    // Registrations and Joined are the same definition (first paid sub
    // in window) — we expose both keys so the UI can demote Registrations
    // without changing meaning.
    newRegistrations = joinedInPeriod;

    // Churned — keep latest stage per user.
    const { data: churnRows } = await supabase
      .from("churn_lifecycle")
      .select("user_id, stage, entered_at");
    const latestChurnByUser = new Map<
      string,
      { stage: string; entered_at: string }
    >();
    for (const c of churnRows ?? []) {
      if (!c.user_id || !c.entered_at) continue;
      const prev = latestChurnByUser.get(c.user_id);
      if (
        !prev ||
        new Date(c.entered_at).getTime() > new Date(prev.entered_at).getTime()
      ) {
        latestChurnByUser.set(c.user_id, {
          stage: c.stage as string,
          entered_at: c.entered_at as string,
        });
      }
    }
    let churnedInPeriod = 0;
    const churnBuckets = new Map<string, number>();
    for (const c of latestChurnByUser.values()) {
      if (!(TERMINAL_CHURN_STAGES as readonly string[]).includes(c.stage)) continue;
      const t = new Date(c.entered_at).getTime();
      if (t < fromMs || t >= toMs) continue;
      churnedInPeriod += 1;
      const key = londonDayKey(c.entered_at);
      churnBuckets.set(key, (churnBuckets.get(key) ?? 0) + 1);
    }
    const netMemberGrowth = joinedInPeriod - churnedInPeriod;

    // -------------------------------------------------------------------
    // Series scaffolding
    // -------------------------------------------------------------------
    const days = enumerateDays(data.from, data.to);
    const joinsByDay = new Map<string, number>();
    for (const v of perUser.values()) {
      const key = londonDayKey(v.created_at);
      joinsByDay.set(key, (joinsByDay.get(key) ?? 0) + 1);
    }
    let joinsBefore = 0;
    for (const d of days) joinsBefore += joinsByDay.get(d) ?? 0;
    let running = totalMembers - joinsBefore;
    const membersSeries: DayPoint[] = days.map((d) => {
      running += joinsByDay.get(d) ?? 0;
      return { day: d, value: running };
    });

    const revenueSeriesArr: DayPoint[] = days.map((d) => ({
      day: d,
      value: revBuckets.get(d) ?? 0,
    }));
    const signupsSeriesArr: DayPoint[] = days.map((d) => ({
      day: d,
      value: sigBuckets.get(d) ?? 0,
    }));
    const churnSeriesArr: DayPoint[] = days.map((d) => ({
      day: d,
      value: churnBuckets.get(d) ?? 0,
    }));
    const forecastDays = enumerateDays(fcast.from, fcast.to);
    const forecastSeriesArr: DayPoint[] = forecastDays.map((d) => ({
      day: d,
      value: fcastBuckets.get(d) ?? 0,
    }));

    const hasData = (arr: DayPoint[]) => arr.some((p) => p.value > 0);

    return {
      period: { from: data.from, to: data.to },
      forecast: { from: fcast.from, to: fcast.to },
      totalMembers,
      joinedInPeriod,
      churnedInPeriod,
      netMemberGrowth,
      revenuePence,
      forecastPence,
      newRegistrations,
      membersSeries: membersSeries.length && totalMembers > 0 ? membersSeries : null,
      revenueSeries: hasData(revenueSeriesArr) ? revenueSeriesArr : null,
      signupsSeries: hasData(signupsSeriesArr) ? signupsSeriesArr : null,
      forecastSeries: hasData(forecastSeriesArr) ? forecastSeriesArr : null,
      churnSeries: hasData(churnSeriesArr) ? churnSeriesArr : null,
      mix,
    };
  });

// Re-export horizon type for convenience.
export type { ForecastHorizon } from "./metrics-definitions";
