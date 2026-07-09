# Awarding-body logos — hybrid strategy

## Goal

Show the awarding body's actual logo next to approved qualifications on trainer profiles and the admin queue (instead of the generic graduation-cap icon), starting today with Logo.dev auto-fetch and progressively replacing with official uploads you send me.

## How the existing plumbing works

`src/lib/cpd/awarding-bodies.ts` already exposes:

```ts
type AwardingBody = { slug, name, aliases?, regulated?, logo? }
awardingBodyLogo(slug) → string | null
```

Callers (`RegulatedRow`, admin `QualificationDocDrawer`, profile qualifications section) already render `<img>` when `logo` is truthy, and fall back to the icon otherwise. So the only real work is populating `logo`.

## Step 1 — Add a `domain` field + Logo.dev fallback (this turn)

Add an optional `domain?: string` on `AwardingBody` and fill it for the 30 bodies where I can identify an official site. Then update `awardingBodyLogo(slug)`:

```ts
if (body.logo) return body.logo;             // official upload takes priority
if (body.domain) return logoDevUrl(body.domain); // fallback
return null;                                 // component uses icon
```

`logoDevUrl(domain)` reads `import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY` and returns `https://img.logo.dev/{domain}?token=...&size=128&format=png`.

## Step 2 — Link the Logo.dev connector

Logo.dev isn't linked to this project yet. I'll call `standard_connectors--connect` for it so `VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY` is injected. You'll get a one-tap approval prompt. If the workspace doesn't have a Logo.dev connection yet, that flow lets you set one up (free tier is fine).

## Step 3 — Domains for the 30 bodies

I'll populate `domain` for these using publicly known primary sites, for example:

- Focus Awards → `focusawards.org.uk`
- Active IQ → `activeiq.co.uk`
- 1st4sport → `1st4sportqualifications.com`
- NCFE → `ncfe.org.uk`
- YMCA Awards → `ymcaawards.co.uk`
- VTCT → `vtct.org.uk`
- Pearson → `pearson.com`
- City & Guilds → `cityandguilds.com`
- NASM → `nasm.org`
- UKSCA → `uksca.org.uk`
- …and so on for the rest of the list.

Any body where I can't confidently identify the domain gets left with `domain: undefined` and just keeps rendering the fallback icon until you send me the logo.

## Step 4 — When you send me an official logo

You upload the file to chat (PNG or SVG). I'll:

1. Upload to the Lovable CDN via `lovable-assets create`.
2. Set the resulting URL on that body's `logo` field.

Because `awardingBodyLogo()` prefers `logo` over the Logo.dev URL, the swap is instant with no other code changes.

## Files changed

- `src/lib/cpd/awarding-bodies.ts` — add `domain?` field, populate it, update `awardingBodyLogo()`.

## Out of scope

- No visual redesign of the qualification rows / cards. Same `<img>` slot, just populated.
- No admin UI for editing logos (send them in chat and I'll wire them).

## Note on Logo.dev quality

Logo.dev's coverage of niche awarding bodies is inconsistent — some will return a crisp logo, some will return a favicon, and some may 404 to a generic fallback. That's expected and why we're set up to progressively replace with your uploads. The image tag will still render something (or the icon if it 404s), so no broken layouts.
