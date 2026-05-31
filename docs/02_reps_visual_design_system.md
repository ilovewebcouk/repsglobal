# REPs Global Platform — Visual Design System

> **Source-of-truth override clause**
>
> The approved full-page mock-ups in `src/mockups/` are the locked visual source of truth: `reps_fullpage_home_v1.png`, `reps_fullpage_professional_dashboard_v1.png`, `reps_fullpage_directory_search_results_v1.png`, `reps_fullpage_professional_profile_v1.png`, `reps_fullpage_signup_login_v1.png`, `reps_fullpage_admin_dashboard_v1.png`. They override any earlier written radius, colour or layout guidance where there is a conflict. Older 16:9 mock-up filenames are archived references only and must not drive the build.
>
> **Phase 1 scope:** static high-fidelity screens only. No real auth, database, payments, bookings, AI APIs, live maps or Brilliant Directories migration during Phase 1.


## 1. Purpose

This document defines the visual system for the REPs global platform. It must be used as the design source of truth for all Lovable prompts, page builds, components, layouts and future product decisions.

The visual direction is based on the approved public homepage and professional dashboard mock-ups. The goal is to create a premium, trusted, global platform that feels more like a professional operating system than a standard fitness app or membership directory.

REPs must feel credible enough for verification, refined enough for a global public marketplace and powerful enough for professionals running serious fitness businesses.

## 2. Core Design Intent

REPs should feel:

- Premium
- Minimal
- Authoritative
- Modern
- Trustworthy
- Commercial
- Data-led
- Calm
- International
- Professional

REPs should not feel:

- Like a gym template
- Like a generic SaaS dashboard
- Like a dated directory
- Like a loud fitness influencer brand
- Like a cheap booking tool
- Like a cluttered coaching app
- Like My PT Hub, Trainerize or MyFitnessPal

The product should visually sit closer to Stripe, Linear, Apple Health, Arc, high-end fintech dashboards and premium marketplace design.

## 3. Brand Architecture

### Primary Brand Name

**REPs**

### Product Interpretation

REPs is both:

1. A public marketplace for finding trusted fitness professionals.
2. A professional operating system for running a fitness business.

### Brand Expression

Use **REPs** across the product interface.

Do not use **REPs UK** in the product interface unless referring specifically to legacy data, legal pages, migration notes or historical membership records.

### Platform Positioning

Primary line:

**Find trusted fitness professionals. Run better fitness businesses. One platform.**

Short public-facing line:

**Find. Trust. Train. Transform.**

Professional-facing line:

**The professional operating system for fitness businesses.**

## 4. Visual Direction Summary

The platform uses two connected visual environments:

### A. Public Marketplace

The public-facing website should use a premium editorial layout with a dark hero section, strong search interface and warm light sections underneath.

Primary feeling:

**High-trust marketplace.**

Visual cues:

- Dark navy/black hero
- Large cinematic fitness professional imagery
- Warm ivory content sections
- Floating search card
- Clear filters
- Premium profile cards
- Trust badges
- Minimal orange/gold accent

### B. Professional Dashboard

The professional dashboard should use a dark operating-system style interface. It must feel like a command centre for a fitness business.

Primary feeling:

**Business control centre.**

Visual cues:

- Dark interface
- Left sidebar
- Compact top bar
- KPI cards
- Revenue, adherence and professional score metrics
- AI insight cards
- Status panels
- Subtle graphs
- Orange/gold action highlights
- Calm, clear information hierarchy

## 5. Colour System

The colour system is deliberately restrained. REPs must not become colourful, childish or visually noisy. Use neutral tones, dark surfaces, warm off-white backgrounds and one primary accent.

### 5.1 Core Brand Colours

