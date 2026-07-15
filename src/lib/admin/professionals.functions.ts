import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import {
  computeMemberBillingRow,
  type MemberBillingPlan,
  type SubscriptionRowLite,
} from '@/lib/admin/member-billing-row.server';


export type AdminProBillingState = 'ok' | 'payment_failed' | 'renewal_due';

export type AdminProRow = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  
  profession: string | null;
  professionSlug: string | null;
  plan: 'free' | 'verified' | 'pro' | 'studio' | 'training_provider';
  accountType: 'individual' | 'training_provider' | null;
  planMrrPence: number;
  status: 'verified' | 'pending' | 'flagged' | 'suspended';
  /**
   * Billing health, derived per row:
   *  - 'payment_failed' → has a Stripe sub in past_due / unpaid / incomplete / incomplete_expired
   *    with a counted tier (Raheela today).
   *  - 'renewal_due'    → BD-migrated member whose `bd_next_due_date` has arrived
   *    but no active sub exists yet (Adam Davis on his due day, before the cron runs).
   *  - 'ok'             → no billing alert.
   * When set to anything other than 'ok' we bump `plan` to 'verified' (Core) so
   * the row doesn't read as a "Free / Unverified" non-paying member.
   */
  billingState: AdminProBillingState;
  rating: number | null;
  clients: number;
  joined: string;
  isPublished: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  verification: string;
  email: string | null;
  lifetimeValuePence: number | null;
  renewalDate: string | null;
  renewalDateSource: 'stripe' | 'bd' | null;
  isTrial: boolean;
  trialDaysLeft: number | null;
  // Provider-segment extras (null for individuals).
  location: string | null;
  coursesCount: number | null;
  verifiedProsLinked: number | null;
  // Last time the user signed in (auth.users.last_sign_in_at). Null if never.
  lastLoginAt: string | null;
};


const PROFESSION_LABEL: Record<string, string> = {
  'personal-trainer': 'PT',
  'fitness-instructor': 'Fitness',
  'group-fitness-instructor': 'Group Ex',
  'strength-coach': 'S&C',
  'nutritionist': 'Nutrition',
  'pilates-instructor': 'Pilates',
  'yoga-teacher': 'Yoga',
};


const PLAN_RANK: Record<string, number> = { training_provider: 5, studio: 4, pro: 3, verified: 2, free: 1 };
const TRAINING_PROVIDER_MRR_PENCE = Math.round(47900 / 12);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', {
    _user_id: ctx.userId,
    _role: 'admin' as never,
  });
  if (!isAdmin) throw new Error('Forbidden');
}

