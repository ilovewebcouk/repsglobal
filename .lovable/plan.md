# /privacy, /cookies, /terms — Legal pages

Build a consistent set of three customer-facing legal pages using a single shared `LegalLayout` so the chrome, type rhythm, table-of-contents, and "Last updated" strip match across all three. Content is operator-editable plain text — no `dangerouslySetInnerHTML`, no Markdown rendering.

## Shared shell

New primitive: `src/components/legal/LegalLayout.tsx`
- Dark hero header (eyebrow "Legal" + H1 + 1-sentence lede + "Last updated: {date}" + entity line "Operated by Cruz Pereira, trading as REPs, contactable at support@repsuk.org. Governing law: England & Wales.")
- Two-column body on lg: sticky in-page `<nav>` table of contents on the left, prose column on the right.
- Reuses locked tokens (radius 18px cards / 22px hero panel / 10px buttons / 12px inputs, semantic colour tokens only, no emerald, no banned phrases).
- Renders one `<h2 id="...">` per section so the ToC links anchor cleanly.
- Footer = `PublicFooter`.

Updates to existing routes:
- `src/routes/privacy.tsx` — full rewrite, uses `LegalLayout`.
- `src/routes/terms.tsx` — full rewrite, uses `LegalLayout`.
- `src/routes/cookies.tsx` — refit onto `LegalLayout`, keep the four-category table (Essential / Functional / Analytics / Marketing).

All three get matching `head()` with route-specific title, description, og:title, og:description, og:url (self-referencing `https://repsuk.org/...`), and a self-referencing canonical `<link>`.

## Shared facts used throughout

- Entity: "Cruz Pereira, sole trader trading as REPs ("REPs", "we", "us")".
- Contact: `support@repsuk.org` for privacy, legal and complaints.
- Governing law: England & Wales.
- Subprocessor language: generic categories only — "hosting & infrastructure provider", "payments processor", "email delivery provider", "analytics provider", "AI provider". No vendor names.
- Domain: `https://repsuk.org`.
- Last updated: `26 June 2026` (single constant per file).

## /privacy — sections

1. Who we are (controller + contact)
2. What data we collect (account, profile, verification docs, reviews, support, payments, technical/usage)
3. How we use it (operate REPs, verify professionals, prevent fraud, communicate, improve, legal obligations)
4. Lawful bases (contract, legitimate interests, consent, legal obligation) — UK GDPR named explicitly
5. Sharing & subprocessors (generic categories only)
6. International transfers (UK IDTA / SCC reference; no specific countries promised)
7. Retention (account data: while active + 6yrs for tax; verification evidence: while listed + 2yrs; support: 3yrs; analytics: 26mo)
8. Your rights (access, rectification, erasure, restriction, portability, objection, complaint to ICO)
9. Children (16+ only; under-18s with consent from parent/guardian)
10. Security (TLS, role-based access, encrypted at rest via hosting provider)
11. Changes to this policy
12. How to contact us

## /terms — sections

1. About these terms (binding agreement; who they cover — clients and professionals)
2. Eligibility (16+; legal capacity)
3. Accounts (truthful info, account security, suspension grounds)
4. Professional listings & standards (link to `/standards`; verification is platform-level, not a regulator endorsement)
5. Reviews (must be genuine and based on a real interaction; we may remove fake/abusive reviews)
6. Bookings, payments & refunds (between client and professional; REPs is not a party; payments processed by a third-party payments processor; refunds at the professional's discretion unless law requires otherwise)
7. Acceptable use (no scraping, no impersonation, no harassment, no unlawful content)
8. Intellectual property (we own REPs branding; you license us the content you submit to operate the platform)
9. Disclaimers & liability (platform "as is" within the limits the law allows; no exclusion for death, personal injury, fraud, or rights that can't be excluded under English law)
10. Suspension & termination
11. Changes to these terms (30 days' notice for material changes)
12. Governing law & disputes (England & Wales; consumer rights preserved)
13. How to contact us

## /cookies — sections (rewrap existing content)

1. What cookies are
2. Categories we use (existing table: Essential / Functional / Analytics / Marketing — keep current copy)
3. Managing your preferences (browser settings + future consent banner placeholder)
4. Third-party cookies (generic — analytics provider, payments processor checkout)
5. Changes to this policy
6. How to contact us

## Out of scope

- No DPA / SCC PDF downloads (operator can request later).
- No live consent banner wiring — page only references it.
- No vendor names anywhere (per user choice).
- No JSON-LD beyond what `__root.tsx` already emits.
- No `og:image` — text pages don't benefit from a placeholder.

## Compliance checklist

- Semantic tokens only, no raw hex.
- Radii from the locked 9-step scale (10/12/18/22).
- No banned phrases ("UK PTs", booking fee/commission, CIMSPA, third-party logo grids).
- Self-referencing canonical + og:url per route.
- Plain JSX text, no `dangerouslySetInnerHTML`.
- "Maintained by REPs" qualifier on every page (per trust-page-generation guidance).
