## What's actually happening

You're right — sorry for the bad answer. The gate in `src/routes/__root.tsx` runs **client-only**:

```ts
if (typeof window === "undefined") return;   // ← SSR skips the gate entirely
...
const { data } = await supabase.auth.getSession();
if (!data.session) throw redirect({ to: "/coming-soon" });
```

So when you hit `repsuk.org`:
1. The server renders the **real homepage** HTML and ships it to the browser.
2. Only after hydration does the client check `supabase.auth.getSession()` (which reads `localStorage`) and *then* redirect.
3. If you've ever signed in on that browser, you have a session in `localStorage` and the redirect never fires — you just stay on the homepage.

That's why you land on `/`, not `/coming-soon`. The redirect is real, but it's too late and too easy to bypass.

## Fix

Make the gate run on the server too, where there's no `localStorage`. The Supabase session isn't visible during SSR, so the server can't tell who's authenticated — we treat every SSR request as "unknown" and serve coming-soon, then let the client re-route signed-in users back in after hydration.

### Changes (one file: `src/routes/__root.tsx`)

1. **Remove the `if (typeof window === "undefined") return;` short-circuit** in `beforeLoad`.
2. **Server branch:** when running on the server (no `window`), for any non-allowlisted path, `throw redirect({ to: "/coming-soon" })` unconditionally. SSR'd HTML on `repsuk.org/` becomes the coming-soon page — no leaking the real homepage.
3. **Client branch:** keep the existing `supabase.auth.getSession()` check so authenticated users (you, demo, admins) get bounced from `/coming-soon` to the real route they asked for.
4. On `/coming-soon` itself, add a tiny client effect: if a session exists, `router.navigate({ to: <original path or "/"> })`. This way an authed user who lands on coming-soon (because SSR sent them there) is auto-forwarded to the real site within a frame, instead of getting stuck.

### Why this works

- **Anonymous visitor on `repsuk.org`** → SSR redirects to `/coming-soon`. They never see the real homepage HTML.
- **Authenticated visitor on `repsuk.org`** → SSR sends them to `/coming-soon`, then the client effect immediately forwards them to `/`. Tiny flash, but correct gating.
- **Crawlers / link unfurls** → see `/coming-soon` content, which is what we want pre-launch (root is already `noindex` but this also closes the og:image / preview gap).
- **One-line revert at launch:** flip `LAUNCH_GATE_ENABLED = false` in `src/lib/launch.ts` exactly as today.

### What I will NOT touch

- `src/lib/launch.ts` — allowlist, launch date, flag stay as-is.
- Any auth flow, `/auth`, server functions, or the rest of the routing.
- No DNS / domain changes — this is purely the gate logic.

Want me to implement?