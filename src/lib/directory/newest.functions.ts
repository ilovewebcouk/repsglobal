/**
 * Newest coaches — home rail "Just joined".
 *
 * Criteria: published, non-demo, individual coach (not an organisation),
 * with a real avatar. Ordered by professional.created_at desc.
 *
 * Unverified pros are included on purpose — the whole point is to
 * surface newcomers before they've verified.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  limit: z.number().int().min(1).max(24).default(16),
});

export type NewestCoachRow = {
  id: string;
  slug: string;
  full_name: string;
  avatar_url: string;
  primary_profession: string | null;
  primary_title_slug: string | null;
  secondary_title_slug: string | null;
  city: string | null;
  in_person_available: boolean | null;
  online_available: boolean | null;
  rating_avg: number | null;
  review_count: number;
  verification_status: string | null;
};

export const getNewestCoaches = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw ?? {}))
  .handler(async ({ data }): Promise<{ pros: NewestCoachRow[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull a generous window then filter for avatar client-side after the
    // profiles join. Cap the pool so cold queries stay cheap.
    const { data: prosRaw, error } = await supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, city, primary_profession, primary_title_slug, secondary_title_slug, in_person_available, online_available, account_type, verification_status, created_at",
      )
      .eq("is_published", true)
      .eq("is_demo", false)
      .or("account_type.is.null,account_type.eq.individual")
      .not("slug", "is", null)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(200);

    if (error || !prosRaw || prosRaw.length === 0) return { pros: [] };

    const ids = prosRaw.map((p) => p.id);
    const [profilesRes, reviewsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url, created_at")
        .in("id", ids),
      supabaseAdmin
        .from("reviews")
        .select("professional_id, rating, status")
        .in("professional_id", ids)
        .eq("status", "published"),
    ]);

    const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const reviewAggById = new Map<string, { count: number; sum: number }>();
    for (const r of reviewsRes.data ?? []) {
      const prev = reviewAggById.get(r.professional_id) ?? { count: 0, sum: 0 };
      prev.count += 1;
      prev.sum += Number(r.rating) || 0;
      reviewAggById.set(r.professional_id, prev);
    }

    // Build every eligible row first so we can sort by true signup date
    // (profiles.created_at, written by handle_new_user at signup) before
    // truncating to `limit`. Fall back to professionals.created_at when
    // the profile row predates the trigger.
    type Enriched = { row: NewestCoachRow; joinedAt: string };
    const enriched: Enriched[] = [];
    for (const p of prosRaw) {
      const prof = profileById.get(p.id);
      const avatar = (prof?.avatar_url ?? "").trim();
      if (!avatar) continue;
      if (!p.slug) continue;
      const agg = reviewAggById.get(p.id);
      enriched.push({
        row: {
          id: p.id,
          slug: p.slug,
          full_name: prof?.full_name ?? "REPs Professional",
          avatar_url: avatar,
          primary_profession: p.primary_profession,
          primary_title_slug: p.primary_title_slug,
          secondary_title_slug: p.secondary_title_slug,
          city: p.city,
          in_person_available: p.in_person_available,
          online_available: p.online_available,
          rating_avg: agg && agg.count > 0 ? agg.sum / agg.count : null,
          review_count: agg?.count ?? 0,
          verification_status:
            (p as { verification_status: string | null }).verification_status ?? null,
        },
        joinedAt: prof?.created_at ?? p.created_at ?? "",
      });
    }

    enriched.sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : a.joinedAt > b.joinedAt ? -1 : 0));

    return { pros: enriched.slice(0, data.limit).map((e) => e.row) };
  });
