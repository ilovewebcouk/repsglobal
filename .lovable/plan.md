## Goal
Make the `/specialisms` sticky nav feel premium and intentional across desktop, tablet, and mobile — with correct separation from the global header, balanced vertical spacing, crisp borders, and optically centered chip labels.

## Current QA finding
It is **not** world-class yet.

Across desktop, tablet, and mobile, the sticky bar is still reading wrong for two concrete reasons:
1. The sticky rail is offset with `top-14` while the global header is actually `72px` tall, so the rail tucks too far up into the header instead of sitting cleanly beneath it.
2. The chip labels are only box-centered, not optically centered, because the row is fixed-height while the links rely on text padding rather than a controlled chip height/line-height.

## Plan
### 1. Correct the sticky rail’s vertical position
- Update the sticky nav so it locks **below the real header height**, not into it.
- Keep the sticky rail reading as a second navigation tier, not as part of the header border.
- Preserve existing content/order/labels.

### 2. Rebuild the sticky nav spacing for optical centering
- Refine the rail height so it feels slimmer and more deliberate.
- Convert the chip links to a more controlled geometry:
  - explicit chip height
  - `inline-flex` centering
  - tighter line-height
  - balanced horizontal padding
- Tune the row/chip relationship so the text no longer feels high in the bar.

### 3. Strengthen the separation lines
- Keep the solid panel background.
- Tune the top/bottom hairlines so the bar reads clearly against both the header above and the dark content below.
- Avoid blur/transparency that muddies the edge definition.

### 4. Full breakpoint QA after the fix
I’ll verify the sticky state at:
- Desktop: 1484px
- Tablet: 834px
- Mobile: 390px

For each breakpoint I’ll check:
- top gap vs bottom gap around the chips
- border visibility
- visual separation from the main header
- chip label alignment
- horizontal scroll behavior
- no clipping or crowding at the edges

## Technical details
- File: `src/routes/specialisms.tsx`
- Likely adjustments:
  - replace `top-14` with a header-matched offset
  - refine `h-12` / row height if needed
  - change chip anchors from padded text boxes to explicit-height centered pills
  - keep semantic tokens only
- No content rewrites, no section redesign, no route restructuring.

## Deliverable
A corrected sticky nav with a proper two-tier hierarchy and a responsive QA pass confirming whether it now meets the standard.