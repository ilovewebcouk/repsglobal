# Fix Duplicate Notifications — Audit + Consolidation

## Root cause

Two `<Toaster />` instances mount at the same time when you're in the dashboard, so every toast renders twice:

1. `src/routes/__root.tsx:237` — light, `top-right`
2. `src/components/dashboard/DashboardShell.tsx:221` — dark, `bottom-right` (the one you like)

Separately, in the website editor, **Publish** triggers a "Website saved" toast *and* a "Website published" toast for one click, because `publishMut` internally calls `saveAll()`.

## Plan

### 1. One toaster, app-wide (dark, bottom-right)

- Update `src/components/ui/sonner.tsx` so the default `<Toaster />` matches the dashboard style: `position="bottom-right"`, `theme="dark"`, `richColors`, `closeButton`, and the reps-branded `toastOptions` currently in `DashboardToaster`.
- Keep the single mount in `src/routes/__root.tsx` (replace the current `<Toaster richColors position="top-right" />` with the updated component). This covers public routes, auth, dashboard, everything.
- Remove `<DashboardToaster />` from `src/components/dashboard/DashboardShell.tsx:221`.
- Delete the now-unused `DashboardToaster` component file (and its export) so nobody re-mounts it.
- Leave `src/components/dashboard/ui/toast.tsx` alone if it only re-exports `toast` from `sonner` — that's harmless. Only remove it if it also exports a Toaster.

### 2. Suppress the "Saved" toast during Publish

In `src/routes/_authenticated/_professional/dashboard_.website.tsx`:

- Extract the actual save work into a plain async helper (or add a `silent: boolean` option) so `saveMutation.mutateAsync` can be called without firing its own success toast.
- `publishMut` calls the silent save, then shows only the "Website published" toast.
- Manual Save button keeps firing the "Website saved" toast as today.

### 3. Sanity sweep

- `rg "<Toaster|<Sonner|<SonnerToaster"` across `src/` — confirm exactly one mount remains after the change.
- `rg "from \"sonner\"" src | wc -l` — no code change needed; all ~60 call sites will now render into the single toaster.
- Manually verify: Save, Publish, Discard, Pillar/Result/FAQ dialog save+delete each produce exactly one toast.

## Out of scope

- Consolidating the `sonner` import paths (direct vs `@/components/dashboard/ui/toast`). Cosmetic only — doesn't cause duplicates.
- Redesigning toast copy/variants.

## Files touched

- `src/components/ui/sonner.tsx` (style + defaults)
- `src/routes/__root.tsx` (already mounts it — no structural change)
- `src/components/dashboard/DashboardShell.tsx` (remove mount)
- `src/components/dashboard/DashboardToaster.tsx` (delete)
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` (silent save inside publish)
