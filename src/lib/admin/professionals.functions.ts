import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type AdminProRow = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  location: string | null;
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
    const sinceRating = new Date(Date.now() - 365 * 24 * 60 * 60_000).toISOString();

    const [active, verified, signups30, signupsPrev30, ratingRows] = await Promise.all([
      supabaseAdmin.from('professionals').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabaseAdmin.from('professionals').select('id', { count: 'exact', head: true }).eq('verification', 'verified'),
      supabaseAdmin.from('professionals').select('id', { count: 'exact', head: true }).gte('created_at', since30),
      supabaseAdmin.from('professionals').select('id', { count: 'exact', head: true }).gte('created_at', since60).lt('created_at', since30),
      supabaseAdmin.from('reviews').select('rating').eq('status', 'published').gte('created_at', sinceRating),
    ]);

    const activeCount = active.count ?? 0;
    const verifiedCount = verified.count ?? 0;
    const signups = signups30.count ?? 0;
    const prevSignups = signupsPrev30.count ?? 0;
    const ratings = (ratingRows.data ?? []).map(r => r.rating as number).filter(Boolean);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const wow = prevSignups ? ((signups - prevSignups) / prevSignups) * 100 : null;

    return {
      activeCount, verifiedCount,
      verifiedPct: activeCount ? (verifiedCount / activeCount) * 100 : 0,
      avgRating, newSignups30: signups, newSignupsDeltaPct: wow,
    };
  });

const TAB_VALUES = ['all', 'verified', 'pending', 'flagged', 'suspended', 'recent'] as const;
export type AdminProTab = typeof TAB_VALUES[number];
export type AdminProSort = 'joined' | 'name' | 'plan' | 'rating' | 'clients' | 'mrr';
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
        'id, slug, city, primary_profession, verification, is_published, created_at, member_since, suspended_at, suspension_reason',
        { count: 'exact' }
      );

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
    const { data: pros, count, error } = await query
      .order('member_since', { ascending: false, nullsFirst: false })
      .limit(FETCH_CAP);
    if (error) throw error;

    const ids = (pros ?? []).map(p => p.id);
    if (ids.length === 0) {
      return { rows: [] as AdminProRow[], total: count ?? 0, page: data.page, pageSize: data.pageSize };
    }

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

    const [profilesData, subsData, reviewsData, ccData] = await Promise.all([
      fetchAll<{ id: string; full_name: string | null; avatar_url: string | null }>((c) =>
        supabaseAdmin.from('profiles').select('id, full_name, avatar_url').in('id', c)),
      fetchAll<{ user_id: string; tier: string; status: string; created_at: string }>((c) =>
        supabaseAdmin.from('subscriptions').select('user_id, tier, status, created_at').in('user_id', c)),
      fetchAll<{ professional_id: string; rating: number }>((c) =>
        supabaseAdmin.from('reviews').select('professional_id, rating').in('professional_id', c).eq('status', 'published')),
      fetchAll<{ professional_id: string; status: string }>((c) =>
        supabaseAdmin.from('coach_client').select('professional_id, status').in('professional_id', c).eq('status', 'active')),
    ]);

    const profileMap = new Map(profilesData.map((p) => [p.id, p]));
    const subMap = new Map<string, string>();
    for (const s of subsData) {
      if (!['active', 'trialing', 'past_due'].includes(s.status)) continue;
      if (!subMap.has(s.user_id)) subMap.set(s.user_id, s.tier);
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

    let rows: AdminProRow[] = (pros ?? []).map(p => {
      const profile = profileMap.get(p.id);
      const tier = (subMap.get(p.id) ?? 'free') as AdminProRow['plan'];
      const ra = ratingAcc.get(p.id);
      const status: AdminProRow['status'] =
        p.is_published === false && p.suspended_at ? 'suspended'
        : p.verification === 'verified' && p.is_published ? 'verified'
        : p.verification === 'rejected' && p.is_published ? 'flagged'
        : 'pending';
      const name = profile?.full_name ?? 'Unnamed';
      return {
        id: p.id,
        name,
        handle: p.slug ? `@${p.slug}` : '—',
        avatarUrl: profile?.avatar_url ?? null,
        location: p.city ?? null,
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
      };
    });

    // Free-text filter on name (post-join).
    if (data.q) {
      const q = data.q.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.handle.toLowerCase().includes(q) ||
        (r.location ?? '').toLowerCase().includes(q),
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
