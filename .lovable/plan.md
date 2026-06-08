# Remove the public Verification pages

Take down the public "How verification works" page (`/verify`) and the per-pro verified-ID lookup (`/verify/$id`), plus every place that links to them. Leave admin tools, auth email confirmation, and the in-page VerifySteps strip alone.

## Keep (out of scope)
- `/verify-email` — auth email confirmation, unrelated.
- `/admin/verification` — internal admin queue, not a public page.
- `VerifySteps` marketing primitive — that's the inline "how we verify" strip used across marketing pages, not the `/verify` page.

## Delete
- `src/routes/verify.tsx`
- `src/routes/verify.$id.tsx`
- `src/components/marketing/VerificationMoment.tsx` (only used on the homepage)

## Edit — remove links and the homepage section
- `src/routes/index.tsx` — drop the `VerificationMoment` import and the `<VerificationMoment …>` section (~line 429). No other homepage changes (locked-homepage memory respected — the only section touched is the one being removed at the user's request).
- `src/components/public/nav-config.ts` — remove the two `/verify` entries (megamenu link at line 50, footer link at line 91) and drop `"/verify"` from the link-type union on line 76.
- `src/components/public/PublicFooter.tsx` — remove the `{ label: "Verification", to: "/verify" }` entry (line 37).
- `src/components/public/HeaderCommandPalette.tsx` — remove the command-palette item that navigates to `/verify` (line 45).
- `src/routes/find-a-professional.tsx` — replace the `<Link to="/verify">How verification works</Link>` aside CTA (lines 1023–1029) with non-link copy, or remove the CTA entirely so the "Why REPs" trust panel still reads cleanly.
- `src/routes/sitemap[.]xml.ts` — remove the `/verify` entry (line 24).

## Notes
- `routeTree.gen.ts` is auto-generated; the TanStack Router plugin will regenerate it once the route files are deleted — no manual edit.
- `c.$slug.tsx` line 1308 just contains the words "How we verify" as in-page copy with no link to `/verify`; leaving it alone.
- After the edits, run a quick `rg "/verify\"|to=\"/verify"` sweep to confirm no stragglers, then verify the build is clean.
