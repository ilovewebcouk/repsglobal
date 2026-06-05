# /find-a-professional — visual QA (mock-up only)

Rules of this pass: data, names, repeated faces, postcodes, dead buttons, unwired filters — **all ignored**. Only question on the table: *as a static screenshot, is this a world-class directory page?*

Answer: **no, but it's two compositional moves away from being one.** Right now it reads as a solid template. World-class directories (Airbnb, Booking experiences, Resy, Design+Code's directory, Read.cv people) feel *composed* — the eye lands somewhere on purpose, the page has rhythm, and the surfaces have depth. This page is flat and rhythmless.

Here is what is actually wrong with the picture.

## 🚨 The two composition problems (fix these and the page jumps a tier)

### 1. The dark search band is an empty rectangle, not a hero.
Top 280px of the page is: header → ~120px of pure black void → search panel → ivory. There is no visual anchor, no image, no headline, no atmosphere. Every world-class directory opens with **a hero you feel**: a wide editorial photo or a confident H1 with breathing room, *with* the search bar sitting on top of it as the call-to-action.

Move: turn the dark band into a proper **search hero** — ~440–520px tall, with a left-anchored editorial H1 + one-line sub on the left, the dark search panel as a floating card on the right (or full-width below the headline), and a subtle dusk-tungsten background photograph (REPS coach silhouette or empty studio) behind the whole thing at 25–35% opacity. Same dark palette, same panel — just *composed* instead of floating in a void. Matches the homepage hero language and the locked source-of-truth.

### 2. The results column has no rhythm — eight identical cards in a vertical run.
Currently it's just `space-y-4` of the same `ProCard`. Eight equal beats. The eye glazes after card three. This is the single biggest reason the page feels mid-tier vs Airbnb/Booking.

Two cheap rhythm moves that change everything:
- **Break the run at card 3 or 4** with a slim editorial inline band — a quiet "Featured this week" or a "Why REPs" horizontal strip — same width as the results column, ~96px tall, warm-white with an orange rule. Gives the eye a landing pad and a second composition beat.
- **First card slightly taller** (e.g. `h-[140px]` photo instead of 112) and tagged `Featured` in the orange chip. Establishes hierarchy. The remaining cards then feel like a deliberate list, not a wall.

Optional third: convert the grid to **2-column on `xl`** above 1400px. At 1320px max-width with a 260px rail, the result column is ~1020px wide — that's enough for a 2-up card grid on large screens and it would instantly read as "marketplace" rather than "list".

## ⚠️ Visual polish (real, but smaller-impact)

3. **Filter rail card lacks depth.** A 22px panel against an ivory page with the same warm-white as the cards — the rail visually fuses with the page. Either add a soft long-shadow (`shadow-[0_24px_60px_-30px_rgba(15,15,15,0.18)]`) or change the rail to a slightly cooler off-white than the cards so the two surfaces separate.

4. **All cards are the same warm-white as the rail.** Subtle, but the entire ivory-on-warm-white section reads as one big beige block. Bumping the cards to pure white with a 1px stone border (and keeping the rail warm-white) would create the surface hierarchy world-class directories rely on.

5. **Tag pills and trust-band icon chips wash out** — `bg-reps-ivory` on `bg-reps-warm-white` is barely a contrast step. Either add a 1px `border-reps-stone` to the pills, or invert them to white-on-stone. Same fix solves both.

6. **Pagination is centered but visually weightless.** A small "Showing 1–8 of 126" label on the left + the pager on the right (instead of dead-centered) gives the footer of the results column real composition.

7. **Trust band + testimonial are two separate ivory bands stacked.** The page closes with three consecutive `bg-reps-ivory` sections (results → trust → testimonial → footer). Visually that's four ivory blocks in a row. Merging the trust strip *into* the bottom of the results card (as a thin band the rail and column share) or flipping the testimonial to a dark band would give the page a proper rhythm of light → dark → light.

8. **Carousel dots under the testimonial are decorative noise** with one quote. Drop them; let the quote breathe.

9. **Header sits transparent on black with no visual separator from the search band.** A 1px `border-b border-white/5` would crisp the chrome edge.

10. **Sort dropdown** is the only piece of chrome above the results — looks orphaned. Add a small label group on the left ("8 of 126 · sorted by") so the row reads as a balanced bar, not a floating control.

## ✏️ Micro

11. Search-panel labels (`I'M LOOKING FOR`) are uppercase 11px white/55 — perfect — but the field icons (UserRound, MapPin, ChevronDown) sit on the **right** of each input. Convention is left. Mirroring them puts the icon in the visual scan path before the placeholder.

12. The orange `Find Professionals` button is 58px tall; the inputs are visually ~62px (label + value). One-pixel difference shows. Pin the button to match the input cell height exactly.

13. Popular searches sit in a separate row below the panel — a nice touch — but the orange links on dark have no underline-on-hover affordance. Add `story-link` or a subtle bottom rule animation; matches our hover language elsewhere.

## What's already strong (don't touch)

- Search panel composition (4-cell grid + orange CTA) is genuinely strong.
- Filter rail typography hierarchy (uppercase 12px label → 13px control) is bang on.
- Rating row pattern (stars + "& up") is the right idiom.
- Radius system is fully token-compliant — no 20/28/32 leaks, no `rounded-xl/2xl/3xl`.
- Pagination chrome is correctly scaled and grouped.

## Recommended fix-pass order (one build)

1. Rebuild the dark band as a **search hero** with editorial H1 + sub + background photograph (composition fix #1).
2. Add **rhythm break + featured first card** in the results column (composition fix #2).
3. Surface separation — cards to white-with-stone-border, rail keeps warm-white + soft shadow (#3, #4).
4. Pill / icon-chip contrast fix (#5).
5. Pagination + sort-bar balance (#6, #10).
6. Collapse the trust+testimonial stack into one composed closer — dark testimonial band (#7, #8).
7. Header bottom rule, label/icon side-flip, button height pin, popular-search hover (#9, #11–#13).

Do **just the first two** and the page already jumps from "good template" to "looks like the locked source-of-truth was always meant to feel". The rest is sharpening.

Used the **shadcn** skill (composition lens — surface hierarchy, rhythm, group/anchor patterns) for the audit. No code changes yet — say go and I'll execute the fix-pass.
