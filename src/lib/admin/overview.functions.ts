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
    let revenuePence = 0;
    const revBuckets = new Map<string, number>();
    for (const ev of paymentsRaw ?? []) {
      if (ev.stripe_event_id && seenEvents.has(ev.stripe_event_id)) continue;
      if (ev.stripe_event_id) seenEvents.add(ev.stripe_event_id);
      const payload = (ev.payload ?? {}) as Record<string, unknown>;
      // Stripe events are stored verbatim — the money lives at
      // payload.data.object.amount_paid (invoices) / .amount (charges).
      const data = (payload.data ?? {}) as Record<string, unknown>;
      const obj = ((data.object ?? {}) as Record<string, unknown>);
      // Stripe fires BOTH charge.succeeded and invoice.payment_succeeded for
      // a subscription invoice — same money, two events. Count the invoice
      // event for any invoiced payment, and only count standalone charges
      // (no associated invoice) on the charge.succeeded rail.
      if (ev.event_type === "charge.succeeded" && obj.invoice) continue;
      let amount =
        typeof obj.amount_paid === "number"
          ? (obj.amount_paid as number)
          : typeof obj.amount === "number"
            ? (obj.amount as number)
            : 0;
      // Net out refunds on charge.succeeded so the tile stays honest.
      if (ev.event_type === "charge.succeeded") {
        if (obj.refunded === true) amount = 0;
        else if (typeof obj.amount_refunded === "number") {
          amount = Math.max(0, amount - (obj.amount_refunded as number));
        }
      }
      if (!amount) continue;
      revenuePence += amount;
      const key = londonDayKey(ev.created_at!);
      revBuckets.set(key, (revBuckets.get(key) ?? 0) + amount);
    }

    // 3) Forecast — active subs renewing in next 30 days, plus approved migration charges.
    const fcastFrom = new Date(fcast.from).getTime();
    const fcastTo = new Date(fcast.to).getTime();
    let forecastPence = 0;
    const fcastBuckets = new Map<string, number>();
    for (const s of subs) {
      if (!s.current_period_end) continue;
      const t = new Date(s.current_period_end).getTime();
      if (t < fcastFrom || t >= fcastTo) continue;
      const amount = TIER_RENEWAL_PENCE[s.tier!] ?? 0;
      if (!amount) continue;
      forecastPence += amount;
      const key = londonDayKey(s.current_period_end);
      fcastBuckets.set(key, (fcastBuckets.get(key) ?? 0) + amount);
    }

    // bd_migration scheduled renewals (status ready/approved with renewal date in window)
    const { data: migs } = await supabase
      .from("bd_migration")
      .select("bd_renewal_date, status, target_tier, bd_price_pence")
      .in("status", ["seeded", "pending"]);
    for (const m of migs ?? []) {
      if (!m.bd_renewal_date) continue;
      const t = new Date(m.bd_renewal_date).getTime();
      if (t < fcastFrom || t >= fcastTo) continue;
      const amount = m.bd_price_pence ?? TIER_RENEWAL_PENCE[m.target_tier ?? ""] ?? 0;
      if (!amount) continue;
      forecastPence += amount;
      const key = londonDayKey(new Date(m.bd_renewal_date).toISOString());
      fcastBuckets.set(key, (fcastBuckets.get(key) ?? 0) + amount);
    }

    // 4) New registrations — confirmed signups (admin-only SECURITY DEFINER RPC).
    const { data: signupsRaw, error: signupsErr } = await supabase.rpc(
      "count_confirmed_signups",
      { _from: data.from, _to: data.to },
    );
    if (signupsErr) throw signupsErr;
    const sigBuckets = new Map<string, number>();
    let newRegistrations = 0;
    for (const row of (signupsRaw ?? []) as { day: string; signups: number }[]) {
      sigBuckets.set(row.day, row.signups);
      newRegistrations += row.signups;
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
