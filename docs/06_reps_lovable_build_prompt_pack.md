# REPs Global Platform - Lovable Build Prompt Pack

## 1. Purpose

This document provides the controlled Lovable prompt sequence for building the REPs Global Platform.

It must be used after the following documents have been approved:

1. `01_REPs_Master_Product_Scope.md`
2. `02_REPs_Visual_Design_System.md`
3. `03_REPs_Page_By_Page_Specification.md`
4. `04_REPs_Database_Schema_And_Data_Model.md`
5. `04_REPs_Mockup_Lock_Source_Of_Truth.md`

The objective is to build the app in Lovable without design drift, feature creep or premature database complexity.

## 2. Locked Visual Source of Truth

The six approved mock-ups are the only visual source of truth:

1. Public Homepage v1: `home_v1.png`
2. Professional Dashboard v1: `dashboard_v1.png`
3. Directory Search Results: `reps_directory_search_results_page.png`
4. Professional Profile Page: `profile_of_fitness_professional_james_carter.png`
5. Login / Signup Page: `fitness_professional_sign_up_page_mockup.png`
6. Admin Dashboard Shell: `platform_overview_dashboard_with_analytics.png`

The six-screen collage previously generated is rejected and must not be used.

## 3. Build Method

The app must be built in this order:

1. Project setup and visual design system
2. Static public homepage
3. Static directory search results page
4. Static professional profile page
5. Static login/signup page
6. Static professional dashboard
7. Static admin dashboard shell
8. Visual QA and design-system tightening
9. Supabase schema phase 2A
10. Auth and roles
11. Public directory functionality
12. Profile claim/edit workflow
13. CRM and bookings
14. Payments
15. Coaching delivery tools
16. Verification/admin workflows
17. Brilliant Directories migration
18. AI layer

Do not skip ahead. Do not connect functionality before the visual shell is approved.

## 4. Global Prompt Rules

Every Lovable prompt in this document must follow these rules:

- Build only what the current prompt requests.
- Do not add unrequested features.
- Do not invent a new theme.
- Do not alter the approved visual direction.
- Do not rebuild already-approved screens unless asked.
- Do not connect live database functionality during Phase 1.
- Use realistic placeholder data only during Phase 1.
- Use REPs as the product name.
- Do not use REPs UK as the main product name.
- Use UK English.
- Use Inter Tight for headings and Inter for body/UI text.
- Use Lucide icons.
- Use the locked REPs colour system.
- Use orange as the primary accent.
- Use dark premium dashboard/admin UI.
- Use white/ivory public marketplace sections.

## 5. Phase 1 - Visual Build Prompts

Phase 1 creates a static high-fidelity visual prototype. No database, authentication, payments, bookings, AI API, live map integration or Brilliant Directories migration should be added.

---

# Prompt 1 - Project Setup and Design System

## Purpose

Create the base Lovable project, route structure, design tokens and reusable layout foundations.

## Copy Box

```text
Build the initial REPs Global Platform frontend shell.

This is Phase 1 only: create static high-fidelity visual screens and reusable UI components using placeholder data. Do not add Supabase, authentication, database tables, payments, booking logic, AI API calls, live maps or migration functionality yet.

Use the approved REPs visual source of truth:

1. home_v1.png
2. dashboard_v1.png
3. reps_directory_search_results_page.png
4. profile_of_fitness_professional_james_carter.png
5. fitness_professional_sign_up_page_mockup.png
6. platform_overview_dashboard_with_analytics.png

The six-screen collage is rejected and must not be used.

Create a premium REPs design system using:

- Inter Tight for headings
- Inter for body and UI text
- Lucide icons
- Dark premium dashboard/admin interface
- White/ivory public marketplace sections
- Black/charcoal surfaces
- Orange primary accent
- Rounded cards
- Subtle borders
- Strong spacing discipline

Use these core colour tokens:

--reps-black: #050608
--reps-ink: #0B0D10
--reps-midnight: #11161D
--reps-panel: #151A21
--reps-panel-soft: #1C232D
--reps-border: #2B333E
--reps-border-soft: #3A4350
--reps-ivory: #F6F1E8
--reps-warm-white: #FFFCF6
--reps-stone: #E6DED2
--reps-charcoal: #1B1C1E
--reps-text: #F7F3EA
--reps-text-soft: #D8DCE2
--reps-muted: #8D96A3
--reps-muted-light: #6D716F
--reps-orange: #F28C38
--reps-orange-dark: #D87322
--reps-gold: #D9B66F
--reps-green: #3CCB7F
--reps-red: #F05D5E
--reps-blue: #5FA8FF

Create these initial routes:

/                    Public homepage
/find-a-professional Directory search results
/professional/james-carter Professional profile page
/signup              Login/signup page
/dashboard           Professional dashboard
/admin               Admin dashboard shell

Create reusable base components for:

- PublicHeader
- PublicFooter
- PublicHeroSearch
- SearchField
- TrustBadge
- StatsStrip
- CategoryCard
- FeaturedProfessionalCard
- DashboardShell
- DashboardSidebar
- DashboardTopbar
- MetricCard
- AdminShell
- AdminSidebar

Do not use generic SaaS styling, purple gradients, neon fitness colours, childish illustrations or a template dashboard style. The app must feel like a premium global professional platform.
```

