# Square dashboard avatars to match the directory

Pro-uploaded/AI-regenerated avatars render as 18px-radius squares everywhere they appear in the directory (`/find-a-professional`, `/pro/$slug`, `/c/$slug`, `FeaturedProCard`, enquire summary). The dashboard currently renders them as circles via the shadcn `Avatar` primitive, so what the pro tunes in `/dashboard/profile` is not what visitors see. This change makes the dashboard a true WYSIWYG preview of the directory card.

Scope: every avatar inside the authenticated dashboard surfaces — profile editor, topbar/user-card, settings, and the client/lead thumbnails in the demo content. No marketing pages, no directory pages (already square), no auth-page or root navbar avatar.

## Changes

**1. Profile editor — `src/routes/_authenticated/_professional/dashboard_.profile.tsx`**
- Lines 620–624 and 818–822: swap `<Avatar className="size-20 ring-2 ring-reps-border">` / `size-16 ring-4 ring-reps-panel` for the same size but `rounded-[18px]` and add `rounded-[18px]` to the nested `AvatarImage` and `AvatarFallback`. Keep the ring; rings work on rounded-rect too.

**2. Topbar user card — `src/components/dashboard/DashboardShell.tsx`**
- Line 259–262 (`UserCard`): `<Avatar className="size-10 rounded-[18px]">` + `rounded-[18px]` on `AvatarImage` and `AvatarFallback`. (User said "everywhere", so the topbar chip squares up too — it's still 40px so it reads as a tile, not an app icon.)

**3. Settings avatar — `src/routes/_authenticated/_professional/dashboard_.settings.tsx`**
- Line 145: change the initials swatch from `rounded-full` to `rounded-[18px]`.

**4. Demo content (clients/leads/at-risk thumbnails) — `src/components/dashboard/DashboardDemoContent.tsx`**
- Lines 497, 525, 680: change the four client/lead/seat avatar `<img>` tags from `rounded-full` to `rounded-[14px]` (small-photo exception per the locked radius memory — these are 32–40px scaled-down thumbnails that should read as the same shape as the larger 18px source). Status pills and progress bars on the same lines stay `rounded-full` — they are pills, not avatars.

**5. Untouched (intentionally circular)**
- Step indicators / icon swatches with Lucide icons inside (`flex size-10 items-center justify-center rounded-full bg-…` in `_professional/dashboard.tsx:246`, `DashboardDemoContent.tsx:145`, `:387`, `:732`) — these are icon tiles, not avatars.
- All `rounded-full` pills (badges, progress bars, toggle switch knob, notification count). These are not avatars.

## Out of scope

- No change to AI prompt, crop math, validation, upload pipeline, or any `avatar-ai.functions.ts` logic.
- No change to the shared `src/components/ui/avatar.tsx` shadcn primitive — keep it circular for any non-dashboard caller. We override per-usage in the dashboard files above. (Rationale: the primitive is also used by other parts of the app that should stay circular; a global change is broader than asked.)
- Directory/marketing pages — already square at 18px.

## Verification

After edits: load `/dashboard/profile` and confirm the 80px hero preview + 64px secondary preview render as 18px squares, identical in shape to a `/pro/$slug` hero. Load `/dashboard` and confirm the topbar user chip and demo client thumbnails are 18px / 14px squares. Compare side-by-side with `/find-a-professional` to confirm WYSIWYG.
