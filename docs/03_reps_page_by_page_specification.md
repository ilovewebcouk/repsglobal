# REPs Global Platform — Page-by-Page Specification

> **Source-of-truth override clause**
>
> The approved full-page mock-ups in `src/mockups/` are the locked visual source of truth: `reps_fullpage_home_v1.png`, `reps_fullpage_professional_dashboard_v1.png`, `reps_fullpage_directory_search_results_v1.png`, `reps_fullpage_professional_profile_v1.png`, `reps_fullpage_signup_login_v1.png`, `reps_fullpage_admin_dashboard_v1.png`. They override any earlier written radius, colour or layout guidance where there is a conflict. Older 16:9 mock-up filenames are archived references only and must not drive the build.
>
> **Phase 1 scope:** static high-fidelity screens only. No real auth, database, payments, bookings, AI APIs, live maps or Brilliant Directories migration during Phase 1.


## 1. Purpose

This document defines the first-build page specification for the REPs global platform. It translates the Master Product Scope and Visual Design System into exact page structures that can be built inside Lovable without design drift.

The first build must create a high-fidelity visual prototype of the platform before live database functionality, authentication, payments, AI or Brilliant Directories migration are added.

## 2. First Build Principle

The first Lovable build must focus on visual precision and product structure only.

Build these pages first:

1. Public homepage
2. Directory search results page
3. Professional profile page
4. Login and signup page
5. Professional dashboard
6. Admin dashboard shell

Use realistic placeholder data throughout. Do not connect a real database during this phase.

## 3. Global Page Rules

### 3.1 Product Name

Use **REPs** throughout the product interface.

Do not use **REPs UK** as the product name in any public navigation, dashboard, page heading or profile interface.

### 3.2 Visual System

All pages must use the REPs Visual Design System.

Mandatory visual rules:

- Use Inter Tight for headings.
- Use Inter for body and UI text.
- Use Lucide icons.
- Use the REPs colour tokens.
- Use dark operating-system styling for dashboards.
- Use warm editorial marketplace styling for public pages.
- Use orange sparingly for primary actions.
- Use gold only for verification, status and trust signals.
- Use rounded cards, subtle borders and refined spacing.
- Avoid generic SaaS themes.
- Avoid bright neon colours.
- Avoid purple gradients.
- Avoid gym-template clichés.

### 3.3 Navigation Model

The platform has three primary navigation environments:

1. **Public website navigation** for visitors searching for professionals.
2. **Professional dashboard navigation** for fitness professionals running their business.
3. **Admin dashboard navigation** for REPs operators managing the platform.

### 3.4 Responsive Behaviour

Every page must be responsive from the first build.

Desktop breakpoint expectation:

- Public content max width: 1240px to 1320px.
- Dashboard uses fixed sidebar and fluid content.

Mobile expectation:

- Public pages stack cleanly.
- Search panels become vertical.
- Filters move to a drawer or bottom sheet.
- Dashboard sidebar becomes a drawer.
- Dashboard cards stack in one column.

## 4. Page 1 — Public Homepage

### 4.1 Route

`/`

### 4.2 Page Purpose

The homepage must communicate that REPs is the trusted place to find verified fitness professionals and the platform that powers professional fitness businesses.

The page must prioritise public search while also creating a clear pathway for professionals to join REPs.

### 4.3 Primary User Intent

A visitor wants to:

- Find a trusted fitness professional.
- Search by professional type, location, training format and goal.
- Understand why REPs professionals can be trusted.
- View categories and featured professionals.
- Know that REPs verifies professionals.

A fitness professional wants to:

- Understand that REPs can help them get discovered.
- See that REPs is also a business operating system.
- Join or sign in.

### 4.4 Page Structure

The homepage must follow this exact section order:

1. Header
2. Hero section with search panel
3. Trust and stats strip
4. Popular professional categories
5. Featured verified professionals
6. How REPs works
7. Why verification matters
8. For professionals CTA
9. Reviews and trust proof
10. Final search CTA
11. Footer

### 4.5 Header Specification

Desktop header:

- Height: 76px.
- Background: transparent over hero or dark `reps-ink`.
- Content max width: 1240px.
- Left: REPs wordmark.
- Centre/right navigation:
  - Find a Professional
  - For Professionals
  - CPD
  - Pricing
  - About
- Right actions:
  - Sign in
  - Join REPs

Header button rules:

- Sign in is a ghost or secondary button.
- Join REPs is orange primary.

Mobile header:

- REPs wordmark left.
- Menu icon right.
- Menu opens full-screen dark drawer.
- Drawer includes all nav links and primary CTAs.

### 4.6 Hero Section Specification

Hero background:

- Use `reps-black` or `reps-ink`.
- Minimum desktop height: 760px.
- Desktop layout: two-column hero.
- Left column: copy and search.
- Right column: cinematic image panel.

