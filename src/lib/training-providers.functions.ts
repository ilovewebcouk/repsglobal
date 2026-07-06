// Training providers (organisations) — server functions.
//
// Admin-only writes (list/get/create-from-stripe/update/publish/course CRUD)
// use requireSupabaseAuth + has_role('admin').
//
// Public reads (website + verify pages) use a server publishable client
// so they work on SSR with no session. RLS still applies — the "Public can
// view active organisations" and "Public can view accredited courses of
// active orgs" policies gate visibility.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type OrgStatus = "draft" | "active" | "suspended" | "cancelled";
type CourseStatus = "pending" | "accredited" | "rejected" | "expired";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || "provider";
}

function publicSupabase() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden");
}

/* ────────────────── Admin: list ────────────────── */

export const listOrganisations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orgs, error } = await supabaseAdmin
      .from("organisations")
      .select(
        "id, name, slug, status, city, country, membership_number, stripe_customer_id, subscription_id, published_at, verified_at, logo_url, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (orgs ?? []).map((o) => o.id);
    let courseCounts: Record<string, number> = {};
    let reviewCounts: Record<string, { count: number; avg: number | null }> = {};
    if (ids.length) {
      const { data: courses } = await supabaseAdmin
        .from("courses")
        .select("organisation_id, status")
        .in("organisation_id", ids);
      for (const c of courses ?? []) {
        if (c.status === "accredited") {
          courseCounts[c.organisation_id] =
            (courseCounts[c.organisation_id] ?? 0) + 1;
        }
      }
      const { data: reviews } = await supabaseAdmin
        .from("provider_reviews")
        .select("organisation_id, rating, status")
        .in("organisation_id", ids)
        .eq("status", "published");
      const buckets: Record<string, number[]> = {};
      for (const r of reviews ?? []) {
        (buckets[r.organisation_id] ??= []).push(r.rating);
      }
      for (const [oid, ratings] of Object.entries(buckets)) {
        reviewCounts[oid] = {
          count: ratings.length,
          avg: ratings.length
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : null,
        };
      }
    }

    return (orgs ?? []).map((o) => ({
      ...o,
      accredited_course_count: courseCounts[o.id] ?? 0,
      review_count: reviewCounts[o.id]?.count ?? 0,
      review_avg: reviewCounts[o.id]?.avg ?? null,
    }));
  });

/* ────────────────── Admin: get one ────────────────── */

export const getOrganisation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("id required");
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: org, error } = await supabaseAdmin
      .from("organisations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!org) throw new Error("Organisation not found");

    const { data: courses } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("organisation_id", data.id)
      .order("created_at", { ascending: false });

    let subscription: any = null;
    if (org.subscription_id) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("id, tier, status, stripe_subscription_id, stripe_price_id, current_period_end, cancel_at_period_end, environment")
        .eq("id", org.subscription_id)
        .maybeSingle();
      subscription = sub;
    }

    return { org, courses: courses ?? [], subscription };
  });

/* ────────────────── Admin: create from Stripe customer id ────────────────── */

export const createOrganisationFromStripe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    stripe_customer_id: string;
    stripe_env?: "live" | "sandbox";
    name?: string;
    slug?: string;
  }) => {
    if (!d?.stripe_customer_id?.startsWith("cus_")) {
      throw new Error("Valid stripe customer id (cus_...) required");
    }
    return {
      stripe_customer_id: d.stripe_customer_id.trim(),
      stripe_env: (d.stripe_env ?? "live") as "live" | "sandbox",
      name: d.name?.trim(),
      slug: d.slug?.trim(),
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient(data.stripe_env);
    const customer = await stripe.customers.retrieve(data.stripe_customer_id);
    if (customer.deleted) throw new Error("Stripe customer is deleted");
    const c = customer as any;

    const name = data.name ?? c.name ?? c.email ?? "Training provider";
    const slug = data.slug ? slugify(data.slug) : slugify(name);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Uniqueness on slug
    const { data: dupe } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    const finalSlug = dupe ? `${slug}-${Math.random().toString(36).slice(2, 6)}` : slug;

    const insertPayload: any = {
      name,
      slug: finalSlug,
      legal_name: c.name ?? null,
      contact_email: c.email ?? null,
      contact_phone: c.phone ?? null,
      city: c.address?.city ?? null,
      country: c.address?.country ?? null,
      stripe_customer_id: data.stripe_customer_id,
      status: "draft" as OrgStatus,
    };

    const { data: org, error } = await supabaseAdmin
      .from("organisations")
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Attempt to attach an existing active subscription if any
    const subs = await stripe.subscriptions.list({
      customer: data.stripe_customer_id,
      status: "all",
      limit: 5,
    });
    const activeSub = subs.data.find((s) =>
      ["active", "trialing", "past_due"].includes(s.status),
    );
    if (activeSub) {
      const priceId = activeSub.items.data[0]?.price?.id ?? null;
      const { data: subRow } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: null as any,
          owner_type: "organisation" as any,
          owner_id: org.id,
          tier: "training_provider" as any,
          status: activeSub.status as any,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: activeSub.id,
          stripe_price_id: priceId,
          environment: data.stripe_env,
          current_period_end: activeSub.items.data[0]?.current_period_end
            ? new Date(activeSub.items.data[0].current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: activeSub.cancel_at_period_end ?? false,
        } as any)
        .select("id")
        .single();
      if (subRow) {
        await supabaseAdmin
          .from("organisations")
          .update({ subscription_id: subRow.id } as any)
          .eq("id", org.id);
      }
    }

    return { id: org.id, slug: finalSlug };
  });

