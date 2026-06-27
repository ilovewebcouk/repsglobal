// Churn recovery lifecycle — server functions.
//
// PUBLIC server fns (no auth) accept a single-use token and act on behalf
// of the user identified by the token. Tokens are sha-256 hashed in the
// DB; the plaintext token never round-trips.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTransactionalEmailServer } from "@/lib/email/send.server";

type TokenPurpose = "card_needed" | "payment_failed" | "reactivate";

function generateTokenPair(): { plain: string; hash: Promise<string> } {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const plain = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hash = sha256Hex(plain);
  return { plain, hash };
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function siteOrigin(): string {
  return process.env.PUBLIC_SITE_URL ?? "https://repsuk.org";
}

// ---------------------------------------------------------------
// PUBLIC: peek token (no auth) — returns minimal info to render the page.
// ---------------------------------------------------------------
export const peekRenewalToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(32).max(128) }).parse(d))
  .handler(async ({ data }): Promise<
    | { ok: true; purpose: TokenPurpose; tier: string; expires_at: string; pro_name: string | null }
    | { ok: false; reason: "invalid" | "expired" | "consumed" }
  > => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await sha256Hex(data.token);
    const { data: row } = await supabaseAdmin.rpc("peek_renewal_token" as never, { _token_hash: hash } as never);
    if (!row || (Array.isArray(row) && row.length === 0)) {
      return { ok: false, reason: "invalid" };
    }
    const r = (Array.isArray(row) ? row[0] : row) as {
      user_id: string; purpose: TokenPurpose; intended_tier: string; expires_at: string;
    };
    // Best-effort name lookup
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("full_name").eq("id", r.user_id).maybeSingle();
    return {
      ok: true,
      purpose: r.purpose,
      tier: r.intended_tier,
      expires_at: r.expires_at,
      pro_name: (profile as { full_name?: string | null } | null)?.full_name ?? null,
    };
  });

// ---------------------------------------------------------------
// PUBLIC: start renewal checkout — consumes token + creates Stripe session.
// ---------------------------------------------------------------
export const startRenewalCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      token: z.string().min(32).max(128),
      environment: z.enum(["sandbox", "live"]).default("live"),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<{ url: string } | { error: string }> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const hash = await sha256Hex(data.token);

      // Consume atomically (single-use)
      const { data: tokenRow, error: consumeErr } = await supabaseAdmin
        .rpc("consume_renewal_token" as never, { _token_hash: hash } as never);
      if (consumeErr) return { error: consumeErr.message };
      const row = (Array.isArray(tokenRow) ? tokenRow[0] : tokenRow) as {
        user_id: string; intended_tier: string; purpose: TokenPurpose;
      } | null;
      if (!row) return { error: "This renewal link has expired or already been used." };

      // Look up email for Stripe customer
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      const email = authUser?.user?.email ?? null;

      const { createStripeClient, resolvePriceByLookupKey, getStripeErrorMessage } =
        await import("@/lib/billing/stripe.server");
      const { getOrCreateCustomer } = await import("@/lib/billing/customer.server");
      const stripe = createStripeClient(data.environment);

      const customerId = await getOrCreateCustomer({
        userId: row.user_id, email, environment: data.environment,
      });

      const lookupKey = row.intended_tier === "pro" ? "pro_monthly" : "verified_annual";
      const stripePrice = await resolvePriceByLookupKey(stripe, lookupKey);
      const origin = siteOrigin();

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        success_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/renew/cancelled`,
        payment_method_collection: "always",
        allow_promotion_codes: true,
        consent_collection: { terms_of_service: "required" },
        custom_text: {
          terms_of_service_acceptance: {
            message: `I agree to the [REPs Terms](${origin}/terms) and [Privacy Policy](${origin}/privacy).`,
          },
        },
        subscription_data: {
          metadata: {
            reps_user_id: row.user_id,
            tier: row.intended_tier,
            renewal_purpose: row.purpose,
            environment: data.environment,
          },
        },
        metadata: {
          reps_user_id: row.user_id,
          tier: row.intended_tier,
          renewal_purpose: row.purpose,
          environment: data.environment,
        },
      });

      // Mark lifecycle as recovered (final confirmation arrives via webhook).
      await supabaseAdmin.rpc("enter_churn_stage" as never, {
        _user_id: row.user_id,
        _stage: "recovered",
        _reason: "User opened renewal checkout",
        _source_event: `renewal_token_${row.purpose}`,
        _metadata: { checkout_session_id: session.id },
      } as never);

      if (!session.url) return { error: "Stripe did not return a checkout URL" };
      return { url: session.url };
    } catch (err) {
      const { getStripeErrorMessage } = await import("@/lib/billing/stripe.server");
      return { error: getStripeErrorMessage(err) };
    }
  });

// ---------------------------------------------------------------
// INTERNAL: mint a renewal token + send email (called by cron/webhook)
// ---------------------------------------------------------------
export async function mintAndEmailRenewalToken(opts: {
  userId: string;
  email: string;
  purpose: TokenPurpose;
  templateName: "renewal-card-needed" | "renewal-payment-failed" | "winback-lapsed";
  templateData: Record<string, unknown>;
  intendedTier?: string;
  ttlDays?: number;
}): Promise<{ messageId?: string; suppressed?: boolean }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const plain = generateTokenPlain();
  const hash = await sha256Hex(plain);
  await supabaseAdmin.rpc("mint_renewal_token" as never, {
    _user_id: opts.userId,
    _token_hash: hash,
    _purpose: opts.purpose,
    _intended_tier: opts.intendedTier ?? "verified",
    _ttl_days: opts.ttlDays ?? 30,
    _metadata: {},
  } as never);

  const origin = siteOrigin();
  const renewUrl = `${origin}/renew/${plain}`;
  const result = await sendTransactionalEmailServer({
    templateName: opts.templateName,
    recipientEmail: opts.email,
    idempotencyKey: `${opts.purpose}-${opts.userId}-${Date.now()}`,
    templateData: { ...opts.templateData, renewUrl },
  });

  await supabaseAdmin.rpc("record_churn_nudge" as never, { _user_id: opts.userId } as never);

  if (!result.success) return { suppressed: true };
  return { messageId: (result as { messageId: string }).messageId };
}

function generateTokenPlain(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------
// ADMIN: list churn lifecycle rows
// ---------------------------------------------------------------
export const listChurnLifecycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      stage: z.enum(["active", "at_risk", "grace", "lapsed", "recovered", "dormant"]).optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" } as never);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("churn_lifecycle")
      .select("id, user_id, stage, reason, source_event, entered_at, last_nudge_at, nudge_count, metadata")
      .order("entered_at", { ascending: false })
      .limit(data.limit);
    if (data.stage) q = q.eq("stage", data.stage);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.user_id);
    let profilesMap = new Map<string, { full_name: string | null; email?: string | null }>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles").select("id, full_name").in("id", ids);
      profilesMap = new Map(((profs ?? []) as Array<{ id: string; full_name: string | null }>)
        .map((p) => [p.id, { full_name: p.full_name }]));
    }

    return (rows ?? []).map((r) => ({
      ...r,
      pro_name: profilesMap.get(r.user_id)?.full_name ?? null,
    }));
  });

export const churnLifecycleKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" } as never);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("churn_lifecycle")
      .select("stage");
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {
      active: 0, at_risk: 0, grace: 0, lapsed: 0, recovered: 0, dormant: 0,
    };
    for (const r of (data ?? []) as Array<{ stage: string }>) {
      counts[r.stage] = (counts[r.stage] ?? 0) + 1;
    }
    return counts;
  });
