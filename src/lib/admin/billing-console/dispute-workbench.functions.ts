// Dispute Response Workbench — server fns.
//
// Stripe is the source of truth. Every read fetches the live dispute object
// (and its charge / customer / subscription) directly from Stripe so the
// workbench never shows stale lifecycle state. Writes go straight to Stripe
// (`disputes.update`, `disputes.close`); the local `disputes` mirror is
// re-synced afterwards.
//
// v1 scope: text evidence fields only. File evidence (receipts, screenshots)
// can be attached via the Stripe dashboard link until we wire `files.create`.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient } from "@/lib/billing/stripe.server";

type StripeEnv = "live" | "sandbox";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" as never });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const TEXT_FIELDS = [
  "product_description",
  "customer_name",
  "customer_email_address",
  "customer_purchase_ip",
  "billing_address",
  "service_date",
  "cancellation_policy_disclosure",
  "cancellation_rebuttal",
  "refund_policy_disclosure",
  "refund_refusal_explanation",
  "duplicate_charge_explanation",
  "uncategorized_text",
] as const;

export type DisputeEvidenceText = Partial<Record<(typeof TEXT_FIELDS)[number], string>>;

function pickEvidence(input: Record<string, unknown> | null | undefined): DisputeEvidenceText {
  const out: DisputeEvidenceText = {};
  if (!input) return out;
  for (const k of TEXT_FIELDS) {
    const v = input[k];
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

async function loadDisputeRow(disputeId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("disputes")
    .select(
      "id, stripe_dispute_id, stripe_charge_id, stripe_customer_id, stripe_subscription_id, user_id, amount_pence, currency, reason, status, lifecycle_stage, evidence_due_by, opened_at, payload",
    )
    .eq("id", disputeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Dispute not found");
  if (!data.stripe_dispute_id) throw new Error("Dispute is missing Stripe ID");
  return data as {
    id: string;
    stripe_dispute_id: string;
    stripe_charge_id: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    user_id: string | null;
    amount_pence: number | null;
    currency: string | null;
    reason: string | null;
    status: string;
    lifecycle_stage: string;
    evidence_due_by: string | null;
    opened_at: string;
    payload: any;
  };
}

async function fetchStripeDispute(stripeDisputeId: string): Promise<{ env: StripeEnv; dispute: Stripe.Dispute }> {
  // Production data is always live; sandbox kept as a fallback for test fixtures.
  const order: StripeEnv[] = ["live", "sandbox"];
  let lastErr: unknown;
  for (const env of order) {
    try {
      const stripe = createStripeClient(env);
      const dispute = await stripe.disputes.retrieve(stripeDisputeId, {
        expand: ["charge", "charge.payment_intent", "charge.customer"],
      } as any);
      return { env, dispute };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Stripe dispute lookup failed");
}

async function mirrorBack(row: { id: string }, dispute: Stripe.Dispute) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const closedAt =
    dispute.status === "won" || dispute.status === "lost" || dispute.status === "warning_closed"
      ? new Date().toISOString()
      : null;
  await supabaseAdmin
    .from("disputes")
    .update({
      status: dispute.status,
      evidence_due_by: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      payload: dispute as any,
      closed_at: closedAt,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", row.id);
}

async function logAction(
  ctx: { supabase: any; userId: string },
  action: string,
  disputeId: string,
  reason?: string | null,
) {
  try {
    await ctx.supabase.rpc("log_admin_action", {
      _actor_id: ctx.userId,
      _action: action,
      _target_table: "disputes",
      _target_id: disputeId,
      _reason: reason ?? undefined,
    });
  } catch {
    /* best effort */
  }
}

// ---------------------------------------------------------------------------
// Read — workbench snapshot
// ---------------------------------------------------------------------------

export type DisputeWorkbench = {
  id: string;
  stripeDisputeId: string;
  stripeChargeId: string | null;
  status: string;
  lifecycleStage: string;
  reason: string | null;
  amountPence: number;
  currency: string;
  openedAt: string;
  evidenceDueBy: string | null;
  isSubmittable: boolean;
  hasEvidence: boolean;
  evidence: DisputeEvidenceText;
  member: {
    userId: string | null;
    fullName: string | null;
    email: string | null;
    stripeCustomerId: string | null;
    subscriptionId: string | null;
    tier: string | null;
    subscriptionStatus: string | null;
    cancelAtPeriodEnd: boolean | null;
    currentPeriodEnd: string | null;
    createdAt: string | null;
  };
  charge: {
    id: string | null;
    createdAt: string | null;
    amountPence: number | null;
    description: string | null;
    receiptUrl: string | null;
  };
  recentCharges: Array<{ id: string; createdAt: string; amountPence: number; status: string; description: string | null }>;
};

export const getDisputeWorkbench = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ disputeId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<DisputeWorkbench> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const row = await loadDisputeRow(data.disputeId);
    const { env, dispute } = await fetchStripeDispute(row.stripe_dispute_id);

    const charge = (dispute.charge && typeof dispute.charge !== "string" ? dispute.charge : null) as Stripe.Charge | null;
    const customerId =
      row.stripe_customer_id ??
      (charge?.customer && typeof charge.customer === "string"
        ? charge.customer
        : (charge?.customer as Stripe.Customer | null)?.id ?? null);

    // Member profile + live subscription (via subscriptions mirror).
    let member: DisputeWorkbench["member"] = {
      userId: row.user_id,
      fullName: null,
      email: null,
      stripeCustomerId: customerId,
      subscriptionId: row.stripe_subscription_id,
      tier: null,
      subscriptionStatus: null,
      cancelAtPeriodEnd: null,
      currentPeriodEnd: null,
      createdAt: null,
    };

    if (customerId) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, status, cancel_at_period_end, current_period_end, stripe_subscription_id, created_at")
        .eq("stripe_customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub) {
        member.userId = (sub as any).user_id ?? member.userId;
        member.tier = (sub as any).tier ?? null;
        member.subscriptionStatus = (sub as any).status ?? null;
        member.cancelAtPeriodEnd = (sub as any).cancel_at_period_end ?? null;
        member.currentPeriodEnd = (sub as any).current_period_end ?? null;
        member.subscriptionId = (sub as any).stripe_subscription_id ?? member.subscriptionId;
        member.createdAt = (sub as any).created_at ?? null;
      }
    }

    if (member.userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", member.userId)
        .maybeSingle();
      member.fullName = (profile as any)?.full_name ?? member.fullName;
      try {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(member.userId);
        member.email = u.user?.email ?? member.email;
      } catch { /* ignore */ }
    }

    // Fallback to charge billing details.
    if (!member.email && charge?.billing_details?.email) member.email = charge.billing_details.email;
    if (!member.fullName && charge?.billing_details?.name) member.fullName = charge.billing_details.name;

    // Pull last 10 charges for this customer to give the AI / admin context.
    let recentCharges: DisputeWorkbench["recentCharges"] = [];
    if (customerId) {
      try {
        const stripe = createStripeClient(env);
        const list = await stripe.charges.list({ customer: customerId, limit: 10 });
        recentCharges = list.data.map((c) => ({
          id: c.id,
          createdAt: new Date(c.created * 1000).toISOString(),
          amountPence: c.amount,
          status: c.status,
          description: c.description ?? null,
        }));
      } catch { /* best effort */ }
    }

    const evidence = pickEvidence(dispute.evidence as any);
    const hasEvidence = Object.values(evidence).some((v) => v && v.trim().length > 0);
    const isSubmittable =
      dispute.status === "needs_response" || dispute.status === "warning_needs_response";

    return {
      id: row.id,
      stripeDisputeId: row.stripe_dispute_id,
      stripeChargeId: charge?.id ?? row.stripe_charge_id ?? null,
      status: dispute.status,
      lifecycleStage: row.lifecycle_stage,
      reason: dispute.reason ?? row.reason,
      amountPence: dispute.amount,
      currency: dispute.currency ?? row.currency ?? "gbp",
      openedAt: row.opened_at,
      evidenceDueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : row.evidence_due_by,
      isSubmittable,
      hasEvidence,
      evidence,
      member,
      charge: {
        id: charge?.id ?? null,
        createdAt: charge ? new Date(charge.created * 1000).toISOString() : null,
        amountPence: charge?.amount ?? null,
        description: charge?.description ?? null,
        receiptUrl: charge?.receipt_url ?? null,
      },
      recentCharges,
    };
  });

// ---------------------------------------------------------------------------
// AI Draft — generates suggested evidence text fields
// ---------------------------------------------------------------------------

const AI_SYSTEM = `You are a senior payments operations specialist at REPs UK (repsuk.org), a fitness professional membership platform.

You are drafting a Stripe dispute evidence response on behalf of REPs. Tone: factual, polite, professional, never combative. Use British English. Cite specific facts (dates, amounts, plan tier, account history) — never invent details.

Output strict JSON with these keys (omit any you can't justify with the supplied facts):
- product_description: 1-2 sentences describing the REPs membership the customer purchased.
- cancellation_policy_disclosure: 1-2 sentences on REPs' subscription terms and that the member could cancel anytime from /account.
- cancellation_rebuttal: 2-4 sentences, ONLY if reason is "subscription_canceled". Explain whether the member ever requested cancellation, when the charge was authorised, and that service was delivered.
- refund_policy_disclosure: 1-2 sentences on REPs' refund policy if relevant.
- refund_refusal_explanation: 2-4 sentences, only if the customer was refused a refund.
- uncategorized_text: a 4-8 sentence narrative summary tying the timeline together (signup → charges → service used → dispute filed).

Do not include the JSON in markdown fences. Return JSON only.`;

export const aiDraftDisputeEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ disputeId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<DisputeEvidenceText> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    // Re-use the workbench resolver to get full context.
    const wb = await (getDisputeWorkbench as any).handler({ context, data });

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const facts = {
      dispute: {
        reason: wb.reason,
        amount: `${(wb.amountPence / 100).toFixed(2)} ${wb.currency.toUpperCase()}`,
        opened_at: wb.openedAt,
        evidence_due_by: wb.evidenceDueBy,
        status: wb.status,
      },
      member: {
        name: wb.member.fullName,
        email: wb.member.email,
        tier: wb.member.tier,
        subscription_status: wb.member.subscriptionStatus,
        cancel_at_period_end: wb.member.cancelAtPeriodEnd,
        current_period_end: wb.member.currentPeriodEnd,
        first_seen: wb.member.createdAt,
      },
      disputed_charge: wb.charge,
      recent_charges: wb.recentCharges.map((c: any) => ({
        date: c.createdAt,
        amount: `${(c.amountPence / 100).toFixed(2)} ${wb.currency.toUpperCase()}`,
        status: c.status,
      })),
      product: "REPs membership (fitness professional directory + verification + Shop Front profile on repsuk.org).",
      cancellation_policy:
        "Members can cancel anytime from /account → Membership; cancellation takes effect at the end of the current billing period. No partial refunds for unused time.",
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: AI_SYSTEM },
          { role: "user", content: `Facts:\n${JSON.stringify(facts, null, 2)}` },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit hit. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Top up to continue.");
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Strip code fences if the model ignored response_format.
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }
    }

    // Auto-fill the static identity fields when we have them.
    if (wb.member.fullName && !parsed.customer_name) parsed.customer_name = wb.member.fullName;
    if (wb.member.email && !parsed.customer_email_address) parsed.customer_email_address = wb.member.email;

    return pickEvidence(parsed);
  });

