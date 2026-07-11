import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

import { lookupTierByPriceId } from "@/lib/billing/prices";
import { type StripeEnv, verifyWebhook } from "@/lib/billing/stripe.server";

const CORS = {
  "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
} as const;

async function reserveEventRow(event: { id: string; type: string }, raw: unknown): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const obj = (raw as { data?: { object?: Record<string, unknown> } }).data?.object ?? {};
  const customerId = typeof obj.customer === "string" ? (obj.customer as string) : null;
  let subscriptionId: string | null = null;
  if (typeof obj.subscription === "string") subscriptionId = obj.subscription as string;
  else if (obj.object === "subscription" && typeof obj.id === "string") subscriptionId = obj.id as string;

  const { data, error } = await supabaseAdmin
    .from("payment_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: raw as object,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      processed_at: null,
      processing_error: null,
    } as never)
    .select("id")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") return null;
    throw error;
  }
  return (data as { id: string }).id;
}

async function finalizeEventRow(rowId: string, opts: { userId: string | null; processingError: string | null }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("payment_events")
    .update({
      user_id: opts.userId,
      processed_at: opts.processingError ? null : new Date().toISOString(),
      processing_error: opts.processingError,
    } as never)
    .eq("id", rowId);
}

async function resolveUserId(
  opts: { customerId?: string | null; metadataUserId?: string | null; customerEmail?: string | null },
  stripe: Stripe,
): Promise<string | null> {
  // Ladder (existing order preserved; new steps appended):
  // 1. event.metadata.reps_user_id
  // 2. subscriptions.stripe_customer_id
  // 3. Stripe customer.metadata.reps_user_id
  // 4. legacy_stripe_link.stripe_customer_id → bd_member_seed.claimed_user_id   [NEW]
  // 5. customer.email → auth.users (collision-guarded: must match seed)         [NEW]
  // When 3/4/5 resolves a userId for a Stripe customer, backfill the
  // Stripe customer metadata so step 3 short-circuits on future events.
  if (opts.metadataUserId) return opts.metadataUserId;
  if (!opts.customerId) return null;
  const customerId = opts.customerId;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 2. existing subscription mapping
  const { data: subRow } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .limit(1)
    .maybeSingle();
  if (subRow?.user_id) return subRow.user_id;

  // 3. Stripe customer metadata
  let stripeCustomerEmail: string | null = opts.customerEmail ?? null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      const c = customer as Stripe.Customer;
      stripeCustomerEmail = stripeCustomerEmail ?? c.email ?? null;
      const meta = c.metadata?.reps_user_id;
      if (meta) return meta;
    }
  } catch {
    /* ignore — Stripe lookup is best-effort */
  }

  // 4. legacy_stripe_link → bd_member_seed.claimed_user_id
  const { data: link } = await supabaseAdmin
    .from("legacy_stripe_link")
    .select("bd_member_id, email")
    .eq("stripe_customer_id", customerId)
    .limit(1)
    .maybeSingle();
  if (link?.bd_member_id) {
    const { data: seed } = await supabaseAdmin
      .from("bd_member_seed")
      .select("claimed_user_id, email")
      .eq("bd_member_id", link.bd_member_id)
      .limit(1)
      .maybeSingle();
    if (seed?.claimed_user_id) {
      await backfillStripeCustomerMetadata(stripe, customerId, seed.claimed_user_id);
      return seed.claimed_user_id;
    }
    stripeCustomerEmail = stripeCustomerEmail ?? seed?.email ?? link.email ?? null;
  }

  // 5. customer.email → auth.users (collision-guarded: exactly one match)
  const email = (stripeCustomerEmail ?? "").trim().toLowerCase();
  if (email) {
    const { data: matches } = await (supabaseAdmin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Array<{ user_id: string }> | null }>)("get_user_ids_by_email", {
      _email: email,
    });
    const ids = matches ?? [];
    if (ids.length === 1) {
      const userId = ids[0].user_id;
      await backfillStripeCustomerMetadata(stripe, customerId, userId);
      return userId;
    }
  }

  return null;
}

async function backfillStripeCustomerMetadata(
  stripe: Stripe,
  customerId: string,
  userId: string,
): Promise<void> {
  try {
    await stripe.customers.update(customerId, {
      metadata: { reps_user_id: userId },
    });
  } catch {
    /* best-effort; resolver still returns the userId */
  }
}


