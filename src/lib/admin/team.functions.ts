import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type AdminTeamRow = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  grantedAt: string | null;
  isSelf: boolean;
};

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', {
    _user_id: ctx.userId,
    _role: 'admin' as never,
  });
  if (!isAdmin) throw new Error('Forbidden');
}

export const listAdmins = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTeamRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: roles, error } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, created_at')
      .eq('role', 'admin');
    if (error) throw error;

    const ids = (roles ?? []).map(r => r.user_id);
    if (ids.length === 0) return [];

    const profilesRes = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids);

    const profileMap = new Map(
      ((profilesRes.data ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>)
        .map(p => [p.id, p]),
    );

    // Fetch emails via auth admin (one request each — admin teams are tiny).
    const emails = new Map<string, string | null>();
    await Promise.all(
      ids.map(async (id) => {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(id);
          emails.set(id, data?.user?.email ?? null);
        } catch {
          emails.set(id, null);
        }
      }),
    );

    return (roles ?? [])
      .map((r) => {
        const p = profileMap.get(r.user_id);
        return {
          userId: r.user_id,
          email: emails.get(r.user_id) ?? null,
          fullName: p?.full_name ?? null,
          avatarUrl: p?.avatar_url ?? null,
          grantedAt: r.created_at ?? null,
          isSelf: r.user_id === context.userId,
        };
      })
      .sort((a, b) => {
        // Self first, then by grantedAt asc (oldest admin near top).
        if (a.isSelf && !b.isSelf) return -1;
        if (!a.isSelf && b.isSelf) return 1;
        const at = a.grantedAt ? new Date(a.grantedAt).getTime() : 0;
        const bt = b.grantedAt ? new Date(b.grantedAt).getTime() : 0;
        return at - bt;
      });
  });

export const grantAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => {
    const email = (d.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) throw new Error('Enter a valid email address.');
    return { email };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    // Resolve inviter display name for the email body.
    const { data: inviter } = await supabaseAdmin
      .from('profiles').select('full_name').eq('id', context.userId).maybeSingle();
    const inviterName = inviter?.full_name ?? 'The REPs team';

    // Look up the user. Admins are platform staff — they may not be REPS
    // members, so if no auth.users row exists yet we invite them by email.
    let foundId: string | null = null;
    let page = 1;
    const perPage = 1000;
    while (page <= 10) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const match = (list?.users ?? []).find(u => (u.email ?? '').toLowerCase() === data.email);
      if (match) { foundId = match.id; break; }
      if (!list || list.users.length < perPage) break;
      page++;
    }

    let invited = false;
    if (!foundId) {
      // Use generateLink so we can send a REPs-branded email via Mailgun
      // instead of Supabase's default invite email.
      const redirectTo = 'https://repsuk.org/admin';
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: data.email,
        options: { redirectTo, data: { signup_kind: 'admin' } },
      });
      if (linkErr || !linkData?.user?.id) {
        throw new Error(linkErr?.message ?? `Could not create invite for ${data.email}.`);
      }
      foundId = linkData.user.id;
      const inviteUrl = linkData.properties?.action_link ?? redirectTo;

      const { sendTransactionalEmailServer } = await import('@/lib/email/send.server');
      await sendTransactionalEmailServer({
        templateName: 'admin-invite',
        recipientEmail: data.email,
        templateData: {
          inviteeName: null,
          inviterName,
          acceptUrl: inviteUrl,
        },
      });
      invited = true;
    }

    const { error: insErr } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: foundId, role: 'admin' as never })
      .select()
      .maybeSingle();
    // ON CONFLICT semantics — Postgres unique on (user_id, role). Treat dup as success.
    if (insErr && !/duplicate key|unique/i.test(insErr.message)) throw insErr;

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: 'admin.grant',
      _target_table: 'user_roles',
      _target_id: foundId,
      _after_state: { role: 'admin', email: data.email, invited },
    });

    return { ok: true, userId: foundId, invited };
  });

export const revokeAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => {
    if (!d.userId) throw new Error('userId required');
    return { userId: d.userId };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("You can't remove your own admin access. Ask another admin to do it.");
    }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', data.userId)
      .eq('role', 'admin' as never);
    if (error) throw error;

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: 'admin.revoke',
      _target_table: 'user_roles',
      _target_id: data.userId,
    });

    return { ok: true };
  });