| Token | Hex | Usage |
|---|---:|---|
| `reps-black` | `#050608` | Deepest background, dashboard shell |
| `reps-ink` | `#0B0D10` | Primary dark page background |
| `reps-midnight` | `#11161D` | Dashboard panels and sidebar |
| `reps-panel` | `#151A21` | Main dark cards |
| `reps-panel-soft` | `#1C232D` | Secondary cards and hover states |
| `reps-border` | `#2B333E` | Dark borders |
| `reps-border-soft` | `#3A4350` | Active borders and dividers |
| `reps-ivory` | `#F6F1E8` | Public page background |
| `reps-warm-white` | `#FFFCF6` | Light cards and form backgrounds |
| `reps-stone` | `#E6DED2` | Light borders and muted surfaces |
| `reps-charcoal` | `#1B1C1E` | Primary text on light backgrounds |
| `reps-muted` | `#8D96A3` | Muted dark-mode text |
| `reps-muted-light` | `#6D716F` | Muted light-mode text |
| `reps-orange` | `#FF7A00` | Primary accent, CTAs, active states |
| `reps-orange-hover` | `#E96F00` | Hover state on primary buttons |
| `reps-orange-dark` | `#CC6200` | Pressed / active button state |
| `reps-orange-soft` | `rgba(255, 122, 0, 0.12)` | Soft tinted fills, badges |
| `reps-orange-border` | `rgba(255, 122, 0, 0.35)` | Soft outlines on orange surfaces |
| `reps-gold` | `#D9B66F` | Verification, professional score, premium status |
| `reps-green` | `#3CCB7F` | Success and positive status |
| `reps-red` | `#F05D5E` | Risk, failed payment, urgent alert |
| `reps-blue` | `#5FA8FF` | Information and neutral AI highlights |

### 5.2 CSS Variable Reference

Use this as the first design-token block in Lovable.

```css
:root {
  --reps-black: #050608;
  --reps-ink: #0B0D10;
  --reps-midnight: #11161D;
  --reps-panel: #151A21;
  --reps-panel-soft: #1C232D;
  --reps-border: #2B333E;
  --reps-border-soft: #3A4350;

  --reps-ivory: #F6F1E8;
  --reps-warm-white: #FFFCF6;
  --reps-stone: #E6DED2;
  --reps-charcoal: #1B1C1E;

  --reps-text: #F7F3EA;
  --reps-text-soft: #D8DCE2;
  --reps-muted: #8D96A3;
  --reps-muted-light: #6D716F;

  --reps-orange: #FF7A00;
  --reps-orange-hover: #E96F00;
  --reps-orange-dark: #CC6200;
  --reps-orange-soft: rgba(255, 122, 0, 0.12);
  --reps-orange-border: rgba(255, 122, 0, 0.35);
  --reps-gold: #D9B66F;
  --reps-green: #3CCB7F;
  --reps-red: #F05D5E;
  --reps-blue: #5FA8FF;

  /* REPs radius system (FINAL) */
  --reps-radius-xs: 6px;
  --reps-radius-sm: 8px;
  --reps-radius-button: 10px;
  --reps-radius-input: 12px;
  --reps-radius-card: 16px;
  --reps-radius-card-lg: 18px;
  --reps-radius-panel: 22px;
  --reps-radius-hero: 24px;
  --reps-radius-pill: 999px;

  --shadow-soft: 0 18px 60px rgba(0, 0, 0, 0.18);
  --shadow-card: 0 12px 40px rgba(0, 0, 0, 0.24);
  --shadow-deep: 0 28px 90px rgba(0, 0, 0, 0.38);
}
```

### 5.3 Colour Usage Rules

- Orange must be used sparingly for primary action, active navigation, key metrics and selected states.
- Gold must be reserved for verification, membership, professional status and trust signals.
- Green must only indicate positive state or completion.
- Red must only indicate risk, failed payment, cancellation risk or overdue action.
- Blue must be used carefully for AI, information and system insight states.
- Never use bright neon colours.
- Never use generic purple SaaS gradients.
- Never use large blocks of saturated orange.
- Public pages should feel warmer and more editorial.
- Dashboard pages should feel darker, sharper and more operational.

## 6. Typography

### 6.1 Font Stack

Use:

- **Inter Tight** for headings, hero text, dashboard titles and large metrics.
- **Inter** for body copy, labels, tables, forms, navigation and UI text.

Fallback stack:

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Heading stack:

