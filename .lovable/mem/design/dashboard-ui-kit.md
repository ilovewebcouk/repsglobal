---
name: Dashboard UI kit
description: Dark-first primitives (DashboardDialog, DashboardButton, DashboardDialogNote) for all `/_authenticated/` routes. Replaces shadcn light-theme defaults.
type: design
---
# Dashboard UI kit

All authenticated dashboard surfaces (trainer + admin) must consume the dark-first primitives in `src/components/dashboard/ui/` for dialogs and CTAs. shadcn's stock `Dialog` and `Button variant="outline" / "secondary"` render against light tokens (`bg-background`, `text-muted-foreground`, `border-input`) and look broken on the dark dashboard surface — cream popups, grey-on-cream body text, grey "outline" buttons that have never appeared on the public site.

## Primitives

`@/components/dashboard/ui` exports:

- `DashboardDialog` + `DashboardDialogContent / Header / Title / Description / Footer / Note` — Radix Dialog with `bg-reps-panel border-reps-border rounded-[18px] text-white`, overlay `bg-black/70 backdrop-blur-sm`. `DashboardDialogNote` is the inset "what we need" / helper block: `bg-white/[0.04] border-white/10 rounded-[14px]`.
- `DashboardButton` variants:
  - `primary` — `bg-reps-orange` / `hover:bg-reps-orange-hover`, white text
  - `ghost` — `bg-white/[0.04] border-white/12 text-white hover:bg-white/[0.08]` (the "almost transparent" treatment that matches the public site — use this **instead of** shadcn `outline`)
  - `subtle` — soft orange chip-button
  - `destructive-ghost` — red text on ghost shell
  - `link` — inline orange text link
  - Sizes: `sm` (h-8), `md` (h-9, default), `lg` (h-10), `icon`
  - All flat (`shadow-none`); 10px radius per the locked scale

## Rules

1. Inside `src/routes/_authenticated/**` and `src/components/dashboard/**`, **dialogs MUST be `DashboardDialog`** and **CTAs MUST be `DashboardButton`** (or, for the canonical primary save action, the existing shadcn `Button` is permitted but no `variant="outline" / "secondary" / "ghost"`).
2. The "Save changes" primary button currently uses shadcn `Button` with default variant (brand orange) — that resolves to the same orange and is fine. Do not switch it; do not introduce shadcn's outline/secondary anywhere else.
3. No new colours, radii, or fonts. The kit composes existing `reps-*` tokens from `src/styles.css`.
4. Public marketing pages are unaffected — they keep using shadcn primitives and the marketing primitive library.

## Migrated screens

- `/dashboard/profile` (trainer profile editor) — rejection dialog, AI regenerate dialog, Remove / Preview / View-full-profile ghost buttons. Locked 2026-06-12.

Pending sweep (low-risk token swap, no layout changes): rest of `_authenticated/` (trainer dashboard tabs, admin dashboard). Do them when next touching each screen.
