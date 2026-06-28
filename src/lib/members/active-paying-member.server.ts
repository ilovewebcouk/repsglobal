// Server-side canonical fetch for the Active Paying Member collection.
//
// SINGLE SOURCE OF TRUTH for "who is a paying member of REPS right now".
// Every admin surface that displays an active-paying count MUST go through
// this helper. Do NOT re-implement the fetch+build chain anywhere else.
//
// Consumers:
//   - src/lib/admin/overview.functions.ts        (Overview "Active paying members" tile)
//   - src/lib/admin/professionals.functions.ts   (Professionals "Paid members" KPI)
//   - src/lib/ops/operations.functions.ts        (Customer Health "Active paying members" tile)
//   - src/lib/admin/reconciliation.functions.ts  (audit table)
//
// Anyone considering writing `from("subscriptions").select(...).in("status", ["active","trialing"])`
// to derive a member count: STOP — call `fetchActivePayingMemberCollection()` instead.

import {
  buildActivePayingMemberCollection,
  type BuildActiveMembersResult,
} from "./active-paying-member";

export async function fetchActivePayingMemberCollection(
  supabaseAdmin: any,
): Promise<BuildActiveMembersResult> {
  const [subsRes, legacyRes, bdRes] = await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, tier, status, environment, created_at, current_period_end"),
    supabaseAdmin
      .from("legacy_stripe_link")
      .select("bd_member_id, email, claimed_user_id, access_expires_at, created_at, stripe_customer_id"),
    supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id, email, claimed_user_id, bd_next_due_date, legacy_signup_at"),
  ]);

  const subsRaw = (subsRes.data ?? []) as Array<Record<string, unknown>>;

  // Email lookup for subs → email (cross-source dedupe + ghost filtering).
  const authEmailById = new Map<string, string>();
  try {
    let page = 1;
    while (page < 50) {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      for (const u of users.users) {
        if (u.email) authEmailById.set(u.id, u.email.toLowerCase());
      }
      if (users.users.length < 200) break;
      page += 1;
    }
  } catch {
    // best-effort
  }

  // Exclude "ghost" subscriptions whose user_id no longer exists in auth.users.
  const subsFiltered = subsRaw.filter((s) => {
    const uid = (s.user_id as string | null) ?? null;
    return !uid || authEmailById.has(uid);
  });

  return buildActivePayingMemberCollection({
    subs: subsFiltered.map((s) => ({
      id: String(s.id),
      user_id: (s.user_id as string | null) ?? null,
      tier: (s.tier as string | null) ?? null,
      status: (s.status as string | null) ?? null,
      environment: (s.environment as string | null) ?? null,
      created_at: (s.created_at as string | null) ?? null,
      current_period_end: (s.current_period_end as string | null) ?? null,
    })),
    legacyLinks: ((legacyRes.data ?? []) as Array<Record<string, unknown>>).map((l) => ({
      bd_member_id: (l.bd_member_id as number | string | null) ?? null,
      email: (l.email as string | null) ?? null,
      claimed_user_id: (l.claimed_user_id as string | null) ?? null,
      access_expires_at: (l.access_expires_at as string | null) ?? null,
      created_at: (l.created_at as string | null) ?? null,
      stripe_customer_id: (l.stripe_customer_id as string | null) ?? null,
    })),
    bdSeeds: ((bdRes.data ?? []) as Array<Record<string, unknown>>).map((b) => ({
      bd_member_id: (b.bd_member_id as number | string | null) ?? null,
      email: (b.email as string | null) ?? null,
      claimed_user_id: (b.claimed_user_id as string | null) ?? null,
      bd_next_due_date: (b.bd_next_due_date as string | null) ?? null,
      bd_signup_date: (b.legacy_signup_at as string | null) ?? null,
    })),
    authEmailById,
    nowIso: new Date().toISOString(),
  });
}
