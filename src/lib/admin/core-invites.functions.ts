// Admin: manually onboard trainers onto Core (£34/yr) whose Stripe customer
// already exists. Admin drafts an invite, verifies the Stripe customer,
// clicks Send. Trainer receives an email → /activate/$token → set password
// → Stripe Checkout (mode=setup) → webhook creates the trialing Core
// subscription anchored on their last-payment anniversary and publishes
// their profile.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/;
const CUSTOMER_RE = /^cus_[A-Za-z0-9]+$/;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateClientRef(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return "aci_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function stripeEnv(): "sandbox" | "live" {
  return (process.env.STRIPE_ENV ?? "live") === "sandbox" ? "sandbox" : "live";
}

// ─────────────────────────────────────────────────────────────
// Verify a Stripe customer ID before it's written to the DB.
// Returns a small confirmation card the admin must eyeball.
// ─────────────────────────────────────────────────────────────
export const verifyStripeCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { stripe_customer_id: string }) => {
    const id = (d.stripe_customer_id ?? "").trim();
    if (!CUSTOMER_RE.test(id)) throw new Error("Stripe customer id must look like cus_XXXXXX.");
    return { stripe_customer_id: id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(stripeEnv());
    const customer = await stripe.customers.retrieve(data.stripe_customer_id, {
      expand: ["invoice_settings.default_payment_method"],
    });
    if (customer.deleted) throw new Error("This Stripe customer was deleted.");
    const c = customer as import("stripe").Stripe.Customer;

    const dpm = c.invoice_settings?.default_payment_method;
    const hasDefaultPm = typeof dpm === "object" && dpm && "id" in dpm;

    // Any existing active/trialing sub is a red flag — we'd double-bill.
    const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 5 });
    const activeSub = subs.data.find((s) =>
      ["active", "trialing", "past_due", "unpaid"].includes(s.status),
    );

    return {
      id: c.id,
      email: c.email ?? null,
      name: c.name ?? null,
      created: c.created,
      currency: c.currency ?? null,
      has_default_payment_method: hasDefaultPm,
      has_active_subscription: !!activeSub,
      active_subscription_id: activeSub?.id ?? null,
      livemode: c.livemode,
    };
  });