function periodEndIso(sub: Stripe.Subscription): string | null {
  const cpe =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items.data[0]?.current_period_end ??
    null;
  return cpe ? new Date(cpe * 1000).toISOString() : null;
}

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription, stripe: Stripe, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await resolveUserId(
    { customerId, metadataUserId: sub.metadata?.reps_user_id ?? null },
    stripe,
  );
  if (!userId) throw new Error(`No REPS user found for Stripe customer ${customerId}`);

  const item = sub.items.data[0];
  // Prefer lookup_key (stable across sandbox/live) over the env-specific price.id.
  const priceLookup = item?.price.lookup_key ?? item?.price.id ?? null;
  const lookup = priceLookup ? lookupTierByPriceId(priceLookup) : null;
  const isLiveStatus = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);

  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceLookup,
    tier: isLiveStatus && lookup ? lookup.tier : "free",
    billing_period: isLiveStatus && lookup ? lookup.period : null,
    status: sub.status,
    current_period_end: periodEndIso(sub),
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    is_founding: lookup?.founding ?? false,
    migrated_from_bd:
      sub.metadata?.migrated_from === "bd_legacy" ||
      sub.metadata?.migrated_from === "bd",
    metadata: sub.metadata as unknown as object,
    environment: env,
    updated_at: new Date().toISOString(),
  };
  await supabaseAdmin
    .from("subscriptions")
    .upsert(row as never, { onConflict: "user_id, environment" });
  return userId;
}

function mapIdentityStatus(s: string | null | undefined, eventType: string): string {
  if (s === "verified" || eventType === "identity.verification_session.verified") return "approved";
  if (eventType === "identity.verification_session.canceled" || s === "canceled") return "rejected";
  if (s === "requires_input") return "needs_more_info";
  return "pending";
}

/**
 * Normalise a human name for cross-checking: lowercase, drop common titles
 * ("Mr", "Mrs", "Ms", "Dr", "Prof"), strip punctuation, collapse whitespace,
 * and return as a sorted Set of word tokens.
 */
function nameTokens(raw: string | null | undefined): Set<string> {
  if (!raw) return new Set();
  const cleaned = raw
    .toLowerCase()
    .replace(/[.,'’`-]/g, "")
    .replace(/\s+/g, "")
    .trim();
  const titles = new Set(["mr", "mrs", "ms", "mx", "miss", "dr", "prof", "professor", "sir", "dame"]);
  return new Set(
    cleaned
      .split("")
      .filter((t) => t.length > 0 && !titles.has(t)),
  );
}

/**
 * Subset name match. Passes if every token of one name is contained in the
 * other (e.g. "James Wilson" ↔ "James Robert Wilson"). Both sides must have
 * at least 2 tokens to count as a real check.
 */
function namesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.size < 2 || tb.size < 2) return false;
  const aSubset = [...ta].every((t) => tb.has(t));
  const bSubset = [...tb].every((t) => ta.has(t));
  return aSubset || bSubset;
}


async function handleIdentityEvent(
  stripe: Stripe,
  event: { type: string; data: { object: unknown } },
  env: StripeEnv,
): Promise<void> {
  const vs = event.data.object as Stripe.Identity.VerificationSession;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row, error: findErr } = await supabaseAdmin
    .from("identity_documents")
    .select("id, professional_id")
    .eq("stripe_vs_id", vs.id)
    .eq("environment", env)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (!row) return; // session not tracked in this env; ack and move on

  const mappedStatus = mapIdentityStatus(vs.status, event.type);
  const reason =
    vs.last_error?.reason ??
    (vs.last_error?.code ? `${vs.last_error.code}` : null);

  const patch: Record<string, unknown> = {
    stripe_status: vs.status,
    stripe_reason: reason,
    status: mappedStatus,
  };

  let docName: string | null = null;

  if (vs.status === "verified") {
    try {
      const full = await stripe.identity.verificationSessions.retrieve(vs.id, {
        expand: ["verified_outputs"],
      });
      const out = full.verified_outputs;
      if (out) {
        const name = [out.first_name, out.last_name]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (name) {
          patch.name_on_doc = name;
          docName = name;
        }
        if (out.dob) {
          const { year, month, day } = out.dob;
          if (year && month && day) {
            patch.dob_on_doc = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
        }
      }
    } catch {
      // best-effort enrichment
    }
  }

  // Name-match gate: Stripe Identity verifies the doc/selfie but does not
  // confirm the name on the ID matches the REPS profile. If we get an
  // auto-approve from Stripe AND have a doc name, cross-check against
  // profiles.full_name and downgrade to needs_more_info on mismatch.
  if (mappedStatus === "approved" && docName) {
    // For organisation accounts, compare against the stored contact-person
    // name (contact_first_name + contact_last_name) instead of the org's
    // display name, which will never match a personal ID.
    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("account_type, contact_first_name, contact_last_name")
      .eq("id", row.professional_id)
      .maybeSingle();
    const proAny = pro as {
      account_type?: string | null;
      contact_first_name?: string | null;
      contact_last_name?: string | null;
    } | null;

    let compareName: string | null = null;
    if (
      proAny?.account_type === "organisation" &&
      (proAny.contact_first_name || proAny.contact_last_name)
    ) {
      compareName = [proAny.contact_first_name, proAny.contact_last_name]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim() || null;
    } else {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", row.professional_id)
        .maybeSingle();
      compareName = (profile as { full_name?: string | null } | null)?.full_name ?? null;
    }

    if (compareName && !namesMatch(docName, compareName)) {
      patch.status = "needs_more_info";
      patch.stripe_reason = `Name on ID ("${docName}") does not match the name on your REPS account ("${compareName}"). Update your account to match your legal name, or restart the check with the correct ID.`;
      patch.admin_note = "Auto-flagged: name mismatch with profile";
    }
  }
  if (finalStatus === "approved" || finalStatus === "rejected" || finalStatus === "needs_more_info") {
    patch.reviewed_at = new Date().toISOString();
  }
  if (finalStatus === "approved") {
    patch.admin_note = "Auto-approved by Stripe Identity";
  }

  const { error: upErr } = await supabaseAdmin
    .from("identity_documents")
    .update(patch as never)
    .eq("id", row.id);
  if (upErr) throw new Error(upErr.message);

  // Mirror identity state onto professionals so other systems (cert name-match,
  // public profile badges, "verified since" copy) have a single source of truth.
  const proPatch: Record<string, unknown> = {
    stripe_identity_session_id: vs.id,
  };
  if (finalStatus === "approved") {
    proPatch.identity_status = "approved";
    proPatch.identity_verified_at = new Date().toISOString();
    if (docName) proPatch.identity_verified_name = docName;
    if (patch.dob_on_doc) proPatch.identity_verified_dob = patch.dob_on_doc;
  } else if (finalStatus === "rejected") {
    proPatch.identity_status = "rejected";
  } else if (finalStatus === "needs_more_info") {
    proPatch.identity_status = "needs_more_info";
  } else {
    proPatch.identity_status = "pending";
  }
  await supabaseAdmin
    .from("professionals")
    .update(proPatch as never)
    .eq("id", row.professional_id);
}


