## QA: Where the "missing" profiles went

### Headline numbers (live from the DB right now)

| Bucket | Count |
|---|---:|
| `bd_member_seed` rows (original scrape) | **390** |
| `professionals` rows total | **402** (390 seed + 12 new signups/admin/demo) |
| `is_published = true` AND `bd_seed_thin = false` → visible on directory | **225** |
| `bd_seed_thin = true` (hidden migrated shells) | **167** |
| `bd_seed_thin = false` but `is_published = false` | **10** |
| Verified | **9** |

So nothing has been deleted. **225 is exactly the public-facing slice**: `is_published = true AND bd_seed_thin = false`. The other 165 thin shells are still in the database, but hidden from public pages by design.

### Why 167 profiles are still flagged `bd_seed_thin = true`

`bd_seed_thin` was added as a gate so a migrated profile only goes public once it has enough content to look credible. The trigger `tg_clear_bd_seed_thin` flips it to `false` automatically as soon as the row gets any of: a bio, a headline, an `identity_status = 'approved'`, or an avatar.

Joining the 167 thin rows back to their `bd_member_seed` source explains why the trigger never fired:

- **0 / 167** have any `about_me` text in the source scrape
- **0 / 167** have any usable photo (147 = `photo_status: missing`, 20 = `rejected`)
- **0 / 167** have been recropped
- They were imported as **name + slug shells** only — there's literally nothing to promote them with

So this isn't a bug or data loss. It's the gate working: BetterDoctor never had usable copy or a usable photo for these 167 members, so they were imported as shells and parked behind `bd_seed_thin = true` until either (a) the trainer claims and fills them in, or (b) we manually fill them.

### Why this is a problem worth fixing

- Pricing / launch story says "390 trainers already on the platform"
- Public directory only surfaces 225, so the platform looks thinner than it is
- City pages (e.g. London Featured = 0 right now in the network logs) feel empty
- Currently the only path out of "thin" is the trainer claiming their profile — which won't happen before launch

### Options I can implement next (pick one or combine)

1. **AI-generate a starter bio + headline for the 167 thin rows**
   Use Lovable AI Gateway (Gemini) with: name, city, what we know from `services_text` / `credentials` / `experience` if present, plus a "generic-but-credible" template. Marks them as AI-drafted (admin-flagged) so trainers can edit on claim. Trigger then auto-flips them off `bd_seed_thin`. Net effect: directory grows from 225 → ~390.

2. **Generate stock-style avatars for the 147 missing-photo rows**
   Same idea but for the photo. Cheaper alternative: a tasteful initial/monogram avatar (no AI image cost) so they at least render.

3. **Lower the gate**
   Decide that "name + city + profession" is enough to be listed, and drop the `bd_seed_thin` filter from the public search (still keep on `is_published`). Fastest, no content work, but the listings will look bare without a bio/photo and we'd be undoing the original quality bar.

4. **Manual triage queue in admin**
   Add `/admin/seed-shells` listing all 167 with a "Generate AI starter / Hide permanently / Unpublish" action per row. Slowest, highest control, no surprises.

5. **Do nothing — accept that the number is 225 until trainers claim**
   Then the "390" marketing number should be updated to "225 live, 165 pre-claim".

### My recommendation

Combine **#1 + #2 + #4**: run AI-drafted bio + monogram avatar across the 167 in a one-off backfill (gated to admin trigger), surface every result in an admin moderation queue (#4) so I can approve before they go public. That gets us back to ~390 visible, keeps quality control, and doesn't require trainers to do anything.

Want me to proceed with that combo, or pick a different option?