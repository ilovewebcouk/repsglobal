/**
 * Admin — Bulk import training providers with pre-existing Stripe customers.
 *
 * Takes a list of { email, stripe_customer_id, provider_name, website? } rows
 * and, for each:
 *   1. If the email is already an auth user  → link the Stripe customer to
 *      an active `training_provider` subscription, seed the provider row if
 *      missing, and send the "portal is live" announcement (no reset link).
 *   2. Otherwise → create the auth user via `generateLink({type:'invite'})`
 *      (this is the password-set link Supabase uses for invites), seed
 *      profiles / professionals rows, upsert the subscription with the
 *      provided stripe_customer_id, and send the announcement WITH the
 *      password-set CTA.
 *
 * Every imported provider is `account_type = "training_provider"`, tier
 * `training_provider`, subscription `active`. Full REPS provider
 * verification is still required before certificates can issue — that
 * gate is enforced elsewhere; this fn does not bypass it.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* -------------------------------- gates -------------------------------- */

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

/* -------------------------------- utils -------------------------------- */

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueProviderSlug(sa: any, name: string, excludeId?: string) {
  const base = slugify(name);
  if (!base) return null;
  let slug = base;
  for (let i = 2; i < 60; i++) {
    const query = sa.from("professionals").select("id").eq("slug", slug);
    if (excludeId) query.neq("id", excludeId);
    const { data: clash } = await query.maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }
  return slug;
}

function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  let out = u.toString();
  if (u.pathname === "/" && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

async function findAuthUserByEmail(sa: any, email: string): Promise<string | null> {
  // paginate up to a reasonable ceiling; expected list size is small.
  const perPage = 1000;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await sa.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = (data?.users || []) as Array<{ id: string; email: string | null }>;
    const hit = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (users.length < perPage) return null;
  }
  return null;
}

/* -------------------------------- input -------------------------------- */

const RowInput = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  stripe_customer_id: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^cus_[A-Za-z0-9]+$/, "stripe_customer_id must look like cus_..."),
  provider_name: z.string().trim().min(1).max(160),
  website: z.string().trim().max(300).optional().nullable(),
  /**
   * Optional unix-seconds timestamp to use as the subscription's
   * billing_cycle_anchor + trial_end when we ACTIVATE a fresh £479/yr sub
   * for a customer with no active subscription on file. If omitted, no
   * subscription is created (row still gets seeded + email skipped).
   */
  renewal_anchor_ts: z.number().int().positive().optional(),
});

const Input = z.object({
  rows: z.array(RowInput).min(1).max(500),
  /** If true, actually run. If false, dry-run and just report what WOULD happen. */
  commit: z.boolean().default(false),
  /** Stripe environment for subscription audit + price cap. */
  environment: z.enum(["sandbox", "live"]).default("live"),
});

/* -------------------------------- output ------------------------------- */

/** Cap for renewal price in pence (£479 / yr). */
const RENEWAL_CAP_PENCE = 47900;
/** Lookup key of the £479/yr training-provider Stripe price. */
const TP_ANNUAL_LOOKUP = "training_provider_annual";

export type StripeAudit = {
  found: boolean;
  subscription_id?: string;
  subscription_item_id?: string;
  status?: string;
  price_id?: string;
  unit_amount_pence?: number | null;
  currency?: string;
  interval?: string;
  current_period_end?: number | null;
  renewal_action:
    | "keep_current_price"
    | "cap_to_479_at_renewal"
    | "already_at_cap"
    | "no_active_sub"
    | "non_gbp"
    | "non_annual"
    | "audit_error";
  note?: string;
};

export type ImportRowResult = {
  email: string;
  provider_name: string;
  stripe_customer_id: string;
  action:
    | "would_create"
    | "would_link_existing"
    | "created"
    | "linked_existing"
    | "skipped"
    | "error";
  user_id?: string;
  slug?: string;
  invite_url?: string;
  message_id?: string;
  detail: string;
  stripe_audit?: StripeAudit;
  renewal_applied?: boolean;
  /** Set when we successfully created a fresh £479/yr Stripe subscription. */
  subscription_activated?: boolean;
  /** Stripe subscription id after activation (if any). */
  activated_subscription_id?: string;
  /** Anchor timestamp used, so the UI can echo the first-bill date. */
  activated_anchor_ts?: number;
};

export type ImportSummary = {
  total: number;
  created: number;
  linked_existing: number;
  errors: number;
  dry_run: boolean;
};

/* ------------------------------ stripe audit ---------------------------- */

