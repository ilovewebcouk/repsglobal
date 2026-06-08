## Change

On `/for-professionals`, swap the Pillar 1 (Visibility) laptop mockup from the public profile to the verification page with the QR code. Copy, bullets, eyebrow, title, CTA and section order all stay the same.

## File

`src/routes/for-professionals.tsx` — line 258, inside the Pillar 1 `ProductBlock`:

```diff
- mockup={{ device: "laptop", src: "/pro/james-carter", title: "Verified professional profile preview" }}
+ mockup={{ device: "laptop", src: "/verify/reps-2024-08147", title: "Public verification record with scannable QR" }}
```

Also update the adjacent `imageLabel` so screen-reader text matches the new screen:

```diff
- imageLabel="Verified professional profile on the public register"
+ imageLabel="Public verification page showing the scannable QR record"
```

## Notes

- `/verify/reps-2024-08147` is the James Carter verification record already used elsewhere on the site, so the laptop mockup will render the QR-code page with no new assets needed.
- No changes to Pillars 2–6, hero, RegisterProof, TestimonialFeature or any other section.
- Locked-page memory for `/for-professionals` stays intact — this is a mockup-source swap, not a structural change.

## Out of scope

- Re-numbering pillars
- Re-writing Visibility copy or bullets
- Touching the verify page itself
