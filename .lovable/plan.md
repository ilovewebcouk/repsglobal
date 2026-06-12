# Dashboard UI kit — brutal honest take + fix plan

## Brutal honest truth

You're right. What you're seeing isn't a "dashboard design" — it's **default shadcn light-theme primitives leaking into a dark product**. Two specific things in your screenshots:

1. **The "That photo can't be used" dialog is unreadable** because `DialogContent` uses `bg-background` and `DialogDescription` uses `text-muted-foreground`. In our theme those resolve to the cream/off-white background and a low-contrast muted grey — so white-on-cream body text + a grey "What we need" card inside a cream sheet. It looks cheap because it literally is the default shadcn light card dropped onto a dark app.
2. **The grey "Close" / "Remove" buttons** are `<Button variant="outline">`, which is `border-input bg-background hover:bg-accent` — again the light-theme tokens. They've never been on the public site because the public site uses our own ghost/transparent treatment (`bg-white/5 border-white/10 hover:bg-white/10`).

This is not a per-screen fix. Every dashboard page (trainer + admin) will keep regressing until the **primitives themselves** are dark-aware. The right move is to establish a **Dashboard UI kit** once, and have every dashboard surface consume it.

## What I propose

A single, small, dark-first component layer that mirrors the public site's visual language and is the only thing dashboards are allowed to use for dialogs, buttons, inputs, popovers, and toasts.

### 1. Lock the token vocabulary (no new colors)

Keep using the existing `reps-*` tokens already in `src/styles.css`. The kit will reference:

- Surface: `bg-reps-panel` (cards/dialogs), `bg-reps-ink` (inputs/page)
- Border: `border-reps-border`, hover `border-white/15`
- Text: `text-white`, `text-white/70`, `text-white/55`, `text-white/45`
- Primary action: `bg-reps-orange` / `hover:bg-reps-orange-hover` (white text)
- Soft action: `bg-reps-orange-soft text-reps-orange border-reps-orange-border` (already used on chips)
- Ghost/secondary (the "almost transparent" one you mean): `bg-white/[0.04] border-white/12 text-white hover:bg-white/[0.08]`
- Destructive: same ghost shape, red text (`text-red-300 hover:bg-red-500/10 border-red-400/25`)
- Status (emerald-only-for-status rule stays): `border-emerald-400/30 bg-emerald-500/15 text-emerald-300`

Radii follow the existing locked scale (button 10, input 12, card/dialog 16–18, pill full). No new radii.

### 2. New dashboard-scoped primitives

Add `src/components/dashboard/ui/` (kept separate from `src/components/ui/` so we don't fight shadcn's light defaults across the rest of the app):

- `DashboardDialog` — wraps Radix Dialog with `bg-reps-panel border border-reps-border rounded-[18px] text-white`, `shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]`, overlay `bg-black/70 backdrop-blur-sm`. Title white, description `text-white/70`. Inner "What we need" type cards: `bg-white/[0.04] border-white/10 rounded-[14px]`.
- `DashboardButton` variants:
  - `primary` (orange, white text — current "Change photo")
  - `ghost` (the transparent treatment from the public site — replaces today's grey `outline`)
  - `subtle` (soft orange chip-button)
  - `destructive-ghost` (red text, ghost shell)
  - `link`
  All flat (`shadow-none`), heights `h-9 / h-10`, radius `10px`.
- `DashboardInput`, `DashboardTextarea`, `DashboardSelectTrigger` — already mostly inlined on the profile page; consolidate so admin reuses the same look (`bg-reps-ink border-reps-border rounded-[12px] text-white placeholder:text-white/35`).
- `DashboardCard` — `bg-reps-panel border border-reps-border rounded-[18px] p-6`. Section eyebrow + number chip pattern already used on `dashboard_.profile.tsx` becomes the canonical card header.
- `DashboardEmpty`, `DashboardBadge`, `DashboardTooltip` — thin wrappers locking dark tokens.
- Toasts: keep Sonner but set theme="dark" with the panel/border tokens.

### 3. Style guide page (internal)

Add `/dashboard/_design` (admin-only, noindex) that renders every variant on a dark surface so we (and you) can eyeball the kit and catch regressions. This becomes the single source of truth for dashboard UI — like the public mock-ups are for marketing.

### 4. Migration (incremental, low risk)

I will not redesign locked screens. The migration is a token/component swap:

1. Ship the kit + the `/dashboard/_design` page.
2. Replace `Dialog` → `DashboardDialog` and `Button variant="outline"` → `DashboardButton variant="ghost"` on the **profile editor first** (the screen in your screenshots). That fixes both issues you flagged.
3. Sweep the rest of `_authenticated/` routes (trainer dashboard, admin dashboard, messages, reviews, billing) in one pass — search/replace, no layout changes.
4. Record the rule in project memory: **dashboards may only import from `src/components/dashboard/ui/`** for dialogs/buttons/inputs. shadcn `Button variant="outline" / "secondary"` becomes forbidden inside `_authenticated/`.

### 5. What this does NOT change

- No change to public marketing pages, locked homepage/profile/enquire/coach shop-front, or the brand orange palette.
- No new colors, no new radii, no new fonts.
- No functional/behavioural changes — purely a presentation layer swap.

## Open questions before I build it

1. **Scope of first PR** — do you want me to (a) ship the kit + style guide + fix the profile editor dialog & buttons only, then sweep the rest in a follow-up, or (b) do the full sweep in one go?
2. **Ghost button hover** — public site uses `hover:bg-white/10`. Confirm that's the "almost transparent" look you mean, vs. a slightly more visible `bg-white/[0.06]` resting state.
3. **Admin dashboard** — same kit, or do you want admin to feel visibly different (e.g. cooler/greyer) from the trainer dashboard? My recommendation: same kit, identical tokens — admin is just another logged-in surface.

Once you answer, I'll build it.
