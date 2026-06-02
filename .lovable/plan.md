## Remove 3 fanned pro cards from hero

### Goal
Replace the right-column 3-card stack with a single editorial coaching portrait, keeping the search, chips, and trust strip untouched.

### Approach
The hero background already uses `heroCoaching` as a full-bleed image with a left-to-right gradient overlay. The 3 fanned cards sit in a 440px right column blocking part of that image. Removing them lets the existing coaching portrait breathe while the left column keeps all current content.

### Changes
1. **Remove the 3-card stack** (lines ~293-338) — delete the `heroProStack.map()` block and the surrounding right-column container.
2. **Clean up dead data** — remove the `heroProStack` array and unused `proJames` / `proSophie` / `proDaniel` imports.
3. **Fix runtime error** — the duplicate `Check` import (already declared) is a separate syntax bug that will be fixed in the same pass.

### What stays exactly the same
- Headline, sub-headline, search bar, goal chips, popular searches, trust strip
- Background image + gradient overlays
- Two-column grid layout (right column simply becomes empty, showing the background)
- All other page sections below the hero