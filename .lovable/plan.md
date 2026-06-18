## Wire `/in/$location` "Browse by profession" to real directory + live counts

**Goal:** On `/in/edinburgh` (and every other `/in/*` city page) each profession box should:
1. Link to the directory pre-filtered by that city **and** profession.
2. Show a real count of REPs professionals matching `city + profession`, not the hand-coded number.

### 1. New server function — `getCityProfessionCounts`
Add to `src/lib/directory/search.functions.ts` (or a new `city-counts.functions.ts` colocated):

```ts
export const getCityProfessionCounts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ city: z.string().trim().max(120) }).parse)
  .handler(async ({ data }) => {
    // For each profession slug in PROFESSIONS_FOR_CITY_PAGE,
    // run a HEAD count query on `professionals` with
    //   .ilike("city", `%${data.city}%`)
    //   .eq("primary_profession", slug)
    //   .eq("verification","verified") OR same filter set used by directory default
    // Return Record<professionSlug, number>.
  });
```

Profession list mirrors what each city currently shows:
`personal-trainer`, `pilates-instructor`, `strength-coach`, `nutritionist`, `online-coach`
(falls back to whatever `loc.professions` already declares — same slugs).

Counts use the same visibility filter the public directory uses (verified / published profile) so the number you see on the box matches the number of results on the directory page.

### 2. Wire counts in `src/routes/in.$location.tsx`
- Add `useQuery({ queryKey: ["city-profession-counts", loc.slug], queryFn: () => getCityProfessionCounts({ data: { city: loc.name } }) })`.
- For each `loc.professions[i]`, prefer `counts[p.slug]` when loaded; while loading show a small skeleton dash (`—`) instead of the stale hand-coded number. No layout shift.
- Hand-coded `count` in the `LOCATIONS` map becomes a fallback only (kept for SSR/no-JS).

### 3. Link the boxes to the directory (not the profession landing)
Change each card from:

```tsx
<Link to="/professions/$profession" params={{ profession: p.slug }}>
```

to:

```tsx
<Link
  to="/find-a-professional"
  search={{ city: loc.name, profession: p.slug }}
>
```

This matches the existing `validateSearch` on `/find-a-professional` (it already accepts `city` and `profession`), so `/find-a-professional?city=Edinburgh&profession=personal-trainer` lands on a filtered, scoped results page — the same one users get from the hero search.

### 4. Out of scope (this pass)
- Top "X verified professionals" hero number on `/in/$location` — already shown as `loc.count`; we can wire that to `sum(counts)` in a follow-up if you want, but flag it first so we don't change hero copy silently.
- `/professions/$profession` page itself is unchanged.
- No DB migration. No design changes. No new components.

### Files touched
- `src/lib/directory/search.functions.ts` — add `getCityProfessionCounts`.
- `src/routes/in.$location.tsx` — `useQuery` for counts; swap `<Link>` target to `/find-a-professional` with `search`.
