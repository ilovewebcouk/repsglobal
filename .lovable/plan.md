# Wire "Avg. rating" to real reviews per city

The "at a glance" sidebar currently hardcodes `4.9 / 5` on every city page. Wire it to the real published-review average for professionals in that city, with a graceful empty state.

## 1. New server function

Add `getCityAvgRating` to `src/lib/directory/search.functions.ts`, matching the existing `getCityOnlineCount` shape:

```ts
const CityAvgRatingSchema = z.object({ city: z.string().min(1) });

export const getCityAvgRating = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => CityAvgRatingSchema.parse(raw))
  .handler(async ({ data }): Promise<{ avg: number | null; count: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // 1. Pro IDs in this city
    const { data: pros } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("is_published", true)
      .ilike("city", `%${data.city}%`);
    const ids = (pros ?? []).map(p => p.id);
    if (ids.length === 0) return { avg: null, count: 0 };
    // 2. Published reviews for those pros
    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("status", "published")
      .in("professional_id", ids);
    const rows = reviews ?? [];
    if (rows.length === 0) return { avg: null, count: 0 };
    const avg = rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length;
    return { avg: Math.round(avg * 10) / 10, count: rows.length };
  });
```

## 2. Wire into city page

In `src/routes/in.$location.tsx`:

- Import `getCityAvgRating`.
- Add a `useQuery` keyed `["city-avg-rating", loc.slug]`, `staleTime: 5 * 60_000`.
- Replace the hardcoded `4.9 / 5` block at line ~424 with:
  - When `avg === null` (no reviews yet): render `—` (no star), muted.
  - When `avg !== null`: render `<Star /> {avg.toFixed(1)} / 5` (existing markup) plus a small muted `({count})` suffix.

The DB currently has 0 published reviews, so every city will read `—` until reviews land — that's the intended honest empty state.

## Out of scope

- Backfilling demo review data.
- Surfacing per-professional avg ratings elsewhere.
- Caching beyond the 5-minute `staleTime`.
