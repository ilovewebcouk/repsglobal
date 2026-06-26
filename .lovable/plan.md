## Diagnosis

Those names are not coming from the React page mock data. They are real rows currently published in the backend:

- `james.wilson@demo.repsuk.org` → James Wilson
- `sophie.taylor@demo.repsuk.org` → Sophie Taylor
- `liam.roberts@demo.repsuk.org` → Liam Roberts
- `priya.sharma@demo.repsuk.org` → Priya Sharma
- `daniel.hughes@demo.repsuk.org` → Daniel Hughes
- `emily.carter@demo.repsuk.org` → Emily Carter
- `marcus.lee@demo.repsuk.org` → Marcus Lee
- `hannah.thompson@demo.repsuk.org` → Hannah Thompson

They were seeded by older demo migrations and have `is_published = true` and `bd_seed_thin = false`, so the directory query quite correctly still shows them.

## Plan

1. **Unpublish the seeded demo professionals in the backend**
   - Set these `@demo.repsuk.org` professional rows to `is_published = false`.
   - Mark them as `bd_seed_thin = true` as a belt-and-braces exclusion so existing public directory filters also reject them.
   - Keep the rows/accounts rather than hard-deleting, so any internal references do not break.

2. **Keep the James Wilson shop-front fixture/admin mock intact**
   - Do not delete the hardcoded `/c/james-wilson` fixture.
   - Keep it noindex/admin-gated as already planned, so it remains available only as an internal mock-up.

3. **Add a code-level safety guard**
   - Update public directory/featured queries to also exclude demo emails where possible, not just `bd_seed_thin`.
   - This prevents future accidental reseeds from leaking back into `/find-a-professional`.

4. **Clean remaining public demo surfaces separately if needed**
   - Profession pages, city pages, About, and Reviews still contain hardcoded demo names in their own local fallback/marketing arrays.
   - This plan focuses on the directory issue you’re seeing now. After this, we can do a second pass to remove/hide those from the other public pages too.

## Validation

After implementation, check `/find-a-professional` again and confirm none of these names appear in the results list:

`Marcus Lee`, `Emily Carter`, `Priya Sharma`, `James Wilson`, `Daniel Hughes`, `Liam Roberts`, `Sophie Taylor`, `Hannah Thompson`.
