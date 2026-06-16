import { createServerFn } from '@tanstack/react-start';
import { getRequest, setResponseHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const COOKIE_NAME = 'reps_impersonate';
const SESSION_MINUTES = 30;

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function buildCookie(value: string | null, maxAgeSeconds: number): string {
  // Path=/ so it travels with every request. SameSite=Lax keeps the cookie
  // on top-level navigations within the site. HttpOnly + Secure for safety.
  const base = `${COOKIE_NAME}=${value ?? ''}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  return `${base}; Max-Age=${maxAgeSeconds}`;
}

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

    const token = crypto.randomUUID() + '.' + crypto.randomUUID();
    const endsAt = new Date(Date.now() + SESSION_MINUTES * 60_000).toISOString();
    const request = getRequest();
    const ua = request?.headers.get('user-agent') ?? null;
    const fwd = request?.headers.get('x-forwarded-for') ?? null;
    const ip = fwd ? fwd.split(',')[0].trim() : null;

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

    setResponseHeader('set-cookie', buildCookie(token, SESSION_MINUTES * 60));

    return { ok: true, endsAt, slug: target.slug };
  });

export const stopImpersonation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const request = getRequest();
    const token = readCookie(request?.headers.get('cookie') ?? null, COOKIE_NAME);

    if (token) {
      await supabaseAdmin
        .from('admin_impersonation_sessions')
        .update({ ended_at: new Date().toISOString(), ended_reason: 'admin_exit' })
        .eq('admin_id', context.userId)
        .eq('session_token', token)
        .is('ended_at', null);

      await supabaseAdmin.rpc('log_admin_action', {
        _actor_id: context.userId,
        _action: 'impersonation.stop',
      });
    }

    // Clear cookie.
    setResponseHeader('set-cookie', buildCookie('', 0));
    return { ok: true };
  });

export const getImpersonationStatus = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const request = getRequest();
    const token = readCookie(request?.headers.get('cookie') ?? null, COOKIE_NAME);
    if (!token) return { active: false as const };

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: session } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .select('professional_id, started_at, ends_at')
      .eq('admin_id', context.userId)
      .eq('session_token', token)
      .is('ended_at', null)
      .maybeSingle();

    if (!session || new Date(session.ends_at).getTime() < Date.now()) {
      return { active: false as const };
    }

    const [{ data: prof }, { data: profile }] = await Promise.all([
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
    ]);

    return {
      active: true as const,
      professional_id: session.professional_id,
      slug: prof?.slug ?? null,
      name: profile?.full_name ?? 'Professional',
      avatarUrl: profile?.avatar_url ?? null,
      startedAt: session.started_at,
      endsAt: session.ends_at,
    };
  });
