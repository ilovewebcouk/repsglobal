### 1. Add "How it works" to the top header

`src/components/public/PublicHeader.tsx`:

- **Desktop nav**: insert a new `<Link to="/how-it-works">How it works</Link>` between "Find a Pro" and "Resources", using the same `menuItemClass` as its siblings.
- **Mobile drawer** (`MobileDrawer`): insert a flat (non-accordion) link "How it works" → `/how-it-works` between the "Find a Pro" and "Resources" accordion items, styled with `mobileLinkClass(active)`.
- Extend the `active` map to include `howItWorks: pathname.startsWith("/how-it-works")` so the link gets active styling on `/how-it-works`.

### 2. Surface the orphaned `/faq` page

`src/components/public/PublicFooter.tsx`:

- Add `{ label: "FAQ", to: "/faq" }` to the **For Members** column, after "Help Centre".

### 3. Out of scope (intentional)

- Pricing stays footer-only.
- `/verify` route exists — no change needed.
- `/unsubscribe` stays out of nav (email-only).

No other files change.