import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type AdminProRow = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  location: string | null;
  profession: string | null;
  plan: 'free' | 'verified' | 'pro' | 'studio';
  planMrrPence: number;
  status: 'verified' | 'pending' | 'flagged' | 'suspended' | 'unpublished';
  rating: number | null;
  clients: number;
  joined: string;
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
    case 'verified': return 825;   // £99/yr ÷ 12
    case 'pro':      return 5900;  // £59/mo
    case 'studio':   return 14900; // £149/mo
    default:         return 0;
  }
}

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
      activeCount,
      verifiedCount,
      verifiedPct: activeCount ? (verifiedCount / activeCount) * 100 : 0,
      avgRating,
      newSignups30: signups,
      newSignupsDeltaPct: wow,
    };
  });

const TAB_VALUES = ['all', 'verified', 'pending', 'flagged', 'suspended', 'recent'] as const;
export type AdminProTab = typeof TAB_VALUES[number];

export const listAdminProfessionals = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string; tab?: AdminProTab; page?: number; pageSize?: number }) => ({
    q: (d.q ?? '').trim(),
    tab: (d.tab ?? 'all') as AdminProTab,
    page: Math.max(1, d.page ?? 1),
    pageSize: Math.min(100, Math.max(5, d.pageSize ?? 25)),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    let query = supabaseAdmin
      .from('professionals')
      .select(
        'id, slug, city, primary_profession, verification, is_published, created_at',
        { count: 'exact' }
      );

    switch (data.tab) {
      case 'verified':   query = query.eq('verification', 'verified'); break;
      case 'pending':    query = query.eq('verification', 'pending'); break;
      case 'flagged':    query = query.eq('verification', 'rejected'); break;
      case 'suspended':  query = query.eq('is_published', false).eq('verification', 'verified'); break;
      case 'recent': {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
        query = query.gte('created_at', since);
        break;
      }
    }

    if (data.q) {
      // Match against slug; name search runs after we join profiles below.
      query = query.or(`slug.ilike.%${data.q}%,city.ilike.%${data.q}%`);
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: pros, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    const ids = (pros ?? []).map(p => p.id);
    if (ids.length === 0) {
      return { rows: [] as AdminProRow[], total: count ?? 0, page: data.page, pageSize: data.pageSize };
    }

    const [profilesRes, subsRes, reviewsRes, ccRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, full_name, avatar_url').in('id', ids),
      supabaseAdmin.from('subscriptions').select('user_id, tier, status, created_at').in('user_id', ids),
      supabaseAdmin.from('reviews').select('professional_id, rating').in('professional_id', ids).eq('status', 'published'),
      supabaseAdmin.from('coach_client').select('professional_id, status').in('professional_id', ids).eq('status', 'active'),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));
    const subMap = new Map<string, string>();
    for (const s of subsRes.data ?? []) {
      if (!['active', 'trialing', 'past_due'].includes(s.status as string)) continue;
      if (!subMap.has(s.user_id)) subMap.set(s.user_id, s.tier as string);
    }
    const ratingAcc = new Map<string, { sum: number; n: number }>();
    for (const r of reviewsRes.data ?? []) {
      const cur = ratingAcc.get(r.professional_id) ?? { sum: 0, n: 0 };
      cur.sum += r.rating as number; cur.n += 1;
      ratingAcc.set(r.professional_id, cur);
    }
    const clientCount = new Map<string, number>();
    for (const c of ccRes.data ?? []) {
      clientCount.set(c.professional_id, (clientCount.get(c.professional_id) ?? 0) + 1);
    }

    let rows: AdminProRow[] = (pros ?? []).map(p => {
      const profile = profileMap.get(p.id);
      const tier = (subMap.get(p.id) ?? 'free') as AdminProRow['plan'];
      const ra = ratingAcc.get(p.id);
      const status: AdminProRow['status'] =
        p.is_published === false && p.verification === 'verified' ? 'suspended'
        : p.is_published === false ? 'unpublished'
        : p.verification === 'verified' ? 'verified'
        : p.verification === 'rejected' ? 'flagged'
        : 'pending';
      const name = profile?.full_name ?? 'Unnamed';
      return {
        id: p.id,
        name,
        handle: p.slug ? `@${p.slug}` : '—',
        avatarUrl: profile?.avatar_url ?? null,
        location: p.city ?? null,
        profession: p.primary_profession ? (PROFESSION_LABEL[p.primary_profession] ?? p.primary_profession) : null,
        plan: tier,
        planMrrPence: planMrrPence(tier),
        status,
        rating: ra ? Math.round((ra.sum / ra.n) * 100) / 100 : null,
        clients: clientCount.get(p.id) ?? 0,
        joined: p.created_at,
      };
    });

    // Name-side search filter (we can't easily server-filter across the join).
    if (data.q) {
      const q = data.q.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.handle.toLowerCase().includes(q) ||
        (r.location ?? '').toLowerCase().includes(q),
      );
    }

    return { rows, total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });
