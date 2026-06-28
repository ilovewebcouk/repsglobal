// BD legacy → native Stripe Subscription rail-swap (server-only helpers).
//
// Plan: docs/admin-v2/bd-rail-swap-audit-2026-06-28.md
//
// For each eligible legacy_stripe_link row:
//   1. Resolve Stripe Customer + default PaymentMethod
//   2. Create Subscription anchored to next_due_at via `trial_end`
//      (Stripe defers the first charge until that date, then £99/yr auto-renews)
//   3. Mirror into public.subscriptions
//   4. Mark legacy_stripe_link as converted + log to admin_audit_log
//   5. Enqueue the "membership is now on recurring billing" confirmation email
//
// Idempotent: a converted row is skipped on every subsequent run.
// Safe: cron (Phase 4) checks converted_at IS NULL before charging — see
// the legacy_stripe_link_open_due_idx partial index on the same predicate.

import type Stripe from "stripe";
import { createStripeClient, type StripeEnv } from "./stripe.server";
import { resolvePriceByLookupKey } from "./stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/send.server";

const CORE_ANNUAL_LOOKUP = "verified_annual";

export type ConvertOutcome =
  | { status: "converted"; bd_member_id: number; stripe_subscription_id: string; trial_end: string }
  | { status: "skipped"; bd_member_id: number; reason: string }
  | { status: "needs_setup_link"; bd_member_id: number; reason: string }
  | { status: "needs_reactivation"; bd_member_id: number; reason: string }
  | { status: "error"; bd_member_id: number; error: string };

export interface ConvertSummary {
  examined: number;
  converted: number;
  skipped: number;
  needs_setup_link: number;
  needs_reactivation: number;
  errors: number;
  outcomes: ConvertOutcome[];
}

/** Hard ceiling so a runaway batch can't bill everyone at once. */
const MAX_BATCH = 100;

/** Buckets the open BD population so the admin UI can show a population summary. */
export async function getConvertCandidates() {
  const { data, error } = await supabaseAdmin
    .from("legacy_stripe_link")
    .select(
      "bd_member_id,email,stripe_customer_id,next_due_at,is_lifetime,converted_at,stripe_subscription_id",
    )
    .is("converted_at", null)
    .is("stripe_subscription_id", null)
    .eq("is_lifetime", false);

  if (error) throw new Error(error.message);
  const now = Date.now();
  const auto: typeof data = [];
  const grace: typeof data = [];          // ≤30d past due but card on file
  const reactivate: typeof data = [];     // >30d past due
  const setupLink: typeof data = [];      // no Stripe customer
  for (const row of data ?? []) {
    if (!row.next_due_at) {
      setupLink.push(row);
      continue;
    }
    const due = new Date(row.next_due_at).getTime();
    const ageDays = (now - due) / 86_400_000;
    if (!row.stripe_customer_id) {
      setupLink.push(row);
    } else if (ageDays > 30) {
      reactivate.push(row);
    } else if (ageDays > 0) {
      grace.push(row);
    } else {
      auto.push(row);
    }
  }
  return {
    auto_convertible: auto.length,
    grace_cohort: grace.length,
    reactivation_cohort: reactivate.length,
    setup_link_cohort: setupLink.length,
    total_open: (data ?? []).length,
  };
}

interface RunOptions {
  /** Don't write anything — return what we *would* do. */
  dryRun?: boolean;
  /** Hard limit on how many to attempt this call. Capped at MAX_BATCH. */
  limit?: number;
  /** sandbox or live. Always passed explicitly. */
  environment: StripeEnv;
}

