## What the current template does well

- Cover image with orange glow (nice, brand-consistent).
- Clear H1 + category eyebrow + read time / date meta.
- Single orange CTA back to the full article.
- Rich REPS sign-off + unsubscribe are already auto-appended by the newsletter footer, so we don't need to duplicate that.

## What's holding it back

1. **No inbox preview text** — Apple/Gmail preview just shows the H1. A hidden preheader would double the "why open me?" signal.
2. **Only the very first paragraph is used** — the email feels thin vs the article. We can pull the excerpt + first 2 real body paragraphs (skipping cover-only blocks) so it reads like a genuine editorial send.
3. **No section teaser / "what's inside"** — a 3-bullet TOC built from the article's `h2` blocks gives readers a reason to click.
4. **Meta line is generic** — "6 min read · 5 July 2026". Better: "6-min read for personal trainers" (using `audience` if present) or a small category chip.
5. **CTA wording is weak** — "Read the full article →" is fine; "Read the full 6-minute article →" is stronger and lets people self-select.
6. **No secondary link** — one text link under the button ("Or open in your browser") catches Outlook/dark-mode users where the button renders oddly.
7. **No plain-text version** — currently only HTML goes out. Spam filters and Apple Mail Privacy weight plain-text alternatives; the composer already supports a `text` format we can populate.
8. **No UTM tags** — we can't tell in GA which sends drive traffic. Add `?utm_source=newsletter&utm_medium=email&utm_campaign=<slug>` to every link.
9. **Cover image lacks width/height** — some clients (Outlook, Gmail app) reflow badly without explicit dimensions. Add `width="600"` and a max-width style.
10. **No small REPS wordmark at top** — the auto-appended footer has full branding, but readers scanning the top of the mail see no logo. A tiny wordmark line above the eyebrow ties it to the site.
11. **Dark-mode colours** — `color:#111` on `#fff` is fine, but Apple Mail auto-inverts. Add `color-scheme: light` + `supported-color-schemes` meta to lock it, so the orange CTA stays legible.
12. **Cover glow is a client-side CSS effect** — the screenshot shows it because the composite is baked into the JPG. Nothing to change, just note it.

## Proposed new template

Rebuilt `buildArticleEmailHtml` (still a pure HTML string, still fully editable in the composer before sending):

```text
┌───────────────────────────────────────┐
│  REPS  (small wordmark, muted)        │
│                                       │
│  PLATFORM UPDATES     ← category chip │
│  Introducing the REPS website editor  │
│  6-min read for members · 5 Jul 2026  │
│                                       │
│  [ cover image, 600w, rounded ]       │
│                                       │
│  Excerpt paragraph (16px, darker)     │
│                                       │
│  First real body paragraph (15px)     │
│  Second real body paragraph (15px)    │
│                                       │
│  What's inside                        │
│   • Section H2 one                    │
│   • Section H2 two                    │
│   • Section H2 three                  │
│                                       │
│  [ Read the full 6-min article → ]    │
│  Or open in your browser              │
└───────────────────────────────────────┘
(auto-appended REPS footer + unsubscribe)
```

### Content rules
- **Preheader**: hidden `<div>` with `article.excerpt` truncated to ~110 chars.
- **Category**: rendered as a subtle pill, not just uppercase text.
- **Body paragraphs**: first 2 items in `article.body` where `type === 'p'`, skipping empty ones. Cap each at ~450 chars, add "…" if truncated.
- **What's inside**: first 3 `h2` blocks; hide the whole block if fewer than 2 exist.
- **Links**: helper `withUtm(href)` appends `utm_source=newsletter&utm_medium=email&utm_campaign=<slug>`.
- **Escape everything** the same way as today.

### Plain-text sibling
Add `buildArticleEmailText(article)` returning:

```text
REPS — Platform updates

Introducing the REPS website editor: your public page, in your hands
6-min read · 5 July 2026

<excerpt>

<first body paragraph>

What's inside:
- Section one
- Section two
- Section three

Read the full article:
https://repsuk.org/resources/<slug>?utm_source=newsletter&utm_medium=email&utm_campaign=<slug>
```

The composer already carries a `format` state (`text`/`html`) and a single `body` field. Keep behaviour: `Load from article` sets `format` to `html` and fills the HTML body. Also stash the plain-text version so, if the admin toggles to Plain text before sending, they see the text fallback instead of a stripped-down HTML dump.

### Cover image robustness
- Keep the persist-to-storage step already in place.
- Add `width="600"` and `style="width:100%;max-width:600px;height:auto;"`.
- If `coverUrl` resolves to `null`, skip the `<img>` cleanly (no broken icon).

## Files to touch

- `src/components/admin/campaigns/ComposeDialog.tsx`
  - Rewrite `buildArticleEmailHtml` per the layout above.
  - Add `buildArticleEmailText` and a `withUtm` helper.
  - Update the `onLoad` handler to also seed the text sibling.
  - Widen the tooltip copy under the article picker.

No backend, no schema, no template registry changes. Storage bucket and unsubscribe footer stay as they are.

## Out of scope (call out, don't build)

- Author bylines — no `author` field on `ResourceArticle` yet.
- "Related articles" block — would need editorial curation.
- A/B subject lines — belongs in the campaign runner, not the composer.
- Migrating this to a React Email template — overkill while it's an editable admin composer body.