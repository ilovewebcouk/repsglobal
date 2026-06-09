## Goal

Remove the gray hairline directly under the hero on `/features/visibility` by switching its chrome to the same `border-b` pattern used on `/for-professionals`. Lock the divider convention in memory so future marketing pages match.

## Convention (new shared standard)

- Hero `<section>`: no divider.
- Every subsequent `<section>`: `border-b border-reps-border` (no `/60` opacity).
- The page's final `<section>` (FinalCta wrapper) also gets `border-b border-reps-border`, so the page bottom feels intentional rather than fading out.

Rationale: this is exactly what `/for-professionals` does, and the hero's bottom-fade gradient flows into the first section seamlessly with no hairline visible. Borders below each subsequent section read as deliberate chapter breaks.

## Changes in `src/routes/features.visibility.tsx`

Swap every `border-t border-reps-border/60` to `border-b border-reps-border` on these 8 sections:

| Line | Section |
| --- | --- |
| 328 | Problem |
| 425 | AnnotatedProfile (`id="profile"` — keep `scroll-mt-24`) |
| 454 | Discovery |
| 504 | Trust |
| 558 | Reviews |
| 606 | SEO |
| 637 | Segments |
| 682 | TierComparison |

FAQ + FinalCta wrappers: confirm they also get `border-b border-reps-border` if currently bare so the page ends cleanly (read first, then apply same swap).

Hero section unchanged.

## Verification

1. Reload `/features/visibility` and confirm: no hairline directly under hero, dividers still present between subsequent sections, page bottom feels intentional.
2. Side-by-side flick against `/for-professionals` — chrome should now read identically.
3. Run `bash /tmp/audit.sh` — must exit clean (only the pre-existing documented 14px enquire-page exception).

## Memory updates

- Add a one-liner to Core under the rhythm rule:
  "Marketing divider convention: hero has NO divider; every subsequent section uses `border-b border-reps-border`. Never `border-t`, never `/60` opacity on chrome borders."
- Append the same convention to `mem://design/marketing-section-primitives` under the new "Locked vertical rhythm" table.
- Note the chrome change in `mem://design/locked-visibility`.

## Out of scope

- `/specialisms`, `/cpd`, other `/features/*` — flagged for future sweep.
- Colors, copy, components, spacing — unchanged. Only the border direction + opacity changes.
