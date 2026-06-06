## Replace "Manual check-in forms" with Typeform in ReplacedStackBoard

**File:** `src/components/marketing/ReplacedStackBoard.tsx`

**Change:** Swap the existing "Manual check-in forms" chip (one of the 9 BEFORE tools) for Typeform.

- `name`: `"Typeform"`
- `job`: `"Check-ins"`
- `logo`: white Typeform wordmark SVG, sourced and inlined the same way the other brand logos in this component are handled (white-only, no color, matching stroke/weight conventions already in the file)
- Keep the chip in the same slot/order currently occupied by "Manual check-in forms"
- Keep the existing `wide` flag state for that slot unchanged
- Badge stays "9 tools · 9 bills" (still 9 chips)

**Sourcing the logo:** Use the official Typeform wordmark (the "T." mark + "Typeform" wordmark, matching the version used in their press kit) rendered as a single-color white inline SVG, consistent with how Trainerize and the other logos are inlined in this file.

No other files change.