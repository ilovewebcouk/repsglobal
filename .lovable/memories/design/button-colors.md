---
name: Button colors
description: Locked button token mapping — orange CTAs are ALWAYS text-white; ghost/outline buttons on dark surfaces need explicit white text + visible border
type: design
---

# Button colors (LOCKED)

## Orange CTAs
- Class: `bg-reps-orange text-white hover:bg-reps-orange/90`
- **NEVER** `text-black` on `bg-reps-orange` — fails contrast and looks broken.
- Pressed/hover: `hover:bg-reps-orange-hover` or `/90`.
- Disabled: rely on Button `disabled:opacity-50`; do not add `text-white/50`.

## Ghost / outline buttons on dark dashboard surfaces
Shadcn `variant="outline"` defaults to light theme (`bg-background text-foreground`) which renders as **white shell + white text → invisible** on `bg-reps-panel`. Do not use it inside admin/dashboard surfaces.

Use instead:
- `DashboardButton variant="ghost"` (preferred inside dashboards), or
- `Button` with explicit classes: `border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]`.

## Quick reference
| Intent                       | Classes                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| Primary CTA (orange)         | `bg-reps-orange text-white hover:bg-reps-orange/90`                     |
| Secondary on dark            | `border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]` |
| Destructive on dark          | `border border-red-400/25 bg-white/[0.03] text-red-300 hover:bg-red-500/10` |

## Why
Recurring regression: shadcn `Button variant="outline"` and `text-black` on orange both produced invisible/illegible buttons inside the admin support compose dialog. Lock this and stop re-litigating.