## Acceptance Criteria

- Routes exist.
- Design tokens exist.
- Public and dashboard visual environments are separated correctly.
- No database or auth has been added.
- The project already feels like REPs, not a generic template.

---

# Prompt 2 - Public Homepage

## Purpose

Build the homepage to match `home_v1.png`.

## Copy Box

```text
Build the public homepage at route `/`.

This page must visually match the approved mock-up `home_v1.png` as closely as possible. Do not reinterpret the design.

Use the REPs visual design system already created. Do not introduce a new theme.

Page structure:

1. Dark premium header
2. Hero section with large headline
3. Search panel
4. Why REPs card
5. Stats strip
6. Explore by Specialism
7. Featured REPs Professionals
8. Supporting lower sections and footer if needed

Header:

- REPs wordmark on the left
- Descriptor: The Register of Exercise Professionals
- Navigation: Find a Professional, How REPs Works, For Professionals, Resources, About REPs
- Right actions: Log in, Join REPs
- Join REPs is orange
- Log in is outlined/dark

Hero:

- Dark black/charcoal background
- Premium gym/professional imagery treatment
- Headline: Find. Trust. Train. Transform.
- Supporting copy: REPs connects you with verified fitness professionals you can trust to help you reach your goals.
- Trust points: REPs Verified, Reviewed & Rated, Trusted Worldwide

Search panel:

- Dark translucent card
- Fields: I’m looking for, Near, Training type
- Search button: Find Professionals
- Popular searches: Personal Trainer, Pilates Instructor, Nutritionist, Strength Coach, Pre & Postnatal, Online Coaching

Why REPs card:

- Title: WHY REPs?
- Items: Professionals are verified, Ongoing CPD & standards, Client reviews you can trust, Your goals. Matched right.

Stats strip:

- 25,000+ Verified Professionals
- 50,000+ Client Reviews
- 120+ Countries Worldwide
- 1M+ Sessions Booked
- 100% REPs Verified

Explore by Specialism:

- Personal Trainer
- Pilates
- Nutritionist
- Strength Coach
- Pre & Postnatal
- Rehab Specialist
- Sports Coach
- Online Coaching

Featured REPs Professionals:

Create four cards:

1. James Carter, Personal Trainer, London, UK, 5.0 (128), In-person & Online
2. Sophie Williams, Pilates Instructor, Manchester, UK, 5.0 (96), In-person & Online
3. Daniel Roberts, Strength Coach, Birmingham, UK, 4.9 (74), In-person
4. Laura Mitchell, Nutritionist, Online, 5.0 (112), Online

Use realistic placeholder imagery. Do not use low-quality stock-photo styling. Keep the same premium dark/white contrast as the mock-up.

Do not add live search functionality yet. Buttons can navigate to placeholder routes only.
```

## Acceptance Criteria

- Visually matches `home_v1.png`.
- Hero/search area is dominant.
- Public marketplace trust is clear.
- Featured professionals match the mock-up structure.
- No live database functionality added.

---

# Prompt 3 - Directory Search Results Page

## Purpose

Build the directory results page to match `reps_directory_search_results_page.png`.

## Copy Box

```text
Build the directory search results page at route `/find-a-professional`.

This page must visually match the approved mock-up `reps_directory_search_results_page.png` as closely as possible.

Use the existing REPs public header, colour system, typography and component styling. Do not introduce a new theme.

Page structure:

1. Dark public header
2. Dark search panel across the top
3. White/ivory content area
4. Left filter sidebar
5. Results heading and sort dropdown
6. Professional result cards

Search panel:

- Fields: I’m looking for, Near, Training type
- Example values: e.g. Personal Trainer, SW1A 1AA, In-person, Online or Both
- Orange CTA: Find Professionals
- Popular searches: Personal Trainer, Pilates Instructor, Nutritionist, Strength Coach, Pre & Postnatal, Online Coaching

Results heading:

- 126 professionals found near SW1A 1AA
- Sort by: Most relevant

Filter sidebar:

- Title: Filter results
- Clear all link
- Distance dropdown: Within 10 miles
- Specialism dropdown: Select specialism
- Training Type checkboxes: In-person, Online, Both
- Availability dropdown: Any day
- Verified status checkbox: REPs Verified only
- Rating cards: 5 stars & up, 4 stars & up, 3 stars & up

Result cards:

Create four result cards:

1. James Wilson
   Personal Trainer
   London, 0.8 miles away
   5.0 (128)
   In-person & Online
   REPs Verified
   Bio: Helping busy professionals build strength, improve fitness and feel their best.
   Chips: Strength Training, Fat Loss, Health & Fitness

2. Sophie Taylor
   Pilates Instructor
   London, 1.2 miles away
   5.0 (96)
   In-person & Online
   REPs Verified
   Bio: Pilates for strength, mobility and long-term wellness. All levels welcome.
   Chips: Pilates, Posture, Core Strength

3. Liam Roberts
   Strength Coach
   London, 1.5 miles away
   4.9 (74)
   In-person
   REPs Verified
   Bio: Build strength, move better and perform at your best.
   Chips: Strength Training, Performance, Muscle Building

4. Priya Sharma
   Nutritionist
   London, 2.1 miles away
   5.0 (112)
   Online
   REPs Verified
   Bio: Science-based nutrition advice to help you build healthy habits and feel your best.
   Chips: Nutrition, Weight Management, Healthy Eating

Each card must include:

- Profile image
- Name
- REPs Verified badge
- Role
- Location/distance
- Rating
- Delivery format
- Short bio
- Specialism chips
- Orange View Profile button
- Save action

Do not add live filtering, maps or database search yet. This is static visual build only.
```