Hero content:

Overline badge:

**Verified fitness professionals**

Headline:

**Find. Trust. Train. Transform.**

Supporting copy:

**Search verified personal trainers, Pilates instructors, nutrition professionals and fitness coaches. Compare trusted profiles, check credentials and start with the right professional for your goals.**

Primary hero CTA:

**Search professionals**

Secondary hero CTA:

**Join as a professional**

Hero image direction:

- Premium fitness professional working with a client.
- Clean studio or gym environment.
- Realistic, professional and calm.
- Dark overlay or contained image card.
- Rounded 24px hero image container.
- No aggressive gym posing.
- No influencer aesthetic.

### 4.7 Hero Search Panel Specification

The search panel is the central homepage component.

Panel style:

- Warm white background.
- Rounded 22px (search panel container).
- Large soft shadow.
- Padding: 16px to 20px desktop.
- Sits within hero left column or slightly overlaps the lower hero area.

Desktop field layout:

Four fields plus one button in a single row where space allows.

Fields:

1. **Professional type**
   - Icon: UserRound or Dumbbell
   - Placeholder/value: Personal trainer
   - Dropdown options:
     - Personal trainer
     - Pilates instructor
     - Sports nutritionist
     - Strength coach
     - Online coach
     - Weight management coach
     - Pre and postnatal specialist
     - Older adult fitness specialist
     - Disability and inclusive fitness specialist

2. **Location**
   - Icon: MapPin
   - Placeholder/value: Town, city or postcode
   - Supports online option later

3. **Training format**
   - Icon: Calendar or Activity
   - Placeholder/value: In-person and online
   - Options:
     - In-person
     - Online
     - In-person and online

4. **Goal or specialism**
   - Icon: Target or Sparkles
   - Placeholder/value: Fat loss, strength, Pilates
   - Options:
     - Fat loss
     - Strength
     - Muscle gain
     - Mobility
     - Pilates
     - Nutrition
     - Sports performance
     - General fitness

Search button:

- Label: **Search professionals**
- Icon: Search
- Orange fill.
- Dark text.
- Height: 56px.
- Rounded 10px (button radius).

Mobile search panel:

- Stack fields vertically.
- Full-width orange search button.
- Maintain premium spacing.

### 4.8 Trust and Stats Strip

Section position:

Immediately below hero.

Background:

- Either dark continuation or warm ivory.

Content:

Use four stat cards or inline metrics:

1. **Verified professionals**
2. **Qualifications checked**
3. **Online and in-person coaching**
4. **Public reviews**

Placeholder values:

- 12,000+ professionals
- 40+ specialist categories
- 98% profile completion target
- 24/7 online discovery

Do not use unsupported final claims when real data is connected. These are visual placeholders only.

### 4.9 Popular Professional Categories

Section background:

- `reps-ivory`

Section title:

**Find the right professional for your goals**

Supporting copy:

**Search by profession, training style or specialist support. REPs helps you compare credible professionals before you make contact.**

Category cards:

- Personal Trainers
- Pilates Instructors
- Sports Nutritionists
- Strength Coaches
- Online Coaches
- Pre and Postnatal Specialists
- Older Adult Fitness
- Disability and Inclusive Fitness

Each card includes:

- Icon
- Category title
- One-line description
- Explore link

Card style:

- Warm white card.
- Rounded 22px.
- Subtle border.
- Hover border orange/gold.

### 4.10 Featured Verified Professionals

Section title:

**Featured verified professionals**

Supporting copy:

**Explore trusted professionals with public profiles, specialist services and clear credentials.**

Card layout:

- Desktop: 3 cards per row.
- Tablet: 2 cards per row.
- Mobile: 1 card per row.

Each professional card includes:

- Profile image
- Name
- Professional type
- Location
- Verified badge
- Rating and review count
- Specialism chips
- Online/in-person badges
- Short bio excerpt
- View profile button

Placeholder professionals:

1. **Amelia Carter**
   - Personal Trainer
   - Manchester
   - Strength, Fat Loss, Online Coaching
   - 4.9 rating, 82 reviews

2. **Daniel Brooks**
   - Pilates Instructor
   - London
   - Mobility, Posture, Reformer Pilates
   - 4.8 rating, 64 reviews

3. **Priya Shah**
   - Sports Nutritionist
   - Online
   - Nutrition, Performance, Weight Management
   - 5.0 rating, 51 reviews

### 4.11 How REPs Works

Section title:

**How REPs works**

Use three steps:

1. **Search**
   - Find professionals by location, goal, service type and delivery method.

2. **Compare**
   - Review credentials, verification status, reviews, services and specialisms.

3. **Start**
   - Enquire, book or connect directly with the right professional.

Visual style:

- Three horizontal cards on desktop.
- Stacked cards on mobile.
- Use numbered pills or icons.

### 4.12 Why Verification Matters

