# REPs marketing primitives

This directory is the **single source of truth** for every reusable building block on the REPs marketing surface (`/for-professionals`, `/features/*`, `/cpd`, `/compare/*`, `/specialisms`, profession + city landings, etc.).

**Rule zero:** if you are building a marketing page and you can't see what you need below, ask before hand-rolling. Adding another bespoke heading or panel is how this design system drifts.

Locked memories that govern this layer:

- `mem://design/source-of-truth` — mock-ups, tokens, radius system
- `mem://design/marketing-section-primitives` — type + opacity scale
- `mem://design/final-cta`, `mem://design/trainer-to-platform-composite`, `mem://design/status-colors`
- `mem://design/locked-homepage`, `locked-for-professionals`, `locked-specialisms`, `locked-cities`, `locked-enquire`, `coach-shopfront`, `locked-professions`

---

## Primitives

### Typography & section headers

#### `SectionHeading`
- **Purpose:** the canonical mid-page section H2.
- **Where:** every section heading on every marketing / feature / compare / cpd page.
- **Replaces:** hand-rolled `<h2 className="font-display text-[Npx] ... lg:text-[Npx]">`.
- **Variants:** size locked at `30 → 40px`. Colour is pure white (no orange split on mid-page H2s).
- **Don't:** wrap in another `<h2>`, override the size, or use it for in-block sub-headings (that's `BlockHeading`).

#### `BlockHeading`
- **Purpose:** the H3 used inside 50/50 product / feature blocks.
- **Where:** `ProductBlock`, `PillarFeatureBlock`, `FeaturePageLayout` blocks, any in-block sub-section.
- **Replaces:** hand-rolled `<h3 className="font-display text-[32px]/[36px]/[40px]">`.
- **Variants:** size locked at `28 → 36px`.
- **Don't:** use for section-level headings, use for hero H1s, or override sizes.

#### `SectionEyebrow`
- **Purpose:** small uppercase eyebrow label above a heading.
- **Where:** every section that needs a kicker.
- **Replaces:** ad-hoc `<p className="uppercase text-[11px] tracking-[0.2em]">`.
- **Variants:** orange or muted (per component API).

#### `SectionHeader`
- **Purpose:** composite of `SectionEyebrow` + `SectionHeading` + optional lede.
- **Where:** the default way to open a section. Reach for this before composing the three primitives yourself.

#### `MarketingHeroEyebrow`
- **Purpose:** the hero-specific kicker (slightly different styling to a section eyebrow).
- **Where:** every hero on a marketing page.
- **Replaces:** bespoke hero kicker markup.

---

### Page sections

#### `ProductBlock`
- **Purpose:** the canonical 50/50 product / feature block (copy on one side, media on the other, alternating).
- **Where:** `/for-professionals` 5 pillars, every `/features/*` capability block.
- **Replaces:** hand-rolled `<section><div className="grid lg:grid-cols-2">...</div></section>` with bespoke headings.
- **Variants:** `align="left" | "right"`, media slot (image / device / composite).
- **Don't:** wrap your own H3 — pass the heading via props so it goes through `BlockHeading`.

#### `TrainerToPlatformComposite`
- **Purpose:** cinematic trainer photo + REPs UI cards emanating from the scene.
- **Where:** as the media slot of `ProductBlock` when the story is "REPs supports the trainer".
- **Variants:** `card-trail` | `device-and-stats` | `single-hero`.
- **Replaces:** the retired `CinematicCardStack` and any one-off cinematic mock-up.
- **Don't:** add a fourth composition, swap in a different aspect ratio, or float more than the documented cards.

#### `HeroDeviceCluster`
- **Purpose:** device cluster used in hero positions (laptop + phone, layered).
- **Where:** marketing hero media slots.
- **Replaces:** hand-built `<DeviceMockup>` arrangements per route.

#### `AiCommandCentreMock`
- **Purpose:** the AI command-centre product mock-up tile.
- **Where:** `/features/ai`, AI sections.
- **Replaces:** ad-hoc AI screenshots.

#### `UseCaseTriad`
- **Purpose:** 3-up tile row for "use cases" / "for X / for Y / for Z".
- **Where:** any marketing page that needs a quick three-way split.

#### `WeekWithReps`
- **Purpose:** narrative "a week with REPs" block.
- **Where:** `/for-professionals`, day-in-the-life sections.
- **Replaces:** bespoke timelines.

#### `ReplacedStackBoard`
- **Purpose:** "REPs replaces these tools" board.
- **Where:** comparison + value-prop sections.

#### `PillarTabs`
- **Purpose:** tab nav for switching between pillar features.
- **Where:** `/for-professionals`, feature index pages.

#### `ComparisonStrip`
- **Purpose:** short comparison strip (REPs vs competitor in 1 row).
- **Where:** `/compare/*` hero / inline value strips.

#### `VerifySteps`
- **Purpose:** the 3-step "how verification works" strip.
- **Where:** every page that mentions verification.
- **Replaces:** any bespoke 3-step component.

#### `RegisterProof`
- **Purpose:** register stat / trust block ("X verified pros, Y cities, ...").
- **Where:** `/for-professionals`, homepage, register-related sections.

#### `MarketingFaq`
- **Purpose:** accordion FAQ block.
- **Where:** every marketing page that has an FAQ.
- **Replaces:** raw Radix Accordion + ad-hoc styling.

#### `FinalCta`
- **Purpose:** the single end-of-page CTA.
- **Where:** every marketing / feature / compare / cpd page. Exactly one per page.
- **Replaces:** bespoke "ready to start?" footers.
- **Don't:** rebuild per route — pass copy via props.

#### `PressMarquee`
- **Purpose:** editorial wordmark marquee (press logos).
- **Where:** below marketing heroes when press logos are warranted.

---

## Rules

1. **Never hand-roll section headings in route files.** Use `SectionHeading` or `BlockHeading`. Arbitrary sizes like `text-[32px]`, `text-[36px]`, `text-[40px]`, `text-[44px]`, `text-[48px]` combined with `font-display` / `font-heading` in a route file are forbidden.
2. **50/50 product sections** = `ProductBlock`. Don't build your own grid.
3. **Mock-ups** = shared mock-up components (`HeroDeviceCluster`, `TrainerToPlatformComposite`, `AiCommandCentreMock`, `DeviceMockup`, etc.). Never an empty placeholder panel.
4. **One `FinalCta` per page.** No bespoke footer CTAs.
5. **One `MarketingFaq` per page.** No bespoke accordion.
6. **Eyebrows** = `SectionEyebrow` or `MarketingHeroEyebrow`. Never an ad-hoc uppercase paragraph.
7. **Tokens, not hex.** Brand orange lives in `src/styles.css` only.
8. **Locked memories override everything in this file.** If a locked-page memory says "frozen", do not redesign it.
9. **Tailwind tokens alone do not enforce semantic typography.** A primitive + the audit script is the only thing that catches drift — `text-[40px]` is a valid utility either way.

## Drift audit

Run before committing marketing changes:

```bash
npm run audit:marketing
```

Hard violations fail the script (banned pricing copy, hand-rolled marketing heading sizes in route files, obvious placeholder panels). Soft warnings print but pass.
