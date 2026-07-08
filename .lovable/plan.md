## Remove header action buttons on the provider dashboard

The provider dashboard header currently shows two buttons — **View provider page** and **Edit provider website** — that duplicate actions already available on the new `ProviderWelcomeBanner` below (View provider page + Branding + Copy link, plus the sidebar "Provider website" link). Remove them for provider accounts only.

### Change

In `src/routes/_authenticated/_professional/dashboard.tsx` (lines ~127–157), drop the `isOrganisation` branch of the `actions` prop so no header actions render for providers. The trainer branch (View public profile / Request a review) stays exactly as-is.

Result: cleaner provider header — only search, notifications, and account menu remain on the right. Trainer dashboard is unaffected.