```css
font-family: "Inter Tight", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### 6.2 Typography Scale

| Use | Size | Weight | Line Height |
|---|---:|---:|---:|
| Hero headline | 72px desktop / 46px mobile | 700 | 0.95 |
| Page title | 48px desktop / 34px mobile | 700 | 1.02 |
| Section title | 36px desktop / 28px mobile | 650 | 1.08 |
| Dashboard page title | 30px | 650 | 1.15 |
| Card title | 18px | 650 | 1.25 |
| Metric value | 34px | 700 | 1.0 |
| Body large | 18px | 400 | 1.6 |
| Body | 16px | 400 | 1.55 |
| UI label | 13px | 500 | 1.2 |
| Small meta | 12px | 500 | 1.2 |

### 6.3 Typography Rules

- Use tight tracking for large headlines.
- Use generous line-height for editorial copy.
- Avoid overusing bold text.
- Dashboard text should be compact but readable.
- Use sentence case for headings and buttons unless a specific acronym is required.
- Do not use all-caps headings except for tiny labels, badges or overlines.

## 7. Layout System

### 7.1 Global Page Widths

| Context | Max Width |
|---|---:|
| Public homepage content | 1240px |
| Public search/results content | 1320px |
| Professional dashboard | Fluid full width |
| Admin dashboard | Fluid full width |
| Profile page content | 1180px |
| Marketing text sections | 1040px |

### 7.2 Spacing Scale

Use an 8px spacing rhythm.

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |
| `space-24` | 96px |

### 7.3 Grid Rules

Public pages:

- Use a 12-column grid.
- Hero should be split with strong text/search on the left and image/visual proof on the right.
- Search interface must be visually dominant above the fold.
- Lower homepage sections should alternate between ivory background and white/warm cards.

Dashboard pages:

- Use a fixed left sidebar.
- Use a 12-column dashboard grid.
- KPI cards should sit at the top.
- AI insight panel should be visually central.
- Schedule/status panels should support quick action without clutter.

## 8. Border Radius

The visual system must feel premium, structured and refined. Buttons must be sharper than cards. Cards should be softly rounded but not bubbly. Large panels should be slightly softer than standard cards but never feel overly rounded. **14px, 20px, 28px and 32px are not part of the REPs radius system.**

| Component | Radius |
|---|---:|
| Checkboxes and micro chrome | 6px |
| Small / compact controls | 8px |
| Buttons (primary, secondary, outline), filter chips, small dashboard controls | 10px |
| Inputs, search fields, selects, dropdown triggers, in-card thumbnails | 12px |
| Dashboard KPI cards, admin metric cards, standard dashboard cards | 16px |
| Directory result cards, professional profile cards, service cards, featured professional cards | 18px |
| Large dashboard panels, AI insight panels, search panel containers, signup/auth main card | 22px (signup card may extend to 24px) |
| Hero image panels, large image containers | 24px |
| Badges, chips, pills, avatars, icon circles | 999px |

Tailwind usage: prefer exact arbitrary values — `rounded-[6px]`, `rounded-[8px]`, `rounded-[10px]`, `rounded-[12px]`, `rounded-[16px]`, `rounded-[18px]`, `rounded-[22px]`, `rounded-[24px]`, `rounded-full`. Never use `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-[14px]`, `rounded-[20px]`, `rounded-[28px]` or `rounded-[32px]`.

Avoid fully rounded oversized cards unless the component is a badge or pill.

## 9. Shadows and Elevation

Use soft shadows on public pages and subtle depth on dashboard panels.

### Public Pages

- Floating search card: large soft shadow.
- Profile cards: medium soft shadow on hover only.
- Hero image: deep shadow with subtle overlay.

### Dashboard

- Dashboard cards should rely more on borders and background contrast than heavy shadows.
- Use shadow only for overlays, modals, dropdowns and command palettes.
- Avoid bright glowing effects.

## 10. Logo and Wordmark Treatment

### 10.1 Wordmark

Until the final logo is designed, use a clean typographic wordmark:

**REPs**

Style:

- Inter Tight
- Bold
- Tight letter spacing
- White on dark backgrounds
- Charcoal on light backgrounds
- Optional orange dot or small gold verified mark beside the wordmark

### 10.2 Logo Rules

- Do not create a complex icon.
- Do not use dumbbell, bicep, barbell, flame or generic fitness icons as the main brand mark.
- The brand should feel institutional and professional, not gym-bro.
- The wordmark should be clean enough to sit beside verification badges, dashboard navigation and public trust elements.

## 11. Iconography

Use **Lucide icons** throughout the app.

Icon rules:

- Stroke width: 1.75px to 2px.
- Size: 16px for labels, 18px for navigation, 20px for buttons, 22px for cards.
- Icons must be simple line icons.
- Do not use filled cartoon icons.
- Do not mix icon libraries.
- Use icons to support navigation and scanning, not decoration.

Recommended icons:

- Search
- MapPin
- ShieldCheck
- BadgeCheck
- Calendar
- CreditCard
- Users
- Dumbbell
- Activity
- ClipboardCheck
- MessageSquare
- LineChart
- Sparkles
- Brain
- Star
- Settings
- Bell
- UserRound

## 12. Public Homepage Design Rules

### 12.1 Header

Desktop header:

- Transparent or dark background over hero.
- Left: REPs wordmark.
- Centre/right: Find a Professional, For Professionals, CPD, Pricing, About.
- Far right: Sign in and Join REPs.
- Join REPs button uses orange fill.
- Header height: 76px.
- Header content max width: 1240px.

Mobile header:

- Wordmark left.
- Menu icon right.
- Full-screen mobile menu with dark background.

### 12.2 Hero Section

Hero structure:

- Dark hero background using `reps-ink` or `reps-black`.
- Left column contains trust badge, headline, supporting copy and search panel.
- Right column contains cinematic fitness professional image or image card.
- Hero should occupy 760px to 860px desktop height.
- Mobile hero stacks text, search, then image.

Hero headline:

**Find. Trust. Train. Transform.**

Hero supporting copy:

**Search verified personal trainers, Pilates instructors, nutrition professionals and fitness coaches. Compare trusted profiles, check credentials and start with the right professional for your goals.**

Hero trust badge examples:

- Verified fitness professionals
- Qualifications checked
- Public reviews
- Online and in-person coaching

### 12.3 Homepage Search Panel

The search panel is the most important public conversion component.

Desktop layout:

- Large rounded floating card.
- Warm white background.
- Four fields in one row where space allows.
- Search button on the right.

Fields:

1. Professional type
2. Location or postcode
3. Training format
4. Goal or specialism

Search button:

- Orange background.
- Label: **Search professionals**
- Icon: Search

Field style:

- Icon on the left.
- Small label above.
- Larger selected value below.
- Light border.
- Rounded input block.

Example values:

- Personal trainer
- London or online
- In-person and online
- Fat loss, strength, Pilates

### 12.4 Homepage Section Order

The homepage must follow this order:

1. Header
2. Hero with search
3. Trust/stat strip
4. Popular professional categories
5. Featured verified professionals
6. How REPs works
7. Why verification matters
8. For fitness professionals CTA
9. Reviews/testimonials
10. Final search CTA
11. Footer

### 12.5 Public Stats Strip

Use three to five stats immediately below the hero.

Example stats:

- Verified professionals
- Online and in-person coaching
- Specialist categories
- Public reviews
- Professional profiles

Style:

- Dark or ivory section.
- Large number in Inter Tight.
- Small label beneath.
- Use subtle dividers.

### 12.6 Category Cards

Category card examples:

- Personal Trainers
- Pilates Instructors
- Sports Nutritionists
- Strength Coaches
- Online Coaches
- Pre and Postnatal Specialists
- Older Adult Fitness
- Disability and Inclusive Fitness
- Sports Performance Coaches
- Weight Management Coaches

Card style:

- Warm white background.
- Icon at top.
- Category title.
- Short description.
- Small arrow or Explore link.
- Hover border turns orange/gold.

### 12.7 Featured Professional Cards

Professional cards must be premium and trust-led.

Card content:

- Professional image
- Name
- Profession type
- Location
- Verified badge
- Rating/reviews
- Specialisms
- Online/in-person labels
- Starting price or enquiry CTA
- View profile button

Card visual style:

- Rounded 22px.
- Warm white card.
- Image ratio 4:3 or square.
- Subtle border.
- Badge overlays allowed.

## 13. Directory Search Results Design Rules

### 13.1 Search Results Page Layout

Desktop:

- Top search bar across page.
- Left filter sidebar.
- Main results grid/list.
- Optional map panel on the right for location searches.

Mobile:

- Search bar at top.
- Filters in slide-up sheet.
- Results in stacked cards.

### 13.2 Filter Categories

Filters:

- Professional type
- Location radius
- Online/in-person
- Availability
- Verified status
- Qualifications
- Insurance status
- Rating
- Specialisms
- Languages
- Price range
- Gender preference where appropriate
- Accessibility support

### 13.3 Result Cards

Result card must show:

- Photo
- Name
- Verified badge
- Role/category
- Location
- Rating
- Review count
- Short bio excerpt
- Specialism chips
- Availability indicator
- View profile CTA
- Enquire or Book CTA

Use a list layout for serious search intent and a card grid for featured/marketing sections.

## 14. Professional Profile Page Design Rules

The professional profile page must feel like a trusted professional credential page and a sales page combined.

### 14.1 Profile Header

Profile header includes:

- Large professional image or cover image
- Profile photo
- Name
- Profession type
- Location
- Verified status
- Rating
- Review count
- Online/in-person availability
- Primary CTA: Enquire or Book consultation
- Secondary CTA: Save profile

### 14.2 Profile Sections

Recommended order:

1. Profile hero
2. Trust and verification bar
3. About
4. Services and packages
5. Specialisms
6. Qualifications
7. Insurance and membership status
8. Reviews
9. Locations served
10. Availability
11. Articles/content if available
12. Final CTA

### 14.3 Trust Bar

Trust bar items:

- REPs verified
- Qualifications checked
- Insurance active
- CPD up to date
- Reviews verified

Use gold and green carefully.

## 15. Professional Dashboard Design Rules

The dashboard must match the approved dark mock-up direction. It is the core professional product.

### 15.1 Dashboard Shell

Desktop layout:

- Fixed left sidebar: 260px.
- Top bar: 72px.
- Main content area: full width.
- Background: `reps-black` or `reps-ink`.
- Cards: `reps-panel` with subtle border.

Mobile layout:

- Bottom navigation or collapsible drawer.
- KPI cards stack vertically.
- AI insights move near the top.

### 15.2 Sidebar

Sidebar background:

- `reps-midnight`

Sidebar sections:

1. Dashboard
2. Leads
3. Clients
4. Bookings
5. Payments
6. Programmes
7. Nutrition
8. Check-ins
9. Messages
10. Reviews
11. CPD
12. Public Profile
13. Settings

Bottom sidebar:

- User profile
- Membership status
- Help/support

Active item:

- Soft orange/gold background or left rail.
- White text.
- Orange icon.

Inactive item:

- Muted text.
- Hover uses `reps-panel-soft`.

### 15.3 Top Bar

Top bar includes:

- Page title or breadcrumb
- Global search
- AI command button
- Notifications
- Quick create button
- User avatar

Global search placeholder:

**Search clients, leads, bookings, programmes...**

AI command button:

**Ask REPs AI**

### 15.4 Dashboard KPI Cards

Top KPI cards:

1. Monthly revenue
2. Active clients
3. Client adherence
4. REPs professional score
5. Membership status
6. AI insights

KPI card style:

- Dark card background.
- Thin border.
- Small muted label.
- Large metric value.
- Tiny trend indicator.
- Optional mini sparkline.

Example KPI values:

- £8,420 monthly revenue
- 34 active clients
- 87% adherence
- 92 professional score
- Verified Pro active
- 8 actions suggested

### 15.5 AI Business Insight Panel

This is a central visual component.

Panel title:

**AI business insight**

Content examples:

- Revenue is up 14% compared with last month.
- 3 clients are showing cancellation risk.
- 8 weekly check-ins require review.
- 2 leads are likely to convert this week.
- Recommended action: contact Sarah, Mike and Emma today.

Panel actions:

- Review actions
- Draft follow-ups
- Open risk list

Visual style:

- Slightly larger than standard cards.
- Dark card with subtle radial highlight.
- AI icon or Sparkles icon.
- Orange/gold action button.

### 15.6 Today’s Schedule Card

Shows:

- Time
- Client name
- Session type
- Location/online
- Status

Example:

- 09:00 - PT Session - Emma Clarke - Gym floor
- 11:00 - Pilates - Group session - Studio 2
- 14:00 - Online check-ins - 8 clients due
- 17:30 - Consultation - James Patel - Zoom

Use small status chips:

- Confirmed
- Due
- Online
- Paid
- Needs action

### 15.7 Professional Status Card

Shows:

- REPs verified
- Insurance active
- CPD progress
- Qualification status
- Profile completion
- Review score

This card reinforces that REPs is not just a coaching app. It is the professional authority layer.

### 15.8 Client Performance Card

Shows:

- Adherence trend
- Workout completion
- Check-in completion
- Weight/progress trend where relevant
- Retention indicator

Charts:

- Use subtle lines.
- Avoid colourful chart overload.
- Orange for primary trend.
- Muted grey for secondary comparison.

### 15.9 AI Client Alerts Card

Alerts must be practical and prioritised.

Examples:

- Sarah: plateau detected for 3 weeks.
- Mike: missed 3 sessions in 14 days.
- Emma: check-in suggests low recovery.
- Jack: payment failed yesterday.

Alert levels:

- Red: urgent risk
- Orange: action required
- Blue: information
- Green: positive milestone

### 15.10 Lead Pipeline Card

Pipeline stages:

1. New lead
2. Discovery call
3. Proposal sent
4. Trial/session booked
5. Active client

Visual style:

- Compact horizontal pipeline on desktop.
- Stacked stages on mobile.
- Show count and estimated revenue per stage.

### 15.11 Content Studio Card

Content Studio should show that REPs helps professionals grow their business.

Content examples:

- 3 Instagram posts drafted
- 1 client win ready to publish
- 2 email campaigns scheduled
- 1 article suggested for public profile

Buttons:

- Create post
- Draft email
- Use client win

## 16. Admin Dashboard Design Rules

Admin should use the same dark shell as the professional dashboard, but with admin-specific navigation.

Admin sidebar:

- Overview
- Professionals
- Verification
- Memberships
- Directory
- Reviews
- Payments
- CPD
- Migration
- Support
- Settings

Admin dashboard cards:

- Total professionals
- Verified profiles
- Pending verification
- Active subscriptions
- Monthly recurring revenue
- Public searches
- New leads generated
- Reviews pending moderation

Admin must feel operational and serious, not like a consumer app.

## 17. Component System

### 17.1 Buttons

Primary button:

- Background: `reps-orange`
- Text: `#ffffff`
- Hover: `reps-orange-hover` (pressed: `reps-orange-dark`)
- Radius: 10px
- Font: 14px to 15px, 600
- Height: 44px to 52px

