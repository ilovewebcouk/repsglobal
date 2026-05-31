---
name: reps-doc-sync
description: Sync all REPs project documentation (docs/*.md, README, plan files, prompt packs) to the final approved source of truth — locked full-page mock-ups in src/mockups/, brand orange tokens (#FF7A00 family), 9-step radius system, flat-button rule, and Phase 1 scope. Trigger when the user asks to audit, sync, update, refresh, or align REPs docs, or when a written rule conflicts with the locked design.
---

# REPs Doc Sync

A repeatable workflow that rewrites REPs documentation to match the locked source of truth without redesigning the app, changing routes, or touching the schema. This is a **documentation-only pass**.

## Hard guardrails

Do NOT, during a doc-sync:
- Redesign the app or change layouts/routes/page structure
- Add functionality (auth, DB, payments, AI, maps, search logic)
- Alter database schema unless fixing a naming/reference inconsistency in docs
- Change the approved visual direction

Only edit Markdown / docs / plan files. No `src/**` edits except `src/mockups/` filename references inside docs.

## Locked source of truth (authoritative)

**Mock-ups** (`src/mockups/`, override all written guidance):
- `reps_fullpage_home_v1.png`
- `reps_fullpage_signup_login_v1.png`
- `reps_fullpage_directory_search_results_v1.png`
- `reps_fullpage_professional_profile_v1.png`
- `reps_fullpage_professional_dashboard_v1.png`
- `reps_fullpage_admin_dashboard_v1.png`

**Brand orange tokens (in `src/styles.css` only):**
`--brand-orange #FF7A00`, `--brand-orange-hover #E96F00`, `--brand-orange-pressed #CC6200`, `--brand-orange-soft`, `--brand-orange-border`.

**9-step radius:** 6 / 8 / 10 / 12 / 16 / 18 / 22 / 24 / 999 — buttons 10, inputs 12, std cards 16, result/profile/service/featured cards 18, panels 22, hero 24, pills full, xs chrome 6, small ctrl 8.

**Flat buttons:** no `shadow-*` / `drop-shadow-*` / inline `boxShadow` (except `shadow-none`).

**Rating stars:** brand orange (never gold/yellow).

**Naming:** "REPs" (not "REPs UK" except legacy/migration contexts).

**Phase 1 scope:** static high-fidelity screens only.

## Replacement table (apply globally to all docs)

| Outdated reference | Replace with |
| --- | --- |
| `#F28C38`, `#D87322` | `#FF7A00` / `#E96F00` / `#CC6200` (correct semantic token) |
| `--radius-2xl: 32px`, `28px`, `22px (button)`, `14px` | 9-step scale values above |
| `rounded-xl`, `rounded-2xl`, `rounded-3xl` | explicit `rounded-[Npx]` from scale |
| Button shadows described as required/default | "buttons are flat (`shadow-none`)" |
| Gold/yellow rating stars | brand orange rating stars |
| 16:9 crop filenames (`home_v1.png`, `search_v1.png`, `profile_v1.png`, etc.) | matching `reps_fullpage_*_v1.png` |
| The rejected 6-screen collage | locked full-page mock-ups |
| "REPs UK" outside legacy/migration sections | "REPs" |
| Phase 1 deliverables that include auth/DB/payments/AI/maps/search logic | move to "later phase", keep Phase 1 = static visuals only |

## Workflow

1. **Inventory** every Markdown file the user might consider docs:
   ```bash
   rg --files -g '*.md' -g '*.mdx' docs/ .lovable/ README.md 2>/dev/null
   ```
2. **Scan** for outdated references using the bundled script:
   ```bash
   # copy then run (knowledge:// scripts must be copied before exec)
   # code--copy knowledge://skill/reps-doc-sync/scripts/scan-docs.sh /tmp/scan-docs.sh
   # code--exec bash /tmp/scan-docs.sh
   ```
   The scan reports legacy hex, banned radii, banned Tailwind radius classes, archived mock-up filenames, gold-star references, and "REPs UK" stragglers — file + line for each.
3. **Patch** each hit using the replacement table above. Prefer surgical `line_replace` edits over full rewrites.
4. **Re-assert** the lock in `docs/00_README.md`:
   - "Mock-ups in `src/mockups/` override all written guidance."
   - "Phase 1 = static high-fidelity screens only."
   - List the six locked mock-up filenames.
5. **Re-scan** until the audit script exits clean.
6. **Change report** in the final reply, with these five sections:
   1. Documents checked
   2. Documents updated
   3. Outdated references replaced (counts + examples)
   4. Remaining conflicts (if any)
   5. Confirmation that docs now match the locked mock-ups, orange system, and radius system

## Files in this skill

- `SKILL.md` — this file
- `scripts/scan-docs.sh` — docs-only scanner (Markdown files), reports violations with file + line
- `references/replacements.md` — the full replacement table in copy-pasteable form