export const getAdminProfessionalsKpis = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { fetchActivePayingMemberCollection } = await import(
      '@/lib/members/active-paying-member.server'
    );
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
    const since60 = new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString();

    // KPI counts only include professionals whose underlying auth user is
    // email-confirmed (i.e. actually signed up — invited-but-unaccepted
    // shells from `generateLink({ type: 'invite' })` are excluded).
    // Demos already excluded by `count_confirmed_professionals` (filters is_demo).
    const [activeRes, verifiedRes, signups30Res, signupsPrev30Res, adminRolesRes, activeCollection] = await Promise.all([
      supabaseAdmin.rpc('count_confirmed_professionals', { _only_published: false }),
      supabaseAdmin.rpc('count_confirmed_professionals', { _only_published: false, _verification: 'verified' }),
      supabaseAdmin.rpc('count_confirmed_pro_signups', { _since: since30 }),
      supabaseAdmin.rpc('count_confirmed_pro_signups', { _since: since60, _until: since30 }),
      supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin'),
      fetchActivePayingMemberCollection(supabaseAdmin),
    ]);

    const adminIds = new Set(((adminRolesRes.data ?? []) as Array<{ user_id: string }>).map(r => r.user_id));
    const adminProsRaw = adminIds.size
      ? (await supabaseAdmin.from('professionals').select('id, verification, is_demo').in('id', Array.from(adminIds))).data ?? []
      : [];
    const candidateIds = (adminProsRaw as Array<{ id: string; is_demo: boolean | null }>)
      .filter(r => !r.is_demo)
      .map(r => r.id);
    const confirmedAdminIds = new Set<string>();
    for (const id of candidateIds) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
      if (u?.user?.email_confirmed_at) confirmedAdminIds.add(id);
    }
    const adminProRows = (adminProsRaw as Array<{ id: string; verification: string | null; is_demo: boolean | null }>)
      .filter(r => confirmedAdminIds.has(r.id));
    const adminProCount = adminProRows.length;
    const adminVerifiedCount = adminProRows.filter(r => r.verification === 'verified').length;

    const activeCount = Math.max(0, ((activeRes.data as number | null) ?? 0) - adminProCount);
    const verifiedCount = Math.max(0, ((verifiedRes.data as number | null) ?? 0) - adminVerifiedCount);
    const signups = (signups30Res.data as number | null) ?? 0;
    const prevSignups = (signupsPrev30Res.data as number | null) ?? 0;
    const paidCount = activeCollection.members.filter(
      (m) => !m.user_id || !adminIds.has(m.user_id),
    ).length;
    const wow = prevSignups ? ((signups - prevSignups) / prevSignups) * 100 : null;

    // 12-month series for sparklines.
    // active/verified = cumulative confirmed-pro count at each month-end.
    // paid           = subs with status='active' whose start was on/before
    //                  month-end (rough cumulative active-paid).
    // newSignups     = per-month count.
    const now = new Date();
    const monthEnds: Date[] = [];
    for (let i = 11; i >= 0; i--) {
      // First-of-next-month minus 1ms = month end
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
      d.setUTCMilliseconds(-1);
      monthEnds.push(d);
    }

    // Pull a flat list of confirmed, non-demo, non-admin pros with their
    // signup month + verification status, then bucket client-side.
    const [allProsRes, allSubsRes] = await Promise.all([
      supabaseAdmin
        .from('professionals')
        .select('id, member_since, created_at, verification, is_demo')
        .eq('is_demo', false)
        .limit(5000),
      supabaseAdmin
        .from('subscriptions')
        .select('user_id, status, created_at')
        .in('status', ['active', 'trialing', 'past_due'])
        .limit(5000),
    ]);
    const allProsRaw = (allProsRes.data ?? []) as Array<{
      id: string; member_since: string | null; created_at: string;
      verification: string | null; is_demo: boolean | null;
    }>;
    // Filter to confirmed users (single batched RPC call).
    const proIds = allProsRaw.map(p => p.id);
    let confirmedSet = new Set<string>();
    if (proIds.length) {
      const { data: confirmedIds } = await supabaseAdmin.rpc(
        'get_confirmed_professional_ids',
        { _ids: proIds },
      );
      confirmedSet = new Set(((confirmedIds ?? []) as string[]).map(String));
    }
    const allPros = allProsRaw.filter(p => confirmedSet.has(p.id) && !adminIds.has(p.id));
    const allSubs = ((allSubsRes.data ?? []) as Array<{
      user_id: string; status: string; created_at: string;
    }>).filter(s => !adminIds.has(s.user_id));

    const series = {
      active: [] as number[],
      verified: [] as number[],
      paid: [] as number[],
      newSignups: [] as number[],
    };
    for (let i = 0; i < monthEnds.length; i++) {
      const me = monthEnds[i];
      const meIso = me.toISOString();
      const ms = monthEnds[i].getTime();
      const monthStart = new Date(Date.UTC(me.getUTCFullYear(), me.getUTCMonth(), 1)).getTime();

      let active = 0, verified = 0, paid = 0, signups = 0;
      for (const p of allPros) {
        const signed = new Date(p.member_since ?? p.created_at).getTime();
        if (signed <= ms) {
          active++;
          if (p.verification === 'verified') verified++;
        }
        if (signed >= monthStart && signed <= ms) signups++;
      }
      for (const s of allSubs) {
        if (new Date(s.created_at).getTime() <= ms) paid++;
      }
      series.active.push(active);
      series.verified.push(verified);
      series.paid.push(paid);
      series.newSignups.push(signups);
      void meIso;
    }

    return {
      activeCount, verifiedCount,
      verifiedPct: activeCount ? (verifiedCount / activeCount) * 100 : 0,
      paidCount,
      newSignups30: signups, newSignupsDeltaPct: wow,
      series,
    };
  });

