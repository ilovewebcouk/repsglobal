// Admin Reconciliation server functions.
//
// These mirror the EXACT predicates used by `getAdminOverview`
// in `src/lib/admin/overview.functions.ts`. The whole point of this
// module is to surface the underlying rows + the dashboard's
// inclusion decision per row, so any KPI total can be traced back
// to source data. DO NOT diverge from the dashboard predicates here
// — if a discrepancy shows up, fix the dashboard in a separate task.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { forecastWindow } from "./overview-period";

const Input = z.object({
  from: z.string(),
  to: z.string(),
});

// Mirror src/lib/admin/overview.functions.ts (TIER_RENEWAL_PENCE).
const TIER_RENEWAL_PENCE: Record<string, number> = {
  verified: 9900,
  pro: 5900,
  studio: 14900,
};

// ---- Shared types -----------------------------------------------------------

export interface RevenueRow {
  id: string;
  stripe_event_id: string | null;
  event_type: string;
  processed_at: string | null;
  created_at: string;
  customer_id: string | null;
  subscription_id: string | null;
  invoice_id: string | null;
  payment_intent: string | null;
  charge_id: string | null;
  livemode: boolean | null;
  currency: string | null;
  amount_paid: number | null;
  amount: number | null;
  amount_refunded: number | null;
  refunded: boolean | null;
  payment_key: string;
  calculated_amount_used_by_dashboard: number; // pence (0 when excluded)
  included_in_total: boolean;
  exclusion_reason: string | null;
}

export interface RevenueGroup {
  payment_key: string;
  canonical_event_id: string | null;
  canonical_amount: number; // pence counted by dashboard for this group
  rows: RevenueRow[];
}

export interface RevenueReportDTO {
  period: { from: string; to: string };
  raw_event_count: number;
  distinct_event_count: number;
  total_revenue_pence: number;
  groups: RevenueGroup[];
}

export interface MemberRow {
  user_id: string;
  email: string | null;
  subscription_id: string;
  tier: string | null;
  status: string | null;
  environment: string | null;
  created_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  cancelled_at: string | null;
  included_in_member_count: boolean;
  exclusion_reason: string | null;
}

export interface MemberReportDTO {
  total_members: number; // distinct users counted by dashboard
  rows: MemberRow[];
}

export interface RegistrationRow {
  user_id: string;
  email: string | null;
  profile_created_at: string | null;
  email_confirmed_at: string | null;
  first_paid_subscription_at: string | null;
  included_in_registration_count: boolean;
  exclusion_reason: string | null;
}

export interface RegistrationReportDTO {
  period: { from: string; to: string };
  total_registrations: number;
  rows: RegistrationRow[];
}

// ---- Helpers (mirror overview.functions.ts) --------------------------------

const ACTIVE_STATUSES = ["active", "trialing"];
const COUNTED_TIERS = ["verified", "pro", "studio"];

const asString = (v: unknown) =>
  typeof v === "string" && v.length > 0 ? v : null;

const asNumber = (v: unknown) => (typeof v === "number" ? v : null);

const asBool = (v: unknown) => (typeof v === "boolean" ? v : null);

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

// =============================================================================
// Revenue reconciliation
// =============================================================================

