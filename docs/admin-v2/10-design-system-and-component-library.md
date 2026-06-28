# REPS Admin v2
## Part X — Design System & Component Library

**Document:** 10  
**Status:** Draft specification for approval  
**Audience:** Design, engineering, Lovable implementation agent  
**Scope:** shadcn/ui usage, layout primitives, KPI cards, charts, tables, drawers, dialogs, timelines, states, tokens and interaction rules  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Admin v2 uses shadcn/ui as the design system foundation.

The goal is not to make the admin decorative. The goal is to make it consistent, accessible and fast to understand.

Every page should feel like part of the same product. Operators should not learn a new UI pattern on every route.

---

## 1. Design Principles

### Clear before clever

Operators are making business decisions. The UI must be obvious.

### Data dense, not cluttered

Admin pages can show a lot of information, but hierarchy must remain clear.

### Action near context

Actions should appear where the operator sees the relevant record.

### Explain states visually and verbally

Colour alone is not enough. Use labels and tooltips.

### Reuse primitives

Do not invent bespoke cards, dialogs or tables when a shared primitive exists.

---

## 2. shadcn/ui Foundation

Use shadcn/ui primitives for:

- Button
- Badge
- Card
- Sheet
- Drawer
- AlertDialog
- Dialog
- Tooltip
- HoverCard
- Popover
- Calendar
- Select
- Command
- Tabs
- Table/DataTable
- ScrollArea
- Skeleton
- Sonner/Toast
- DropdownMenu
- ContextMenu
- NavigationMenu
- Chart

If a component exists in shadcn, use it before creating a custom primitive.

---

## 3. Layout Primitives

### PageShell

For admin pages.

Contains:

- title,
- subtitle,
- actions,
- optional tabs/subnav,
- optional alert/banner slot.

### SectionPanel

For grouped content.

Contains:

- heading,
- description,
- optional action,
- content.

### KPIGrid

Responsive grid for KPI cards.

### DataSection

For tables with filters and actions.

### SplitWorkspace

For high-throughput review flows such as Verification and Support.

---

## 4. KPI Cards

KPI cards must include:

- label,
- value,
- subtitle,
- trend/delta where relevant,
- status where relevant,
- drill-down affordance.

KPI cards must not include raw implementation detail.

### KPI card states

- neutral,
- positive,
- warning,
- critical,
- loading,
- empty,
- error.

### KPI card click behaviour

If a card is clickable, use hover affordance and arrow.

If not clickable, do not show pointer cursor.

---

## 5. Tables and Data Grids

Tables must support:

- clear column labels,
- sorting where useful,
- filtering,
- pagination or virtualisation,
- row actions,
- empty states,
- loading states,
- export where relevant.

### Standard row actions

- Open Timeline
- Open record
- Open Stripe where relevant
- Copy ID
- Action-specific buttons

### Dangerous actions

Dangerous actions must be separated visually and require AlertDialog confirmation.

---

## 6. Charts

All charts use the shadcn chart component with Recharts.

Required:

- `ChartContainer`
- `ChartTooltip`
- `ChartTooltipContent`
- `accessibilityLayer`
- fixed/min height
- chart config with human labels
- CSS variables using `var(--chart-1)` style tokens

### Chart types

| Purpose | Chart |
|---|---|
| cumulative growth | AreaChart |
| daily cash | BarChart |
| forecast by date | BarChart |
| tier mix | BarChart horizontal |
| latency over time | LineChart |
| distribution | BarChart |

### Chart rules

- Charts must have meaningful empty states.
- Tooltips must use human currency/date labels.
- Do not use random colours.
- Do not hide axes on large explanatory charts.
- Sparklines may hide axes.

---

## 7. Badges

Badges communicate state.

### Membership badges

- Core
- Pro
- Studio
- Free
- Legacy
- BD

### Status badges

- Active
- Pending
- Failed payment
- In recovery
- Pending cancellation
- Churned
- Suspended
- Verified
- Needs review

