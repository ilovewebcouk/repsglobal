# Tidy up `/admin/certificates` → Pricing tab

## Why it looks messy today

- One giant `PCard` holds 4 unrelated controls separated by faint `<hr>`-style dividers → reads as an unfinished form.
- Each section has its own big `£15.00 / certificate` display block **and** an input **and** its own save button → three ways of showing the same value.
- Save buttons are full brand-orange, left-aligned, repeated 4× → visually noisy, no hierarchy.
- No grouping: "Certificate price", "UK postage", "International postage", and "Default Royal Mail service" are treated as equal siblings when the first is pricing and the last is a shipping default.

## Target pattern (matches `/admin/settings`)

Two grouped `PCard`s, each with a proper header, and each control rendered as a compact **settings row**: label + helper on the left, input + inline save on the right. No more huge `£15.00` display headers — the input's current value **is** the display.

```text
┌─ Pricing ─────────────────────────────────────────────┐
│  Certificate unit price          [ 15.00  ] [ Save ]  │
│  Charged per certificate.                             │
│  ─────────────────────────────────────────────────    │
│  UK postage per batch            [  6.50  ] [ Save ]  │
│  Once per UK batch, any size.                         │
│  ─────────────────────────────────────────────────    │
│  International postage per batch [ 15.00  ] [ Save ]  │
│  Once per non-UK batch. Royal Mail Intl Tracked.      │
└───────────────────────────────────────────────────────┘

┌─ Dispatch ────────────────────────────────────────────┐
│  Default UK Royal Mail service                        │
│  [ Royal Mail Tracked 48 (UK) ▾ ]           [ Save ]  │
│  International batches always use Intl Tracked.       │
└───────────────────────────────────────────────────────┘
```

## Changes (scoped to `src/routes/admin_.certificates.tsx`, `PricingPanel` only)

1. Split into two `PCard`s: **Pricing** (3 fee rows) and **Dispatch** (default service).
2. Introduce a small local `SettingRow` component: `{ label, helper, children }` with `flex items-center justify-between gap-6` on desktop, stacked on mobile.
3. Per row: `Input` (width ~140px, right-aligned numeric) + secondary `Button` "Save" inline. Disabled when value equals current or empty. Loader inside button.
4. Remove the giant `£15.00 / certificate` display headers — current value becomes the input's `defaultValue`/placeholder-with-value.
5. Replace `<hr>`-style dividers with `divide-y divide-white/5` on the row list.
6. Save buttons: `variant="outline"` size sm, not full brand-orange fills — the page already has enough orange.
7. Keep all existing server calls (`getCertificatePricing`, `setCertificatePricing`) and payload shape untouched.

## Out of scope

- No changes to Templates / Batches / Print queue / Search & revoke tabs.
- No pricing logic changes, no schema changes, no new server functions.
- No changes to `/admin/settings` itself.

## Files

- `src/routes/admin_.certificates.tsx` — refactor `PricingPanel` (lines ~107–283) only.
