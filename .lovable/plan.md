### Changes to `src/routes/home-v2.tsx`

1. **Remove the "The global standard for fitness — since 2009" badge** from the hero (and its `BadgeCheck` icon wrapper). Drop the `BadgeCheck` import if unused elsewhere.

2. **Mobile/tablet hero → solid black** (matching the original `/` home):
   - Remove the `lg:hidden` full-bleed lifestyle image block and its gradient/radial overlays.
   - Keep the existing `hidden lg:block` desktop image (right-anchored photo + left wash) exactly as is.
   - Background falls back to the existing dark `#0B0D10` section color.

3. **Verify** with screenshots at 375px, 820px, and 1318px viewports.

No other sections, copy, or animations change.