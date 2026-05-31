# REPs Global Platform - Mock-up Lock and Source of Truth

> **Source-of-truth override clause**
>
> The approved full-page mock-ups in `src/mockups/` are the locked visual source of truth: `reps_fullpage_home_v1.png`, `reps_fullpage_professional_dashboard_v1.png`, `reps_fullpage_directory_search_results_v1.png`, `reps_fullpage_professional_profile_v1.png`, `reps_fullpage_signup_login_v1.png`, `reps_fullpage_admin_dashboard_v1.png`. They override any earlier written radius, colour or layout guidance where there is a conflict. Older 16:9 mock-up filenames are archived references only and must not drive the build.
>
> **Phase 1 scope:** static high-fidelity screens only. No real auth, database, payments, bookings, AI APIs, live maps or Brilliant Directories migration during Phase 1.


## 1. Purpose

This document locks the approved visual source of truth for the REPs Global Platform.

All Lovable prompts, product documentation, design decisions and future implementation work must follow the six approved individual mock-ups listed below.

The six-screen collage previously generated is rejected and must not be used as a design reference.

## 2. Approved Mock-ups

### 1. Public Homepage v1

File name:

`reps_fullpage_home_v1.png`

Purpose:

The public homepage source of truth for the REPs marketplace experience.

Must define:

- Public REPs header
- Dark premium hero
- “Find. Trust. Train. Transform.” headline
- Hero search panel
- Public trust badges
- Right-side why REPs card
- Stats strip
- Explore by Specialism
- Featured REPs Professionals
- White/ivory public content sections
- Orange primary CTA style

### 2. Professional Dashboard v1

File name:

`reps_fullpage_professional_dashboard_v1.png`

Purpose:

The professional dashboard source of truth for the REPs operating-system interface.

Must define:

- Dark application shell
- Left sidebar navigation
- Top search and notification area
- KPI card treatment
- AI Business Command Centre
- Today’s Schedule
- Professional Status
- Client Performance Overview
- AI Client Alerts
- Lead Pipeline
- Content Studio
- Orange accent use
- Premium dark cards and border styling

### 3. Directory Search Results

File name:

`reps_fullpage_directory_search_results_v1.png`

Purpose:

The public professional search results source of truth.

Must define:

- Dark public header
- Dark search panel
- Light results background
- Left filter sidebar
- Search summary
- Sort control
- Professional result cards
- Verified badge styling
- View Profile CTA
- Save action
- Premium marketplace results layout

### 4. Professional Profile Page

File name:

`reps_fullpage_professional_profile_v1.png`

Purpose:

The public professional profile source of truth.

Must define:

- Public header
- Hero image/profile area
- REPs verified badge
- Profile identity block
- Enquire Now CTA
- Save Profile CTA
- Trust and verification bar
- Profile tabs
- About section
- Services and pricing
- Specialisms
- Location card
- Qualifications and credentials
- Trust and assurance panel

### 5. Login / Signup Page

File name:

`reps_fullpage_signup_login_v1.png`

Purpose:

The login/signup and professional acquisition source of truth.

Must define:

- Dark premium background
- REPs wordmark and descriptor
- Left-side value proposition
- Benefit list
- Testimonial card
- Large white signup card
- Account type cards
- Form inputs
- Social sign-in buttons
- Orange Create Account CTA
- Bottom trust/stat bar

### 6. Admin Dashboard Shell

File name:

`reps_fullpage_admin_dashboard_v1.png`

Purpose:

The admin dashboard source of truth.

Must define:

- Dark admin operating-system shell
- REPs Admin sidebar
- Admin top bar
- Platform Overview title
- Admin KPI cards
- Registrations Over Time chart
- Top Specialisms chart
- Recent Activity
- Verification Queue
- Reviews Pending
- System Status
- Admin user block
- Support Tickets indicator

## 2.bis Archived References (must NOT drive the build)

The following older 16:9 mock-up filenames are kept only as archived reference material. They must **not** be used as the visual source of truth for any Lovable build, prompt or documentation:

| Route | Archived filename (reference only) | Locked full-page source of truth |
|---|---|---|
| `/` | `home_v1.png` | `reps_fullpage_home_v1.png` |
| `/dashboard` | `dashboard_v1.png` | `reps_fullpage_professional_dashboard_v1.png` |
| `/find-a-professional` | `reps_directory_search_results_page.png` | `reps_fullpage_directory_search_results_v1.png` |
| `/professional/james-carter` | `profile_of_fitness_professional_james_carter.png` | `reps_fullpage_professional_profile_v1.png` |
| `/signup` | `fitness_professional_sign_up_page_mockup.png` | `reps_fullpage_signup_login_v1.png` |
| `/admin` | `platform_overview_dashboard_with_analytics.png` | `reps_fullpage_admin_dashboard_v1.png` |

If a document, prompt or PR references one of the archived filenames as if it were the source of truth, treat it as a documentation bug and update it to the corresponding `reps_fullpage_*_v1.png` file.

## 3. Rejected Visual Reference

The previously generated six-screen collage is rejected.

It must not be used because it altered:

- Layout
- Spacing
- Typography
- Colour treatment
- Search panel style
- Dashboard card proportions
- Premium visual quality
- Overall product direction

The approved source of truth is the six individual mock-ups only.

## 4. Global Visual Direction

The locked visual direction is:

- Dark premium REPs branding
- Black/charcoal interface
- Orange primary accent
- White/ivory public marketplace sections
- Inter/Inter Tight style typography
- Professional marketplace homepage
- Premium public directory search
- Credential-led professional profiles
- Dark operating-system dashboard/admin UI
- Calm, high-trust, data-led interface

## 5. Product Naming Lock

Use:

**REPs**

Do not use:

**REPs UK**

except where specifically referring to legacy data, current domain infrastructure or migration from REPsUK.org.

## 6. Lovable Prompt Rule

Every Lovable prompt for Phase 1 must include this instruction:

**The six approved mock-ups are the visual source of truth. Recreate their layout, mood, spacing, colour system, typography, card styling, navigation and component hierarchy as closely as possible. Do not introduce a new theme, do not use generic SaaS styling, do not simplify the dashboard into a template, and do not use the rejected six-screen collage as a reference.**

## 7. Phase 1 Build Lock

The first Lovable build must create static high-fidelity screens only:

1. `/` Public homepage
2. `/find-a-professional` Directory search results
3. `/professional/james-carter` Professional profile page
4. `/signup` Login/signup page
5. `/dashboard` Professional dashboard
6. `/admin` Admin dashboard shell

No real authentication, database, payments, bookings, AI API, live maps or Brilliant Directories migration should be added in Phase 1.

## 8. Approval Criteria

The Phase 1 build is only approved when each Lovable screen visually matches its corresponding approved mock-up:

| Route | Approved Mock-up |
|---|---|
| `/` | `reps_fullpage_home_v1.png` |
| `/find-a-professional` | `reps_fullpage_directory_search_results_v1.png` |
| `/professional/james-carter` | `reps_fullpage_professional_profile_v1.png` |
| `/signup` | `reps_fullpage_signup_login_v1.png` |
| `/dashboard` | `reps_fullpage_professional_dashboard_v1.png` |
| `/admin` | `reps_fullpage_admin_dashboard_v1.png` |

## 9. Next Build Step

After this lock, the next operational step is to use **Prompt 1 - Project Setup and Design System** from the Lovable Build Prompt Pack.

The database schema should only be implemented after the Phase 1 visual build has been created and visually approved.

