// Reviews: public submission (authenticated client), pro-side listing/response,
// public read of published reviews, request-by-email flow, and admin moderation.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { z } from "zod";

export type ReviewDTO = {
  id: string;
  professional_id: string;
  client_user_id: string | null;
  client_name: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "published" | "hidden" | "flagged";
  response: string | null;
  responded_at: string | null;
  published_at: string | null;
  created_at: string;
};

const SubmitSchema = z.object({
  slug: z.string().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).nullable().optional(),
  body: z.string().trim().min(20).max(2000),
  client_name: z.string().trim().min(2).max(120),
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => SubmitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pro, error: proErr } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (proErr) throw proErr;
    if (!pro) throw new Error("Professional not found");
    if (pro.id === userId) throw new Error("You can't review your own profile");

    // Prevent duplicate: one published/pending review per client per pro
    const { data: existing } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("professional_id", pro.id)
      .eq("client_user_id", userId)
      .in("status", ["pending", "published"])
      .maybeSingle();
    if (existing) throw new Error("You have already reviewed this pro");

    const { data: row, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        professional_id: pro.id,
        client_user_id: userId,
        client_name: data.client_name,
        rating: data.rating,
        title: data.title || null,
        body: data.body,
        source: "client_submitted",
        status: "published", // auto-publish; flag/moderate later
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ReviewDTO[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select(
        "id, professional_id, client_user_id, client_name, rating, title, body, status, response, responded_at, published_at, created_at",
      )
      .eq("professional_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as ReviewDTO[];
  });

const RespondSchema = z.object({
  id: z.string().uuid(),
  response: z.string().trim().min(1).max(2000),
});

export const respondToReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => RespondSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({
        response: data.response,
        responded_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("professional_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listPublicReviewsBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(
    async ({ data }): Promise<{ reviews: ReviewDTO[]; count: number; average: number }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: pro } = await supabaseAdmin
        .from("professionals")
        .select("id")
        .eq("slug", data.slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!pro) return { reviews: [], count: 0, average: 0 };

      const { data: rows } = await supabaseAdmin
        .from("reviews")
        .select(
          "id, professional_id, client_user_id, client_name, rating, title, body, status, response, responded_at, published_at, created_at",
        )
        .eq("professional_id", pro.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);

      const reviews = (rows ?? []) as ReviewDTO[];
      const count = reviews.length;
      const average =
        count > 0
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
          : 0;
      return { reviews, count, average };
    },
  );

// =====================================================================
// KPIs / breakdown for the Verified-tier dashboard
// =====================================================================

export type ReviewKpis = {
  avg_rating: number;
  review_count: number;
  last_30d_count: number;
  last_30d_avg: number;
  response_rate: number;
  awaiting_reply: number;
  flagged: number;
  breakdown: Array<{ stars: number; count: number; pct: number }>;
};

export const getMyReviewKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ReviewKpis> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("reviews")
      .select("rating, status, response, created_at, flag_reason, flagged_at")
      .eq("professional_id", context.userId)
      .limit(2000);

    const all = (rows ?? []) as Array<{
      rating: number;
      status: string;
      response: string | null;
      created_at: string;
      flag_reason: string | null;
      flagged_at: string | null;
    }>;
    const published = all.filter((r) => r.status === "published");
    const count = published.length;
    const avg = count > 0 ? published.reduce((s, r) => s + r.rating, 0) / count : 0;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = published.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    const recentAvg = recent.length ? recent.reduce((s, r) => s + r.rating, 0) / recent.length : 0;
    const responded = published.filter((r) => r.response).length;
    const responseRate = count > 0 ? Math.round((responded / count) * 100) : 0;
    const awaiting = published.filter((r) => !r.response).length;
    const flagged = all.filter((r) => r.status === "flagged" || r.flag_reason).length;

    const buckets = [5, 4, 3, 2, 1].map((stars) => {
      const c = published.filter((r) => r.rating === stars).length;
      return { stars, count: c, pct: count > 0 ? Math.round((c / count) * 100) : 0 };
    });

    return {
      avg_rating: Math.round(avg * 10) / 10,
      review_count: count,
      last_30d_count: recent.length,
      last_30d_avg: Math.round(recentAvg * 10) / 10,
      response_rate: responseRate,
      awaiting_reply: awaiting,
      flagged,
      breakdown: buckets,
    };
  });

