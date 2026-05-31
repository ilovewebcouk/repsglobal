# REPs Global Platform — Master Product Scope

> **Source-of-truth override clause**
>
> The approved full-page mock-ups in `src/mockups/` are the locked visual source of truth: `reps_fullpage_home_v1.png`, `reps_fullpage_professional_dashboard_v1.png`, `reps_fullpage_directory_search_results_v1.png`, `reps_fullpage_professional_profile_v1.png`, `reps_fullpage_signup_login_v1.png`, `reps_fullpage_admin_dashboard_v1.png`. They override any earlier written radius, colour or layout guidance where there is a conflict. Older 16:9 mock-up filenames are archived references only and must not drive the build.
>
> **Phase 1 scope:** static high-fidelity screens only. No real auth, database, payments, bookings, AI APIs, live maps or Brilliant Directories migration during Phase 1.


## 1. Product Definition

REPs will become a global fitness professional platform that combines a public-facing professional directory with a complete business operating system for fitness professionals.

The platform must serve two primary audiences:

1. **The public** — people searching for trusted personal trainers, Pilates instructors, sports nutritionists, strength coaches, online coaches and other fitness professionals.
2. **Fitness professionals** — verified professionals who need one platform to attract clients, manage leads, deliver coaching, take payments, track progress, manage education and build their professional reputation.

The product is not simply a directory and not simply a coaching app. It is the infrastructure layer for the fitness industry.

## 2. Core Positioning

**REPs helps the public find trusted fitness professionals and gives those professionals the tools to run, grow and deliver their business from one platform.**

Primary positioning line:

**Find trusted fitness professionals. Run better fitness businesses. One platform.**

Alternative internal positioning:

**REPs is the professional operating system for the fitness industry.**

## 3. Non-Negotiable Build Principles

These principles must guide every Lovable prompt, design decision and technical decision.

1. **Design first, functionality second.** The homepage and dashboard must visually match the approved mock-ups before database or workflow complexity is added.
2. **Do not build everything in one Lovable prompt.** The app must be built in controlled phases.
3. **Do not allow Lovable to invent a different visual style.** Colours, spacing, typography, cards, search layout, dashboard layout and navigation must follow the locked design system.
4. **Build static screens before live data.** The first version must use realistic placeholder data to perfect layout and interaction.
5. **Schema before functionality.** Once the core screens are approved, the database structure must be designed before bookings, payments, CRM, programmes, nutrition, check-ins or AI are connected.
6. **Security before launch.** User roles, permissions and row-level security must be implemented before importing member data or accepting live users.
7. **AI comes after workflows.** AI must enhance clear workflows, not replace missing product structure.
8. **Migration comes after schema approval.** Brilliant Directories data must not be imported until the Supabase data model is stable.

## 4. Visual Source of Truth

The first version of the product must follow the two approved mock-ups:

1. **Public homepage mock-up** — premium public search homepage with hero image, dark/navy interface, large trust-led headline and professional search interface.
2. **Professional dashboard mock-up** — dark operating-system style dashboard with sidebar navigation, KPI cards, AI insights, revenue, client adherence, professional status, schedule, alerts and business intelligence.

The app must feel premium, minimal, modern and authoritative. It should not feel like a generic fitness app, template marketplace or dated membership directory.

## 5. Product Architecture

The platform will have four main areas:

### A. Public Marketplace

The public marketplace allows people to search, compare, verify and contact or book fitness professionals.

Core pages:

- Public homepage
- Directory search results
- Professional profile page
- Category landing pages
- Location landing pages
- Public reviews
- Public booking/enquiry flow

Core features:

- Search by location or postcode
- Search by profession type
- Search by online or in-person delivery
- Filters for specialisms, qualifications, reviews, availability and verified status
- Premium professional profiles
- Verified badges
- Reviews and ratings
- Enquiry and booking CTA
- Featured professionals
- Trust indicators

### B. Professional Platform

The professional platform allows fitness professionals to run their business.

Core pages:

- Professional dashboard
- Leads and CRM
- Clients
- Bookings/calendar
- Payments
- Programmes
- Exercise library
- Nutrition plans
- Check-ins
- Messages
- Reviews
- CPD and qualifications
- Profile editor
- Settings

Core features:

- Business overview dashboard
- Lead pipeline
- Client records
- Session scheduling
- Payment tracking
- Programme builder
- Nutrition planner
- Weekly check-ins
- Progress tracking
- Automated follow-ups
- AI insights
- Professional status dashboard
- Public profile management

### C. Client Portal

The client portal allows clients to receive coaching, complete check-ins and track progress.

Core pages:

- Client home
- Today’s workout
- Nutrition plan
- Habit tracking
- Check-in submission
- Progress photos
- Measurements
- Messages
- Payments/subscription status

Core features:

- Daily task view
- Workout access
- Video demonstrations
- Food and nutrition guidance
- Check-in forms
- Progress tracking
- Messaging with coach
- Payment visibility

### D. REPs Admin

The admin area allows REPs to manage the marketplace, professionals, memberships, verification and platform operations.

Core pages:

- Admin dashboard
- Professionals
- Public profiles
- Qualifications
- CPD records
- Insurance records
- Reviews
- Leads/bookings
- Payments/subscriptions
- Content/categories
- Migration tools
- Support/admin notes

