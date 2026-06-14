/**
 * Legacy → REPs Stripe linking and renewal.
 *
 * Flow:
 *   1. linkLegacyStripeCustomers — for each bd_member_seed row, find their
 *      existing Stripe customer by email, compute access_expires_at, and
 *      upsert a row in legacy_stripe_link. NO subscription created today.
 *
 *   2. runLegacyRenewalBatch — for each legacy_stripe_link row whose
 *      access_expires_at has passed, create a Verified £99/yr subscription
 *      on that customer. If a default payment method exists, Stripe charges
 *      it. If not, the subscription is created with collection_method=
 *      send_invoice so nothing fails; status flips to awaiting_payment_method
 *      until the user signs in and adds a card.
 *
 *   3. NO EMAILS sent by REPs. Stripe receipt emails are controlled by the
 *      account-level toggle in Stripe Dashboard → Settings → Emails.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StripeEnv } from "@/lib/billing/stripe.server";

const EnvSchema = z.object({ environment: z.enum(["sandbox", "live"]).default("live") });

// Case-insensitive lookup. Stripe Search is case-insensitive on email and
// supports metadata['email'] fallback. Falls back to customers.list (exact
// case match) for accounts where Search isn't indexed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findStripeCustomerByEmail(stripe: any, email: string): Promise<any | null> {
  const safe = email.replace(/"/g, '\\"');
  try {
    const res = await stripe.customers.search({
      query: `email:"${safe}" OR metadata["email"]:"${safe}"`,
      limit: 3,
    });
    const live = (res.data ?? []).filter((c: { deleted?: boolean }) => !c.deleted);
    if (live.length) {
      // Prefer most recently created.
      live.sort((a: { created?: number }, b: { created?: number }) => (b.created ?? 0) - (a.created ?? 0));
      return live[0];
    }
  } catch {
    // Search may rate-limit or be unavailable; fall through to list.
  }
  const list = await stripe.customers.list({ email, limit: 1 });
  return list.data[0] ?? null;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureAdmin(context: any) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export type LegacyLinkingStats = {
  total_seed: number;
  linked: number;
  pending: number;
  scheduled: number;
  renewed: number;
  awaiting_payment_method: number;
  skipped: number;
  error: number;
  due_now: number;
  next_due_at: string | null;
};

export const getLegacyLinkingStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LegacyLinkingStats> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: total }, links, due, nextDue] = await Promise.all([
      supabaseAdmin.from("bd_member_seed").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("legacy_stripe_link").select("migration_status,stripe_customer_id"),
      supabaseAdmin
        .from("legacy_stripe_link")
        .select("*", { count: "exact", head: true })
        .eq("migration_status", "pending")
        .not("stripe_customer_id", "is", null)
        .lte("access_expires_at", new Date().toISOString()),
      supabaseAdmin
        .from("legacy_stripe_link")
        .select("access_expires_at")
        .eq("migration_status", "pending")
        .not("access_expires_at", "is", null)
        .gt("access_expires_at", new Date().toISOString())
        .order("access_expires_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const rows = (links.data ?? []) as { migration_status: string; stripe_customer_id: string | null }[];
    const count = (s: string) => rows.filter((r) => r.migration_status === s).length;

    return {
      total_seed: total ?? 0,
      linked: rows.filter((r) => r.stripe_customer_id).length,
      pending: count("pending"),
      scheduled: count("scheduled"),
      renewed: count("renewed_to_verified"),
      awaiting_payment_method: count("awaiting_payment_method"),
      skipped: count("skipped"),
      error: count("error"),
      due_now: (due.count as number | null) ?? 0,
      next_due_at: (nextDue.data as { access_expires_at: string | null } | null)?.access_expires_at ?? null,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Pass 1 — Link legacy members to existing Stripe customers.
// ─────────────────────────────────────────────────────────────────────────────

export type LegacyLinkResult = {
  processed: number;
  linked_recurring: number;
  linked_onetime: number;
  no_customer: number;
  errors: number;
  sample_errors: string[];
};

export const linkLegacyStripeCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => EnvSchema.parse(input))
  .handler(async ({ data, context }): Promise<LegacyLinkResult> => {
    await ensureAdmin(context);
    const env = data.environment as StripeEnv;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(env);

    // Pull every seed row that doesn't have a link yet.
    const { data: existingLinks } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select("bd_member_id");
    const have = new Set((existingLinks ?? []).map((r) => (r as { bd_member_id: number }).bd_member_id));

    const { data: seedRows } = await supabaseAdmin
      .from("bd_member_seed")
      .select("bd_member_id,email,legacy_signup_at,legacy_billing_period,legacy_plan");
    const todo = (seedRows ?? []).filter(
      (r) => !have.has((r as { bd_member_id: number }).bd_member_id),
    );

    const res: LegacyLinkResult = {
      processed: 0,
      linked_recurring: 0,
      linked_onetime: 0,
      no_customer: 0,
      errors: 0,
      sample_errors: [],
    };

    const now = Date.now();
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    for (const raw of todo) {
      const row = raw as {
        bd_member_id: number;
        email: string;
        legacy_signup_at: string | null;
        legacy_billing_period: string | null;
      };
      res.processed += 1;
      try {
        const customer = await findStripeCustomerByEmail(stripe, row.email);

        if (!customer) {
          await supabaseAdmin.from("legacy_stripe_link").insert({
            bd_member_id: row.bd_member_id,
            email: row.email,
            legacy_kind: "none",
            link_status: "no_customer",
            migration_status: "skipped",
            notes: "No Stripe customer found by email.",
          } as never);
          res.no_customer += 1;
          continue;
        }


        // Look for an active recurring sub.
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 5,
        });
        const activeSub = subs.data.find((s) =>
          ["active", "trialing", "past_due"].includes(s.status),
        );

        if (activeSub) {
          const item = activeSub.items.data[0] as { current_period_end?: number; price: { id: string } } | undefined;
          const cpeSec = item?.current_period_end ?? null;
          const cpe = cpeSec ? new Date(cpeSec * 1000).toISOString() : null;
          const priceId = item?.price.id ?? null;

          await supabaseAdmin.from("legacy_stripe_link").insert({
            bd_member_id: row.bd_member_id,
            email: row.email,
            stripe_customer_id: customer.id,
            stripe_subscription_id: activeSub.id,
            current_price_id: priceId,
            access_expires_at: cpe,
            legacy_kind: "recurring",
            link_status: "linked",
            migration_status: "pending",
          } as never);
          res.linked_recurring += 1;
        } else {
          // One-time or lapsed customer. Compute access window.
          const signupMs = row.legacy_signup_at ? new Date(row.legacy_signup_at).getTime() : null;
          let expiresMs: number;
          if (signupMs) {
            const naturalExpiry = signupMs + ONE_YEAR_MS;
            expiresMs = naturalExpiry > now ? naturalExpiry : now + THIRTY_DAYS_MS;
          } else {
            expiresMs = now + THIRTY_DAYS_MS;
          }

          await supabaseAdmin.from("legacy_stripe_link").insert({
            bd_member_id: row.bd_member_id,
            email: row.email,
            stripe_customer_id: customer.id,
            access_expires_at: new Date(expiresMs).toISOString(),
            legacy_kind: "onetime",
            link_status: "linked",
            migration_status: "pending",
          } as never);
          res.linked_onetime += 1;
        }
      } catch (e) {
        res.errors += 1;
        if (res.sample_errors.length < 5) {
          res.sample_errors.push(`${row.email}: ${(e as Error).message}`);
        }
        await supabaseAdmin.from("legacy_stripe_link").insert({
          bd_member_id: row.bd_member_id,
          email: row.email,
          legacy_kind: "unknown",
          link_status: "error",
          migration_status: "error",
          notes: (e as Error).message.slice(0, 500),
        } as never);
      }
    }

    return res;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Pass 2 — Renew due rows onto Verified £99/yr.
// ─────────────────────────────────────────────────────────────────────────────

export type LegacyRenewalResult = {
  processed: number;
  charged: number;
  awaiting_payment_method: number;
  errors: number;
  sample_errors: string[];
};

export const runLegacyRenewalBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ environment: z.enum(["sandbox", "live"]).default("live"), limit: z.number().int().min(1).max(200).default(50) })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<LegacyRenewalResult> => {
    await ensureAdmin(context);
    return _runLegacyRenewalBatch(data.environment as StripeEnv, data.limit);
  });

export async function _runLegacyRenewalBatch(env: StripeEnv, limit: number): Promise<LegacyRenewalResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { createStripeClient, resolvePriceByLookupKey } = await import("@/lib/billing/stripe.server");
  const stripe = createStripeClient(env);

  const verifiedPrice = await resolvePriceByLookupKey(stripe, "verified_annual");

  const { data: due } = await supabaseAdmin
    .from("legacy_stripe_link")
    .select("bd_member_id,email,stripe_customer_id,access_expires_at")
    .eq("migration_status", "pending")
    .not("stripe_customer_id", "is", null)
    .lte("access_expires_at", new Date().toISOString())
    .limit(limit);

  const rows = (due ?? []) as {
    bd_member_id: number;
    email: string;
    stripe_customer_id: string;
    access_expires_at: string;
  }[];

  const res: LegacyRenewalResult = {
    processed: 0,
    charged: 0,
    awaiting_payment_method: 0,
    errors: 0,
    sample_errors: [],
  };

  for (const row of rows) {
    res.processed += 1;
    try {
      const customer = (await stripe.customers.retrieve(row.stripe_customer_id)) as {
        deleted?: boolean;
        invoice_settings?: { default_payment_method?: string | { id: string } | null };
        default_source?: string | null;
      };
      if ((customer as { deleted?: boolean }).deleted) {
        await markRow(row.bd_member_id, {
          migration_status: "error",
          notes: "Stripe customer deleted.",
        });
        res.errors += 1;
        continue;
      }
      const hasPm =
        Boolean(customer.invoice_settings?.default_payment_method) ||
        Boolean(customer.default_source);

      let sub;
      if (hasPm) {
        sub = await stripe.subscriptions.create({
          customer: row.stripe_customer_id,
          items: [{ price: verifiedPrice.id }],
          collection_method: "charge_automatically",
          off_session: true,
          metadata: {
            reps_legacy_migration: "true",
            bd_member_id: String(row.bd_member_id),
          },
        });
        await markRow(row.bd_member_id, {
          migration_status: "renewed_to_verified",
          stripe_subscription_id: sub.id,
          last_attempt_at: new Date().toISOString(),
          notes: null,
        });
        res.charged += 1;
      } else {
        sub = await stripe.subscriptions.create({
          customer: row.stripe_customer_id,
          items: [{ price: verifiedPrice.id }],
          collection_method: "send_invoice",
          days_until_due: 30,
          metadata: {
            reps_legacy_migration: "true",
            reps_legacy_no_pm: "true",
            bd_member_id: String(row.bd_member_id),
          },
        });
        await markRow(row.bd_member_id, {
          migration_status: "awaiting_payment_method",
          stripe_subscription_id: sub.id,
          last_attempt_at: new Date().toISOString(),
          notes: "No payment method on file. Subscription created with send_invoice; awaiting card from member.",
        });
        res.awaiting_payment_method += 1;
      }
    } catch (e) {
      res.errors += 1;
      if (res.sample_errors.length < 5) {
        res.sample_errors.push(`${row.email}: ${(e as Error).message}`);
      }
      await markRow(row.bd_member_id, {
        migration_status: "error",
        last_attempt_at: new Date().toISOString(),
        notes: (e as Error).message.slice(0, 500),
      });
    }
  }

  return res;

  async function markRow(
    bd_member_id: number,
    patch: Record<string, string | null>,
  ) {
    await supabaseAdmin
      .from("legacy_stripe_link")
      .update(patch as never)
      .eq("bd_member_id", bd_member_id);
  }
}