const TAB_VALUES = ['all', 'verified', 'pending', 'flagged', 'suspended', 'payment_failed', 'renewal_due', 'recent', 'demos'] as const;
export type AdminProTab = typeof TAB_VALUES[number];
export type AdminProSort = 'joined' | 'name' | 'plan' | 'rating' | 'clients' | 'mrr' | 'lifetimeValue' | 'renewalDate';
export type SortDir = 'asc' | 'desc';

export type AdminProFilters = {
  plans?: ('free' | 'verified' | 'pro' | 'studio' | 'training_provider')[];
  professions?: string[];
  hasAvatar?: boolean;
};

export type AdminProSegment = 'professionals' | 'providers';

export const listAdminProfessionals = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    q?: string; tab?: AdminProTab; page?: number; pageSize?: number;
    sort?: AdminProSort; dir?: SortDir; filters?: AdminProFilters;
    segment?: AdminProSegment;
  }) => ({
    q: (d.q ?? '').trim(),
    tab: (d.tab ?? 'all') as AdminProTab,
    page: Math.max(1, d.page ?? 1),
    pageSize: Math.min(100, Math.max(5, d.pageSize ?? 25)),
    sort: (d.sort ?? 'joined') as AdminProSort,
    dir: (d.dir ?? 'desc') as SortDir,
    filters: d.filters ?? {},
    segment: (d.segment ?? 'professionals') as AdminProSegment,
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { fetchActivePayingMemberCollection } = await import(
      '@/lib/members/active-paying-member.server'
    );

    // Fetch a generously sized window so we can sort across joined data
    // (rating/clients/plan) without an RPC. Realistic register sizes for v1.
    const FETCH_CAP = 1000;

    let query = supabaseAdmin
      .from('professionals')
      .select(
        'id, slug, city, primary_profession, verification, is_published, created_at, member_since, suspended_at, suspension_reason, is_demo, account_type',
        { count: 'exact' }
      );

    // Demos tab shows only fake/demo records; every other tab excludes them.
    if (data.tab === 'demos') {
      query = query.eq('is_demo', true);
    } else {
      query = query.eq('is_demo', false);
    }

    // Segment split: providers = organisations, professionals = everyone else.
    if (data.segment === 'providers') {
      query = query.eq('account_type', 'training_provider');
    } else {
      query = query.or('account_type.is.null,account_type.neq.training_provider');
    }

    switch (data.tab) {
      case 'verified':   query = query.eq('verification', 'verified').eq('is_published', true); break;
      case 'pending':    query = query.eq('verification', 'pending'); break;
      case 'flagged':    query = query.eq('verification', 'rejected'); break;
      case 'suspended':  query = query.not('suspended_at', 'is', null); break;
      case 'recent': {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
        query = query.gte('created_at', since);
        break;
      }
    }

    if (data.filters.professions?.length) {
      query = query.in('primary_profession', data.filters.professions);
    }
    if (data.q) {
      const like = `%${data.q}%`;
      // Also match against profiles.full_name so members without a slug yet
      // (e.g. brand-new accounts) are searchable by name.
      const { data: profileMatches } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('full_name', like)
        .limit(500);
      const nameIds = ((profileMatches ?? []) as Array<{ id: string }>).map((p) => p.id);
      const orClauses = [`slug.ilike.${like}`, `city.ilike.${like}`];
      if (nameIds.length) orClauses.push(`id.in.(${nameIds.join(',')})`);
      query = query.or(orClauses.join(','));
    }


    // Order by member_since desc so the "Joined" slice reflects BD signup
    // dates for imported pros (created_at is the import event, not signup).
    const { data: pros, error } = await query
      .order('member_since', { ascending: false, nullsFirst: false })
      .limit(FETCH_CAP);
    if (error) throw error;

    const allIds = (pros ?? []).map(p => p.id);
    if (allIds.length === 0) {
      return { rows: [] as AdminProRow[], total: 0, page: data.page, pageSize: data.pageSize };
    }

    // Professionals still require email confirmation before they appear here.
    // Training providers are organisation members as soon as admin imports or
    // creates them, so they must appear even before the invite link is clicked.
    // Also exclude platform admins — they're managed at /admin/team.
    const [confirmedRes, adminRoleRes] = await Promise.all([
      supabaseAdmin.rpc('get_confirmed_professional_ids', { _ids: allIds }),
      supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin'),
    ]);
    if (confirmedRes.error) throw confirmedRes.error;
    if (adminRoleRes.error) throw adminRoleRes.error;
    const confirmedSet = new Set(((confirmedRes.data ?? []) as string[]).map(String));
    const adminIdSet = new Set(((adminRoleRes.data ?? []) as Array<{ user_id: string }>).map(r => r.user_id));
    const includeUnconfirmedProviders = data.segment === 'providers';
    const ids = allIds.filter(id => (includeUnconfirmedProviders || confirmedSet.has(id)) && !adminIdSet.has(id));
    if (ids.length === 0) {
      return { rows: [] as AdminProRow[], total: 0, page: data.page, pageSize: data.pageSize };
    }
    const prosFiltered = (pros ?? []).filter(p => (includeUnconfirmedProviders || confirmedSet.has(p.id)) && !adminIdSet.has(p.id));

    // Chunk `.in('id', ids)` to keep request URLs under the edge worker URL
    // length limit. A single 400+ UUID list overflows and the request fails
    // silently, which is what made every row render as "Unnamed".
    const CHUNK = 150;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

    async function fetchAll<T>(
      run: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>,
    ): Promise<T[]> {
      const results = await Promise.all(chunks.map((c) => run(c)));
      const out: T[] = [];
      for (const r of results) {
        if (r.error) throw r.error;
        if (r.data) out.push(...r.data);
      }
      return out;
    }

    const [profilesData, subsData, reviewsData, ccData, paymentsData, bdSeedData, activeCollection] = await Promise.all([
      fetchAll<{ id: string; full_name: string | null; avatar_url: string | null }>((c) =>
        supabaseAdmin.from('profiles').select('id, full_name, avatar_url').in('id', c)),
      fetchAll<{ user_id: string | null; tier: string; status: string; created_at: string; current_period_end: string | null; billing_period: string | null }>((c) =>
        supabaseAdmin
          .from('subscriptions')
          .select('user_id, tier, status, created_at, current_period_end, billing_period')
          .in('user_id', c)
          .eq('environment', 'live')),

      fetchAll<{ professional_id: string; rating: number }>((c) =>
        supabaseAdmin.from('reviews').select('professional_id, rating').in('professional_id', c).eq('status', 'published')),
      fetchAll<{ professional_id: string; status: string }>((c) =>
        supabaseAdmin.from('coach_client').select('professional_id, status').in('professional_id', c).eq('status', 'active')),
      fetchAll<{ user_id: string | null; amount_pence: number; refunded_amount_pence: number; status: string }>((c) =>
        supabaseAdmin
          .from('legacy_stripe_payments')
          .select('user_id, amount_pence, refunded_amount_pence, status')
          .in('user_id', c)
          .eq('status', 'Paid')),
      fetchAll<{ claimed_user_id: string | null; bd_next_due_date: string | null }>((c) =>
        supabaseAdmin
          .from('bd_member_seed')
          .select('claimed_user_id, bd_next_due_date')
          .in('claimed_user_id', c)
          .not('claimed_user_id', 'is', null)
          .not('bd_next_due_date', 'is', null)),
      fetchActivePayingMemberCollection(supabaseAdmin),
    ]);

    // Last sign-in per user (admin-only RPC over auth.users).
    const lastLoginByUser = new Map<string, string | null>();
    try {
      const { data: lastLogins } = await supabaseAdmin.rpc('get_users_last_sign_in', { _ids: ids });
      for (const r of (lastLogins ?? []) as Array<{ id: string; last_sign_in_at: string | null }>) {
        lastLoginByUser.set(r.id, r.last_sign_in_at);
      }
    } catch { /* non-fatal — column simply renders as "—" */ }

    // Provider-only: REPs course counts per provider. Cheap 1-shot fetch.
    const coursesCountByOrg = new Map<string, number>();
    if (data.segment === 'providers') {
      const orgIds = prosFiltered.filter(p => p.account_type === 'training_provider').map(p => p.id);
      if (orgIds.length) {
        const { data: courseRows } = await supabaseAdmin
          .from('reps_courses')
          .select('provider_id')
          .in('provider_id', orgIds);
        for (const r of (courseRows ?? []) as Array<{ provider_id: string | null }>) {
          if (!r.provider_id) continue;
          coursesCountByOrg.set(r.provider_id, (coursesCountByOrg.get(r.provider_id) ?? 0) + 1);
        }
      }
    }
    const bdDueMap = new Map<string, string>();
    for (const r of bdSeedData) {
      if (r.claimed_user_id && r.bd_next_due_date) bdDueMap.set(r.claimed_user_id, r.bd_next_due_date);
    }

    const profileMap = new Map(profilesData.map((p) => [p.id, p]));
    const paidTierByUserId = new Map<string, AdminProRow['plan']>();
    for (const m of activeCollection.members) {
      if (m.user_id) paidTierByUserId.set(m.user_id, m.tier as AdminProRow['plan']);
    }

    // Billing-state, plan, renewal, trial and tier all derive from
    // `computeMemberBillingRow` per row below — kept in lockstep with
    // Member 360 via the shared helper in `member-billing-row.server.ts`.
    const ratingAcc = new Map<string, { sum: number; n: number }>();
    for (const r of reviewsData) {
      const cur = ratingAcc.get(r.professional_id) ?? { sum: 0, n: 0 };
      cur.sum += r.rating; cur.n += 1;
      ratingAcc.set(r.professional_id, cur);
    }
    const clientCount = new Map<string, number>();
    for (const c of ccData) {
      clientCount.set(c.professional_id, (clientCount.get(c.professional_id) ?? 0) + 1);
    }

    // Lifetime value = sum of all successful Stripe charges (net of refunds)
    // sourced from legacy_stripe_payments, which holds the full historical
    // import from the previous billing platform plus any backfilled rows.
    const ltvMap = new Map<string, number>();
    for (const p of paymentsData) {
      if (!p.user_id) continue;
      const net = (p.amount_pence ?? 0) - (p.refunded_amount_pence ?? 0);
      ltvMap.set(p.user_id, (ltvMap.get(p.user_id) ?? 0) + net);
    }

    // Pre-group subs by user_id so the shared compute can see them all.
    const subsByUser = new Map<string, SubscriptionRowLite[]>();
    for (const s of subsData) {
      if (!s.user_id) continue;
      const lite: SubscriptionRowLite = { ...s, user_id: s.user_id };
      const list = subsByUser.get(s.user_id) ?? [];
      list.push(lite);
      subsByUser.set(s.user_id, list);
    }


    let rows: AdminProRow[] = prosFiltered.map(p => {
      const profile = profileMap.get(p.id);

      // SHARED COMPUTE — identical to Member 360's `fetchMemberBillingRow`.
      // All pricing/renewal/trial/tier derivation lives in
      // `member-billing-row.server.ts` so the two surfaces cannot diverge.
      const billing = computeMemberBillingRow({
        user_id: p.id,
        subs: subsByUser.get(p.id) ?? [],
        bdNextDueIso: bdDueMap.get(p.id) ?? null,
        activePaidTier: (paidTierByUserId.get(p.id) as MemberBillingPlan | undefined) ?? null,
      });
      const isTrainingProvider = p.account_type === 'training_provider';
      const providerSub = isTrainingProvider
        ? (subsByUser.get(p.id) ?? []).find((s) => ['active', 'trialing', 'past_due'].includes(s.status) && s.tier === 'training_provider') ?? null
        : null;

      const ra = ratingAcc.get(p.id);
      // Policy (no self-removal): a pro's public profile stays live; only their
      // trust badge changes. Admin "suspension", chargebacks, and exhausted
      // payment recovery all surface as Unverified (pending) in the UI.
      const status: AdminProRow['status'] =
        billing.billingState !== 'ok' ? 'pending'
        : p.suspended_at ? 'pending'
        : p.verification === 'verified' && p.is_published ? 'verified'
        : p.verification === 'rejected' && p.is_published ? 'flagged'
        : 'pending';

      const name = profile?.full_name ?? 'Unnamed';
      return {
        id: p.id,
        name,
        handle: p.slug ? `@${p.slug}` : '—',
        avatarUrl: profile?.avatar_url ?? null,
        
        profession: p.primary_profession ? (PROFESSION_LABEL[p.primary_profession] ?? p.primary_profession) : null,
        professionSlug: p.primary_profession ?? null,
        plan: isTrainingProvider && providerSub ? 'training_provider' : billing.plan,
        accountType: ((p as { account_type?: string | null }).account_type as 'individual' | 'training_provider' | null) ?? null,
        planMrrPence: isTrainingProvider && providerSub ? TRAINING_PROVIDER_MRR_PENCE : billing.planMrrPence,
        status,
        billingState: billing.billingState,
        rating: ra ? Math.round((ra.sum / ra.n) * 100) / 100 : null,
        clients: clientCount.get(p.id) ?? 0,
        joined: p.member_since ?? p.created_at,
        isPublished: p.is_published ?? false,
        suspendedAt: p.suspended_at ?? null,
        suspensionReason: p.suspension_reason ?? null,
        verification: p.verification as string,
        email: null,
        lifetimeValuePence: ltvMap.get(p.id) ?? 0,
        renewalDate: billing.renewalDate,
        renewalDateSource: billing.renewalDateSource,
        isTrial: billing.isTrial,
        trialDaysLeft: billing.trialDaysLeft,
        location: p.city ?? null,
        coursesCount: p.account_type === 'training_provider' ? (coursesCountByOrg.get(p.id) ?? 0) : null,
        verifiedProsLinked: null,
      };
    });

    // Free-text filter on name (post-join).
    if (data.q) {
      const q = data.q.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.handle.toLowerCase().includes(q),
      );
    }

    // Plan & hasAvatar filters (post-join).
    if (data.filters.plans?.length) {
      const set = new Set(data.filters.plans);
      const wantsTP = set.has('training_provider');
      rows = rows.filter(r => {
        if (wantsTP && r.accountType === 'training_provider') return true;
        return set.has(r.plan) && r.accountType !== 'training_provider';
      });
    }
    if (data.filters.hasAvatar === true) rows = rows.filter(r => !!r.avatarUrl);
    if (data.filters.hasAvatar === false) rows = rows.filter(r => !r.avatarUrl);

    // Billing-state tabs (post-join — billingState is computed above).
    if (data.tab === 'payment_failed') rows = rows.filter(r => r.billingState === 'payment_failed');
    if (data.tab === 'renewal_due')    rows = rows.filter(r => r.billingState === 'renewal_due');

    // Sort.
    const dir = data.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (data.sort) {
        case 'name':    return a.name.localeCompare(b.name) * dir;
        case 'plan':    return ((PLAN_RANK[a.plan] ?? 0) - (PLAN_RANK[b.plan] ?? 0)) * dir;
        case 'mrr':     return (a.planMrrPence - b.planMrrPence) * dir;
        case 'rating':  return ((a.rating ?? -1) - (b.rating ?? -1)) * dir;
        case 'clients': return (a.clients - b.clients) * dir;
        case 'lifetimeValue':  return ((a.lifetimeValuePence ?? -1) - (b.lifetimeValuePence ?? -1)) * dir;
        case 'renewalDate':    return ((a.renewalDate ? new Date(a.renewalDate).getTime() : 0) - (b.renewalDate ? new Date(b.renewalDate).getTime() : 0)) * dir;
        case 'joined':
        default:        return (new Date(a.joined).getTime() - new Date(b.joined).getTime()) * dir;
      }
    });

    const total = rows.length;
    const from = (data.page - 1) * data.pageSize;
    const paged = rows.slice(from, from + data.pageSize);

    return { rows: paged, total, page: data.page, pageSize: data.pageSize };
  });

