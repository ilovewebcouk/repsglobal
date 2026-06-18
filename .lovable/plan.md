# Popular gyms on city pages

Replace the static "Popular areas" chip block in the city-page sidebar (`/in/$location`) with a live "Popular gyms" list driven by the `gyms` table. Each chip becomes a link to a gym page we'll wire up properly in a later phase.

## What changes

**Sidebar block on `/in/$location`**
- Heading: "Popular areas" → "Popular gyms"
- Show up to 6 gyms in that city
- Each chip = gym name + small area subtitle (e.g. "Barry's — Canary Wharf")
- Click → `/gyms/$slug` (typed link, route file created in this pass as a lightweight placeholder so the link is valid today)
- If fewer than 6 gyms exist for the city, show what we have; if zero, hide the block entirely (no empty state)

**"All areas of {city}" section further down the page**
- Out of scope for this pass — leaves the existing curated `loc.areas` chip list as-is, so we don't lose the area pills the SEO copy refers to. We can revisit if you'd like to replace that too.

## How gyms are picked

New public server function `getCityPopularGyms({ city, limit: 6 })` in `src/lib/directory/gyms.functions.ts`:

- `supabase.from('gyms').select('id, slug, name, chain_name, area').ilike('city', city).in('status', ['active','approved']).order('name').limit(6)`
- Ordering: by number of trainers who list the gym DESC, then name ASC. Implemented with a small RPC or a two-step query (fetch gym ids + counts from `professional_gyms`, then hydrate). Falls back to alphabetical when no pros are linked yet (current state for most gyms).
- Uses the **server publishable client** (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`) — read-only, no auth, narrow column projection. Public-route safe (no `requireSupabaseAuth`).
- Wired into the route via `useQuery` keyed `['city-popular-gyms', loc.slug]`, `staleTime: 5 * 60_000`.

## Placeholder gym route

`src/routes/gyms.$slug.tsx` — tiny SSR-safe page so today's chips don't 404:

- Loads `name`, `city`, `area`, `chain_name` from `gyms` via a public server fn
- Renders a minimal "Coming soon" panel with the gym name, area, city, and a CTA back to `/in/<city-slug>`
- Sets `head()` title + description from the gym record
- Returns `notFound()` when the slug doesn't match an active gym

When we build the real gym page in a later phase, we replace the body of this route — the URL and link wiring stay the same.

## Files touched

- **new** `src/lib/directory/gyms.functions.ts` — `getCityPopularGyms`, `getGymBySlug`
- **edit** `src/routes/in.$location.tsx` — swap the sidebar block; add the query; hide if empty
- **new** `src/routes/gyms.$slug.tsx` — placeholder gym page so links resolve

## Out of scope

- Replacing the "All areas of {city}" section
- A real gym profile page (services, trainers at this gym, photos, claim flow)
- A `/gyms` index/landing page
- Surfacing gym data inside trainer profiles (you mentioned this as future — confirmed not in this pass)

## Open question

Right now most gyms have 0 linked trainers, so "popular" effectively means alphabetical. Happy with that as the temporary ranking, or would you rather curate a manual `featured` flag on `gyms` (small migration) so editorial choice wins until trainer-gym links fill in?
