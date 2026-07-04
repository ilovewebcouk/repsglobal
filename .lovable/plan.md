# Launch email redesign — 3 directions

You're right. The current file is generic dark-mode HTML. It doesn't use the REPS wordmark, the type feels default, the snapshots sit flat inside boxes, and the CTA is a plain orange rectangle. It reads like a template, not like REPS.

Design taste is already locked by the site, so I'm not asking palette/type/layout questions. Everything below inherits:

- Wordmark: real REPS SVG (`src/assets/brand/logo.svg`) rendered as a PNG asset and hotlinked (email clients don't reliably render inline SVG — Gmail strips it, Outlook can't parse it). White wordmark on dark.
- Colors: `#0B0B0C` outer, `#131316` card, `#F4F4F5` primary text, `#A1A1AA` secondary, `#FF7A00` brand orange (matches `--brand-orange`, not the `#FF6A1A` I used before — that was wrong).
- Radii from the design system: 18px cards, 10px buttons, 999px pills. No `14/20/28/32px`.
- Type: system stack (email-safe), but sized to match the marketing scale — H1 32/40, section H2 22/28, body 16/24, eyebrow 11px uppercase tracking 0.22em.
- Eyebrows use `SectionEyebrow` styling (orange small-caps in a soft orange-tinted pill).
- No emerald anywhere (status-only rule).
- No "UK", no "BD migration", no commission language, no CIMSPA.

## The three directions

All three ship the same copy and the same 2 snapshots. They differ in **composition, hierarchy, and how the product is shown** — same taste, three points of view.

### Direction A — Editorial
The one that looks like a magazine feature about REPS, not a product announcement.

- Full-bleed REPS wordmark header on a hairline-bordered dark bar.
- Oversized editorial H1 (`Instrument Serif`-style feel via `Georgia, "Times New Roman", serif` fallback — the one serif we allow in email for editorial weight), one column, generous leading.
- Snapshots framed inside a **browser-chrome mock** (three dots + subtle address bar rendered in HTML/CSS, not an image) so they read as "live product", not "screenshot in a box".
- "Replaces your…" rendered as a horizontal row of monochrome vendor wordmark pills with a diagonal strike-through line drawn in CSS.
- Price panel is a wide orange-tinted band with a giant £34 number on the left, reassurance copy on the right.
- Verification block is a numbered 3-step ladder (01 / 02 / 03) with orange numerals, thin dividers.
- Single primary CTA, generous whitespace around it. Signature in italics.

**Feels like:** a broadsheet product story.

### Direction B — Product-forward
The one that shows the software first and talks about it second.

- Compact header: REPS wordmark left, tiny "Product update" tag right.
- H1 short and punchy (2 lines max), lede tight underneath.
- Snapshot #1 is the **hero** — huge, edge-to-edge inside the card, with a floating orange verified pill and a caption bar overlaid at the bottom (all HTML/CSS, no image editing).
- Below the hero: a 3-up feature grid — "Shop-front", "Enquiries → payments", "Verified trust" — each with a 24px icon-square in orange-tinted fill, title, one-line body.
- Snapshot #2 sits inside a smaller "Enquiry flow" card with an annotated numbered dot in the corner (matches the `AnnotatedMock` primitive language from the site).
- Price and verification are combined into one two-column panel: left = £34/year lock, right = verification 3-step checklist with orange check marks.
- Two-button CTA row: primary "Get verified", secondary ghost "Open the editor".
- Roadmap ("Insurance", "Business software") shown as two horizontal cards with a small "Coming" pill.

**Feels like:** a Linear or Vercel changelog email.

### Direction C — Founder letter
The one that reads like it came from you, not from marketing.

- Minimal header: just the REPS wordmark centred, small, with a hairline underline.
- No H1 in the traditional sense — opens with `"{{first_name}},"` in large type, then flows into a first-person paragraph.
- Snapshots appear inline **inside** the letter, each one preceded by a single italic caption line ("This is your public page.") — no card chrome, just image with a 1px `#1F1F22` border and 18px radius.
- Price, verification, and roadmap are woven into the letter as short standalone lines with orange left-borders (pull-quote treatment), not as separate panels.
- One CTA button at the bottom, orange, full-width on mobile.
- Signature block: your name, role, small REPS wordmark underneath.
- Footer is one line, centred, muted.

**Feels like:** a Stripe / Basecamp founder note.

## Shared build details (all three)

- Client-safe: table layout, inlined CSS, `role="presentation"`, VML button fallback for Outlook, `<meta name="color-scheme" content="dark light">`, `<meta name="supported-color-schemes" content="dark light">`, forced dark backgrounds via `[data-ogsc]` / `[data-ogsb]` selectors so Outlook.com dark mode doesn't invert to white.
- REPS wordmark: I'll rasterise `src/assets/brand/logo.svg` to a 2x white PNG at 480×86, upload via `lovable-assets`, and hotlink from the email. `alt="REPS"`.
- Snapshots stay on the existing `repsuk.org` CDN URLs already uploaded.
- Merge fields unchanged: `{{first_name}}`, `{{verify_url}}`, `{{login_url}}`, `{{sender_name}}`, `{{unsubscribe_url}}`.
- Deliver as a **new** file per chosen direction: `/mnt/documents/repsuk-website-editor-launch.html` (overwrites current) + refreshed `.txt` alternative.
- QA: render the final HTML via Playwright at 640px and 375px widths, screenshot both, and eyeball for wordmark clarity, snapshot fidelity, button hit area, and dark-mode behaviour before I hand back.

## Pick one

Which direction should I build — **A (Editorial)**, **B (Product-forward)**, or **C (Founder letter)**?
