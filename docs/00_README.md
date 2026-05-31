# REPs Documentation Index

> **Source-of-truth override clause**
>
> The approved full-page mock-ups in `src/mockups/` are the locked visual source of truth: `reps_fullpage_home_v1.png`, `reps_fullpage_professional_dashboard_v1.png`, `reps_fullpage_directory_search_results_v1.png`, `reps_fullpage_professional_profile_v1.png`, `reps_fullpage_signup_login_v1.png`, `reps_fullpage_admin_dashboard_v1.png`. They override any earlier written radius, colour or layout guidance where there is a conflict. Older 16:9 mock-up filenames are archived references only and must not drive the build.
>
> **Phase 1 scope:** static high-fidelity screens only. No real auth, database, payments, bookings, AI APIs, live maps or Brilliant Directories migration during Phase 1.

## Documents

| # | Document | Purpose |
|---|---|---|
| 01 | [Master Product Scope](./01_reps_master_product_scope.md) | Product vision, audiences, Phase 1 boundaries |
| 02 | [Visual Design System](./02_reps_visual_design_system.md) | Tokens, radius scale, components, Tailwind mapping |
| 03 | [Page-by-Page Specification](./03_reps_page_by_page_specification.md) | Per-route layout and content rules |
| 04 | [Database Schema and Data Model](./04_database_schema_and_data_model.md) | Reference schema — **deferred to post-Phase-1** |
| 05 | [Mock-up Lock and Source of Truth](./05_reps_mockup_lock_source_of_truth.md) | Locked full-page mock-ups + archived 16:9 list |
| 06 | [Lovable Build Prompt Pack](./06_reps_lovable_build_prompt_pack.md) | Per-screen Lovable build prompts |

## Final approved tokens (canonical)

**Brand orange**

```css
--reps-orange:        #FF7A00;
--reps-orange-hover:  #E96F00;
--reps-orange-dark:   #CC6200;
--reps-orange-soft:   rgba(255, 122, 0, 0.12);
--reps-orange-border: rgba(255, 122, 0, 0.35);
```

`#F28C38` and `#D87322` are retired and must not appear anywhere.

**Radius scale**

```css
--reps-radius-xs:      6px;
--reps-radius-sm:      8px;
--reps-radius-button:  10px;
--reps-radius-input:   12px;
--reps-radius-card:    16px;
--reps-radius-card-lg: 18px;
--reps-radius-panel:   22px;
--reps-radius-hero:    24px;
--reps-radius-pill:    999px;
```

Component mapping (full table in `02_reps_visual_design_system.md` §8):

| Component | Radius |
|---|---:|
| Checkboxes / micro chrome | 6px |
| Small / compact controls | 8px |
| Buttons, filter chips | 10px |
| Inputs, search fields, selects | 12px |
| KPI cards, standard dashboard cards, admin metric cards | 16px |
| Directory result / profile / service / featured cards | 18px |
| AI insight, search panel, signup card, large panels | 22px (signup may extend to 24px) |
| Hero image panels, large image containers | 24px |
| Badges, chips, pills | 999px |

Forbidden anywhere: `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-[14px]`, `rounded-[20px]`, `rounded-[28px]`, `rounded-[32px]`.

## Naming

- Product name is **REPs**.
- `REPs UK` may be referenced only for legacy data, current domain infrastructure, or Brilliant Directories migration — never as the active product name in UI, prompts or specs.

## Implementation mirror

Code-level tokens live in [`src/styles.css`](../src/styles.css). Project memory mirrors this at `mem://design/source-of-truth`. All three must agree.