## Acceptance Criteria

- Visually matches the approved search results mock-up.
- Filter sidebar is clear.
- Result cards are premium and easy to scan.
- Search bar remains dominant.
- No live data functionality added.

---

# Prompt 4 - Professional Profile Page

## Purpose

Build the profile page to match `profile_of_fitness_professional_james_carter.png`.

## Copy Box

```text
Build the public professional profile page at route `/professional/james-carter`.

This page must visually match the approved mock-up `profile_of_fitness_professional_james_carter.png` as closely as possible.

Use the existing REPs public header, public marketplace design system and white/ivory page background.

Profile hero:

- Large professional image card on the left
- Profile identity on the right
- REPs Verified badge
- Name: James Carter
- Role: Personal Trainer
- Location: London, UK
- Rating: 5.0 (128 reviews)
- Badges: In-person, Online
- Short intro: Helping busy professionals build strength, move better and perform at their best.
- Primary CTA: Enquire Now
- Secondary CTA: Save Profile

Trust and verification bar:

- REPs Verified, Qualified & insured
- Qualifications Checked, Up to date
- Professional Indemnity, Active until 12 Dec 2025
- CPD Compliant, 18 / 20 pts this cycle

Tabs:

- About
- Services
- Specialisms
- Reviews
- Qualifications
- Availability
- Location

Main content layout:

Left column:

1. About James card
2. Qualifications & Credentials card
3. What Clients Say section

Middle column:

1. Services & Pricing card with three service tiles:
   - Personal Training, From £60 per session
   - Online Coaching, From £120 per month
   - Nutrition Plan, From £40 one-off plan

Right column:

1. Specialisms card
2. Location card with map placeholder
3. Trust & Assurance card

About copy:

I’m a REPs Verified Personal Trainer with over 8 years of experience helping clients achieve real, lasting results. My approach is tailored, supportive and evidence-based, focusing on strength, performance and long-term wellbeing.

Specialisms:

- Strength Training
- Weight Loss
- Muscle Gain
- Functional Fitness
- Lifestyle Coaching
- Posture & Mobility
- Performance Training

Qualifications:

- REPs Level 3 Personal Trainer
- Level 3 Diploma in Personal Training

Trust & Assurance:

- REPs Verified Professional
- Professional Indemnity Insurance
- CPD Compliant
- CPD progress bar at 90%

Do not add real enquiry forms, booking logic, live reviews or database connections yet. This is static visual build only.
```

## Acceptance Criteria

- Visually matches the approved profile mock-up.
- Trust and conversion are clear above the fold.
- Services, specialisms and credentials are easy to scan.
- Page feels like a premium professional profile, not a basic directory listing.

---

# Prompt 5 - Login / Signup Page

## Purpose

Build the auth acquisition page to match `fitness_professional_sign_up_page_mockup.png`.

## Copy Box

```text
Build the login/signup page at route `/signup`.

This page must visually match the approved mock-up `fitness_professional_sign_up_page_mockup.png` as closely as possible.

This is still Phase 1 static visual build. Do not add working authentication, Supabase, OAuth, password reset or account creation logic yet.

Page layout:

- Full dark premium REPs background
- Left-side value proposition
- Right-side large white signup card
- Bottom trust/stat bar
- Top-right sign-in link

Left panel:

- REPs wordmark and descriptor: The Register of Exercise Professionals
- Headline: Your fitness business, clients and professional profile in one place.
- Highlight “in one place.” in orange.
- Supporting copy: Join thousands of exercise professionals who use REPs to grow their business, manage clients and advance their career with confidence.

Benefit list:

1. Verified. Trusted. Recognised.
   Stand out as a verified fitness professional.

2. Grow your business
   Tools to attract clients, manage leads and bookings.

3. Develop your career
   CPD tracking, qualifications and career progression.

4. Trusted worldwide
   The professional standard in fitness across 120+ countries.

Testimonial card:

- 5-star rating
- Quote: REPs has helped me build trust with clients and grow my business. The tools and support are incredible.
- Name: Sophie Williams
- Role: Pilates Instructor

Right signup card:

- Title: Create Your REPs Account
- Subtitle: Join the professional community and take your career further.
- Account type label: I am a
- Three account type cards:
  1. Fitness Professional, PT, Coach, Instructor
  2. Business / Facility, Gym, Studio, Club
  3. Student, Studying Fitness
- Selected state should be Fitness Professional with orange border.

Form fields:

- Full name
- Email address
- Password
- Password helper: Minimum 8 characters with a mix of letters, numbers & symbols.

Primary CTA:

- Create Account

Social buttons:

- Continue with Google
- Continue with Apple

Top-right text:

- Already have an account? Sign in

Bottom trust/stat bar:

- 25,000+ Verified Professionals
- 100% REPs Verified
- 120+ Countries Worldwide
- Trusted by Industry Leaders

Do not connect any auth logic yet. Form submission can be disabled or visual only.
```

