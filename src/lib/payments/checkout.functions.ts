// Booking checkout for clients buying a service from a connected professional.
// Money lands directly in the pro's Stripe account; application_fee_amount = 0.
import { createServerFn } from "@tanstack/react-start";

export const createBookingCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((input: { serviceId: string; clientEmail: string; clientName?: string; clientUserId?: string | null }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: service, error: svcErr } = await supabaseAdmin
      .from("services")
      .select("id, professional_id, title, price_pence, is_published")
      .eq("id", data.serviceId)
      .maybeSingle();
    if (svcErr) throw new Error(svcErr.message);
    if (!service || !service.is_published) throw new Error("Service not available.");
    if (!service.price_pence || service.price_pence <= 0) {
      throw new Error("This service does not have a price set. Use enquire instead.");
    }

    const { data: acct } = await supabaseAdmin
      .from("connected_accounts")
      .select("stripe_account_id, charges_enabled, environment, default_currency")
      .eq("professional_id", service.professional_id)
      .maybeSingle();
    if (!acct || !acct.charges_enabled) {
      throw new Error("This professional is not currently accepting card payments. Send an enquiry instead.");
    }

    const { createStripeClient, getCheckoutOrigin } = await import("@/lib/billing/stripe.server");
    const env = (acct.environment as "sandbox" | "live") ?? "sandbox";
    const stripe = createStripeClient(env);
    const origin = getCheckoutOrigin();
    const currency = acct.default_currency ?? "gbp";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency,
          unit_amount: service.price_pence,
          product_data: { name: service.title },
        },
      }],
      customer_email: data.clientEmail,
      payment_intent_data: {
        application_fee_amount: 0,
        metadata: {
          reps_professional_id: service.professional_id,
          reps_service_id: service.id,
        },
      },
      metadata: {
        kind: "booking",
        reps_professional_id: service.professional_id,
        reps_service_id: service.id,
        reps_client_user_id: data.clientUserId ?? "",
      },
      success_url: `${origin}/c/$slug?booking=success&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/c/$slug?booking=canceled`,
    }, { stripeAccount: acct.stripe_account_id });

    await supabaseAdmin.from("bookings").insert({
      professional_id: service.professional_id,
      service_id: service.id,
      service_title: service.title,
      client_user_id: data.clientUserId ?? null,
      client_email: data.clientEmail.toLowerCase(),
      client_name: data.clientName ?? null,
      amount_pence: service.price_pence,
      currency,
      status: "pending",
      stripe_account_id: acct.stripe_account_id,
      stripe_checkout_session_id: session.id,
      environment: env,
    } as never);

    return { url: session.url };
  });