// --- Moderation mutations -------------------------------------------------

export const setProfessionalSuspension = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professional_id: string; suspended: boolean; reason?: string }) => {
    if (!d.professional_id) throw new Error('professional_id required');
    if (d.suspended && !(d.reason ?? '').trim()) {
      throw new Error('Please provide a reason for suspension.');
    }
    return {
      professional_id: d.professional_id,
      suspended: !!d.suspended,
      reason: d.reason?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: prev } = await supabaseAdmin
      .from('professionals')
      .select('id, is_published, suspended_at, suspension_reason')
      .eq('id', data.professional_id)
      .maybeSingle();
    if (!prev) throw new Error('Professional not found');

    // Policy: a professional's public profile is NEVER hidden by REPs (Trustpilot-style).
    // "Suspending" simply drops them back to Unverified (verification = 'pending') and
    // records the reason. Reinstating restores them to Verified.
    const update = data.suspended
      ? {
          suspended_at: new Date().toISOString(),
          suspension_reason: data.reason,
          verification: 'pending' as const,
        }
      : {
          suspended_at: null,
          suspension_reason: null,
          verification: 'verified' as const,
        };

    const { error } = await supabaseAdmin
      .from('professionals')
      .update(update)
      .eq('id', data.professional_id);
    if (error) throw error;

    // Look up name + email for the notification.
    const [{ data: profile }, { data: authUser }] = await Promise.all([
      supabaseAdmin.from('profiles').select('full_name').eq('id', data.professional_id).maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(data.professional_id),
    ]);
    const email = authUser?.user?.email ?? null;
    const proName = profile?.full_name ?? null;

    if (email) {
      const { sendTransactionalEmailServer } = await import('@/lib/email/send.server');
      await sendTransactionalEmailServer({
        templateName: data.suspended ? 'professional-suspended' : 'professional-reinstated',
        recipientEmail: email,
        templateData: data.suspended
          ? { proName, reason: data.reason }
          : { proName },
      }).catch((e) => { console.error('verification status email failed', e); });
    }


    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: data.suspended ? 'professional.suspend' : 'professional.unsuspend',
      _target_table: 'professionals',
      _target_id: data.professional_id,
      _before_state: prev,
      _after_state: update,
      _reason: data.reason ?? undefined,
    });

    return { ok: true };
  });

