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
        status: "pending",
        moderation_status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    await fanOutReviewNotifications(supabaseAdmin, row.id, pro.id);
    void runReviewModerationFireAndForget(row.id);
    return { id: row.id };
  });

// Helper: insert notification rows for the pro + every admin.
async function fanOutReviewNotifications(
  supabaseAdmin: any,
  reviewId: string,
  professionalId: string,
) {
  const recipients: Array<{ review_id: string; recipient_user_id: string; recipient_role: string }> = [
    { review_id: reviewId, recipient_user_id: professionalId, recipient_role: "professional" },
  ];
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  for (const a of admins ?? []) {
    recipients.push({ review_id: reviewId, recipient_user_id: a.user_id, recipient_role: "admin" });
  }
  if (recipients.length) {
    await supabaseAdmin.from("review_notifications").insert(recipients);
  }
  await supabaseAdmin
    .from("reviews")
    .update({ admin_notified_at: new Date().toISOString(), pro_notified_at: new Date().toISOString() })
    .eq("id", reviewId);
}

async function runReviewModerationFireAndForget(reviewId: string) {
  try {
    const { runReviewModeration } = await import("@/lib/reviews/moderate.functions");
    await runReviewModeration({ data: { reviewId } });
  } catch (e) {
    console.error("[reviews] moderation fire-and-forget failed", e);
  }
}

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
        .eq("moderation_status", "approved")
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
      const [{ render }, React, { template }, { sendViaMailgun }] = await Promise.all([
        import("@react-email/render"),
        import("react"),
        import("@/lib/email-templates/review-request"),
        import("@/lib/email/mailgun.server"),
      ]);
      const props = {
        proName,
        reviewUrl,
        serviceLabel: data.service_label,
        clientName: data.client_name,
      };
      const element = React.createElement(template.component as React.ComponentType<any>, props);
      const html = await render(element);
      const text = await render(element, { plainText: true });
      const subject =
        typeof template.subject === "function"
          ? template.subject(props)
          : template.subject;
      await sendViaMailgun({
        to: data.client_email,
        subject,
        html,
        text,
        templateName: "review-request",
        idempotencyKey: `review-request:${row.id}`,
      });
    } catch (e) {
      console.error("[createReviewRequest] review-request email failed", e);
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
    const { getRequestIP, getRequestHeader } = await import("@tanstack/react-start/server");
    let ip: string | null = null;
    let ua: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
    } catch {
      // server-only utilities — best effort
    }
    const { data: id, error } = await supabaseAdmin.rpc("submit_review_by_token", {
      _token: data.token,
      _rating: data.rating,
      _title: (data.title ?? "") as string,
      _body: data.body,
      _client_name: data.client_name,
      _ip: ip,
      _user_agent: ua,
    } as never);
    if (error) throw error;
    void runReviewModerationFireAndForget(id as string);
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
  pending: number;
  approved_30d: number;
  removed_30d: number;
  suspect: number;
  reviews_30d: number;
  distribution: Array<{ stars: number; count: number; pct: number }>;
};

export const adminReviewKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<AdminReviewKpis> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin
      .from("reviews")
      .select("rating, status, moderation_status, ai_verdict, moderated_at, created_at")
      .limit(20000);
    const all = (rows ?? []) as Array<{
      rating: number;
      status: string;
      moderation_status: string;
      ai_verdict: string | null;
      moderated_at: string | null;
      created_at: string;
    }>;
    const approved = all.filter((r) => r.moderation_status === "approved");
    const avg = approved.length
      ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
      : 0;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = all.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    const pending = all.filter((r) => r.moderation_status === "pending").length;
    const approved30 = all.filter(
      (r) => r.moderation_status === "approved" && r.moderated_at && new Date(r.moderated_at).getTime() >= cutoff,
    ).length;
    const removed30 = all.filter(
      (r) => r.moderation_status === "removed" && r.moderated_at && new Date(r.moderated_at).getTime() >= cutoff,
    ).length;
    const suspect = all.filter(
      (r) => r.moderation_status === "pending" && r.ai_verdict === "suspect",
    ).length;

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const c = recent.filter((r) => r.rating === stars).length;
      return { stars, count: c, pct: recent.length ? Math.round((c / recent.length) * 100) : 0 };
    });

    return {
      avg_rating: Math.round(avg * 100) / 100,
      pending,
      approved_30d: approved30,
      removed_30d: removed30,
      suspect,
      reviews_30d: recent.length,
      distribution,
    };
  });