Section layout:

- Two-column section.
- Left: copy.
- Right: verification/status card mock-up.

Section title:

**Professional trust should be visible**

Supporting copy:

**REPs profiles are designed to show the information that matters before someone chooses a fitness professional: credentials, membership status, reviews, specialisms and how they deliver their service.**

Verification card items:

- REPs verified
- Qualifications checked
- Insurance status
- CPD progress
- Public reviews

### 4.13 For Professionals CTA

Section background:

- Dark `reps-ink`.

Section title:

**Run your fitness business from the same platform clients use to find you**

Supporting copy:

**REPs gives fitness professionals a trusted public profile, lead generation, bookings, payments, client management, programmes, nutrition tools, check-ins and business intelligence in one place.**

Buttons:

- **Join REPs**
- **View professional tools**

Include a dashboard preview card or dark UI screenshot-style panel.

### 4.14 Reviews and Trust Proof

Section title:

**Trusted by professionals and clients**

Use testimonial cards with placeholder content.

Testimonial structure:

- Quote
- Name
- Role or client type
- Rating

Include both public/client and professional testimonials.

### 4.15 Final Search CTA

Background:

- Warm ivory or dark depending on visual balance.

Headline:

**Start with the right professional**

Supporting copy:

**Search trusted fitness professionals by location, goal and coaching format.**

CTA:

**Search professionals**

### 4.16 Footer

Footer columns:

1. REPs
   - About
   - Contact
   - Trust and verification
   - Reviews

2. Find Professionals
   - Personal trainers
   - Pilates instructors
   - Nutrition professionals
   - Online coaches
   - Strength coaches

3. For Professionals
   - Join REPs
   - Professional tools
   - CPD
   - Pricing
   - Sign in

4. Legal
   - Terms
   - Privacy
   - Cookies
   - Acceptable use

Footer style:

- Dark footer.
- REPs wordmark.
- Muted text.
- Orange hover states.

### 4.17 Homepage Acceptance Criteria

The homepage is approved only if:

- The hero clearly matches the approved mock-up direction.
- The search panel is dominant and premium.
- The page explains public search and professional value.
- The design feels global, trusted and modern.
- The page does not feel like a generic fitness landing page.
- The page does not use REPs UK as the main brand.

## 5. Page 2 — Directory Search Results

### 5.1 Route

`/find-a-professional`

Optional future route patterns:

- `/find-a-professional/personal-trainers`
- `/find-a-professional/pilates-instructors`
- `/find-a-professional/nutritionists`
- `/find-a-professional/location/london`

### 5.2 Page Purpose

The search results page allows the public to compare professionals and move towards viewing a profile, enquiring or booking.

It must feel closer to a premium marketplace than a legacy directory.

### 5.3 Primary User Intent

The user wants to:

- Refine their search.
- Compare professionals quickly.
- Trust that listed professionals are credible.
- View profiles.
- Enquire or book.

### 5.4 Page Structure

The search results page must follow this structure:

1. Public header
2. Search summary area
3. Filter and results layout
4. Professional result cards
5. Optional map/area panel
6. SEO/supporting content block
7. Footer

### 5.5 Search Summary Area

Background:

- Dark or warm ivory depending on final homepage flow.

Title examples:

**Find verified fitness professionals**

Dynamic title examples for later:

- Personal trainers in London
- Online Pilates instructors
- Sports nutritionists near Manchester

Search bar:

Use compact version of homepage search panel.

Fields:

- Professional type
- Location/postcode
- Format
- Goal/specialism

Button:

**Update search**

### 5.6 Results Layout

Desktop layout:

- Left sidebar filters: 280px to 320px.
- Main results column: flexible.
- Optional right map panel for location searches.

Recommended desktop layout:

- 25% filters.
- 75% results.

Mobile layout:

- Search summary at top.
- Filters button opens bottom sheet.
- Results stack vertically.

### 5.7 Filter Sidebar

Filter groups:

1. Professional type
2. Location radius
3. Online or in-person
4. Availability
5. Verified status
6. Qualifications
7. Insurance status
8. Rating
9. Specialisms
10. Languages
11. Price range
12. Accessibility support

Filter style:

- Warm white card.
- Rounded 22px.
- Section headings.
- Checkboxes, chips and sliders where appropriate.
- Clear all filters link.

Default selected filters for visual build:

- Verified professionals
- In-person and online
- 10-mile radius

### 5.8 Results Header

Content:

- Result count
- Current search summary
- Sort dropdown
- View toggle if needed

Example:

**247 verified professionals found**

Subtext:

**Showing personal trainers, Pilates instructors and nutrition professionals available in London or online.**

Sort options:

- Recommended
- Highest rated
- Most reviews
- Nearest
- Recently verified

### 5.9 Professional Result Card

Each result card must show:

