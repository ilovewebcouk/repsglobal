# Design-system pass — full

Goal: make REPs visually coherent across every marketing page by (a) fixing what's broken now, (b) giving us a single dev-only gallery of every reusable block, (c) auditing existing pages so nothing hand-rolls headings/sections, and (d) writing the rules down once in `docs/`.

Scope this pass: **marketing pages only** (`/`, `/for-professionals`, `/features/*`, `/professions/*`, `/in/*`, `/cpd`, `/pricing`, `/specialisms`, comparison pages, FAQ). Directory/profile/dashboard/forms are out of scope — separate pass later.

---

## 1. Fix the broken preview (must come first)

The current preview is throwing two runtime errors:

- `500 on /src/components/marketing/BlockHeading.tsx` — file is imported (by `/features/visibility` and others per memory) but missing/broken.
- `Failed to load /src/routes/dev.section-library.tsx` — referenced in `routeTree.gen.ts` but file doesn't exist.

Steps:
1. Read `src/components/marketing/SectionHeading.tsx` to match conventions, then (re)create `BlockHeading.tsx` per the locked spec: in-block H3, 28px → 36px at `lg`, `font-display`, pure-white headline, no orange split. Export typed `BlockHeading({ children, className })`.
2. Create the new route file in step 2 below, which clears the routeTree error.

Verification: preview loads, no console 500s, `/features/visibility` H3s render.

---

## 2. Build `/dev/section-library` (the gallery)

New route `src/routes/dev.section-library.tsx`:

- `head()` sets `<meta name="robots" content="noindex,nofollow">` and a `<title>` like "Section Library — REPs (internal)".
- No nav link from anywhere user-facing. Reachable only by typing the URL.
- Top of page: small banner explaining the rules (use these primitives, never hand-roll, link to `docs/07_design_system.md`).
- Sticky in-page nav (reusing the same pattern as `/specialisms`) with anchors to each group.

Sections rendered, each with a heading, a one-line "when to use", and a live example:

1. **Headings & eyebrows**
   - `MarketingHeroEyebrow` (with and without icon)
   - `SectionEyebrow` (orange small-caps)
   - `SectionHeading` (H2, 30→40)
   - `BlockHeading` (H3, 28→36)
   - `SectionHeader` (eyebrow + heading + lede composite)
2. **Heroes**
   - Marketing hero template (top-anchored copy + 3 trust chips + `PressMarquee`) — single live instance using placeholder copy.
3. **50/50 blocks**
   - `ProductBlock` with `DeviceMockup` laptop (real `/pro/james-carter` iframe)
   - `ProductBlock` with `DeviceMockup` phone (real `/c/james-wilson`)
   - `ProductBlock` with image variant
4. **Trust / proof strips**
   - `VerifySteps`
   - `PressMarquee`
   - `RegisterProof` (from `/for-professionals`)
   - `TestimonialFeature` stat tiles
5. **CTAs**
   - `FinalCta` with sample copy
6. **FAQ**
   - `MarketingFaq` with 3 sample items
7. **Status accents**
   - Verified badge using the locked emerald triplet
   - "What NOT to do" — short red-bordered callouts showing forbidden patterns (decorative emerald, hand-rolled `<h2 className="text-[40px]">`, `rounded-2xl`, gold rating stars). Pure documentation, not used in product.

No new components are introduced in this route — it only *renders* the existing primitives. If a section is missing a primitive (e.g. trust chips aren't yet a component), flag it under "Remaining work" in the response rather than inventing one.

---

## 3. Audit existing marketing pages, refactor any hand-rolling

Run `rg` across `src/routes/` and `src/components/marketing/` for these violations:

- `<h2 className="font-display text-\[`  → should be `SectionHeading`
- `<h3 className="font-display text-\[`  → should be `BlockHeading`
- `rounded-xl|rounded-2xl|rounded-3xl|rounded-\[14px\]|rounded-\[20px\]|rounded-\[28px\]|rounded-\[32px\]` (14px allowed only at the documented enquire-page exception)
- Raw orange hex (`#FF7A00`, `#F28C38`, `#D87322`) in components
- `space-y-` (shadcn rule — use `gap-*`)
- Hand-rolled FAQ disclosures instead of `MarketingFaq`
- Hand-rolled hero eyebrows instead of `MarketingHeroEyebrow`

For each hit, swap to the primitive. Do NOT touch locked pages' structure — only swap hand-rolled atoms for primitives (this is what the lock allows). If a swap requires a structural change, list it under "Remaining work" and leave the code alone.

Scope of files to audit (marketing only):
- `src/routes/index.tsx`
- `src/routes/for-professionals.tsx`
- `src/routes/features.*.tsx`
- `src/routes/professions.$profession.tsx`
- `src/routes/in.$location.tsx`
- `src/routes/cpd.tsx`
- `src/routes/pricing.tsx`
- `src/routes/specialisms.tsx`
- `src/routes/compare.*.tsx`
- `src/routes/faq.tsx`
- everything under `src/components/marketing/`

---

## 4. Write `docs/07_design_system.md`

One file, ~300 lines max, structured as:

1. **Tokens** — orange scale, surfaces, radius scale, status emerald. Link to `src/styles.css`.
2. **Type scale** — H1 (hero), H2 (`SectionHeading`), H3 (`BlockHeading`), lede sizes (hero 16px, section 15–15.5px), allowed white opacities (/45 /55 /70 /80).
3. **Primitives** — table of every marketing primitive, its location, when to use it, when NOT to use it.
4. **Heroes** — the canonical marketing hero template (top-anchored, staggered fade-up, 3 trust chips, `PressMarquee`).
5. **50/50 blocks** — `ProductBlock` + `DeviceMockup` is the only allowed pattern for feature pages.
6. **CTAs / FAQ / proof** — `FinalCta`, `MarketingFaq`, `VerifySteps`, `PressMarquee`.
7. **Forbidden patterns** — hand-rolled headings, banned radii, raw hex, decorative emerald, gold stars, button shadows, country qualifiers.
8. **Link** — "See live: `/dev/section-library`" at the top.

Mirrors memory rules so a fresh session can read this file and be in sync without loading every `mem://` doc.

---

## 5. Closing

After steps 1–4:
- Run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` — must exit 0.
- Reply with: files fixed, primitives swapped, audit result, link to `/dev/section-library` and `docs/07_design_system.md`.

Out of scope this pass (call out, don't do):
- Directory / profile / dashboard / forms gallery
- Iframe → static screenshot migration for `DeviceMockup`
- Any new primitives (e.g. trust-chip component) — list as "Remaining work"
