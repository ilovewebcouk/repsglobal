### Problem
The Featured card on `/in/$location` and `/professions/$profession` hardcodes a green "Verified" pill on every card — regardless of identity/verification status or tier. When the Featured rail falls back (backfill mode) it can show an unverified pro with a "Verified" badge. The directory results below the rail use `VerificationPill` (`src/components/directory/VerificationPill.tsx`), which honestly reflects identity/verification + tier.

### Fix
Reuse `VerificationPill` inside `FeaturedProCard` and pipe the data through.

1. **`src/components/public/FeaturedProCard.tsx`**
   - Extend `FeaturedPro` with `identityStatus: string | null`, `verification: string | null`, `tier: "studio" | "pro" | "verified" | "free" | null`.
   - Replace the hardcoded green pill (the `<span class="absolute left-3 top-3 …">Verified</span>`) with `VerificationPill` wrapped in the same absolute-positioned container:
     ```tsx
     <div className="absolute left-3 top-3">
       <VerificationPill
         identityStatus={pro.identityStatus}
         verification={pro.verification}
         tier={pro.tier}
         compact
       />
     </div>
     ```
   - Remove the unused `BadgeCheck` import.

2. **`src/lib/directory/featured.functions.ts`**
   - Add `verification` to the `professionals` select and to `ProRow`.
   - Add `verification: string | null` to `FeaturedProRow`; populate from `p.verification` in the enrich step.

3. **`src/routes/in.$location.tsx`** — in both `rowToFeaturedPro` and `featuredRowToFeaturedPro`, add the three new fields:
   ```ts
   identityStatus: r.identity_status,
   verification: r.verification,
   tier: r.tier,        // FeaturedProRow path
   // tier: r.tier ?? "free"  // SearchProfessionalRow already returns tier
   ```

4. **`src/routes/professions.$profession.tsx`** — same passthrough in its `rowToFeaturedPro` and `featuredRowToFeaturedPro`.

5. **Static demo cards** (the `featuredProsFallback` arrays inside both routes that use placeholder images) — set `identityStatus: "approved"`, `verification: "verified"`, `tier: "pro"` so the demo state still renders a green REPs Verified pill.

### Result
- A verified pro → emerald **REPs Verified** pill (+ orange **Pro/Studio** chip when tier ≥ pro), matching the directory cards.
- A backfill / unverified pro → neutral **Unverified** pill — no false claim.

### Out of scope
- No layout change to `FeaturedProCard` (locked).
- No change to ordering, backfill threshold, or admin rotation.

### Verification
Reload `/in/london` and `/professions/personal-trainer`. Every Featured card's top-left pill matches the same pro's pill in the results grid below.