// ─────────────────────────────────────────────────────────────
// Create a draft invite. Does NOT send the email.
// ─────────────────────────────────────────────────────────────
export const createCoreInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      full_name: string;
      email: string;
      slug: string;
      stripe_customer_id: string;
      last_paid_at: string; // ISO
    }) => {
      const full_name = (d.full_name ?? "").trim();
      const email = (d.email ?? "").trim().toLowerCase();
      const slug = (d.slug ?? "").trim().toLowerCase();
      const stripe_customer_id = (d.stripe_customer_id ?? "").trim();
      const last_paid_at = (d.last_paid_at ?? "").trim();
      if (full_name.length < 2) throw new Error("Full name is required.");
      if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email.");
      if (!SLUG_RE.test(slug)) throw new Error("Slug must be lowercase letters, numbers, or dashes.");
      if (!CUSTOMER_RE.test(stripe_customer_id)) throw new Error("Stripe customer id must look like cus_XXXXXX.");
      const parsed = new Date(last_paid_at);
      if (Number.isNaN(parsed.getTime())) throw new Error("Last payment date is invalid.");
      return { full_name, email, slug, stripe_customer_id, last_paid_at: parsed.toISOString() };
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(stripeEnv());

    // Re-verify the customer (never trust the earlier client hop).
    const customer = await stripe.customers.retrieve(data.stripe_customer_id);
    if (customer.deleted) throw new Error("This Stripe customer was deleted.");

    // Anniversary = last_paid_at + 1 year. Must be in the future — otherwise
    // Stripe would try to charge immediately.
    const anniversary = new Date(data.last_paid_at);
    anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);
    if (anniversary.getTime() <= Date.now()) {
      throw new Error(
        "Anniversary (last payment + 1 year) is in the past. Pick a next-anniversary date.",
      );
    }

    // Slug conflict?
    const { data: slugRow } = await supabaseAdmin
      .from("professionals").select("id").eq("slug", data.slug).maybeSingle();
    if (slugRow) throw new Error(`Slug "${data.slug}" is already taken.`);

    // Dedup: an open (unconsumed, unrevoked, unexpired) invite for the same email.
    const { data: openInvite } = await supabaseAdmin
      .from("billing_setup_tokens")
      .select("id, token")
      .eq("email", data.email)
      .eq("kind", "admin_core_invite")
      .is("consumed_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (openInvite) {
      return { alreadyExists: true, id: openInvite.id, token: openInvite.token };
    }

    // Create the auth user (unconfirmed — they'll confirm by setting a password
    // on the activate page). If it already exists, reuse it.
    let userId: string | null = null;
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: false,
      user_metadata: {
        full_name: data.full_name,
        signup_kind: "admin_core_invite",
      },
    });
    if (createErr) {
      // Fall back to lookup by email.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === data.email);
      if (!existing) throw new Error(createErr.message);
      userId = existing.id;
    } else {
      userId = created.user?.id ?? null;
    }
    if (!userId) throw new Error("Could not create or resolve auth user.");

    // profiles row (safe to upsert).
    await supabaseAdmin.from("profiles").upsert(
      { id: userId, full_name: data.full_name } as never,
      { onConflict: "id" } as never,
    );

    // Hidden professional row.
    const { error: profErr } = await supabaseAdmin.from("professionals").upsert(
      {
        id: userId,
        slug: data.slug,
        is_published: false,
        admin_seeded_public: false,
      } as never,
      { onConflict: "id" } as never,
    );
    if (profErr) throw profErr;

    // Backfill Stripe customer metadata so the standard resolver ladder finds
    // this user on future events without needing our token.
    try {
      await stripe.customers.update(data.stripe_customer_id, {
        metadata: { reps_user_id: userId },
      });
    } catch {
      /* best-effort */
    }

    const token = generateToken();
    const client_reference = generateClientRef();
    const { data: row, error: tokErr } = await supabaseAdmin
      .from("billing_setup_tokens")
      .insert({
        email: data.email,
        kind: "admin_core_invite",
        token,
        target_renewal_at: anniversary.toISOString(),
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: userId,
        professional_id: userId,
        stripe_customer_id: data.stripe_customer_id,
        target_tier: "verified",
        client_reference,
      } as never)
      .select("id, token")
      .single();
    if (tokErr) throw tokErr;

    return { alreadyExists: false, id: (row as any).id, token: (row as any).token };
  });

// ─────────────────────────────────────────────────────────────
// Send (or resend) the invite email.
// ─────────────────────────────────────────────────────────────
async function sendInviteEmail(tokenId: string, opts: { force?: boolean } = {}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");

  const { data: token, error } = await supabaseAdmin
    .from("billing_setup_tokens")
    .select(
      "id, email, token, sent_at, reminders_sent, target_renewal_at, professional_id, revoked_at, consumed_at, kind",
    )
    .eq("id", tokenId)
    .maybeSingle();
  if (error) throw error;
  if (!token) throw new Error("Invite not found.");
  if ((token as any).kind !== "admin_core_invite") throw new Error("Wrong invite kind.");
  if ((token as any).consumed_at) throw new Error("This invite has already been claimed.");
  if ((token as any).revoked_at) throw new Error("This invite has been revoked.");

  if (!opts.force && (token as any).sent_at) {
    const sentAt = new Date((token as any).sent_at as string).getTime();
    if (Date.now() - sentAt < 24 * 60 * 60 * 1000) {
      throw new Error("Already sent in the last 24h. Use Resend if you really want to send again.");
    }
  }

  // Get trainer name.
  let fullName: string | null = null;
  if ((token as any).professional_id) {
    const { data: prof } = await supabaseAdmin
      .from("profiles").select("full_name").eq("id", (token as any).professional_id).maybeSingle();
    fullName = prof?.full_name ?? null;
  }

  const baseUrl = (process.env.PUBLIC_SITE_URL ?? "https://repsuk.org").replace(/\/$/, "");
  const activateUrl = `${baseUrl}/activate/${(token as any).token}`;

  const anniversary = new Date((token as any).target_renewal_at as string);
  const anniversaryLabel = anniversary.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  await sendTransactionalEmailServer({
    templateName: "core-manual-invite",
    recipientEmail: (token as any).email as string,
    idempotencyKey: `core-invite:${tokenId}:${opts.force ? Date.now() : "first"}`,
    templateData: {
      fullName,
      activateUrl,
      anniversaryLabel,
      priceLabel: "£34",
    },
  });

  const reminders = ((token as any).reminders_sent as unknown[]) ?? [];
  await supabaseAdmin
    .from("billing_setup_tokens")
    .update({
      sent_at: (token as any).sent_at ?? new Date().toISOString(),
      reminders_sent: opts.force
        ? [...reminders, { at: new Date().toISOString() }]
        : reminders,
    } as never)
    .eq("id", tokenId);
}