export const getRevenueReconciliation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<RevenueReportDTO> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    // Query the SAME table + window the dashboard uses. Pull every row
    // in the window regardless of event_type so we can show exclusions.
    const { data: rawRows, error } = await supabase
      .from("payment_events")
      .select(
        "id, stripe_event_id, event_type, processed_at, created_at, payload",
      )
      .gte("created_at", data.from)
      .lt("created_at", data.to)
      .order("created_at", { ascending: true });
    if (error) throw error;

    // Replay the dashboard's dedupe/skip logic. Keep per-row provenance.
    type Decision = {
      key: string;
      amount: number; // pence the dashboard would attribute to this row
      rank: number;
      excluded: string | null;
    };
    const decisions = new Map<string, Decision>(); // row id -> decision
    const seenEvents = new Set<string>();
    const moneyByPayment = new Map<
      string,
      { row_id: string; amount: number; rank: number }
    >();

    const COUNTED_EVENT_TYPES = new Set([
      "invoice.payment_succeeded",
      "charge.succeeded",
    ]);

    const enriched: RevenueRow[] = [];

    for (const ev of rawRows ?? []) {
      const payload = (ev.payload ?? {}) as Record<string, unknown>;
      const eventData = (payload.data ?? {}) as Record<string, unknown>;
      const obj = (eventData.object ?? {}) as Record<string, unknown>;

      const customer_id = asString(obj.customer);
      const subscription_id = asString(obj.subscription);
      const payment_intent = asString(obj.payment_intent);
      const objectId = asString(obj.id);
      const charge_id =
        asString(obj.charge) ??
        (ev.event_type === "charge.succeeded" ? objectId : null);
      const invoice_id =
        asString(obj.invoice) ??
        (ev.event_type === "invoice.payment_succeeded" ? objectId : null);
      const livemode = asBool(obj.livemode);
      const currency = asString(obj.currency);
      const amount_paid = asNumber(obj.amount_paid);
      const amount = asNumber(obj.amount);
      const amount_refunded = asNumber(obj.amount_refunded);
      const refunded = asBool(obj.refunded);

      // ---- Dashboard inclusion decision (verbatim) --------------------------
      let excluded: string | null = null;
      let usedAmount = 0;
      let paymentKey = "";
      let rank = 99;

      if (!COUNTED_EVENT_TYPES.has(ev.event_type)) {
        excluded = `event_type "${ev.event_type}" is not counted (dashboard only sums invoice.payment_succeeded and charge.succeeded)`;
      } else if (ev.stripe_event_id && seenEvents.has(ev.stripe_event_id)) {
        excluded = `duplicate stripe_event_id ${ev.stripe_event_id} already counted`;
      } else {
        if (ev.stripe_event_id) seenEvents.add(ev.stripe_event_id);

        let amt =
          typeof obj.amount_paid === "number"
            ? obj.amount_paid
            : typeof obj.amount === "number"
              ? obj.amount
              : 0;

        if (ev.event_type === "charge.succeeded") {
          if (obj.refunded === true) amt = 0;
          else if (typeof obj.amount_refunded === "number") {
            amt = Math.max(0, amt - obj.amount_refunded);
          }
        }

        if (!amt || !ev.created_at) {
          excluded = !ev.created_at
            ? "row has no created_at"
            : "amount resolved to 0 (refunded or missing)";
        } else {
          paymentKey = payment_intent
            ? `pi:${payment_intent}`
            : charge_id
              ? `charge:${charge_id}`
              : objectId
                ? `object:${objectId}`
                : `event:${ev.stripe_event_id ?? ev.created_at}`;
          rank = ev.event_type === "invoice.payment_succeeded" ? 1 : 2;
          const prev = moneyByPayment.get(paymentKey);
          if (!prev || rank < prev.rank) {
            // This row becomes (or replaces) the canonical row for the payment key.
            if (prev) {
              // Mark the previous winner as excluded (deduped).
              const prevDecision = decisions.get(prev.row_id)!;
              prevDecision.excluded = `deduped: superseded by ${ev.event_type} for payment_key ${paymentKey}`;
              prevDecision.amount = 0;
            }
            moneyByPayment.set(paymentKey, {
              row_id: ev.id,
              amount: amt,
              rank,
            });
            usedAmount = amt;
          } else {
            excluded = `deduped: payment_key ${paymentKey} already counted via ${prev.rank === 1 ? "invoice.payment_succeeded" : "charge.succeeded"}`;
            usedAmount = 0;
          }
        }
      }

      decisions.set(ev.id, {
        key: paymentKey || `unkeyed:${ev.id}`,
        amount: usedAmount,
        rank,
        excluded,
      });

      enriched.push({
        id: ev.id,
        stripe_event_id: ev.stripe_event_id,
        event_type: ev.event_type,
        processed_at: ev.processed_at,
        created_at: ev.created_at,
        customer_id,
        subscription_id,
        invoice_id,
        payment_intent,
        charge_id,
        livemode,
        currency,
        amount_paid,
        amount,
        amount_refunded,
        refunded,
        payment_key: paymentKey || `unkeyed:${ev.id}`,
        calculated_amount_used_by_dashboard: 0, // filled below
        included_in_total: false, // filled below
        exclusion_reason: null, // filled below
      });
    }

    // Stitch the final decisions back onto each row (decisions may have been
    // updated when a later row superseded an earlier one).
    let totalRevenue = 0;
    const byKey = new Map<string, RevenueGroup>();
    for (const r of enriched) {
      const dec = decisions.get(r.id)!;
      r.calculated_amount_used_by_dashboard = dec.amount;
      r.included_in_total = dec.excluded === null && dec.amount > 0;
      r.exclusion_reason = dec.excluded;
      if (r.included_in_total) totalRevenue += dec.amount;

      let group = byKey.get(r.payment_key);
      if (!group) {
        group = {
          payment_key: r.payment_key,
          canonical_event_id: null,
          canonical_amount: 0,
          rows: [],
        };
        byKey.set(r.payment_key, group);
      }
      group.rows.push(r);
      if (r.included_in_total) {
        group.canonical_event_id = r.id;
        group.canonical_amount = r.calculated_amount_used_by_dashboard;
      }
    }

    const groups = Array.from(byKey.values()).sort((a, b) => {
      const ad = a.rows[0]?.created_at ?? "";
      const bd = b.rows[0]?.created_at ?? "";
      return bd.localeCompare(ad);
    });

    const distinct = new Set(
      enriched.map((r) => r.stripe_event_id).filter(Boolean) as string[],
    );

    return {
      period: { from: data.from, to: data.to },
      raw_event_count: enriched.length,
      distinct_event_count: distinct.size,
      total_revenue_pence: totalRevenue,
      groups,
    };
  });

