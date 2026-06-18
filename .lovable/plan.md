## Plan

1. **Make `/in/:location` location truly locked**
   - Treat the city page value as fixed search context, not a selectable/default location.
   - The search should always submit with that page city, e.g. `/in/manchester` searches Manchester.

2. **Update `InlineHeroSearch` behaviour for locked city mode**
   - When `lockedCity` is present, the location control will display that city only.
   - Remove/disable the ability to untick it, switch to current location, type another city, or enter a postcode from city landing pages.
   - Prevent geo-location or previously picked location from overriding the page city.

3. **Keep other pages unchanged**
   - Homepage and profession pages can still use editable location/current-location behaviour.
   - Only `/in/:location` pages get the locked location behaviour.

4. **Submission rules**
   - Searching from `/in/manchester` always sends `city=Manchester` / Manchester slug context.
   - It should not submit `sort=nearest` based on viewer location while locked to a city page.

## Technical scope

- Edit `src/components/search/InlineHeroSearch.tsx` to make `lockedCity` a hard lock for the location UI and submit logic.
- Confirm `src/routes/in.$location.tsx` passes `lockedCity={loc.name}` to the hero search.
- No database or design changes.