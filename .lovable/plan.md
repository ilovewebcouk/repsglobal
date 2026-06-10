## Swap REPs logo

The shared `RepsWordmark` component in `src/components/brand/RepsWordmark.tsx` is the single source of the logo used in `PublicHeader` (desktop + mobile) and anywhere else the wordmark renders.

### Change
Replace the inner `<path>` / `<polygon>` elements with the path data from the uploaded `logo-3.svg`:

- `R` shape: `M53.86,33.34c7.34-2.81,11.59-8.28,11.59-15.77C65.45,6.55,56.31,0,41.19,0H0v48.17h14.83v-12.82h21.82l12.1,12.82h19.66l-14.54-14.83ZM42.7,23.33H14.83v-10.8h27.79c5.4,0,7.92,1.73,7.92,5.62,0,3.6-2.38,5.18-7.85,5.18Z`
- `E` polygon: `119.96 12.53 129.68 12.53 129.68 0 129.6 0 119.96 0 73.8 0 73.8 48.17 120.17 48.17 129.68 48.17 129.68 35.64 120.17 35.64 88.7 35.64 88.7 29.38 118.16 29.38 126.8 29.38 126.8 18.72 118.16 18.72 88.7 18.72 88.7 12.53 119.96 12.53`
- `P` shape: `M175.32,0h-40.68v48.17h14.83v-12.46h25.85c14.11,0,22.97-6.91,22.97-17.71S189.29,0,175.32,0ZM176.98,23.4h-27.51v-10.87h27.51c3.96,0,6.48,2.09,6.48,5.4s-2.45,5.47-6.48,5.47Z`
- `S` shape: `M249.05,18.79h-26.28c-3.1,0-4.54-1.01-4.54-3.17s1.44-3.1,4.54-3.1h43.28V0h-42.12c-13.61,0-20.31,4.97-20.31,14.91,0,9.15,6.77,14.47,18.51,14.47h26.07c3.1,0,4.54.94,4.54,3.17s-1.37,3.1-4.39,3.1h-44.72v12.53h44.28c13.39,0,19.44-4.82,19.44-15.41,0-9.15-6.34-13.97-18.29-13.97Z`

Keep the same `viewBox="0 0 267.34 48.17"`, `fill="currentColor"`, props API, and `cn(...)` sizing — so every existing call site (header, mobile sheet, anywhere referencing `RepsWordmark`) picks up the new mark automatically with no other edits.

### Out of scope
No About-page changes, no trainer-apparel image regeneration, no other components touched.