/** Fetch the current active/trialing/past_due subscription for a customer, if any. */
async function auditStripeCustomer(
  stripe: any,
  customerId: string,
): Promise<StripeAudit> {
  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    const preferred = ["active", "trialing", "past_due"];
    const sorted = [...subs.data].sort((a: any, b: any) => {
      const ai = preferred.indexOf(a.status);
      const bi = preferred.indexOf(b.status);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return (b.created ?? 0) - (a.created ?? 0);
    });
    const sub = sorted.find((s: any) => preferred.includes(s.status)) ?? sorted[0];
    if (!sub) {
      return { found: false, renewal_action: "no_active_sub", note: "No subscription on file." };
    }
    if (!preferred.includes(sub.status)) {
      return {
        found: false,
        subscription_id: sub.id,
        status: sub.status,
        renewal_action: "no_active_sub",
        note: `Subscription is ${sub.status}.`,
      };
    }
    const item = sub.items?.data?.[0];
    const price = item?.price;
    const unit = price?.unit_amount ?? null;
    const currency = (price?.currency ?? "").toLowerCase();
    const interval = price?.recurring?.interval ?? "";
    const base: StripeAudit = {
      found: true,
      subscription_id: sub.id,
      subscription_item_id: item?.id,
      status: sub.status,
      price_id: price?.id,
      unit_amount_pence: unit,
      currency,
      interval,
      current_period_end: sub.current_period_end ?? null,
      renewal_action: "keep_current_price",
    };
    if (currency !== "gbp") {
      return { ...base, renewal_action: "non_gbp", note: `Currency is ${currency.toUpperCase()}, not GBP.` };
    }
    if (interval !== "year") {
      return { ...base, renewal_action: "non_annual", note: `Interval is ${interval}, not annual.` };
    }
    if (unit == null) {
      return { ...base, renewal_action: "audit_error", note: "Price has no unit_amount." };
    }
    if (unit <= RENEWAL_CAP_PENCE) {
      return {
        ...base,
        renewal_action: unit === RENEWAL_CAP_PENCE ? "already_at_cap" : "keep_current_price",
        note:
          unit === RENEWAL_CAP_PENCE
            ? "Already at £479/yr."
            : `Grandfathered at £${(unit / 100).toFixed(2)}/yr — kept as-is.`,
      };
    }
    return {
      ...base,
      renewal_action: "cap_to_479_at_renewal",
      note: `Currently £${(unit / 100).toFixed(2)}/yr — will cap to £479 at next renewal (no immediate charge).`,
    };
  } catch (e) {
    return {
      found: false,
      renewal_action: "audit_error",
      note: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Get-or-create the £479/yr training-provider Stripe Price (cached per-run). */
async function resolveCapPrice(stripe: any, cache: { id?: string }): Promise<string> {
  if (cache.id) return cache.id;
  const existing = await stripe.prices.list({ lookup_keys: [TP_ANNUAL_LOOKUP], limit: 1, active: true });
  if (existing.data.length) {
    cache.id = existing.data[0].id;
    return cache.id!;
  }
  // Fallback — create/rename the Training Provider Membership product with our internal metadata key.
  const productList = await stripe.products.list({ limit: 100 });
  let product =
    productList.data.find((p: any) => p.metadata?.reps_key === "training_provider") ?? null;
  if (product) {
    // Keep the customer-facing name aligned with current branding.
    if (product.name !== "REPs Training Provider Membership") {
      try {
        product = await stripe.products.update(product.id, { name: "REPs Training Provider Membership" });
      } catch {
        // non-fatal — continue with existing product
      }
    }
  } else {
    product = await stripe.products.create({
      name: "REPs Training Provider Membership",
      metadata: { reps_key: "training_provider" },
    });
  }
  const created = await stripe.prices.create({
    product: product.id,
    unit_amount: RENEWAL_CAP_PENCE,
    currency: "gbp",
    recurring: { interval: "year" },
    lookup_key: TP_ANNUAL_LOOKUP,
    transfer_lookup_key: true,
  });
  cache.id = created.id;
  return created.id;
}

/* ------------------------------ server fn ------------------------------ */


export const importTrainingProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const sa = supabaseAdmin as any;
    const stripe = createStripeClient(data.environment) as any;

    const results: ImportRowResult[] = [];
    let created = 0;
    let linked = 0;
    let errors = 0;
    const capPriceCache: { id?: string } = {};

    for (const row of data.rows) {
      const rec: ImportRowResult = {
        email: row.email,
        provider_name: row.provider_name,
        stripe_customer_id: row.stripe_customer_id,
        action: "error",
        detail: "",
      };

      try {
        const website = normaliseUrl(row.website ?? null);
        const existingId = await findAuthUserByEmail(sa, row.email);
        const audit = await auditStripeCustomer(stripe, row.stripe_customer_id);
        rec.stripe_audit = audit;

        // ------ Dry-run branch ------
        if (!data.commit) {
          rec.action = existingId ? "would_link_existing" : "would_create";
          rec.user_id = existingId ?? undefined;
          const authNote = existingId
            ? "Email already registered — Stripe customer would be linked."
            : "New auth user would be invited with a password-set link.";
          rec.detail = audit.note ? `${authNote} ${audit.note}` : authNote;
          results.push(rec);
          continue;
        }


        // ------ Commit branch ------
        let userId = existingId;
        let inviteUrl: string | null = null;

        if (!userId) {
          const redirectTo = `https://repsuk.org/dashboard`;
          const { data: linkData, error: linkErr } = await sa.auth.admin.generateLink({
            type: "invite",
            email: row.email,
            options: {
              redirectTo,
              data: {
                signup_kind: "professional",
                account_type: "training_provider",
                full_name: row.provider_name,
              },
            },
          });
          if (linkErr) throw new Error(linkErr.message);
          inviteUrl = linkData.properties?.action_link ?? null;
          userId = linkData.user?.id ?? null;
          if (!userId) throw new Error("Invite created but no user id was returned.");
        }

        // Seed profiles.full_name
        await sa
          .from("profiles")
          .upsert(
            { id: userId, full_name: row.provider_name } as never,
            { onConflict: "id" },
          );

        // Seed / upgrade professionals row
        const { data: existingPro } = await sa
          .from("professionals")
          .select("id, slug, account_type, website_url")
          .eq("id", userId)
          .maybeSingle();

        let slug: string | null = existingPro?.slug ?? null;
        if (!slug) {
          slug = await uniqueProviderSlug(sa, row.provider_name, userId);
        }

        const proRow: Record<string, unknown> = {
          id: userId,
          account_type: "training_provider",
          slug,
        };
        if (!existingPro) proRow.is_published = false;
        if (website && !existingPro?.website_url) proRow.website_url = website;

        const { error: proErr } = await sa
          .from("professionals")
          .upsert(proRow as never, { onConflict: "id" });
        if (proErr) throw new Error(proErr.message);

        // Upsert subscription: latest row wins, stripe_customer_id linked
        const now = new Date().toISOString();
        const { data: existingSub } = await sa
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSub?.id) {
          const { error: subErr } = await sa
            .from("subscriptions")
            .update({
              tier: "training_provider" as any,
              status: "active" as any,
              stripe_customer_id: row.stripe_customer_id,
              stripe_subscription_id: rec.stripe_audit?.subscription_id ?? null,
              current_period_end: rec.stripe_audit?.current_period_end
                ? new Date(rec.stripe_audit.current_period_end * 1000).toISOString()
                : null,
              billing_period: "annual" as any,
              environment: data.environment,
              canceled_at: null,
              updated_at: now,
            } as never)
            .eq("id", existingSub.id);
          if (subErr) throw new Error(subErr.message);
        } else {
          const { error: subErr } = await sa.from("subscriptions").insert({
            user_id: userId,
            tier: "training_provider",
            status: "active",
            billing_period: "annual",
            stripe_customer_id: row.stripe_customer_id,
            stripe_subscription_id: rec.stripe_audit?.subscription_id ?? null,
            current_period_end: rec.stripe_audit?.current_period_end
              ? new Date(rec.stripe_audit.current_period_end * 1000).toISOString()
              : null,
            environment: data.environment,
            created_at: now,
            updated_at: now,
          } as never);
          if (subErr) throw new Error(subErr.message);
        }

        // ------ Renewal-price cap (Stripe) ------
        if (
          rec.stripe_audit?.renewal_action === "cap_to_479_at_renewal" &&
          rec.stripe_audit.subscription_id &&
          rec.stripe_audit.subscription_item_id
        ) {
          try {
            const capPriceId = await resolveCapPrice(stripe, capPriceCache);
            await stripe.subscriptions.update(rec.stripe_audit.subscription_id, {
              items: [{ id: rec.stripe_audit.subscription_item_id, price: capPriceId }],
              proration_behavior: "none",
              metadata: { reps_renewal_capped: "479_gbp", reps_capped_by: context.userId },
            });
            rec.renewal_applied = true;
          } catch (e) {
            console.error("[importTrainingProviders] price cap failed", row.email, e);
            rec.renewal_applied = false;
            rec.stripe_audit = {
              ...rec.stripe_audit,
              note: `Cap failed: ${e instanceof Error ? e.message : String(e)}`,
            };
          }
        }

        // ------ Activate a fresh £479/yr subscription (Stripe) ------
        // Only fires when the customer has NO active subscription on file AND
        // the admin supplied an anchor timestamp (last-paid + 12mo, or a hard
        // override like SIFA). No charge today: trial_end is set to the anchor,
        // so the first charge lands on that date.
        if (
          rec.stripe_audit?.renewal_action === "no_active_sub" &&
          row.renewal_anchor_ts
        ) {
          try {
            const capPriceId = await resolveCapPrice(stripe, capPriceCache);
            const anchor = row.renewal_anchor_ts;
            const newSub = await stripe.subscriptions.create({
              customer: row.stripe_customer_id,
              items: [{ price: capPriceId }],
              collection_method: "charge_automatically",
              trial_end: anchor,
              payment_behavior: "allow_incomplete",
              metadata: {
                reps_activated_by: context.userId,
                reps_anchor_source: "bulk_import",
              },
            });
            rec.subscription_activated = true;
            rec.activated_subscription_id = newSub.id;
            rec.activated_anchor_ts = anchor;
            const { error: mirrorErr } = await sa
              .from("subscriptions")
              .update({
                status: newSub.status as any,
                stripe_subscription_id: newSub.id,
                current_period_end: new Date(((newSub as any).current_period_end ?? anchor) * 1000).toISOString(),
                billing_period: "annual" as any,
                environment: data.environment,
                updated_at: new Date().toISOString(),
              } as never)
              .eq("user_id", userId)
              .eq("stripe_customer_id", row.stripe_customer_id);
            if (mirrorErr) throw new Error(mirrorErr.message);
          } catch (e) {
            console.error("[importTrainingProviders] activation failed", row.email, e);
            rec.subscription_activated = false;
            rec.stripe_audit = {
              ...rec.stripe_audit,
              note: `Activation failed: ${e instanceof Error ? e.message : String(e)}`,
            };
          }
        }

        // Send announcement email — skipped only when we still have no active
        // sub after the activation attempt (so the provider isn't invited to
        // a portal they can't yet use).
        let messageId: string | undefined;
        const skipEmail =
          rec.stripe_audit?.renewal_action === "no_active_sub" &&
          !rec.subscription_activated;
        if (!skipEmail) {
          try {
            const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
            const sendRes = await sendTransactionalEmailServer({
              templateName: "provider-portal-is-live",
              recipientEmail: row.email,
              idempotencyKey: `provider-portal-live-${userId}`,
              templateData: {
                providerName: row.provider_name,
                passwordSetUrl: inviteUrl ?? undefined,
                alreadyRegistered: !!existingId,
                emailAddress: row.email,
              },
            });
            messageId = (sendRes as { messageId?: string }).messageId;
          } catch (e) {
            // Non-fatal — record it so we can retry manually.
            console.error("[importTrainingProviders] email send failed", row.email, e);
          }
        }


        // Audit log
        await sa.rpc("log_admin_action", {
          _actor_id: context.userId,
          _action: "provider.bulk_import",
          _target_table: "professionals",
          _target_id: userId,
          _before_state: null,
          _after_state: {
            email: row.email,
            provider_name: row.provider_name,
            stripe_customer_id: row.stripe_customer_id,
            slug,
            already_registered: !!existingId,
          },
        });

        const auditSuffix = rec.stripe_audit?.note ? ` ${rec.stripe_audit.note}` : "";
        const emailSuffix = skipEmail ? " Email SKIPPED (no active subscription)." : "";
        const capSuffix = rec.renewal_applied ? " Renewal price capped to £479." : "";
        if (existingId) {
          linked += 1;
          rec.action = "linked_existing";
          rec.detail = `Existing REPs account linked to Stripe customer${skipEmail ? "" : " & announcement sent"}.${auditSuffix}${emailSuffix}${capSuffix}`;
        } else {
          created += 1;
          rec.action = "created";
          rec.detail = `Auth user invited, portal seeded${skipEmail ? "" : ", announcement + password-set link sent"}.${auditSuffix}${emailSuffix}${capSuffix}`;
        }

        rec.user_id = userId ?? undefined;
        rec.slug = slug ?? undefined;
        rec.invite_url = inviteUrl ?? undefined;
        rec.message_id = messageId;
      } catch (e) {
        errors += 1;
        rec.action = "error";
        rec.detail = e instanceof Error ? e.message : String(e);
      }

      results.push(rec);
    }

    const summary: ImportSummary = {
      total: data.rows.length,
      created,
      linked_existing: linked,
      errors,
      dry_run: !data.commit,
    };

    return { summary, results };
  });
