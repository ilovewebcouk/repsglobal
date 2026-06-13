// Reviews: public submission (authenticated client), pro-side listing/response,
// public read of published reviews. RLS allows only auth.uid()=client_user_id
// to insert; pros can SELECT/UPDATE their own; public reads when status='published'.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
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
