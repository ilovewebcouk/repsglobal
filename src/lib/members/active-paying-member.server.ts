// Server-side canonical fetch for the Active Paying Member collection.
//
// SINGLE SOURCE OF TRUTH for "who is a paying member of REPS right now".
// Every admin surface that displays an active-paying count MUST go through
// this helper. Do NOT re-implement the fetch+build chain anywhere else.
//
// SUBSCRIPTION-FIRST: as of the Subscription Data Contract pass, this fetch
// reads ONLY the `subscriptions` Stripe mirror. The `legacy_stripe_link` and
// `bd_member_seed` tables are archive/debug data and MUST NOT influence
// active-member or paid-professional counts. The `/admin/reconciliation`
// audit page still reads those tables directly (that is its purpose).

import {
  buildActivePayingMemberCollection,
  type BuildActiveMembersResult,
} from "./active-paying-member";

export async function fetchActivePayingMemberCollection(
  supabaseAdmin: any,
): Promise<BuildActiveMembersResult> {
  const { data: subsRaw } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, tier, status, environment, created_at, current_period_end, payment_standing");

  const subsRows = (subsRaw ?? []) as Array<Record<string, unknown>>;

  // Email lookup for ghost filtering (sub.user_id no longer in auth.users).
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

  const subsFiltered = subsRows.filter((s) => {
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
      payment_standing: (s.payment_standing as string | null) ?? "ok",
    })),
    legacyLinks: [], // archive / debug only — see /admin/reconciliation
    bdSeeds: [],     // archive / debug only — see /admin/reconciliation
    authEmailById,
    nowIso: new Date().toISOString(),
  });
}