async function handleConnectAccountUpdated(acct: Stripe.Account): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const requirements = (acct.requirements?.currently_due ?? []).concat(acct.requirements?.past_due ?? []);
  await supabaseAdmin.from("connected_accounts").update({
    charges_enabled: !!acct.charges_enabled,
    payouts_enabled: !!acct.payouts_enabled,
    details_submitted: !!acct.details_submitted,
    requirements_due: requirements as never,
    country: acct.country ?? null,
    default_currency: acct.default_currency ?? null,
    last_synced_at: new Date().toISOString(),
  } as never).eq("stripe_account_id", acct.id);
}

async function handleConnectCheckoutCompleted(session: Stripe.Checkout.Session, stripeAccountId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const meta = (session.metadata ?? {}) as Record<string, string>;
  if (meta.kind !== "booking") return;
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  await supabaseAdmin.from("bookings").update({
    status: session.payment_status === "paid" ? "paid" : "pending",
    stripe_payment_intent_id: piId,
    paid_at: session.payment_status === "paid" ? new Date().toISOString() : null,
  } as never).eq("stripe_checkout_session_id", session.id).eq("stripe_account_id", stripeAccountId);
}

async function handleConnectChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  const refunded = charge.amount_refunded ?? 0;
  const isFull = refunded >= (charge.amount ?? 0);
  await supabaseAdmin.from("bookings").update({
    status: isFull ? "refunded" : "partially_refunded",
    refunded_amount_pence: refunded,
    refunded_at: new Date().toISOString(),
    stripe_charge_id: charge.id,
  } as never).eq("stripe_payment_intent_id", piId);
}

