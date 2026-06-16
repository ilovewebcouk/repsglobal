Yes — this is the right reset. The current bug is not a mystery anymore: “Nearest” is not pure nearest because the server is using 1-mile buckets, so quality/verified can still reshuffle people inside the same mile band. That is why Katie can lose despite being closest. For a 10/10 directory, that has to go.

Plan:

1. Make “Nearest” mean exact nearest
   - Change nearest ranking to sort by raw distance first, always.
   - After exact distance, use tie-breakers only:
     1. verified
     2. quality score
     3. paid tier
     4. recency
   - No 1-mile buckets.
   - No Pro/Verified/quality/avatar signal can jump someone who is farther away when the user selected nearest.

2. Keep “Recommended” quality-led
   - When no location is being used, ranking stays:
     1. verified
     2. quality score
     3. paid tier
     4. recency
   - Avatar stays inside quality score, not as a separate hard tier.
   - Pro tier remains a tie-breaker, not a primary directory override.

3. Remove the no-location warning bar
   - Delete the “Set your location to sort by distance” banner.
   - If no location is set, don’t present “Nearest” as an active user choice.
   - If the URL contains `sort=nearest` but the browser has no saved location yet, the UI should behave as Recommended until location is available.

4. Fix the hydration bug cleanly
   - Stop reading saved location from localStorage during the first render.
   - Server and first client render both show the same “Anywhere” state.
   - After hydration, read saved location, update the bar to Lowestoft, and refetch the directory using Lowestoft coordinates.
   - This removes the current React hydration error.

5. Prevent stale recommended results under a nearest label
   - While saved location is hydrating and the URL says nearest, don’t let the old recommended order sit there pretending to be nearest.
   - Once origin exists, the query key must include latitude/longitude and force a fresh server request.
   - The result list should only show nearest ordering once the nearest query has actually returned.

6. Verify with the actual Lowestoft case
   - Re-run the Lowestoft ranking against live data.
   - Katie Gibbs must appear above the London demo professionals.
   - If Katie’s displayed distance is the lowest, she must rank first unless another profile is physically closer.
   - Confirm “Nearest” no longer lets quality, verification, Pro tier, or avatar outrank raw distance.

7. Keep the UI world-class without redesigning the locked page
   - Preserve the current directory visual design.
   - Make the behaviour feel obvious: location set = nearest available and distance-led; no location = recommended only.
   - No extra warning copy, no noisy explanatory banners, no new visual clutter.