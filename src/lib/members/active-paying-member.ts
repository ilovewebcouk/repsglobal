// Canonical Active Paying Member model.
//
// SINGLE SOURCE OF TRUTH for determining whether someone currently has paid
// access to REPS. This file is imported by:
//
//   - `src/lib/admin/overview.functions.ts`     (Active Members KPI tile)
//   - `src/lib/admin/reconciliation.functions.ts` (Active Members audit)
//   - `src/lib/admin/stripe-linking.functions.ts` (legacy renewal engine —
//     uses the same predicate to decide whether a row is *still* active and
//     therefore should NOT be charged yet)
//
// Do not re-implement these rules anywhere else.

// ---- Tier constants --------------------------------------------------------
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export const COUNTED_TIERS = ["verified", "pro", "studio", "training_provider"] as const;

export type MemberTier = (typeof COUNTED_TIERS)[number];

// Training Provider > Studio > Pro > Verified (highest rank wins on dedupe / mix tally).
export const TIER_RANK: Record<MemberTier, number> = {
  training_provider: 4,
  studio: 3,
  pro: 2,
  verified: 1,
};

// Default tier used when a member has no active Stripe subscription yet.
export const TIER_FOR_LEGACY: MemberTier = "verified";
export const TIER_FOR_BD_SEED: MemberTier = "verified";

// ---- Input row shapes (loose — we only read the fields we need) -----------
export interface SubscriptionRowLike {
  id: string;
  user_id: string | null;
  tier: string | null;
  status: string | null;
  environment: string | null;
  created_at: string | null;
  current_period_end?: string | null;
  /**
   * Payment standing. Anything other than 'ok' (payment_disputed,
   * chargeback_lost, chargeback_won) means this subscription must NOT count
   * as an active paying member. Defaults to 'ok' if the caller doesn't pass
   * the column (older callers).
   */
  payment_standing?: string | null;
}

export interface LegacyLinkRowLike {
  bd_member_id: number | string | null;
  email?: string | null;
  claimed_user_id?: string | null;
  access_expires_at: string | null;
  created_at?: string | null;
  stripe_customer_id?: string | null;
}

export interface BdSeedRowLike {
  bd_member_id: number | string | null;
  email?: string | null;
  claimed_user_id?: string | null;
  bd_next_due_date: string | null;
  bd_signup_date?: string | null;
}

// ---- Predicates ------------------------------------------------------------
/**
 * Active Stripe subscription. Live environment, active/trialing, counted tier.
 */