/* ────────────────── Admin: update organisation ────────────────── */

export const updateOrganisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    patch: Partial<{
      name: string;
      slug: string;
      legal_name: string | null;
      about_md: string | null;
      website_url: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      city: string | null;
      country: string | null;
      companies_house_number: string | null;
      membership_number: string | null;
      logo_url: string | null;
      cover_url: string | null;
      status: OrgStatus;
    }>;
  }) => {
    if (!d?.id) throw new Error("id required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { ...data.patch };
    if (patch.slug) patch.slug = slugify(patch.slug);
    const { error } = await supabaseAdmin
      .from("organisations")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ────────────────── Admin: publish / unpublish ────────────────── */

export const setOrganisationPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; published: boolean }) => {
    if (!d?.id) throw new Error("id required");
    return { id: d.id, published: !!d.published };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = data.published
      ? { published_at: new Date().toISOString(), status: "active" }
      : { published_at: null };
    const { error } = await supabaseAdmin
      .from("organisations")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ────────────────── Admin: course upsert / delete ────────────────── */

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    organisation_id: string;
    title: string;
    slug?: string;
    summary?: string | null;
    description_md?: string | null;
    level?: string | null;
    duration_hours?: number | null;
    delivery_mode?: "in_person" | "online" | "blended" | null;
    price_from?: number | null;
    reps_course_id?: string | null;
    external_url?: string | null;
    status?: CourseStatus;
    expires_at?: string | null;
  }) => {
    if (!d?.organisation_id) throw new Error("organisation_id required");
    if (!d?.title?.trim()) throw new Error("title required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const payload: any = {
      organisation_id: data.organisation_id,
      title: data.title.trim(),
      slug,
      summary: data.summary ?? null,
      description_md: data.description_md ?? null,
      level: data.level ?? null,
      duration_hours: data.duration_hours ?? null,
      delivery_mode: data.delivery_mode ?? null,
      price_from: data.price_from ?? null,
      reps_course_id: data.reps_course_id ?? null,
      external_url: data.external_url ?? null,
      status: data.status ?? "pending",
      expires_at: data.expires_at ?? null,
    };
    if (payload.status === "accredited") {
      payload.accredited_at = new Date().toISOString();
      payload.accredited_by = context.userId;
    }
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("courses")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("courses")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("id required");
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ────────────────── Public: get org by slug + accredited courses + reviews summary ────────────────── */

export const getPublicProvider = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => {
    if (!d?.slug) throw new Error("slug required");
    return { slug: d.slug };
  })
  .handler(async ({ data }) => {
    const sb = publicSupabase();
    const { data: org, error } = await sb
      .from("organisations")
      .select(
        "id, name, slug, city, country, about_md, website_url, contact_email, membership_number, logo_url, cover_url, verified_at, published_at, status",
      )
      .eq("slug", data.slug)
      .eq("status", "active")
      .not("published_at", "is", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!org) return null;

    const { data: courses } = await sb
      .from("courses")
      .select(
        "id, title, slug, summary, level, duration_hours, delivery_mode, price_from, reps_course_id, external_url, accredited_at, expires_at",
      )
      .eq("organisation_id", org.id)
      .eq("status", "accredited")
      .order("title");

    const { data: reviews } = await sb
      .from("provider_reviews")
      .select(
        "id, rating, title, body, author_display_name, verification_source, created_at, status",
      )
      .eq("organisation_id", org.id)
      .in("status", ["published", "flagged", "evidence_requested"])
      .order("created_at", { ascending: false })
      .limit(30);

    const published = (reviews ?? []).filter((r) => r.status === "published");
    const avg = published.length
      ? published.reduce((a, r) => a + r.rating, 0) / published.length
      : null;

    return {
      org,
      courses: courses ?? [],
      reviews: reviews ?? [],
      review_avg: avg,
      review_count: published.length,
    };
  });