export const setProfessionalFlag = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professional_id: string; flagged: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const verification = data.flagged ? 'rejected' : 'verified';
    const { error } = await supabaseAdmin
      .from('professionals')
      .update({ verification })
      .eq('id', data.professional_id);
    if (error) throw error;

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: data.flagged ? 'professional.flag' : 'professional.unflag',
      _target_table: 'professionals',
      _target_id: data.professional_id,
    });

    return { ok: true };
  });

export const setProfessionalPublished = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professional_id: string; is_published: boolean }) => {
    if (!d.professional_id) throw new Error('professional_id required');
    return { professional_id: d.professional_id, is_published: !!d.is_published };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: prev } = await supabaseAdmin
      .from('professionals')
      .select('id, is_published')
      .eq('id', data.professional_id)
      .maybeSingle();
    if (!prev) throw new Error('Professional not found');

    const update = data.is_published
      ? { is_published: true, unpublished_reason: null, unpublished_at: null }
      : { is_published: false, unpublished_reason: 'admin_hidden', unpublished_at: new Date().toISOString() };

    const { error } = await supabaseAdmin
      .from('professionals')
      .update(update)
      .eq('id', data.professional_id);
    if (error) throw error;

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: data.is_published ? 'professional.publish' : 'professional.unpublish',
      _target_table: 'professionals',
      _target_id: data.professional_id,
      _before_state: prev,
      _after_state: update,
    });

    return { ok: true, is_published: data.is_published };
  });

