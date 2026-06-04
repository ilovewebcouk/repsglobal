## Goal

Replace the four `MockupPlaceholder` boxes inside the `ProductBlock`s on `/for-professionals-v2` with real, scaled iframe mockups of pages we already have — using the same `LaptopFrame` / `PhoneFrame` pattern the hero uses. The AI section keeps its bespoke `AiCommandCentreMock` (it isn't a placeholder).

## Page → mockup mapping

| Section | Frame | Source route |
|---|---|---|
| Pillar 1 · Visibility (verified profile) | Laptop | `/pro/sarah-mitchell` (existing pro profile page) |
| Pillar 1 · Leads CRM | Laptop | `/dashboard/leads` |
| Pillar 3 · Bookings & payments | Laptop | `/dashboard/calendar` |
| Pillar 4 · Client portal | Phone (centered, larger than hero phone) | `/portal/today` |

If `/pro/sarah-mitchell` doesn't resolve at build time we'll fall back to `/find-a-professional`. Phone iframes scale ~0.34; laptop iframes scale ~0.5 — same as hero.

## New component

`src/components/marketing/DeviceMockup.tsx` — thin wrapper that takes `{ device: "laptop" | "phone", src, scale?, title }` and renders the right frame + a `ScaledFrame` inside (extracted from `HeroDeviceCluster`). Iframes stay `aria-hidden`, `tabIndex={-1}`, `pointer-events-none`, `scrolling="no"`, `loading="lazy"`.

## ProductBlock change

Add an optional `mockup?: { device: "laptop" | "phone"; src: string; title: string }` prop. When present, render `<DeviceMockup ... />` instead of `<MockupPlaceholder label={imageLabel} />`. `imageLabel` stays as a fallback for any block that doesn't pass `mockup` yet.

## Edits

1. **Create** `src/components/marketing/DeviceMockup.tsx` + extract `ScaledFrame` into it; `HeroDeviceCluster` re-imports it (no visual change to hero).
2. **Edit** `src/components/marketing/ProductBlock.tsx` — add `mockup` prop + conditional render.
3. **Edit** `src/routes/for-professionals-v2.tsx` — pass `mockup={{...}}` to the four `ProductBlock`s listed above. Phone block (client portal) gets a centered wrapper so the phone doesn't fill the column.

## Out of scope

- v1 `for-professionals.tsx`
- `AiCommandCentreMock` (already custom)
- New routes, auth, or styling token changes
- Any change to the hero cluster's visuals

## Risk / known limits

- Iframes of `/dashboard/*` and `/portal/today` may hit auth gates and render an empty / login state. If so, the laptop frame will show that page's public skeleton. Mitigation: if a route gates out, we swap to its public marketing twin (e.g. `/features/operations` for Leads) — decided per-section once we see the result.
- Multiple iframes on one page = heavier hero. All iframes use `loading="lazy"` so only the visible ones load on first paint.
- No design tokens or radii change. Frames already follow the locked radius system.