- Profile image
- Name
- Verified badge
- Profession type
- Location
- Online/in-person labels
- Rating and reviews
- Short bio excerpt
- Specialism chips
- Qualification preview
- Availability indicator
- View profile CTA
- Enquire CTA

Card style:

- Warm white background.
- Rounded 22px.
- Subtle border.
- Strong but not excessive image.
- Hover state raises card slightly and highlights border.

Example card content:

Name:

**Amelia Carter**

Role:

**Personal Trainer**

Location:

**Manchester and online**

Verification:

**REPs verified**

Rating:

**4.9 · 82 reviews**

Bio excerpt:

**Strength and fat loss coach helping busy professionals build sustainable training routines in-person and online.**

Specialisms:

- Strength
- Fat loss
- Online coaching
- Beginner confidence

CTAs:

- View profile
- Enquire

### 5.10 Map Panel

For first build, map can be visual placeholder only.

Map style:

- Muted dark or light map card.
- Professional pins.
- Rounded 22px.
- Sticky on desktop if included.

Do not integrate a live map in phase 1.

### 5.11 SEO Content Block

At bottom of results page, include an informational content block for future SEO.

Example title:

**Choosing the right fitness professional**

Copy:

**REPs helps you compare professionals by credentials, service type, reviews and delivery method so you can make a more informed decision before enquiring.**

### 5.12 Directory Results Acceptance Criteria

The page is approved only if:

- Results are easy to compare.
- Filtering feels serious and useful.
- Verified status is visible but not overdone.
- The page feels like a premium marketplace, not a legacy directory.
- Mobile filtering is clear.
- Search remains prominent.

## 6. Page 3 — Professional Profile Page

### 6.1 Route

`/professional/:slug`

Example:

`/professional/amelia-carter`

### 6.2 Page Purpose

The professional profile page must combine trust, credentials, reviews and conversion. It should help a visitor decide whether this professional is right for them.

It must feel more credible than a social media profile and more commercially useful than a basic directory listing.

### 6.3 Primary User Intent

The visitor wants to:

- Understand who the professional is.
- Check whether they are verified.
- Review qualifications and specialisms.
- See reviews.
- Understand services and delivery format.
- Enquire or book.

The professional wants to:

- Present their credibility.
- Convert profile visitors into leads.
- Show services and specialisms clearly.

### 6.4 Page Structure

The profile page must follow this structure:

1. Public header
2. Profile hero
3. Trust and verification bar
4. About section
5. Services and packages
6. Specialisms
7. Qualifications and credentials
8. Insurance and CPD status
9. Reviews
10. Locations and availability
11. Content/articles preview
12. Final CTA
13. Footer

### 6.5 Profile Hero

Hero layout:

- Warm ivory page background.
- Large profile header card.
- Left: profile image and key identity.
- Centre: name, role, location, intro.
- Right: CTA panel.

Hero content:

Name:

**Amelia Carter**

Role:

**REPs Verified Personal Trainer**

Location:

**Manchester and online**

Rating:

**4.9 · 82 reviews**

Delivery badges:

- In-person
- Online
- 1-to-1
- Small group

Primary CTA:

**Enquire now**

Secondary CTA:

**Book consultation**

Save action:

**Save profile**

### 6.6 Profile Image and Media

Profile image:

- Professional headshot or coaching action photo.
- Rounded card or circular avatar inside card.
- Clear and premium.

Optional cover image:

- Coaching environment.
- Dark overlay if placed behind text.

No low-quality selfies or aggressive gym posing in placeholder imagery.

### 6.7 Trust and Verification Bar

This must appear directly under the profile hero.

Trust items:

1. REPs verified
2. Qualifications checked
3. Insurance active
4. CPD up to date
5. Reviews verified

Visual style:

- Horizontal card on desktop.
- Stacked compact grid on mobile.
- Gold and green used carefully.
- Each item has icon, label and short status.

### 6.8 About Section

Title:

**About Amelia**

Example copy:

**Amelia helps busy adults build strength, improve confidence and create sustainable training habits. Her coaching combines structured programming, clear accountability and practical support for clients training in-person and online.**

Content rules:

- Short paragraphs.
- Professional, not overly casual.
- Avoid inflated claims.
- Make expertise and approach clear.

### 6.9 Services and Packages

Title:

**Services**

Use pricing/package cards.

Example services:

1. **1-to-1 Personal Training**
   - In-person coaching in Manchester
   - From £55/session
   - CTA: Enquire

2. **Online Coaching**
   - Training plan, check-ins and support
   - From £149/month
   - CTA: Enquire

3. **Strength and Fat Loss Programme**
   - 12-week structured coaching package
   - From £399
   - CTA: View details

Card content:

- Service title
- Short description
- Delivery format
- Price placeholder
- CTA

### 6.10 Specialisms

Title:

**Specialisms**

Use chips or cards:

