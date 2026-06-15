// Admin reads for /admin/payments. Two lenses, never blended:
//   - subscriptions = REPs revenue (MRR, churn, failed payments)
//   - marketplace   = Connect activity (volume, accounts, bookings)
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// Monthly price in pence per (tier, period).
function monthlyPence(tier: string, period: string | null): number {
  if (tier === "verified") return Math.round(9900 / 12); // £99/yr -> £8.25/mo
  if (tier === "pro") return 5900;
  if (tier === "studio") return 14900;
  return 0;
}

export type SubscriptionMetrics = {
  mrrPence: number;
  arrPence: number;
  activeCount: number;
  newThisMonth: number;
  pastDueCount: number;
  canceledThisMonth: number;
  byTier: { tier: string; count: number; mrrPence: number }[];
  failedPayments: { userId: string; email: string | null; tier: string; status: string; periodEnd: string | null }[];
  recentEvents: { id: string; eventType: string; createdAt: string; userId: string | null }[];
};

export const getSubscriptionMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionMetrics> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, tier, billing_period, status, created_at, cancel_at_period_end, current_period_end");

    const all = (subs ?? []) as any[];
    const liveStatuses = new Set(["active", "trialing"]);
    const live = all.filter((s) => liveStatuses.has(s.status) && s.tier !== "free");

    let mrr = 0;
    const tierMap = new Map<string, { count: number; mrr: number }>();
    for (const s of live) {
      const m = monthlyPence(s.tier, s.billing_period);
      mrr += m;
      const cur = tierMap.get(s.tier) ?? { count: 0, mrr: 0 };
      cur.count += 1;
      cur.mrr += m;
      tierMap.set(s.tier, cur);
    }

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const newThisMonth = all.filter(
      (s) => s.tier !== "free" && new Date(s.created_at) >= monthStart,
    ).length;
    const pastDueCount = all.filter((s) => ["past_due", "unpaid"].includes(s.status)).length;
    const canceledThisMonth = all.filter(
      (s) => s.status === "canceled" && s.current_period_end && new Date(s.current_period_end) >= monthStart,
    ).length;

    // Failed payments — fetch emails via profiles
    const failed = all.filter((s) => ["past_due", "unpaid"].includes(s.status)).slice(0, 20);
    const failedIds = failed.map((s) => s.user_id);
    let emailMap = new Map<string, string | null>();
    if (failedIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles").select("id, full_name").in("id", failedIds);
      for (const p of (profiles ?? []) as any[]) emailMap.set(p.id, p.full_name);
    }

    const { data: events } = await supabaseAdmin
      .from("payment_events")
      .select("id, event_type, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(15);

    return {
      mrrPence: mrr,
      arrPence: mrr * 12,
      activeCount: live.length,
      newThisMonth,
      pastDueCount,
      canceledThisMonth,
      byTier: [...tierMap.entries()]
        .map(([tier, v]) => ({ tier, count: v.count, mrrPence: v.mrr }))
        .sort((a, b) => b.mrrPence - a.mrrPence),
      failedPayments: failed.map((s) => ({
        userId: s.user_id,
        email: emailMap.get(s.user_id) ?? null,
        tier: s.tier,
        status: s.status,
        periodEnd: s.current_period_end,
      })),
      recentEvents: ((events ?? []) as any[]).map((e) => ({
        id: e.id, eventType: e.event_type, createdAt: e.created_at, userId: e.user_id,
      })),
    };
  });

export type MarketplaceMetrics = {
  connectedActive: number;
  connectedPending: number;
  connectedRestricted: number;
  grossVolume30dPence: number;
  bookings30d: number;
  refundRate: number;
  disputeRate: number;
  topPros: { professionalId: string; fullName: string | null; slug: string | null; volumePence: number; bookings: number; chargesEnabled: boolean }[];
  recentBookings: {
    id: string; createdAt: string; status: string; amountPence: number; currency: string;
    proName: string | null; proSlug: string | null; serviceTitle: string | null; clientEmail: string;
  }[];
  connectedAccounts: {
    professionalId: string; fullName: string | null; slug: string | null;
    chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean;
    country: string | null; connectedAt: string; disconnectedAt: string | null;
  }[];
};