// =============================================================================
// Membership reconciliation
// =============================================================================

export const getMembershipReconciliation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MemberReportDTO> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: subsRaw, error } = await supabase
      .from("subscriptions")
      .select(
        "id, user_id, tier, status, environment, created_at, current_period_end, cancel_at_period_end, updated_at, metadata",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Replay dashboard membership predicates exactly.
    // 1) environment === 'live'
    // 2) status in ACTIVE_STATUSES
    // 3) tier in COUNTED_TIERS
    // 4) one user per user_id; tier rank pro > studio > verified (matches getAdminOverview)
    const tierRank: Record<string, number> = {
      studio: 3,
      pro: 2,
      verified: 1,
    };

    // First pass — figure out which (user_id) wins so we can mark losers.
    const winnerByUser = new Map<string, string>(); // user_id -> winning subscription id
    const winningTierByUser = new Map<string, string>();
    for (const s of subsRaw ?? []) {
      const liveAndActive =
        s.environment === "live" &&
        ACTIVE_STATUSES.includes(s.status ?? "") &&
        COUNTED_TIERS.includes(s.tier ?? "");
      if (!liveAndActive || !s.user_id) continue;
      const currentWinTier = winningTierByUser.get(s.user_id);
      if (
        !currentWinTier ||
        (tierRank[s.tier ?? ""] ?? 0) > (tierRank[currentWinTier] ?? 0)
      ) {
        winnerByUser.set(s.user_id, s.id);
        winningTierByUser.set(s.user_id, s.tier!);
      }
    }

    // Lookup emails via admin client (admin-only page).
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const userIds = Array.from(
      new Set((subsRaw ?? []).map((s) => s.user_id).filter(Boolean) as string[]),
    );
    const emailByUser = new Map<string, string>();
    // Batch via auth admin API (paged).
    let page = 1;
    while (page < 50) {
      const { data: users, error: uErr } =
        await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (uErr) break;
      for (const u of users.users) {
        if (u.email) emailByUser.set(u.id, u.email);
      }
      if (users.users.length < 200) break;
      page += 1;
    }

    const rows: MemberRow[] = (subsRaw ?? []).map((s) => {
      let included = false;
      let reason: string | null = null;
      if (s.environment !== "live")
        reason = `environment="${s.environment}" (dashboard requires "live")`;
      else if (!ACTIVE_STATUSES.includes(s.status ?? ""))
        reason = `status="${s.status}" (dashboard requires active or trialing)`;
      else if (!COUNTED_TIERS.includes(s.tier ?? ""))
        reason = `tier="${s.tier}" (dashboard counts only verified/pro/studio)`;
      else if (winnerByUser.get(s.user_id ?? "") !== s.id)
        reason = `superseded by another live+active subscription for the same user (winner: ${winnerByUser.get(s.user_id ?? "") ?? "n/a"})`;
      else included = true;

      const meta = (s.metadata ?? {}) as Record<string, unknown>;
      const cancelledAt =
        asString(meta.cancelled_at) ?? asString(meta.canceled_at);

      return {
        user_id: s.user_id ?? "",
        email: emailByUser.get(s.user_id ?? "") ?? null,
        subscription_id: s.id,
        tier: s.tier,
        status: s.status,
        environment: s.environment,
        created_at: s.created_at,
        current_period_end: s.current_period_end,
        cancel_at_period_end: s.cancel_at_period_end,
        cancelled_at: cancelledAt,
        included_in_member_count: included,
        exclusion_reason: reason,
      };
    });

    return {
      total_members: winnerByUser.size,
      rows,
    };
  });

