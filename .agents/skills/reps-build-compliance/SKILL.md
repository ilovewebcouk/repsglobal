---
name: reps-build-compliance
description: Validate any new or modified REPs screen, component, or PR against the locked source of truth — brand orange tokens (#FF7A00 family), 9-step radius system (6/8/10/12/16/18/22/24/999), flat-button rule (no shadows on buttons), and the six full-page mock-ups in src/mockups/. Trigger whenever the user asks to build, edit, audit, refactor, or review any UI in the REPs project, or before claiming a screen is "done".
---

# REPs Build Compliance

This skill is a **pre-flight + post-flight gate** for every UI change in the REPs project. Run it whenever you add or edit a component, route, or screen, and before telling the user the work is complete.

## 1. Source of truth (locked)

The visual truth lives in two places, in this priority:

1. **Mock-ups** — `src/mockups/reps_fullpage_*_v1.png` (6 files). These override all written guidance.
2. **Docs** — `docs/00_README.md` → `docs/06_*.md`. Use as written reference only when the mock-up is ambiguous.

Allowed mock-up filenames (anything else is archived / forbidden as a reference):

- `reps_fullpage_home_v1.png`
- `reps_fullpage_signup_login_v1.png`
- `reps_fullpage_directory_search_results_v1.png`
- `reps_fullpage_professional_profile_v1.png`
- `reps_fullpage_professional_dashboard_v1.png`
- `reps_fullpage_admin_dashboard_v1.png`

Never reference 16:9 crops (`home_v1.png`, `search_v1.png`, etc.), the 6-screen collage, or any other historical asset.

## 2. Token rules (must pass)

**Brand orange — only these hex values may appear, and only inside `src/styles.css` as token definitions. Components must use the semantic token, never the hex.**

| Token | Hex |
| --- | --- |
| `--brand-orange` | `#FF7A00` |
| `--brand-orange-hover` | `#E96F00` |
| `--brand-orange-pressed` | `#CC6200` |
| `--brand-orange-soft` | (soft tint, defined in styles.css) |
| `--brand-orange-border` | (border tint, defined in styles.css) |

**Forbidden anywhere in the repo:**
- `#F28C38`, `#D87322` (old brand orange — replaced)
- Hardcoded orange hex in `.tsx` / `.ts` components
- Rating stars in gold/yellow — stars must use brand orange

**Radius — 9-step scale only:**

| px | Use |
| --- | --- |
| 6 | xs chrome |
| 8 | small controls |
| 10 | **buttons** |
| 12 | **inputs** |
| 16 | standard cards |
| 18 | result / profile / service / featured cards |
| 22 | large panels |
| 24 | hero |
| 999 (full) | pills |

**Forbidden radii:** `14px`, `20px`, `28px`, `32px`, and the Tailwind classes `rounded-xl`, `rounded-2xl`, `rounded-3xl`. Use explicit `rounded-[Npx]` or a token class mapped in `styles.css`.

**Flat-button rule:** Buttons must have **no** `shadow-*` / `drop-shadow-*` / inline `boxShadow` (except `shadow-none`). Hover/focus may change color, border, or scale — never add a shadow.

## 3. Workflow

When the user asks for any UI work:

1. **Pre-flight (before editing):**
   - Identify which mock-up the change belongs to. If none of the six apply, stop and ask the user.
   - Re-read relevant tokens in `src/styles.css` so you reference them by name, not by hex.

2. **While editing:**
   - Use semantic token classes (e.g. `bg-brand-orange`, `text-brand-orange`), never raw hex.
   - Pick a radius from the 9-step table above based on the element role.
   - For buttons, explicitly include `shadow-none` if a parent variant might add a shadow.

3. **Post-flight (before responding "done"):**
   - Run the bundled audit script:
     ```bash
     bash knowledge://skill/reps-build-compliance/scripts/audit.sh
     ```
     Copy first if you need to execute it:
     ```bash
     # code--copy knowledge://skill/reps-build-compliance/scripts/audit.sh /tmp/audit.sh
     # code--exec bash /tmp/audit.sh
     ```
   - Audit must exit `0`. If it reports violations, fix them before replying.
   - In the reply, briefly state: mock-up referenced, tokens used, radii used, audit result.

## 4. Scope guardrail (Phase 1)

Phase 1 = **static high-fidelity screens only**. Reject (or push back on) requests during a compliance pass that try to add:

- Auth wiring, real sessions, RLS
- Database tables, migrations, Supabase queries
- Payments, bookings, AI, live maps
- Real search / filter logic beyond static data
- BD migration work

If the user's request implies any of the above, flag it explicitly and confirm before proceeding.

## 5. Files in this skill

- `SKILL.md` — this file
- `scripts/audit.sh` — repo scanner that fails on banned hex, banned radii, banned filenames, and button shadows
- `references/checklist.md` — short human-readable checklist to paste into a reply when handing a screen back to the user
