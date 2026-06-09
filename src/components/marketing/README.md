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

#### `HeroHeading`
- **Purpose:** the canonical marketing hero `<h1>`.
- **Where:** `/for-professionals`, `/cpd`, `/compare` heroes — and any future marketing hero.
- **Replaces:** hand-rolled `<h1 className="font-display text-[Npx] ... lg:text-[Npx]">` in route files.
- **Variants:** default size `36 → 46 → 60px`. Per-page hero sizes remain frozen by the locked-page memories, so callers may pass a `className` (twMerge handles the override) to keep the exact visual output. `style`, animation classes, and accent `<span class="text-reps-orange">…</span>` fragments pass through.
- **Don't:** introduce new arbitrary `<h1>` markup in route files — always go through this primitive.

#### `StatValue`
- **Purpose:** display-typography numeric stat (`<span>` semantically — looks like a heading but is a value).
- **Where:** pricing tier figures, dashboard mockup stats, scorecards.
- **Replaces:** hand-rolled `<span className="font-display text-[Npx] font-bold text-white tabular-nums">…</span>` in route files.
- **Variants:** default `28px`. Pass `tabular` for tabular-nums; override size via `className` (e.g. `text-[36px]` for pricing tier figures).
- **Don't:** wrap in `<h2>` / `<h3>` — these are values, not headings.

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

---

## shadcn/ui usage

shadcn/ui is the **accessible-behaviour foundation** for this codebase — nothing more. Use it for the underlying patterns that need keyboard, focus, ARIA and portal/stacking behaviour handled correctly:

- `Button`, `Card`, `Badge`, `Separator`, `Skeleton`, `Spinner`
- `Tabs`, `Accordion`, `Collapsible`
- `DropdownMenu`, `ContextMenu`, `Menubar`, `Command`
- `Dialog`, `Sheet`, `Drawer`, `AlertDialog`, `Tooltip`, `Popover`, `HoverCard`
- `Form` + `FieldGroup`/`Field` (and the form controls: `Input`, `Textarea`, `Select`, `RadioGroup`, `ToggleGroup`, `Checkbox`, `Switch`, `Slider`)
- `Table`, `Empty`, `Alert`

shadcn does **NOT** decide:

- REPs page design or section hierarchy
- Marketing typography (sizes, weights, tracking)
- Colours, radius or spacing rhythm
- Hero composition or product mock-up style
- Pricing structure or tier copy
- Brand voice

**REPs tokens and primitives always win.** The source-of-truth hierarchy is:

1. `/reps-project-source-of-truth`
2. REPs tokens, colours, radius and typography rules (`src/styles.css`)
3. REPs marketing primitives (this directory)
4. REPs reusable section components (this directory)
5. REPs mock-up components (this directory + `src/mockups/`)
6. shadcn/ui — accessible behaviour only
7. Tailwind utilities — approved layout and spacing only

If a shadcn default conflicts with a REPs token, override the default — never the token.

---

## Component catalogue

Every file currently under `src/components/marketing/`, grouped. The internal viewer at `/dev/section-library` renders representative examples; the catalogue here is the complete list.

### Typography & layout primitives

| Component | Purpose |
|---|---|
| `HeroHeading` | Canonical marketing hero `<h1>`. Default 36 → 46 → 60px. |
| `SectionHeading` | Canonical mid-page section `<h2>`. Locked 30 → 40px, pure white. |
| `BlockHeading` | In-block `<h3>` used inside 50/50 product/feature blocks. 28 → 36px. |
| `SectionEyebrow` | Small uppercase kicker above a heading. |
| `SectionHeader` | Composite: `SectionEyebrow` + `SectionHeading` + optional lede. |
| `MarketingHeroEyebrow` | Hero-specific kicker — different rhythm to `SectionEyebrow`. |
| `StatValue` | Semantic `<span>` for numeric stats. Never wrap in heading tags. |
| `SectionDivider` | Hairline divider — utility only. |