## Acceptance Criteria

- Visually matches the approved signup mock-up.
- The page feels premium and secure.
- Professional, business/facility and student pathways are visible.
- No real auth added.

---

# Prompt 6 - Professional Dashboard

## Purpose

Build the professional dashboard to match `dashboard_v1.png`.

## Copy Box

```text
Build the professional dashboard at route `/dashboard`.

This page must visually match the approved mock-up `dashboard_v1.png` as closely as possible.

Use the REPs dark operating-system dashboard design system. Do not use a generic SaaS dashboard theme. Do not create a light dashboard.

This is static visual build only. Do not add real database data, authentication, AI API calls, payments, bookings or client logic yet.

Dashboard shell:

- Dark black/charcoal background
- Fixed left sidebar
- Top search/notification area
- Premium dark cards with subtle borders
- Orange active states
- Orange chart lines and CTAs

Sidebar:

- REPs wordmark
- Descriptor: The Register of Exercise Professionals
- Active item: Dashboard
- Navigation items:
  - Dashboard
  - Clients
  - Calendar
  - Programs
  - Nutrition
  - Check-Ins
  - Messages
  - Leads
  - Payments
  - Reports
  - Content Studio
  - Education & CPD
  - Community
  - Business Tools
  - Settings
- Bottom user card:
  - James Trainer
  - Personal Trainer
  - REPs Level 3
- AI Assistant card at bottom

Top area:

- Welcome back, James 👋
- Here’s what’s happening with your business today.
- Search placeholder: Search clients, leads, programs...
- Notification icon
- Menu/filter icon

Top KPI cards:

1. Monthly Revenue
   £12,480
   +14.3%
   vs last month £10,910

2. Active Clients
   142
   +8
   vs last month 134

3. Client Adherence
   87%
   +5%
   vs last month 82%

4. REPs Professional Score
   942
   Elite
   Top 10% of REPs members

5. Membership Status
   REPs Premium
   Renews 24 May 2025
   Active

6. AI Business Insight
   Your business is performing well
   Button: View insights

Main cards:

1. Today’s Schedule
   - 09:00 PT Session, Sarah Mitchell
   - 11:00 Pilates Class, Group Session
   - 14:00 Online Check-Ins, 8 Clients
   - 17:00 Consultation Call, New Lead: Tom
   - 19:00 Strength Class, Group Session
   CTA: View full calendar

2. AI Business Command Centre
   - Revenue is up 14% this month
   - 3 clients are at cancellation risk
   - 8 check-ins require your review
   - 2 leads are likely to convert today
   Primary CTA: Ask AI
   Secondary CTA: View all recommendations

3. Your Professional Status
   - REPs Verified Member
   - Professional Indemnity Insurance
   - CPD Progress 90%
   - Qualifications 3 Active
   - Endorsements 12
   - Client Reviews 4.9 (128)

Lower cards:

1. Client Performance Overview
   Tabs: Adherence, Retention, Results, Revenue
   Include dark chart placeholder with orange line/area.
   Metrics: Avg Adherence 87%, Retention Rate 93%, Results Achieved 78%, Revenue £12,480.

2. AI Client Alerts
   - Sarah Mitchell, High Priority
   - Mike Johnson, Medium Risk
   - Emma Davis, Medium Risk
   CTA: Go to Check-Ins

3. Lead Pipeline
   - Leads 32
   - Call Booked 18
   - Proposal Sent 11
   - Trial 7
   - Client 5
   Include three lead rows.
   CTA: View all leads

4. Content Studio
   Tabs: Recent, Scheduled, Drafts
   Include content rows for posts, email, video and challenge.
   CTA: Go to Content Studio

Add the bottom compact navigation/action strip and orange floating plus button if it appears in the approved mock-up.

The dashboard must feel like a professional business operating system, not a workout app.
```

## Acceptance Criteria

- Visually matches `dashboard_v1.png`.
- Sidebar, KPIs and card proportions follow the approved mock-up.
- AI Business Command Centre is central.
- Professional status is clearly visible.
- No real backend functionality added.

---

# Prompt 7 - Admin Dashboard Shell

## Purpose

Build the admin dashboard shell to match `platform_overview_dashboard_with_analytics.png`.

## Copy Box

