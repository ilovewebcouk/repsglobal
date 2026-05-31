# REPs doc-sync replacement table

## Brand orange
- `#F28C38` → `#FF7A00` (token: `--brand-orange`)
- `#D87322` → `#E96F00` (token: `--brand-orange-hover`) or `#CC6200` (`--brand-orange-pressed`) depending on context
- Any other ad-hoc orange hex → nearest semantic token, defined in `src/styles.css`

## Radius (9-step: 6 / 8 / 10 / 12 / 16 / 18 / 22 / 24 / 999)
- `14px` → `12px` (input) or `16px` (card) depending on element
- `20px` → `18px` (cards) or `22px` (panels)
- `22px (button)` → `10px (button)`
- `28px` → `24px` (hero) or `22px` (panel)
- `32px` / `--radius-2xl: 32px` → `24px` (hero)
- `rounded-xl` → `rounded-[16px]` or `rounded-[18px]`
- `rounded-2xl` → `rounded-[22px]` or `rounded-[24px]`
- `rounded-3xl` → `rounded-[24px]`

## Component → radius
- Button → 10px
- Input → 12px
- Standard card → 16px
- Result / profile / service / featured card → 18px
- Large panel → 22px
- Hero → 24px
- Pill / chip → full (999)
- xs chrome → 6px, small control → 8px

## Buttons
- "buttons have shadow" / "elevated buttons" → "buttons are flat (`shadow-none`)"

## Rating stars
- "gold stars" / "yellow stars" / `#FFD700` etc. → "brand orange stars" (`--brand-orange`)

## Mock-up filenames
- `home_v1.png` → `reps_fullpage_home_v1.png`
- `signup_v1.png` / `login_v1.png` → `reps_fullpage_signup_login_v1.png`
- `search_v1.png` → `reps_fullpage_directory_search_results_v1.png`
- `profile_v1.png` → `reps_fullpage_professional_profile_v1.png`
- `dashboard_v1.png` (pro) → `reps_fullpage_professional_dashboard_v1.png`
- `admin_v1.png` / admin `dashboard_v1.png` → `reps_fullpage_admin_dashboard_v1.png`
- 6-screen collage → list the six locked full-page mock-ups individually

## Naming
- "REPs UK" → "REPs" (keep only in explicit legacy/migration sections)

## Phase 1 scope
- Any Phase 1 deliverable mentioning auth, DB schema work, payments, bookings, AI, live maps, BD migration, or real search logic → move to "later phase". Phase 1 = static high-fidelity screens only.
