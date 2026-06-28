// BD setup-link + reactivation rails — Workstreams 2 & 3 of the rail-swap plan.
//
// Workstream 2: 27 BD members have no Stripe customer at all. We email them a
//   token-gated link to /billing/setup/<token>, they add a card via Stripe
//   Checkout (mode=subscription), the webhook upserts the sub + stamps
//   legacy_stripe_link as converted.
//
// Workstream 3: same plumbing, different copy, used for the lapsed/awaiting
//   cohort. Stripe trial_end is set to now+7d so they start fresh.
//
// Both use sendViaMailgun + email_send_log (same rail as the relaunch
// broadcast) and pace at 100ms to stay under the Mailgun probation cap.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, resolvePriceByLookupKey, type StripeEnv } from "./stripe.server";
import type Stripe from "stripe";

type EmailKind = "setup" | "reactivate";

const CORE_ANNUAL_LOOKUP = "verified_annual";
const SETUP_BASE = "https://repsuk.org/billing/setup";

interface CohortRow {
  bd_member_id: number;
  email: string;
  stripe_customer_id: string | null;
  next_due_at: string | null;
}

/** Returns the rows we'd email per workstream. */
export async function getSetupLinkCohorts(): Promise<{
  setup: CohortRow[];
  reactivate: CohortRow[];
  unactionable: CohortRow[];
}> {
  const { data, error } = await supabaseAdmin
    .from("legacy_stripe_link")
    .select("bd_member_id,email,stripe_customer_id,next_due_at,migration_status,is_lifetime,converted_at,stripe_subscription_id")
    .is("converted_at", null)
    .is("stripe_subscription_id", null)
    .eq("is_lifetime", false)
    .not("migration_status", "in", "(renewed_to_verified,converted_to_subscription,skipped)");
  if (error) throw new Error(error.message);

  const now = Date.now();
  const setup: CohortRow[] = [];
  const reactivate: CohortRow[] = [];
  const unactionable: CohortRow[] = [];
  for (const row of (data ?? []) as CohortRow[] & { migration_status: string }[]) {
    const cohortRow: CohortRow = {
      bd_member_id: Number(row.bd_member_id),
      email: row.email,
      stripe_customer_id: row.stripe_customer_id,
      next_due_at: row.next_due_at,
    };
    const lapsedDays = row.next_due_at
      ? (now - new Date(row.next_due_at).getTime()) / 86_400_000
      : null;
    if (!row.stripe_customer_id) {
      setup.push(cohortRow);
    } else if (lapsedDays !== null && lapsedDays > 30) {
      reactivate.push(cohortRow);
    } else if (row.migration_status === "awaiting_payment_method") {
      reactivate.push(cohortRow);
    } else {
      unactionable.push(cohortRow);
    }
  }
  return { setup, reactivate, unactionable };
}

/** Mint or reuse a billing_setup_token for a BD row. */
async function mintToken(args: { bdMemberId: number; email: string; kind: EmailKind; targetRenewalAt: string | null }) {
  // Reuse a fresh live token if one already exists.
  const { data: existing } = await supabaseAdmin
    .from("billing_setup_tokens")
    .select("token,expires_at,consumed_at")
    .eq("bd_member_id", args.bdMemberId)
    .eq("kind", args.kind)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.token;

  const token = cryptoRandomToken(40);
  const { error } = await supabaseAdmin.from("billing_setup_tokens").insert({
    bd_member_id: args.bdMemberId,
    email: args.email,
    kind: args.kind,
    token,
    target_renewal_at: args.targetRenewalAt,
    expires_at: new Date(Date.now() + 60 * 86_400_000).toISOString(),
  });
  if (error) throw new Error(error.message);
  return token;
}

