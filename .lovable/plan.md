# Stop the drift — extract shared marketing primitives, force /cpd-v2 to use them

You're right. I diffed the two pages line by line. The drift isn't subtle:

| Token | `/specialisms` | `/cpd-v2` |
|---|---|---|
| Hero lede `<p>` | `text-[16px]` | `text-[17px] sm:text-[18px]` |
| Section H2 | `text-[30px] lg:text-[40px]`, `leading-tight`, no tracking | `text-[34px] sm:text-[40px]`, `leading-[1.1]`, `tracking-tight` |
| Section H2 colour | Pure white, no orange word | Orange `<span>` split-phrase on **every** H2 (9 of them) |
| Section eyebrow | Bare `<span>` `text-[11px] uppercase tracking-[0.22em] text-reps-orange` | shadcn `<Badge variant="outline">` pill with `bg-reps-panel` + icon |
| Hero eyebrow | Animated bare-pill with plain orange `<span>` inside | `<Badge>` with `bg-reps-orange-soft` fill |
| White opacity scale | 6 tokens (`/45 /55 /65 /70 /75 /80`) | 9 tokens (`/45 /50 /55 /60 /65 /70 /75 /80 /85`) |
| FAQ | Bare `<Accordion>`, `max-w-[920px]` | Wrapped in Card panel, `max-w-4xl` |
| VerifyStrip | Numbered "Step 1/2/3" cards + accent banner | Plain 3 icon tiles, no steps, no banner |

This is one page diverging from another because I built bespoke markup every time. Fix is to extract `/specialisms`' patterns into shared components and force `/cpd-v2` to consume them. Both pages then change together, by design.

## Plan

### 1. Shared marketing primitives (new files under `src/components/marketing/`)

- **`SectionEyebrow.tsx`** — bare `<span class="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">`. No pill, no background.
- **`SectionHeading.tsx`** — `<h2 class="font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">`. Single white colour, no orange split-word. No `tracking-tight`, no `leading-[1.1]`.
- **`SectionHeader.tsx`** — wraps `SectionEyebrow` + `SectionHeading` + optional lede in the canonical 760-px column with the exact `mt-3` / `mt-4` rhythm `/specialisms` uses.
- **`MarketingHeroEyebrow.tsx`** — the animated border-pill from `/specialisms` hero (bare orange span, no bg-fill). Hero-only variant.
- **`VerifySteps.tsx`** — verbatim extract of `/specialisms` VerifyStrip: numbered Step 1/2/3 cards + the `bg-reps-orange-soft` accent banner closer. Accepts `eyebrow`, `heading`, `steps[]`, `bannerText`.
- **`MarketingFaq.tsx`** — bare `<Accordion>`, `max-w-[920px]`, no Card wrapper. Accepts `eyebrow`, `heading`, `items[]`.

### 2. Refactor `/specialisms` to use them (zero pixel diff)
- Hero eyebrow → `<MarketingHeroEyebrow>` (keep the `Sparkles` icon + label).
- `RegistersBlock`, `VerifyStrip`, `FaqBlock` headers → `<SectionHeader>`.
- `VerifyStrip` body → `<VerifySteps>`.
- `FaqBlock` body → `<MarketingFaq>`.
- Visual regression check after — must match the current screenshot pixel-for-pixel.

### 3. Force `/cpd-v2` onto the same components

For **every** section (`ProofCards`-area, `DevelopmentPassport`, `RegisterProofBand`, `LearningPathways`, `RecognitionStrip`, `CpdDiscovery`, `SpecialistAreas`, `AiRecommendations`, `TrainingProvidersBand`, `FaqBlock`, `VerifyStrip`, `FinalCta`):

- Replace every `<Badge>` eyebrow with `<SectionEyebrow>` (text only, no icon).
- Replace every `<h2>` with `<SectionHeading>` — **delete every orange-span split-word** in those H2s.
- Hero `<h1>`: keep its existing orange phrase (heroes always allow it), but downsize the lede `<p>` from `text-[17px] sm:text-[18px]` → `text-[16px]` to match `/specialisms`.
- Hero eyebrow: swap the shadcn `<Badge bg-reps-orange-soft>` for `<MarketingHeroEyebrow icon={GraduationCap}>Education & CPD</MarketingHeroEyebrow>`.
- VerifyStrip → `<VerifySteps>` with REPs verification triad (Identity / Insurance / CPD on the public record), Step 1/2/3 + banner.
- FaqBlock → `<MarketingFaq>`.

### 4. Lock the opacity scale
- Allowed body-text greys: `text-white/80` (primary body), `text-white/70` (secondary body), `text-white/55` (meta/labels), `text-white/45` (de-emphasised micro). That's it.
- Sweep `/cpd-v2` and rewrite every `/50`, `/60`, `/65`, `/75`, `/85` to the nearest allowed value.

### 5. Lock the font-size scale (matches `/specialisms`)
- Hero lede: `text-[16px]`
- Section lede: `text-[15px]` or `text-[15.5px]` only (no `text-[16px]` paragraphs outside hero)
- Card titles: `text-[15px]`–`text-[18px]` `font-display font-bold`
- Card body: `text-[13.5px]`–`text-[14px]`
- Sweep `/cpd-v2` for `text-[16px]`/`text-[17px]`/`text-[18px]` paragraphs outside the hero and downsize.

### 6. Audit + verify
- Run `/tmp/audit.sh` — must remain clean.
- `grep` `/cpd-v2.tsx` for `<Badge.*variant="outline".*uppercase` → must return zero hits (all moved to `SectionEyebrow`).
- `grep` `/cpd-v2.tsx` for `<span class="text-reps-orange">` inside an `<h2>` → must return zero hits.
- `grep` `text-white/(50|60|65|75|85)` in `/cpd-v2.tsx` → must return zero hits.
- Compare `/specialisms` before/after — pixel-identical.
- Compare `/cpd-v2` before/after — section headers, FAQ and VerifyStrip now read as the same component as `/specialisms`.

### 7. Memory
After this lands, save `mem://design/marketing-section-primitives` recording that:
- `SectionEyebrow`, `SectionHeading`, `SectionHeader`, `MarketingHeroEyebrow`, `VerifySteps`, `MarketingFaq` are the canonical marketing primitives.
- No new marketing page may hand-roll a section header, hero eyebrow, FAQ block or verify-strip.
- Allowed white-opacity scale: `/45 /55 /70 /80` only.
- Allowed body font sizes: hero lede `16px`; section lede `15`/`15.5px`; card body `13.5`/`14px`.

## Out of scope
- No copy changes other than removing orange split-words from H2s.
- No new sections, no image changes.
- `/for-professionals` is not touched this pass — it gets the same primitives on its next dedicated pass.
- Sticky in-page nav and cross-link strip stay removed.

## Files
- New: `SectionEyebrow.tsx`, `SectionHeading.tsx`, `SectionHeader.tsx`, `MarketingHeroEyebrow.tsx`, `VerifySteps.tsx`, `MarketingFaq.tsx` (all under `src/components/marketing/`).
- Edited: `src/routes/specialisms.tsx`, `src/routes/cpd-v2.tsx`.
- New memory: `mem://design/marketing-section-primitives` + index entry.
