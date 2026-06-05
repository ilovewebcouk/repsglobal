## Remove atmospheric gym photo from /find-a-professional

### Scope
- `/find-a-professional` hero (lines 208-222)
- `/find-a-professional` testimonials/closer band (lines 500-509)

### What changes
- Delete the `heroGymBg` background-image layer (`opacity-[0.28]` + `opacity-[0.18]`) from both sections.
- Delete the heavy dark-gradient overlays that were only there to tame the photo.
- Keep the `bg-reps-black` base, the top hairline (`h-px bg-white/5`), and all copy/layout unchanged.
- Drop the unused `import heroGymBg` if nothing else on the page references it.

### Result
The hero and testimonials band sit on pure solid black — cleaner, more editorial, no faint gym-equipment texture bleeding through.

---
*Other pages (Careers, CPD, Verify, etc.) also use this same asset with a similar treatment. If you want the same removal applied site-wide, say the word and I'll extend the plan.*