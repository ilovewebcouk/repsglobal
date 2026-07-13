// One-off admin utility: for a hardcoded list of (email, stripe_customer_id)
// pairs where the CSV email doesn't match the Stripe email, honour their
// last legacy payment as an active Core subscription paid through the next
// annual/monthly renewal, create the auth user if missing, and send the
// standard REPs invite email.
import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

type Kind = 'annual' | 'monthly';

interface Entry {
  email: string;             // canonical email we want on the account
  customerId: string;        // Stripe customer id (verified in Stripe manually)
  kind?: Kind;               // defaults to 'annual' for the current batch
}

// Hardcoded batch supplied by the user. All annual for now.
const ENTRIES: Entry[] = [
  { email: 'altfitness@myyahoo.com',            customerId: 'cus_UYIRXSbIcepboB' },
  { email: 'elizabeth.payne@live.co.uk',        customerId: 'cus_SlmqqtvoFPqs1A' },
  { email: 'emily.young@slimmingworld.co.uk',   customerId: 'cus_T8gA6WeeZTVbSD' },
  { email: 'faracifitness@hotmail.co.uk',       customerId: 'cus_Rj5G1BhvgWySk6' },
  { email: 'hello@fionadillon.com',             customerId: 'cus_TuaLHfAp2qA9NQ' },
  { email: 'hellotiredmumclubnorwich@gmail.com', customerId: 'cus_TIhNR3SffkVnYG' },
  { email: 'sarah@theyogaconnection.co.uk',     customerId: 'cus_TtOwIQnCpsPNPl' },
  { email: 'scarrfitness@gmail.com',            customerId: 'cus_SnBIGuGtQBNv4v' },
  { email: 'sophia@sophiasmithfitness.com',     customerId: 'cus_SacYVgBBY6mAGD' },
  { email: 'steven@trainyourneedsfirst.co.uk',  customerId: 'cus_T2WbfL3CHDZqcR' },
  { email: 'thehuffkin@hotmail.com',            customerId: 'cus_RrqhXI7fAKWE6n' },
];

interface RowResult {
  email: string;
  customerId: string;
  action: 'created' | 'reused' | 'skipped' | 'error';
  detail: string;
  currentPeriodEnd?: string;
  userId?: string;
}

function addPeriod(iso: string, kind: Kind): string {
  const d = new Date(iso);
  if (kind === 'annual') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

export const manualRelinkStripeCustomers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin' as never,
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { sendTransactionalEmailServer } = await import('@/lib/email/send.server');

    const { data: inviter } = await supabaseAdmin
      .from('profiles').select('full_name').eq('id', context.userId).maybeSingle();
    const inviterName = inviter?.full_name ?? 'The REPs team';

    const results: RowResult[] = [];

    for (const entry of ENTRIES) {
      const email = entry.email.trim().toLowerCase();
      const kind: Kind = entry.kind ?? 'annual';
      try {
        // 1) Look up latest legacy payment by customer id
        const { data: pay, error: payErr } = await supabaseAdmin
          .from('legacy_stripe_payments')
          .select('paid_at, amount_pence, status')
          .eq('stripe_customer_id', entry.customerId)
          .eq('status', 'Paid')
          .order('paid_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (payErr) throw new Error(`legacy_stripe_payments: ${payErr.message}`);
        if (!pay?.paid_at) {
          results.push({ email, customerId: entry.customerId, action: 'skipped', detail: 'no legacy payment found' });
          continue;
        }
        const currentPeriodEnd = addPeriod(pay.paid_at, kind);

        // 2) Create or reuse auth user for this email
        let userId: string | null = null;
        let action: 'created' | 'reused' = 'reused';
        let inviteUrl: string | null = null;

        const { data: existingList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = existingList?.users?.find(
          (u) => (u.email ?? '').toLowerCase() === email,
        );

        if (existing) {
          userId = existing.id;
          action = 'reused';
        } else {
          const redirectTo = `https://repsuk.org/dashboard`;
          const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email,
            options: {
              redirectTo,
              data: { signup_kind: 'professional', migrated_from_bd: true },
            },
          });
          if (linkErr) throw new Error(`generateLink: ${linkErr.message}`);
          userId = linkData.user?.id ?? null;
          inviteUrl = linkData.properties?.action_link ?? redirectTo;
          action = 'created';
        }
        if (!userId) throw new Error('no user id resolved');

        // 3) Ensure a professionals row exists
        const { data: prof } = await supabaseAdmin
          .from('professionals').select('id').eq('id', userId).maybeSingle();
        if (!prof) {
          await supabaseAdmin.from('professionals').insert({
            id: userId,
            account_type: 'individual',
            is_published: false,
          } as never);
        }

        // 4) Upsert subscriptions row (live, honour period)
        const row = {
          user_id: userId,
          owner_id: userId,
          stripe_customer_id: entry.customerId,
          stripe_subscription_id: null,
          stripe_price_id: null,
          tier: 'verified' as const,
          billing_period: kind,
          status: 'active' as const,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: false,
          is_founding: false,
          migrated_from_bd: true,
          environment: 'live',
        };
        const { error: upErr } = await supabaseAdmin
          .from('subscriptions')
          .upsert(row as never, { onConflict: 'user_id,environment' });
        if (upErr) throw new Error(`subscriptions upsert: ${upErr.message}`);

        // 5) legacy_stripe_link: these customers have no seed row (their Stripe
        //    email differs from the BD CSV), so we don't touch it. The new
        //    subscriptions row is what removes them from the "no active sub"
        //    report going forward.

        // 6) Send the standard REPs invite email (only for newly-created users)
        if (action === 'created' && inviteUrl) {
          await sendTransactionalEmailServer({
            templateName: 'professional-invite',
            recipientEmail: email,
            templateData: {
              inviteeName: null,
              inviterName,
              planLabel: 'Core (£34/yr)',
              acceptUrl: inviteUrl,
            },
          });
        }

        // 7) Audit
        await supabaseAdmin.rpc('log_admin_action', {
          _actor_id: context.userId,
          _action: 'qa.manual_stripe_customer_relink',
          _target_table: 'subscriptions',
          _target_id: userId,
          _reason: `email=${email} customer=${entry.customerId} kind=${kind} until=${currentPeriodEnd} action=${action}`,
        });

        results.push({
          email,
          customerId: entry.customerId,
          action,
          detail: `paid_at=${pay.paid_at} → current_period_end=${currentPeriodEnd}`,
          currentPeriodEnd,
          userId,
        });
      } catch (err) {
        results.push({
          email,
          customerId: entry.customerId,
          action: 'error',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.action === 'created').length,
      reused: results.filter((r) => r.action === 'reused').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      errors: results.filter((r) => r.action === 'error').length,
    };
    return { summary, results };
  });
