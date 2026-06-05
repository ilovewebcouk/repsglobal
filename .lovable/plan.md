## QA verdict — brutally honest

**Where it sits today: a strong 8/10.** It's clean, it has rhythm (black hero → ivory cards → dark editorial break → ivory cards → trust band → dark testimonial → footer), and it doesn't feel like a template. The Stripe-ish editorial directory aesthetic is landing.

**It is not world-class yet.** Five things are still holding it back. I'd fix all five before signing off.

---

### 1. The "Featured" card is barely featured

`James Wilson` has a small orange `FEATURED` badge but the card itself is the same width, same shadow, same border, same photo size as every other card on the rendered desktop view. The visual promise of "featured" doesn't pay off.

**Fix:** Add a thin (1.5px) `reps-orange` left border (or full border at 1px) and a faint warm tint (`bg-reps-warm-white` instead of pure white), plus bump the inner photo to a slightly larger module (160px desktop, current target 140px is being clamped). Keep the badge. The card should read as "premium tier" at a glance without needing to read the badge.

### 2. No active-filter chips between header and results

Every world-class directory (Airbnb, Booking, Vinted, Class Pass) shows the user's *current* search state as removable chips above the result list: `Within 10mi ×` `In-person ×` `Strength Coach ×`. Right now the sidebar holds state, the header says "126 professionals in London", and there is no bridge. Users can't see what filters are active without scanning the rail.

**Fix:** Insert a one-line `ActiveFilterChips` row directly under the "126 professionals in London / Sort by" header. Pre-populate with mock chips (`In-person`, `Both`, `Online`, `5★ & up`, `Within 10mi`) styled as soft `reps-stone` outlined pills with an `×` glyph. Static — this is still a mock-up.

### 3. Sticky sidebar leaves a 600px+ dead zone on desktop

Once the filter rail ends (~AVAILABILITY/RATING block), the left column is empty all the way down through the rest of the results, the dark editorial break, and the trust band. Sticky doesn't save it because the rail is shorter than the right column from the start.

**Fix:** Below the filter card in the same column, add a small `bg-reps-warm-white` help card: an icon + "Can't find your match?" + one-line copy + a `story-link` "Tell us what you need →". Same 22px radius, same warm tone. Fills the rail without screaming.

### 4. Closing testimonial is thin

A single quote in a dark band reads like a placeholder for "we'll add more later". For a directory page that has to *sell trust*, one anonymous testimonial under a long results list is the weakest closer on the page.

**Fix:** Convert the testimonial section into a 3-up grid on desktop (1-up stacked on mobile) — three short quotes, three different REPs categories represented (e.g. PT, Pilates, Nutritionist), each with name + city + 5-star row above the quote. Keep the dark atmosphere + dark gym backdrop + orange `“` glyph as the section header. Static mock data is fine.

### 5. Trust band reads as a card stuck on the page

`Why trust REPs professionals?` sits inside a single rounded panel with the four trust items as columns. On desktop it's fine; on the eye it competes with the result cards above it because it uses the same shape, same border, same shadow, same radius. There's no editorial separation between "results" and "marketing closer".

**Fix:** Replace the card with a borderless full-bleed band: just a thin top hairline rule (`border-t border-reps-stone`), keep the same content, drop the panel chrome. Lets the four trust pillars sit visually between the data section and the testimonial closer instead of duplicating the card pattern.

---

### Lower-priority polish (do if there's time)

- **Mobile filter accordion** defaults to `open` — close it by default on `<lg` so mobile users land on results, not filters.
- **Search button copy** — "Find Professionals" is wordy. Tighten to "Search" with the magnifier, or drop the icon and keep the words. Pick one.
- **Bookmark icon** on each card is unlabelled and lonely. Either pair it with a `MessageSquare` quick-action OR give it a hover tooltip "Save".
- **First card photo crop** (and a few others) crops faces at the hairline. Not a code fix — flag for the image swap pass.

---

### What I will NOT touch

- The dark hero is locked in and reads well.
- The "WHY REPS" editorial break between cards 4 and 5 — it's doing real work breaking the vertical repetition.
- The header z-index / stacking fix from the previous turn.
- Pagination layout — already polished across breakpoints.

---

### Implementation scope (one turn)

All changes in `src/routes/find-a-professional.tsx`. No new files, no design tokens added (uses existing `reps-orange`, `reps-warm-white`, `reps-stone`, `reps-charcoal`, `reps-muted-light`). No new packages. Verify with desktop (1440), tablet (768), mobile (390) screenshots.

If you want me to ship all five fixes in one pass, approve and I'll do it.
