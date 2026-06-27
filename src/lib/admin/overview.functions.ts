import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  enumerateDays,
  forecastWindow,
  londonDayKey,
} from "./overview-period";

// Pence per tier per renewal cycle — used for forecast only.
// Mirrors src/lib/billing.ts pricing (Verified £99/yr, Pro £59/mo, Studio £149/mo).
const TIER_RENEWAL_PENCE: Record<string, number> = {
  verified: 9900,
  pro: 5900,
  studio: 14900,
};

const Input = z.object({
  from: z.string(),
  to: z.string(),
});

type DayPoint = { day: string; value: number };

export interface AdminOverviewDTO {
  period: { from: string; to: string };
  forecast: { from: string; to: string };
  // KPI totals
  totalMembers: number;
  totalMembersDelta: number; // net change across period (joined - exited within window)
  revenuePence: number;
  forecastPence: number;
  newRegistrations: number;
  // Series (null when empty so the UI hides sparklines)
  membersSeries: DayPoint[] | null;       // cumulative active members per day
  revenueSeries: DayPoint[] | null;       // £ received per day (pence)
  signupsSeries: DayPoint[] | null;       // confirmed signups per day
  forecastSeries: DayPoint[] | null;      // projected cash due per day (pence)
  mix: { verified: number; pro: number; studio: number };
}

