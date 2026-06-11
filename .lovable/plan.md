## Goal

Mark six footer entries — **Careers, Press, Complaints, Help Centre, FAQ, Standards** — as non-interactive "Soon" items in the footer. Nothing clickable, no dead routes, no header active-state glow.

## Visual treatment (the "10/10" bit)

Footer item, replacing the current `<Link>`:

```tsx
<span
  aria-disabled="true"
  className="inline-flex items-center gap-2 text-[14px] text-reps-muted/60 cursor-default select-none"
>
  {label}
  <span className="rounded-[6px] border border-white/12 bg-white/[0.04] px-1.5 py-[1px] text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
    Soon
  </span>
</span>
```

- Label is muted (not the normal hover-white), so the eye reads it as deferred.
- Pill is **neutral white-on-white**, not emerald and not orange (memory: emerald is reserved for status; orange is brand-active).
- `cursor-default`, no hover-underline, no colour change.
- Wrapped in a shadcn `Tooltip` (`side="top"`) with content **"Launching soon"** — keeps it accessible without a native `title`.

## Footer data model

Update the `FooterLink` type in `src/components/public/PublicFooter.tsx`:

```ts
type FooterLink = { label: string; to?: string; soon?: boolean };
```

Mark these six entries with `soon: true` and drop `to`:

- For Members → Help Centre, FAQ
- Company → Standards, Careers, Press
- Legal → Complaints

Render logic: if `soon`, render the `<Tooltip>` + `<span>` block above; otherwise render the existing `<Link>`.

## Header

`src/components/public/PublicHeader.tsx` currently lights up its active state for `/standards`, `/help`, `/faq`, `/careers`, `/press`, `/complaints`. Remove those six `pathname.startsWith(...)` clauses from the active-match expression — the routes are going away.

## Routes

Delete the six route files so nothing is ever reachable, indexed, or hot-linked:

- `src/routes/careers.tsx`
- `src/routes/press.tsx`
- `src/routes/complaints.tsx`
- `src/routes/help.tsx`
- `src/routes/faq.tsx`
- `src/routes/standards.tsx`

The router tree (`routeTree.gen.ts`) regenerates automatically on next build.

Before deleting, grep the codebase for any internal `<Link to="/careers" | "/press" | "/complaints" | "/help" | "/faq" | "/standards">` references and either remove them or swap them to a sensible live target (most likely none exist outside the footer/header, but the grep is mandatory — TanStack Router type-checks routes and a stray `<Link to="/faq">` would break the build).

## Out of scope

- No new "Coming Soon" landing pages, no email capture, no waitlist.
- No copy changes to other surfaces beyond the footer & header.
- No backend / DB / SEO redirect work — these URLs were never published or indexed.

## Acceptance

- Footer shows the six items as muted labels with a neutral "Soon" pill; hover does nothing; tooltip reads "Launching soon".
- Header no longer treats those paths as active.
- Visiting `/careers`, `/press`, `/complaints`, `/help`, `/faq`, `/standards` falls through to the root `notFoundComponent`.
- `bun run build` (run automatically by the harness) passes with no missing-route type errors.
