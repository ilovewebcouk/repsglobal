## Owning the previous turn

I edited files in the last turn because that turn was tagged build mode in my instructions. You're now in plan mode, so nothing below will be touched until you approve. I also should have screenshotted the result before saying "done". That's on me.

## What I just verified in the preview

Screens I captured at the current build:

- Desktop home at 1366: header transparent over hero, search icon + Log in + Join REPs visible, mega-menus intact, logo unchanged.
- Desktop /for-professionals scrolled ~800px: header swaps to solid REPs dark with border, brand-orange active dot under "For Professionals". Working as specified.
- Mobile /for-professionals at 375: logo + hamburger only. Spec said "Join REPs may remain visible only if spacing allows" — currently it hides below the `sm` breakpoint (640px), which is why the bar looks bare. This is in-spec but may not be what you wanted visually.
- Mobile drawer open: REPs logo, close, Search professionals row, accordion sections for Find / Resources / About, flat links for How / For Professionals, Log in + orange Join REPs pinned to the footer. Active row highlighted.

So functionally everything is wired. Two things still need addressing before I call this good.

## Real bug: hydration mismatch

The runtime log shows:

```text
Hydration failed because the server rendered HTML didn't match the client.
+ <a href="#main-content" ...>
- <Suspense>
```

Cause: I put the skip-to-content `<a>` inside `RootComponent` (the client tree), but TanStack's SSR shell renders `RootShell` first. The mismatch makes React discard and re-render that subtree on first paint — which on a slow first load looks like a flash / layout pop. That alone could read as "looks fucked" on the first visit.

Fix (one file, ~5 lines): move the skip link into `RootShell` directly inside `<body>`, above `{children}`. That makes the SSR HTML and client HTML identical, hydration succeeds, no flash. The `#main-content` wrapper around `<Outlet />` stays where it is.

## Need from you: which screen is broken

Before I touch anything else, can you tell me which of these I'm looking for? A screenshot would settle it instantly:

1. First-paint flash on any page (that's the hydration bug above — fix lands it).
2. The bare mobile header at narrow widths (logo + hamburger only, no Join REPs / Log in). If yes, I'll show Join REPs from the smallest breakpoint up and only collapse it into the hamburger menu below ~360px.
3. A specific page where the now-`fixed` transparent header overlaps content it didn't used to overlap (I changed `absolute` → `fixed` so the header could stay during scroll for the solid-swap). If yes, I'll keep `absolute` until the scroll threshold, then promote to `fixed`+solid via a sentinel, so unsolved pages behave exactly like before.
4. Something on a desktop page I haven't looked at — point me at the route and I'll screenshot it.

## Plan once you confirm

Step 1 (always, regardless of answer): move skip link into `RootShell` to kill the hydration mismatch. No other changes in that edit.

Step 2 (conditional, based on which of 1–4 above):

- If (2): keep hamburger always present; show compact Join REPs CTA from 360px+; keep Log in inside the drawer only.
- If (3): swap header positioning to `absolute` at top, `fixed` only after the scroll threshold (state already exists in `useIsSolid`); no visual changes at rest.
- If (4): targeted fix on the specific route — described before any code lands.

Step 3: re-screenshot desktop home, desktop scrolled, mobile collapsed, mobile drawer open, and send them back to you in the reply. No "done" without screenshots this time.

## Out of scope (still deferred)

No new routes, no auth, no real search, no DB, no logo/colour/typography/radius/spacing changes, no mega-menu content rework, no command palette.
