
# Coming-Soon Launch Page + Global Pre-Launch Gate

## Design source of truth (non-negotiable)

- Pulls directly from `/about` and the existing marketing system. No new palette, no new fonts, no new primitives.
- Tokens: existing brand orange (`--brand-orange*`), `bg-reps-bg`, `bg-reps-panel/15–/30`, white at `/45 /55 /70 /80`, emerald only for status.
- Typography: `SectionEyebrow`, `SectionHeading`, `MarketingHeroEyebrow`, `MarketingFaq` — exactly as used elsewhere. No hand-rolled headings.
- Hero overlay: `<HeroOverlay copySide="left" />` — the same 5-layer wash used on /features/* and /cpd.
- Vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`, sections `py-20 lg:py-28`. No dividers; alternating `bg-reps-panel/15`/`/30` only.
- Radii: 24px hero, 22px large panel, 18px feature cards, 12px input, 10px button. Buttons flat — no shadows.
- Hero imagery: reuse the cinematic `/about` hero asset (REPS-wordmark compliant) — no new image generation.

## Launch target

- **Friday 19 June 2026, 00:00 Europe/London (BST, UTC+1)** = `2026-06-18T23:00:00Z`.
- Countdown computed from that UTC instant so it's correct in every timezone and during SSR.

## Page structure (`/coming-soon`)

Single route, no chrome (no header/footer), full-bleed brand surface. Sections in order:

```text
1. Hero
   - HeroOverlay (5-layer wash)
   - MarketingHeroEyebrow: "Launching 19 June 2026"
   - SectionHeading H1 (locked type scale): "The professional standard for fitness is almost here."
   - 16px lede: positioning sentence pulled from /about manifesto language.
   - Live countdown grid: Days / Hours / Minutes / Seconds
     • 4 large panels (22px radius, bg-reps-panel/30, border-reps-border)
     • Mono-feel numerals via existing display font, tabular-nums, no jitter
     • Updates every 1s client-side; SSR renders the initial delta
   - Primary CTA: email capture (single shadcn Input + Button, inline)
     • POSTs to a server fn that upserts into a new `launch_waitlist` table
     • Success → swap to confirmation state in place (no toast spam)
   - Trust line under form: "No spam. One email when we go live."

2. Proof strip (tight, pt-10 pb-16 lg:pt-12 lg:pb-20)
   - Three short stat/credibility tiles reusing /about stat-strip styling
     (e.g. "Independent register", "Ofqual-regulated qualifications verified",
      "Built with professionals, not for ads")

3. "What's launching" — 3-up feature grid (py-20 lg:py-28)
   - Reuses existing feature-card pattern from /about "more than a directory"
   - Three cards: Verified register · Pro shop-fronts · Operations that runs your day
   - No links out — cards are descriptive only (site is gated)

4. FinalCta band
   - Reuses `<FinalCta>` primitive with launch-specific copy
   - Single CTA: scroll back to the email form (anchor), no external link

No FAQ, no nav, no footer links to gated pages. Only outbound link is `mailto:` for press.
```

## Global pre-launch gate (redirect)

Behavior: any visitor who is **not authenticated** gets redirected to `/coming-soon` regardless of the URL they hit. Authenticated users see the real site unchanged.

Implementation in `src/routes/__root.tsx` via `beforeLoad`:

```ts
const ALLOWLIST = new Set([
  "/coming-soon",
  "/auth",                // sign-in
  "/auth/callback",       // OAuth/email callbacks
  "/reset-password",
  "/api",                 // server routes (webhooks, Stripe, cron) — prefix match
]);

beforeLoad: async ({ location, context }) => {
  const path = location.pathname;
  const isAllowed =
    path === "/coming-soon" ||
    path.startsWith("/auth") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/api/");
  if (isAllowed) return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/coming-soon" });
  }
}
```

- Runs on every navigation, including initial SSR.
- Authenticated users (including `cruz.pt@icloud.com` and `demo-verified@repsuk.org`) pass through to the full site.
- Webhooks, Stripe callbacks, and cron endpoints under `/api/public/*` are unaffected.
- Gate is controlled by a single boolean `LAUNCH_GATE_ENABLED` in `src/lib/launch.ts` so flipping it off at launch is a one-line change.

## SEO / head

- `/coming-soon`: indexable. Title "REPs — Launching 19 June 2026". Description from manifesto. og:image = /about hero asset. Self-referential canonical and og:url.
- All other routes: while the gate is on, they redirect before render, so no duplicate-content risk. `robots.txt` left as-is.

## Data: waitlist capture

New table:

```sql
CREATE TABLE public.launch_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  source text DEFAULT 'coming_soon',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.launch_waitlist TO anon, authenticated;
GRANT ALL ON public.launch_waitlist TO service_role;
ALTER TABLE public.launch_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can join waitlist"
  ON public.launch_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
-- no SELECT policy — list is admin-only via service role
```

Server fn `joinWaitlist({ email })` validates with zod, upserts on conflict do nothing, returns `{ ok: true }`. Rate-limited by IP via a small in-memory token bucket (best-effort).

## Files

- `src/routes/coming-soon.tsx` — the page
- `src/lib/launch.ts` — `LAUNCH_AT_UTC`, `LAUNCH_GATE_ENABLED`, allowlist helper
- `src/lib/waitlist.functions.ts` — `joinWaitlist` server fn
- `src/components/launch/CountdownGrid.tsx` — 4-cell countdown, SSR-safe
- `src/components/launch/WaitlistForm.tsx` — input + button + inline success state
- Edit `src/routes/__root.tsx` — add the `beforeLoad` gate
- One migration for `launch_waitlist`

## Compliance check (REPs audit)

- Tokens only, no raw hex. Existing radii. Flat buttons. Marketing primitives. Allowed white opacities. No banned phrases ("flat plan", "UK", etc.). No CIMSPA. Audit script will be run before sign-off.

## Out of scope (explicitly)

- No new colour palette, font, or layout system.
- No FAQ, no nav, no footer.
- No press page, no team page, no "early access for pros" CTA.
- No changes to existing locked pages — they just become unreachable until launch.
- Custom domain wiring is the next step after this lands.
