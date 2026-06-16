## What
Add a breadcrumb bar to the top of `/pro/$slug` (the public professional profile page) matching the existing pattern used on `/in/$location` and `/professions/$profession`.

## How
Insert a breadcrumb `nav` directly under `<PublicHeader>` in `src/routes/pro.$slug.index.tsx`:

- **Trail:** Home → Find a Professional → {Pro Name}
- **Styling:** Same as existing breadcrumbs: `mx-auto max-w-[1320px] px-6 pt-6 lg:px-10`, `nav` with `aria-label="Breadcrumb"`, `flex items-center gap-1.5 text-[12px] text-reps-muted-light`, `ChevronRight` separators, current page as `font-medium text-reps-charcoal`.
- **Links:** Use `<Link to="/">` and `<Link to="/find-a-professional">` from `@tanstack/react-router`.

This is a pure UI addition — no route or layout changes, no effect on the locked profile sections below.

## Files
- `src/routes/pro.$slug.index.tsx` — add breadcrumb block after `<PublicHeader />`