// ---------------------------------------------------------------------------
// Write — save draft / submit / accept
// ---------------------------------------------------------------------------

const evidenceShape = z.object(
  Object.fromEntries(TEXT_FIELDS.map((k) => [k, z.string().max(20_000).optional()])) as Record<
    (typeof TEXT_FIELDS)[number],
    z.ZodOptional<z.ZodString>
  >,
);

async function updateStripeDispute(
  stripeDisputeId: string,
  evidence: DisputeEvidenceText,
  submit: boolean,
): Promise<{ env: StripeEnv; dispute: Stripe.Dispute }> {
  const { env } = await fetchStripeDispute(stripeDisputeId);
  const stripe = createStripeClient(env);
  // Strip empty strings — Stripe rejects them on `submit: true`.
  const cleanEvidence: Record<string, string> = {};
  for (const [k, v] of Object.entries(evidence)) {
    if (typeof v === "string" && v.trim().length > 0) cleanEvidence[k] = v.trim();
  }
  const dispute = await stripe.disputes.update(stripeDisputeId, {
    evidence: cleanEvidence as any,
    submit,
  } as any);
  return { env, dispute };
}

export const saveDisputeEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ disputeId: z.string().uuid(), evidence: evidenceShape }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const row = await loadDisputeRow(data.disputeId);
    const { dispute } = await updateStripeDispute(row.stripe_dispute_id, data.evidence, false);
    await mirrorBack(row, dispute);
    await logAction({ supabase: supabaseAdmin, userId: context.userId }, "dispute.evidence_saved", row.id);
    return { ok: true as const, status: dispute.status };
  });

export const submitDisputeEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ disputeId: z.string().uuid(), evidence: evidenceShape }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const row = await loadDisputeRow(data.disputeId);
    // Must have at least one piece of evidence before submitting.
    const has = Object.values(data.evidence).some((v) => typeof v === "string" && v.trim().length > 0);
    if (!has) throw new Error("Add some evidence text before submitting.");
    const { dispute } = await updateStripeDispute(row.stripe_dispute_id, data.evidence, true);
    await mirrorBack(row, dispute);
    await logAction({ supabase: supabaseAdmin, userId: context.userId }, "dispute.evidence_submitted", row.id);
    return { ok: true as const, status: dispute.status };
  });

export const acceptDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ disputeId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const row = await loadDisputeRow(data.disputeId);
    const { env } = await fetchStripeDispute(row.stripe_dispute_id);
    const stripe = createStripeClient(env);
    const dispute = await stripe.disputes.close(row.stripe_dispute_id);
    await mirrorBack(row, dispute);
    await logAction(
      { supabase: supabaseAdmin, userId: context.userId },
      "dispute.accepted",
      row.id,
      data.reason ?? "Accepted via workbench",
    );
    return { ok: true as const, status: dispute.status };
  });
