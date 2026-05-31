## Goal
Adopt the approved REPs radius system across tokens, components, and documentation. The interface must feel premium, structured and refined — 32px is banned.

## Token changes (`src/styles.css`)
- Added `--reps-radius-sm/md/button/input/card/panel/pill` (8/12/14/14/22/28/999).
- Remapped shadcn aliases: `--radius-sm 8`, `--radius-md 12`, `--radius-lg 14`, `--radius-xl 22`, `--radius-2xl 28`.
- Removed `--radius-3xl` and `--radius-4xl`.

## Component updates
- `PublicHeader` Log in + Join REPs buttons → `rounded-[14px]`.
- `index.tsx`:
  - "Why REPs" aside (large feature panel) → `rounded-[28px]`.
  - "Learn more" button → `rounded-[14px]`.
  - Hero search panel → `rounded-[28px]`.
  - Stats strip card (metric card) → `rounded-[22px]`.
  - "View all specialisms" button → `rounded-[14px]`.
  - Service cards → `rounded-[22px]`.
  - Closing CTA panel → `rounded-[28px]`.
  - Closing CTA button → `rounded-[14px]`.
- `find-a-professional.tsx`:
  - Hero search panel → `rounded-[28px]`.
  - Filter rail card → `rounded-[22px]`.
  - Sort select + filter dropdown trigger → `rounded-[14px]`.
  - Trust band card → `rounded-[22px]`.
  - Result cards → `rounded-[22px]`.
  - "View Profile" + Save buttons → `rounded-[14px]`.

## Out of scope (intentionally untouched)
- Image thumbnails inside cards keep `rounded-[12px]`.
- Avatars, icon circles, badges, pills, pagination dots keep `rounded-full`.
- Tiny checkbox box keeps `rounded-[4px]` (non-card chrome).
- shadcn primitives (`Card`, `Dialog`, `Popover`, `DropdownMenu`, `Sidebar`) consume the remapped tokens automatically — no per-file changes.
- Components listed in the brief that do not yet exist in the codebase (CategoryCard, FeaturedProfessionalCard, DirectoryFilters, ProfileHero, VerificationBar, ReviewCard, signup/login cards, dashboard cards, AdminMetricCard, etc.) will inherit the radius rules from the tokens + memory when they are built.

## Documentation
- `mem://design/source-of-truth` extended with the radius system and the 32px ban.
- `mem://index.md` Core line added: button/input 14, card 22, panel/modal 28, pill 999, never 32.
