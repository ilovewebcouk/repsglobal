Brutal truth: you’re right — this is not 10/10 yet. The core bug is that location state is split between localStorage and URL filters, while search pagination is still server-ranked before the browser applies distance. The map then fits whatever 24 rows came back globally, so it can show the whole world.

Plan:

1. Fix location as one coherent product state
- When “Use my current location” succeeds, the where chip must immediately change from “Anywhere” to the resolved town/postcode.
- The sort label must change from “Nearest (set location)” to “Nearest”.
- Every visible card with coordinates must show distance again.
- The X in the where chip must reliably clear both the saved origin and any city filter, then revert to “Anywhere”.

2. Make nearest sorting actually nearest
- Extend the directory server function to accept viewer latitude/longitude when an origin is set.
- Fetch enough candidate rows for distance sorting instead of only sorting the current 24 quality-ranked rows.
- Compute distance before pagination, sort nearest-first, then paginate the nearest results.
- Return the real filtered total so pagination/counts match what the user sees.

3. Make map viewport world-class
- Stop fitting the map to globally scattered results when no location is set.
- If a viewer origin exists: center around that origin and show only nearby/visible results, with sensible zoom and bounds padding.
- If no location exists: use a premium empty/preview state instead of a world map — prompt the user to set a location to unlock map search.
- Clamp max zoom-out so the map never shows Antarctica/Africa/half the planet for a local directory interaction.

4. Keep split/map layout polished
- Preserve the Airbnb-style split layout already added.
- Keep hover sync and price pins, but only when the pins are meaningful for the current location/search.
- In full Map mode, avoid the “tiny map floating in empty cream” feel by making the map own the canvas rather than leaving dead space.

5. Verify with the exact failing flows
- Load fresh with no origin: where says “Anywhere”, sort says “Nearest (set location)”, map does not show the world.
- Click “Use my current location”: where updates, sort says “Nearest”, cards show miles, map zooms locally.
- Refresh with origin set: state persists and the X clears it.
- Test list, split, and map views at desktop size.