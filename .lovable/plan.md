## Update `docs/07_phase1_build_status.md`

Two surgical edits in the "Public marketing" table — no other sections change.

### 1. Bump snapshot date

`> **Snapshot date:** 1 June 2026` → `> **Snapshot date:** 3 June 2026`

### 2. Replace the `/for-professionals` row and add `/features` rows

Replace the current single row:

```
| `/for-professionals` | Shipped | |
```

with:

```
| `/for-professionals` | Shipped (rebuilt) | Two-act narrative: Act 1 (the register) via `RegisterProof` + `ActIntro`, Act 2 (the operating system) via 8 `ProductBlock` stories covering Leads, Bookings & Payments, Clients CRM, AI Programme Builder, Nutrition (replaces MyFitnessPal), Check-ins, Messaging, Insights. Plus `ReplacesStrip` (six apps REPs replaces), `AICapabilities` tiles, and `CompetitorCompare` table with real Trainerize / MyPTHub / PT Distinction logos (`src/assets/logos/*.svg.asset.json`). |
| `/features` | Shipped | Hub page listing the 9 feature deep-dives from `feature-config.ts`, grouped by Visibility / Operations / Growth. |
| `/features/$slug` | Shipped | Per-feature deep-dive pages driven by `feature-config.ts` + `feature-content.tsx` via `FeaturePageLayout`. |
```

No other documents are touched in this pass. If you want me to also bring `03_reps_page_by_page_specification.md` and `06_reps_lovable_build_prompt_pack.md` in sync, say the word and I'll do that as a follow-up.
