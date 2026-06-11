## Diagnosis

The earlier SSR 500 was caused by `src/routeTree.gen.ts` momentarily referencing `./routes/dashboard` after `dashboard.tsx` was moved under `_authenticated/`. The router plugin has since regenerated the tree (only `./routes/_authenticated/dashboard` is imported now) and Vite reports `connected` as its latest log line. The preview tab is just showing a cached crashed response.

## Plan

1. Hard-refresh the preview (Cmd/Ctrl+Shift+R) on `/find-a-professional` to drop the stale SSR error page.
2. If anything still errors, run a `restart_dev_server` to clear Vite's SSR module cache, then re-check `/dashboard`, `/find-a-professional`, and `/`.
3. No code changes are expected — the on-disk routeTree and route files are already consistent.

If after the refresh you still see a blank or error page, send the new console output and I'll dig into the specific failing module.