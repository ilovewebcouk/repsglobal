
# Public header navigation wiring

Single file touched: `src/components/public/PublicHeader.tsx`. No new routes, no design-system changes, no footer changes.

## 1. Desktop header (lg and up) — unchanged from previously approved plan

5 top-level nav items, using shadcn `DropdownMenu` styled to match the approved REPs mock-ups (`bg-reps-ink`, `rounded-[22px]`, `shadow-lg shadow-black/20`, `text-[14px] text-white/85`, hover/focus `bg-white/5 text-reps-orange`).

| Nav item | Type | Route | Dropdown children (existing routes only) |
|---|---|---|---|
| Find a Professional | dropdown | `/find-a-professional` | `/specialisms`, `/cpd` |
| How REPs Works | direct link | `/how-it-works` | — |
| For Professionals | direct link | `/for-professionals` | — |
| Resources | dropdown | `/resources` | `/resources/$slug` ×3 articles, `/faq`, `/help`, `/business-tools` |
| About REPs | dropdown | `/about` | `/standards`, `/verify`, `/reviews`, `/press`, `/careers`, `/contact` |

Right side: **Log in** → `/login` (fixes current `/signup` bug), **Join REPs** → `/signup`. Active states via `Link activeProps={{ className: "text-reps-orange" }} activeOptions={{ exact: false }}`.

Logo, container, height, fonts, button shapes, gaps, colours: **untouched**.

## 2. Mobile header (below lg) — new

Replace the current "logo + invisible nav + Join REPs" layout with:

- **Left:** REPs logo (unchanged)
- **Right:** `Join REPs` orange CTA (kept visible from `sm:` up; hidden on the very smallest widths if it would crowd the hamburger), then a **hamburger icon button** (`lucide-react` `Menu`, `size="icon"` shadcn Button variant `ghost`, `aria-label="Open menu"`, `rounded-[10px]`, min 44×44 tap target)

Hamburger is **always** visible below `lg`.

## 3. Mobile drawer

Built with shadcn `Sheet` (`side="right"`, `w-full sm:max-w-sm`) so we get focus trap, ESC-to-close, and aria semantics for free. Styled to match the approved dark header:

- `bg-reps-ink text-white`, no rounded corners on the panel itself (full-bleed), inner content uses the REPs radius system
- **Top bar:** REPs logo (left) + close button (`X` icon, ghost, `aria-label="Close menu"`, `rounded-[10px]`, 44×44) on the right
- **Nav list:** the 5 top-level items, full-width tap rows, `text-[18px] font-medium text-white`, `py-4`, divider `border-white/10`, active row gets `text-reps-orange`
- **Dropdown items become accordions:** shadcn `Accordion type="single" collapsible` for Find a Professional / Resources / About REPs. Closed by default; chevron rotates on open. Child links indented, `text-[15px] text-white/80`, `rounded-[10px]` hover `bg-white/5`. Same routes as the desktop dropdowns above — nothing new.
- **Footer of drawer (sticky bottom, `border-t border-white/10`, `p-4`, `space-y-3`):**
  - `Log in` → `/login` — secondary outline button, `rounded-[10px]`, full width
  - `Join REPs` → `/signup` — primary orange `#FF7A00` (`bg-reps-orange`) button, `rounded-[10px]`, full width

## 4. Behaviour

- Drawer `open` state held locally in `PublicHeader` (`useState`)
- Every `Link` inside the drawer calls `setOpen(false)` on click so navigation closes the menu
- Sheet handles ESC, overlay click, and focus return to the hamburger trigger
- Keyboard: hamburger and close are real `<button>`s; accordion triggers and links are all natively focusable; tab order = top→bottom
- No scroll lock work needed — Sheet handles body scroll lock
- Drawer hidden at `lg:` and up via the Sheet trigger living inside a `lg:hidden` wrapper; desktop nav stays in a `hidden lg:flex` wrapper. No desktop header changes.

## 5. Skipped / out of scope

- No new routes created. Every link points at an existing file in `src/routes/`.
- No CMS, auth logic, payments, DB changes, design-system edits, or footer edits.
- No changes to logo, colours, fonts, or the approved desktop layout.

## Post-implementation deliverable

After build I will post:
1. Every header nav item + its route
2. Every dropdown / accordion child + its route
3. Mobile drawer Log in / Join REPs targets
4. Confirmation that no proposed link was skipped (all routes exist)
