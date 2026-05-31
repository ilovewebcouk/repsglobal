---
name: doc-sync-source-of-truth
description: Audit and sync all REPs project documentation (docs/**, README files, .lovable/plan.md) against the locked source of truth. Replaces deprecated brand orange hex (#F28C38/#D87322 → #FF7A00 family), banned radii (14/20/28/32px and rounded-xl/2xl/3xl → 9-step scale), archived mock-up filenames (home_v1.png etc. → reps_fullpage_*_v1.png), and outdated product naming, then emits a concise change report. Trigger when the user asks to "sync docs", "audit documentation", "update docs to match", "doc-sync", or after any change to tokens/mock-ups/scope.
---

# Doc-sync to Source of Truth

A repeatable documentation audit + rewrite pass for the REPs project. Use whenever docs may drift from the locked design system, mock-up set, or Phase 1 scope.

## 1. What "source of truth" means here

| Layer | Location | Rule |
| --- | --- | --- |
| Mock-ups | `src/mockups/reps_fullpage_*_v1.png` (6 files) | Visual truth — override docs |
| Tokens | `src/styles.css` | Brand orange + radius definitions |
| Memory | `mem://index.md` + `mem://design/source-of-truth` | Always-on rules |
| Docs | `docs/00_README.md` … `docs/06_*.md` | Must reflect everything above |

The six allowed mock-up filenames are:

```
reps_fullpage_home_v1.png
reps_fullpage_signup_login_v1.png
reps_fullpage_directory_search_results_v1.png
reps_fullpage_professional_profile_v1.png
reps_fullpage_professional_dashboard_v1.png
reps_fullpage_admin_dashboard_v1.png
```

## 2. Replacement matrix

| Deprecated | Replacement |
| --- | --- |
| `#F28C38` | `#FF7A00` (`--brand-orange`) |
| `#D87322` | `#E96F00` (`--brand-orange-hover`) — or `#CC6200` if context is pressed/active |
| Old hardcoded orange in prose | Token name `--brand-orange` / `--brand-orange-hover` / `--brand-orange-pressed` |
| Radii `14px / 20px / 28px / 32px` | Nearest in 9-step scale: 6 / 8 / 10 / 12 / 16 / 18 / 22 / 24 / 999 |
| `rounded-xl` / `rounded-2xl` / `rounded-3xl` | Explicit `rounded-[Npx]` from scale |
| `home_v1.png`, `search_v1.png`, `profile_v1.png`, `dashboard_v1.png`, `signup_v1.png`, `admin_v1.png` | Matching `reps_fullpage_*_v1.png` |
| "6-screen collage", "16:9 crop" references | "full-page mock-up in `src/mockups/`" (or move to archived section) |
| "REPs UK" outside legacy/migration context | "REPs" |
| Gold/yellow rating stars | Brand orange rating stars |
| Button shadow guidance | "Buttons are flat — `shadow-none` only" |
| Phase 1 implies auth/DB/payments/AI/maps/migration | "Deferred — not part of Phase 1" |

## 3. Scope

Audit these paths:

- `docs/**/*.md`
- `*.md` at repo root (README, CHANGELOG, etc.)
- `.lovable/plan.md`
- `mem://**` (only fix descriptions; don't rewrite user-stated preferences)

Do **not** touch:

- `src/mockups/**` (binary assets)
- `src/styles.css` (it IS the token source — fix docs to match it, not vice versa)
- Generated files (`routeTree.gen.ts`, `dist/`, `node_modules/`)
- `.git/`

## 4. Workflow

1. **Scan** — run the bundled audit:
   ```bash
   # code--copy knowledge://skill/doc-sync-source-of-truth/scripts/doc-audit.sh /tmp/doc-audit.sh
   # code--exec bash /tmp/doc-audit.sh
   ```
   It prints every violation grouped by category with file:line.

2. **Plan** — for each hit, decide: direct replace, contextual rewrite, or move-to-archived-section. Flag ambiguous cases instead of guessing.

3. **Apply** — make edits with `code--line_replace` (preferred) or `code--write`. Re-run the audit after edits until it exits 0.

4. **Report** — respond with the exact 5-section report template (Section 5). Do not skip sections, do not embed long diffs.

## 5. Required report format

```
Doc-sync change report

1. Documents checked
   - <relative path> (<lines>)
   - ...

2. Documents updated
   - <relative path>: <one-line summary of change>
   - ...

3. Outdated references replaced
   - <count> × #F28C38 → #FF7A00
   - <count> × #D87322 → #E96F00 / #CC6200
   - <count> × banned radii (14/20/28/32px or rounded-xl/2xl/3xl) → 9-step scale
   - <count> × archived mock-up filenames → reps_fullpage_*_v1.png
   - <count> × "REPs UK" → "REPs"
   - <count> × other (list)

4. Remaining conflicts
   - <path:line> — <why it could not be auto-resolved, what decision is needed>
   - "None" if clean

5. Confirmation
   Docs now match: full-page mock-ups (src/mockups/reps_fullpage_*_v1.png),
   brand orange tokens (#FF7A00 / #E96F00 / #CC6200), 9-step radius system
   (6/8/10/12/16/18/22/24/999), flat-button rule, Phase 1 scope.
   Audit script: PASS
```

## 6. Guardrails

- **Doc-sync only** — never redesign, change routes, change schema, or add features. If a sync would imply a code change, stop and surface it under "Remaining conflicts".
- **No new docs unless requested.** If a missing topic is discovered, list it under "Remaining conflicts", don't invent a file.
- **Preserve voice and structure** — replace values, not paragraphs. Only restructure when an entire section is obsolete (e.g. archived mock-ups → move into an "Archived References" subsection).
- **Phase 1 reminder** — when touching docs, re-assert: "Phase 1 = static high-fidelity screens only" wherever scope is described.

## 7. Files in this skill

- `SKILL.md` — this file
- `scripts/doc-audit.sh` — scans docs/**, root *.md, and .lovable/plan.md for every deprecated value in the replacement matrix
- `references/report-template.md` — copy-paste change report skeleton
