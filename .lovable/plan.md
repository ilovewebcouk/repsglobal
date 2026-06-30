I understand now: the default state must already be the finished three-card coaching-plan set, saved as editable services for every professional. No “empty”, no “Set up”, no one-card public page unless the professional has intentionally removed/hidden cards.

Plan:

1. Create a single canonical default-service definition
- Online Coaching
  - Remote
  - £160 / month
  - Description and 5 bullets exactly matching the three-card reference
  - CTA: “Enquire about Online Coaching”
- Hybrid Coaching
  - Hybrid / Most popular
  - £240 / month
  - Description and 5 bullets exactly matching the reference
  - CTA: “Start with Hybrid”
- 1-to-1 In Person
  - Hands-on
  - From £75 / session
  - Description and 5 bullets exactly matching the reference
  - CTA: “Enquire about 1-to-1 In Person”

2. Seed missing service records automatically
- Update `getMyShopFront` so when a professional opens Website and has fewer than 3 service cards, the backend creates the missing default records in `services`.
- Existing edited services stay untouched.
- Missing slots are filled using the canonical defaults.
- Hybrid is saved as the featured/Most popular card by default.

3. Fix the Website editor UI
- Remove the “empty” state from service cards.
- Remove “Set up”. Every row shows “Edit”.
- Show all three service rows as real editable saved cards.
- Keep drag reorder and editable fields; do not lock title, CTA, delivery mode, price unit, or featured state.
- Update dialog wording from “placeholders” to “Edit the default copy or replace it with your own.”

4. Fix the public `/c/$slug` service rendering
- Public pages should render all three default cards immediately for professionals who have not edited anything.
- The one-card state in your screenshot should disappear once the service seeding runs.
- Keep the three-card visual design exactly as shown in the reference.

5. Backfill existing professionals
- Add a safe database migration/function to create missing default service rows for existing professionals who currently have 0, 1, or 2 service cards.
- Do not overwrite existing service copy.
- Only add missing cards, preserving current edited records.

6. QA before calling it done
- Verify `/dashboard/shop-front` shows three non-empty rows with “Edit” buttons only.
- Verify opening each card edits saved default content.
- Verify a public `/c/{slug}` page shows three coaching-plan cards, with Hybrid highlighted.
- Check there is no “Set up” or “(empty)” text left in this flow.