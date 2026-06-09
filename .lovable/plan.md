## FatSecret integration — scaffold now, flip on when Premier is live

Goal: build the full server-side wiring + UI hook-up using the same shape as `exercisedb.server.ts`, but keep it gated behind a feature flag so nothing hits FatSecret until your Premier keys arrive. The mock UI on `/features/coaching` stays static today; the moment you paste in keys + flip the flag, the same component starts serving real food data.

### What gets built (Phase A — before keys)

1. **`src/lib/fatsecret.server.ts`** — server-only OAuth 1.0a HMAC-SHA1 signing helper (FatSecret doesn't use bearer tokens; every call must be signed). Wraps:
   - `foods.search.v3` → typed `FoodSummary[]` (id, brand, name, serving, calories preview)
   - `food.get.v4` → typed `FoodDetail` (servings array with kcal/P/C/F/fibre/sugar)
   - `food.find_id_for_barcode` → barcode → food_id
   - 24h in-memory cache, identical pattern to `exercisedb.server.ts`
   - Reads `FATSECRET_CONSUMER_KEY` / `FATSECRET_CONSUMER_SECRET` from `process.env`; throws a clear "not configured" error if missing.

2. **`src/lib/fatsecret.functions.ts`** — `createServerFn` wrappers (`searchFoods`, `getFoodById`, `lookupBarcode`) with Zod input validators. Safe to import from client components.

3. **Feature flag** — `NUTRITION_API_ENABLED` env var (default off). The NutritionMock on `/features/coaching` stays as your locked design today; when flagged on, the search field becomes live.

4. **Better NutritionMock** (separate, optional) — refactor the empty tabs the same way we just did Exercise Library: real search results, sample diary day, macro ring driven from FatSecret data. No "Powered by FatSecret" attribution (per your earlier ExerciseDB instruction).

5. **No DB tables, no auth, no client diary persistence yet** — Phase 1 marketing only. Real user food logging gets its own plan when we leave Phase 1.

### Phase B — when your Premier email arrives

You paste Consumer Key + Secret into `add_secret` (`FATSECRET_CONSUMER_KEY`, `FATSECRET_CONSUMER_SECRET`), I flip `NUTRITION_API_ENABLED=true`, done. No code changes.

### What to put in the FatSecret "Inquiry" box

Paste this — it's what they need to approve a Premier upgrade quickly. Edit the bracketed bits:

> Hi FatSecret team,
>
> I'm building **REPs** ([repsglobal.lovable.app](https://repsglobal.lovable.app)) — a verified register and coaching workspace for personal trainers, online coaches and fitness studios. We're launching in the UK first and want to use the Platform API to power the nutrition side of our coaching product, replacing the need for our pros' clients to log food in MyFitnessPal.
>
> **Use case:** trainers build macro/meal plans for their clients inside REPs; clients log food against that plan via REPs (web + future mobile). We'd use `foods.search`, `food.get.v4`, autocomplete, food categories and barcode lookup. White-labelled (no FatSecret branding shown to end users), which is why we need Premier rather than Premier Free.
>
> **Markets:** UK at launch, expanding to EU and US within 12 months — happy to start with UK-only data and add regions as we grow.
>
> **Volumes (year 1 estimate):** ~2,000 trainers, ~20,000 active clients, peak ~500k API calls/month.
>
> **Hosting:** serverless edge (Cloudflare Workers), so we need IP-allowlist-free access — another reason Premier is the right tier.
>
> **Company:** [your registered company name + country], [your role]. Happy to sign your standard Premier agreement. Could you send pricing for UK data + a route to add EU/US later?
>
> Thanks,
> [Your name]

That hits every question Premier sales normally come back with (use case, white-label, region, volume, why-not-Basic, company), which usually halves the back-and-forth.

### Files this plan touches

- new: `src/lib/fatsecret.server.ts`
- new: `src/lib/fatsecret.functions.ts`
- edit: `src/components/marketing/coaching/InteractiveMocks.tsx` (NutritionMock — empty tabs → real data when flag is on, design unchanged when off)
- edit: `src/routes/features.coaching.tsx` (only if NutritionMock signature changes)

### Out of scope (call out explicitly)

- Client diary persistence in our DB
- Trainer-built meal plan builder UI
- Photo logging / image recognition (we can add later from Premier — separate plan)
- Any FatSecret branding on the page