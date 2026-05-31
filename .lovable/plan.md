## Remove service card icons and clean up spacing

### Goal
Remove the icons from the service/pricing cards and adjust internal spacing so titles and descriptions sit cleanly within each card.

### What will change
1. **Remove icon overlay** — Delete the orange circle icon badge from inside each card image (remove the `absolute` positioned `<span>` containing `<s.icon />`).
2. **Clean spacing** — Adjust the gap and padding between the image, text content, and price columns so the title and description feel balanced without the icon's visual anchor.
3. **Remove unused icon import** — If `Award`, `Laptop`, or `Users` are only used for service cards, drop those imports.

### Technical details
- File: `src/routes/pro.$slug.tsx`
- Target: lines ~423–432 (icon overlay inside the image) and surrounding spacing classes
- No data structure changes; the `icon` field on `services` entries can stay for future use
- Keep the horizontal card layout (image left / content center / price right) unchanged