```text
Build the admin dashboard shell at route `/admin`.

This page must visually match the approved mock-up `platform_overview_dashboard_with_analytics.png` as closely as possible.

Use the same premium dark operating-system interface as the professional dashboard, adapted for REPs admin operations. Do not create a separate light admin theme.

This is static visual build only. Do not add real admin functionality, database queries, authentication, verification workflows or migration tools yet.

Admin shell:

- Dark black/charcoal background
- Fixed left sidebar
- Top search/notification/admin area
- Premium dark cards with subtle borders
- Orange active states
- Orange chart lines and CTAs

Sidebar:

- REPs wordmark and descriptor
- REPs Admin label
- Active item: Overview
- Navigation sections:
  - Overview
  - Professionals
  - Members
  - Leads
  - Qualifications
  - CPD & Education
  - Reviews
  - Content Studio
  - Reports
  - Settings
  - System Logs
  - Support Tickets with badge 5
- Bottom admin card:
  - James Admin
  - Super Administrator
  - Online status

Top area:

- Page title: Platform Overview
- Subtitle: Real-time overview of the REPs platform and key operational metrics.
- Search placeholder: Search professionals, members, leads...
- Notification icon
- Help icon
- Admin avatar
- Date range: Last 30 days

Top KPI cards:

1. Total Professionals
   24,892
   +12.4%
   vs last 30 days 22,150

2. Total Members
   156,783
   +8.7%
   vs last 30 days 144,163

3. New Registrations
   1,842
   +15.3%
   vs last 30 days 1,598

4. Total Revenue
   £128,480
   +14.3%
   vs last 30 days £112,480

Main analytics:

1. Registrations Over Time
   - Line chart placeholder with Professionals and Members
   - View full analytics CTA

2. Top Specialisms
   - Donut chart placeholder
   - List: Personal Training, Strength & Conditioning, Pilates, Nutrition, Sports Coaching, Pre & Postnatal, Other
   - View all specialisms CTA

Lower operational cards:

1. Recent Activity
   - Sophie Williams, New professional registration
   - Daniel Roberts, Profile updated
   - Mike Johnson, CPD certificate uploaded
   - Emma Davis, Member verified
   - Tom Harris, New review received

2. Verification Queue
   - Alex Thompson, Personal Trainer, Pending
   - Olivia Parker, Pilates Instructor, Pending
   - James Cooper, Strength Coach, Pending
   - Chloe Martin, Nutritionist, Pending

3. Reviews Pending
   - Laura Mitchell, 4.9
   - Ryan Foster, 4.8
   - Hannah Scott, 4.7
   - Adam Lee, 4.9

4. System Status
   - Website, All systems operational
   - Professional Directory, All systems operational
   - Payment Gateway, All systems operational
   - Email Service, All systems operational
   - Document Storage, All systems operational

Add the orange floating plus button if it appears in the approved mock-up.

The admin dashboard must feel operational, serious and premium.
```

## Acceptance Criteria

- Visually matches the approved admin dashboard mock-up.
- Uses the same dark REPs app shell as the professional dashboard.
- Clearly supports admin operations.
- No real admin/backend functionality added.

---

# Prompt 8 - Visual QA and Design-System Tightening

## Purpose

Force Lovable to compare all six screens against the approved source of truth and fix drift before moving into database work.

## Copy Box

```text
Review the six Phase 1 screens against the approved REPs mock-ups and tighten the visual implementation.

Approved mock-ups:

1. `/` must match `home_v1.png`
2. `/find-a-professional` must match `reps_directory_search_results_page.png`
3. `/professional/james-carter` must match `profile_of_fitness_professional_james_carter.png`
4. `/signup` must match `fitness_professional_sign_up_page_mockup.png`
5. `/dashboard` must match `dashboard_v1.png`
6. `/admin` must match `platform_overview_dashboard_with_analytics.png`

Fix only visual and component consistency issues.

Check and correct:

- Colour accuracy
- Orange accent usage
- Dark card backgrounds
- Public white/ivory backgrounds
- Typography scale
- Header proportions
- Sidebar proportions
- Card radius
- Card spacing
- Border opacity
- Button states
- Search panel layout
- Result card layout
- Dashboard grid alignment
- Admin dashboard grid alignment
- Mobile responsiveness

Do not add database functionality.
Do not add auth.
Do not add payments.
Do not add bookings.
Do not add AI API calls.
Do not change the product structure.
Do not introduce new routes unless required to support the current screens.

The goal is to make the static visual prototype as close as possible to the approved REPs source of truth.
```

## Acceptance Criteria

- Six static screens are visually aligned.
- Reusable components are consistent.
- There is no generic template drift.
- Ready to move to database schema Phase 2A.

---

## 6. Phase 2 - Database and Auth Prompts

Only begin Phase 2 after Phase 1 visual screens are approved.

---

# Prompt 9 - Supabase Schema Phase 2A

## Purpose

Create the first Supabase schema layer for identity, public directory, profiles, categories, services, reviews and memberships.

## Copy Box

```text
Now begin database Phase 2A for the REPs Global Platform.

Do not redesign or rebuild the UI. Preserve the approved Phase 1 visual screens exactly.

Create the initial Supabase schema using the approved database model. Build only Phase 2A tables:

- profiles
- user_roles
- organisations
- organisation_members
- professional_profiles
- public_profiles
- profession_categories
- professional_profile_categories
- specialisms
- professional_profile_specialisms
- professional_locations
- services
- reviews
- membership_plans
- memberships

Create required enum types:

- user_role
- profile_status
- verification_status
- delivery_mode
- review_status
- subscription_status

Enable row-level security on all tables.

Create initial RLS policies for:

- users reading/updating their own profile
- admins reading/managing operational records
- public users reading only published public profiles
- professionals managing their own professional profile records

Create sensible indexes for:

- profile slugs
- public profile publishing status
- verification status
- location fields
- category/specialism joins
- rating/review count

Seed realistic placeholder data that matches the Phase 1 visual screens:

- James Carter
- Sophie Williams
- Daniel Roberts
- Laura Mitchell
- James Wilson
- Sophie Taylor
- Liam Roberts
- Priya Sharma

Seed categories and specialisms used in the approved UI.

Do not build CRM, bookings, payments, coaching delivery, AI or Brilliant Directories migration tables yet.
```

