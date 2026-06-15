// Stripe Connect onboarding for Pro/Studio professionals.
// Pros connect their own Stripe account; REPs takes £0 and never holds funds.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConnectAccountStatus = {
  state: "not_connected" | "onboarding_incomplete" | "restricted" | "active" | "disconnected";
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
  country: string | null;
  defaultCurrency: string | null;
  connectedAt: string | null;
};

function classify(row: {
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements_due: unknown;
  disconnected_at: string | null;
}): ConnectAccountStatus["state"] {
  if (row.disconnected_at) return "disconnected";
  if (!row.details_submitted) return "onboarding_incomplete";
  if (!row.charges_enabled || !row.payouts_enabled) return "restricted";
  return "active";
}

async function assertProOrStudio(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_active_tier", {
    _user_id: userId,
    _tiers: ["pro", "studio"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Stripe payments require a Pro or Studio subscription. Upgrade your plan to take bookings.");
}

export const getConnectStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectAccountStatus> => {
    const { data, error } = await context.supabase
      .from("connected_accounts")
      .select("stripe_account_id, charges_enabled, payouts_enabled, details_submitted, requirements_due, country, default_currency, connected_at, disconnected_at")
      .eq("professional_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        state: "not_connected",
        stripeAccountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsDue: [],
        country: null,
        defaultCurrency: null,
        connectedAt: null,
      };
    }
    return {
      state: classify(data as any),
      stripeAccountId: data.stripe_account_id,
      chargesEnabled: data.charges_enabled,
      payoutsEnabled: data.payouts_enabled,
      detailsSubmitted: data.details_submitted,
      requirementsDue: Array.isArray(data.requirements_due) ? (data.requirements_due as string[]) : [],
      country: data.country,
      defaultCurrency: data.default_currency,
      connectedAt: data.connected_at,
    };
  });

export const startStripeConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ url: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertProOrStudio(supabaseAdmin, context.userId);

    const { createStripeClient, getCheckoutOrigin } = await import("@/lib/billing/stripe.server");
    const { getStripeEnvironment } = await import("@/lib/billing/stripe-client");
    const env = getStripeEnvironment();
    const stripe = createStripeClient(env);

    // Reuse existing account if present
    const { data: existing } = await supabaseAdmin
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("professional_id", context.userId)
      .maybeSingle();

    let accountId: string;
    if (existing?.stripe_account_id) {
      accountId = existing.stripe_account_id;
    } else {
      const { data: pro } = await supabaseAdmin
        .from("professionals")
        .select("country, public_email")
        .eq("id", context.userId)
        .maybeSingle();
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(context.userId);

      const countryCode = (pro?.country === "United Kingdom" ? "GB" : "GB"); // sane default
      const account = await stripe.accounts.create({
        type: "standard",
        country: countryCode,
        email: pro?.public_email ?? user?.email ?? undefined,
        metadata: { reps_user_id: context.userId },
      });
      accountId = account.id;
      await supabaseAdmin.from("connected_accounts").insert({
        professional_id: context.userId,
        stripe_account_id: accountId,
        environment: env,
        country: countryCode,
      } as never);
    }

    const origin = getCheckoutOrigin();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/settings?tab=payments&connect=refresh`,
      return_url: `${origin}/dashboard/settings?tab=payments&connect=return`,
      type: "account_onboarding",
    });
    return { url: link.url };
  });

export const refreshConnectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectAccountStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("connected_accounts")
      .select("stripe_account_id, environment")
      .eq("professional_id", context.userId)
      .maybeSingle();
    if (!row) {
      return {
        state: "not_connected",
        stripeAccountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsDue: [],
        country: null,
        defaultCurrency: null,
        connectedAt: null,
      };
    }

    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient((row.environment as "sandbox" | "live") ?? "sandbox");
    const acct = await stripe.accounts.retrieve(row.stripe_account_id);
    const requirements = (acct.requirements?.currently_due ?? []).concat(acct.requirements?.past_due ?? []);

    await supabaseAdmin.from("connected_accounts").update({
      charges_enabled: !!acct.charges_enabled,
      payouts_enabled: !!acct.payouts_enabled,
      details_submitted: !!acct.details_submitted,
      requirements_due: requirements as never,
      country: acct.country ?? null,
      default_currency: acct.default_currency ?? null,
      last_synced_at: new Date().toISOString(),
      disconnected_at: null,
    } as never).eq("professional_id", context.userId);

    return {
      state: classify({
        charges_enabled: !!acct.charges_enabled,
        payouts_enabled: !!acct.payouts_enabled,
        details_submitted: !!acct.details_submitted,
        requirements_due: requirements,
        disconnected_at: null,
      }),
      stripeAccountId: row.stripe_account_id,
      chargesEnabled: !!acct.charges_enabled,
      payoutsEnabled: !!acct.payouts_enabled,
      detailsSubmitted: !!acct.details_submitted,
      requirementsDue: requirements,
      country: acct.country ?? null,
      defaultCurrency: acct.default_currency ?? null,
      connectedAt: null,
    };
  });

export const requestDisconnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Soft-disconnect: flag for admin review rather than instant disconnect,
    // to avoid orphaning in-flight Checkouts.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("connected_accounts")
      .update({ disconnected_at: new Date().toISOString() } as never)
      .eq("professional_id", context.userId);
    return { ok: true };
  });
