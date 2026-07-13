// One-off admin utility endpoint. Protected by MANUAL_RELINK_SECRET header
// so it can be triggered from a trusted operator shell without going through
// the browser admin UI. Runs the same batch as
// `manualRelinkStripeCustomers`.
import { createFileRoute } from '@tanstack/react-router';
import { ENTRIES, type Entry } from '@/lib/admin/manual-relink-stripe.functions';
import { createStripeClient, resolvePriceByLookupKey } from '@/lib/billing/stripe.server';


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
  fullName?: string | null;
  stripeSubscriptionId?: string | null;
  paymentMethodMissing?: boolean;
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

        const stripe = createStripeClient('live');
        const price = await resolvePriceByLookupKey(stripe, 'verified_annual');

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
            let currentPeriodEnd = addPeriod(anchor, kind);
            let currentPeriodEndOverride: string | null = null;


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
              // Note: auth.admin.generateLink({type:'invite'}) currently
              // fails on this project with "type citext does not exist"
              // inside GoTrue's own SQL path. Use createUser instead
              // (different endpoint) and mint a recovery link separately.
              const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { signup_kind: 'professional', migrated_from_bd: true },
              });
              if (cErr) throw new Error(`createUser: ${cErr.message}`);
              userId = created.user?.id ?? null;
              action = 'created';
              const redirectTo = `https://repsuk.org/dashboard`;
              const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery', email, options: { redirectTo },
              });
              inviteUrl = linkData?.properties?.action_link ?? redirectTo;
            }
            if (!userId) throw new Error('no user id resolved');

            // 1) Set profiles.full_name from legacy bd_member_seed
            let fullName: string | null = null;
            const { data: seed } = await supabaseAdmin
              .from('bd_member_seed')
              .select('first_name, last_name')
              .eq('email', email)
              .maybeSingle();
            if (seed?.first_name || seed?.last_name) {
              fullName = [seed.first_name, seed.last_name].filter(Boolean).join(' ').trim();
            }
            if (fullName) {
              await supabaseAdmin
                .from('profiles')
                .upsert({ id: userId, full_name: fullName } as never, { onConflict: 'id' });
            }

            const { data: prof } = await supabaseAdmin
              .from('professionals').select('id').eq('id', userId).maybeSingle();
            if (!prof) {
              await supabaseAdmin.from('professionals').insert({
                id: userId,
                account_type: 'individual',
                is_published: false,
              } as never);
            }

            // 2) Create real Stripe subscription anchored to renewal date
            // Check existing subscription first (idempotency)
            const { data: existingSub } = await supabaseAdmin
              .from('subscriptions')
              .select('stripe_subscription_id')
              .eq('user_id', userId)
              .eq('environment', 'live')
              .maybeSingle();

            let stripeSubscriptionId: string | null =
              (existingSub as { stripe_subscription_id: string | null } | null)?.stripe_subscription_id ?? null;
            let paymentMethodMissing = false;
            let stripeStatus:
              | 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete'
              | 'incomplete_expired' | 'paused'
              = 'active';
            let stripeCurrentPeriodEndIso: string | null = null;

            if (!stripeSubscriptionId) {
              // Check customer has a default payment method
              const customer = await stripe.customers.retrieve(entry.customerId);
              const defaultPm =
                customer && !('deleted' in customer && customer.deleted)
                  ? (customer.invoice_settings?.default_payment_method ?? customer.default_source ?? null)
                  : null;
              if (!defaultPm) {
                paymentMethodMissing = true;
              }

              // If the calculated period end is already in the past (their
              // annual term already lapsed), give them a fresh full year from
              // today so Stripe accepts trial_end and they don't get charged now.
              let trialEndUnix = Math.floor(new Date(currentPeriodEnd).getTime() / 1000);
              const nowUnix = Math.floor(Date.now() / 1000);
              if (trialEndUnix <= nowUnix + 3600) {
                const fresh = new Date();
                if (kind === 'annual') fresh.setUTCFullYear(fresh.getUTCFullYear() + 1);
                else fresh.setUTCMonth(fresh.getUTCMonth() + 1);
                trialEndUnix = Math.floor(fresh.getTime() / 1000);
                currentPeriodEndOverride = fresh.toISOString();
              }

              const sub = await stripe.subscriptions.create({
                customer: entry.customerId,
                items: [{ price: price.id }],
                trial_end: trialEndUnix,
                proration_behavior: 'none',
                collection_method: 'charge_automatically',
                metadata: {
                  manual_relink: 'true',
                  source: 'admin_batch_2026_07',
                  reps_user_id: userId,
                  reps_email: email,
                },
              });
              stripeSubscriptionId = sub.id;
              stripeStatus = sub.status as typeof stripeStatus;
              const cpe = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end
                ?? (sub as unknown as { current_period_end?: number }).current_period_end;
              if (cpe) stripeCurrentPeriodEndIso = new Date(cpe * 1000).toISOString();
            } else {
              // Retrieve the existing Stripe sub so our DB row mirrors reality
              // (status + current_period_end) instead of a hardcoded snapshot.
              const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
              stripeStatus = sub.status as typeof stripeStatus;
              const cpe = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end
                ?? (sub as unknown as { current_period_end?: number }).current_period_end;
              if (cpe) stripeCurrentPeriodEndIso = new Date(cpe * 1000).toISOString();
            }
            if (currentPeriodEndOverride) currentPeriodEnd = currentPeriodEndOverride;
            if (stripeCurrentPeriodEndIso) currentPeriodEnd = stripeCurrentPeriodEndIso;


            const row = {
              user_id: userId,
              owner_id: userId,
              stripe_customer_id: entry.customerId,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_price_id: price.id,
              tier: 'verified' as const,
              billing_period: kind,
              status: stripeStatus,
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
              detail: `name=${fullName ?? '∅'} sub=${stripeSubscriptionId ?? '∅'}${paymentMethodMissing ? ' PM_MISSING' : ''} anchor=${anchor}${anchorAmount ? ` (£${(anchorAmount/100).toFixed(2)})` : ''} → first_charge=${currentPeriodEnd}`,
              currentPeriodEnd,
              userId,
              fullName,
              stripeSubscriptionId,
              paymentMethodMissing,
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
