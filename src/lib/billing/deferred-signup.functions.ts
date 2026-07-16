import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getCheckoutOffer, type BillingPeriod, type PurchasableTier } from "../billing";

/**
 * Deferred signup (Option 1, June 2026): visitors complete /signup WITHOUT
 * an auth.users row being created. Their credentials are stashed in
 * `pending_signups` and only consumed after Stripe payment succeeds.
 *
 * This prevents the long-standing "orphan account + premature welcome
 * email" problem when someone bails on the Stripe checkout page.
 *
 * Two entry points (both unauthenticated server fns — they ARE the auth):
 *   1. startDeferredCheckout  → mints the Stripe Checkout Session.
 *   2. claimDeferredCheckout  → after success, returns a magic-link URL
 *      that signs the user in on first load (idempotent with webhook).
 */

const SIGNUP_INPUT = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(200),
    tier: z.enum(["verified", "pro", "training_provider"]),
    period: z.enum(["monthly", "annual"]),
    environment: z.enum(["sandbox", "live"]),
  })
  .superRefine((v, ctx) => {
    if (!getCheckoutOffer(v.tier, v.period)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This billing option is not available" });
    }
  });

export const startDeferredCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SIGNUP_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ url: string } | { error: string; code?: string }> => {
    try {
      const tier = data.tier as PurchasableTier;
      const period = data.period as BillingPeriod;
      const offer = getCheckoutOffer(tier, period);
      if (!offer) return { error: "This billing option is not available" };

      // Pro is waitlist-only pre-launch. UI already redirects to /contact,
      // but block direct POSTs too.
      if (tier === "pro") {
        return { error: "Pro is not yet available. Join the waitlist instead." };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Reject if an auth.users row already exists for this email.
      const { data: matches } = await (supabaseAdmin.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: Array<{ user_id: string }> | null }>)("get_user_ids_by_email", {
        _email: data.email,
      });
      if ((matches ?? []).length > 0) {
        return {
          error: "An account already exists for this email. Sign in instead — we'll bring you back to checkout.",
          code: "email_exists",
        };
      }

      // Stash the credentials. Password is encrypted at rest with a
      // server-only key (never `VITE_`-prefixed); the row is RLS-locked to
      // service_role and auto-cleaned by cleanup_pending_signups().
      const { encryptSecret } = await import("./secret-crypto.server");
      const { data: pending, error: pendingErr } = await supabaseAdmin
        .from("pending_signups")
        .insert({
          email: data.email,
          password_ciphertext: encryptSecret(data.password),
          full_name: data.fullName,
          tier,
          period,
          environment: data.environment,
        } as never)
        .select("id")
        .single();
      if (pendingErr || !pending) {
        return { error: pendingErr?.message ?? "Could not start checkout" };
      }
      const pendingId = (pending as { id: string }).id;


      // Mint a fresh Stripe customer (no reps_user_id yet — we'll back-fill
      // when the webhook creates the auth user).
      const {
        createStripeClient,
        resolvePriceByLookupKey,
        getCheckoutOrigin,
        getStripeErrorMessage,
      } = await import("./stripe.server");
      const stripe = createStripeClient(data.environment);
      const origin = getCheckoutOrigin();
      const stripePrice = await resolvePriceByLookupKey(stripe, offer.priceId);

      try {
        const customer = await stripe.customers.create({
          email: data.email,
          name: data.fullName,
          metadata: {
            reps_pending_signup_id: pendingId,
            tier,
            billing_period: period,
            environment: data.environment,
          },
        });

        const submitMessage =
          tier === "verified"
            ? "You're joining the REPs Core register — qualified, insured, and publicly listed worldwide."
            : tier === "training_provider"
              ? "You're joining REPs LMS — independent course review, public endorsement, verified learner reviews."
              : "You're starting REPs Pro — every feature in your tier is included, no paid add-ons.";

        const cancelUrl =
          tier === "training_provider"
            ? `${origin}/training-providers?checkout=canceled`
            : `${origin}/pricing?checkout=canceled`;

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customer.id,
          line_items: [{ price: stripePrice.id, quantity: 1 }],
          success_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          allow_promotion_codes: true,
          payment_method_collection: "always",
          custom_text: {
            submit: { message: submitMessage },
            terms_of_service_acceptance: {
              message: `I agree to the [REPs Terms](${origin}/terms) and [Privacy Policy](${origin}/privacy).`,
            },
          },
          consent_collection: { terms_of_service: "required" },
          subscription_data: {
            ...(offer.trialDays > 0 ? { trial_period_days: offer.trialDays } : {}),
            metadata: {
              reps_pending_signup_id: pendingId,
              tier,
              billing_period: period,
              is_founding: String(offer.founding),
              environment: data.environment,
            },
          },
          metadata: {
            reps_pending_signup_id: pendingId,
            tier,
            billing_period: period,
            environment: data.environment,
          },
        });

        if (!session.url) return { error: "Stripe did not return a checkout URL" };

        await supabaseAdmin
          .from("pending_signups")
          .update({
            stripe_customer_id: customer.id,
            stripe_session_id: session.id,
          } as never)
          .eq("id", pendingId);

        return { url: session.url };
      } catch (err) {
        return { error: getStripeErrorMessage(err) };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not start checkout" };
    }
  });

/**
 * Called from /checkout/return after Stripe redirects back. Idempotent:
 * - If the auth user doesn't exist yet (webhook lag), create it now from
 *   pending_signups. Then return a magic-link URL to sign them in.
 * - If the webhook already created the user, just mint a fresh magic link.
 */
export const claimDeferredCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ session_id: z.string().min(8).max(200) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ url: string } | { error: string }> => {
    try {
      const { ensureUserFromPendingSignup } = await import("./deferred-signup.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { createStripeClient, getCheckoutOrigin } = await import("./stripe.server");

      // Try live first, fall back to sandbox — Stripe session IDs are unique
      // across environments, so this is just a probe.
      let session: any = null;
      let env: "live" | "sandbox" = "live";
      try {
        const stripeLive = createStripeClient("live");
        session = await stripeLive.checkout.sessions.retrieve(data.session_id);
      } catch {
        try {
          const stripeSandbox = createStripeClient("sandbox");
          session = await stripeSandbox.checkout.sessions.retrieve(data.session_id);
          env = "sandbox";
        } catch {
          return { error: "Checkout session not found" };
        }
      }

      const paid =
        session.payment_status === "paid" ||
        session.payment_status === "no_payment_required" ||
        session.status === "complete";
      if (!paid) return { error: "Payment not yet confirmed" };

      const pendingId =
        (session.metadata?.reps_pending_signup_id as string | undefined) ?? null;
      const customerEmail =
        (session.customer_details?.email as string | undefined) ??
        (typeof session.customer === "string" ? null : (session.customer?.email as string | undefined)) ??
        null;

      let email = customerEmail;
      if (pendingId) {
        const userId = await ensureUserFromPendingSignup(pendingId, env);
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        email = authUser?.user?.email ?? email;
      }

      if (!email) return { error: "Could not resolve account email" };

      const origin = getCheckoutOrigin();
      const { data: link, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${origin}/dashboard` },
        });
      if (linkErr || !link?.properties?.action_link) {
        return { error: linkErr?.message ?? "Could not generate sign-in link" };
      }
      return { url: link.properties.action_link };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not complete sign-in" };
    }
  });
