// Admin v2 — Subscription Data Contract (canonical resolver).
//
// SINGLE SOURCE OF TRUTH for "what subscription does this member have, right
// now, for the purposes of admin display and entitlement?".
//
// Rules:
//   1. Active entitlement is derived from the `subscriptions` mirror or the
//      live Stripe mirror only. `legacy_stripe_link` and `bd_member_seed`
//      are archive/debug tables and MUST NOT influence active billing state.
//   2. When live Stripe mirror is available it wins (`source = "stripe-live"`).
//      When only the local row is available we fall back to it
//      (`source = "local-mirror"`) — this is acceptable, not a warning.
//   3. Tier preference order: Stripe price/product/lookup_key mapping when
//      Stripe data is available, then local `subscriptions.tier`. The
//      user-facing label always maps internal `verified` → "Core".
//   4. Discrepancies between Stripe and local (status / period / tier)
//      surface as `discrepancies` so the UI can show an amber warning. The
//      "local mirror" badge by itself is NOT a warning.
//   5. A trialing subscription is a "Scheduled <Tier> renewal" — never a
//      "free trial" or "trial user".
//
// Server-only. Never import from client code.

import type { MirrorSubscription } from "@/lib/billing/stripe-mirror.server";
import { TIERS, type TierKey } from "@/lib/billing";

export type AdminSubscriptionSource = "stripe-live" | "local-mirror" | "none";

export type AdminSubscriptionDiscrepancy =
  | "status_mismatch"
  | "tier_mismatch"
  | "period_end_mismatch"
  | "stripe_missing_local_present";

export interface LocalSubscriptionRow {
  id: string;
  user_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string | null;
  tier: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string | null;
  price_lookup_key?: string | null;
}

export interface AdminSubscriptionState {
  /** Stable identity. */
  user_id: string;

  /** Where the truth came from. */
  source: AdminSubscriptionSource;

  /** Stripe subscription id (if known). */
  stripe_subscription_id: string | null;

  /** Stripe customer id (if known). */
  stripe_customer_id: string | null;

  /** Canonical status (active | trialing | past_due | canceled | unpaid | incomplete | …). */
  status: string | null;

  /** Internal tier key — "verified" | "pro" | "studio". */
  tier: TierKey | null;

  /** User-facing tier label — "Core" | "Pro" | "Studio". */
  tier_label: string | null;

  /** Renewal anchor — `trial_end` if trialing, otherwise `current_period_end`. */
  renewal_at: string | null;

  /** True when the renewal is a scheduled trial-end conversion. */
  is_scheduled_renewal: boolean;

  cancel_at_period_end: boolean;

  price_id: string | null;
  price_lookup_key: string | null;
  unit_amount_pence: number | null;
  currency: string | null;
  interval: string | null;

  /** Days remaining until trial_end / current_period_end when trialing. */
  trial_days_left: number | null;

  /** True when the member has a paid entitlement right now. */
  has_active_entitlement: boolean;

  /** Headline label for the status pill — e.g. "Scheduled Core renewal". */
  display_status_label: string;

  /** Secondary line — e.g. "Renews 28 May 2027". */
  display_renewal_label: string | null;

  discrepancies: AdminSubscriptionDiscrepancy[];

  /** Set when source = "local-mirror" only (informational, not a warning). */
  fallback_reason: string | null;
}

/* ───────────────────────── Helpers ───────────────────────── */

const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);
const TIER_BY_LOOKUP_KEY: Record<string, TierKey> = {
  verified_annual: "verified",
  verified_legacy_annual: "verified",
  pro_monthly: "pro",
  pro_annual: "pro",
};
const TIER_BY_PRODUCT_ID: Record<string, TierKey> = {
  verified: "verified",
  pro_founding: "pro",
};

export function tierLabel(tier: TierKey | null): string | null {
  if (!tier) return null;
  return TIERS[tier]?.label ?? null;
}

