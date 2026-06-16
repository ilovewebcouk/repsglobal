import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', {
    _user_id: ctx.userId,
    _role: 'admin' as never,
  });
  if (!isAdmin) throw new Error('Forbidden');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendProfessionalInvite = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; full_name?: string; plan?: 'verified' | 'pro' }) => {
    const email = (d.email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error('Please enter a valid email address.');
    return {
      email,
      full_name: d.full_name?.trim() || null,
      plan: (d.plan === 'verified' ? 'verified' : 'pro') as 'verified' | 'pro',
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    // Resolve inviter display name for the email body.
    const { data: inviter } = await supabaseAdmin
      .from('profiles').select('full_name').eq('id', context.userId).maybeSingle();
    const inviterName = inviter?.full_name ?? 'The REPs team';

    // Supabase's generateLink throws a clear error if the email already exists,
    // so we let it surface naturally below.



    // Generate Supabase invite link (creates user + sends magic-link to redirectTo on click).
    const redirectTo = `https://repsuk.org/pricing?invited_plan=${data.plan}`;
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: data.email,
      options: { redirectTo, data: { signup_kind: 'professional', full_name: data.full_name } },
    });
    if (linkErr) {
      // Surface common cases as friendly errors.
      if (/already.*registered|exists/i.test(linkErr.message)) {
        throw new Error('That email is already registered on REPs.');
      }
      throw new Error(linkErr.message);
    }
    const inviteUrl = linkData.properties?.action_link ?? redirectTo;

    // Send branded invite email through existing transactional pipeline.
    const { sendTransactionalEmailServer } = await import('@/lib/email/send.server');
    const sendRes = await sendTransactionalEmailServer({
      templateName: 'professional-invite',
      recipientEmail: data.email,
      templateData: {
        inviteeName: data.full_name ?? null,
        inviterName,
        planLabel: data.plan === 'verified' ? 'Verified (£99/yr)' : 'Pro Founding (£59/mo)',
        acceptUrl: inviteUrl,
      },
    });

    // Track invite.
    await supabaseAdmin.from('admin_pro_invites').insert({
      email: data.email,
      full_name: data.full_name,
      plan: data.plan,
      invited_by: context.userId,
      invite_url: inviteUrl,
      email_message_id: (sendRes as { messageId?: string }).messageId ?? null,
    });

    await supabaseAdmin.rpc('log_admin_action', {
      _actor_id: context.userId,
      _action: 'pro_invite.send',
      _target_table: 'admin_pro_invites',
      _reason: `plan=${data.plan} email=${data.email}`,
    });

    return { ok: true, email: data.email };
  });
