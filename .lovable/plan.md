
# v2 hero — rebuild to match the mockup

Replace the current `/for-professionals-v2` hero with a split layout that matches the uploaded mockup:

```text
┌──────────────────────────────────────────────┐
│ [VERIFIED. TRUSTED. BOOKED.]                 │
│                                              │
│ Not just software.            ╔══════════╗   │
│ An AI operating system for    ║ laptop   ║   │
│ fitness professionals.        ║ /dashbrd ║──┐│
│                               ╚══════════╝  ││
│ Sub copy…                            ┌─────┐││
│                                      │ ph  │││
│ [Join REPs today] [Explore platform] │ /pt │││
│                                      └─────┘││
│ ✓ 25k+ pros  ✓ register …                   │
└──────────────────────────────────────────────┘
```

## Layout

- Two-column hero: copy left (max ~560px), device cluster right.
- Eyebrow pill "VERIFIED · TRUSTED · BOOKED" above H1.
- Keep H1 and orange second line.
- Sub copy rewritten to match mockup: "REPs is built for fitness professionals who want to get found, win more clients, deliver better coaching and grow a sustainable business. One platform. Every tool. Powered by AI."
- CTAs: **Join REPs today** → `/pricing` (primary), **Explore the platform** → `/features` (secondary).
- Trust strip stays under the hero (already built).

## Device cluster (the new bit)

A laptop frame with a phone frame floating bottom-right, overlapping.

- **Laptop frame** — new component `LaptopFrame.tsx`. Notched top bar (3 dots), thin bezel, base stand bar. ~640×400 inner viewport at desktop.
- **Phone frame** — new component `PhoneFrame.tsx`. iPhone-style notch, ~220×440 inner viewport.
- **Content inside frames**: load real app routes via `<iframe>` with `pointer-events: none`, `scrolling="no"`, scaled with `transform: scale(0.55)` and `transform-origin: top left`, sized to fit. This keeps the visual always-true to the actual app — change `/dashboard` and the hero updates itself.
  - Laptop iframe → `/dashboard`
  - Phone iframe → `/portal/today`
- Add `aria-hidden` + `tabindex="-1"` so iframes don't trap focus/screen readers.
- Fallback: a small `Sparkles` skeleton renders behind the iframe so a slow-loading frame doesn't show a blank rectangle.

## Responsive

- ≥ lg: side-by-side, cluster occupies right ~52% of the hero.
- md: cluster shrinks, stays beside copy.
- < md: cluster hides (or stacks below copy at smaller scale). Mobile hero is text-only with CTAs — phone visitors don't need a tiny laptop render.

## Files

- New: `src/components/marketing/LaptopFrame.tsx`
- New: `src/components/marketing/PhoneFrame.tsx`
- New: `src/components/marketing/HeroDeviceCluster.tsx` (assembles the two frames with the iframes inside)
- Edit: `src/routes/for-professionals-v2.tsx` — replace the hero `<section>` only. Everything below the hero stays as built.

## Out of scope

- The rest of the page (proof row, pillars, comparison, AI section, etc.) is untouched.
- v1 (`/for-professionals`) is untouched.
- No token / radius / colour changes.

## Compliance

- Frames use radius 22 (large panel) / 24 (hero) from the locked scale.
- Buttons keep radius 10, no shadows.
- All orange via `bg-reps-orange*` tokens — no hex.
- No backend, no real screenshot generation, no new routes.

## Risk to flag

iframes of internal routes work great in the live preview but they re-render the full layout including the `PublicHeader` and other heavy components inside the laptop. That's fine for `/dashboard` (it has its own shell) but `/portal/today` may render a full app shell that looks crowded at 0.55 scale. I'll pick the route that frames best — if `/portal/today` doesn't fit cleanly I'll fall back to `/dashboard_/clients/$slug` or render a small static phone mockup.