export type AiFlagCheck = { hit: boolean; reason: string };
export type AiFlags = {
  profanity: AiFlagCheck;
  promo: AiFlagCheck;
  pii: AiFlagCheck;
  fake_signals: AiFlagCheck;
  dedupe: AiFlagCheck;
};

export type AdminReviewRow = {
  id: string;
  professional_id: string;
  professional_name: string | null;
  professional_slug: string | null;
  client_name: string;
  client_email: string | null;
  submitter_ip: string | null;
  rating: number;
  title: string | null;
  body: string;
  moderation_status: "pending" | "approved" | "removed";
  ai_verdict: "clean" | "warning" | "suspect" | null;
  ai_flags: AiFlags | null;
  ai_checked_at: string | null;
  created_at: string;
  moderated_at: string | null;
};

const TabSchema = z
  .object({ tab: z.enum(["pending", "approved", "removed", "all"]).default("pending") })
  .default({ tab: "pending" });

export const adminListReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => TabSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<AdminReviewRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("reviews")
      .select(
        "id, professional_id, client_name, client_email, submitter_ip, rating, title, body, moderation_status, ai_verdict, ai_flags, ai_checked_at, created_at, moderated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.tab !== "all") {
      q = q.eq("moderation_status", data.tab);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    const list = (rows ?? []) as any[];
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
      client_email: r.client_email,
      submitter_ip: r.submitter_ip,
      rating: r.rating,
      title: r.title,
      body: r.body,
      moderation_status: r.moderation_status,
      ai_verdict: r.ai_verdict,
      ai_flags: r.ai_flags,
      ai_checked_at: r.ai_checked_at,
      created_at: r.created_at,
      moderated_at: r.moderated_at,
    }));
  });

const ModerateSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "remove"]),
  note: z.string().trim().max(500).optional(),
});

export const adminModerateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => ModerateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_moderate_review", {
      _review_id: data.id,
      _action: data.action,
      _note: data.note ?? null,
    } as never);
    if (error) throw error;
    return { ok: true };
  });

// Back-compat exports so older imports keep building.
export const adminApproveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_moderate_review", {
      _review_id: data.id,
      _action: "approve",
      _note: null,
    } as never);
    if (error) throw error;
    return { ok: true };
  });

export const adminRemoveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_moderate_review", {
      _review_id: data.id,
      _action: "remove",
      _note: null,
    } as never);
    if (error) throw error;
    return { ok: true };
  });

// =====================================================================
// Notifications (sidebar badge + bell feed)
// =====================================================================

export type ReviewNotificationItem = {
  key: string;
  notificationId: string;
  reviewId: string;
  professionalName: string | null;
  clientName: string;
  rating: number;
  preview: string;
  createdAt: string;
};

export const listMyReviewNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<{ items: ReviewNotificationItem[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: notifs, error } = await supabaseAdmin
      .from("review_notifications")
      .select("id, review_id, created_at")
      .eq("recipient_user_id", context.userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    const list = (notifs ?? []) as Array<{ id: string; review_id: string; created_at: string }>;
    if (list.length === 0) return { items: [] };

    const reviewIds = list.map((n) => n.review_id);
    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("id, professional_id, client_name, rating, body")
      .in("id", reviewIds);
    const reviewMap = new Map((reviews ?? []).map((r: any) => [r.id, r]));
    const proIds = Array.from(new Set((reviews ?? []).map((r: any) => r.professional_id)));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, display_name")
      .in("id", proIds);
    const nameById = new Map(
      (profs ?? []).map((p: any) => [p.id, p.display_name || p.full_name || null]),
    );

    return {
      items: list
        .map((n) => {
          const r = reviewMap.get(n.review_id) as any;
          if (!r) return null;
          return {
            key: `rn:${n.id}`,
            notificationId: n.id,
            reviewId: n.review_id,
            professionalName: nameById.get(r.professional_id) ?? null,
            clientName: r.client_name,
            rating: r.rating,
            preview: (r.body ?? "").slice(0, 120),
            createdAt: n.created_at,
          } as ReviewNotificationItem;
        })
        .filter((x): x is ReviewNotificationItem => !!x),
    };
  });

export const markAllReviewNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("review_notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("recipient_user_id", context.userId)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

// Back-compat: old admin route imports adminListFlagged. Map to pending tab.
export type AdminFlaggedReview = AdminReviewRow & {
  flag_reason: string | null;
  flagged_at: string | null;
};

export const adminListFlagged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<AdminFlaggedReview[]> => {
    await assertAdmin(context.supabase, context.userId);
    const rows = await adminListReviews({ data: { tab: "pending" } });
    return rows.map((r) => ({ ...r, flag_reason: null, flagged_at: null }));
  });