- Strength training
- Fat loss
- Beginner confidence
- Online coaching
- Habit building
- Lifestyle transformation

### 6.11 Qualifications and Credentials

Title:

**Qualifications and credentials**

Credential card content:

- Qualification name
- Awarding organisation placeholder
- Level where applicable
- Verification status
- Date verified placeholder

Example:

**Level 3 Diploma in Personal Training**

Status:

**Verified by REPs**

### 6.12 Insurance and CPD Status

Title:

**Professional status**

Status cards:

- Insurance: Active
- CPD: Up to date
- Membership: Verified Pro
- Profile completion: 96%

This section reinforces that REPs is a professional platform, not only a public listing.

### 6.13 Reviews

Title:

**Client reviews**

Review summary:

- Average rating
- Review count
- Rating distribution placeholder

Review cards include:

- Reviewer first name or initials
- Rating
- Review text
- Service used
- Date placeholder

Example review:

**Amelia made training feel structured and achievable. The sessions were clear, progressive and easy to follow between appointments.**

### 6.14 Locations and Availability

Title:

**Locations and availability**

Content:

- Primary location
- Areas served
- Online availability
- Session types
- Availability indicator

Example:

- Manchester
- Salford
- Stockport
- Online coaching across the UK and internationally

Future live functionality:

- Calendar availability
- Booking slots
- Consultation scheduling

For first build, use placeholder availability card only.

### 6.15 Content and Articles Preview

Title:

**Insights from Amelia**

Use three article/resource cards:

- How to start strength training with confidence
- What to expect from your first PT session
- Building consistency without extreme dieting

This section supports future SEO and profile authority.

### 6.16 Final Profile CTA

CTA card title:

**Ready to start with Amelia?**

Supporting copy:

**Send an enquiry or book a consultation to discuss your goals, availability and the right coaching option.**

Buttons:

- Enquire now
- Book consultation

### 6.17 Profile Page Acceptance Criteria

The page is approved only if:

- Trust and conversion are both clear.
- Verification is visible above the fold.
- Services are easy to understand.
- Reviews feel credible.
- The page feels more professional than a social profile.
- The page does not feel like a basic directory listing.

## 7. Page 4 — Login and Signup

### 7.1 Routes

`/login`

`/signup`

Optional future routes:

- `/signup/professional`
- `/signup/client`
- `/forgot-password`

### 7.2 Page Purpose

The login/signup experience must separate the public, client and professional pathways clearly.

It must make it obvious that REPs serves both professionals and people looking for professionals.

### 7.3 Login Page Structure

Desktop layout:

- Split screen.
- Left: dark brand panel.
- Right: login form card.

Left brand panel:

- REPs wordmark.
- Headline:

**Your fitness business, clients and professional profile in one place.**

Supporting copy:

**Sign in to manage your profile, leads, clients, bookings, programmes and professional status.**

Right login card:

- Title: **Sign in to REPs**
- Email input
- Password input
- Forgot password link
- Sign in button
- Continue with Google button placeholder
- Link to create account

### 7.4 Signup Page Structure

Signup should ask the user to choose account type first.

Title:

**Join REPs**

Supporting copy:

**Create an account to find a trusted professional or build your professional profile and business tools.**

Account type cards:

1. **I’m looking for a fitness professional**
   - Create a client account to save profiles, enquire and manage bookings.

2. **I’m a fitness professional**
   - Build your verified profile, attract leads and run your coaching business.

3. **I manage a team or studio**
   - Manage multiple professionals, clients, locations and services.

Primary CTA after selection:

**Continue**

### 7.5 Professional Signup Steps Preview

For first build, show a visual stepper only.

Steps:

1. Account details
2. Professional profile
3. Qualifications
4. Services
5. Membership
6. Publish profile

Do not build full onboarding functionality in Phase 1.

### 7.6 Auth Page Visual Rules

- Use dark background with warm form card.
- Keep forms simple and premium.
- Avoid clutter.
- Use orange only for main action.
- Use gold/verified visuals sparingly.

### 7.7 Login/Signup Acceptance Criteria

The page is approved only if:

- It clearly separates public/client/professional intent.
- It feels premium and secure.
- It matches the REPs visual system.
- It does not look like a generic auth template.

## 8. Page 5 — Professional Dashboard

### 8.1 Route

`/dashboard`

Optional future routes:

- `/dashboard/leads`
- `/dashboard/clients`
- `/dashboard/bookings`
- `/dashboard/payments`
- `/dashboard/programmes`
- `/dashboard/nutrition`
- `/dashboard/check-ins`
- `/dashboard/messages`
- `/dashboard/reviews`
- `/dashboard/cpd`
- `/dashboard/profile`
- `/dashboard/settings`

### 8.2 Page Purpose

The professional dashboard is the command centre for a fitness professional’s business.

It must not look like a workout app. It must feel like the operating system for a professional fitness business.