// =====================================================================
// Thank / Flag (professional actions)
// =====================================================================

const IdSchema = z.object({ id: z.string().uuid() });

export const thankReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ thanked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("professional_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const FlagSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

export const flagReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => FlagSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({
        status: "flagged",
        flag_reason: data.reason,
        flagged_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("professional_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// =====================================================================
// Review requests — create + list (pro), public token lookup + submit
// =====================================================================

function generateReviewToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type ReviewRequestRow = {
  id: string;
  client_email: string;
  client_name: string | null;
  service_label: string | null;
  status: string;
  sent_at: string;
  expires_at: string;
};

const CreateRequestSchema = z.object({
  client_email: z.string().email().max(254),
  client_name: z.string().trim().min(1).max(120).optional(),
  service_label: z.string().trim().min(1).max(120).optional(),
});

export const createReviewRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => CreateRequestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("id, slug")
      .eq("id", context.userId)
      .maybeSingle();
    if (!pro) throw new Error("No professional profile found");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const proName =
      profile?.display_name || profile?.full_name || "Your trainer";

    const token = generateReviewToken();
    const now = new Date();
    const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const { data: row, error } = await supabaseAdmin
      .from("review_requests")
      .insert({
        professional_id: pro.id,
        client_email: data.client_email.toLowerCase(),
        client_name: data.client_name ?? null,
        service_label: data.service_label ?? null,
        token,
        status: "sent",
        sent_at: now.toISOString(),
        expires_at: expires.toISOString(),
      })
      .select("id, token")
      .single();
    if (error) throw error;

    const reviewUrl = `https://repsuk.org/r/${row.token}`;
    try {
      const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
      await sendTransactionalEmailServer({
        templateName: "review-request",
        recipientEmail: data.client_email,
        idempotencyKey: `review-request:${row.id}`,
        templateData: {
          proName,
          reviewUrl,
          serviceLabel: data.service_label,
          clientName: data.client_name,
        },
      });
    } catch (e) {
      console.error("[createReviewRequest] email enqueue failed", e);
    }

    return { id: row.id, token: row.token };
  });

export const listMyReviewRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ReviewRequestRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("review_requests")
      .select("id, client_email, client_name, service_label, status, sent_at, expires_at")
      .eq("professional_id", context.userId)
      .order("sent_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as ReviewRequestRow[];
  });

// ---- Public token-based submission ----

export type ReviewRequestPublic =
  | { found: false }
  | {
      found: true;
      id: string;
      professional_id: string;
      professional_name: string | null;
      professional_slug: string | null;
      client_email: string;
      client_name: string | null;
      service_label: string | null;
      status: string;
      expires_at: string;
    };

export const getReviewRequestByToken = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().min(8).max(128) }).parse(d),
  )
  .handler(async ({ data }): Promise<ReviewRequestPublic> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc(
      "get_review_request_by_token",
      { _token: data.token },
    );
    if (error) throw error;
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return { found: false };
    return {
      found: true,
      id: row.id,
      professional_id: row.professional_id,
      professional_name: row.professional_name ?? null,
      professional_slug: row.professional_slug ?? null,
      client_email: row.client_email,
      client_name: row.client_name ?? null,
      service_label: row.service_label ?? null,
      status: row.status,
      expires_at: row.expires_at,
    };
  });

const SubmitByTokenSchema = z.object({
  token: z.string().min(8).max(128),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(20).max(2000),
  client_name: z.string().trim().min(2).max(120),
});

