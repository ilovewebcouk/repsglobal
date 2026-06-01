## Plan: Build /verify page + answer the offline-verification question

### The page
Create `src/routes/verify.tsx` — a static Phase 1 trust page matching the `/standards` visual pattern (dark theme, PublicHeader/PublicFooter, 18px cards, brand orange).

**Sections:**
1. **Hero** — "How to know your trainer is actually verified." CTAs: "Look up a professional" (→ `/find-a-professional`) and "Our full standards" (→ `/standards`).
2. **What the badge means** — 4 cards: qualifications, insurance, identity, ongoing CPD.
3. **Spotting the badge on REPs** — split layout with a visual mock of the orange Verified badge, plus 3 cards for: pro profile, search results, reviews.
4. **Checking a trainer off-platform** ← this is the answer to your second question. 3 cards covering the three offline-verification paths:
   - **Scan their REPs QR** — every verified pro gets a personal QR they can put on posters, business cards, social bios. Scanning lands you on their REPs profile.
   - **Search their name** — type the name into Find a Professional. No result = not currently registered.
   - **Ask for their REPs ID** — every member has a unique ID; ask, then look them up.
5. **What the badge doesn't say** — small disclaimer panel: it confirms qualified/insured/accountable, not coaching style. Red flag if a "REPs member" can't be found on public search.
6. **CTA band** — same style as `/standards`.

### Files
- Create `src/routes/verify.tsx` (Vite plugin auto-updates `routeTree.gen.ts`).
- No other files touched. No DB, no auth, no edge functions.

### How offline verification works (Phase 1 vs Phase 2)
You asked: how does a client verify a PT they see on a gym poster or Instagram?

**Phase 1 (this page) — the *explanation* of the system:**
The page tells clients the three paths above. They all rely on the public `/find-a-professional` directory existing.

**Phase 2 (later, when backend is wired) — the *mechanics*:**
- Every verified pro gets a **unique REPs ID** + an auto-generated **personal QR code** in their dashboard, which they can download for posters, business cards, Instagram bios, gym noticeboards.
- The QR resolves to `repsglobal.lovable.app/pro/{slug}` — a public, badged profile.
- Pros also get a downloadable **"REPs Verified" poster/badge asset pack** to display in studios.
- The directory search supports name + ID lookup so clients can confirm any trainer in seconds.

This page sets up the expectation now; the QR + ID + asset-pack tooling gets built in Phase 2 alongside the real admin verification workflow we talked about.

Switch to build mode and I'll create the page.