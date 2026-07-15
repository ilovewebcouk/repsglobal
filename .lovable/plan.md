
# Pass 3 — Training Providers page: fix the story

## What's wrong right now (brutal)

1. **Hero image is hidden.** A dark studying photo sits behind heavy copy — nobody sees a training provider actually training anyone. It reads as a moody stock backdrop, not a proof shot.
2. **Certificate showcase looks like stock props.** Two certificates floating on a black panel = corporate template energy. No human, no context, no pride.
3. **Feature reel implies a fixed menu.** Captions naming yoga, Pilates and indoor cycling make the page look like it endorses *those disciplines*. The truth is: REPs endorses **any in-house course a provider writes** — kettlebells, pre/post-natal, strength, nutrition intros, sport-specific, online-only, blended. The reel is actively working against the pitch.
4. **Certificate asset was wrong** — the version on the page is missing the Level 3 badge. User has uploaded the correct one.

## What we're changing

### 1. Swap the certificate asset
Replace `src/assets/training-providers/certificate-of-achievement.png` with the new user-uploaded file (`user-uploads://certificate_resource-2.png`) via `lovable-assets create` → overwrite the existing `.asset.json` pointer. No component code changes needed; the import path stays.

### 2. New hero image — practical coaching moment
Generate a new hero asset: a tutor coaching a learner through a practical movement on a gym floor (kettlebell/barbell setup or a form correction). Deliberately **not** a yoga/Pilates/cycling scene — it has to read as "practical assessment of a course this provider wrote in-house."

- Style: matches the rest of the site's editorial imagery (dark, cinematic, medium-crisp).
- REPS wordmark on tutor's polo per `mem://design/trainer-imagery` (ALL CAPS, white, real embroidery texture, medium weight).
- Rework hero layout so the image is **actually visible** — currently `opacity-70` + `object-[30%_center]` puts it behind copy. Options: shift copy to left column at `lg:`, image occupies right ~55%; or full-bleed with darker gradient only on the copy side. Aim: on desktop the coaching moment is unmistakable; on mobile the image sits above/below copy, not behind.

### 3. Certificate showcase — real learner moment
Kill the "two certificates floating on black" panel. Replace with a **generated image of a small group of learners (3–4 people) holding their Certificates of Achievement** post-course. Certificates readable enough to recognise but the humans are the subject. Warm, proud, real — not stock.

- REPS wordmark on any visible learner/tutor polo per the trainer-imagery rules.
- Beside/under the image, keep a small **inset of the actual certificate PNG** (the new user-uploaded file) at legible size so the artefact itself is still verifiable — but it supports the human shot instead of being the hero of the section.
- Copy pivots from "here's what the paperwork looks like" to "here's what your learners walk away with." Add the "publicly verifiable — QR + certificate number" chip.

### 4. Reframe the feature reel — delivery formats, not disciplines
Rewrite `FEATURE_REEL` so the three tiles are **formats**, not sports:

1. **Classroom & theory delivery** — tutor-led sessions, manuals, written assessment. Any subject the provider writes.
2. **Practical & assessment** — on-the-floor coaching and skills sign-off. Any modality (strength, conditioning, mobility, sport-specific, rehab-adjacent, etc.).
3. **Online & blended** — recorded modules, live tutor calls, remote assessment submissions.

Above the reel, add a single lead line that makes scope explicit:

> "REPs endorses any course a training provider writes in-house — whatever the subject, whatever the delivery format. The examples below show what endorsement covers in practice."

Reuse existing photography where it fits the format label; where a current image is too obviously "yoga" or "cycling," swap for a neutral classroom/floor/laptop-study shot so the caption reads as an example of the *format*, not a claim about the *discipline*.

### 5. Copy sweeps
- Hero H1 stays the positioning line ("Independent endorsement for fitness training providers.") but sub-lede rewritten to lead with **"any course you write in-house"** rather than listing formats.
- "Who this is for" section: reinforce course-agnostic scope in the "fit" bullets (e.g. "You write your own curriculum — any subject, any format").
- Kill any remaining language that implies REPs endorses a *fixed catalogue* of disciplines.

## Order of operations

1. Overwrite certificate `.asset.json` with the new user upload.
2. Generate hero image (practical coaching moment). Save under `src/assets/training-providers/` via `lovable-assets`.
3. Generate certificate-moment image (small group of learners holding certificates). Save the same way.
4. Edit `src/routes/training-providers.tsx`:
   - Rewire hero layout so the new image is visible (not behind copy).
   - Rebuild the certificate showcase section around the new group photo + small inset of the certificate PNG.
   - Rewrite `FEATURE_REEL` entries as delivery formats + add the scope lead line above.
   - Copy sweeps in hero sub-lede and "Who this is for."
5. Verify: `tsgo` typecheck, screenshot the page at desktop + mobile via Playwright, confirm — hero image visible, certificate group shot present, reel reads as formats not disciplines.

## Technical notes

- Image generation via `imagegen--generate_image` (`premium` tier — humans + text on garments require it). REPS wordmark rules per `mem://design/trainer-imagery` are non-negotiable; regenerate if wordmark fails ALL CAPS / white / medium weight / embroidery texture.
- All spacing, radii, tokens continue to follow REPs build-compliance skill (button 10px, card 16/18px, hero 24px, brand-orange only via semantic tokens, no button shadows).
- No backend/data changes. Presentation-only.

## Out of scope (this pass)

- No pricing/plan changes.
- No new routes.
- No SiteBanner changes (already done in Pass 1).
- Long-form Pass 4 copy polish (case studies, testimonials) — separate pass once visuals are locked.