### 8.3 Primary User Intent

The professional wants to:

- Understand business performance.
- See what needs attention today.
- Manage leads and clients.
- Review bookings and payments.
- Track client adherence.
- Maintain professional status.
- Use AI to prioritise action.

### 8.4 Dashboard Shell

Desktop layout:

- Fixed left sidebar: 260px.
- Top bar: 72px.
- Main content: fluid grid.
- Background: `reps-black`.
- Cards: `reps-panel`.
- Borders: `reps-border`.

Mobile layout:

- Sidebar becomes drawer.
- Top bar stays compact.
- Cards stack in a single column.

### 8.5 Sidebar Navigation

Top:

- REPs wordmark.
- Membership badge: Verified Pro.

Navigation is grouped into four labelled sections. Group headers use small uppercase muted labels; section dividers are 1px `--reps-border`.

**Work** — the daily operating surface

1. Dashboard — `/dashboard`
2. Leads — `/dashboard/leads`
3. Clients — `/dashboard/clients`
4. Calendar — `/dashboard/calendar`
5. Bookings — `/dashboard/bookings`
6. Messages — `/dashboard/messages`

**Deliver** — programming and accountability

7. Programmes — `/dashboard/programs`
8. Nutrition — `/dashboard/nutrition`
9. Check-ins — `/dashboard/check-ins`
10. Reviews — `/dashboard/reviews`

**Grow** — visibility, expertise and audience

11. Reports — `/dashboard/reports`
12. Content Studio — `/dashboard/content`
13. Community — `/dashboard/community`
14. CPD — `/dashboard/cpd`
15. Public Profile — `/dashboard/profile`

**Money & Admin**

16. Payments — `/dashboard/payments`
17. Business Tools — `/dashboard/business`
18. Settings — `/dashboard/settings`

Bottom area:

- User avatar
- Name: Amelia Carter
- Role: Personal Trainer
- Help/support link

Active item:

- Dashboard active by default.
- Orange icon or left rail.
- Soft panel background.

Rationale: a flat 13-item list does not scale to a serious business operating system. The four-group structure mirrors the daily workflow of a working professional (work it → deliver it → grow it → bill for it) and matches the information architecture used by leading category competitors.

### 8.6 Top Bar

Left:

- Page title: **Dashboard**
- Small date/status: **Monday, 31 May**

Centre:

- Global search input.
- Placeholder: **Search clients, leads, bookings, programmes...**

Right:

- Ask REPs AI button
- Notifications icon
- Quick create button
- User avatar

Quick create dropdown placeholder options:

- New lead
- New client
- New booking
- New programme
- New check-in

### 8.7 Dashboard Page Grid

Recommended desktop structure:

Row 1:

- Monthly revenue metric card
- Active clients metric card
- Client adherence metric card
- REPs professional score metric card

Row 2:

- AI business insight panel, large centre card
- Today’s schedule card
- Professional status card

Row 3:

- Client performance card
- AI client alerts card
- Lead pipeline card

Row 4:

- Content studio card
- Payment status card
- Recent activity card

### 8.8 KPI Cards

KPI cards must sit at the top of the dashboard.

Metric card 1:

Label:

**Monthly revenue**

Value:

**£8,420**

Trend:

**+14% vs last month**

Mini detail:

**£2,160 pending**

Metric card 2:

Label:

**Active clients**

Value:

**34**

Trend:

**+6 this month**

Mini detail:

**7 online · 27 in-person**

Metric card 3:

Label:

**Client adherence**

Value:

**87%**

Trend:

**4 clients below target**

Mini detail:

**Based on workouts and check-ins**

Metric card 4:

Label:

**REPs score**

Value:

**92**

Trend:

**Verified Pro active**

Mini detail:

**CPD due in 42 days**

### 8.9 AI Business Insight Panel

This must be the central dashboard component.

Title:

**AI business insight**

Subtitle:

**Prioritised actions from your leads, clients and business data.**

Insight content:

1. **Revenue is up 14% compared with last month.**
2. **3 clients are showing cancellation risk.**
3. **8 weekly check-ins require review.**
4. **2 leads are likely to convert this week.**
5. **Recommended action: contact Sarah, Mike and Emma today.**

Actions:

- Review actions
- Draft follow-ups
- Open risk list

Visual style:

- Larger card.
- Dark panel with subtle radial highlight.
- Sparkles or Brain icon.
- Orange primary action.
- Secondary ghost actions.

### 8.10 Today’s Schedule Card

Title:

**Today’s schedule**

Items:

1. **09:00**
   - Emma Clarke
   - PT Session
   - Gym floor
   - Confirmed

2. **11:00**
   - Small group Pilates
   - Studio 2
   - 6 clients
   - Confirmed

3. **14:00**
   - Online check-ins
   - 8 clients due
   - Needs review

