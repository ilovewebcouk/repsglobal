# Copy edit: /cpd

Goal: keep the page's confident, direct voice but remove slang and casual filler. No layout, structure, ordering, or component changes — text-only edits in `src/routes/cpd.tsx`.

## Tone rules applied throughout
- No profanity ("bullshit"), no chat slang ("trust me bro", "ghosts you", "wing it", "taped to the side", "Full stop.").
- Remove informal British colloquialisms: "dodgy", "punters", "chancer", "scammy".
- Replace casual intensifiers ("a trillion", "47 free CPD courses") with accurate, neutral wording.
- Keep the page's edge — direct sentences, short paragraphs, plain-English explanations.

## Specific text changes

### Meta + nav
- `META_DESC`: replace "spot a dodgy training provider before you spend a penny" → "spot an unsafe training provider before you pay". Replace "The rest don't." with "The rest don't count."
- `NAV_CHIPS`: "Spot a dodgy course" → "Spot a poor-quality course".
- Section id stays `dodgy-courses` for now (URL stability); only the visible label changes. (If you'd prefer to also rename the anchor, say so and I'll do it in one pass.)

### Hero
- Subhead third sentence: "If a course isn't, it isn't worth the paper." → "If a course isn't from a verified provider, it doesn't count toward your CPD log."

### WhatCpdIs
- `counts` item: `"Vendor product demos dressed up as 'education'"` → `"Vendor product demos presented as 'education'"`.

### RepsCpdSystem (pillars)
- "Logged quarterly" body: replace `No "trust me bro".` → `Self-declared hours without evidence don't count.`

### Qualifications intro
- Replace: "most punters don't know the difference between a Level 2, a Level 3 and a weekend 'mastery' certificate." → "most clients can't tell the difference between a Level 2, a Level 3 and a weekend 'mastery' certificate."

### Nutrition pathway intro
- "This is where punters get scammed most." → "This is where the public is most often misled."

### Generalist vs Specialist
- "No 'I also do that on the side.'" → "Not a generalist with a side interest."

### Verified providers
- "Hours from unverified providers don't. Full stop." → "Hours from unverified providers don't."
- Pull-quote: "running a print shop for certificates." → "selling certificates without standards."

### Dodgy courses section
- Eyebrow: "Spot a dodgy course" → "Spot a poor-quality course".
- H2: "Before you spend a penny, run this list." → "Before you pay, run this list."
- Intro: "Most scammy training providers follow the same playbook — oversized claims, hidden tutors, in-house assessment, finance pressure and a trillion 'free' CPDs taped to the side." → "Low-quality training providers follow the same playbook — oversized claims, hidden tutors, in-house assessment, finance pressure and a long list of bundled 'free' CPDs."
- RED_FLAGS:
  - `"Level 3 PT plus 47 free CPD courses" bundled — those CPDs are usually self-marked PDFs with no awarding body.` → `"Level 3 PT plus dozens of free CPD courses" bundled — those CPDs are typically self-marked PDFs with no awarding body behind them.`
  - `"High-pressure finance sales, "today-only" discounts and a sales rep on commission."` → `"High-pressure finance sales, 'today-only' discounts and commission-based sales reps."`
  - `"No refund policy. No complaints route. No external ombudsman."` — keep.
  - `"Marketing is all "earn £5k a month" income claims instead of what you'll actually learn."` → `"Marketing leads with income claims ('earn £5k a month') instead of what you'll actually learn."`
  - `"Refunds & complaints"` body: `"a help-desk that ghosts you after the card clears."` → `"a help-desk that goes silent once payment clears."`
  - `"Assessment integrity"` body: `"Real external assessment — not 47 multiple-choice questions you can re-take until you pass."` → `"Real external assessment — not in-house multiple-choice questions you can resit until you pass."`

### Raise the standard
- Eyebrow stays. Intro stays.
- Beat 01 title: `"Siphon out the bullshit."` → `"Filter out the bad actors."`
- Beat 01 body: replace `"Bedroom PTs with no qualifications. Instagram 'online coaches' selling £400 PDFs. People issuing meal plans they're not legally allowed to prescribe. REPs makes them visibly absent — the listing alone proves the work."` → `"Unqualified trainers. 'Online coaches' selling £400 PDFs. People issuing meal plans they're not legally allowed to prescribe. REPs makes them visibly absent — the listing alone proves the work."`
- Beat 03 body: `"a verified expert and a chancer"` → `"a verified expert and an unqualified operator"`.
- Section eyebrow on `RepsCpdSystem` H2 "Four mechanics. No theatre." → "Four mechanics. No window dressing."

### FAQ
- Q4 (`Why are some big-name training providers not on REPs?`) — keep, but change closing line: `"If a provider isn't here, treat that as information."` → `"If a provider isn't here, treat that as a signal."`
- Q9 (`Does being verified on REPs let me charge more?`): `"a verified expert and a chancer"` → `"a verified expert and an unverified operator"`.
- Q10 question + answer: `"How do I report a dodgy provider or coach?"` → `"How do I report a poor-quality provider or coach?"`; body: `"Bad actors lose verification and lose listings."` — keep.

## Out of scope (this pass)
- No layout, structure, or component changes.
- No copy changes outside `src/routes/cpd.tsx`.
- Anchor IDs left as-is to preserve any external links.
