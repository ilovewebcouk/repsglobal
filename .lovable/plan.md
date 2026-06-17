Brutal honest opinion: the sidebar is too narrow for the current horizontal lockup. The desktop sidebar is only 232px wide, and the 22px wordmark + divider + padding leaves the tagline with about 45px of usable width. That is why "Exercise Professionals" wraps onto a third line. The "fifty-fifty" feel comes from the wordmark and the tagline fighting over the same limited horizontal space.

Plan: scale the sidebar logo lockup down so the tagline sits cleanly on two lines and the wordmark becomes the dominant element again.

Changes
- Edit `src/components/dashboard/DashboardShell.tsx` (the `Sidebar` function is used by both desktop and mobile navigation, so one change fixes both).
- Update the logo lockup at the top of the sidebar:
  - Wordmark: `h-[22px]` → `h-[18px]`
  - Tagline: `text-[10px]` → `text-[9px]`
  - Line height: add `leading-[1.15]` for tighter two-line stacking
  - Divider padding: `pl-3` → `pl-2` to reclaim a few pixels
  - Gap: `gap-3` → `gap-2` to keep the lockup compact
- Keep the tagline as two explicit lines ("The Register of" / "Exercise Professionals") so the result matches the footer lockup in the screenshot.

Verification
- Open the dashboard preview and check the sidebar logo at desktop width. The tagline should now render on exactly two lines and the wordmark should read as the primary mark.
- Confirm the mobile sheet navigation uses the same lockup and still looks correct at 280px.
- Run the REPs build compliance audit (`bash knowledge://skill/reps-build-compliance/scripts/audit.sh`) and fix any token/radius violations before finishing.

Technical notes
- The lockup is currently inline in the sidebar. We will keep it inline unless, while editing, it becomes clear a small `SidebarLogo` component would make the markup cleaner. Either way, both desktop and mobile instances share the same `Sidebar` function, so they stay in sync.
- No layout or sidebar width changes are needed, so the main dashboard content area is unaffected.