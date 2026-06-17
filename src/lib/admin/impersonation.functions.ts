import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const SESSION_MINUTES = 30;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', {
    _user_id: ctx.userId,
    _role: 'admin' as never,
  });
  if (!isAdmin) throw new Error('Forbidden');
}

export const startImpersonation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professional_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    // Verify target is a real professional.
    const { data: target } = await supabaseAdmin
      .from('professionals')
      .select('id, slug')
      .eq('id', data.professional_id)
      .maybeSingle();
    if (!target) throw new Error('Professional not found');

    // End any prior active sessions for this admin (one at a time).
    await supabaseAdmin
      .from('admin_impersonation_sessions')
      .update({ ended_at: new Date().toISOString(), ended_reason: 'superseded' })
      .eq('admin_id', context.userId)
      .is('ended_at', null);

    const endsAt = new Date(Date.now() + SESSION_MINUTES * 60_000).toISOString();
    const request = getRequest();
    const ua = request?.headers.get('user-agent') ?? null;
    const fwd = request?.headers.get('x-forwarded-for') ?? null;
    const ip = fwd ? fwd.split(',')[0].trim() : null;

    // session_token is NOT NULL on the table; fill with a uuid even though
    // we no longer use it for lookup (kept for audit trail).
    const token = crypto.randomUUID() + '.' + crypto.randomUUID();

    const { error } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .insert({
        admin_id: context.userId,
        professional_id: target.id,
        session_token: token,
        ends_at: endsAt,
        ip,
        user_agent: ua,
      });
    if (error) throw error;

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: 'impersonation.start',
      _target_table: 'professionals',
      _target_id: target.id,
    });

    return { ok: true, endsAt, slug: target.slug };
  });

export const stopImpersonation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    await supabaseAdmin
      .from('admin_impersonation_sessions')
      .update({ ended_at: new Date().toISOString(), ended_reason: 'admin_exit' })
      .eq('admin_id', context.userId)
      .is('ended_at', null);

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: 'impersonation.stop',
    });

    return { ok: true };
  });

export const getImpersonationStatus = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only real admins can ever be impersonating. Skip the DB lookup otherwise.
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin' as never,
    });
    if (!isAdmin) return { active: false as const };

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: session } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .select('professional_id, started_at, ends_at')
      .eq('admin_id', context.userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session || new Date(session.ends_at).getTime() < Date.now()) {
      return { active: false as const };
    }

    const [{ data: prof }, { data: profile }, { data: sub }] = await Promise.all([
      supabaseAdmin
        .from('professionals')
        .select('id, slug')
        .eq('id', session.professional_id)
        .maybeSingle(),
      supabaseAdmin
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.professional_id)
        .maybeSingle(),
      supabaseAdmin
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', session.professional_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const liveStatuses = ['active', 'trialing', 'past_due', 'unpaid'];
    const tier: 'verified' | 'pro' | 'studio' =
      sub && liveStatuses.includes(sub.status as string) &&
      (sub.tier === 'verified' || sub.tier === 'pro' || sub.tier === 'studio')
        ? (sub.tier as 'verified' | 'pro' | 'studio')
        : 'verified';

    return {
      active: true as const,
      professional_id: session.professional_id,
      slug: prof?.slug ?? null,
      name: profile?.full_name ?? 'Professional',
      avatarUrl: profile?.avatar_url ?? null,
      tier,
      startedAt: session.started_at,
      endsAt: session.ends_at,
    };
  });