// =============================================================================
// Registrations reconciliation
// =============================================================================

export const getRegistrationsReconciliation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<RegistrationReportDTO> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    // Dashboard predicate: first paid subscription per user, created_at
    // within [from, to), where environment === 'live' AND tier in COUNTED_TIERS.
    const { data: subsRaw, error } = await supabase
      .from("subscriptions")
      .select("user_id, tier, environment, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const firstPaidAt = new Map<string, string>();
    for (const s of subsRaw ?? []) {
      if (s.environment !== "live") continue;
      if (!COUNTED_TIERS.includes(s.tier ?? "")) continue;
      if (!s.user_id || !s.created_at) continue;
      const prev = firstPaidAt.get(s.user_id);
      if (
        !prev ||
        new Date(s.created_at).getTime() < new Date(prev).getTime()
      ) {
        firstPaidAt.set(s.user_id, s.created_at);
      }
    }

    const fromMs = new Date(data.from).getTime();
    const toMs = new Date(data.to).getTime();

    // Pull every profile so we can show inclusions AND exclusions.
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (pErr) throw pErr;

    // Email + email_confirmed_at via admin client.
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const emailByUser = new Map<string, string>();
    const confirmedByUser = new Map<string, string | null>();
    let page = 1;
    while (page < 50) {
      const { data: users, error: uErr } =
        await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (uErr) break;
      for (const u of users.users) {
        if (u.email) emailByUser.set(u.id, u.email);
        confirmedByUser.set(u.id, u.email_confirmed_at ?? null);
      }
      if (users.users.length < 200) break;
      page += 1;
    }

    // Build the candidate set: anyone with a profile OR with a paid sub.
    const allUserIds = new Set<string>([
      ...(profiles ?? []).map((p) => p.id),
      ...firstPaidAt.keys(),
    ]);

    let total = 0;
    const rows: RegistrationRow[] = [];
    for (const uid of allUserIds) {
      const firstAt = firstPaidAt.get(uid) ?? null;
      const profile = (profiles ?? []).find((p) => p.id === uid);

      let included = false;
      let reason: string | null = null;
      if (!firstAt) {
        reason =
          "no paid subscription on file (dashboard only counts users with a first paid subscription)";
      } else {
        const t = new Date(firstAt).getTime();
        if (t < fromMs || t >= toMs) {
          reason = `first paid subscription at ${firstAt} is outside the selected window`;
        } else {
          included = true;
          total += 1;
        }
      }

      rows.push({
        user_id: uid,
        email: emailByUser.get(uid) ?? null,
        profile_created_at: profile?.created_at ?? null,
        email_confirmed_at: confirmedByUser.get(uid) ?? null,
        first_paid_subscription_at: firstAt,
        included_in_registration_count: included,
        exclusion_reason: reason,
      });
    }

    rows.sort((a, b) => {
      // included first, then by first_paid desc, then profile_created desc
      if (a.included_in_registration_count !== b.included_in_registration_count)
        return a.included_in_registration_count ? -1 : 1;
      const ab = a.first_paid_subscription_at ?? a.profile_created_at ?? "";
      const bb = b.first_paid_subscription_at ?? b.profile_created_at ?? "";
      return bb.localeCompare(ab);
    });

    return {
      period: { from: data.from, to: data.to },
      total_registrations: total,
      rows,
    };
  });