// Platform (non-Connect) charge.refunded: subscription / membership refund.
// Revenue tiles already net refunds from payment_events; this stamps the
// refund onto the originating subscription so admin views + the user record
// reflect the refund state, and handles full vs partial.
async function handlePlatformChargeRefunded(charge: Stripe.Charge, env: StripeEnv): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? null;
  if (!customerId) return;
  const refunded = charge.amount_refunded ?? 0;
  if (!refunded) return;
  const isFull = refunded >= (charge.amount ?? 0);

  // Find the most recent subscription for this customer in this env.
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, metadata, status, stripe_subscription_id")
    .eq("stripe_customer_id", customerId)
    .eq("environment", env)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return;

  const prev = ((sub as { metadata?: Record<string, unknown> }).metadata ?? {}) as Record<string, unknown>;
  const refundHistory = Array.isArray(prev.refund_history) ? prev.refund_history : [];
  const nextMetadata = {
    ...prev,
    last_refund_at: new Date().toISOString(),
    last_refund_amount_pence: refunded,
    last_refund_charge_id: charge.id,
    last_refund_full: isFull,
    refund_history: [
      ...refundHistory,
      {
        at: new Date().toISOString(),
        amount_pence: refunded,
        full: isFull,
        charge_id: charge.id,
      },
    ].slice(-20),
  };
  await supabaseAdmin
    .from("subscriptions")
    .update({ metadata: nextMetadata } as never)
    .eq("id", (sub as { id: string }).id);

  console.log(
    `[payments-webhook] platform refund recorded: sub=${(sub as { id: string }).id} amount=${refunded} full=${isFull}`,
  );

  // GA4 — refund event (nets revenue in Monetization reports).
  try {
    const currency = ((charge as unknown as { currency?: string }).currency ?? "gbp").toUpperCase();
    const meta = (prev ?? {}) as Record<string, unknown>;
    const { sendGaRefund } = await import("@/lib/analytics/ga-measurement-protocol.server");
    await sendGaRefund({
      clientId: (meta.ga_client_id as string) ?? null,
      userId: (sub as { user_id?: string | null }).user_id ?? null,
      transactionId: (sub as { stripe_subscription_id?: string | null }).stripe_subscription_id ?? charge.id,
      value: refunded / 100,
      currency,
      tier: (meta.tier as string) ?? null,
      period: (meta.billing_period as string) ?? null,
      isFull,
    });
  } catch (e) {
    console.warn("[ga4-mp] refund dispatch failed:", e);
  }
}