Secondary dark button:

- Background: `reps-panel-soft`
- Border: `reps-border`
- Text: `reps-text`
- Hover: slightly lighter panel

Secondary light button:

- Background: transparent or warm white
- Border: `reps-stone`
- Text: `reps-charcoal`

Ghost button:

- Transparent
- Text uses current section colour
- Hover background subtle

Danger button:

- Use red only for destructive action.

### 17.2 Inputs

Input style:

- Height: 48px to 56px.
- Radius: 12px.
- Border: soft neutral.
- Focus border: orange/gold.
- Focus ring: soft orange at low opacity.
- Label: small, medium weight.

Dashboard dark inputs:

- Background: `reps-panel-soft`.
- Border: `reps-border`.
- Text: `reps-text`.
- Placeholder: `reps-muted`.

Public light inputs:

- Background: `reps-warm-white`.
- Border: `reps-stone`.
- Text: `reps-charcoal`.

### 17.3 Cards

Dashboard cards (standard KPI / metric / content cards):

- Background: `reps-panel`.
- Border: 1px solid `reps-border`.
- Radius: 16px.
- Padding: 20px to 28px.
- Large dashboard panels (AI insight, search containers, signup card) step up to 22px.

Public cards (directory result, professional profile, service, featured professional):

- Background: `reps-warm-white`.
- Border: 1px solid `reps-stone`.
- Radius: 18px.
- Padding: 24px.
- Hover: subtle shadow and border lift.

