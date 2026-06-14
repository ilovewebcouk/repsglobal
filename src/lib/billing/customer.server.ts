// Shared Stripe customer resolution. Used by both subscription checkout
// (billing.functions) and one-off credit top-ups (credits.functions).
//
// Resolves in this precedence:
//   1. Existing `stripe_customer_id` on subscriptions row for this user
//      in this environment (sandbox/live are isolated).
//   2. Stripe customer search by `metadata.reps_user_id` — covers users
//      who paid before any subscriptions row was written.
//   3. Stripe customer match by email — covers BD-migrated members.
//   4. Create a new customer with `reps_user_id` metadata.
import type Stripe from "stripe";
import type { StripeEnv } from "./stripe.server";

export async function getOrCreateCustomer(opts: {
  userId: string;
  email: string | null | undefined;
  environment: StripeEnv;
}): Promise<string> {
  const { userId, email, environment } = opts;
  const [{ supabaseAdmin }, { createStripeClient }] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("./stripe.server"),
  ]);
  const stripe = createStripeClient(environment);

  // 1) Existing subscriptions row in THIS environment.
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("environment", environment)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (existing?.stripe_customer_id) return existing.stripe_customer_id as string;

  // 2) Stripe customer with our user-id metadata.
  if (/^[a-zA-Z0-9-]+$/.test(userId)) {
    try {
      const found = await stripe.customers.search({
        query: `metadata['reps_user_id']:'${userId}'`,
        limit: 1,
      });
      if (found.data.length) return found.data[0].id;
    } catch {
      /* search may be unavailable in some envs; fall through */
    }
  }

  // 3) Email match — backfill metadata so future lookups hit branch 2.
  if (email) {
    const list = await stripe.customers.list({ email, limit: 1 });
    if (list.data.length) {
      const c = list.data[0] as Stripe.Customer;
      if (c.metadata?.reps_user_id !== userId) {
        await stripe.customers.update(c.id, {
          metadata: { ...(c.metadata ?? {}), reps_user_id: userId },
        });
      }
      return c.id;
    }
  }

  // 4) Create.
  const created = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { reps_user_id: userId },
  });
  return created.id;
}