/** Top-level entry: convert as many auto-eligible rows as `limit` allows. */
export async function runConvertBatch(opts: RunOptions): Promise<ConvertSummary> {
  const limit = Math.min(Math.max(1, opts.limit ?? 25), MAX_BATCH);
  const stripe = createStripeClient(opts.environment);
  const price = await resolvePriceByLookupKey(stripe, CORE_ANNUAL_LOOKUP);
  if (!price.recurring) throw new Error("verified_annual is not a recurring price");

  const { data: rows, error } = await supabaseAdmin
    .from("legacy_stripe_link")
    .select(
      "bd_member_id,email,stripe_customer_id,next_due_at,is_lifetime,converted_at,stripe_subscription_id",
    )
    .is("converted_at", null)
    .is("stripe_subscription_id", null)
    .eq("is_lifetime", false)
    .not("stripe_customer_id", "is", null)
    .order("next_due_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const summary: ConvertSummary = {
    examined: rows?.length ?? 0,
    converted: 0,
    skipped: 0,
    needs_setup_link: 0,
    needs_reactivation: 0,
    errors: 0,
    outcomes: [],
  };

  for (const row of rows ?? []) {
    try {
      const outcome = await convertOne({
        row: row as LegacyRow,
        stripe,
        price,
        environment: opts.environment,
        dryRun: !!opts.dryRun,
      });
      summary.outcomes.push(outcome);
      switch (outcome.status) {
        case "converted": summary.converted++; break;
        case "skipped": summary.skipped++; break;
        case "needs_setup_link": summary.needs_setup_link++; break;
        case "needs_reactivation": summary.needs_reactivation++; break;
        case "error": summary.errors++; break;
      }
    } catch (e) {
      summary.errors++;
      summary.outcomes.push({
        status: "error",
        bd_member_id: Number(row.bd_member_id),
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return summary;
}

interface LegacyRow {
  bd_member_id: number;
  email: string;
  stripe_customer_id: string | null;
  next_due_at: string | null;
  is_lifetime: boolean;
  converted_at: string | null;
  stripe_subscription_id: string | null;
}

async function convertOne(args: {
  row: LegacyRow;
  stripe: Stripe;
  price: Stripe.Price;
  environment: StripeEnv;
  dryRun: boolean;
}): Promise<ConvertOutcome> {
  const { row, stripe, price, environment, dryRun } = args;
  const bd = Number(row.bd_member_id);

  if (row.converted_at || row.stripe_subscription_id) {
    return { status: "skipped", bd_member_id: bd, reason: "already_converted" };
  }
  if (!row.stripe_customer_id) {
    return { status: "needs_setup_link", bd_member_id: bd, reason: "no_stripe_customer" };
  }
  if (!row.next_due_at) {
    return { status: "needs_setup_link", bd_member_id: bd, reason: "no_renewal_date" };
  }

  const now = Date.now();
  const due = new Date(row.next_due_at).getTime();
  const ageDays = (now - due) / 86_400_000;
  if (ageDays > 30) {
    return { status: "needs_reactivation", bd_member_id: bd, reason: "lapsed_over_30d" };
  }

  // Inspect the customer for a default PM; fall back to first attached card.
  const customer = (await stripe.customers.retrieve(row.stripe_customer_id, {
    expand: ["invoice_settings.default_payment_method"],
  })) as Stripe.Customer | Stripe.DeletedCustomer;
  if ("deleted" in customer && customer.deleted) {
    return { status: "needs_setup_link", bd_member_id: bd, reason: "stripe_customer_deleted" };
  }

  let pmId: string | undefined =
    typeof customer.invoice_settings?.default_payment_method === "string"
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id;

  if (!pmId) {
    const list = await stripe.paymentMethods.list({
      customer: row.stripe_customer_id,
      type: "card",
      limit: 1,
    });
    pmId = list.data[0]?.id;
  }
  if (!pmId) {
    return { status: "needs_setup_link", bd_member_id: bd, reason: "no_payment_method" };
  }

  // Trial period defers first charge until the original BD renewal date.
  // For ≤30d past-due grace cases we give them 7 days runway with an honest email.
  const trialEndUnix = ageDays > 0
    ? Math.floor((now + 7 * 86_400_000) / 1000)
    : Math.floor(due / 1000);
  const trialEndIso = new Date(trialEndUnix * 1000).toISOString();

  if (dryRun) {
    return { status: "converted", bd_member_id: bd, stripe_subscription_id: "DRYRUN", trial_end: trialEndIso };
  }

  // Mirror the customer.default_payment_method so Stripe can use it off-session.
  if (!customer.invoice_settings?.default_payment_method) {
    await stripe.customers.update(row.stripe_customer_id, {
      invoice_settings: { default_payment_method: pmId },
    });
  }

  const sub = await stripe.subscriptions.create(
    {
      customer: row.stripe_customer_id,
      items: [{ price: price.id }],
      default_payment_method: pmId,
      trial_end: trialEndUnix,
      proration_behavior: "none",
      collection_method: "charge_automatically",
      metadata: {
        migrated_from: "bd_legacy",
        bd_member_id: String(bd),
        original_next_due: row.next_due_at,
      },
    },
    { idempotencyKey: `bd-convert-${bd}` },
  );

  // Mirror into public.subscriptions (upsert on stripe_subscription_id).
  // Match an existing user if we have one; otherwise leave user_id null on
  // the audit row — the webhook will reconcile when the user signs in.
  // Resolve a REPs user_id if we can (bd_migration mapping is authoritative).
  // If we can't, we still create the Stripe Subscription — the Stripe webhook
  // will mirror into public.subscriptions when the user later signs in and
  // their auth.users row is linked to this customer.
  let userId: string | null = null;
  const { data: userRow } = await supabaseAdmin
    .from("bd_migration")
    .select("rep_user_id")
    .eq("bd_member_id", String(bd))
    .maybeSingle();
  if (userRow?.rep_user_id) userId = userRow.rep_user_id;

  if (userId) {
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          tier: "verified",
          billing_period: "annual",
          status: sub.status as "trialing" | "active",
          stripe_customer_id: row.stripe_customer_id,
          stripe_subscription_id: sub.id,
          stripe_price_id: price.id,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : trialEndIso,
          is_founding: false,
          migrated_from_bd: true,
          environment,
          payment_standing: "ok",
          metadata: { bd_member_id: bd, trial_end_iso: trialEndIso },
        },
        { onConflict: "stripe_subscription_id" },
      );
  }

  // Stamp the legacy row so the cron (and our own next batch) skips it.
  await supabaseAdmin
    .from("legacy_stripe_link")
    .update({
      stripe_subscription_id: sub.id,
      migration_status: "converted_to_subscription",
      migration_kind: ageDays > 0 ? "auto_grace" : "auto",
      converted_at: new Date().toISOString(),
      converted_subscription_id: sub.id,
    })
    .eq("bd_member_id", bd);

  // Audit log
  await supabaseAdmin.from("admin_audit_log").insert({
    action: "bd_legacy_converted_to_subscription",
    target_type: "legacy_stripe_link",
    target_id: String(bd),
    metadata: {
      bd_member_id: bd,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: sub.id,
      trial_end: trialEndIso,
      grace: ageDays > 0,
      environment,
    },
  });

  // Confirmation email — non-blocking failure.
  try {
    await sendTransactionalEmailServer({
      templateName: "legacy-conversion-confirmation",
      recipientEmail: row.email,
      idempotencyKey: `bd-convert-${bd}`,
      templateData: {
        renewalDate: new Date(trialEndUnix * 1000).toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        }),
        amount: "£99",
        dashboardUrl: "https://repsuk.org/dashboard",
      },
    });
  } catch (e) {
    console.warn("[bd-convert] confirmation email failed", bd, e);
  }

  return {
    status: "converted",
    bd_member_id: bd,
    stripe_subscription_id: sub.id,
    trial_end: trialEndIso,
  };
}
