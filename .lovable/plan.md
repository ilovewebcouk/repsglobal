# Raise avatar face-area threshold to 0.15 and re-run BD batch

## Goal

Bring the BD-imported avatars in line with the visual bar set by Matt, Jemma, and Jen on the Featured rail. Photos where the face is less than ~15% of the frame area (Nerin's Gold's-Gym selfie, full-body shots, wide environmental shots) get rejected and fall back to monogram tiles.

## Changes

### 1. Bump the threshold

`src/lib/avatar/validate.shared.ts`:
- `MIN_FACE_AREA` from `0.06` → `0.15`
- Update the JSDoc comment so the next person reading it knows why (matches the visual bar of accepted Featured-rail cards; 0.06 was a triage default).

This automatically applies to **both** pipelines (dashboard upload + BD backfill) — that's the whole point of the unified validator from the previous turn.

### 2. Reset every BD recrop decision

All 124 BD-seeded "ok" photos were previously decided under the 0.06 floor. To get a clean re-evaluation under 0.15, reset them to `pending` so the existing admin batch tool re-processes the lot.

Single migration:
```sql
UPDATE public.bd_member_seed
SET recrop_status = 'pending',
    recrop_reason = NULL,
    recropped_at  = NULL
WHERE profile_photo_status = 'ok'
  AND profile_photo_storage_path IS NOT NULL;
```

No schema changes — `recrop_status`, `recrop_reason`, `recropped_at` already exist.

### 3. Re-run the batch from the admin UI

No new code needed. After the migration runs:
1. Go to `/admin/migration`.
2. **BD avatar re-crop** panel → **Run batch (25)** to sanity-check.
3. Then **Run batch (100)** to clear the rest.
4. Live log shows accept/reject reasons per row.
5. Final stats appear in the panel header (`recropped`, `rejected`, `pending`).

Rejected rows: `profiles.avatar_url` cleared → card renders the `Monogram` initials tile automatically. No further action.

## What to expect

Of the 124:
- **~60–70 accept** (clean head-and-shoulders portraits — Matt, Jemma, Jen style).
- **~50–60 reject** (Nerin's selfie, Scott's full-body, wide gym shots, distant action shots, anything where the face is less than ~15% of the frame area).
- Reject count is an estimate. Gemini's bounding boxes have ±20% noise — the true cut-off in the wild is somewhere between 0.12 and 0.18 of "true" face area. If the split comes back wildly different from this, that's the cause, not a bug — we tune from there.

## Verification

After the batch:
1. Re-load `/in/london` — Nerin should now show a monogram tile.
2. Spot-check `/professions/personal-trainer` and the city rails for any remaining "small face" cards.
3. `/admin/professionals` — filter to BD seeds with `recrop_status = 'rejected'` to triage the list before launch (option to manually approve, or leave as monogram).

## Out of scope

- **Background/composition rules** (gym storefronts, distracting backgrounds). The 0.15 floor will catch most of these incidentally because they tend to correlate with small-face framing, but it's not an explicit rule. If you want a real background check, that's a separate change.
- **Dashboard re-validation of non-BD avatars.** Only BD-imported photos are being re-checked; pros who uploaded through the dashboard already passed the (now-stricter) validator on upload, and re-running them mid-flight would surprise live users. New uploads from this point onward use 0.15 automatically.