export function isActiveSubscription(s: SubscriptionRowLike): boolean {
  return (
    s.environment === "live" &&
    (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(s.status ?? "") &&
    (COUNTED_TIERS as readonly string[]).includes(s.tier ?? "") &&
    (s.payment_standing ?? "ok") === "ok"
  );
}

/**
 * Legacy Stripe member still inside their paid window.
 */
export function isActiveLegacyLink(
  l: LegacyLinkRowLike,
  nowIso: string,
): boolean {
  if (!l.access_expires_at) return false;
  return new Date(l.access_expires_at).getTime() > new Date(nowIso).getTime();
}

/**
 * BD-migrated member still inside their paid window per the renewal engine.
 */
export function isActiveBdSeed(seed: BdSeedRowLike, nowIso: string): boolean {
  if (!seed.bd_next_due_date) return false;
  return new Date(seed.bd_next_due_date).getTime() > new Date(nowIso).getTime();
}

// ---- Collection model ------------------------------------------------------
export type ActiveMemberSource = "subscription" | "legacy_link" | "bd_seed";

export type ActiveMergeReason =
  | "user_id"
  | "claimed_user_id"
  | "email"
  | "bd_member_id"
  | null;

export interface ActiveMemberContribution {
  source: ActiveMemberSource;
  source_row_id: string; // sub.id | `legacy:${bd_member_id}` | `bd:${bd_member_id}`
  tier: MemberTier;
  // The date this source row says the membership became active.
  activated_at: string | null;
}

export interface ActivePayingMember {
  /** Stable id: user_id ?? claimed_user_id ?? lowercased email ?? `bd:<id>`. */
  id: string;
  primary_source: ActiveMemberSource;
  sources: ActiveMemberContribution[];
  tier: MemberTier;
  user_id: string | null;
  email: string | null;
  bd_member_id: string | null;
  /** Min activated_at across all contributing sources. */
  earliest_activation_at: string | null;
  /** Which key caused a merge with a previously-seen row (null = first sight). */
  merge_reason: ActiveMergeReason;
}

export interface ActiveMemberRawRow {
  source: ActiveMemberSource;
  source_row_id: string;
  user_id: string | null;
  email: string | null;
  bd_member_id: string | null;
  tier: MemberTier | null;
  activated_at: string | null;
  status_or_window: string; // human-readable: "active/trialing verified", "access_expires_at 2027-01-01", etc.
  included_in_total: boolean;
  exclusion_reason: string | null;
  merge_reason: ActiveMergeReason;
  /** When merged, the surviving member id. Null when this row creates a new member. */
  merged_into_member_id: string | null;
}

export interface ActiveMemberCounts {
  stripe_subscriptions: number; // rows from subs that qualify as active
  legacy_members: number; // rows from legacy_stripe_link that qualify as active
  bd_migrated_members: number; // rows from bd_member_seed that qualify as active
  duplicates_removed: number;
  final_active_members: number;
  by_tier: Record<MemberTier, number>;
}

export interface BuildActiveMembersInput {
  subs: SubscriptionRowLike[];
  legacyLinks: LegacyLinkRowLike[];
  bdSeeds: BdSeedRowLike[];
  /** Map of auth.users.id -> email, lower-cased. Subs join through this. */
  authEmailById?: Map<string, string>;
  /** ISO timestamp used as "now" for window predicates. */
  nowIso: string;
}

export interface BuildActiveMembersResult {
  members: ActivePayingMember[];
  counts: ActiveMemberCounts;
  rawRows: ActiveMemberRawRow[];
}

function lower(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  return t || null;
}

function minIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

/**
 * Build the canonical Active Paying Member collection from the three sources.
 *
 * Dedupe ladder (first match wins):
 *   1. user_id (subscriptions) / claimed_user_id (legacy, bd)
 *   2. lower-cased email
 *   3. bd_member_id (legacy ↔ bd only)
 *
 * Tier on a survivor is the highest-ranked tier across its contributing
 * sources (Studio > Pro > Verified). Legacy/BD-only contributions count as
 * Verified.
 */
export function buildActivePayingMemberCollection(
  input: BuildActiveMembersInput,
): BuildActiveMembersResult {
  const { subs, legacyLinks, bdSeeds, nowIso } = input;
  const authEmail = input.authEmailById ?? new Map<string, string>();

  const members: ActivePayingMember[] = [];
  const rawRows: ActiveMemberRawRow[] = [];

  // Indexes for dedupe lookups.
  const byUserId = new Map<string, ActivePayingMember>();
  const byEmail = new Map<string, ActivePayingMember>();
  const byBdId = new Map<string, ActivePayingMember>();

  let activeSubRows = 0;
  let activeLegacyRows = 0;
  let activeBdRows = 0;

  function attach(
    candidate: {
      sourceRowId: string;
      source: ActiveMemberSource;
      tier: MemberTier;
      user_id: string | null;
      email: string | null;
      bd_member_id: string | null;
      activated_at: string | null;
    },
    rawRow: ActiveMemberRawRow,
  ) {
    const emailKey = lower(candidate.email);
    const bdKey = candidate.bd_member_id;

    // Resolve dedupe match in priority order.
    let match: ActivePayingMember | undefined;
    let reason: ActiveMergeReason = null;
    if (candidate.user_id && byUserId.has(candidate.user_id)) {
      match = byUserId.get(candidate.user_id)!;
      reason =
        candidate.source === "subscription" ? "user_id" : "claimed_user_id";
    } else if (emailKey && byEmail.has(emailKey)) {
      match = byEmail.get(emailKey)!;
      reason = "email";
    } else if (bdKey && byBdId.has(bdKey)) {
      match = byBdId.get(bdKey)!;
      reason = "bd_member_id";
    }

    if (match) {
      // Merge into existing survivor.
      match.sources.push({
        source: candidate.source,
        source_row_id: candidate.sourceRowId,
        tier: candidate.tier,
        activated_at: candidate.activated_at,
      });
      if (TIER_RANK[candidate.tier] > TIER_RANK[match.tier]) {
        match.tier = candidate.tier;
      }
      match.earliest_activation_at = minIso(
        match.earliest_activation_at,
        candidate.activated_at,
      );
      if (!match.user_id && candidate.user_id) match.user_id = candidate.user_id;
      if (!match.email && candidate.email) match.email = candidate.email;
      if (!match.bd_member_id && candidate.bd_member_id)
        match.bd_member_id = candidate.bd_member_id;

      // Make sure all keys point at this survivor for future rows.
      if (candidate.user_id) byUserId.set(candidate.user_id, match);
      if (emailKey) byEmail.set(emailKey, match);
      if (bdKey) byBdId.set(bdKey, match);

      rawRow.merge_reason = reason;
      rawRow.merged_into_member_id = match.id;
      rawRows.push(rawRow);
      return;
    }

    // Brand new survivor.
    const id =
      candidate.user_id ??
      emailKey ??
      (bdKey ? `bd:${bdKey}` : `row:${candidate.source}:${candidate.sourceRowId}`);

    const member: ActivePayingMember = {
      id,
      primary_source: candidate.source,
      sources: [
        {
          source: candidate.source,
          source_row_id: candidate.sourceRowId,
          tier: candidate.tier,
          activated_at: candidate.activated_at,
        },
      ],
      tier: candidate.tier,
      user_id: candidate.user_id,
      email: candidate.email,
      bd_member_id: candidate.bd_member_id,
      earliest_activation_at: candidate.activated_at,
      merge_reason: null,
    };
    members.push(member);
    if (candidate.user_id) byUserId.set(candidate.user_id, member);
    if (emailKey) byEmail.set(emailKey, member);
    if (bdKey) byBdId.set(bdKey, member);

    rawRow.merged_into_member_id = member.id;
    rawRows.push(rawRow);
  }

  // ---- 1) Subscriptions (highest-priority source) -------------------------
  // Within subs, prefer the highest-ranked tier per user so that a Pro+Verified
  // user lands as Pro and any "loser" sub row is correctly marked deduped.
  const subsByUser = new Map<string, SubscriptionRowLike[]>();
  for (const s of subs) {
    const k = s.user_id ?? `sub:${s.id}`;
    const arr = subsByUser.get(k) ?? [];
    arr.push(s);
    subsByUser.set(k, arr);
  }
  for (const [, arr] of subsByUser) {
    // Sort active first then by tier rank desc so the winner is index 0.
    arr.sort((a, b) => {
      const aa = isActiveSubscription(a) ? 1 : 0;
      const bb = isActiveSubscription(b) ? 1 : 0;
      if (aa !== bb) return bb - aa;
      const at = TIER_RANK[(a.tier as MemberTier) ?? "verified"] ?? 0;
      const bt = TIER_RANK[(b.tier as MemberTier) ?? "verified"] ?? 0;
      return bt - at;
    });
  }

  for (const [, arr] of subsByUser) {
    let winnerTaken = false;
    for (const s of arr) {
      const active = isActiveSubscription(s);
      const email =
        s.user_id ? (authEmail.get(s.user_id) ?? null) : null;
      const tier = (s.tier as MemberTier) ?? "verified";

      const baseRow: ActiveMemberRawRow = {
        source: "subscription",
        source_row_id: s.id,
        user_id: s.user_id,
        email,
        bd_member_id: null,
        tier:
          (COUNTED_TIERS as readonly string[]).includes(s.tier ?? "")
            ? tier
            : null,
        activated_at: s.created_at,
        status_or_window: `env=${s.environment} status=${s.status} tier=${s.tier}`,
        included_in_total: false,
        exclusion_reason: null,
        merge_reason: null,
        merged_into_member_id: null,
      };

      if (!active) {
        let reason: string;
        if (s.environment !== "live")
          reason = `environment="${s.environment}" (requires "live")`;
        else if (
          !(ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(
            s.status ?? "",
          )
        )
          reason = `status="${s.status}" (requires active/trialing)`;
        else if ((s.payment_standing ?? "ok") !== "ok")
          reason = `payment_standing="${s.payment_standing}" (chargeback / dispute)`;
        else
          reason = `tier="${s.tier}" (requires verified/pro/studio/training_provider)`;
        baseRow.exclusion_reason = reason;
        rawRows.push(baseRow);
        continue;
      }

      if (winnerTaken) {
        baseRow.exclusion_reason = `superseded by higher-ranked active subscription for the same user`;
        rawRows.push(baseRow);
        continue;
      }
      winnerTaken = true;
      activeSubRows += 1;

      baseRow.included_in_total = true;
      attach(
        {
          sourceRowId: s.id,
          source: "subscription",
          tier,
          user_id: s.user_id,
          email,
          bd_member_id: null,
          activated_at: s.created_at,
        },
        baseRow,
      );
    }
  }

  // ---- 2) Legacy Stripe links --------------------------------------------
  for (const l of legacyLinks) {
    const bd = l.bd_member_id != null ? String(l.bd_member_id) : null;
    const sourceRowId = bd ? `legacy:${bd}` : `legacy:${l.access_expires_at}`;
    const email = l.email ?? null;
    const baseRow: ActiveMemberRawRow = {
      source: "legacy_link",
      source_row_id: sourceRowId,
      user_id: l.claimed_user_id ?? null,
      email,
      bd_member_id: bd,
      tier: TIER_FOR_LEGACY,
      activated_at: l.created_at ?? null,
      status_or_window: `access_expires_at=${l.access_expires_at ?? "null"}`,
      included_in_total: false,
      exclusion_reason: null,
      merge_reason: null,
      merged_into_member_id: null,
    };

    if (!isActiveLegacyLink(l, nowIso)) {
      baseRow.exclusion_reason = l.access_expires_at
        ? `access_expires_at ${l.access_expires_at} is not in the future`
        : "access_expires_at is null";
      rawRows.push(baseRow);
      continue;
    }

    activeLegacyRows += 1;
    baseRow.included_in_total = true;
    attach(
      {
        sourceRowId,
        source: "legacy_link",
        tier: TIER_FOR_LEGACY,
        user_id: l.claimed_user_id ?? null,
        email,
        bd_member_id: bd,
        activated_at: l.created_at ?? null,
      },
      baseRow,
    );
  }

  // ---- 3) BD member seeds -------------------------------------------------
  for (const seed of bdSeeds) {
    const bd = seed.bd_member_id != null ? String(seed.bd_member_id) : null;
    const sourceRowId = bd ? `bd:${bd}` : `bd:${seed.bd_next_due_date}`;
    const email = seed.email ?? null;
    const baseRow: ActiveMemberRawRow = {
      source: "bd_seed",
      source_row_id: sourceRowId,
      user_id: seed.claimed_user_id ?? null,
      email,
      bd_member_id: bd,
      tier: TIER_FOR_BD_SEED,
      activated_at: seed.bd_signup_date ?? null,
      status_or_window: `bd_next_due_date=${seed.bd_next_due_date ?? "null"}`,
      included_in_total: false,
      exclusion_reason: null,
      merge_reason: null,
      merged_into_member_id: null,
    };

    if (!isActiveBdSeed(seed, nowIso)) {
      baseRow.exclusion_reason = seed.bd_next_due_date
        ? `bd_next_due_date ${seed.bd_next_due_date} is not in the future`
        : "bd_next_due_date is null";
      rawRows.push(baseRow);
      continue;
    }

    activeBdRows += 1;
    baseRow.included_in_total = true;
    attach(
      {
        sourceRowId,
        source: "bd_seed",
        tier: TIER_FOR_BD_SEED,
        user_id: seed.claimed_user_id ?? null,
        email,
        bd_member_id: bd,
        activated_at: seed.bd_signup_date ?? null,
      },
      baseRow,
    );
  }

  const by_tier: Record<MemberTier, number> = {
    verified: 0,
    pro: 0,
    studio: 0,
    training_provider: 0,
  };
  for (const m of members) by_tier[m.tier] += 1;

  const counts: ActiveMemberCounts = {
    stripe_subscriptions: activeSubRows,
    legacy_members: activeLegacyRows,
    bd_migrated_members: activeBdRows,
    duplicates_removed:
      activeSubRows + activeLegacyRows + activeBdRows - members.length,
    final_active_members: members.length,
    by_tier,
  };

  return { members, counts, rawRows };
}