export const getMarketplaceMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MarketplaceMetrics> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireAdmin(supabaseAdmin, context.userId);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [{ data: accts }, { data: bookings }] = await Promise.all([
      supabaseAdmin.from("connected_accounts").select("professional_id, charges_enabled, payouts_enabled, details_submitted, country, connected_at, disconnected_at"),
      supabaseAdmin.from("bookings").select("id, professional_id, service_title, client_email, amount_pence, currency, status, created_at").gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
    ]);

    const acctRows = (accts ?? []) as any[];
    const connectedActive = acctRows.filter((a) => a.charges_enabled && !a.disconnected_at).length;
    const connectedPending = acctRows.filter((a) => !a.details_submitted && !a.disconnected_at).length;
    const connectedRestricted = acctRows.filter((a) => a.details_submitted && !a.charges_enabled && !a.disconnected_at).length;

    const bookingRows = (bookings ?? []) as any[];
    const paid = bookingRows.filter((b) => ["paid", "refunded", "partially_refunded", "disputed"].includes(b.status));
    const grossVolume = paid.reduce((sum, b) => sum + (b.amount_pence ?? 0), 0);
    const refunded = bookingRows.filter((b) => b.status === "refunded" || b.status === "partially_refunded").length;
    const disputed = bookingRows.filter((b) => b.status === "disputed").length;
    const denom = Math.max(paid.length, 1);

    // Top pros by volume
    const proAgg = new Map<string, { volume: number; count: number }>();
    for (const b of paid) {
      const cur = proAgg.get(b.professional_id) ?? { volume: 0, count: 0 };
      cur.volume += b.amount_pence ?? 0;
      cur.count += 1;
      proAgg.set(b.professional_id, cur);
    }
    const allProIds = Array.from(new Set<string>([
      ...acctRows.map((a) => a.professional_id),
      ...proAgg.keys(),
      ...bookingRows.map((b) => b.professional_id),
    ]));
    let nameMap = new Map<string, { name: string | null; slug: string | null }>();
    if (allProIds.length) {
      const [{ data: pros }, { data: profs }] = await Promise.all([
        supabaseAdmin.from("professionals").select("id, slug").in("id", allProIds),
        supabaseAdmin.from("profiles").select("id, full_name").in("id", allProIds),
      ]);
      const slugMap = new Map<string, string | null>();
      for (const p of (pros ?? []) as any[]) slugMap.set(p.id, p.slug);
      for (const p of (profs ?? []) as any[]) nameMap.set(p.id, { name: p.full_name, slug: slugMap.get(p.id) ?? null });
      for (const id of allProIds) if (!nameMap.has(id)) nameMap.set(id, { name: null, slug: slugMap.get(id) ?? null });
    }
    const chargesEnabledMap = new Map(acctRows.map((a) => [a.professional_id, a.charges_enabled]));

    const topPros = [...proAgg.entries()]
      .map(([pid, v]) => ({
        professionalId: pid,
        fullName: nameMap.get(pid)?.name ?? null,
        slug: nameMap.get(pid)?.slug ?? null,
        volumePence: v.volume,
        bookings: v.count,
        chargesEnabled: !!chargesEnabledMap.get(pid),
      }))
      .sort((a, b) => b.volumePence - a.volumePence)
      .slice(0, 10);

    return {
      connectedActive,
      connectedPending,
      connectedRestricted,
      grossVolume30dPence: grossVolume,
      bookings30d: bookingRows.length,
      refundRate: refunded / denom,
      disputeRate: disputed / denom,
      topPros,
      recentBookings: bookingRows.slice(0, 20).map((b) => ({
        id: b.id,
        createdAt: b.created_at,
        status: b.status,
        amountPence: b.amount_pence,
        currency: b.currency,
        proName: nameMap.get(b.professional_id)?.name ?? null,
        proSlug: nameMap.get(b.professional_id)?.slug ?? null,
        serviceTitle: b.service_title,
        clientEmail: b.client_email,
      })),
      connectedAccounts: acctRows
        .sort((a, b) => new Date(b.connected_at).getTime() - new Date(a.connected_at).getTime())
        .map((a) => ({
          professionalId: a.professional_id,
          fullName: nameMap.get(a.professional_id)?.name ?? null,
          slug: nameMap.get(a.professional_id)?.slug ?? null,
          chargesEnabled: a.charges_enabled,
          payoutsEnabled: a.payouts_enabled,
          detailsSubmitted: a.details_submitted,
          country: a.country,
          connectedAt: a.connected_at,
          disconnectedAt: a.disconnected_at,
        })),
    };
  });