### 17.4 Badges and Chips

Badge radius: 999px.

Badge types:

- Verified: gold/green tone
- Online: blue tone
- In-person: neutral tone
- Popular: orange tone
- Risk: red tone
- Complete: green tone
- Due: orange tone

Badges should be small, readable and restrained.

### 17.5 Tables

Tables should be clean, spacious and usable.

Dashboard table style:

- Dark background.
- Subtle row separators.
- Sticky header where useful.
- Hover row background.
- Status chips.

Public table use should be minimal.

### 17.6 Modals and Drawers

Use modals for:

- Booking flow
- Enquiry flow
- Profile editing
- AI action review
- Payment confirmation

Use drawers for:

- Filters on mobile
- Quick client details
- Booking detail
- Lead detail

Modal style:

- Radius: 22px (large image-led modals may extend to 24px).
- Background follows current environment.
- Clear title, description and CTA row.

## 18. Imagery Direction

### 18.1 Public Homepage Imagery

The homepage hero must use premium, realistic fitness professional imagery.

Image requirements:

- Professional trainer working with client.
- Realistic lighting.
- Clean studio or gym environment.
- Modern, premium feel.
- Diverse but natural representation.
- No exaggerated stock-photo smiles.
- No bodybuilding cliché imagery.
- No cluttered gym backgrounds.
- No neon fitness influencer aesthetic.

