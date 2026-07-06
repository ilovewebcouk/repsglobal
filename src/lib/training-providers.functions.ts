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
