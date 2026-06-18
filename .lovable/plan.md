# Wire "Online options" to real online-pro count per city

On `/in/$location`, the "Online options" row in the right-hand "At a glance" card is currently a rough estimate (`cityCount * 0.6`). Replace it with a real count of professionals in that city who have **Online available** turned on in their profile.

## What

- "Online options" reads the live count of pros where `city ilike '%<loc.name>%'` AND `online_available = true` AND `is_published = true`.
- Matches the same filtering used by the existing per-profession city counts (`getCityProfessionCounts`) so the numbers stay consistent.
- Falls back to `—` when the count is 0 or still loading.

## How (technical)

1. **New server fn** `getCityOnlineCount` in `src/lib/directory/search.functions.ts`, alongside `getCityProfessionCounts`:
   - Public (no auth middleware), uses the same `supabaseAdmin` pattern already in that file.
   - Input: `{ city: string }` (zod-validated).
   - Query: `supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('is_published', true).eq('online_available', true).ilike('city', '%<city>%')`.
   - Returns `{ count: number }`.

2. **Wire it in `src/routes/in.$location.tsx`**:
   - Add a sibling `useQuery` keyed `['city-online-count', loc.slug]` with `staleTime: 60_000`.
   - Compute `onlineCountLabel = count && count > 0 ? count.toLocaleString() : "—"`.
   - Replace `{cityCount ? Math.round(cityCount * 0.6) : "—"}` in the "Online options" `<dd>` with `{onlineCountLabel}`.

## Out of scope

- The "Verified pros" total (`cityCountLabel`) and "Avg. rating" stay as they are — the user asked specifically about the Online options number.