export const submitReviewByToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitByTokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: id, error } = await supabaseAdmin.rpc("submit_review_by_token", {
      _token: data.token,
      _rating: data.rating,
      _title: (data.title ?? "") as string,
      _body: data.body,
      _client_name: data.client_name,
    });
    if (error) throw error;
    return { id: id as string };
  });

// =====================================================================
// Admin moderation
// =====================================================================

async function assertAdmin(supabase: any, userId: string) {
  const { data: ok, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!ok) throw new Error("Forbidden");
}

export type AdminReviewKpis = {
  avg_rating: number;
  reviews_30d: number;
  flagged: number;
  auto_approved_pct: number;
  distribution: Array<{ stars: number; count: number; pct: number }>;
};

export const adminReviewKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<AdminReviewKpis> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin
      .from("reviews")
      .select("rating, status, source, created_at, flag_reason")
      .limit(20000);
    const all = (rows ?? []) as Array<{
      rating: number;
      status: string;
      source: string | null;
      created_at: string;
      flag_reason: string | null;
    }>;
    const published = all.filter((r) => r.status === "published");
    const avg = published.length
      ? published.reduce((s, r) => s + r.rating, 0) / published.length
      : 0;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = all.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    const flagged = all.filter((r) => r.status === "flagged" || r.flag_reason).length;
    const autoApproved = recent.filter(
      (r) => r.status === "published" && !r.flag_reason,
    ).length;
    const autoPct = recent.length
      ? Math.round((autoApproved / recent.length) * 100)
      : 0;

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const c = recent.filter((r) => r.rating === stars).length;
      return { stars, count: c, pct: recent.length ? Math.round((c / recent.length) * 100) : 0 };
    });

    return {
      avg_rating: Math.round(avg * 100) / 100,
      reviews_30d: recent.length,
      flagged,
      auto_approved_pct: autoPct,
      distribution,
    };
  });

export type AdminFlaggedReview = {
  id: string;
  professional_id: string;
  professional_name: string | null;
  professional_slug: string | null;
  client_name: string;
  rating: number;
  title: string | null;
  body: string;
  flag_reason: string | null;
  flagged_at: string | null;
  created_at: string;
};

export const adminListFlagged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<AdminFlaggedReview[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("reviews")
      .select(
        "id, professional_id, client_name, rating, title, body, flag_reason, flagged_at, created_at, status",
      )
      .or("status.eq.flagged,flag_reason.not.is.null")
      .order("flagged_at", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) throw error;
    const list = (rows ?? []) as Array<{
      id: string;
      professional_id: string;
      client_name: string;
      rating: number;
      title: string | null;
      body: string;
      flag_reason: string | null;
      flagged_at: string | null;
      created_at: string;
    }>;
    if (list.length === 0) return [];

    const proIds = Array.from(new Set(list.map((r) => r.professional_id)));
    const [{ data: pros }, { data: profs }] = await Promise.all([
      supabaseAdmin.from("professionals").select("id, slug").in("id", proIds),
      supabaseAdmin.from("profiles").select("id, full_name, display_name").in("id", proIds),
    ]);
    const slugById = new Map((pros ?? []).map((p: any) => [p.id, p.slug]));
    const nameById = new Map(
      (profs ?? []).map((p: any) => [p.id, p.display_name || p.full_name || null]),
    );

    return list.map((r) => ({
      id: r.id,
      professional_id: r.professional_id,
      professional_name: nameById.get(r.professional_id) ?? null,
      professional_slug: slugById.get(r.professional_id) ?? null,
      client_name: r.client_name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      flag_reason: r.flag_reason,
      flagged_at: r.flagged_at,
      created_at: r.created_at,
    }));
  });

export const adminApproveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({
        status: "published",
        flag_reason: null,
        flagged_at: null,
        published_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminRemoveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ status: "hidden" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