## Acceptance Criteria

- Phase 2A schema exists.
- RLS is enabled.
- Public profile data can support the homepage, directory and profile page.
- No unrelated feature tables have been added.
- UI remains unchanged.

---

# Prompt 10 - Auth and Role Routing

## Purpose

Add authentication and role-based routing after the initial schema exists.

## Copy Box

```text
Add authentication and role-based routing for the REPs Global Platform.

Preserve the approved visual design. Do not redesign the signup page, homepage or dashboards.

Use Supabase auth.

Account types:

1. Public/client user
2. Fitness professional
3. Business/facility
4. Student
5. Admin
6. Super admin

Use the existing `/signup` page visually. Connect the form to create accounts and insert records into:

- profiles
- user_roles
- professional_profiles where appropriate
- organisations where Business / Facility is selected

After login, route users as follows:

- professional -> `/dashboard`
- organisation owner -> `/dashboard`
- admin -> `/admin`
- super admin -> `/admin`
- client/public user -> public/client placeholder route if available, otherwise `/`

Add login support using the same visual language as the signup page.

Protect `/dashboard` and `/admin` routes.

Do not add CRM, bookings, payments or AI yet.
```

## Acceptance Criteria

- Auth works.
- Role records are created.
- Protected routes work.
- Admin route is not publicly accessible.
- Visual design remains unchanged.

---

## 7. Phase 3 - Public Directory Functionality

---

# Prompt 11 - Connect Public Directory Data

## Purpose

Connect homepage featured professionals, directory results and profile pages to Supabase data.

## Copy Box

```text
Connect the public marketplace screens to Supabase data.

Preserve all approved layouts and styling.

Connect:

- Homepage featured professionals
- Directory search results
- Professional profile page

Use data from:

- public_profiles
- professional_profiles
- profession_categories
- professional_profile_categories
- specialisms
- professional_profile_specialisms
- professional_locations
- services
- reviews

Search page functionality:

- Filter by professional type/category
- Filter by location text for now
- Filter by online/in-person/hybrid
- Filter by specialism
- Filter by verified status
- Sort by most relevant, highest rated, most reviews

Professional profile page:

- Load profile by slug
- Show public profile fields
- Show services
- Show categories
- Show specialisms
- Show reviews
- Show verification status

Do not add live maps yet.
Do not add bookings yet.
Do not add payments yet.
Do not add AI yet.
```

## Acceptance Criteria

- Public pages use real Supabase data.
- Placeholder cards are replaced by seeded data.
- Search and filters work at basic level.
- Layout remains visually identical.

---

# Prompt 12 - Profile Claim and Profile Editor

## Purpose

Allow migrated or seeded professionals to claim and edit their profile later.

## Copy Box

```text
Add the first version of the professional profile editor and claim flow.

Preserve the approved UI style.

Create a protected professional profile editor route:

`/dashboard/profile`

Allow a professional to edit:

- Display name
- Professional title
- Bio
- Profile photo URL/upload placeholder
- Cover image URL/upload placeholder
- Base location
- Online/in-person/hybrid delivery modes
- Categories
- Specialisms
- Public email
- Public phone
- Website and social links
- Services

Add a public profile preview link.

Add a claim profile placeholder flow for imported records:

- Claim profile by email match
- Admin approval required for uncertain matches

Do not build the full Brilliant Directories migration yet.
Do not add payments, bookings or AI yet.
```

## Acceptance Criteria

- Professionals can edit public-facing profile fields.
- Profile changes update public profile display where appropriate.
- Claim flow structure exists but does not yet import BD data.

---

## 8. Phase 4 - CRM, Bookings and Payments

---

# Prompt 13 - Leads and CRM Phase

## Purpose

Add leads and basic CRM functionality.

## Copy Box

```text
Add leads and CRM functionality for professionals.

Preserve the approved dashboard visual style.

Create tables if not already created:

- leads
- lead_notes
- lead_activities

Create routes:

- `/dashboard/leads`
- lead detail drawer/modal

Lead pipeline stages:

- New
- Contacted
- Call booked
- Proposal sent
- Trial booked
- Won
- Lost

Functionality:

- Create lead manually
- Capture lead from public profile enquiry CTA
- View lead list
- Update lead stage
- Add notes
- Add activity
- Assign follow-up date
- Convert lead to client

Update dashboard Lead Pipeline card to use real data.

Do not add payments, booking calendar or AI yet.
```

## Acceptance Criteria

- Leads can be created and managed.
- Public enquiry creates a lead.
- Lead Pipeline dashboard card uses real data.

---

# Prompt 14 - Clients and Bookings Phase

## Purpose

Add client records and booking calendar foundation.

## Copy Box