function cryptoRandomToken(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

interface BatchOpts {
  dryRun: boolean;
  limit: number;
  environment: StripeEnv;
  kind: EmailKind;
}

export interface BatchOutcome {
  bd_member_id: number;
  email: string;
  status: "sent" | "skipped" | "error";
  reason?: string;
  token?: string;
}

export interface BatchSummary {
  examined: number;
  sent: number;
  skipped: number;
  errors: number;
  outcomes: BatchOutcome[];
}

export async function runSetupLinkBatch(opts: BatchOpts): Promise<BatchSummary> {
  const cohorts = await getSetupLinkCohorts();
  const pool = opts.kind === "setup" ? cohorts.setup : cohorts.reactivate;
  const slice = pool.slice(0, Math.max(1, Math.min(opts.limit, 100)));

  const summary: BatchSummary = { examined: slice.length, sent: 0, skipped: 0, errors: 0, outcomes: [] };

  // Lazy-load render / mailgun only when we actually send.
  let render: typeof import("@react-email/components").render | undefined;
  let TEMPLATES: typeof import("@/lib/email-templates/registry").TEMPLATES | undefined;
  let sendViaMailgun: typeof import("@/lib/email/mailgun.server").sendViaMailgun | undefined;
  let React: typeof import("react") | undefined;
  if (!opts.dryRun) {
    React = await import("react");
    ({ render } = await import("@react-email/components"));
    ({ TEMPLATES } = await import("@/lib/email-templates/registry"));
    ({ sendViaMailgun } = await import("@/lib/email/mailgun.server"));
  }

  const templateName = opts.kind === "setup" ? "legacy-setup-link" : "legacy-reactivation";

  for (const row of slice) {
    try {
      const token = await mintToken({
        bdMemberId: row.bd_member_id,
        email: row.email,
        kind: opts.kind,
        targetRenewalAt: row.next_due_at,
      });
      const setupUrl = `${SETUP_BASE}/${token}`;

      if (opts.dryRun) {
        summary.sent++;
        summary.outcomes.push({ bd_member_id: row.bd_member_id, email: row.email, status: "sent", token, reason: "dry_run" });
      } else {
        const tmpl = TEMPLATES![templateName];
        if (!tmpl) throw new Error(`template ${templateName} missing`);
        const renewalDate = row.next_due_at
          ? new Date(row.next_due_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          : "your original renewal date";
        const proName = row.email.split("@")[0];
        const props = opts.kind === "setup"
          ? { proName, setupUrl, amount: "£99", previousAmount: "£34", renewalDate }
          : { proName, setupUrl, amount: "£99" };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = React!.createElement(tmpl.component as any, props);
        const html = await render!(element);
        const text = await render!(element, { plainText: true });
        const subject = typeof tmpl.subject === "function" ? tmpl.subject(props as Record<string, unknown>) : tmpl.subject;

        const result = await sendViaMailgun!({
          to: row.email,
          subject,
          html,
          text,
          templateName,
          idempotencyKey: `bd-${opts.kind}-${row.bd_member_id}`,
        });
        if (result.ok) {
          summary.sent++;
          summary.outcomes.push({ bd_member_id: row.bd_member_id, email: row.email, status: "sent", token });
          // Mark legacy row so it doesn't get re-emailed.
          await supabaseAdmin
            .from("legacy_stripe_link")
            .update({
              migration_status: opts.kind === "setup" ? "awaiting_payment_method" : "awaiting_payment_method",
              migration_kind: opts.kind === "setup" ? "setup_link_sent" : "reactivation_sent",
            })
            .eq("bd_member_id", row.bd_member_id);
        } else {
          summary.errors++;
          summary.outcomes.push({ bd_member_id: row.bd_member_id, email: row.email, status: "error", reason: result.error });
        }
        // 100ms pacing to stay under Mailgun probation cap (100/hr).
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (e) {
      summary.errors++;
      summary.outcomes.push({
        bd_member_id: row.bd_member_id,
        email: row.email,
        status: "error",
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }
  // unused vars guard
  void opts.environment;
  return summary;
}

// ---------- Public token route helpers ----------

export interface TokenPeek {
  ok: boolean;
  reason?: string;
  proName?: string;
  amount?: string;
  renewalDate?: string;
  kind?: EmailKind;
  consumed?: boolean;
}

export async function peekBdSetupToken(token: string): Promise<TokenPeek> {
  const { data, error } = await supabaseAdmin
    .from("billing_setup_tokens")
    .select("bd_member_id,email,kind,target_renewal_at,consumed_at,expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error) return { ok: false, reason: "lookup_failed" };
  if (!data) return { ok: false, reason: "invalid" };
  if (new Date(data.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (data.consumed_at) return { ok: true, consumed: true, kind: data.kind as EmailKind };

  const renewalDate = data.target_renewal_at
    ? new Date(data.target_renewal_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  return {
    ok: true,
    proName: data.email.split("@")[0],
    amount: "£99",
    renewalDate: renewalDate ?? undefined,
    kind: data.kind as EmailKind,
    consumed: false,
  };
}

export async function startBdSetupCheckout(args: { token: string; environment: StripeEnv; origin: string }) {
  const { data: tok, error } = await supabaseAdmin
    .from("billing_setup_tokens")
    .select("id,bd_member_id,email,kind,target_renewal_at,consumed_at,expires_at")
    .eq("token", args.token)
    .maybeSingle();
  if (error) return { error: "lookup_failed" as const };
  if (!tok) return { error: "invalid" as const };
  if (tok.consumed_at) return { error: "consumed" as const };
  if (new Date(tok.expires_at).getTime() < Date.now()) return { error: "expired" as const };

  const stripe = createStripeClient(args.environment);
  const price = await resolvePriceByLookupKey(stripe, CORE_ANNUAL_LOOKUP);

  // For "setup" cohort (no stripe customer yet) we let Checkout create one
  // via customer_email. For "reactivate" we look up the existing customer.
  let customerId: string | undefined;
  if (tok.kind === "reactivate") {
    const { data: legacy } = await supabaseAdmin
      .from("legacy_stripe_link")
      .select("stripe_customer_id")
      .eq("bd_member_id", tok.bd_member_id!)
      .maybeSingle();
    customerId = legacy?.stripe_customer_id ?? undefined;
  }

  // Trial end: setup cohort anchors to original BD renewal date if in the
  // future, otherwise starts billing today. Reactivate cohort gets a 7-day
  // grace runway from today.
  const now = Math.floor(Date.now() / 1000);
  let trialEnd: number | undefined;
  if (tok.kind === "setup" && tok.target_renewal_at) {
    const t = Math.floor(new Date(tok.target_renewal_at).getTime() / 1000);
    if (t > now + 86400) trialEnd = t;
  } else if (tok.kind === "reactivate") {
    trialEnd = now + 7 * 86400;
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${args.origin}/billing/setup/${args.token}?status=done&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${args.origin}/billing/setup/${args.token}?status=cancelled`,
      ...(customerId ? { customer: customerId } : { customer_email: tok.email }),
      subscription_data: {
        ...(trialEnd ? { trial_end: trialEnd } : {}),
        metadata: {
          migrated_from: "bd_legacy",
          bd_member_id: String(tok.bd_member_id),
          bd_setup_token_id: tok.id,
          bd_setup_kind: tok.kind,
        },
      },
      metadata: {
        kind: "bd_setup_link",
        bd_member_id: String(tok.bd_member_id),
        bd_setup_token_id: tok.id,
        bd_setup_kind: tok.kind,
      },
    } satisfies Stripe.Checkout.SessionCreateParams,
    { idempotencyKey: `bd-setup-checkout-${args.token}` },
  );

  return { url: session.url! };
}

/** Mark a token consumed once we know a subscription was created. */
export async function markBdSetupTokenConsumed(args: { token?: string; tokenId?: string; subscriptionId: string }) {
  const query = args.tokenId
    ? supabaseAdmin.from("billing_setup_tokens").update({
        consumed_at: new Date().toISOString(),
        consumed_stripe_subscription_id: args.subscriptionId,
      }).eq("id", args.tokenId)
    : supabaseAdmin.from("billing_setup_tokens").update({
        consumed_at: new Date().toISOString(),
        consumed_stripe_subscription_id: args.subscriptionId,
      }).eq("token", args.token!);
  const { error } = await query;
  if (error) throw new Error(error.message);
}