async function handleConnectDispute(dispute: Stripe.Dispute, eventType: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const piId = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
  if (!piId) return;
  const closed = eventType === "charge.dispute.closed";
  await supabaseAdmin.from("bookings").update({
    status: closed && dispute.status === "won" ? "paid" : "disputed",
    dispute_status: dispute.status,
  } as never).eq("stripe_payment_intent_id", piId);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[payments-webhook] invalid or missing env query parameter:", rawEnv);
          return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
            status: 200,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }
        // The URL ?env= picks which webhook secret to verify against. The
        // canonical source of truth for which Stripe environment the event
        // belongs to is `event.livemode` (livemode:true -> 'live',
        // livemode:false -> 'sandbox'). If the two disagree after signature
        // verification, log a warning and trust livemode for any DB write.
        const urlEnv: StripeEnv = rawEnv;

        let event: { id: string; type: string; data: { object: unknown }; livemode: boolean };
        try {
          event = await verifyWebhook(request, urlEnv);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid signature";
          console.error("[payments-webhook] signature verification failed:", message);
          return new Response(`Webhook Error: ${message}`, { status: 400, headers: CORS });
        }

        const env: StripeEnv = event.livemode ? "live" : "sandbox";
        if (env !== urlEnv) {
          console.warn("[payments-webhook] webhook_env_mismatch", {
            event_id: event.id,
            livemode: event.livemode,
            url_env: urlEnv,
            resolved_env: env,
          });
        }

        let rowId: string | null;
        try {
          rowId = await reserveEventRow(event, event);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[payments-webhook] failed to record event:", message);
          return new Response(`Webhook Error: ${message}`, { status: 500, headers: CORS });
        }
        if (rowId === null) {
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            status: 200,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const { createStripeClient } = await import("@/lib/billing/stripe.server");
        const stripe = createStripeClient(env);

        let userId: string | null = null;
        let processingError: string | null = null;

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              const acctHeader = request.headers.get("stripe-account");
              // Connect Checkout Sessions arrive with a Stripe-Account header — route to connected-account handler.
              if (acctHeader) {
                await handleConnectCheckoutCompleted(session, acctHeader);
                break;
              }
              const meta = (session.metadata ?? {}) as Record<string, string>;
              if (meta.kind === "credit_topup") {
                const topupUserId = meta.reps_user_id || meta.userId;
                const credits = Number(meta.credits);
                if (topupUserId && credits > 0) {
                  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                  const { error } = await supabaseAdmin.rpc("grant_credit_topup", {
                    _user_id: topupUserId,
                    _credits: credits,
                    _stripe_session_id: session.id,
                    _pack: meta.pack ?? null,
                  } as never);
                  if (error) throw error;
                  userId = topupUserId;
                }
              } else if (meta.kind === "cert_batch" && meta.batch_id) {
                // Certificate batch — mark paid, then issue PDFs.
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                await supabaseAdmin
                  .from("certificate_batches")
                  .update({
                    status: "paid",
                    paid_at: new Date().toISOString(),
                    stripe_payment_intent_id:
                      typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : (session.payment_intent?.id ?? null),
                  } as never)
                  .eq("id", meta.batch_id);
                await supabaseAdmin
                  .from("certificate_registrations")
                  .update({ status: "paid", paid_at: new Date().toISOString() } as never)
                  .eq("batch_id", meta.batch_id)
                  .eq("status", "pending_payment");
                try {
                  const { issueCertificatesForBatch } = await import(
                    "@/lib/certificates/issue.server"
                  );
                  await issueCertificatesForBatch(meta.batch_id);
                } catch (e) {
                  console.error("[cert-batch] issuance failed", e);
                }
                userId = meta.provider_id || null;
              } else if (session.mode === "subscription" && session.subscription) {
                // Deferred signup (Option 1): if this checkout was started
                // from /signup before any auth.users row existed, mint the
                // real user now from the pending_signups row. Idempotent —
                // /checkout/return may have already done this if it ran first.
                const pendingId = meta.reps_pending_signup_id;
                if (pendingId) {
                  try {
                    const { ensureUserFromPendingSignup } = await import(
                      "@/lib/billing/deferred-signup.server"
                    );
                    await ensureUserFromPendingSignup(pendingId, env);
                  } catch (e) {
                    console.error("[deferred-signup] ensureUser failed:", e);
                  }
                }
                const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                userId = await upsertSubscriptionFromStripe(sub, stripe, env);
                // Purchase confirmation (welcome) email — idempotent on the session id.
                try {
                  if (userId) {
                    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                    const email = authUser?.user?.email ?? null;
                    if (email) {
                      const { data: profile } = await supabaseAdmin
                        .from("profiles").select("full_name").eq("id", userId).maybeSingle();
                      const item = sub.items.data[0];
                      const tier = (sub.metadata?.tier as string) ?? "verified";
                      const tierLabel = tier === "pro" ? "REPS Pro" : tier === "studio" ? "REPS Studio" : "REPS Core";
                      const interval = item?.price.recurring?.interval ?? null;
                      const periodText = interval === "year" ? "/year" : interval === "month" ? "/month" : "";
                      const amount = (item?.price.unit_amount ?? 0) / 100;
                      const amountText = amount > 0 ? `£${amount.toFixed(amount % 1 === 0 ? 0 : 2)}` : undefined;
                      const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
                      await sendTransactionalEmailServer({
                        templateName: "purchase-confirmation",
                        recipientEmail: email,
                        idempotencyKey: `purchase-confirmation:${session.id}`,
                        templateData: {
                          proName: (profile?.full_name ?? "").toString().split("")[0] || null,
                          tierLabel, amountText, periodText,
                        },
                      });
                    }
                  }
                } catch (e) {
                  console.warn("[email] purchase confirmation failed:", e);
                }
                // GA4 Measurement Protocol — server-side purchase +
                // subscription_started (and trial_started if applicable).
                // Idempotent enough for GA (transaction_id dedupes) and never
                // blocks the webhook response.
                try {
                  const item = sub.items.data[0];
                  const amount = (item?.price.unit_amount ?? 0) / 100;
                  const currency = (item?.price.currency ?? "gbp").toUpperCase();
                  const tier = (sub.metadata?.tier as string) ?? "verified";
                  const period = (sub.metadata?.billing_period as string) ?? "annual";
                  const gaClientId = (sub.metadata?.ga_client_id as string) ?? (session.metadata?.ga_client_id as string) ?? null;
                  const ga = await import("@/lib/analytics/ga-measurement-protocol.server");
                  await ga.sendGaPurchase({
                    clientId: gaClientId, userId,
                    transactionId: sub.id,
                    value: amount, currency, tier, period,
                  });
                  await ga.sendGaLifecycle({
                    clientId: gaClientId, userId,
                    event: sub.status === "trialing" ? "trial_started" : "subscription_started",
                    subscriptionId: sub.id,
                    tier, period, value: amount, currency,
                  });
                } catch (e) {
                  console.warn("[ga4-mp] purchase dispatch failed:", e);
                }

                // BD setup-link / reactivation token consumption was retired
                // when the legacy modules were archived in Phase 7.

              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              try {
                userId = await upsertSubscriptionFromStripe(sub, stripe, env);
              } catch (err) {
                // For .deleted events we soft-handle "no REPS user" — the
                // Stripe customer was never linked to anyone in our DB
                // (e.g. legacy product, test customer), so there is nothing
                // to remove. Mark processed instead of leaving a permanent
                // processing_error.
                if (
                  event.type === "customer.subscription.deleted" &&
                  err instanceof Error &&
                  err.message.startsWith("No REPS user found")
                ) {
                  console.warn(
                    `[webhook] subscription.deleted no-op: ${err.message} (sub ${sub.id})`,
                  );
                  userId = null;
                  break;
                }
                throw err;
              }
              // Churn lifecycle hooks
              if (userId) {
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                if (event.type === "customer.subscription.deleted") {
                  // GA4 — subscription_cancelled (fire BEFORE closeMembership, which
                  // deletes the auth user and would break follow-up lookups).
                  try {
                    const item = sub.items.data[0];
                    const amount = (item?.price.unit_amount ?? 0) / 100;
                    const currency = (item?.price.currency ?? "gbp").toUpperCase();
                    const tier = (sub.metadata?.tier as string) ?? "verified";
                    const period = (sub.metadata?.billing_period as string) ?? "annual";
                    const { sendGaLifecycle } = await import("@/lib/analytics/ga-measurement-protocol.server");
                    await sendGaLifecycle({
                      clientId: null, userId,
                      event: "subscription_cancelled",
                      subscriptionId: sub.id,
                      tier, period, value: amount, currency,
                      cancelReason: sub.cancellation_details?.reason ?? null,
                    });
                  } catch (e) { console.warn("[ga4-mp] cancel dispatch failed:", e); }

                  await supabaseAdmin.rpc("enter_churn_stage" as never, {
                    _user_id: userId, _stage: "grace",
                    _reason: "Stripe subscription deleted",
                    _source_event: event.type,
                    _metadata: { subscription_id: sub.id },
                  } as never);
                  // Self-cancel cleanup — unpublish profile, archive email,
                  // delete auth user, send confirmation. Canonical contract
                  // shared with admin-initiated closure. Idempotent: if the
                  // user was already deleted (admin-led cancel that fired
                  // this webhook), the helper will throw "Member has no
                  // email on auth account" which we swallow.
                  try {
                    const { _closeMembershipImpl } = await import(
                      "@/lib/admin/close-membership.server"
                    );
                    await _closeMembershipImpl({
                      user_id: userId,
                      mode: "end_now_delete",
                      reason: "member_request",
                      notes: `Stripe self-cancel via portal (sub ${sub.id})`,
                      actor_id: "stripe_webhook",
                    });
                  } catch (e: any) {
                    if (!/no email on auth account/i.test(e?.message ?? "")) {
                      console.warn(
                        "[webhook] self-cancel cleanup failed:",
                        e?.message ?? e,
                      );
                    }
                  }
                } else if (sub.status === "past_due" || sub.status === "unpaid") {
                  // Subscription transitioned to past_due — enrol in recovery
                  // (parallel to invoice.payment_failed; idempotent via
                  // enter_churn_stage + dedupe on recent nudges).
                  await supabaseAdmin.rpc("enter_churn_stage" as never, {
                    _user_id: userId, _stage: "at_risk",
                    _reason: `Subscription status ${sub.status}`,
                    _source_event: event.type,
                    _metadata: { subscription_id: sub.id, status: sub.status },
                  } as never);
                  try {
                    const { mintAndEmailRenewalToken } = await import("@/lib/churn/lifecycle.functions");
                    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                    const email = authUser?.user?.email ?? null;
                    if (email) {
                      // Throttle: skip if already nudged in last 3 days
                      const { data: existing } = await supabaseAdmin
                        .from("churn_lifecycle").select("last_nudge_at")
                        .eq("user_id", userId).maybeSingle();
                      const recent = existing?.last_nudge_at
                        && (Date.now() - new Date(existing.last_nudge_at as string).getTime()) < 3 * 86400000;
                      if (!recent) {
                        const { data: profile } = await supabaseAdmin
                          .from("profiles").select("full_name").eq("id", userId).maybeSingle();
                        const graceEnd = new Date(Date.now() + 14 * 86400000);
                        const subItem = sub.items.data[0];
                        const subAmt = (subItem?.price.unit_amount ?? 0) / 100;
                        const subAmount = subAmt > 0 ? `£${subAmt.toFixed(subAmt % 1 === 0 ? 0 : 2)}` : "£34";
                        await mintAndEmailRenewalToken({
                          userId, email, purpose: "payment_failed",
                          templateName: "renewal-payment-failed",
                          intendedTier: (sub.metadata?.tier as string) ?? "verified",
                          templateData: {
                            proName: (profile as { full_name?: string | null } | null)?.full_name?.split("")[0] ?? "there",
                            amount: subAmount,
                            graceEndDate: graceEnd.toLocaleDateString("en-GB", {
                              day: "numeric", month: "long", year: "numeric",
                            }),
                          },
                        });
                      }
                    }
                  } catch (e) {
                    console.warn("[churn] past_due email failed:", e);
                  }
                } else if (sub.status === "active" || sub.status === "trialing") {
                  await supabaseAdmin.rpc("enter_churn_stage" as never, {
                    _user_id: userId, _stage: "active",
                    _reason: "Active subscription",
                    _source_event: event.type,
                  } as never);
                }

                // Safeguard: a subscription with cancel_at_period_end=true is
                // a scheduled cancel. REPS policy is immediate termination —
                // escalate to full close now so the account is not left in a
                // grace state. Skipped for the .deleted branch above (already
                // handled) and only relevant on .updated.
                if (
                  event.type === "customer.subscription.updated" &&
                  sub.cancel_at_period_end === true &&
                  sub.status !== "canceled"
                ) {
                  try {
                    const { _closeMembershipImpl } = await import(
                      "@/lib/admin/close-membership.server"
                    );
                    await _closeMembershipImpl({
                      user_id: userId,
                      mode: "end_now_delete",
                      reason: "member_request",
                      notes: `Stripe scheduled cancel_at_period_end escalated to immediate close (sub ${sub.id})`,
                      actor_id: "stripe_webhook",
                    });
                  } catch (e: any) {
                    if (!/no email on auth account/i.test(e?.message ?? "")) {
                      console.warn(
                        "[webhook] cap_end escalation failed:",
                        e?.message ?? e,
                      );
                    }
                  }
                }
              }
              break;
            }


            case "invoice.marked_uncollectible": {
              // Stripe has given up on collecting after smart retries.
              // Treat as an immediate close — same outcome as
              // customer.subscription.deleted would produce.
              const invoice = event.data.object as Stripe.Invoice;
              const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription }).subscription;
              const subId = typeof subRef === "string" ? subRef : subRef?.id;
              if (subId) {
                const sub = await stripe.subscriptions.retrieve(subId);
                try {
                  userId = await upsertSubscriptionFromStripe(sub, stripe, env);
                } catch (err) {
                  if (err instanceof Error && err.message.startsWith("No REPS user found")) {
                    userId = null;
                    break;
                  }
                  throw err;
                }
              }
              if (userId) {
                try {
                  const { _closeMembershipImpl } = await import(
                    "@/lib/admin/close-membership.server"
                  );
                  await _closeMembershipImpl({
                    user_id: userId,
                    mode: "end_now_delete",
                    reason: "stripe_uncollectible",
                    notes: `Invoice marked uncollectible (invoice ${invoice.id})`,
                    actor_id: "stripe_webhook",
                  });
                } catch (e: any) {
                  if (!/no email on auth account/i.test(e?.message ?? "")) {
                    console.warn(
                      "[webhook] uncollectible close failed:",
                      e?.message ?? e,
                    );
                  }
                }
              }
              break;
            }

            case "invoice.payment_succeeded":
            case "invoice.payment_failed": {
              const invoice = event.data.object as Stripe.Invoice;
              const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription }).subscription;
              const subId = typeof subRef === "string" ? subRef : subRef?.id;
              if (subId) {
                const sub = await stripe.subscriptions.retrieve(subId);
                userId = await upsertSubscriptionFromStripe(sub, stripe, env);
              }
              // GA4 lifecycle for renewals + payment failures.
              if (userId) {
                try {
                  const billingReason = (invoice as unknown as { billing_reason?: string }).billing_reason ?? null;
                  const invAmt = ((invoice as unknown as { amount_paid?: number; amount_due?: number }).amount_paid
                    ?? (invoice as unknown as { amount_due?: number }).amount_due ?? 0) / 100;
                  const invCurrency = ((invoice as unknown as { currency?: string }).currency ?? "gbp").toUpperCase();
                  let gaTier = "verified"; let gaPeriod = "annual";
                  if (subId) {
                    const s = await stripe.subscriptions.retrieve(subId);
                    gaTier = (s.metadata?.tier as string) ?? gaTier;
                    gaPeriod = (s.metadata?.billing_period as string) ?? gaPeriod;
                  }
                  const { sendGaLifecycle } = await import("@/lib/analytics/ga-measurement-protocol.server");
                  if (event.type === "invoice.payment_succeeded" && billingReason === "subscription_cycle") {
                    await sendGaLifecycle({
                      clientId: null, userId,
                      event: "subscription_renewed",
                      subscriptionId: subId ?? invoice.id ?? "unknown",
                      tier: gaTier, period: gaPeriod,
                      value: invAmt, currency: invCurrency,
                    });
                  } else if (event.type === "invoice.payment_failed") {
                    await sendGaLifecycle({
                      clientId: null, userId,
                      event: "payment_failed",
                      subscriptionId: subId ?? invoice.id ?? "unknown",
                      tier: gaTier, period: gaPeriod,
                      value: invAmt, currency: invCurrency,
                    });
                  }
                } catch (e) { console.warn("[ga4-mp] invoice lifecycle dispatch failed:", e); }
              }

              if (userId && event.type === "invoice.payment_failed") {
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                await supabaseAdmin.rpc("enter_churn_stage" as never, {
                  _user_id: userId, _stage: "at_risk",
                  _reason: "Invoice payment failed",
                  _source_event: event.type,
                  _metadata: { invoice_id: invoice.id },
                } as never);
                // Fire dunning email
                try {
                  const { mintAndEmailRenewalToken } = await import("@/lib/churn/lifecycle.functions");
                  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                  const email = authUser?.user?.email ?? null;
                  if (email) {
                    const { data: profile } = await supabaseAdmin
                      .from("profiles").select("full_name").eq("id", userId).maybeSingle();
                    const graceEnd = new Date(Date.now() + 14 * 86400000);

                    const invAmt = ((invoice as unknown as { amount_due?: number }).amount_due ?? 0) / 100;
                    const invAmount = invAmt > 0 ? `£${invAmt.toFixed(invAmt % 1 === 0 ? 0 : 2)}` : "£34";
                    const invTier = subId
                      ? (((await stripe.subscriptions.retrieve(subId)).metadata?.tier as string) ?? "verified")
                      : "verified";
                    await mintAndEmailRenewalToken({
                      userId, email, purpose: "payment_failed",
                      templateName: "renewal-payment-failed",
                      intendedTier: invTier,
                      templateData: {
                        proName: (profile as { full_name?: string | null } | null)?.full_name?.split("")[0] ?? "there",
                        amount: invAmount,
                        graceEndDate: graceEnd.toLocaleDateString("en-GB", {
                          day: "numeric", month: "long", year: "numeric",
                        }),
                      },
                    });
                  }
                } catch (e) {
                  console.warn("[churn] payment_failed email failed:", e);
                }
              }
              break;
            }
            case "identity.verification_session.created":
            case "identity.verification_session.processing":
            case "identity.verification_session.requires_input":
            case "identity.verification_session.verified":
            case "identity.verification_session.canceled": {
              await handleIdentityEvent(stripe, event, env);
              break;
            }
            case "account.updated": {
              await handleConnectAccountUpdated(event.data.object as Stripe.Account);
              break;
            }
            case "charge.refunded": {
              const acctHeader = request.headers.get("stripe-account");
              if (acctHeader) await handleConnectChargeRefunded(event.data.object as Stripe.Charge);
              else await handlePlatformChargeRefunded(event.data.object as Stripe.Charge, env);
              break;
            }
            case "charge.dispute.created":
            case "charge.dispute.updated":
            case "charge.dispute.closed":
            case "charge.dispute.funds_withdrawn":
            case "charge.dispute.funds_reinstated": {
              const acctHeader = request.headers.get("stripe-account");
              if (acctHeader) {
                await handleConnectDispute(event.data.object as Stripe.Dispute, event.type);
              } else {
                const { handlePlatformDispute } = await import("@/lib/billing/disputes.server");
                const res = await handlePlatformDispute(
                  event.data.object as Stripe.Dispute,
                  event.type,
                  stripe,
                  env,
                );
                if (res.userId) userId = res.userId;
              }
              break;
            }
            default:
              break;
          }
        } catch (err) {
          processingError = err instanceof Error ? err.message : String(err);
          console.error(`[payments-webhook] error handling ${event.type}:`, processingError);
        }

        await finalizeEventRow(rowId, { userId, processingError });

        if (processingError) {
          // B-02 dead-letter policy: increment retry_count; after 5 failed
          // attempts, ack 200 ("dead-lettered") so Stripe stops retrying
          // forever. Row remains flagged for the ops dashboard.
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row } = await supabaseAdmin
            .from("payment_events")
            .select("retry_count")
            .eq("id", rowId)
            .maybeSingle();
          const nextCount = ((row?.retry_count as number | null) ?? 0) + 1;
          const DLQ_THRESHOLD = 5;
          const deadLetter = nextCount >= DLQ_THRESHOLD;
          await supabaseAdmin
            .from("payment_events")
            .update({
              retry_count: nextCount,
              dead_lettered_at: deadLetter ? new Date().toISOString() : null,
            } as never)
            .eq("id", rowId);
          if (deadLetter) {
            console.error(
              `[payments-webhook] DEAD-LETTER event=${event.id} type=${event.type} attempts=${nextCount} error=${processingError}`,
            );
            try {
              await supabaseAdmin.from("ops_alerts").insert({
                kind: "payments.webhook_dead_lettered",
                severity: "high",
                context: {
                  event_id: event.id,
                  event_type: event.type,
                  attempts: nextCount,
                  error: processingError,
                } as never,
              } as never);
            } catch (e) {
              console.warn("[payments-webhook] DLQ ops alert failed", e);
            }
            return new Response(
              JSON.stringify({ received: true, dead_lettered: true, attempts: nextCount }),
              { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
            );
          }
          return new Response(
            JSON.stringify({ received: true, error: processingError, attempts: nextCount }),
            { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...CORS, "Content-Type": "application/json" },
        });

      },
    },
  },
});
