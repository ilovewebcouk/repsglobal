---
name: Dashboard UI kit
description: Dark-first primitives (Dialog, Button, Input, Textarea, Select, Card, Badge, Empty, Tooltip, AlertDialog, Toaster) for all `/_authenticated/` routes. Replaces shadcn light-theme defaults. ESLint-enforced.
type: design
---
# Dashboard UI kit

All authenticated dashboard surfaces (trainer + admin) must consume the dark-first primitives in `src/components/dashboard/ui/`. shadcn's stock primitives render against light tokens (`bg-background`, `text-muted-foreground`, `border-input`) and look broken on the dark dashboard surface.

The kit is **ESLint-enforced**: inside `src/routes/_authenticated/**` and `src/components/dashboard/**`, importing `@/components/ui/{button,dialog,alert-dialog,input,textarea,select,card,badge,empty,tooltip,sonner}` is a build error. The kit itself (`src/components/dashboard/ui/**`) is exempt.

## Primitives — `@/components/dashboard/ui`

| Primitive | Notes |
|---|---|
| `DashboardDialog*` | Radix Dialog. `bg-reps-panel border-reps-border rounded-[18px]`, overlay `bg-black/70 backdrop-blur-sm`. Includes `DashboardDialogNote` helper block. |
| `DashboardAlertDialog*` | Radix AlertDialog. Same shell as Dialog. `Action` accepts `destructive` prop → red ghost styling. |
| `DashboardButton` | Variants: `primary` (orange), `ghost` (almost-transparent — replaces shadcn `outline`), `subtle` (orange chip), `destructive-ghost` (red ghost), `link`. Sizes `sm/md/lg/icon`. Flat (`shadow-none`), 10px radius. |
| `DashboardInput` | h-10, `rounded-[12px]`, `bg-white/[0.04] border-white/12`. `aria-invalid` → red border + ring. |
| `DashboardTextarea` | Same tokens as Input, `min-h-[96px]`, `resize-y`. |
| `DashboardSelect*` | Radix Select. Trigger matches Input shell. Content `bg-reps-panel rounded-[14px]`, item hover `bg-white/[0.06]`, check in `text-reps-orange`. |
| `DashboardCard` + Header/Title/Description/Content/Footer | `bg-reps-panel border-reps-border rounded-[16px]`. Footer `border-t border-white/8`. |
| `DashboardBadge` | Pill, h-5. Variants: `neutral` / `orange` / `success` (emerald) / `warn` (amber) / `danger` (red). |
| `DashboardEmpty` + Icon/Title/Description/Actions | Dashed `border-white/12`, `bg-white/[0.02]`, 16px radius. Icon slot is `size-10` circle. |
| `DashboardTooltip*` | Radix Tooltip. `bg-reps-ink rounded-[8px] text-[12px]`. Provider mounted in `_authenticated/route.tsx` with `delayDuration={200}`. |
| `DashboardToaster` + re-exported `toast` | Sonner instance themed dark. Mounted once in `_authenticated/route.tsx`. Callers can also `import { toast } from "sonner"` directly. |

## Token vocabulary (no new tokens)

Surfaces: `bg-reps-panel` (card body), `bg-reps-ink` (tooltip), `bg-white/[0.04]` (input), `bg-white/[0.02]` (empty), `bg-white/[0.06]` (badge neutral / hover).
Borders: `border-reps-border` (card/dialog), `border-white/12` (input/button-ghost), `border-white/8` (card footer divider), `border-dashed border-white/12` (empty).
Text: `text-white` (primary), `text-white/70` (description), `text-white/65` (empty body), `text-white/45` (eyebrow), `text-white/40` (placeholder).
Status: emerald per `mem://design/status-colors`. Red `text-red-300 border-red-400/25 bg-red-500/10`. Amber `text-amber-300 border-amber-400/30 bg-amber-500/12`.
Radii: 8 (tooltip/select-item), 10 (button), 12 (input/textarea/select-trigger), 14 (select-content/note), 16 (card/empty), 18 (dialog).

## Style-guide page

`/dashboard/design-kit` (`src/routes/_authenticated/dashboard_.design-kit.tsx`, `noindex`) renders every primitive in every variant. Use as visual QA when extending the kit.

## Migrated screens

- `/dashboard/profile` (trainer profile editor) — dialogs + ghost buttons. Locked 2026-06-12.

## Pending sweep

Mechanical swap (no layout changes) on next touch:
- `/dashboard` (trainer dashboard tabs)
- `/dashboard/settings`
- `/dashboard/syncing`
- Admin dashboard surfaces

When sweeping, run the build — ESLint will fail on any remaining `@/components/ui/*` import inside `_authenticated/`.
