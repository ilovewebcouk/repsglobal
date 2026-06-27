import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type AdminProRow = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  
  profession: string | null;
  professionSlug: string | null;
  plan: 'free' | 'verified' | 'pro' | 'studio';
  planMrrPence: number;
  status: 'verified' | 'pending' | 'flagged' | 'suspended';
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

function planMrrPence(tier: string): number {
  switch (tier) {
    case 'verified': return 825;
    case 'pro':      return 5900;
    case 'studio':   return 14900;
    default:         return 0;
  }
}

const PLAN_RANK: Record<string, number> = { studio: 4, pro: 3, verified: 2, free: 1 };

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
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
    const since60 = new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString();

    // KPI counts only include professionals whose underlying auth user is
    // email-confirmed (i.e. actually signed up — invited-but-unaccepted
    // shells from `generateLink({ type: 'invite' })` are excluded).
    // "Active" = confirmed signed-up members, regardless of publish status,
    // so the Verified subtext "N of M" shares the same denominator.
    const [activeRes, verifiedRes, signups30Res, signupsPrev30Res, paidRes, adminRolesRes] = await Promise.all([
      supabaseAdmin.rpc('count_confirmed_professionals', { _only_published: false }),
      supabaseAdmin.rpc('count_confirmed_professionals', { _only_published: false, _verification: 'verified' }),
      supabaseAdmin.rpc('count_confirmed_pro_signups', { _since: since30 }),
      supabaseAdmin.rpc('count_confirmed_pro_signups', { _since: since60, _until: since30 }),
      supabaseAdmin
        .from('subscriptions')
        .select('user_id, tier, status')
        .in('status', ['active', 'trialing'])
        .neq('tier', 'free'),
      supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin'),
    ]);

    const adminIds = new Set(((adminRolesRes.data ?? []) as Array<{ user_id: string }>).map(r => r.user_id));
    // KPIs exclude platform admins so the totals match the Professionals list.
    // Only subtract admins who are actually counted by
    // count_confirmed_professionals — i.e. they have a non-demo professionals
    // row AND an email-confirmed auth user. Subtracting every admin role
    // would under-count when an admin has no pro row (e.g. Scott).
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
    const paidCount = new Set(
      ((paidRes.data ?? []) as Array<{ user_id: string }>)
        .filter(r => !adminIds.has(r.user_id))
        .map(r => r.user_id),
    ).size;
    const wow = prevSignups ? ((signups - prevSignups) / prevSignups) * 100 : null;

    return {
      activeCount, verifiedCount,
      verifiedPct: activeCount ? (verifiedCount / activeCount) * 100 : 0,
      paidCount,
      newSignups30: signups, newSignupsDeltaPct: wow,
    };
  });

const TAB_VALUES = ['all', 'verified', 'pending', 'flagged', 'suspended', 'recent', 'demos'] as const;
export type AdminProTab = typeof TAB_VALUES[number];
export type AdminProSort = 'joined' | 'name' | 'plan' | 'rating' | 'clients' | 'mrr' | 'lifetimeValue' | 'renewalDate';
export type SortDir = 'asc' | 'desc';

export type AdminProFilters = {
  plans?: ('free' | 'verified' | 'pro' | 'studio')[];
  professions?: string[];
  hasAvatar?: boolean;
};