Hero image style:

- Cinematic crop.
- Slight dark overlay.
- Rounded 24px hero image panel (or full-height image panel).
- Should support the trust-led search message.

### 18.2 Professional Profile Imagery

Profile images should be:

- Professional headshot or coaching action shot.
- Clear face visibility.
- Good lighting.
- No low-quality selfies.
- No heavy filters.
- No aggressive gym posing as default profile imagery.

### 18.3 Dashboard Imagery

Avoid imagery inside the dashboard except:

- Small avatars.
- Client profile photos.
- Professional user avatar.

The dashboard should be information-led, not image-led.

## 19. Motion and Interaction

Motion should be subtle and functional.

Use motion for:

- Search panel focus
- Card hover lift
- Modal entrance
- Drawer slide
- Sidebar collapse
- Chart loading
- AI insight reveal

Motion timing:

- Fast UI transitions: 150ms to 200ms.
- Page transitions: 250ms to 350ms.
- Avoid slow decorative animations.

Easing:

- Use smooth ease-out.
- Avoid elastic/bouncy animation.

## 20. Mobile Behaviour

### 20.1 Public Site Mobile

- Hero stacks vertically.
- Search fields become a vertical card.
- Header becomes mobile drawer.
- Directory filters open in bottom sheet.
- Professional cards stack full width.
- CTAs remain thumb-friendly.

