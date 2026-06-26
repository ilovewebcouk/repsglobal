## Goal

Rewrite `/terms` as a **world-class, UK-law Terms of Use** for REPs — drafted in the style of UK commercial counsel, hardened to protect REPs' brand and registered trade marks, with a clear **no-refunds** stance for a digital platform. Keep the existing `LegalLayout` shell, sticky ToC, "Last updated" strip and shared chrome.

> Caveat I'll surface in the page: REPs has had these drafted to a professional standard, but they are not a substitute for bespoke legal advice. I'll recommend a final solicitor/barrister review before launch — I'm an AI, not your barrister.

## Trade mark verification (from IPO public register, all owned by Scott McKay, 167-169 Great Portland Street, London W1W 5PF)

| No. | Mark | Status | Classes | Notes |
|---|---|---|---|---|
| UK00003857976 | **REPs** (word) | Registered (31 Mar 2023, renews 09 Dec 2032) | 41 | Education & training |
| UK00003863503 | REPs (figurative) | Registered (31 Mar 2023, renews 30 Dec 2032) | 16, 41 | Print + education |
| UK00003868963 | REPs (figurative) | Registered (14 Apr 2023, renews 18 Jan 2033) | 16, 41 | Print + education |
| UK00003883073 | REPs (2 figurative variants) | Registered | (see register) | Series mark |
| UK00004397125 | **REPs** (word) | Application Published (filed 04 Jun 2026) | 9, 35, 42 | App / directory / SaaS — covers the platform |
| UK00004397139 | REPs (figurative) | Examination (filed 04 Jun 2026) | (per register) | Logo for the platform |

The Terms will list these by number, mark, status and class so any infringer is on clear notice.

## Page structure (sections in the rewritten /terms)

1. **About these terms** — binding contract; operator: Scott McKay trading as REPs; entire-agreement; order of precedence (these Terms > Privacy > tier-specific terms).
2. **Definitions** — Platform, Professional, Client, Listing, Verification, Subscription, Content, etc.
3. **Eligibility & accounts** — 16+, capacity, accurate info, account security, one account per person, suspension grounds.
4. **The Platform — what REPs is and isn't** — directory + SaaS; REPs is **not** a party to client/professional contracts; not an employer, agent, regulator or awarding body.
5. **Professional listings, Verification & Standards** — link to `/standards`; verification is a platform check, not a statutory accreditation; REPs may suspend/remove listings.
6. **Reviews & user content** — authenticity rules; licence grant to REPs; moderation rights; right to reply.
7. **Subscriptions, billing & auto-renewal** — Verified £99/yr, Pro Founding £59/mo (per `src/lib/billing.ts`), Studio waitlist; price changes on notice; taxes; failed-payment handling.
8. **No refunds — digital service** *(headline clause)* —
   - Subscriptions are non-refundable once access begins.
   - Under the Consumer Contracts Regulations 2013 reg. 37, the user **expressly consents** at checkout to immediate supply of digital content and acknowledges loss of the 14-day cancellation right.
   - No pro-rata refunds on cancellation or downgrade; access continues to the end of the paid period.
   - Discretionary goodwill refunds only in narrow cases (duplicate charge, proven REPs-side failure to provide the service for a sustained period).
   - Chargeback abuse = breach + immediate suspension.
9. **Bookings between Clients and Professionals** — direct contract between them; REPs not liable for delivery, quality, injury, or refunds for those services.
10. **Acceptable use** — no scraping, no automated access, no reverse engineering, no impersonation, no harvesting of professional data for competing directories, no misuse of Verification badges.
11. **Intellectual property & REPs trade marks** — REPs owns the platform IP; explicit list of the 6 UK trade marks above with numbers, classes and owner; unauthorised use (including in domains, handles, paid ads, training providers, awarding-body marketing) is infringement under the **Trade Marks Act 1994** and may also be passing off; takedown contact `legal@repsuk.org`; no implied licence; permitted nominative/editorial use only.
12. **User-content licence to REPs** — worldwide, royalty-free, sub-licensable, for operating, promoting and improving the Platform; moral-rights waiver to the extent permitted.
13. **Third-party services** — payments processor, email, analytics, AI provider; REPs not liable for their outages or terms.
14. **Beta / Founding / waitlist features** — provided "as is", may change or be withdrawn; Founding pricing terms.
15. **Suspension & termination** — by user (anytime, no refund), by REPs (breach, risk, regulator/police request); effect of termination; survival clauses.
16. **Warranties & disclaimers** — service "as is" / "as available" to the maximum extent permitted; statutory consumer rights preserved.
17. **Limitation of liability** — exclusions for indirect/consequential loss, loss of profits, goodwill, data; aggregate liability cap = greater of (a) fees paid in the 12 months before the claim or (b) £100; **carve-outs** for death/personal injury caused by negligence, fraud, fraudulent misrepresentation and any liability that cannot be excluded under English law (incl. CRA 2015 for consumers).
18. **Indemnity (business/professional users only)** — indemnify REPs against third-party claims arising from their listing, content or services to clients.
19. **Data protection** — see Privacy Policy; REPs is controller for platform data; professionals are independent controllers for their own client records.
20. **Complaints & dispute resolution** — write to support first; 30-day negotiation; ODR/ADR signposting for consumers; otherwise courts (below).
21. **Changes to these terms** — 30 days' notice for material changes; continued use = acceptance.
22. **Force majeure**.
23. **Assignment, severability, waiver, no partnership/agency, third-party rights excluded** (Contracts (Rights of Third Parties) Act 1999 disapplied except where stated).
24. **Notices** — email to addresses on file; postal to REPs c/o 167-169 Great Portland Street, London W1W 5PF.
25. **Governing law & jurisdiction** — England & Wales; exclusive jurisdiction of the courts of England & Wales; consumer protection mandatory rights preserved.
26. **Contact** — `support@repsuk.org` general; `legal@repsuk.org` IP/legal notices (we'll wire this alias separately if it doesn't exist yet).

## Files touched

- `src/routes/terms.tsx` — full rewrite of the `SECTIONS` array using the structure above; bump `LAST_UPDATED` to **26 June 2026**; refresh `META_DESC`.
- *No* changes to `LegalLayout.tsx`, `/privacy`, `/cookies`, billing logic, or any UI components.

## Out of scope (flagged for follow-up, not done this turn)

- Adding a checkout-time "I consent to immediate supply and waive my 14-day cancellation right" checkbox + audit log. Required to actually rely on the reg. 37 carve-out in clause 8 — recommend doing this next.
- Creating the `legal@repsuk.org` inbox/alias.
- Final solicitor sign-off.

## Clarifying questions before I write

1. **No-refund firmness** — go with the strict version above (digital service, no pro-rata, narrow goodwill only), or a softer "14-day money-back on first subscription only" stance?
2. **Liability cap** — happy with **greater of (12 months' fees) or £100**, or do you want a flat £100 / flat 12-months / something else?
3. **Operator entity on the Terms** — keep **"Scott McKay trading as REPs"** (matches the IPO register), or are you incorporating a Ltd company before launch that I should name instead?
4. **Should I add a parallel checkout consent task** (the reg. 37 waiver checkbox) in this same plan, or keep that for a separate turn?