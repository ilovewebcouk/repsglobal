import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  enumerateDays,
  forecastWindowFor,
  londonDayKey,
} from "./overview-period";
import {
  COUNTED_TIERS,
  TIER_RENEWAL_PENCE,
  LEGACY_AMOUNT_PENCE,
  COUNTED_PAYMENT_EVENT_TYPES,
  TERMINAL_CHURN_STAGES,
  asString,
  type ForecastHorizon,
} from "./metrics-definitions";
import { isActiveSubscription } from "@/lib/members/active-paying-member";


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

  // Lifetime — total cash banked across all time (Stripe-mirror)
  lifetimeRevenuePence: number;

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
    // KPI 1 — Active Members (point-in-time) — STRIPE-MIRROR ONLY (A4b-1)
    //
    // Source of truth = `public.subscriptions` (local mirror synced from
    // Stripe via webhook). Counts one row per user_id with an active or
    // trialing live subscription in a counted tier. Ghost rows (user_id no
    // longer in auth.users) are excluded so deleted accounts can't inflate
    // the tile.
    //
    // Legacy unions over `legacy_stripe_link` + `bd_member_seed` are
    // retired here. BD members in the 44-row setup-link cohort rejoin the
    // count when their subscription is created on card capture. See
    // docs/admin-v2/post-bd-migration-admin-audit-2026-06-28.md.
    // -------------------------------------------------------------------
    const { data: subsRaw, error: subsErr } = await supabase
      .from("subscriptions")
      .select(
        "id, user_id, tier, status, current_period_end, created_at, environment, cancel_at_period_end",
      );
    if (subsErr) throw subsErr;

    // Anti-ghost filter: drop subs whose user_id no longer resolves in auth.
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
      // Lookup is best-effort; without it we keep all subs.
    }

    const subsFiltered = (subsRaw ?? []).filter((s) => {
      const uid = s.user_id ?? null;
      return !uid || authEmailById.has(uid);
    });

    // Dedupe to one survivor per user (keep highest-tier, then most-recent).
    const tierRank: Record<string, number> = { studio: 3, pro: 2, verified: 1 };
    const survivorByUser = new Map<
      string,
      { tier: string; created_at: string | null }
    >();
    for (const s of subsFiltered) {
      if (!isActiveSubscription(s)) continue;
      if (!s.user_id || !s.tier) continue;
      const prev = survivorByUser.get(s.user_id);
      if (!prev) {
        survivorByUser.set(s.user_id, { tier: s.tier, created_at: s.created_at });
        continue;
      }
      const better =
        (tierRank[s.tier] ?? 0) > (tierRank[prev.tier] ?? 0) ||
        ((tierRank[s.tier] ?? 0) === (tierRank[prev.tier] ?? 0) &&
          new Date(s.created_at ?? 0).getTime() >
            new Date(prev.created_at ?? 0).getTime());
      if (better) {
        survivorByUser.set(s.user_id, { tier: s.tier, created_at: s.created_at });
      }
    }

    const totalMembers = survivorByUser.size;
    const mix = { verified: 0, pro: 0, studio: 0 };
    for (const { tier } of survivorByUser.values()) {
      if (tier === "verified") mix.verified += 1;
      else if (tier === "pro") mix.pro += 1;
      else if (tier === "studio") mix.studio += 1;
    }




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

    // Net standalone refund events from the revenue window.
    // `charge.succeeded` rows above only net refunds that already existed at
    // capture time; refunds issued LATER (cross-window) arrive as separate
    // `charge.refunded` events and must be subtracted here.
    const { data: refundsRaw } = await supabase
      .from("payment_events")
      .select("stripe_event_id, payload, created_at")
      .eq("event_type", "charge.refunded")
      .gte("created_at", data.from)
      .lt("created_at", data.to);
    const seenRefunds = new Set<string>();
    for (const ev of refundsRaw ?? []) {
      if (ev.stripe_event_id && seenRefunds.has(ev.stripe_event_id)) continue;
      if (ev.stripe_event_id) seenRefunds.add(ev.stripe_event_id);
      const payload = (ev.payload ?? {}) as Record<string, unknown>;
      const eventData = (payload.data ?? {}) as Record<string, unknown>;
      const obj = (eventData.object ?? {}) as Record<string, unknown>;
      const refunded = typeof obj.amount_refunded === "number" ? obj.amount_refunded : 0;
      if (!refunded || !ev.created_at) continue;
      revenuePence = Math.max(0, revenuePence - refunded);
      const key = londonDayKey(ev.created_at);
      revBuckets.set(key, Math.max(0, (revBuckets.get(key) ?? 0) - refunded));
    }

    // -------------------------------------------------------------------
    // Lifetime Revenue — total cash banked across ALL time.
    // Same dedupe + refund-net logic as KPI 2 but with no date filter.
    // -------------------------------------------------------------------
    let lifetimeRevenuePence = 0;
    {
      const { data: lifePaid } = await supabase
        .from("payment_events")
        .select("stripe_event_id, event_type, payload, created_at")
        .in("event_type", Array.from(COUNTED_PAYMENT_EVENT_TYPES))
        .range(0, 49999);
      const seen = new Set<string>();
      const byKey = new Map<string, { amount: number; rank: number }>();
      for (const ev of lifePaid ?? []) {
        if (ev.stripe_event_id && seen.has(ev.stripe_event_id)) continue;
        if (ev.stripe_event_id) seen.add(ev.stripe_event_id);
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
        if (!amount) continue;
        const objectId = asString(obj.id);
        const paymentIntent = asString(obj.payment_intent);
        const chargeId =
          asString(obj.charge) ??
          (ev.event_type === "charge.succeeded" ? objectId : null);
        const key = paymentIntent
          ? `pi:${paymentIntent}`
          : chargeId
            ? `charge:${chargeId}`
            : objectId
              ? `object:${objectId}`
              : `event:${ev.stripe_event_id ?? ev.created_at}`;
        const rank = ev.event_type === "invoice.payment_succeeded" ? 1 : 2;
        const prev = byKey.get(key);
        if (!prev || rank < prev.rank) byKey.set(key, { amount, rank });
      }
      for (const v of byKey.values()) lifetimeRevenuePence += v.amount;

      const { data: lifeRefunds } = await supabase
        .from("payment_events")
        .select("stripe_event_id, payload")
        .eq("event_type", "charge.refunded")
        .range(0, 49999);
      const seenR = new Set<string>();
      for (const ev of lifeRefunds ?? []) {
        if (ev.stripe_event_id && seenR.has(ev.stripe_event_id)) continue;
        if (ev.stripe_event_id) seenR.add(ev.stripe_event_id);
        const payload = (ev.payload ?? {}) as Record<string, unknown>;
        const eventData = (payload.data ?? {}) as Record<string, unknown>;
        const obj = (eventData.object ?? {}) as Record<string, unknown>;
        const refunded = typeof obj.amount_refunded === "number" ? obj.amount_refunded : 0;
        if (refunded) lifetimeRevenuePence = Math.max(0, lifetimeRevenuePence - refunded);
      }
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

    for (const s of (subsRaw ?? []).filter(isActiveSubscription)) {
      if (!s.current_period_end || !s.user_id) continue;
      // Forecast = cash we EXPECT to receive. Subs scheduled to cancel at
      // period end will NOT renew, so they must not inflate the forecast.
      if ((s as { cancel_at_period_end?: boolean | null }).cancel_at_period_end === true) continue;
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
    // Running-members series: derive joins-per-day from the same mirror
    // survivor set (first sub created_at per surviving user).
    const joinsByDay = new Map<string, number>();
    for (const [uid, survivor] of survivorByUser) {
      void uid;
      if (!survivor.created_at) continue;
      const key = londonDayKey(survivor.created_at);
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
      lifetimeRevenuePence,
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
