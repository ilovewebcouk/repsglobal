## Public pages audit

I mapped every footer link to the routes that actually exist in `src/routes/`. Here's the full picture.

### ✅ Already built (public pages)

- `/` — Home
- `/find-a-professional` — Directory
- `/how-it-works` — How REPs Works
- `/reviews` — Reviews
- `/help` — Help Centre
- `/for-professionals` — Join REPs landing
- `/pricing` — Pricing
- `/about` — About REPs
- `/standards` — Standards
- `/verify` — Verification (just built)
- `/contact` — Contact
- `/faq` — FAQ
- `/terms`, `/privacy`, `/cookies` — Legal
- `/pro/$slug` — Public pro profile
- `/professions/$profession` — Dynamic specialism page
- `/in/$location` — Dynamic location page

### ❌ Missing public pages (referenced in footer or implied)

1. **`/specialisms`** — index page listing all specialisms (currently only the dynamic `/professions/$profession` child pages exist; nothing lists them)
2. **`/cpd`** — CPD & Education (public marketing page explaining REPs CPD for pros + clients)
3. **`/business-tools`** — Business Tools (public marketing page for the pro-side toolkit)
4. **`/careers`** — Careers at REPs
5. **`/press`** — Press / media room
6. **`/complaints`** — Complaints process (legal/trust page)

### ❓ Not yet confirmed

7. **`/blog`** — Blog index + `/blog/$slug` post pages. **Never specced.** Needs a decision before we plan it.

### Decisions needed from you

Before I plan/build any of these, I need answers:

1. **Blog** — do you want one in Phase 1? Options:
   - (a) Yes — full blog with index + post pages (static MDX or DB-backed?)
   - (b) Placeholder "coming soon" page only
   - (c) Skip entirely and remove from any nav/footer references
2. **Careers & Press** — same question: real pages now, "coming soon" stubs, or remove from footer?
3. **Specialisms index** — build a proper grid that links to each `/professions/$profession`, yes?
4. **CPD & Business Tools** — these are marketing pages aimed at pros (sits next to `/for-professionals` and `/pricing`). Build as proper trust/marketing pages in the same dark-theme pattern as `/standards` and `/verify`?
5. **Complaints** — short legal-style page (like `/terms`) or a fuller trust page explaining the process?

Once you answer, I'll come back with a build order and we can knock them out before wiring up nav.