```text
Add client records and booking functionality.

Preserve the approved dashboard visual design.

Create tables if not already created:

- clients
- client_health_forms
- bookings
- availability_rules
- blocked_times

Create routes:

- `/dashboard/clients`
- `/dashboard/calendar`

Client functionality:

- Client list
- Client detail page/drawer
- Add client manually
- Convert lead to client
- Store primary goal, contact details and notes
- Client status: active, paused, at risk, completed, cancelled

Booking functionality:

- Calendar/list view
- Create booking
- Link booking to client, lead or service
- Set delivery mode
- Set date/time
- Set status
- Cancel/reschedule booking

Update dashboard Today’s Schedule card to use real bookings.

Do not add payments or AI yet.
```

## Acceptance Criteria

- Clients can be created and viewed.
- Bookings can be created and shown on the dashboard.
- Lead-to-client conversion works.

---

# Prompt 15 - Payments and Memberships Phase

## Purpose

Add payment and subscription foundation.

## Copy Box

```text
Add payments and membership functionality.

Preserve the approved dashboard visual design.

Create or connect tables:

- payments
- membership_plans
- memberships

Create route:

- `/dashboard/payments`

Professional payment features:

- Payment list
- Payment status cards
- Paid this month
- Pending payments
- Failed payments
- Client payment history

Membership features:

- Professional membership status
- Plan name
- Renewal date
- Subscription status

Update dashboard cards:

- Monthly Revenue
- Membership Status
- Payments card if present

Prepare the schema to support Stripe later, but do not connect live Stripe unless explicitly instructed.

Do not add coaching delivery or AI yet.
```

## Acceptance Criteria

- Payment records exist and display correctly.
- Dashboard revenue cards use real payment data.
- Membership status card uses real membership data.

---

## 9. Phase 5 - Coaching Delivery Tools

---

# Prompt 16 - Programmes and Workouts

## Purpose

Add programme builder and workout delivery foundation.

## Copy Box

```text
Add the first version of programmes and workouts.

Preserve the approved REPs dashboard visual style.

Create tables if not already created:

- exercise_library
- programmes
- programme_weeks
- workouts
- workout_exercises
- workout_completions

Create route:

- `/dashboard/programs`

Functionality:

- Exercise library list
- Create exercise
- Create programme
- Assign programme to client
- Add weeks
- Add workouts
- Add exercises to workouts
- Mark workout as completed

Use clean dark dashboard UI consistent with the approved dashboard.

Do not add AI programme writing yet.
```

## Acceptance Criteria

- Professionals can create basic programmes.
- Programmes can be assigned to clients.
- Workout structure supports future AI and client portal.

---

# Prompt 17 - Nutrition and Check-ins

## Purpose

Add nutrition planning and check-in workflows.

## Copy Box

```text
Add nutrition plans and check-in functionality.

Preserve the approved REPs dashboard visual style.

Create tables if not already created:

- nutrition_plans
- meal_templates
- food_logs
- check_in_templates
- check_ins
- habits
- habit_logs
- client_metrics
- progress_photos

Create routes:

- `/dashboard/nutrition`
- `/dashboard/check-ins`

Nutrition functionality:

- Create nutrition plan
- Assign to client
- Set calorie and macro targets
- Add meal templates

Check-in functionality:

- Create check-in template
- Assign check-in to client
- Client response placeholder
- Coach review status
- Dashboard due check-ins count

Update dashboard:

- Client Adherence card
- AI Client Alerts placeholder can remain non-AI for now
- Check-ins due counts

Do not add AI summarisation yet.
```

## Acceptance Criteria

- Nutrition plans can be created and assigned.
- Check-ins can be created, submitted and reviewed.
- Dashboard adherence/check-in data can be calculated from real records.

---

## 10. Phase 6 - Admin, Verification and Migration

---

# Prompt 18 - Verification and Admin Operations

## Purpose

Add qualification, insurance, CPD and admin verification workflows.

## Copy Box

```text
Add verification and admin operations.

Preserve the approved admin dashboard visual style.

Create tables if not already created:

- qualifications
- insurance_records
- cpd_records
- verification_events
- admin_notes
- support_tickets
- audit_events

Professional routes:

- `/dashboard/education-cpd`
- qualification upload/edit area
- insurance upload/edit area
- CPD record area

Admin routes:

- `/admin/professionals`
- `/admin/qualifications`
- `/admin/cpd-education`
- `/admin/reviews`
- `/admin/support-tickets`

Admin functionality:

- View pending verification items
- Approve/reject qualifications
- Approve/reject insurance
- Approve/reject CPD
- Add admin notes
- Update verification status
- Log verification events

Update dashboard cards:

- Professional Status
- REPs Professional Score
- Admin Verification Queue
- Admin Reviews Pending
- Admin System Status remains visual unless real status exists

Do not add Brilliant Directories migration yet.
```

## Acceptance Criteria

- Verification workflows exist.
- Admin can approve/reject records.
- Verification events are logged.
- Professional status cards use real records.

---

# Prompt 19 - Brilliant Directories Migration

## Purpose

Create the migration staging system for existing REPsUK.org data.

## Copy Box

