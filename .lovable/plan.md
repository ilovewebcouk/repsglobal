## /cpd-v2 — rebuild using shadcn skill + REPs visual system

Two problems with the current `/cpd-v2`:
1. It bypasses the **shadcn skill** — raw `<a>`/`<button>`/`<div>` markup instead of `Button`, `Card`, `Badge`, etc.
2. It bypasses the **REPs design system** — uses ad-hoc `bg-white/[0.03] border-white/10` instead of the semantic tokens (`bg-reps-panel`, `border-reps-border`, `bg-reps-orange-soft`, `text-reps-muted`) that `/for-professionals`, `/specialisms`, `/c/$slug` and every other locked marketing page rely on. It also doesn't reuse the shared marketing components those pages share.

Keep the **content/section order** from the approved v2 plan; rebuild every component against the system.

---

### Rules for the rebuild

- **shadcn skill on**:
  - `Button` (variants: default = orange, outline, ghost, secondary) for every CTA. Icons use `data-icon="inline-end"`. Never raw `<a className="rounded-[10px]…">`.
  - `Card` with full composition (`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`) for proof cards, pathway cards, course cards, providers card.
  - `Badge` (variants `secondary`, `outline`, plus the orange chip pattern used on `/specialisms`) for status pills, "Verified provider", "Preview", filter chips.
  - `Tabs` + `TabsList` + `TabsTrigger` for the "Online / In-person" toggle.
  - `Select` + `SelectGroup` + `SelectItem` for the discovery filter dropdowns (visually present but `disabled` — still keep proper composition).
  - `Accordion` (already correct) for FAQ.
  - `Avatar` + `AvatarFallback` for the passport mockup persona.
  - `Progress` for the CPD cycle bar.
  - `Separator` instead of borders where appropriate.
  - `Alert` for the "Preview — illustrative examples" note.
  - `Tooltip` for credential explainers where used.
  - Spacing with `gap-*`, never `space-y-*`. `size-*` for square dimensions.

- **REPs tokens only** (match `/for-professionals`, `/specialisms`):
  - Backgrounds: `bg-reps-ink`, `bg-reps-panel`, `bg-reps-orange-soft`
  - Borders: `border-reps-border`, hover `border-reps-orange-border`
  - Text: `text-white`, `text-reps-muted`, `text-reps-orange`
  - Buttons: `bg-reps-orange hover:bg-reps-orange-hover`
  - Radius map per memory: button `rounded-[10px]`, std card `rounded-[16px]`, large card `rounded-[18px]`, panel `rounded-[22px]`. No `rounded-xl/2xl/3xl`, no `rounded-[14px]` outside the photo-shape exception.
  - No `bg-white/[0.03]`, `border-white/8`, `text-white/65` etc. anywhere on this page.

- **Reuse shared marketing components** so the page reads as one product:
  - **Hero**: match the `for-professionals` / `specialisms` hero pattern (same chip → H1 → sub → CTAs → trust strip → optional `PressMarquee`). Keep the `cpd-tutor-moment` editorial photo as the bg.
  - **Pathway cards** → render via `ProductBlock` (the 5-pillar component already used on `/for-professionals`). One ProductBlock per pathway, OR a tighter `Card` grid using the same visual recipe — pick `ProductBlock` so the rhythm matches the For-Pros page.
  - **Specialism areas** → mirror the `SpecialismSection` chip pattern from `/specialisms` (orange-soft chips, `QualCard`-style explainers if relevant).
  - **Register/proof strip** → drop in `RegisterProof` (already used on /for-pros) between Passport and Pathways.
  - **Testimonial** → one `TestimonialFeature` block between AI Recommendations and Training Providers, with a quote from a member about CPD/profile credibility.
  - **Sticky CTA** → `StickyCtaPill` for "Join REPs" on scroll, same as `/for-professionals`.
  - **FAQ** → use `ForProsFaq`-style component (or keep local Accordion but wrap in the same card surface treatment used on `/for-professionals` so it matches visually). Prefer wrapping FAQs in the same panel treatment used elsewhere.

- **Section-by-section component swaps in `src/routes/cpd-v2.tsx`**:
  1. `Hero` — Buttons via shadcn `Button` (default orange + outline), trust pills via `Badge variant="outline"`. Pull layout from for-pros hero.
  2. `ProofCards` — 4× `Card` with `CardHeader>CardTitle+CardDescription`, icon inside a `bg-reps-orange-soft` square.
  3. `DevelopmentPassport` — 50/50 grid. Right column = `ProfessionalDevelopmentMockup` rebuilt with `Card`, `Avatar+AvatarFallback`, `Badge`, `Progress`, `Separator`, all on `bg-reps-panel border-reps-border rounded-[22px]`.
  4. `RegisterProof` — drop-in shared component.
  5. `LearningPathways` — `ProductBlock` (or matching Card grid) using `bg-reps-panel` cards, orange-soft icon tiles, "See courses" `Button variant="link"` with `data-icon`.
  6. `CpdDiscovery` — filter row: `Select` for Category/Delivery/Points/Level/Provider/Specialism; `Tabs` for Online/In-person. Course grid: `Card` with `CardHeader`, `Badge` for "Verified provider"/level/points/format, `CardFooter` with `Button variant="outline" disabled`. `Alert variant="default"` underneath with the "Preview — illustrative" note.
  7. `SpecialistAreas` — chip grid using orange-soft `Badge` and small icon, mirrors `/specialisms` styling. Footer note via `Alert` or muted text.
  8. `AiRecommendations` — left copy, right `Card` "Suggested for you" panel using `Badge` for the Preview pill, three `RecRow` items rebuilt as `Card`-flavoured rows with `bg-reps-panel`. Wrap in a `Tooltip` explainer on "Preview".
  9. `TestimonialFeature` — shared component, one member quote on CPD lifting profile credibility.
  10. `TrainingProvidersBand` — split layout, right side = `Card` listing "What's coming" with `Check` rows; left = `Button` ("Register interest as a training provider").
  11. `FaqBlock` — keep `Accordion`, wrap in a `Card` panel with `border-reps-border bg-reps-panel rounded-[22px]` so it matches for-pros visually.
  12. `FinalCta` — same dark gradient pattern as the for-pros final CTA, `Button size="lg"`.
  13. Add `StickyCtaPill` at the page root.

- **No new content, no copy rewrites** beyond what's already on v2. This is a presentational/system pass only.

- **Out of scope**: real filtering logic, real AI calls, route changes, touching `/cpd` (kept as-is), adding new shared components to `src/components/marketing/`.

### Verification after build
- Page renders with no console / runtime errors.
- Spot-check radius (no rounded-xl, no white/* arbitrary surfaces).
- Visual sanity-check against `/for-professionals` and `/specialisms` at 1342px and 390px.