### 20.2 Dashboard Mobile

- Sidebar becomes drawer or bottom nav.
- KPI cards stack in one column.
- AI insight panel appears near top.
- Tables become cards.
- Filters become drawers.
- Quick actions remain accessible.

Mobile must not feel like an afterthought. Many professionals will use the dashboard between sessions.

## 21. Accessibility Rules

- Text contrast must be strong across dark and light modes.
- Buttons must be clearly distinguishable from cards.
- Forms must have visible labels.
- Focus states must be visible.
- Error messages must be clear and specific.
- Icons must not be the only way to understand an action.
- Tap targets should be at least 44px high.
- Avoid tiny grey text on dark backgrounds.

## 22. Lovable Styling Rules

These rules must be included in every major Lovable prompt until the visual system is fully implemented.

### Mandatory Lovable Instruction

Build using the REPs visual design system. Do not introduce a generic SaaS theme, unrelated colours, purple gradients, bright neon fitness colours, childish illustrations or template-like dashboard styling. The app must visually match the approved REPs public homepage and dark professional dashboard direction.

Use a premium dark operating-system interface for app/dashboard screens and a warm editorial marketplace style for public-facing pages. Use Inter Tight for headings and Inter for body/UI text. Use the defined REPs colour tokens, rounded cards, restrained orange/gold accent styling and clean professional spacing.

### Component Instruction

Create reusable components for:

- PublicHeader
- PublicHeroSearch
- SearchField
- TrustBadge
- CategoryCard
- ProfessionalCard
- DirectoryFilters
- ProfileHero
- VerificationBar
- DashboardShell
- DashboardSidebar
- DashboardTopbar
- MetricCard
- AIInsightCard
- ScheduleCard
- ProfessionalStatusCard
- ClientAlertCard
- PipelineCard
- ContentStudioCard
- AdminMetricCard