export const listAdminProfessionals = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    q?: string; tab?: AdminProTab; page?: number; pageSize?: number;
    sort?: AdminProSort; dir?: SortDir; filters?: AdminProFilters;
  }) => ({
    q: (d.q ?? '').trim(),
    tab: (d.tab ?? 'all') as AdminProTab,
    page: Math.max(1, d.page ?? 1),
    pageSize: Math.min(100, Math.max(5, d.pageSize ?? 25)),
    sort: (d.sort ?? 'joined') as AdminProSort,
    dir: (d.dir ?? 'desc') as SortDir,
    filters: d.filters ?? {},
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    // Fetch a generously sized window so we can sort across joined data
    // (rating/clients/plan) without an RPC. Realistic register sizes for v1.
    const FETCH_CAP = 1000;

    let query = supabaseAdmin
      .from('professionals')
      .select(
        'id, slug, city, primary_profession, verification, is_published, created_at, member_since, suspended_at, suspension_reason, is_demo',
        { count: 'exact' }
      );

    // Demos tab shows only fake/demo records; every other tab excludes them.
    if (data.tab === 'demos') {
      query = query.eq('is_demo', true);
    } else {
      query = query.eq('is_demo', false);
    }

    switch (data.tab) {
      case 'verified':   query = query.eq('verification', 'verified').eq('is_published', true); break;
      case 'pending':    query = query.eq('verification', 'pending'); break;
      case 'flagged':    query = query.eq('verification', 'rejected'); break;
      case 'suspended':  query = query.eq('is_published', false).not('suspended_at', 'is', null); break;
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
      query = query.or(`slug.ilike.%${data.q}%,city.ilike.%${data.q}%`);
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

    // Filter to professionals whose auth user is email-confirmed (actually
    // signed up). Invited-but-unaccepted shells from `generateLink({ type:
    // 'invite' })` are hidden — they are not members yet.
    // Also exclude platform admins — they're managed at /admin/team.
    const [confirmedRes, adminRoleRes] = await Promise.all([
      supabaseAdmin.rpc('get_confirmed_professional_ids', { _ids: allIds }),
      supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin'),
    ]);
    if (confirmedRes.error) throw confirmedRes.error;
    if (adminRoleRes.error) throw adminRoleRes.error;
    const confirmedSet = new Set(((confirmedRes.data ?? []) as string[]).map(String));
    const adminIdSet = new Set(((adminRoleRes.data ?? []) as Array<{ user_id: string }>).map(r => r.user_id));
    const ids = allIds.filter(id => confirmedSet.has(id) && !adminIdSet.has(id));
    if (ids.length === 0) {
      return { rows: [] as AdminProRow[], total: 0, page: data.page, pageSize: data.pageSize };
    }
    const prosFiltered = (pros ?? []).filter(p => confirmedSet.has(p.id) && !adminIdSet.has(p.id));

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

    const [profilesData, subsData, reviewsData, ccData, paymentsData, bdSeedData] = await Promise.all([
      fetchAll<{ id: string; full_name: string | null; avatar_url: string | null }>((c) =>
        supabaseAdmin.from('profiles').select('id, full_name, avatar_url').in('id', c)),
      fetchAll<{ user_id: string; tier: string; status: string; created_at: string; current_period_end: string | null; billing_period: string | null }>((c) =>
        supabaseAdmin.from('subscriptions').select('user_id, tier, status, created_at, current_period_end, billing_period').in('user_id', c)),
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
    ]);
    const bdDueMap = new Map<string, string>();
    for (const r of bdSeedData) {
      if (r.claimed_user_id && r.bd_next_due_date) bdDueMap.set(r.claimed_user_id, r.bd_next_due_date);
    }

    const profileMap = new Map(profilesData.map((p) => [p.id, p]));
    const subMap = new Map<string, string>();
    const subDetailMap = new Map<string, { createdAt: string; currentPeriodEnd: string | null; status: string }>();
    for (const s of subsData) {
      if (!['active', 'trialing', 'past_due'].includes(s.status)) continue;
      if (!subMap.has(s.user_id)) {
        subMap.set(s.user_id, s.tier);
        subDetailMap.set(s.user_id, { createdAt: s.created_at, currentPeriodEnd: s.current_period_end, status: s.status });
      }
    }
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

    let rows: AdminProRow[] = prosFiltered.map(p => {
      const profile = profileMap.get(p.id);
      const tier = (subMap.get(p.id) ?? 'free') as AdminProRow['plan'];
      const ra = ratingAcc.get(p.id);
      const status: AdminProRow['status'] =
        p.is_published === false && p.suspended_at ? 'suspended'
        : p.verification === 'verified' && p.is_published ? 'verified'
        : p.verification === 'rejected' && p.is_published ? 'flagged'
        : 'pending';
      const name = profile?.full_name ?? 'Unnamed';
      const subDetail = subDetailMap.get(p.id);
      return {
        id: p.id,
        name,
        handle: p.slug ? `@${p.slug}` : '—',
        avatarUrl: profile?.avatar_url ?? null,
        
        profession: p.primary_profession ? (PROFESSION_LABEL[p.primary_profession] ?? p.primary_profession) : null,
        professionSlug: p.primary_profession ?? null,
        plan: tier,
        planMrrPence: planMrrPence(tier),
        status,
        rating: ra ? Math.round((ra.sum / ra.n) * 100) / 100 : null,
        clients: clientCount.get(p.id) ?? 0,
        joined: p.member_since ?? p.created_at,
        isPublished: p.is_published ?? false,
        suspendedAt: p.suspended_at ?? null,
        suspensionReason: p.suspension_reason ?? null,
        verification: p.verification as string,
        email: null,
        lifetimeValuePence: ltvMap.get(p.id) ?? 0,
        renewalDate: subDetail?.currentPeriodEnd ?? bdDueMap.get(p.id) ?? null,
        renewalDateSource: subDetail?.currentPeriodEnd ? 'stripe' : bdDueMap.has(p.id) ? 'bd' : null,
        isTrial: subDetail?.status === 'trialing',
        trialDaysLeft: subDetail?.status === 'trialing' && subDetail.currentPeriodEnd
          ? Math.max(0, Math.ceil((new Date(subDetail.currentPeriodEnd).getTime() - Date.now()) / 86400000))
          : null,
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
      rows = rows.filter(r => set.has(r.plan));
    }
    if (data.filters.hasAvatar === true) rows = rows.filter(r => !!r.avatarUrl);
    if (data.filters.hasAvatar === false) rows = rows.filter(r => !r.avatarUrl);

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

    const update = data.suspended
      ? { is_published: false, suspended_at: new Date().toISOString(), suspension_reason: data.reason }
      : { is_published: true, suspended_at: null, suspension_reason: null };

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
      }).catch((e) => { console.error('suspension email failed', e); });
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
      .select('id, display_name, slug, is_published')
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
