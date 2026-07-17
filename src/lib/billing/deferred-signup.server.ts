/**
 * Server-only helper for the deferred-signup flow. Lives in *.server.ts so
 * the client bundle is never tempted to import the supabase admin client.
 *
 * Idempotent: safe to call from both the Stripe webhook AND the
 * /checkout/return claim path. Whichever runs first wins.
 */
export async function ensureUserFromPendingSignup(
  pendingId: string,
  environment: "sandbox" | "live",
): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row, error } = await supabaseAdmin
    .from("pending_signups")
    .select("id, email, password_ciphertext, full_name, tier, period, stripe_customer_id, consumed_at")
    .eq("id", pendingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error(`pending_signup ${pendingId} not found`);

  const raw = row as unknown as {
    email: string;
    password_ciphertext: string;
    full_name: string;
    tier: string;
    period: string;
    stripe_customer_id: string | null;
  };
  const { decryptSecret } = await import("./secret-crypto.server");
  const r = { email: raw.email, password: decryptSecret(raw.password_ciphertext), full_name: raw.full_name, tier: raw.tier, period: raw.period, stripe_customer_id: raw.stripe_customer_id,  };


  // If an auth user with this email already exists (webhook ran first, or
  // a race produced a second insert attempt), return it.
  const { data: matches } = await (supabaseAdmin.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: Array<{ user_id: string }> | null }>)("get_user_ids_by_email", {
    _email: r.email,
  });
  const existing = (matches ?? [])[0]?.user_id ?? null;
  if (existing) {
    await markConsumed(pendingId);
    await backfillCustomer(r.stripe_customer_id, existing, environment);
    return existing;
  }

  // Create the real auth user. email_confirm: true skips the verification
  // email — paying customers don't need to re-prove they own the inbox.
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: r.email,
    password: r.password,
    email_confirm: true,
    user_metadata: { full_name: r.full_name, signup_kind: "professional", account_type: r.tier === "training_provider" ? "training_provider" : "pro", intended_tier: r.tier, intended_period: r.period,  },
  });
  if (createErr || !created?.user) {
    throw new Error(createErr?.message ?? "Failed to create user");
  }
  const userId = created.user.id;

  await markConsumed(pendingId);
  await backfillCustomer(r.stripe_customer_id, userId, environment);

  // Training-provider signups: flip account_type synchronously so the
  // dashboard router / provider-only views don't race the Stripe webhook.
  // handle_new_user() always inserts professionals(id) with the column
  // default 'individual' — we need to overwrite that immediately.
  if (r.tier === "training_provider") {
    const { error: updErr } = await supabaseAdmin
      .from("professionals")
      .update({ account_type: "training_provider" as never } as never)
      .eq("id", userId);
    if (updErr) {
      // Not fatal — the webhook will retry the same update — but log clearly
      // so ops can spot a stuck sign-up before the user complains.
      console.error(
        `[deferred-signup] failed to set account_type=training_provider for ${userId}: ${updErr.message}`,
      );
    }
  }

  return userId;
}

async function markConsumed(pendingId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("pending_signups")
    .update({ consumed_at: new Date().toISOString() } as never)
    .eq("id", pendingId);
}

async function backfillCustomer(
  customerId: string | null,
  userId: string,
  environment: "sandbox" | "live",
): Promise<void> {
  if (!customerId) return;
  try {
    const { createStripeClient } = await import("./stripe.server");
    const stripe = createStripeClient(environment);
    await stripe.customers.update(customerId, {
      metadata: { reps_user_id: userId },
    });
  } catch {
    /* best-effort — resolveUserId can still fall back to email lookup */
  }
}