export const sendCoreInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d.id) throw new Error("Invite id required.");
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await sendInviteEmail(data.id, { force: false });
    return { ok: true };
  });

export const resendCoreInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d.id) throw new Error("Invite id required.");
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await sendInviteEmail(data.id, { force: true });
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────
// Revoke — soft delete. Leaves the auth user & professional row in place
// (admin can clean those up separately if needed).
// ─────────────────────────────────────────────────────────────
export const revokeCoreInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d.id) throw new Error("Invite id required.");
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("billing_setup_tokens")
      .update({ revoked_at: new Date().toISOString() } as never)
      .eq("id", data.id)
      .is("consumed_at", null);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────
// List — admin table feed.
// ─────────────────────────────────────────────────────────────
export const listCoreInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("billing_setup_tokens")
      .select(
        "id, email, target_renewal_at, sent_at, consumed_at, revoked_at, expires_at, professional_id, stripe_customer_id, created_at, consumed_stripe_subscription_id",
      )
      .eq("kind", "admin_core_invite")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const rows = (data ?? []) as any[];
    const profIds = Array.from(new Set(rows.map((r) => r.professional_id).filter(Boolean)));
    const profileMap = new Map<string, { full_name: string | null; slug: string | null }>();
    if (profIds.length) {
      const [{ data: profs }, { data: pros }] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name").in("id", profIds as string[]),
        supabaseAdmin.from("professionals").select("id, slug, is_published").in("id", profIds as string[]),
      ]);
      for (const p of (profs ?? []) as any[]) {
        profileMap.set(p.id, { full_name: p.full_name ?? null, slug: null });
      }
      for (const p of (pros ?? []) as any[]) {
        const existing = profileMap.get(p.id) ?? { full_name: null, slug: null };
        existing.slug = p.slug ?? null;
        profileMap.set(p.id, existing);
      }
    }

    return rows.map((r) => {
      const now = Date.now();
      let status: "draft" | "sent" | "claimed" | "revoked" | "expired";
      if (r.revoked_at) status = "revoked";
      else if (r.consumed_at) status = "claimed";
      else if (new Date(r.expires_at as string).getTime() < now) status = "expired";
      else if (r.sent_at) status = "sent";
      else status = "draft";
      const prof = r.professional_id ? profileMap.get(r.professional_id) : undefined;
      return {
        id: r.id,
        email: r.email,
        full_name: prof?.full_name ?? null,
        slug: prof?.slug ?? null,
        stripe_customer_id: r.stripe_customer_id,
        target_renewal_at: r.target_renewal_at,
        sent_at: r.sent_at,
        consumed_at: r.consumed_at,
        created_at: r.created_at,
        status,
      };
    });
  });
