
# REPs Training Academy — `/training-academy`

A directory-style catalogue of qualifications and CPD courses that training providers have submitted for REPs endorsement. Mock data only — no backend, no auth, no forms. Every course card links out to the provider's own course URL in a new tab.

## Route

- **File:** `src/routes/training-academy.tsx`
- **URL:** `/training-academy`
- Own `head()`: title, description, og:title, og:description (no og:image — dark hero, no cover art in this pass).
- Add to main nav (marketing header) as "Academy".

## Page structure (top → bottom)

1. **Hero** (dark, `HeroOverlay` + `MarketingHeroEyebrow`)
   - Eyebrow: "REPs Endorsed"
   - H1: "The REPs Training Academy"
   - Lede: One sentence — endorsed qualifications and CPD from vetted training providers, in one place.
   - Two chips: "Ofqual-regulated where applicable" · "Endorsed by REPs"

2. **Filter bar** (sticky under hero on desktop, `top-[72px]`)
   - Profession (PT, Group ex, Strength, Yoga, Pilates, Nutrition, Online coaching)
   - Level (Level 2, Level 3, Level 4, CPD short course)
   - Delivery (Online, Blended, In-person)
   - CPD points (Any, 5+, 10+, 20+)
   - Provider (multi-select from mock list)
   - Search input (title / keyword)
   - "Reset" ghost button
   - All client-side filtering over the mock array. `useState` only.

3. **Results grid** — 3 cols desktop / 2 md / 1 mobile
   - `CourseCard` (new component, `rounded-[18px]`, flat, no shadow):
     - Provider logo (small, top-left) + provider name
     - "REPs Endorsed" pill (emerald status token, top-right)
     - Course title (H3, `BlockHeading` scale trimmed to card size)
     - One-line summary
     - Meta row: Level · CPD points · Duration · Delivery
     - Price (from £)
     - Primary CTA: "View course →" — `<a href={provider_url} target="_blank" rel="noopener noreferrer">`
   - Empty state via shadcn `Empty` when filters return zero.

4. **"What REPs endorsement means" explainer** (one section, dark panel)
   - 3-column bullet grid: Verified provider · Assessed syllabus · Ongoing review
   - Small print: "REPs endorsement is not accreditation. Where a course is Ofqual-regulated, that is stated on the card."
   - Secondary CTA for providers: "Get your course endorsed" → `/training-academy/apply` (out of scope this pass; link to `#` with a note in code).

5. **FAQ** (`MarketingFaq`, 5 Qs)
   - What is a REPs endorsement?
   - How is it different from Ofqual regulation?
   - How do you vet providers?
   - Do endorsed courses count toward Verified status?
   - I'm a provider — how do I apply?

6. **`FinalCta`** — "Browse endorsed courses" / "Endorse your course".

## Mock data

New file: `src/lib/training-academy.ts`

```ts
export type AcademyCourse = {
  id: string;
  title: string;
  summary: string;
  provider: { name: string; slug: string; logoText: string }; // logoText = initials placeholder
  profession: "pt" | "group" | "strength" | "yoga" | "pilates" | "nutrition" | "online";
  level: "L2" | "L3" | "L4" | "cpd";
  cpdPoints: number;
  durationLabel: string;   // "12 weeks", "1 day", etc
  delivery: "online" | "blended" | "in-person";
  priceFromGBP: number;
  ofqualRegulated: boolean;
  url: string;             // provider's course page — opens in new tab
};
```

Seed ~18–24 courses across ~8 mock providers (e.g. "Origym", "The Fitness Group", "Discovery Learning", "Study Active", "Future Fit", "HFE", "TRAINFITNESS", "Premier Global") — names used illustratively as placeholder mock data. Mix of L2/L3/L4 qualifications + short CPD courses (kettlebells, pre/post-natal, nutrition coaching, online coaching, mobility, etc). URLs point to `https://example.com/...` placeholders — real provider URLs get wired later.

## Components to add

- `src/components/academy/CourseCard.tsx`
- `src/components/academy/AcademyFilters.tsx`
- Reuse: `HeroOverlay`, `MarketingHeroEyebrow`, `SectionHeader`, `SectionHeading`, `MarketingFaq`, `FinalCta`, shadcn `Badge`, `Select`, `Input`, `Button`, `Empty`, `Separator`, `ToggleGroup`.

## Out of scope (this pass)

- Provider application form / detail pages
- Real provider data & real URLs
- Course detail pages on REPs (cards link OUT to the provider)
- Backend, DB, RLS, submissions
- Auth-gated "enrol" flows

## Compliance

- Semantic tokens only, no raw hex.
- Radii: cards `18px`, buttons `10px`, inputs `12px`, pills full.
- Buttons flat (no shadows).
- No banned phrases; no CIMSPA reference; use "Ofqual-regulated" / "recognised awarding body".
- No "UK" qualifier in copy.
- Emerald reserved for the "REPs Endorsed" status pill.
- Post-build: Playwright screenshot + contrast check + `bash /tmp/audit.sh`.
