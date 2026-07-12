## Goal

Clean up `/dashboard/profile` (`ProviderProfilePage.tsx`) so the identity trio (name / legal / domain) is the only locked block, the top warning banner is gone, per-field "Awaiting admin approval" pills replace the global banner, the website URL disappears entirely, and the social links section reuses the trainer-side `SocialLinksPicker`.

## Changes (single file: `src/components/dashboard/organisation/ProviderProfilePage.tsx`)

### 1. Remove the top warning banner
Delete the entire amber `<div className="rounded-[14px] border border-amber-400/25 …">` block (lines ~362–390) including the "Every profile change needs admin approval…" copy and the fields-awaiting-review sub-list. The per-field pills (below) replace it. Provider-name pending status already renders inside `LockedRow` in the Identity panel, so nothing is lost.

### 2. Per-field "Awaiting admin approval" pill
Add a tiny local helper next to `Field`:

```tsx
function PendingPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[8px] border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
      <Clock className="h-3 w-3" /> Awaiting admin approval
    </span>
  );
}
```

Extend `Field` to accept an optional `pending?: boolean` prop; when true it renders `<PendingPill />` on the same row as the label (right-aligned via `justify-between`).

Wire the pill on the four editable fields that go through admin review, driven by `pendingChanges` / `pendingKeys` already in scope:

- Tagline → `pending={"tagline" in pendingChanges}`
- Public description → `pending={"about" in pendingChanges}`
- Contact email → `pending={"contact_email" in pendingChanges}` (only when not locked)
- Telephone → `pending={"contact_phone" in pendingChanges}`
- Address → `pending={"address" in pendingChanges}`

Social fields also go through approval — add a `pending` badge above the social grid if any `social_*` key is in `pendingChanges` (single pill labelled "Awaiting admin approval" placed in the Social panel header row).

### 3. Remove Website URL field entirely
It duplicates the domain locked in Identity (step 03 of verification).

- Delete the entire `<Field label="Website URL" …>` block (~lines 501–520).
- Drop `website_url` from `form` initial state, the `useEffect` hydration, the `update` typings implicitly (no code change needed there), the `saveMut` payload (`website_url: …`), the `baseline` object, and the `changedCount` pairs list.
- Remove `websiteLocked` / `approvedWebsite` locals and the `getProviderDomainVerification` import if `domainStatus` is now only used for `emailLocked`/`approvedEmail`. (Keep `domainStatus` for email lock — it stays.)
- Adjust the Contact grid: with Website gone, put Contact email on its own row (still `md:grid-cols-2`, but email spans `md:col-span-2` or sits alongside phone — keep email + phone side-by-side, address full width below).

### 4. Contact email — keep, still editable
Confirmed: leave the field editable (unless `emailLocked` from domain verification). Hint copy stays. Pending pill wires up as in §2.

### 5. Telephone + Address
No changes.

### 6. Social links — reuse `SocialLinksPicker`
Replace the whole Social `PPanel`'s current grid of five `SocialHandleInput`s with the shared picker used on the trainer profile:

```tsx
import { SocialLinksPicker, type SocialField } from "@/components/profile/SocialLinksPicker";

// inside panel body:
<SocialLinksPicker
  values={{
    social_instagram: form.social_instagram,
    social_tiktok: form.social_tiktok,
    social_x: form.social_x,
    social_youtube: form.social_youtube,
    social_linkedin: form.social_linkedin,
  }}
  onChange={(field: SocialField, value: string) => update(field, value)}
/>
```

Then drop the now-unused imports (`Instagram`, `Linkedin`, `Youtube`, local `XIcon`, `TiktokIcon`, `SocialHandleInput`). Panel header copy stays; add the single social-level "Awaiting admin approval" pill in the header when any social key is pending.

### 7. Housekeeping
- Remove `PROVIDER_FIELD_LABELS` import if no longer referenced after banner removal (keep the `ProviderFieldKey` type import — still used for `pendingKeys`).
- Verify `changedCount` still counts correctly with `website_url` removed.
- No server / migration changes. `updateMyProviderProfile` continues to accept `website_url` optionally; we just stop sending it (the previously approved value on `professionals.website_url` remains untouched, which is correct — it mirrors the verified domain).

## Out of scope
- Server-side write path, admin review queue, and the domain-verification lock behaviour are unchanged.
- No visual redesign of Identity panel — it already shows Provider name / Legal identity / Provider domain with locked pills, which is exactly what the user described.