// =============================================================================
// Forecast revenue reconciliation
// =============================================================================
//
// Mirrors getAdminOverview forecast logic:
//   * Sum of active+counted subscriptions whose current_period_end falls in
//     the next-30-days window [now, today+30 London midnight). Amount per
//     sub = TIER_RENEWAL_PENCE[tier].
//   * Plus bd_migration rows with status in ('seeded','pending') whose
//     bd_renewal_date falls in the same window. Amount = bd_price_pence,
//     fallback to TIER_RENEWAL_PENCE[target_tier].

export interface ForecastSubRow {
  user_id: string | null;
  email: string | null;
  subscription_id: string;
  tier: string | null;
  status: string | null;
  environment: string | null;
  current_period_end: string | null;
  forecast_amount_pence: number;
  included_in_forecast: boolean;
  exclusion_reason: string | null;
}

export interface ForecastMigrationRow {
  id: string;
  bd_renewal_date: string | null;
  status: string | null;
  target_tier: string | null;
  bd_price_pence: number | null;
  forecast_amount_pence: number;
  included_in_forecast: boolean;
  exclusion_reason: string | null;
}

export interface ForecastReportDTO {
  window: { from: string; to: string };
  tier_pricing_pence: Record<string, number>;
  total_forecast_pence: number;
  subs_total_pence: number;
  migrations_total_pence: number;
  subs: ForecastSubRow[];
  migrations: ForecastMigrationRow[];
}

