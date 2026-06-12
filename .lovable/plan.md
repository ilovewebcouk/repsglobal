## Goal

Bring AI-enhanced avatars up to `/about`-page editorial quality. Result must read as **"the same person, shot properly by a real photographer"** — not as an AI portrait filter.

## What changes from today

1. **Drop the REPS wordmark rule for user avatars.** The `mem://design/trainer-imagery` rule applies to *marketing imagery we generate* (about heroes, feature composites), not to portraits of real members. A trainer's photo should look like *their* brand, not REPs uniform.
2. **Anchor every generation to the `/about` portrait style.** We pass the four `src/assets/about/*` portraits as **reference images alongside the user's photo**, so the model matches lighting, depth-of-field, skin rendering, and tonality — not just text instructions.
3. **Clothes: their own, tidied.** Prompt explicitly preserves garment, colour, neckline, fit. Allowed cleanup: wrinkles, lint, visible third-party logos/text. Forbidden: restyling, recolouring, adding any logo/wordmark/badge.
4. **Background: editorial studio.** Dark seamless or soft graduated grey, short-side key + subtle rim light. No fake gym bokeh, no warm coffee-shop wash. Matches the `/about` look.
5. **Identity gate (world-class strict, with a recoverable path).** After generation, run a second vision pass that scores identity similarity vs the source on a 1–5 scale across face shape, jawline, hairline, skin tone, age, ethnicity. **Auto-reject and regenerate** if score < 4. Hard cap at 3 attempts; if all fail, surface "we couldn't preserve your likeness on this photo — try a different source" instead of silently shipping a drifted face. This is the right call for a register of real named people — drift on a verified directory is a credibility bomb, but a hard fail with no escape hatch is a worse UX.
6. **Three crops from one session.**
   - `1:1` head-and-shoulders → directory tile + dashboard avatar
   - `4:5` mid-body → profile hero
   - `16:9` environmental → shop-front hero (Pro+Studio only)
   Generated once, stored together, used in the right surface.
7. **Fair side-by-side compare.** Both panes render at identical size and identical 1:1 crop centred on the face box. The original is *not* shown raw if it was a full-body upload — it's auto-cropped to match. User judges photo quality, not framing.
8. **Intake gate stays — gets sharper.** Existing `validateAvatar` keeps rejecting logos/groups/full-body. Add: reject if face is < 256px in source, reject sunglasses, reject heavy hat-shadow on eyes. Tell the user *what* to re-shoot.

## Technical shape

Files touched:

- `src/lib/profile/avatar-ai.functions.ts` — rewrite `regenerateAvatar`:
  - Load 2 `/about` portraits as base64 reference images (server-side, from the `.asset.json` URLs).
  - New prompt: editorial studio brief + own-clothes-tidied + reference-anchored.
  - Add `scoreIdentitySimilarity(originalDataUrl, generatedDataUrl)` server fn using `google/gemini-3-flash-preview` vision → 1–5 score + reason.
  - Retry loop (max 3) inside `regenerateAvatar` until score ≥ 4 or cap reached.
  - Return `{ path, url, identityScore, attemptsUsed }` so the UI can show "verified likeness" or the fallback.
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx` — compare UI:
  - Re-crop the ORIGINAL preview to the same 1:1 face-centred crop as the AI version (using the `faceBox` from `validateAvatar`).
  - Show a small "Likeness verified" emerald chip (uses the allowed status-color token triplet) when score ≥ 4.
  - Buttons stay "Use this portrait" / "Keep original".
- **Out of scope for this pass** (called out, not built):
  - 4:5 and 16:9 crops — requires a `profiles` schema change (new columns) and surface wiring on `/pro/$slug` and `/c/$slug`. Plan it next, ship 1:1 properly first.
  - Pro-tier environmental hero variant.
  - Storing identity score in DB for audit.

## What you'll see end-to-end

1. Trainer uploads a photo.
2. Intake gate: pass / reject with clear reason.
3. AI generation: same person, their clothes (tidied), editorial studio, directional light.
4. Auto-retry up to 3× if the face drifts. Either ships a verified-likeness portrait or tells the user honestly that this source can't be enhanced.
5. Side-by-side comparison is fair: same crop, same size.
6. "Use this portrait" → committed.

## Out of scope (explicit)

- No corner-radius changes.
- No directory/profile/shop-front layout changes.
- No new DB columns this pass.
- REPS wordmark rule for *marketing imagery* stays as-is — only avatars are exempted.

## Open question to confirm before build

Should I update `mem://design/trainer-imagery` in the same pass to record the avatar exemption explicitly, so future agents don't re-apply the wordmark rule to user portraits? (Recommended yes.)
