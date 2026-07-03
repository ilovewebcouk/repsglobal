Consolidate the three separate editor panels (Results intro, Client transformations, Client result quotes) into one unified "Client Results" panel in the Website editor.

## Problem
The dashboard editor currently shows three disconnected panels for what is conceptually one "Client Results" content area:
1. **Results intro** — a standalone text area
2. **Client transformations** — image + metric + quote cards
3. **Client result quotes** — text-only testimonial cards

This splits the user's mental model: the intro text literally references "Every metric below," but the metric cards live in a different panel.

## Plan

### 1. Merge into a single panel in the editor
In `src/routes/_authenticated/_professional/dashboard_.website.tsx`:
- Remove the standalone `<section id="results-intro">` PPanel.
- Remove the standalone `<section id="transformations">` wrapping `TransformationsEditor`.
- Remove the standalone `<ClientResultsEditor>` call.
- Create a single `ClientResultsPanel` component that composes all three concerns under one `PPanel`:
  - **Header**: "Client Results" + hint: "Short proof cards and written results shown in the Results section of your website."
  - **Intro text area**: the `clientResultsIntro` TextArea, kept at the top.
  - **Transformations list**: existing list + add form (unchanged behaviour).
  - **Client result quotes list**: existing list + add form (unchanged behaviour).
- Wrap the new panel in `<section id="results">` so anchor navigation still works.

### 2. Keep data layer untouched
- `clientResultsIntro` stays a field on `shop_fronts`.
- `shop_front_transformations` and `shop_front_client_results` tables stay unchanged.
- All server functions (`upsertTransformation`, `deleteTransformation`, `upsertClientResult`, `deleteClientResult`, `saveMyWebsiteContent`) are reused exactly as-is.

### 3. Public page stays as-is
- The live shop-front (`/c/$slug`) still renders `TransformationsSection` (id="results") and `TestimonialsSection` (id="reviews") as separate sections.
- No nav changes. No routing changes. No data model changes.

### 4. Validation
- Type-check passes.
- Editor loads and the new single panel shows intro text, then transformations, then client result quotes.
- Adding / editing / hiding / deleting items in both sub-lists still works and invalidates the query cache as before.

---

No database migrations. No API changes. Purely a UI consolidation in the website editor.