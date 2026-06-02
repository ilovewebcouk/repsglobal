## Problem
The hero search input currently uses placeholder text `"Search professionals, locations, specialisms"` (44 characters). At smaller laptop widths and before the `sm:` breakpoint, the input width compresses and the placeholder is heavily truncated, hurting readability.

## Proposed Change
Replace the placeholder with a shorter, clearer alternative that fits comfortably within the available input space at all hero widths.

### Option A (recommended)
`"Search coaches, goals, locations"` — 32 characters, preserves the three-category structure, uses the friendlier "coaches" over "professionals", and fits within the first input even at the narrowest widths before the search bar switches to a row layout.

### Option B
`"Search by goal or location"` — 26 characters, action-oriented and very compact.

### Option C
`"Find your coach or goal"` — 23 characters, shortest and most conversational.

## Implementation
Single-line edit in `src/routes/index.tsx` line 214. No other files touched.

---
Which option do you prefer? Or suggest your own wording and I will implement it.