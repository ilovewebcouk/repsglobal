## Scope

Tighten the **Contact details** section of `/dashboard/profile`. Four moves you named.

## Decisions

### 1. Remove "Public email" entirely
Account email is captured at signup and lives in Settings. Duplicating it here implies a separate public address — confusing and off-pattern (all contact happens through the platform).

- Delete the `Field` (line 1072 in `dashboard_.profile.tsx`).
- Drop from form state, dirty check, completeness checklist, save payload, Zod schema, and the select/return in `dashboard-profile.functions.ts`.
- Column `professionals.public_email` is left in the database (no destructive migration). It just stops being read or written.

### 2. Remove "Website" entirely
The shop-front is the website. URL is auto-generated as `/c/{slug}` and will be surfaced as its own sidebar link in the dashboard. No external website field belongs in this editor.

- Delete the `Field` (line 1079).
- Drop `website` from form state, dirty check, save payload, Zod schema, and the `professionals` select in `dashboard-profile.functions.ts`.
- "Website or social link" row on the completeness checklist (line 174) becomes **"Social link"** and only checks the social fields.
- Column `professionals.website` is left in the database for now (non-destructive).

### 3. Languages spoken — curated picker, max 4
Replace the free-text `ChipInput` with a small searchable multi-select drawn from a curated list. This is the "click in and pick from a list" pattern you referenced from the professions/specialisms work — not the free-text-Enter chip.

- New component `LanguagePicker` in `src/components/forms/`. Sources from `src/lib/languages.ts` (≈30 most-spoken globally, English first, with an "Other…" escape hatch capped at 40 chars).
- Render selected as removable chips; an "Add language" trigger opens a shadcn Command/Popover with search + checkmarks.
- Hard cap at **4**. At the cap, add-trigger is disabled with a hint.
- Zod schema: `z.array(z.string().min(1).max(40)).max(4)`. Server cap drops 20 → 4.

### 4. Social links — wire correctly + extend
Already persisting; the gap is icon coverage that matches the shop-front and clean handles.

- Editor: add **TikTok** and **X** alongside Instagram / LinkedIn / YouTube — 5 inputs total, two-column on `sm`, three on `md`.
- Normalise on save: strip `https://`, leading `@`, trailing slashes. Store the handle only (e.g. `katiegibbs`). Render layer prepends the canonical URL — prevents broken `https://https://…` links downstream.
- Add `social_tiktok` and `social_x` (both `text`, nullable) to `professionals` via migration; add to the `select` and Zod schema in `dashboard-profile.functions.ts`.
- Coach shop-front `/c/$slug` (locked visuals): the hardcoded `socials[]` at line 308 is replaced by a derivation from the saved fields. Visual layout unchanged — data source only.

## Out of scope this turn

- Locked visuals on `/c/$slug` (only the data source for socials changes).
- Verified-tier public profile `/pro/$slug`.
- Settings-side account email management (already exists).
- Tagline, Bio, Photo, Specialisms, AI assist.
- Adding the new "Shop front" sidebar entry (separate task — you'll call it).

## Verification

1. Contact section shows only **Phone**, **Languages (≤4, picker)**, **Socials (5 inputs)**. No Public email. No Website.
2. Try to add a 5th language → blocked with hint; remove one → adder re-enables.
3. Paste `https://instagram.com/@katiegibbs/` into Instagram → saved + reloaded as `katiegibbs`.
4. Save → `/c/{slug}` shop-front shows the saved socials with correct working links, layout unchanged.
5. Completeness rail: Contact details ticks on phone alone; "Social link" ticks on any one social.

## Honest take (since you asked)

The world-class move on this page is removing fields, not adding them. Two dead inputs gone, one free-text chip replaced with a constrained picker so the data is actually usable downstream (filters, SEO chips, shop-front badges), socials normalised so links don't break. I am deliberately NOT adding: WhatsApp, Calendly, "preferred contact method", "response time", or a public phone toggle. Those are mid-tier directory clutter. Hold the line — every contact route goes through REPs.
