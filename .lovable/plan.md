## Rework CTA band: full-bleed gym background with trainers as foreground

Replace the current three-column "copy / centered image / checklist" layout with a single full-bleed photographic band, matching the hero's visual register.

### Image
- Generate a new asset `src/assets/cta-band.jpg` (1920×900, 16:9-ish landscape) using `imagegen--edit_image` on the existing `src/assets/cta-trainers.jpg` so the two trainers are preserved exactly as they are — same poses, same faces, same REPs tees — but composited into a wider, atmospheric dark gym environment (racks, plates, moody side-lighting). Trainers positioned roughly in the right-center third so the left side stays clean for copy.
- Keep the original `cta-trainers.jpg` as a fallback.

### Desktop (≥ lg)
- Inner card becomes `relative isolate overflow-hidden rounded-[24px]` with the new image as a full-cover `<img>` background (`absolute inset-0 h-full w-full object-cover`).
- Two stacked overlays on top of the image:
  1. Left-to-right ink gradient (`from-reps-ink via-reps-ink/80 to-reps-ink/10`) so the left copy has guaranteed contrast and the trainers remain visible on the right.
  2. Soft full overlay (`bg-reps-ink/30`) to deepen the photo overall.
- Foreground content: single column constrained to ~`max-w-[520px]` on the left — headline + body + `Join REPs today` button + 5-item checklist stacked beneath.

### Responsive stacking — explicit rules
This is the key concern. The band must stay legible and on-brand from 360px up.

- **≥ lg (≥1024px)** — full-bleed gym image, left-aligned copy column, trainers visible on the right.
- **md (768–1023px)** — keep the band tall (`min-h-[520px]`), shift the gradient to a top-to-bottom ramp (`from-reps-ink via-reps-ink/70 to-reps-ink/20`), and bottom-align the copy column so the trainers sit in the top half of the frame and copy sits below them. Image uses `object-cover object-top`.
- **< md (≤767px)** — image becomes a contained top hero (`aspect-[4/3]`, `object-cover object-center`) inside the rounded band; copy column stacks below on solid `bg-reps-ink`, full-width, with the same headline / body / button / checklist order. Padding tightens to `px-5 py-7`. No horizontal overflow; the rounded `rounded-[24px]` stays.
- Across all breakpoints the rounded corners, ivory page background, and section vertical rhythm stay unchanged.

### Code structure (`src/routes/index.tsx`, CTA section only)
```
<section className="bg-reps-ivory pb-20">
  <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
    <div className="relative isolate overflow-hidden rounded-[24px] bg-reps-ink text-white shadow-[var(--reps-shadow-card)]">
      {/* Mobile: image on top as aspect block; ≥md: absolute full-cover */}
      <div className="relative w-full md:absolute md:inset-0">
        <img
          src={ctaBand}
          alt=""
          className="aspect-[4/3] w-full object-cover object-center md:h-full md:aspect-auto md:object-top lg:object-center"
          loading="lazy"
        />
        {/* gradient overlays scoped per breakpoint via responsive classes */}
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/10 via-reps-ink/60 to-reps-ink md:bg-gradient-to-b md:from-reps-ink/10 md:via-reps-ink/50 md:to-reps-ink/90 lg:bg-gradient-to-r lg:from-reps-ink lg:via-reps-ink/75 lg:to-transparent" />
      </div>

      {/* Foreground copy */}
      <div className="relative px-5 py-7 md:min-h-[520px] md:px-10 md:py-12 lg:px-12 lg:py-14">
        <div className="max-w-[520px] md:mt-auto lg:mt-0">
          {/* headline, body, button, checklist */}
        </div>
      </div>
    </div>
  </div>
</section>
```
The mobile flow is "image-then-copy stacked"; ≥md the image is positioned absolutely so the copy floats over it.

### Out of scope
- No changes to other sections, footer, or design tokens.
- The original `cta-trainers.jpg` asset stays; new `cta-band.jpg` is built on top of it via edit_image.
