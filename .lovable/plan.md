# Fix enquire-page avatar radius

## Why
The compliance audit flagged `rounded-[14px]` on the pro headshot in `src/routes/pro.$slug.enquire.tsx:305`. There is no "avatar radius" token in `src/styles.css` — the project convention (verified across ~20 files: search results, professional profile, dashboards, login, ProShell, ClientShell) is that **human headshots are always `rounded-full`**. The `14px` value is a one-off outlier, not a missing token.

## Change
One line in `src/routes/pro.$slug.enquire.tsx` (line 305):

- Before: `className="h-16 w-16 rounded-[14px] object-cover"`
- After:  `className="h-16 w-16 rounded-full object-cover"`

This makes the pro's face in the enquire-page sidebar match the same face on their profile card, in search results, and in the header — consistent identity treatment everywhere.

## Out of scope
- No new token added — round avatars don't need one.
- No sweep of other files — they're already `rounded-full`.
- No other audit fixes (SEO absolute URLs, `bg-reps-orange-soft` swap) — you said the pages are good and we're moving to nav wiring next.

## Verify
Re-run `bash /tmp/audit.sh` — should exit 0.
