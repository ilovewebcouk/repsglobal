# 07 — Design System

**Live gallery:** `/dev/section-library` (noindex, internal only).

This file is the single source of truth for how REPs marketing pages look. If something here conflicts with a component, the component is wrong — fix the component, not this file. Always compose pages from existing primitives — never hand-roll section headers, hero eyebrows, FAQ blocks or 50/50s.

---

## 1. Tokens

Defined in `src/styles.css`. Never use raw hex in components.

| Token | Use |
| --- | --- |
| `--brand-orange` (#FF7A00) | Primary brand accent |
| `--brand-orange-hover` (#E96F00) | Hover state |
| `--brand-orange-pressed` (#CC6200) | Active/pressed state |
| `--brand-orange-soft` | Tinted fills (eyebrow pills, icon backgrounds) |
| `--brand-orange-border` | Tinted borders |
| `reps-ink`, `reps-panel`, `reps-border`, `reps-charcoal` | Surfaces |
| `emerald-400/30`, `emerald-500/15`, `emerald-300` | Status-only accent — verified/active/success |

### Radius scale (9 steps)

| px | Use |
| --- | --- |
| 6 | xs chrome |
| 8 | small controls |
| **10** | **buttons** |
| **12** | **inputs** |
| **16** | std cards |
| **18** | result / profile / service / featured cards |
| **22** | large panels |
| **24** | hero |
| 999 (full) | pills |

**Forbidden:** `14px` (except enquire-page profile photo), `20px`, `28px`, `32px`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`.

---

## 2. Type scale (marketing)

| Element | Size | Component |
| --- | --- | --- |
| Hero H1 | 34px → 48px | inline `<h1 className="font-display...">` per hero |
| Hero lede | 16px | inline `<p className="text-[16px] ...">` |
| Section H2 | 30 → 40 | `<SectionHeading>` |
| Section lede | 15–15.5px | inline |
| In-block H3 (50/50) | 28 → 36 | `<BlockHeading>` |
| Eyebrow | 11px, uppercase, tracking-[0.18em] / [0.22em] | `<SectionEyebrow>` / `<MarketingHeroEyebrow>` |

Allowed white opacities: **/45, /55, /70, /80** only.

Hand-rolling `<h2 className="font-display text-[Npx] ... lg:text-[Npx]">` at section-H2 or block-H3 size is **forbidden** — use the primitives.

---

## 3. Primitives

All live in `src/components/marketing/`.

| Primitive | When to use |
| --- | --- |
| `MarketingHeroEyebrow` | Top of every hero, above H1 |
| `SectionEyebrow` | Orange small-caps label above a section H2 |
| `SectionHeading` | Every section H2 |
| `BlockHeading` | Every in-block H3 (e.g. inside a 50/50 block) |
| `SectionHeader` | Eyebrow + heading + optional lede, in canonical rhythm |
| `ProductBlock` | The only allowed 50/50 layout for feature/pillar pages |
| `DeviceMockup` | Real REPs route in a laptop/phone frame inside `ProductBlock.mockup` |
| `MockupStage` | Wraps a `DeviceMockup` with glow + ring + drop shadow |
| `VerifySteps` | 3-step verification strip (Step 1/2/3 cards + banner) |
| `PressMarquee` | Editorial wordmark marquee under the hero |
| `RegisterProof` | 3-up trust card grid |
| `TestimonialFeature` | Quote + stat tiles |
| `FinalCta` | End-of-page CTA — pass copy via props, never rebuild |
| `MarketingFaq` | FAQ accordion in a 920px column |
| `AnnotatedMock` | Anatomy primitive — live REPs route inside a device frame with up to 6 numbered orange callouts + matching legend. Use to teach what each part of a screen does. Never anchor a pill over a face or critical text. |

---

## 4. Heroes

The canonical marketing hero (see `mem://design/marketing-hero-template`):

- Top-anchored copy (`justify-start`, `items-start`, `lg:pt-24`–`lg:pt-28`) — never centered.
- Staggered fade-up animation (560/640ms, 0/80/180/260/340ms delays).
- 3 universal trust chips ("Qualifications verified", "Insurance on file", "Reviews on the record").
- `PressMarquee` below the hero on every marketing page.
- No Ken Burns / no parallax.

Per-page heroes are still hand-built (each has distinct copy and imagery), but every one MUST start with `MarketingHeroEyebrow` and follow the rhythm above.

---

## 5. 50/50 blocks

Use `ProductBlock` with `mockup={{ device, src, title }}`. Examples on `/for-professionals` and `/features/visibility`. The `mockup.src` points at a real REPs route — never a bespoke mockup file.

```tsx
<ProductBlock
  eyebrow="Pillar 1 · Visibility"
  title="Where clients actually find you"
  body="..."
  bullets={["...", "...", "..."]}
  imageLabel="Pro profile"
  mockup={{ device: "laptop", src: "/pro/james-carter", title: "Verified profile" }}
/>
```

---

## 6. CTAs, FAQ, proof strips

- `FinalCta` is the single end-of-page CTA on every marketing page. Pass `heading`, `headingAccent`, `lede`, `primary`, `secondary`. Never rebuild the shell.
- `MarketingFaq` is the only FAQ pattern.
- `VerifySteps`, `PressMarquee`, `RegisterProof`, `TestimonialFeature` are the only trust/proof strips.

---

## 7. Forbidden patterns

- Hand-rolled section H2 / block H3 (use `SectionHeading` / `BlockHeading`).
- Banned radii (`14|20|28|32px`, `rounded-xl/2xl/3xl`).
- Raw hex in components (`#FF7A00`, `#F28C38`, `#D87322`) — use tokens.
- Decorative emerald or any non-orange accent outside status semantics.
- Gold/yellow rating stars — stars are brand orange.
- `shadow-*` on buttons — buttons are flat.
- `space-y-*` — use `flex flex-col gap-*` (shadcn rule).
- Country qualifiers ("UK", "REPs UK", "across the UK") — REPs is global.
- Naming CIMSPA — use "Ofqual-regulated" or "recognised awarding body".

---

## 8. Verify before shipping

Always run the audit script after UI changes:

```bash
bash knowledge://skill/reps-build-compliance/scripts/audit.sh
```

Must exit 0.