Core features:

- Approve and manage professionals
- Verify qualifications
- Manage membership status
- Moderate reviews
- Manage categories and specialisms
- Import Brilliant Directories data
- View revenue and platform usage
- Manage support issues

## 6. Phase 1 Build Scope — Visual Replica

Phase 1 is purely visual. No real database functionality should be added yet.

Build these screens first:

1. Public homepage
2. Directory search results page
3. Professional profile page
4. Professional dashboard
5. Admin dashboard shell

Phase 1 success criteria:

- The homepage visually matches the approved mock-up direction.
- The dashboard visually matches the approved dashboard mock-up direction.
- The public search experience is clear and premium.
- The UI feels like one coherent global platform.
- No off-brand colours, generic SaaS components or unrelated visual styles are introduced.

## 7. Phase 2 Build Scope — Design System Lock

After Phase 1 screens are approved, create the reusable design system.

Required design tokens:

- Colours
- Typography
- Spacing
- Border radius
- Shadows
- Card styles
- Button styles
- Form inputs
- Badges
- Sidebar navigation
- Top navigation
- Search components
- Profile cards
- Dashboard cards
- Empty states
- Loading states
- Mobile breakpoints

The design system must support:

- Dark dashboard interface
- Light/public marketing sections
- Premium orange/gold accent colour
- Professional trust badges
- Clear marketplace search components

## 8. Phase 3 Build Scope — Data Architecture

Only after the visual direction is approved should the database be created.

Required tables:

- users
- roles
- professional_profiles
- public_profiles
- organisations
- staff_users
- services
- specialisms
- locations
- qualifications
- insurance_records
- cpd_records
- memberships
- subscriptions
- leads
- clients
- bookings
- payments
- programmes
- workouts
- exercises
- nutrition_plans
- check_ins
- messages
- reviews
- content_posts
- admin_notes
- migration_imports

## 9. Phase 4 Build Scope — Authentication and Permissions

Required user roles:

- Public visitor
- Client
- Fitness professional
- Business owner
- Staff coach
- REPs admin
- Super admin

Permissions must prevent users from accessing data they do not own or manage.

No live member data should be imported until authentication, roles and row-level security are correctly implemented.

## 10. Phase 5 Build Scope — Public Marketplace Functionality

Build the public directory after the profile schema is ready.

Required functionality:

- Search by location/postcode
- Search by profession type
- Filter by online/in-person
- Filter by specialism
- Filter by verified status
- Filter by qualification type
- Professional profile pages
- Enquiry form
- Booking CTA
- Review display
- Featured professionals
- Location/category pages for SEO

## 11. Phase 6 Build Scope — Professional Business Tools

Build professional features in this order:

1. Profile editor
2. Lead inbox
3. CRM pipeline
4. Booking calendar
5. Payments/subscriptions
6. Client records
7. Check-in forms
8. Programme builder
9. Nutrition planner
10. Messaging
11. Reviews
12. CPD/qualification management

## 12. Phase 7 Build Scope — AI Layer

AI must be added only after the core workflows are functional.

Required AI features:

- AI business assistant
- AI lead prioritisation
- AI client risk alerts
- AI check-in summariser
- AI programme writer
- AI nutrition plan assistant
- AI follow-up suggestions
- AI content assistant

AI must always assist the professional. It should not make irreversible changes without user approval.

## 13. Phase 8 Build Scope — Brilliant Directories Migration

Existing REPsUK.org members must be exported, cleaned and imported into the new structure.

Migration fields likely include:

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

Migration process:

1. Export from Brilliant Directories.
2. Clean and normalise CSV data.
3. Map fields to Supabase tables.
4. Import into staging tables.
5. Review and validate.
6. Import into production tables.
7. Invite professionals to claim/update their profiles.

## 14. Phase 9 Build Scope — Payments and Commercial Model

Potential pricing structure:

- Free profile listing
- Verified professional membership
- Pro business tools
- Full business operating system
- Team/studio plan
- Optional marketplace booking fee

Payment features:

- Professional subscriptions
- Client payments
- Programme/package payments
- Invoices/receipts
- Failed payment handling
- Upgrade/downgrade flows

## 15. Phase 10 Build Scope — Launch Readiness

Before launch, the platform must have:

- Approved visual design
- Working public search
- Working professional profiles
- Working authentication
- Secure role permissions
- Imported member data
- Admin management tools
- Payment testing
- Mobile testing
- SEO basics
- Error states
- Empty states
- Privacy policy
- Terms
- Cookie policy
- Data processing approach

## 16. Out of Scope for First Build

The following must not be built in the first Lovable phase:

- Native iOS app
- Native Android app
- Complex wearable integrations
- Computer vision exercise analysis
- Full MyFitnessPal-level food database
- Advanced AI video form correction
- Multi-country tax handling
- Complex franchise or licensing model
- Marketplace dispute handling
- Public social feed

These can be considered later after the core platform is stable.

## 17. Immediate Next Step

The next document to create is:

**REPs Global Platform — Visual Design System**

That document must define the exact colours, typography, components, layout rules and Lovable styling instructions required to recreate the approved homepage and dashboard without drift.

