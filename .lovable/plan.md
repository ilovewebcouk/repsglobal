## /features/visibility — thorough polish & QA pass

Page is structurally locked and audit-clean on radii / hex / shadows / mock-up references. This pass fixes concrete issues found in code + responsive review, without restructuring sections.

### 1. Compliance fixes (token + opacity scale)

The marketing primitives memo locks white opacities to `/45 /55 /70 /80` only. Four off-scale usages need to snap to the allowed scale.

| File | Line | Current | Fix |
| --- | --- | --- | --- |
| `features.visibility.tsx` | 276 | `text-white/75` (hero lede) | `text-white/80` |
| `features.visibility.tsx` | 380 | `text-white/85` (Problem "after" list) | `text-white/80` |
| `features.visibility.tsx` | 488 | `text-white/65` (Discovery card body) | `text-white/70` |
| `AnnotatedMock.tsx` | 78 | `text-white/65` (legend body) | `text-white/70` |

Also sweep for any `/60 /50 /40 /90` introduced elsewhere on this page; none currently — keep clean.

### 2. Responsive QA — fixes to land

These are concrete defects, not redesigns:

- **TierComparison table** (line 711, 719): `grid-cols-[1fr_120px_120px]` is ~360px minimum but lives inside an 18px-padded card. On <420px viewports the right columns clip / squeeze. Wrap the table in `overflow-x-auto` and add `min-w-[420px]` to the inner grid so the row scrolls horizontally on small mobile while staying intact ≥sm.
- **SegmentsSection tab list** (line 652): 7 pill triggers wrap to 3 rows on mobile and look ragged. Add `overflow-x-auto` + `flex-nowrap` + `pb-1 -mx-6 px-6` so the row becomes a single horizontal scroll strip on mobile, keeps wrap on lg.
- **AnnotatedMock pins on mobile**: `% x/y` are anchored to a tiny device frame at 390px and pins risk landing on faces / text. Add a mobile-only fallback: hide pins under `sm:` (`hidden sm:inline-flex` on the `<span>`) and keep the numbered legend below. Pins return on tablet+.
- **AnnotatedMock layout**: on lg keep `1.1fr / 0.9fr`. On <lg the legend already stacks below the mock — verify after the change above that the numbered legend reads as the primary explanation on mobile.

### 3. Copy pass

Targeted edits, no rewrites:

- **Hero H1** ("trusted fitness professionals.") — current is good; no change.
- **Problem "after" closing line** (387–391): tighten the em-dash sentence to one line — `"Most fitness software helps you manage clients after they sign up. REPs makes you visible before they choose who to contact."` (drops the redundant "strategic difference" frame).
- **Discovery lede** (460) — drop the double "professionals": `"Search, compare and contact suitable pros with more confidence — filtered by what actually matters."`
- **Reviews lede** (564) — already strong, keep.
- **SEO section trailing sentence** (625–628) — pull it up into the SectionHeader `lede` slot or remove the duplicate `<p>`; right now it reads as orphan microcopy under a single mock.
- **FAQ answer #1** (140) — keep the no-promise framing; trim trailing clause: `"…a top slot. A complete, verified profile with real reviews is consistently more discoverable than an empty one."` (already there; OK).
- Banned-phrase scan: clean. No `UK`, `CIMSPA`, `flat plan`, `booking fee`, `15%`, gold/yellow stars. Hero gradient uses `rgba(255,122,0,…)` which is the brand-orange RGB inside a radial gradient — token form isn't expressible in `radial-gradient` CSS, so this stays as-is per existing pattern on other locked marketing pages.

### 4. Mobile + tablet screenshot QA

After (1)–(3) land, capture full-page screenshots at the two missing breakpoints to verify nothing else regresses:

- 390×844 (mobile) — Segments tab strip scrolls; TierComparison row scrolls; AnnotatedMock pins hidden, legend reads cleanly; hero H1 doesn't overflow.
- 820×1180 (tablet) — Discovery + Reviews 2-col stack readable; AnnotatedMock pins land on correct UI regions of the laptop mock; TierComparison stays single-row.

Desktop (1391 current) already approved.

### 5. Post-flight

- Re-run `bash /tmp/audit.sh` — must exit 0 (the only existing FAIL is the pre-existing 14px on the enquire page summary card, which is an explicitly allowed exception in the radius memo; not introduced by this pass).
- Confirm in reply: mock-up referenced (`reps_fullpage_professional_profile_v1.png` for the AnnotatedMock anatomy), tokens used (`reps-orange*`, `emerald-status` triplet), radii used (10/16/18/22), audit result.

### Out of scope (banked, per existing memory)

- `PressMarquee` / "As Featured In" — already removed last turn, stays banked until real press.
- Iframe → static screenshot migration for `DeviceMockup` content — tracked as pre-launch task on the locked-for-professionals memo; not blocking this polish pass.
- Any net-new section, AnnotatedMock on a second screen, video, or testimonial carousel — would change the locked 10-section structure.

### Technical changes summary

5 files touched at most:

1. `src/routes/features.visibility.tsx` — 4 opacity swaps, TierComparison overflow wrapper, Segments tab strip overflow wrapper, 2 copy edits (Problem "after" sentence, Discovery lede), SEO trailing-`<p>` reconciliation.
2. `src/components/marketing/AnnotatedMock.tsx` — 1 opacity swap, mobile-only `hidden sm:inline-flex` on the pin spans.

No new components. No new dependencies. No backend.
