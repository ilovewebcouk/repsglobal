## Add pro CTA to `/cpd`

Mirror the homepage "Are you a fitness professional?" CTA band at the bottom of `src/routes/cpd.tsx`, with CPD-specific copy.

### Placement
Insert after `FaqBlock` and before `CrossLinkStrip` / `PublicFooter`.

### Style
Same dark image-band pattern used on the homepage (lines 484–538 of `src/routes/index.tsx`): full-width dark section, professional photo on one side, copy + buttons on the other, gradient overlay, brand-orange accent.

### Copy (CPD-specific)
- Eyebrow: "For fitness professionals"
- Heading: "Make your CPD count where clients are looking."
- Sub: "List your verified profile on REPs, show your CPD and qualifications, and get found by clients searching in your city."
- Bullet ticks (3): "Verified CPD + qualifications on your profile", "Found in city and specialism search", "Every feature in your tier included — no paid add-ons"
- Primary button: "See pricing" → `/pricing`
- Secondary button: "How REPs works for pros" → `/for-professionals`

### Files
- `src/routes/cpd.tsx` — add the CTA section; reuse the existing image/component pattern from `index.tsx` (no new shared component unless the markup is already extracted).
