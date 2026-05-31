## Lock the 6 full-page mock-ups as source of truth

Save all six attached full-page PNGs into the repo at `src/mockups/` so they're versioned alongside the build and referenced for every visual QA pass going forward. These supersede any prior crops.

- `src/mockups/reps_fullpage_home_v1.png`
- `src/mockups/reps_fullpage_directory_search_results_v1.png`
- `src/mockups/reps_fullpage_professional_profile_v1.png`
- `src/mockups/reps_fullpage_signup_login_v1.png`
- `src/mockups/reps_fullpage_professional_dashboard_v1.png`
- `src/mockups/reps_fullpage_admin_dashboard_v1.png`

Also save a memory rule (`mem://design/source-of-truth`) pinning these as the locked references and listing the route ↔ mockup mapping, so future turns never drift.

## Complete the homepage (`/`) against `reps_fullpage_home_v1.png`

The current `/` covers Hero → Search → Stats → Specialism → Featured Professionals. The locked mock-up has three more sections below Featured Professionals that are missing. Add them in order, using existing design tokens (no new colors), all on ivory background except the final CTA which is dark.

### 1. "How REPs works" section (light grey band)
- Centered header: H2 "How REPs works" + subtitle "Finding the right professional is simple"
- 4 horizontal steps with dotted connector lines between them: **Search** (magnifier) → **Verify** (shield) → **Connect** (users) → **Achieve** (target)
- Each step: large outlined circle icon (~64px), bold title, 2-line description underneath
- Background: very subtle warm-grey/ivory tint to separate from neighboring sections

### 2. "Why trust REPs?" section (ivory)
- Centered header: H2 "Why trust REPs?" + subtitle "We set the standard for fitness professionals"
- 4-up card grid: **Verified Professionals**, **Standards & CPD**, **Client Reviews**, **Global Community**
- Each card: warm-white surface, soft border, small outlined icon top-left, bold title, short body copy
- Equal-height cards, generous padding, matches Featured Pros grid width

### 3. "Are you a fitness professional?" CTA band (dark)
- Full-width rounded dark panel (`reps-panel`) sitting on ivory
- Left: H2 "Are you a fitness professional?" + body copy + orange `Join REPs today` button
- Center: photo of two trainers (reuse/regenerate one hero-style image)
- Right: 5-item checklist with orange check bullets: Get verified and stand out · Build trust with client reviews · Grow your professional reputation · Access resources & CPD · Be part of a global community

### 4. Asset
Generate one new image for the pro-CTA band:
- `src/assets/cta-trainers.jpg` — two fitness trainers (man + woman) in black REPs tees, standing confidently against a dark gym background, matching the mock-up's centered figure cutout

### 5. Visual QA
After build, screenshot `/` at 1440 width, compare side-by-side against `src/mockups/reps_fullpage_home_v1.png`, and adjust spacing/typography to match. Verify the existing hero, search, stats, specialism, and featured sections still match.

## Out of scope (Phase 1 rules still apply)
- No auth, no routing changes, no DB, no real search logic
- Other 5 routes are not touched in this pass — homepage approval first, then proceed route-by-route

## Question after approval
Once homepage matches the full-page mock-up, proceed to `/find-a-professional` next?
