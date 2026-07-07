### Remove bottom border from "New to REPs" homepage section header

**Problem:** The "NEW TO REPS / Recently joined professionals" section header has a subtle bottom border (`border-b border-reps-charcoal/5 pb-6` on line 301 of `src/routes/index.tsx`). No other homepage section headers use a bottom border, so it looks inconsistent.

**Change:** Remove `border-b border-reps-charcoal/5 pb-6` from the flex container wrapping the section title + "View all professionals" link.

**Result:** The section header will sit flush above the coach grid, matching the visual rhythm of every other homepage section.