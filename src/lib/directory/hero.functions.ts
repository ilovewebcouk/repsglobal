import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export type HeroAvatar = {
  id: string;
  slug: string;
  full_name: string;
  avatar_url: string;
  city: string | null;
};

export const getHomepageHeroAvatars = createServerFn({ method: "GET" }).handler(
  async (): Promise<HeroAvatar[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pros, error } = await supabaseAdmin
      .from("professionals")
      .select("id, slug, city, quality_score")
      .eq("is_published", true)
      .eq("identity_status", "approved")
      .eq("bd_seed_thin", false)
      .order("quality_score", { ascending: false, nullsFirst: false })
      .limit(24);

    if (error || !pros || pros.length === 0) return [];

    const ids = pros.map((p) => p.id);
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids);

    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

    const result: HeroAvatar[] = [];
    for (const p of pros) {
      const prof = profMap.get(p.id);
      const avatar = prof?.avatar_url ?? null;
      const name = prof?.full_name ?? null;
      const slug = p.slug ?? null;
      if (!avatar || !name || !slug) continue;
      result.push({
        id: p.id,
        slug,
        full_name: name,
        avatar_url: avatar,
        city: p.city ?? null,
      });
    }

    // Fisher–Yates shuffle so each page-load surfaces a different mix.
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result.slice(0, 12);
  },
);


export const heroAvatarsQueryOptions = queryOptions({
  queryKey: ["homepage-hero-avatars"],
  queryFn: () => getHomepageHeroAvatars(),
  // Re-fetch on each page load so the shuffle re-runs.
  staleTime: 0,
});

