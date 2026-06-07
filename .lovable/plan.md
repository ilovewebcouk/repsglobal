## QA pass for `/specialisms`

Quick, read-only verification before we re-lock the page. No code changes in this pass — if something fails, I'll flag it and we decide fixes separately.

### 1. Sticky nav (just-changed)
- Screenshot at desktop (1484) scrolled past hero — confirm: rail sits flush under the 72px header, chip text vertically centred in the 52px rail, hairline visible between header and nav.
- Screenshot at mobile (390) — confirm horizontal scroll works, all 7 chips reachable, no overflow clipping.
- Click each of the 7 chips, verify each anchors to the correct section (PT, Group ex & instructors, Strength, Online, Nutritionists, Yoga, Pilates) and that the section heading isn't hidden under the sticky bar.

### 2. Section order & content
- Walk top→bottom and confirm order matches the locked spec: Hero → sticky nav → PT → Group ex & instructors (new) → Strength → Online → Nutritionists → Yoga → Pilates → RegistersBlock → VerifyStrip → FAQ.
- Confirm the new Group ex section reads with clear L2 scope limits and QualCard tooltips render.

### 3. Compliance (REPs build-compliance skill)
- Run the audit script — must exit 0 (banned hex, banned radii, button shadows, banned filenames).
- Spot-check radii on cards/chips/buttons against the 9-step scale.
- Confirm no UK / "across the UK" copy slipped into the new section.

### 4. Responsive + a11y light check
- Desktop 1484, tablet 820, mobile 390 screenshots of hero + one mid-page section.
- Console log check for errors/warnings on load + after clicking each nav chip.

### 5. Decide
- If all green → I'll write the lock memory entry (`mem://design/locked-specialisms` already exists; I'll update the "Frozen" date and note Group ex section + sticky nav metrics).
- If anything fails → I'll list issues and we triage before locking.

Want me to proceed with this QA pass, or trim/expand any step?