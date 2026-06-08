# Extract a single shared FinalCta and use it on /cpd and /for-professionals

Stop rebuilding the end-of-page CTA per route. Extract the `/for-professionals` version as the canonical component, then swap `/cpd` to use it. Per-page copy stays configurable via props — the shell (radius, padding, glow, pill, button styling) is identical everywhere.

## Create

`src/components/marketing/FinalCta.tsx` — lifted verbatim from `/for-professionals` lines 521–556. Props:

- `eyebrow?: { icon?: LucideIcon; label: string }` — defaults to `{ icon: Star, label: "Founding pricing — locked for life" }`. Pass `null` to hide.
- `heading: string` (required)
- `lede?: string`
- `primary: { to: string; label: string }` (required) — solid orange button.
- `secondary?: { to: string; label: string }` — outline white/25 button.

Shell is fixed (do not expose via props): outer `<section>` with `max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28`, inner `rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-10 lg:p-16 text-center` with the radial orange glow overlay. Buttons use `h-12 rounded-[10px]` per the radius system; primary uses `bg-reps-orange … hover:bg-reps-orange-hover`, secondary uses `border border-white/25 hover:bg/white-10`. No shadows.

## Edit

- `src/routes/for-professionals.tsx` — replace the inline FINAL CTA block (lines 521–556) with `<FinalCta heading="Verified profile live today. Set up in 10 minutes." lede="Join the register the public already searches — and the AI operating system that runs the rest of your business. Founding Pro pricing locked for life, available only before public launch." primary={{ to: "/compare", label: "Compare platforms" }} secondary={{ to: "/pricing", label: "See pricing" }} />`. Add the import; drop any now-unused `Star` / `ArrowRight` imports only if nothing else in the file uses them.
- `src/routes/cpd.tsx` — replace `<FinalCta />` at line 328 with `<FinalCta heading="Build your profile. Prove your standards." headingAccent="Grow your career." lede="Join REPs to connect your verification, education, profile and professional development in one platform." primary={{ to: "/signup", label: "Join REPs" }} />`. Delete the local `FinalCta` function (lines 1191–1221). Import the shared component from `@/components/marketing/FinalCta`.

To keep the `/cpd` headline's orange accent ("Grow your career.") working under the shared component, add an optional `headingAccent?: string` prop that renders inline after `heading` with `text-reps-orange`. This is the only structural prop beyond the four above.

## Out of scope (this pass)

- `FeatureGroupLayout` and `PillarPage` also re-implement the same CTA. The user explicitly scoped this pass to `/cpd` + `/for-professionals` only. Follow-up pass to migrate the feature/pillar pages once this lands.
- `cpd-legacy.tsx` is the archived old CPD page — leave alone.

## QA

- After the edits, eyeball both pages: the rounded `rounded-[24px]` panel, the Founding-pricing pill, the radial glow and the orange/outline button pair must be visually identical on `/cpd` and `/for-professionals`. Only the headline + body + button targets differ.
- Run the REPs compliance audit script before signing off.

## Memory update

After the swap lands, save a small project memory at `mem://design/final-cta` referenced from the index: "Shared `FinalCta` in `src/components/marketing/FinalCta.tsx` is the only end-of-page CTA. Do not rebuild per route — pass copy via props." This prevents the next agent from re-introducing a local copy.
