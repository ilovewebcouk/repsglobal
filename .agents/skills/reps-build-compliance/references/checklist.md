# REPs compliance checklist (paste into reply)

- Mock-up referenced: `src/mockups/reps_fullpage_<name>_v1.png`
- Tokens used: `--brand-orange` / `--brand-orange-hover` / `--brand-orange-pressed` (no raw hex in components)
- Radii used: from {6, 8, 10, 12, 16, 18, 22, 24, 999} — buttons 10, inputs 12, cards 16/18, panels 22, hero 24
- Buttons: flat (`shadow-none`, no drop-shadow)
- Rating stars: brand orange (never gold/yellow)
- Phase 1 scope respected: no auth / DB / payments / AI / maps / BD migration
- `bash scripts/audit.sh` → PASS
