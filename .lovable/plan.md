
# Hero rebuild + header decongestion

Two coordinated changes so the homepage has **one** search (the hero owns it) and the header stops competing with everything around it.

Phase 1 rules still apply: static screens only, no auth, no real search logic, no new routes, no DB.

---

## 1. Header changes (`PublicHeader.tsx`)

### At rest on `/` (transparent state)
Remove from the right cluster:
- Hero-state inline "What/Where" search pill — gone entirely. Hero owns search.
- ⌘K visible chip — gone. Move "⌘K" hint into the hero search field placeholder. Global keyboard shortcut still triggers `HeaderCommandPalette`.
- ♥ Saved icon — hidden when logged out.

Right cluster becomes 4 items:
**Verified pill · Become a Pro (text link) · Log in (text link) · Join REPs (orange button)**

### Scrolled / subpage (solid state)
Compact "Search professionals" pill **appears in the header only after 96px scroll** or on any non-`/` route. Right cluster becomes 5:
**Search pill · Verified (icon-only, tooltip "All pros verified") · Become a Pro · Log in · Join REPs**

### Logged in (mock via `localStorage.reps.mockUser`)
**Verified · Become a Pro · Avatar dropdown** (Bookings · Messages · Saved · Settings · Sign out). No separate Saved icon.

### Mobile (<lg)
No changes from current build: compact search icon + hamburger. Drawer unchanged.

---

## 2. Hero rebuild (`src/routes/index.tsx` hero section only)

### Layout
Two-column hero, image right, content left — but image becomes a **floating pro-card stack**, not a single portrait.

```text
┌─────────────────────────────────────────────────────────────┐
│  Headline: Find. Trust. Train. Transform.                   │
│  Sub: The world's register of verified fitness pros.        │
│       Real qualifications, real reviews, real results.      │
│                                                             │
│  ┌──────────────────────────────────────────────┐  ┌─────┐  │
│  │ What ▾   │ Where 📍 │ [ Find Pros ]         │  │Card1│  │
│  └──────────────────────────────────────────────┘  └─────┘  │
│  Goal chips: Fat loss · Strength · Mobility ·       ┌─────┐ │
│              Pre/post-natal · Rehab · Sport         │Card2│ │
│                                                     └─────┘ │
│  Popular: Personal Trainer · Pilates · Nutritionist ┌─────┐ │
│           Strength · Pre & Postnatal · Online       │Card3│ │
│                                                     └─────┘ │
│  ★ 4.9 · 12,400 verified pros · 40 countries · Insured     │
└─────────────────────────────────────────────────────────────┘
```

### Search bar (the only search on the page at rest)
Two fields + button in one rounded panel (radius 22, `bg-reps-ink/60` + blur, brand-orange border on focus):
1. **What** — input + lucide `Search`, placeholder `"Search professionals  ⌘K"`, autocomplete is stubbed (static suggestions from `nav-config.ts`).
2. **Where** — input + `MapPin`, placeholder `"London"`, prefilled from location pin's `localStorage`, with "Detect location" button (stub — just sets "Near me").
3. **Find Professionals** button (orange, radius 12, no shadow).

Below the bar: **6 goal chips** (pills, radius full, `border-reps-stone`, hover → brand-orange border). Tapping a chip pre-fills `What` with the goal. No navigation in Phase 1.

Below chips: **Popular searches** row (existing, unchanged copy).

### Trust strip (replaces the "Why REPs?" glass card AND the inline 3-icon row)
Single inline line under the popular searches:
> ★ 4.9 average · 12,400 verified pros · 40 countries · Insurance & qualifications checked

Use existing `text-reps-muted` token + brand-orange star. One row. No card.

### Pro-card stack (right column)
Three overlapping cards, fanned with `rotate-[-3deg]` / `rotate-[2deg]` / `rotate-[-1deg]` and staggered Y offsets. Each card:
- 18px radius, `bg-reps-surface`, `border-reps-stone`
- 16:10 photo
- Name + Verified tick
- Specialism · City
- ★ 4.9 (24)
- "from £45 / session" or "Online"

3 static pros (mock data in a local `featuredPros` const — names, photos, specialism, city, rating, price). Photos: use existing `src/assets/` headshots; if missing, generate 3 portraits in a follow-up.

Subtle parallax on scroll (`translateY` based on scrollY, respects `prefers-reduced-motion`). No real interactions in Phase 1.

### Removed from current hero
- "Why REPs?" glass card (right column) — deleted.
- Inline 3-icon trust row ("REPs Verified / Reviewed & Rated / Trusted Worldwide") — replaced by the single trust line.
- Bottom-of-hero "I'm looking for / Near / Training type / Find Professionals" panel — deleted (replaced by the new search bar at the top).
- Header inline What/Where search at rest — deleted (covered in Header section).

---

## 3. Tokens, primitives, scope

**Tokens used:** `--brand-orange`, `--brand-orange-hover`, `--reps-ink`, `--reps-surface`, `--reps-stone`, `--reps-muted`. Radii: 10 (button), 12 (input), 18 (pro card), 22 (search panel), full (pills). No new tokens.

**shadcn primitives:** `Input`, `Button`, `Badge`, `Popover` (Where field's "Detect location"), `Tooltip` (Verified icon-only). No new shadcn additions.

**Files touched:**
- `src/components/public/PublicHeader.tsx` — strip ⌘K chip + Saved icon + at-rest inline search; gate Saved to logged-in; Verified becomes icon-only + tooltip when scrolled.
- `src/routes/index.tsx` — replace hero section (everything above the next section) with new layout.
- `src/components/public/HeroSearch.tsx` — **new**, the two-field search + chips + trust line.
- `src/components/public/HeroProStack.tsx` — **new**, the 3 fanned pro cards with mock data.
- `src/components/public/nav-config.ts` — add `featuredPros` and `popularGoals` mock arrays.

**Out of scope (won't touch):**
- Auth, Supabase, real search, real saved-pros persistence, geolocation, payments, AI.
- Below-the-fold homepage sections.
- Mockup-lock doc (this is an approved deviation; we'll log it once the user signs off the screenshots).
- Mobile hero — keeps current single-column treatment with the new search bar stacked above a single hero portrait (no card stack on small screens).

---

## 4. Acceptance criteria

- `/` at rest, desktop ≥ 1280: header has 4 right-side items, no search in header, hero shows new search bar + 3 fanned pro cards + single trust line. Screenshot supplied.
- Scroll past 96px: header gains compact search pill, Verified becomes icon-only. Screenshot supplied.
- `/for-professionals` and any subpage: header is solid + has the compact search pill. Screenshot supplied.
- Mobile 375: hero shows headline → search bar → goal chips → popular → trust line → single portrait below. No card stack. Screenshot supplied.
- `⌘K` still opens the command palette globally.
- Logged-in mock (`localStorage.reps.mockUser`): header shows avatar (containing Saved), no standalone Saved icon, no Log in / Join REPs.
- Audit script (`bash knowledge://skill/reps-build-compliance/scripts/audit.sh`) exits 0. No banned hex, no banned radii, no button shadows.
- Lighthouse a11y ≥ 95 on `/`.

Approve and I'll build it.