```text
Add the Brilliant Directories migration staging system.

Preserve the approved admin dashboard visual style.

Create tables if not already created:

- migration_import_batches
- migration_professional_rows
- migration_field_mappings

Create admin route:

`/admin/migration`

Functionality:

- Upload CSV placeholder/import interface
- Create import batch
- Store raw rows in migration_professional_rows
- Show validation status
- Show validation errors
- Map fields to target tables
- Detect likely duplicate professionals by email/name
- Preview import before applying
- Promote validated rows into professional_profiles and public_profiles
- Mark imported records as claimable

Required migration fields:

- Name
- Email
- Phone
- Profile photo
- Bio
- Location
- Categories
- Specialisms
- Qualifications
- Membership level
- Membership status
- Join date
- Expiry date
- Website
- Social links
- Profile URL
- Reviews/testimonials where available

Do not automatically publish imported profiles without review rules.
Do not overwrite existing profiles without confirmation.
```

## Acceptance Criteria

- Migration data lands in staging first.
- Admin can review and validate rows.
- Validated rows can be promoted.
- Claimable profiles can be created.

---

## 11. Phase 7 - AI Layer

---

# Prompt 20 - AI Suggestions Foundation

## Purpose

Add the AI suggestions system without giving AI uncontrolled authority.

## Copy Box

```text
Add the first AI suggestions foundation for the REPs Global Platform.

Preserve the approved dashboard and admin visual design.

Create tables if not already created:

- ai_suggestions
- ai_logs

AI must be assistive, reviewable and auditable.

Do not allow AI to make irreversible changes without user approval.

Professional AI features:

- AI Business Insight suggestions
- Lead prioritisation suggestions
- Client risk alerts
- Check-in summary suggestions
- Follow-up draft suggestions
- Content Studio suggestions

Dashboard updates:

- Connect AI Business Insight card to ai_suggestions
- Connect AI Client Alerts card to ai_suggestions
- Add review/dismiss/apply states

Admin AI features:

- Platform quality suggestions
- Verification queue prioritisation suggestions
- Duplicate profile detection suggestions

Log AI usage in ai_logs.

Do not add AI programme writing or nutrition AI yet.
```

## Acceptance Criteria

- AI suggestions can be created, reviewed, dismissed and applied.
- AI logs are stored.
- AI is visibly useful but controlled.

---

# Prompt 21 - AI Programme, Nutrition and Check-in Assistants

## Purpose

Add advanced AI assistant features for coaching delivery.

## Copy Box

```text
Add advanced AI assistant features for programmes, nutrition and check-ins.

Preserve the approved REPs dashboard visual design.

AI must remain assistive and require user approval before applying changes.

Add AI assistant features:

1. AI Programme Writer
   - Inputs: client goal, experience, injuries/limitations, available days, equipment, duration
   - Output: draft programme structure
   - User must approve before programme is saved

2. AI Nutrition Assistant
   - Inputs: client goal, calorie target, dietary preferences, restrictions, schedule
   - Output: draft nutrition plan and meal ideas
   - User must approve before nutrition plan is saved

3. AI Check-in Reviewer
   - Summarise submitted check-ins
   - Highlight risks
   - Suggest coach response
   - Suggest programme/nutrition adjustments
   - User must approve before sending or applying

4. AI Follow-up Assistant
   - Draft follow-up messages for leads and clients
   - User must approve before sending

Store all outputs in ai_suggestions and log usage in ai_logs.

Do not add computer vision form analysis yet.
Do not add wearable integrations yet.
```

## Acceptance Criteria

- AI can draft coaching assets.
- User approval is required.
- AI outputs are auditable.
- Existing coaching tables are updated only after approval.

---

## 12. Final QA Prompt

# Prompt 22 - Full Platform QA and Hardening

## Purpose

Review the complete build for visual consistency, security, permissions and feature boundaries.

## Copy Box

```text
Run a full QA and hardening pass across the REPs Global Platform.

Do not redesign the product.
Do not add new features.
Do not change the approved visual direction.

Check visual consistency against the six approved mock-ups:

1. home_v1.png
2. dashboard_v1.png
3. reps_directory_search_results_page.png
4. profile_of_fitness_professional_james_carter.png
5. fitness_professional_sign_up_page_mockup.png
6. platform_overview_dashboard_with_analytics.png

Check:

- Routes
- Layout consistency
- Component reuse
- Dark dashboard styling
- Public marketplace styling
- Orange accent consistency
- Mobile responsiveness
- Loading states
- Empty states
- Error states
- Form validation
- RLS policies
- Auth route protection
- Admin route protection
- Client/professional data separation
- Public/private profile separation
- Payment status handling
- Migration safety
- AI approval flows
- Audit logging

Produce a clear list of issues fixed and any remaining risks.

Do not remove features unless they are broken, duplicated or outside the approved scope.
```

## Acceptance Criteria

- App is visually consistent.
- Security boundaries are clear.
- Data permissions are enforced.
- Remaining risks are listed.
- Build is ready for pre-launch testing.

## 13. Prompt Usage Rules

Use these prompts sequentially.

Do not combine multiple phases into a single Lovable prompt.

If Lovable makes a design change that does not match the approved mock-ups, stop and correct the design before continuing.

If Lovable adds functionality too early, ask it to remove or disable that functionality and return to the current phase.

If database schema becomes messy, stop feature building and correct the data model before continuing.

## 14. First Prompt to Use in Lovable

The first prompt to use is **Prompt 1 - Project Setup and Design System**.

Do not start with the database.
Do not start with authentication.
Do not start with payments.
Do not start with AI.

Start with the visual shell and design system.

