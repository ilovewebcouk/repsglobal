# Dashboard UI kit — round 2

Extend `src/components/dashboard/ui/` with the remaining primitives the trainer and admin dashboards need. Same recipe as `DashboardDialog` / `DashboardButton`: Radix or shadcn underneath, REPs `reps-*` tokens baked in, dark-first, no light-theme leakage.

## What to build

All under `src/components/dashboard/ui/` and re-exported from `index.ts`.

1. **`input.tsx` → `DashboardInput`**
   - `h-10`, `rounded-[12px]` (input radius), `bg-white/[0.04]`, `border border-white/12`, `text-white`, `placeholder:text-white/40`.
   - Focus: `border-white/30`, `ring-2 ring-white/10`.
   - `data-invalid` / `aria-invalid`: `border-red-400/50`, ring `ring-red-400/20`.
   - Disabled: `opacity-50`, `cursor-not-allowed`.

2. **`textarea.tsx` → `DashboardTextarea`**
   - Same token set as Input, `min-h-[96px]`, `rounded-[12px]`, `py-2.5`, `resize-y`.

3. **`select.tsx` → `DashboardSelect*`** (Radix Select wrapper)
   - `DashboardSelectTrigger`: matches Input shell exactly (so a Select reads as an Input).
   - `DashboardSelectContent`: `bg-reps-panel`, `border-reps-border`, `rounded-[14px]`, `text-white`, soft drop shadow, `z-50` (Radix handles stacking).
   - `DashboardSelectItem`: `text-white/85`, hover/focus `bg-white/[0.06]`, selected check in `text-reps-orange`.
   - Export Group/Label/Separator/ScrollUpButton/ScrollDownButton.

4. **`card.tsx` → `DashboardCard` + Header/Title/Description/Content/Footer**
   - Surface: `bg-reps-panel`, `border border-reps-border`, `rounded-[16px]` (standard card).
   - Header `p-5 pb-3`, Content `p-5 pt-0`, Footer `p-5 pt-3 border-t border-white/8`.
   - Title `text-[15px] font-semibold text-white`, Description `text-[13px] text-white/70`.

5. **`badge.tsx` → `DashboardBadge`** (CVA, mirrors shadcn `Badge` shape)
   - Variants: `neutral` (default — `bg-white/[0.06] text-white/80 border-white/12`), `orange` (`bg-reps-orange-soft text-reps-orange border-reps-orange-border`), `success` (emerald triplet per `mem://design/status-colors`), `warn` (amber, used sparingly), `danger` (`bg-red-500/10 text-red-300 border-red-400/25`).
   - Pill shape (`rounded-full`), `h-5` / `text-[11px]`.

6. **`empty.tsx` → `DashboardEmpty` + `DashboardEmptyTitle` / `Description` / `Actions`**
   - Wraps shadcn `Empty` composition, locks dark tokens: `bg-white/[0.02]`, `border-dashed border-white/12`, `rounded-[16px]`, `text-white` headings, `text-white/65` body.
   - Optional icon slot, `size-10` circle `bg-white/[0.06]`.

7. **`tooltip.tsx` → `DashboardTooltip*`** (Radix Tooltip wrapper)
   - Provider + Root + Trigger + Content.
   - Content: `bg-reps-ink`, `text-white`, `text-[12px]`, `rounded-[8px]`, soft shadow, small `px-2.5 py-1.5`, arrow `fill-reps-ink`.

8. **`alert-dialog.tsx` → `DashboardAlertDialog*`** (Radix AlertDialog wrapper)
   - Mirrors `DashboardDialog` tokens (overlay, content surface, radius, close pattern).
   - `Action` button → `DashboardButton variant="primary"` (or `destructive-ghost` when caller passes a `destructive` prop).
   - `Cancel` button → `DashboardButton variant="ghost"`.
   - Composition exports: Root, Trigger, Portal, Overlay, Content, Header, Footer, Title, Description, Action, Cancel.

9. **`toast.tsx` → `DashboardToaster`** (Sonner theme)
   - Re-export Sonner `toast` and a pre-themed `<DashboardToaster />` with `theme="dark"` and `toastOptions.classNames` mapping to: surface `bg-reps-panel border border-reps-border text-white rounded-[14px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]`, title `text-white`, description `text-white/70`, success icon `text-emerald-300`, error icon `text-red-300`, action button `DashboardButton primary`, cancel `DashboardButton ghost`.
   - Mount `<DashboardToaster />` inside the authenticated layout (`src/routes/_authenticated/route.tsx`) so dashboard toasts pick up dark styling without affecting the public site's Sonner instance.

## Style-guide page

Add `src/routes/_authenticated/_admin/dashboard_._design.tsx` (admin-only, `meta: [{ name: 'robots', content: 'noindex' }]`). Renders every primitive in every variant on a single scrollable page — buttons, inputs (default/focus/invalid/disabled), select (open), card, badge swatches, empty state, tooltip, dialog + alert-dialog triggers, and a row that fires success/error/info toasts. Used as visual QA when adding new primitives.

## ESLint guard

Add a `no-restricted-imports` rule scoped to `src/routes/_authenticated/**` and `src/components/dashboard/**` that forbids importing from `@/components/ui/{button,dialog,alert-dialog,input,textarea,select,card,badge,empty,tooltip,sonner}`. Message: "Use the dashboard UI kit (`@/components/dashboard/ui`) — shadcn defaults are light-themed and break dark dashboards."
- Existing `src/components/ui/*` files stay untouched (public/marketing surface keeps using them).

## Memory + migration

- Update `mem://design/dashboard-ui-kit` with the full primitive inventory + token map.
- No sweep of existing dashboard routes in this PR — that's a follow-up. Add a short checklist to the memory note listing routes still on raw shadcn so the next sweep is mechanical.

## Out of scope

- No changes to public/marketing pages, locked screens, `src/components/ui/*`, brand orange, or radius scale.
- No new colors. Emerald only for status per existing rule.
- No light-mode theming.

## Technical notes

- All Radix wrappers use `React.forwardRef` and preserve `data-state` / `data-side` so animation classes (`data-[state=open]:animate-in` etc.) keep working.
- Sonner: install is already present (used on public side). The dashboard `<DashboardToaster />` is a second instance with dark styling; Sonner supports multiple toasters keyed by position — mount once inside `_authenticated` and consumers call `toast(...)` from `sonner` as normal.
- AlertDialog: import `@radix-ui/react-alert-dialog` (add via `bun add` if not already a transitive dep — check first).
- Tooltip provider wraps the authenticated layout once with `delayDuration={200}` so individual usages don't need their own provider.