export const getPublicProviderByMembershipNumber = createServerFn({ method: "GET" })
  .inputValidator((d: { membership_number: string }) => {
    if (!d?.membership_number) throw new Error("membership_number required");
    return { membership_number: d.membership_number.trim() };
  })
  .handler(async ({ data }) => {
    const sb = publicSupabase();
    const { data: org } = await sb
      .from("organisations")
      .select("id, name, slug, city, country, logo_url, verified_at, membership_number, status, published_at")
      .eq("membership_number", data.membership_number)
      .eq("status", "active")
      .not("published_at", "is", null)
      .maybeSingle();
    return org;
  });

/* ────────────────── Reviews: public submit + verify + admin moderation ────────────────── */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { getRequest } from "@tanstack/react-start/server";

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}
function hashToken(t: string): string {
  return createHash("sha256").update(t).digest("hex");
}
function hashString(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}
function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export const submitProviderReview = createServerFn({ method: "POST" })
  .inputValidator((d: {
    slug: string;
    rating: number;
    title?: string;
    body: string;
    author_display_name: string;
    author_email: string;
    course_id?: string | null;
  }) => {
    if (!d?.slug) throw new Error("slug required");
    const rating = Number(d.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Rating must be 1–5");
    const body = (d.body ?? "").trim();
    if (body.length < 40) throw new Error("Review must be at least 40 characters");
    if (body.length > 4000) throw new Error("Review too long (max 4000 chars)");
    const name = (d.author_display_name ?? "").trim();
    if (name.length < 2) throw new Error("Display name required");
    const email = (d.author_email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Valid email required");
    return {
      slug: d.slug,
      rating,
      title: (d.title ?? "").trim().slice(0, 120) || null,
      body,
      author_display_name: name.slice(0, 80),
      author_email: email,
      course_id: d.course_id ?? null,
    };
  })
  .handler(async ({ data }) => {
    const sb = publicSupabase();
    const { data: org, error: orgErr } = await sb
      .from("organisations")
      .select("id, name, slug, status, published_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (orgErr) throw new Error(orgErr.message);
    if (!org || org.status !== "active" || !org.published_at) {
      throw new Error("Provider not accepting reviews");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const emailHash = hashEmail(data.author_email);
    // rate-limit: max 1 pending or 3 total per email per org in 90d
    const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
    const { count: recent } = await supabaseAdmin
      .from("provider_reviews")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", org.id)
      .eq("author_email_hash", emailHash)
      .gte("created_at", since);
    if ((recent ?? 0) >= 3) {
      throw new Error("You've already reviewed this provider recently.");
    }

    // request metadata
    let ipHash: string | null = null;
    let uaHash: string | null = null;
    try {
      const req = getRequest();
      const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        null;
      if (ip) ipHash = hashString(ip);
      const ua = req.headers.get("user-agent");
      if (ua) uaHash = hashString(ua);
    } catch {}

    const token = newToken();
    const tokenHash = hashToken(token);

    const { data: inserted, error } = await supabaseAdmin
      .from("provider_reviews")
      .insert({
        organisation_id: org.id,
        course_id: data.course_id,
        rating: data.rating,
        title: data.title,
        body: data.body,
        author_display_name: data.author_display_name,
        author_email_hash: emailHash,
        author_ip_hash: ipHash,
        user_agent_hash: uaHash,
        verification_source: "open" as const,
        status: "pending_email" as const,
        email_verification_token_hash: tokenHash,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // fire-and-log verification email
    const base = process.env.PUBLIC_SITE_URL || "https://repsuk.org";
    const verifyUrl = `${base}/reviews/provider/verify/${token}`;
    try {
      const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
      await sendTransactionalEmailServer({
        templateName: "provider-review-verify",
        recipientEmail: data.author_email,
        idempotencyKey: `prov-review-verify-${inserted.id}`,
        templateData: {
          providerName: org.name,
          verifyUrl,
          rating: data.rating,
        },
      });
    } catch (e) {
      console.error("[submitProviderReview] email send failed", e);
    }

    return { ok: true, reviewId: inserted.id };
  });

export const verifyProviderReviewEmail = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => {
    if (!d?.token) throw new Error("token required");
    return { token: d.token };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tokenHash = hashToken(data.token);
    const { data: review } = await supabaseAdmin
      .from("provider_reviews")
      .select("id, status, organisation_id, email_verified_at")
      .eq("email_verification_token_hash", tokenHash)
      .maybeSingle();
    if (!review) return { ok: false, reason: "invalid" as const };
    if (review.status !== "pending_email" && !review.email_verified_at) {
      return { ok: false, reason: "invalid" as const };
    }
    if (review.email_verified_at) {
      return { ok: true, alreadyVerified: true, reviewId: review.id, organisationId: review.organisation_id };
    }

    // Publish immediately (Trustpilot model). Admin can flag/remove later.
    const { error } = await supabaseAdmin
      .from("provider_reviews")
      .update({
        email_verified_at: new Date().toISOString(),
        status: "published" as const,
        email_verification_token_hash: null,
      })
      .eq("id", review.id);
    if (error) throw new Error(error.message);

    return { ok: true, alreadyVerified: false, reviewId: review.id, organisationId: review.organisation_id };
  });

export const listAdminProviderReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string } | undefined) => ({
    status: d?.status ?? "all",
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("provider_reviews")
      .select(
        "id, organisation_id, rating, title, body, author_display_name, verification_source, status, created_at, flagged_at, evidence_requested_at, removed_at, removed_reason, email_verified_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") {
      q = q.eq("status", data.status as any);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const orgIds = Array.from(new Set((rows ?? []).map((r) => r.organisation_id)));
    let orgs: Record<string, { name: string; slug: string }> = {};
    if (orgIds.length) {
      const { data: os } = await supabaseAdmin
        .from("organisations")
        .select("id, name, slug")
        .in("id", orgIds);
      for (const o of os ?? []) orgs[o.id] = { name: o.name, slug: o.slug };
    }
    return (rows ?? []).map((r) => ({ ...r, organisation: orgs[r.organisation_id] ?? null }));
  });

export const moderateProviderReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    reviewId: string;
    action: "flag" | "request_evidence" | "remove" | "restore";
    reason?: string;
    notes?: string;
  }) => {
    if (!d?.reviewId) throw new Error("reviewId required");
    if (!["flag", "request_evidence", "remove", "restore"].includes(d.action)) {
      throw new Error("invalid action");
    }
    return {
      reviewId: d.reviewId,
      action: d.action,
      reason: (d.reason ?? "").trim() || null,
      notes: (d.notes ?? "").trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date().toISOString();
    let patch: Record<string, unknown> = { moderated_by: context.userId };

    if (data.action === "flag") {
      patch.status = "flagged";
      patch.flagged_at = now;
    } else if (data.action === "request_evidence") {
      patch.status = "evidence_requested";
      patch.evidence_requested_at = now;
      patch.evidence_deadline_at = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
    } else if (data.action === "remove") {
      patch.status = "removed";
      patch.removed_at = now;
      patch.removed_reason = data.reason;
    } else if (data.action === "restore") {
      patch.status = "published";
      patch.removed_at = null;
      patch.flagged_at = null;
      patch.evidence_requested_at = null;
      patch.evidence_deadline_at = null;
      patch.removed_reason = null;
    }

    const { error } = await supabaseAdmin
      .from("provider_reviews")
      .update(patch as any)
      .eq("id", data.reviewId);
    if (error) throw new Error(error.message);

    if (data.action !== "restore") {
      await supabaseAdmin.from("provider_review_flags").insert({
        review_id: data.reviewId,
        flagged_by: context.userId,
        reason: data.reason ?? data.action,
        notes: data.notes,
      });
    }
    return { ok: true };
  });