### CTA, FAQ and chrome

| Component | Purpose |
|---|---|
| `FinalCta` | Single end-of-page CTA. One per marketing page. |
| `MarketingFaq` | Canonical accordion FAQ block. One per marketing page. |
| `ForProsFaq` | Pre-composed FAQ data set for `/for-professionals` — wraps `MarketingFaq`. |
| `StickyCtaPill` | Sticky bottom CTA pill — global page chrome, not a section. |

### Proof & trust sections

| Component | Purpose |
|---|---|
| `RegisterProof` | Register stat / trust block — verified pros, cities, etc. |
| `VerifySteps` | Locked 3-step verification strip + orange-soft accent banner. |
| `VerificationCard` | Floating verification card overlay — composed into hero compositions. |
| `PressMarquee` | Editorial wordmark marquee (press logos). |
| `PressWordmarks` | Press wordmark SVG data set consumed by `PressMarquee`. |
| `VenueMarquee` / `VenueStrip` / `VenueWordmarks` | Venue logo strips and the wordmark SVG data set. |
| `TestimonialFeature` | Hero testimonial + stat tiles — page-specific data. |
| `TestimonialTriad` | 3-up testimonial row. |

### Product-led sections

| Component | Purpose |
|---|---|
| `ProductBlock` | Canonical 50/50 product/feature block. Alternates left/right. |
| `TrainerToPlatformComposite` | Cinematic trainer photo + REPs UI cards. Three locked compositions only. |
| `HeroDeviceCluster` | Laptop + phone hero device cluster. |
| `AiCommandCentreMock` | AI command-centre product mock-up tile. |
| `DayInTheLife` | Narrative day-in-the-life block. |
| `WeekWithReps` | Narrative "a week with REPs" block. |
| `UseCaseTriad` | 3-up "for X / for Y / for Z" tile row. |
| `ScenarioCards` | Scenario cards block. |
| `ActIntro` | Three-act narrative intro — used on `/for-professionals`. |
| `AICapabilities` | AI capability grid — see `/features/ai`. |
| `PillarTabs` | Tab nav across pillar features — pillar-page level. |

### Mock-up frames

| Component | Purpose |
|---|---|
| `DeviceMockup` (+ `ScaledFrame`) | Generic device frame helpers consumed by hero clusters and `ProductBlock`. |
| `LaptopFrame` | Laptop chrome wrapper. |
| `PhoneFrame` | Phone chrome wrapper. |
| `MockupStage` | Stage/backdrop wrapper for device mockups inside `ProductBlock`. |
| `UiSideBySide` | Page-specific before/after UI comparison. |

### Comparison & pricing

| Component | Purpose |
|---|---|
| `ComparisonStrip` | Short REPs vs competitor strip used on `/compare/*` heros. |
| `ReplacedStackBoard` | "REPs replaces these tools" board. |
| `ReplacesStrip` | Compact "replaces" strip variant. |
| `CompetitorCompare` | Per-competitor comparison grid. |
| `HeadToHead` | Head-to-head comparison block. |
| `VerdictScorecard` | Comparison verdict + scorecard. |
| `PlansLimitsStrip` | Plan-limits comparison strip. |
| `PlansLimitsSummary` | Plan-limits summary block. |
| `HiddenAddOns` | "Hidden add-ons" comparison callout. |
| `CostCalculator` | Cost calculator widget for `/compare/*`. |
| `MigrationChecklist` | Migration checklist used on `/compare/*`. |
| `MethodologyNotice` | "Last checked" + methodology pointer used on every `/compare/*` page. |

---

## Internal section viewer

`/dev/section-library` renders representative examples of the primitives, sections and mock-ups above. It is **internal-only**:

- `noindex,nofollow` on the route
- Not in `Header`, `Footer`, homepage CTAs or `/sitemap.xml`
- Not used to ship features — it is a reference viewer, not a workshop

To add a new entry, add the component to `src/components/marketing/` first, then catalogue it here.