### Do Not Deviate Rules

Lovable must not:

- Replace the dark dashboard with a light admin template.
- Use default shadcn styling without applying REPs tokens.
- Add random gradients.
- Use purple, cyan or neon colours as primary accents.
- Use generic stock fitness icons as brand marks.
- Overload pages with unnecessary cards.
- Add features not requested in the active prompt.
- Change page structure without instruction.
- Reinterpret REPs as only a UK directory.
- Use REPs UK as the main product name.

## 23. Tailwind Token Mapping

Use this mapping when configuring Tailwind or Lovable theme styles.

```js
const repsTheme = {
  colors: {
    reps: {
      black: '#050608',
      ink: '#0B0D10',
      midnight: '#11161D',
      panel: '#151A21',
      panelSoft: '#1C232D',
      border: '#2B333E',
      borderSoft: '#3A4350',
      ivory: '#F6F1E8',
      warmWhite: '#FFFCF6',
      stone: '#E6DED2',
      charcoal: '#1B1C1E',
      text: '#F7F3EA',
      textSoft: '#D8DCE2',
      muted: '#8D96A3',
      mutedLight: '#6D716F',
      orange: '#FF7A00',
      orangeHover: '#E96F00',
      orangeDark: '#CC6200',
      orangeSoft: 'rgba(255, 122, 0, 0.12)',
      orangeBorder: 'rgba(255, 122, 0, 0.35)',
      gold: '#D9B66F',
      green: '#3CCB7F',
      red: '#F05D5E',
      blue: '#5FA8FF'
    }
  },
  borderRadius: {
    xs: '6px',
    sm: '8px',
    button: '10px',
    input: '12px',
    card: '16px',
    cardLg: '18px',
    panel: '22px',
    hero: '24px',
    pill: '9999px'
  },
  boxShadow: {
    soft: '0 18px 60px rgba(0, 0, 0, 0.18)',
    card: '0 12px 40px rgba(0, 0, 0, 0.24)',
    deep: '0 28px 90px rgba(0, 0, 0, 0.38)'
  },
  fontFamily: {
    heading: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
    body: ['Inter', 'system-ui', 'sans-serif']
  }
};
```

## 24. Page Background Rules

### Public Pages

Hero:

- Use dark background.
- Use warm light search card.
- Use premium imagery.

Body:

- Use ivory background.
- Use warm white cards.
- Use charcoal text.

CTA sections:

- Use either dark background with orange CTA or ivory background with dark text.

### Dashboard Pages

Shell:

- Use deep black/navy background.
- Use dark panels.
- Use subtle borders.
- Use orange/gold only for actions and key states.

### Admin Pages

Use the dashboard visual system, not a separate admin template.

## 25. Empty, Loading and Error States

### Empty State

Empty states should be calm and useful.

Example:

**No leads yet**

Your public profile is ready. Share your profile link or improve your listing to start generating enquiries.

Button: **Improve profile**

### Loading State

Use skeleton cards that match the final layout.

Do not use spinners as the main loading pattern except for small inline actions.

### Error State

Errors should be specific and actionable.

Example:

**We could not load your bookings**

Refresh the page or contact support if this continues.

Button: **Retry**

## 26. Design Quality Checklist

Before approving any Lovable screen, check:

- Does it clearly look like REPs?
- Does it match the approved homepage/dashboard direction?
- Is the colour palette restrained?
- Is orange used only where it matters?
- Does the dashboard feel like a professional operating system?
- Does the public site feel like a trusted marketplace?
- Are cards consistent?
- Are buttons consistent?
- Is typography clean and premium?
- Is spacing generous enough?
- Does it avoid generic SaaS styling?
- Does it avoid gym-template clichés?
- Does mobile still feel premium?

## 27. Immediate Implementation Rule

The first Lovable build must create the visual shell only:

1. Public homepage
2. Directory search page
3. Professional profile page
4. Professional dashboard
5. Admin dashboard shell

No real database, authentication, payments, AI, bookings or migration should be added until these visual screens are approved.

This prevents Lovable from building the wrong product structure before the REPs visual identity is locked.