const ACTIVE_STATUSES = ["active", "trialing"];
const COUNTED_TIERS = ["verified", "pro", "studio"];

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

    const fcast = forecastWindow();

    // 1) All live, counted subscriptions (single query, then aggregate in TS).
    const { data: subsRaw, error: subsErr } = await supabase
      .from("subscriptions")
      .select("user_id, tier, status, current_period_end, created_at, environment");
    if (subsErr) throw subsErr;
    const subs = (subsRaw ?? []).filter(
      (s) =>
        s.environment === "live" &&
        ACTIVE_STATUSES.includes(s.status ?? "") &&
        COUNTED_TIERS.includes(s.tier ?? ""),
    );

    // De-dupe per user_id, prefer pro > studio > verified for mix accounting.
    const tierRank: Record<string, number> = { studio: 3, pro: 2, verified: 1 };
    const perUser = new Map<string, { tier: string; created_at: string; current_period_end: string | null }>();
    for (const s of subs) {
      if (!s.user_id) continue;
      const prev = perUser.get(s.user_id);
      if (!prev || (tierRank[s.tier ?? ""] ?? 0) > (tierRank[prev.tier] ?? 0)) {
        perUser.set(s.user_id, {
          tier: s.tier!,
          created_at: s.created_at!,
          current_period_end: s.current_period_end,
        });
      }
    }

    const totalMembers = perUser.size;
    const mix = { verified: 0, pro: 0, studio: 0 };
    for (const v of perUser.values()) {
      if (v.tier === "verified") mix.verified += 1;
      else if (v.tier === "pro") mix.pro += 1;
      else if (v.tier === "studio") mix.studio += 1;
    }

    // 2) Revenue received in period — from payment_events (admin-readable).
    const { data: paymentsRaw, error: payErr } = await supabase
      .from("payment_events")
      .select("stripe_event_id, event_type, payload, created_at")
      .in("event_type", ["invoice.payment_succeeded", "charge.succeeded"])
      .gte("created_at", data.from)
      .lt("created_at", data.to);
    if (payErr) throw payErr;

    const seenEvents = new Set<string>();
    const moneyByPayment = new Map<
      string,
      { amount: number; createdAt: string; rank: number }
    >();

    const asString = (value: unknown) =>
      typeof value === "string" && value.length > 0 ? value : null;

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

      // Net out refunds on standalone charge rows. For subscription payments
      // where Stripe also sends invoice.payment_succeeded, the invoice row is
      // the canonical payment row and this charge row is only used for de-dupe.
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

      // Prefer invoice rows for subscription payments because they carry the
      // customer/user attribution and billing reason. Charge rows stay counted
      // when they are genuinely standalone.
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

    // 3) Forecast — three sources, deduped by user_id (or bd_member_id for
    // legacy rows not yet linked to a Supabase user):
    //   a) Active counted subscriptions whose current_period_end is in window.
    //   b) legacy_stripe_link rows whose access_expires_at is in window — the
    //      same anchor the renewal cron uses to charge £99.
    //   c) bd_member_seed rows whose bd_next_due_date is in window, for
    //      members not yet covered by (a) or (b).
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

    // Seeds index — used to resolve legacy_stripe_link → claimed_user_id and
    // to dedupe pass (c) against passes (a)/(b).
    const { data: seeds } = await supabase
      .from("bd_member_seed")
      .select("bd_member_id, claimed_user_id, bd_next_due_date");
    const seedByMember = new Map<string, { claimed_user_id: string | null; bd_next_due_date: string | null }>();
    for (const s of seeds ?? []) {
      if (s.bd_member_id != null) {
        seedByMember.set(String(s.bd_member_id), {
          claimed_user_id: (s.claimed_user_id as string | null) ?? null,
          bd_next_due_date: (s.bd_next_due_date as string | null) ?? null,
        });
      }
    }

    const LEGACY_AMOUNT = TIER_RENEWAL_PENCE["verified"];

    // (b) legacy_stripe_link
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
      addForecast(l.access_expires_at as string, LEGACY_AMOUNT);
      if (uid) countedUsers.add(uid);
      if (memberKey) countedMembers.add(memberKey);
    }

    // (c) bd_member_seed
    for (const [memberId, seed] of seedByMember) {
      if (!seed.bd_next_due_date) continue;
      const t = new Date(seed.bd_next_due_date).getTime();
      if (t < fcastFrom || t >= fcastTo) continue;
      if (seed.claimed_user_id && countedUsers.has(seed.claimed_user_id)) continue;
      if (countedMembers.has(memberId)) continue;
      addForecast(seed.bd_next_due_date, LEGACY_AMOUNT);
      if (seed.claimed_user_id) countedUsers.add(seed.claimed_user_id);
      countedMembers.add(memberId);
    }

    // 4) New registrations — first paid subscription per user, created in window.
    // (Email-confirmed-only invites without a paid sub don't move the needle here.)
    const sigBuckets = new Map<string, number>();
    let newRegistrations = 0;
    const firstSubAt = new Map<string, string>();
    for (const s of subsRaw ?? []) {
      if (s.environment !== "live") continue;
      if (!COUNTED_TIERS.includes(s.tier ?? "")) continue;
      if (!s.user_id || !s.created_at) continue;
      const prev = firstSubAt.get(s.user_id);
      if (!prev || new Date(s.created_at).getTime() < new Date(prev).getTime()) {
        firstSubAt.set(s.user_id, s.created_at);
      }
    }
    const fromMs = new Date(data.from).getTime();
    const toMs = new Date(data.to).getTime();
    for (const ts of firstSubAt.values()) {
      const t = new Date(ts).getTime();
      if (t < fromMs || t >= toMs) continue;
      newRegistrations += 1;
      const key = londonDayKey(ts);
      sigBuckets.set(key, (sigBuckets.get(key) ?? 0) + 1);
    }

    // 5) Members series — cumulative active members joined-by-day (best-effort
    // using subscription.created_at as the join timestamp; this stays
    // self-consistent without a historical state table).
    const days = enumerateDays(data.from, data.to);
    const joinsByDay = new Map<string, number>();
    for (const v of perUser.values()) {
      const key = londonDayKey(v.created_at);
      joinsByDay.set(key, (joinsByDay.get(key) ?? 0) + 1);
    }
    // Members at start of period = total - (joins inside period)
    let joinsInPeriod = 0;
    for (const d of days) joinsInPeriod += joinsByDay.get(d) ?? 0;
    let running = totalMembers - joinsInPeriod;
    const membersSeries: DayPoint[] = days.map((d) => {
      running += joinsByDay.get(d) ?? 0;
      return { day: d, value: running };
    });
    const totalMembersDelta = joinsInPeriod; // net joins approximation

    // Build day-aligned series, replacing all-zero series with null so UI can hide.
    const revenueSeriesArr: DayPoint[] = days.map((d) => ({
      day: d,
      value: revBuckets.get(d) ?? 0,
    }));
    const signupsSeriesArr: DayPoint[] = days.map((d) => ({
      day: d,
      value: sigBuckets.get(d) ?? 0,
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
      totalMembersDelta,
      revenuePence,
      forecastPence,
      newRegistrations,
      membersSeries: membersSeries.length && totalMembers > 0 ? membersSeries : null,
      revenueSeries: hasData(revenueSeriesArr) ? revenueSeriesArr : null,
      signupsSeries: hasData(signupsSeriesArr) ? signupsSeriesArr : null,
      forecastSeries: hasData(forecastSeriesArr) ? forecastSeriesArr : null,
      mix,
    };
  });