4. **17:30**
   - James Patel
   - Consultation
   - Zoom
   - New lead

Actions:

- View calendar
- Add booking

### 8.11 Professional Status Card

Title:

**Professional status**

Status items:

- REPs verified: Active
- Insurance: Active
- CPD: 78% complete
- Qualifications: 4 verified
- Profile completion: 96%
- Reviews: 4.9 average

Action:

**Improve profile**

This card must reinforce the professional authority layer.

### 8.12 Client Performance Card

Title:

**Client performance**

Metrics:

- Workout completion: 84%
- Check-in completion: 91%
- Average adherence: 87%
- Retention risk: 3 clients

Include a simple line or bar chart placeholder.

Chart style:

- Subtle grid.
- Orange primary line.
- Muted secondary line.

### 8.13 AI Client Alerts Card

Title:

**AI client alerts**

Alerts:

1. **Sarah Mills**
   - Plateau detected for 3 weeks.
   - Action: Review nutrition and steps.
   - Severity: Orange

2. **Mike Evans**
   - Missed 3 sessions in 14 days.
   - Action: Send follow-up.
   - Severity: Red

3. **Emma Clarke**
   - Low recovery reported in check-in.
   - Action: Reduce training volume.
   - Severity: Blue

4. **Jack Turner**
   - Payment failed yesterday.
   - Action: Review billing.
   - Severity: Red

Actions:

- View all alerts
- Draft replies

### 8.14 Lead Pipeline Card

Title:

**Lead pipeline**

Pipeline stages:

1. New lead: 12
2. Discovery call: 5
3. Proposal sent: 4
4. Trial booked: 3
5. Ready to start: 2

Include estimated value:

**£4,780 potential monthly revenue**

Actions:

- Open leads
- Add lead

### 8.15 Content Studio Card

Title:

**Content studio**

Content items:

- 3 Instagram posts drafted from client wins
- 1 article suggested for your public profile
- 2 email follow-ups ready to send
- 1 testimonial request recommended

Actions:

- Create post
- Draft email
- View ideas

### 8.16 Payment Status Card

Title:

**Payments**

Items:

- Paid this month: £8,420
- Pending: £2,160
- Failed payments: 2
- Subscriptions active: 21

Actions:

- View payments
- Chase failed payments

### 8.17 Recent Activity Card

Title:

**Recent activity**

Items:

- Priya submitted weekly check-in
- James booked discovery call
- Sarah completed workout 3 of 4
- New review received from Hannah
- CPD reminder generated

### 8.18 Dashboard Acceptance Criteria

The dashboard is approved only if:

- It visually matches the approved dark dashboard mock-up direction.
- It feels like a business operating system.
- AI insights are central and useful.
- Professional status is visible.
- Business, clients, leads and delivery are all represented.
- It does not feel like a generic SaaS dashboard.
- It does not feel like a basic coaching app.

## 9. Page 6 — Admin Dashboard Shell

### 9.1 Route

`/admin`

Optional future routes:

- `/admin/professionals`
- `/admin/verification`
- `/admin/memberships`
- `/admin/directory`
- `/admin/reviews`
- `/admin/payments`
- `/admin/cpd`
- `/admin/migration`
- `/admin/support`
- `/admin/settings`

### 9.2 Page Purpose

The admin dashboard shell gives REPs operators a serious operational interface for managing professionals, verification, memberships, reviews, payments and future migration.

This page is a shell only in Phase 1. No live admin functionality should be implemented yet.

### 9.3 Primary User Intent

REPs admin users need to:

- See platform status.
- Review pending professional verification.
- Manage member profiles.
- Monitor payments and subscriptions.
- Moderate reviews.
- Prepare for Brilliant Directories migration.

### 9.4 Admin Shell Layout

Use the same dark dashboard visual system as the professional dashboard.

Desktop layout:

- Fixed admin sidebar: 270px.
- Top bar: 72px.
- Main content: fluid grid.
- Dark background.
- Dark cards.

### 9.5 Admin Sidebar

Top:

- REPs wordmark.
- Admin badge.

Navigation items:

1. Overview
2. Professionals
3. Verification
4. Memberships
5. Directory
6. Reviews
7. Payments
8. CPD
9. Migration
10. Support
11. Settings

Bottom:

- Admin user avatar
- Role: Super admin
- Help link

### 9.6 Admin Top Bar

Left:

- Page title: **Admin overview**
- Small status: **Platform operations**

Centre:

- Search input.
- Placeholder: **Search professionals, profiles, reviews, payments...**

Right:

- Notifications
- Export placeholder
- Admin avatar

### 9.7 Admin KPI Cards

Top metric cards:

1. **Total professionals**
   - Value: 12,480
   - Detail: 84 added this month

2. **Verified profiles**
   - Value: 8,920
   - Detail: 71% verified

3. **Pending verification**
   - Value: 246
   - Detail: 38 urgent