export const getForecastReconciliation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ForecastReportDTO> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const fcast = forecastWindow();
    const fromMs = new Date(fcast.from).getTime();
    const toMs = new Date(fcast.to).getTime();

    // ---- Subscriptions ------------------------------------------------------
    const { data: subsRaw, error: sErr } = await supabase
      .from("subscriptions")
      .select(
        "id, user_id, tier, status, environment, current_period_end",
      )
      .order("current_period_end", { ascending: true });
    if (sErr) throw sErr;

    // Email lookup for context.
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const emailByUser = new Map<string, string>();
    let page = 1;
    while (page < 50) {
      const { data: users, error: uErr } =
        await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (uErr) break;
      for (const u of users.users) {
        if (u.email) emailByUser.set(u.id, u.email);
      }
      if (users.users.length < 200) break;
      page += 1;
    }

    const subs: ForecastSubRow[] = (subsRaw ?? []).map((s) => {
      let reason: string | null = null;
      if (s.environment !== "live")
        reason = `environment="${s.environment}" (forecast requires "live")`;
      else if (!ACTIVE_STATUSES.includes(s.status ?? ""))
        reason = `status="${s.status}" (forecast requires active or trialing)`;
      else if (!COUNTED_TIERS.includes(s.tier ?? ""))
        reason = `tier="${s.tier}" (forecast counts only verified/pro/studio)`;
      else if (!s.current_period_end)
        reason = "current_period_end is null (no renewal date to schedule)";
      else {
        const t = new Date(s.current_period_end).getTime();
        if (t < fromMs || t >= toMs)
          reason = `current_period_end ${s.current_period_end} is outside the next-30-day window`;
      }
      const amount =
        reason === null ? TIER_RENEWAL_PENCE[s.tier ?? ""] ?? 0 : 0;
      return {
        user_id: s.user_id,
        email: emailByUser.get(s.user_id ?? "") ?? null,
        subscription_id: s.id,
        tier: s.tier,
        status: s.status,
        environment: s.environment,
        current_period_end: s.current_period_end,
        forecast_amount_pence: amount,
        included_in_forecast: reason === null && amount > 0,
        exclusion_reason:
          reason ??
          (amount === 0
            ? `no TIER_RENEWAL_PENCE mapping for tier="${s.tier}"`
            : null),
      };
    });

    // ---- bd_migration scheduled renewals ------------------------------------
    const { data: migs, error: mErr } = await supabase
      .from("bd_migration")
      .select("id, bd_renewal_date, status, target_tier, bd_price_pence");
    if (mErr) throw mErr;

    const migrations: ForecastMigrationRow[] = (migs ?? []).map((m) => {
      let reason: string | null = null;
      if (!["seeded", "pending"].includes(m.status ?? ""))
        reason = `status="${m.status}" (forecast counts only seeded/pending)`;
      else if (!m.bd_renewal_date)
        reason = "bd_renewal_date is null";
      else {
        const t = new Date(m.bd_renewal_date).getTime();
        if (t < fromMs || t >= toMs)
          reason = `bd_renewal_date ${m.bd_renewal_date} is outside the next-30-day window`;
      }
      const amount =
        reason === null
          ? m.bd_price_pence ??
            TIER_RENEWAL_PENCE[m.target_tier ?? ""] ??
            0
          : 0;
      return {
        id: m.id,
        bd_renewal_date: m.bd_renewal_date,
        status: m.status,
        target_tier: m.target_tier,
        bd_price_pence: m.bd_price_pence,
        forecast_amount_pence: amount,
        included_in_forecast: reason === null && amount > 0,
        exclusion_reason:
          reason ??
          (amount === 0
            ? `no price (bd_price_pence null and no TIER_RENEWAL_PENCE for target_tier="${m.target_tier}")`
            : null),
      };
    });

    const subsTotal = subs.reduce(
      (acc, r) => acc + (r.included_in_forecast ? r.forecast_amount_pence : 0),
      0,
    );
    const migsTotal = migrations.reduce(
      (acc, r) => acc + (r.included_in_forecast ? r.forecast_amount_pence : 0),
      0,
    );

    // Sort: included first, then by date ascending.
    const sortRows = <T extends { included_in_forecast: boolean }>(
      arr: T[],
      dateOf: (r: T) => string | null,
    ) =>
      arr.sort((a, b) => {
        if (a.included_in_forecast !== b.included_in_forecast)
          return a.included_in_forecast ? -1 : 1;
        return (dateOf(a) ?? "").localeCompare(dateOf(b) ?? "");
      });
    sortRows(subs, (r) => r.current_period_end);
    sortRows(migrations, (r) => r.bd_renewal_date);

    return {
      window: { from: fcast.from, to: fcast.to },
      tier_pricing_pence: TIER_RENEWAL_PENCE,
      total_forecast_pence: subsTotal + migsTotal,
      subs_total_pence: subsTotal,
      migrations_total_pence: migsTotal,
      subs,
      migrations,
    };
  });