// --- Subscription cancel + account delete ---------------------------------

async function cancelStripeSubsForUser(userId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_subscription_id, environment')
    .eq('user_id', userId);
  if (!subs || subs.length === 0) return { cancelled: 0 };

  const { createStripeClient } = await import('@/lib/billing/stripe.server');
  let cancelled = 0;
  for (const s of subs as { stripe_subscription_id: string | null; environment: string | null }[]) {
    if (!s.stripe_subscription_id) continue;
    const env = (s.environment === 'live' ? 'live' : 'sandbox') as 'live' | 'sandbox';
    try {
      const stripe = createStripeClient(env);
      await stripe.subscriptions.cancel(s.stripe_subscription_id);
      cancelled++;
    } catch (e) {
      console.warn('[admin.cancelSub] stripe cancel failed', e);
    }
  }
  return { cancelled };
}

export const cancelProfessionalSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professional_id: string; reason?: string }) => {
    if (!d.professional_id) throw new Error('professional_id required');
    return { professional_id: d.professional_id, reason: d.reason?.trim() || null };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { cancelled } = await cancelStripeSubsForUser(data.professional_id);

    // Mark local subscription rows as canceled so the dashboard reflects state immediately.
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() } as never)
      .eq('user_id', data.professional_id);

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: 'professional.cancel_subscription',
      _target_table: 'subscriptions',
      _target_id: data.professional_id,
      _reason: data.reason ?? undefined,
    });

    return { ok: true, cancelled };
  });

export const deleteProfessional = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professional_id: string; reason?: string }) => {
    if (!d.professional_id) throw new Error('professional_id required');
    return { professional_id: d.professional_id, reason: d.reason?.trim() || null };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.professional_id === context.userId) {
      throw new Error('You cannot delete your own admin account from here.');
    }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    // Snapshot for audit log before deletion.
    const { data: prev } = await supabaseAdmin
      .from('professionals')
      .select('id, full_name, slug, is_published')
      .eq('id', data.professional_id)
      .maybeSingle();

    // Best-effort: cancel Stripe subscriptions first.
    await cancelStripeSubsForUser(data.professional_id).catch((e) =>
      console.warn('[deleteProfessional] cancel subs failed', e),
    );

    // Auth user delete cascades via FKs to professionals + related rows.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.professional_id);
    if (error) throw error;

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: 'professional.delete',
      _target_table: 'professionals',
      _target_id: data.professional_id,
      _before_state: prev,
      _reason: data.reason ?? undefined,
    });

    return { ok: true };
  });
