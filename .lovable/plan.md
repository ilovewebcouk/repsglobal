## What's there today (hero locked, everything below in scope)

Scroll order after the hero:

```
1. VenueStrip      — "coach clients at gyms across the UK" + scrolling gym wordmarks
2. Stats strip     — 25k+ / 50k+ / 120+ countries / 1M+ sessions
3. How it works    — Search → Verify → Connect → Train (4 steps)
4. Specialism      — 7 icon tiles + "View all specialisms"
5. Featured REPs   — 4 pro cards (the actual product)
6. Outcomes        — 3 testimonial cards
7. We set the bar  — 4 trust tiles (verified, CPD, real reviews, global)
8. Pull-quote      — "world's register of verified fitness professionals…"
9. For pros CTA    — dark card recruiting coaches
10. Find/Trust/Train/Transform — closing CTA
11. Press marquee
```

## Diagnosis — why this isn't world-class yet

**A. Featured REPs is buried.** Four full sections (venue strip, stats, how-it-works, specialisms) sit between the hero and the first sight of a real coach. A premium marketplace should put faces in front of the user within one scroll of the hero — that's the product. Right now we're explaining the product before showing it.

**B. Venue strip is the weakest link.**
- Copy still says "coach clients at gyms across the UK" (global-copy violation, same root cause as the earlier sweep).
- Visually it's a low-contrast wordmark marquee on ivory that competes with the press marquee at the bottom — we have two scrolling logo strips on one page.
- Strategically it's "where they work" before we've shown "who they are". Wrong order.

**C. Stats strip is decorative, not decisive.** 25k+ / 50k+ / 1M+ are unverified vanity numbers sitting on their own band. They'd carry more weight inline with trust copy (next to "We set the bar") than as a standalone section.

**D. How it works comes too early.** Process explainers belong *after* the user has seen something they want — they answer "okay, how do I get this?", not "what is this?".

**E. Trust signals are scattered.** "We set the bar", the pull-quote, and the press marquee are all saying the same thing (REPs is credible) in three different visual registers, 1500px apart. They should compound, not repeat.

## Proposed re-order

```
1. Hero                              ← locked, untouched
2. Featured REPs Professionals       ← promoted to position #2 — product first
3. Specialism explorer               ← "or browse by what you need"
4. How it works (4 steps)            ← now answers "how do I get this?"
5. Outcomes (testimonials)           ← real results from real clients
6. Trust block: "We set the bar"     ← absorbs the stats strip inline
   + stats inline (25k / 50k / 120 countries / 1M)
   + pull-quote folded in as the section's closing line
7. For professionals CTA             ← unchanged
8. Find. Trust. Train. Transform.    ← unchanged closing CTA
9. Press marquee                     ← unchanged
```

Net effect: 4 sections before Featured → 0. One trust crescendo instead of three. One scrolling marquee on the page instead of two.

## What happens to VenueStrip

Two options — I'd like you to pick:

- **Cut it from the homepage.** Move the gym-venue filter into `/find-a-professional` (where the venue chips already are) and let the homepage breathe. Strongest case for "world-class".
- **Keep it, but rework it.** Move it down to sit just above the press marquee, restyle as a quiet "Trusted at" line (not a hero-sized headline), and fix the UK copy to "Trusted at gyms in your city" or similar. Less brave, keeps the venue-filter discovery hook on the homepage.

## QA fixes that ship regardless

- Strip "UK" from `VenueStrip.tsx:26` (and `RegisterProof.tsx:9` while we're in there — flagged in the previous sweep and still unfixed).
- Make sure stats numbers and "We set the bar" copy agree (today the stats say "120+ countries" but the trust tile says "120+ countries" — keep them aligned if we inline them).
- Re-screenshot full page after the re-order to confirm the rhythm reads as: **hero → product → browse → process → proof → trust → recruit → close**.

## Technical notes (small)

- All sections already live in `src/routes/index.tsx` between lines ~258–582; the re-order is JSX block movement, no new components needed.
- Inlining stats into the trust block means deleting the standalone stats `<section>` (≈ lines 261–278) and adding a 4-col stat row inside the "We set the bar" grid.
- Folding the pull-quote into the trust block means deleting the standalone dark quote `<section>` (≈ lines 485–496) and using its text as the trust block's closing line on the ivory surface.

## Questions before I build

1. **VenueStrip:** cut from homepage, or keep-but-demote-and-fix?
2. **Stats strip:** inline into the trust block (my recommendation), or keep as its own band?
3. **Pull-quote section:** fold into trust block (my recommendation), or keep its own dark band for drama?

Once you answer those three, I'll implement the re-order, the UK fixes, and re-screenshot to confirm world-class.