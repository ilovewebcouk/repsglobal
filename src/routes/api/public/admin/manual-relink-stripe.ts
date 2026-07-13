// One-off admin utility endpoint. Protected by MANUAL_RELINK_SECRET header
// so it can be triggered from a trusted operator shell without going through
// the browser admin UI. Runs the same batch as
// `manualRelinkStripeCustomers`.
import { createFileRoute } from '@tanstack/react-router';
import { ENTRIES, type Entry } from '@/lib/admin/manual-relink-stripe.functions';

type Kind = 'annual' | 'monthly';

function addPeriod(iso: string, kind: Kind): string {
  const d = new Date(iso);
  if (kind === 'annual') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

interface RowResult {
  email: string;
  customerId: string;
  action: 'created' | 'reused' | 'skipped' | 'error';
  detail: string;
  currentPeriodEnd?: string;
  userId?: string;
}

export const Route = createFileRoute('/api/public/admin/manual-relink-stripe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get('x-relink-secret') ?? '';
        const expected = process.env.MANUAL_RELINK_SECRET ?? '';
        if (!expected || provided !== expected) {
          return new Response('Unauthorized', { status: 401 });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { sendTransactionalEmailServer } = await import('@/lib/email/send.server');

        const inviterName = 'The REPs team';
        const results: RowResult[] = [];

        for (const entry of ENTRIES as Entry[]) {
          const email = entry.email.trim().toLowerCase();
          const kind: Kind = entry.kind ?? 'annual';
          try {
            let anchor: string | null = entry.paidAtOverride ?? null;
            let anchorAmount: number | null = null;
            if (!anchor) {
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
              anchor = pay.paid_at;
              anchorAmount = pay.amount_pence ?? null;
            }
            const currentPeriodEnd = addPeriod(anchor, kind);

            let userId: string | null = null;
            let action: 'created' | 'reused' = 'reused';
            let inviteUrl: string | null = null;

            // Paginate through auth users to find by email
            let existingUser: { id: string; email: string | null } | undefined;
            for (let page = 1; page <= 20; page++) {
              const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
              if (!list?.users?.length) break;
              const found = list.users.find((u) => (u.email ?? '').toLowerCase() === email);
              if (found) { existingUser = { id: found.id, email: found.email ?? null }; break; }
              if (list.users.length < 200) break;
            }

            if (existingUser) {
              userId = existingUser.id;
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

            const { data: prof } = await supabaseAdmin
              .from('professionals').select('id').eq('id', userId).maybeSingle();
            if (!prof) {
              await supabaseAdmin.from('professionals').insert({
                id: userId,
                account_type: 'individual',
                is_published: false,
              } as never);
            }

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

            if (action === 'created' && inviteUrl) {
              try {
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
              } catch (mailErr) {
                // Don't fail the row if the email send has an issue; we
                // already have the auth user + subscription in place.
                results.push({
                  email, customerId: entry.customerId, action: 'created',
                  detail: `subscription set but invite email failed: ${mailErr instanceof Error ? mailErr.message : String(mailErr)}`,
                  currentPeriodEnd, userId,
                });
                continue;
              }
            }

            await supabaseAdmin.rpc('log_admin_action', {
              _actor_id: null as unknown as string,
              _action: 'qa.manual_stripe_customer_relink',
              _target_table: 'subscriptions',
              _target_id: userId,
              _reason: `email=${email} customer=${entry.customerId} kind=${kind} until=${currentPeriodEnd} action=${action} anchor=${anchor}`,
            });

            results.push({
              email,
              customerId: entry.customerId,
              action,
              detail: `anchor=${anchor}${anchorAmount ? ` (£${(anchorAmount/100).toFixed(2)})` : ''} → current_period_end=${currentPeriodEnd}`,
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
        return new Response(JSON.stringify({ summary, results }, null, 2), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  },
});