4. **Monthly recurring revenue**
   - Value: £42,800
   - Detail: +9% month on month

5. **Public searches**
   - Value: 98,420
   - Detail: 14% conversion to profile views

6. **Reviews pending**
   - Value: 32
   - Detail: 8 flagged

Placeholder values must be treated as visual only.

### 9.8 Admin Operational Panels

Panel 1:

**Verification queue**

Columns/items:

- Professional name
- Category
- Submitted date
- Status
- Action

Example rows:

- Amelia Carter · Personal Trainer · Pending qualification review · Review
- Daniel Brooks · Pilates Instructor · Insurance document uploaded · Review
- Priya Shah · Sports Nutritionist · CPD update pending · Review

Panel 2:

**Membership activity**

Items:

- New memberships
- Failed renewals
- Upgrades
- Cancellations
- Expiring memberships

Panel 3:

**Directory quality**

Items:

- Incomplete profiles
- Profiles missing images
- Profiles missing location
- Profiles without services
- Profiles below quality score

Panel 4:

**Migration readiness**

Items:

- Brilliant Directories export pending
- Field mapping required
- Duplicate profile check
- Legacy category cleanup
- Invite-to-claim workflow

### 9.9 Admin Review Moderation Preview

Card title:

**Reviews requiring attention**

Items:

- Flagged review
- New review pending approval
- Professional response reported

Actions:

- Moderate
- Approve
- Escalate

No real moderation functionality in Phase 1.

### 9.10 Admin Acceptance Criteria

The admin shell is approved only if:

- It uses the same premium dark operating-system interface.
- It feels operational, not decorative.
- It clearly supports verification, membership, directory and migration management.
- It does not introduce a separate admin theme.
- It remains a visual shell only in Phase 1.

## 10. Shared Components Required in Phase 1

Lovable must create reusable components for these items.

### Public Components

- PublicHeader
- PublicFooter
- PublicHeroSearch
- SearchField
- TrustBadge
- StatsStrip
- CategoryCard
- FeaturedProfessionalCard
- DirectoryFilters
- ResultCard
- ProfileHero
- VerificationBar
- ServiceCard
- ReviewCard
- CTASection

### Dashboard Components

- DashboardShell
- DashboardSidebar
- DashboardTopbar
- MetricCard
- AIInsightCard
- ScheduleCard
- ProfessionalStatusCard
- ClientPerformanceCard
- ClientAlertCard
- PipelineCard
- ContentStudioCard
- PaymentStatusCard
- RecentActivityCard

### Admin Components

- AdminShell
- AdminSidebar
- AdminMetricCard
- VerificationQueueCard
- MembershipActivityCard
- DirectoryQualityCard
- MigrationReadinessCard
- ReviewModerationCard

## 11. Placeholder Data Rules

Use realistic placeholder data only.

Placeholder data must:

- Look credible.
- Represent different professional types.
- Avoid unsupported real claims.
- Avoid using real people unless deliberately approved.
- Avoid fake regulatory claims.
- Make the interface feel populated enough for visual approval.

Recommended placeholder professional types:

- Personal Trainer
- Pilates Instructor
- Sports Nutritionist
- Strength Coach
- Online Coach
- Pre and Postnatal Specialist
- Older Adult Fitness Specialist
- Disability and Inclusive Fitness Specialist

## 12. Phase 1 Out of Scope

Do not build these in Phase 1:

- Real authentication
- Supabase database
- Payment processing
- Booking functionality
- AI API connections
- Brilliant Directories import
- Live map integration
- Email sending
- SMS sending
- Client portal functionality
- Programme builder functionality
- Nutrition planner functionality
- CPD upload workflow
- Admin approval workflow

These will be specified after the visual screens are approved.

## 13. Lovable Build Control Rules

Every Phase 1 Lovable prompt must include this instruction:

**Build only the requested visual screens and reusable components. Use realistic placeholder data. Do not add database functionality, authentication, payments, AI, booking logic or live integrations unless explicitly requested in a later phase. Follow the REPs Visual Design System exactly and do not introduce a different theme.**

## 14. First Build Success Definition

Phase 1 is complete when the following screens are visually approved:

1. Public homepage
2. Directory search results page
3. Professional profile page
4. Login/signup page
5. Professional dashboard
6. Admin dashboard shell

The output must look like a serious global platform capable of becoming:

- a trusted public marketplace,
- a professional register,
- a business operating system,
- a client delivery platform,
- and a future AI-powered infrastructure layer for fitness professionals.

## 15. Immediate Next Step

The next document to create is:

**REPs Global Platform — Database Schema and Data Model**

That document will define the Supabase-ready structure for professionals, users, roles, public profiles, qualifications, services, leads, clients, bookings, payments, programmes, nutrition, check-ins, reviews, memberships, subscriptions and Brilliant Directories migration staging.