/** Resolve internal tier key from Stripe price metadata, preferring price/product/lookup. */
export function resolveTierFromStripe(mirror: MirrorSubscription | null): TierKey | null {
  if (!mirror) return null;
  if (mirror.price_lookup_key && TIER_BY_LOOKUP_KEY[mirror.price_lookup_key]) {
    return TIER_BY_LOOKUP_KEY[mirror.price_lookup_key];
  }
  if (mirror.product_id && TIER_BY_PRODUCT_ID[mirror.product_id]) {
    return TIER_BY_PRODUCT_ID[mirror.product_id];
  }
  const metaTier = (mirror.metadata?.tier ?? "").toLowerCase();
  if (metaTier === "verified" || metaTier === "pro" || metaTier === "studio") {
    return metaTier as TierKey;
  }
  return null;
}

function normalizeLocalTier(t: string | null): TierKey | null {
  if (!t) return null;
  const k = t.toLowerCase();
  if (k === "verified" || k === "pro" || k === "studio") return k;
  return null;
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildDisplayStatus(
  status: string | null,
  tierLbl: string | null,
  cancel_at_period_end: boolean,
): string {
  const t = tierLbl ?? "Subscription";
  switch (status) {
    case "active":
      return cancel_at_period_end ? `${t} — cancelling` : `${t} — active`;
    case "trialing":
      return `Scheduled ${t} renewal`;
    case "past_due":
      return `${t} — past due`;
    case "canceled":
      return `${t} — canceled`;
    case "unpaid":
      return `${t} — unpaid`;
    case "incomplete":
    case "incomplete_expired":
      return `${t} — incomplete`;
    case "paused":
      return `${t} — paused`;
    default:
      return status ? `${t} — ${status.replace(/_/g, " ")}` : "No active subscription";
  }
}

function diff(
  mirror: MirrorSubscription | null,
  local: LocalSubscriptionRow | null,
  mirrorTier: TierKey | null,
  localTier: TierKey | null,
): AdminSubscriptionDiscrepancy[] {
  if (!mirror || !local) return [];
  const out: AdminSubscriptionDiscrepancy[] = [];
  if (local.status && local.status !== mirror.status) out.push("status_mismatch");
  if (mirrorTier && localTier && mirrorTier !== localTier) out.push("tier_mismatch");
  if (
    local.current_period_end &&
    mirror.current_period_end &&
    Math.abs(
      new Date(local.current_period_end).getTime() -
        new Date(mirror.current_period_end).getTime(),
    ) > 60_000
  ) {
    out.push("period_end_mismatch");
  }
  return out;
}

/* ───────────────────────── Resolver ───────────────────────── */

export interface ResolveInput {
  user_id: string;
  mirror: MirrorSubscription | null;
  local: LocalSubscriptionRow | null;
}

export function resolveAdminSubscriptionState(input: ResolveInput): AdminSubscriptionState {
  const { user_id, mirror, local } = input;

  // No data anywhere → "none".
  if (!mirror && !local) {
    return {
      user_id,
      source: "none",
      stripe_subscription_id: null,
      stripe_customer_id: null,
      status: null,
      tier: null,
      tier_label: null,
      renewal_at: null,
      is_scheduled_renewal: false,
      cancel_at_period_end: false,
      price_id: null,
      price_lookup_key: null,
      unit_amount_pence: null,
      currency: null,
      interval: null,
      has_active_entitlement: false,
      display_status_label: "No active subscription",
      display_renewal_label: null,
      discrepancies: [],
      fallback_reason: null,
    };
  }

  const stripeTier = resolveTierFromStripe(mirror);
  const localTier = normalizeLocalTier(local?.tier ?? null);
  const tier: TierKey | null = stripeTier ?? localTier;
  const lbl = tierLabel(tier);

  // Stripe live wins when available.
  if (mirror) {
    const status = mirror.status;
    const isTrial = status === "trialing";
    const renewal_at = isTrial ? mirror.trial_end : mirror.current_period_end;
    return {
      user_id,
      source: "stripe-live",
      stripe_subscription_id: mirror.stripe_subscription_id,
      stripe_customer_id: mirror.stripe_customer_id,
      status,
      tier,
      tier_label: lbl,
      renewal_at,
      is_scheduled_renewal: isTrial,
      cancel_at_period_end: mirror.cancel_at_period_end,
      price_id: mirror.price_id,
      price_lookup_key: mirror.price_lookup_key,
      unit_amount_pence: mirror.unit_amount_pence,
      currency: mirror.currency,
      interval: mirror.interval ?? null,
      has_active_entitlement: ENTITLED_STATUSES.has(status),
      display_status_label: buildDisplayStatus(status, lbl, mirror.cancel_at_period_end),
      display_renewal_label: renewal_at ? `Renews ${fmtDate(renewal_at)}` : null,
      discrepancies: diff(mirror, local, stripeTier, localTier),
      fallback_reason: null,
    };
  }

  // Local-only fallback (e.g. Richard Bennett — local trialing row, Stripe mirror unreachable).
  const status = local!.status;
  const isTrial = status === "trialing";
  const renewal_at = local!.current_period_end;
  return {
    user_id,
    source: "local-mirror",
    stripe_subscription_id: local!.stripe_subscription_id,
    stripe_customer_id: local!.stripe_customer_id,
    status,
    tier,
    tier_label: lbl,
    renewal_at,
    is_scheduled_renewal: isTrial,
    cancel_at_period_end: !!local!.cancel_at_period_end,
    price_id: null,
    price_lookup_key: local!.price_lookup_key ?? null,
    unit_amount_pence: null,
    currency: null,
    interval: null,
    has_active_entitlement: !!status && ENTITLED_STATUSES.has(status),
    display_status_label: buildDisplayStatus(status, lbl, !!local!.cancel_at_period_end),
    display_renewal_label: renewal_at ? `Renews ${fmtDate(renewal_at)}` : null,
    discrepancies: [],
    fallback_reason: "Stripe live mirror unavailable — showing the local subscriptions row.",
  };
}

/* ───────────────────────── Fetchers ───────────────────────── */

/** Pick the best local row for entitlement. Prefers active/trialing then most recent. */
function pickLocalRow(rows: LocalSubscriptionRow[]): LocalSubscriptionRow | null {
  if (!rows.length) return null;
  const ranked = [...rows].sort((a, b) => {
    const aLive = ENTITLED_STATUSES.has(a.status ?? "") ? 1 : 0;
    const bLive = ENTITLED_STATUSES.has(b.status ?? "") ? 1 : 0;
    if (aLive !== bLive) return bLive - aLive;
    const at = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
    const bt = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
    return bt - at;
  });
  return ranked[0] ?? null;
}

/** Resolve one user's subscription state. */
export async function resolveSubscriptionStateForUser(
  userId: string,
): Promise<AdminSubscriptionState> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { getMirrorForUser } = await import("@/lib/billing/stripe-mirror.server");

  const [mirror, localRes] = await Promise.all([
    getMirrorForUser(userId, "live").catch(() => null),
    supabaseAdmin
      .from("subscriptions")
      .select(
        "id, user_id, stripe_subscription_id, stripe_customer_id, status, tier, current_period_end, cancel_at_period_end, environment",
      )
      .eq("user_id", userId)
      .eq("environment", "live"),
  ]);

  const localRows = ((localRes.data ?? []) as unknown as LocalSubscriptionRow[]).filter(Boolean);
  const local = pickLocalRow(localRows);

  return resolveAdminSubscriptionState({ user_id: userId, mirror, local });
}

/** Bulk variant. */
export async function resolveSubscriptionStatesForUsers(
  userIds: string[],
): Promise<Map<string, AdminSubscriptionState>> {
  const out = new Map<string, AdminSubscriptionState>();
  await Promise.all(
    userIds.map(async (id) => {
      try {
        out.set(id, await resolveSubscriptionStateForUser(id));
      } catch {
        out.set(id, resolveAdminSubscriptionState({ user_id: id, mirror: null, local: null }));
      }
    }),
  );
  return out;
}