### Tone mapping

| Tone | Meaning |
|---|---|
| Neutral | informational |
| Success | healthy/complete |
| Warning | needs attention |
| Critical | action required |
| Muted | inactive/resolved |

Never rely on colour alone.

---

## 8. Alert Banners

Alert banners appear at the top of pages.

### Types

- Critical platform issue
- Payment recovery issue
- Placeholder/preview warning
- Impersonation
- Read-only/settings warning

### Rules

- Critical banners link to owning page.
- Placeholder banners must be visually obvious.
- Impersonation banner is always visible while active.
- Banners must not stack endlessly; group where possible.

---

## 9. Dialogs and Confirmation

Use `AlertDialog` for destructive or irreversible actions.

Examples:

- delete professional,
- suspend professional,
- seed all migration rows,
- reset linking,
- live webhook replay,
- remove email suppression,
- revoke admin.

Confirmation dialog includes:

- action name,
- consequence,
- affected entity,
- optional typed confirmation for severe actions,
- cancel button,
- destructive confirm button.

---

## 10. Drawers, Sheets and Side Panels

Use side panels for contextual detail without losing place.

Examples:

- email lifecycle drawer,
- review removal details,
- support ticket sheet,
- verification certificate drawer,
- activity event detail.

Do not navigate away for small detail inspection.

---

## 11. Timeline Component

The Timeline is a reusable component.

Required features:

- grouped by day,
- icon per source,
- status tone,
- summary,
- timestamp,
- entity links,
- external links,
- expandable details,
- filter chips,
- search,
- pagination.

Timeline items must be written in human language.

Bad:

```text
invoice.payment_failed
```

Good:

```text
Renewal payment failed
```

Raw event type can appear in details.

---

## 12. Empty States

Empty states must explain what absence means.

Bad:

```text
No data
```

Good:

```text
No failed payments. All active subscriptions are currently paid.
```

Every empty state should include next action when useful.

---

## 13. Loading States

Use skeletons for:

- KPI cards,
- chart panels,
- tables,
- timeline rows.

Do not show layout jumps.

---

## 14. Error States

Errors should include:

- human message,
- retry action,
- support/debug link where relevant,
- degraded fallback if available.

Never silently show zero when a query failed.

---

## 15. Navigation

Sidebar is the primary admin navigation.

Ops pages also use the Ops sub-nav.

Breadcrumbs are useful for deep pages:

```text
Admin > Operations > Billing
```

Member Timeline should show member context in the header so deep links are understandable.

---

## 16. Command Palette

Future Admin v2 should support a command palette.

Primary commands:

- Find member
- Open dashboard
- Open billing health
- Open verification queue
- Open support
- Open reconciliation
- Open webhook recovery
- Create campaign

This is optional for first implementation but should be supported by the IA.

---

## 17. Responsive Behaviour

Admin is desktop-first but must remain usable on laptop/tablet.

Mobile is supported for emergency checks, not heavy operations.

Rules:

- tables become card lists on small screens where required,
- critical alerts remain visible,
- destructive actions remain confirmed,
- charts keep minimum height,
- filters collapse into sheets.

---

## 18. Accessibility

Requirements:

- keyboard navigable,
- focus states visible,
- dialogs trap focus,
- charts use accessibility layer,
- icon-only buttons have labels,
- colour not the only signal,
- headings form logical hierarchy.

---

## 19. Design Tokens

Use existing Tailwind/shadcn tokens.

Do not hardcode arbitrary one-off colours for operational state.

Chart colours use chart variables.

Severity tones should be centralised.

---

## 20. Acceptance Criteria

The Design System is complete when:

- all admin pages use shared primitives,
- all charts use shadcn chart conventions,
- all destructive actions use AlertDialog,
- all tables use consistent actions and filters,
- all operational states use consistent badge language,
- fake/dead UI is impossible to mistake as live,
- an operator can move between pages without relearning the UI.
