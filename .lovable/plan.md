# Homepage QA — fixes to ship

Scope: `src/routes/index.tsx` only. Hero is locked. No copy/imagery changes outside the items below.

## 1. Remove banned "Stripe" copy (Core memory)
In the For-pros CTA card, replace the chip **"Stripe-powered bookings"** with **"Bookings & payments built in"**. No other Stripe references appear on the page.

## 2. Re-order the closing sequence
Current: Trust block → For-pros CTA → Find. Trust. Train. Transform. → Press
New:     Trust block → **Find. Trust. Train. Transform.** → **For-pros CTA** → Press

Why: lets the consumer narrative close cleanly, then the pro CTA becomes the deliberate pivot to the footer. Also eliminates the duplicate "Find a coach / Become a pro" button pair appearing twice within ~600px.

## 3. Lighten the trust crescendo
The trust block currently stacks pillars (4 orange-icon tiles) + stats (4 orange-icon tiles) + quote — 8 orange circles in a column, which flattens the section.

Change the **stats row only**: drop the orange circle icons, render as a pure typographic row — large number (e.g. 25,000+) over a muted label. Pillars keep their icons. Quote unchanged. Block stays folded (no extra band).

## 4. Step-card contrast tweak ("Find the right coach in four steps")
Surface rhythm is already correct (Featured warm-white → Specialism ivory → How-it-works white → Outcomes tint → Trust white — clean alternation). The issue is internal: the four step cards on the white band are very low-contrast and read as flat blocks. Give each step card a subtle border + soft surface (same warm-white token used elsewhere) so they read as distinct cards on the white section, not pale rectangles. Section background stays white. Specialism strip stays exactly as-is on ivory.

## Out of scope
- Hero (locked).
- Featured REPs cards, Specialism strip, Outcomes cards, pillar tile content, press marquee — all working.
- Any new sections, imagery swaps, or copy rewrites beyond item 1.
- Mobile QA — desktop pass first, mobile is a separate pass once these land.

## Verification
After the edits, re-screenshot full-page at 1440 and confirm:
- No "Stripe" string anywhere in the rendered page.
- Closing order reads Trust → Find.Trust.Train → For-pros → Press.
- Stats row no longer mirrors the pillar grid visually.
- Step cards read as distinct cards against the white section.
