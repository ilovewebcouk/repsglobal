# BD Migration — Dry Run v7 (APPROVED, LOCKED)

**Status:** ✅ Approved for launch
**Approved by:** Scott
**Approved on:** 2026-06-19
**Launch window:** 26 June 2026, 00:00 BST — live production only, after final Stripe/live-environment confirmation
**Artifact:** `/mnt/documents/bd_migration_dry_run_v7.csv`

## Locked cohort totals

| Cohort | Count | Per-member | Subtotal |
|---|---:|---:|---:|
| honour_window | 6 | £34 | £204 |
| anomaly_launch_charge | 1 | £99 | £99 |
| future_due | 383 | £0 | £0 |
| manual_review | 0 | — | £0 |
| blocked | 0 | — | £0 |
| **Total** | **390** | | **£303** |

## Locked rules

- No long-overdue cohort exists.
- No lifetime cohort exists.
- No renewable £34 subscriptions are created. Honour-window path is a one-off £34 charge plus a Stripe schedule to switch to £99/yr on the next anniversary.
- Pro tier is never created during migration.
- BD join date is the renewal anniversary anchor; +12 months is rolled until on or after 14 June 2026.

## Honour-window members (6 × £34 = £204)

| BD ID | Name | Email | BD join | bd_next_due | Source |
|---:|---|---|---|---|---|
| 632 | Rich Mcwatt | richmcwatt@netscape.net | 2024-06-14 | 2026-06-14 | computed |
| 905 | Callum Wolvey | c.wolvey@btinternet.com | 2025-06-17 | 2026-06-17 | computed |
| — | Jane Walker | walker_jane2@icloud.com | 2025-06-17 | 2026-06-17 | computed |
| — | Rebecca White | bex_white123@hotmail.co.uk | 2023-06-21 | 2026-06-21 | computed |
| — | Chris Read | readchris11@gmail.com | 2024-06-25 | 2026-06-25 | computed |
| 480 | Parnita Senjit | parnita.senjit@gmail.com | 2023-06-05 | 2026-06-21 | **manual billing-anchor override** |

## Anomaly launch charge (1 × £99 = £99)

| BD ID | Name | Email | Reason |
|---:|---|---|---|
| 705 | Raheela Khalid | raheelakhalid@inhandcommunitycare.com | Scott-confirmed: missing/unclear renewal history → charge £99, move to REPs Verified annual |

## Held resolutions

- Joanna Forbes (BD 759) — `future_due`, canonical Stripe customer `cus_RCPbzmBwTUKS9z`. No launch charge.
- Sophia Smith (BD 908) — `future_due`, corrected email `sophia@sophiasmithfitness.com`. No launch charge.

## Guarantees from this dry run

No Stripe customers, subscriptions, invoices, schedules, invoice items or charges were created. All changes are DB-only updates to `bd_member_seed` migration override columns.

## Launch execution gate

Live launch-day billing MUST NOT run until:

1. The date/time is 26 June 2026, 00:00 BST or later.
2. Environment is live production (live Stripe keys, not test).
3. Scott has given final go/no-go confirmation against this v7 logic.
