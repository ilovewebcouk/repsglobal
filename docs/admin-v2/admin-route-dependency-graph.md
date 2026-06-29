# Admin Route → Server Fn → Data Dependency Graph

_Auto-generated 2026-06-29 as part of the Phase 1 read-only audit._

```mermaid
graph LR
  subgraph Routes
    A1[/admin Overview/]
    A2[/admin/professionals/]
    A3[/admin/members/$id Member 360/]
    A4[/admin/billing/]
    A5[/admin/ops + sub-pages/]
    A6[/admin/verification/]
    A7[/admin/reviews/]
    A8[/admin/support/]
    A9[/admin/directory/]
    A10[/admin/campaigns/]
    A11[/admin/settings/]
    A12[/admin/cpd · gyms · team/]
  end

  subgraph "Server fns (canonical)"
    S1[overview.functions.getAdminOverview]
    S2[professionals.functions.*]
    S3[member360.functions.getMember360]
    S4[subscription-resolver.server resolveSubscriptionStateForUser]
    S5[member-stripe-sync.server resyncUserFromStripe]
    S6[billing-console/list.functions.*]
    S7[billing-actions.functions cancelAndDeleteMember]
    S8[resync-stripe.functions.resyncStripeMirror]
    S9[ops/operations.functions.*]
    S10[ops/timeline.functions.getMemberTimeline]
    S11[reviews.functions.*]
    S12[verification.functions.*]
    S13[support/tickets.functions.*]
  end

  subgraph "BD / legacy (to archive)"
    L1[bd-migration · bd-seed · bd-photos]
    L2[stripe-linking · webhook-recovery · webhook-replay]
    L3[reconciliation.functions · memberships.functions]
    L4[convert-legacy.server · setup-link.server]
    L5[(bd_member_seed)]
    L6[(legacy_stripe_link · legacy_stripe_payments)]
  end

  subgraph "Stripe live"
    P1[(subscriptions API)]
    P2[(invoices · charges)]
    P3[(disputes · refunds)]
    P4[Webhook: /api/public/payments/webhook]
  end

  subgraph "Supabase mirrors"
    D1[(subscriptions)]
    D2[(payment_events)]
    D3[(disputes)]
    D4[(professionals · profiles · user_roles)]
  end

  A1 --> S1 --> D1 & D2 & D4
  S1 -.reads.-> L5
  A2 --> S2 --> D4 & D1
  A3 --> S3 --> S4 --> D1
  S3 --> S5 --> P1
  S5 -.reads.-> L5
  A3 --> S7 --> P1 & D1 & D4
  A4 --> S6 --> D1 & D2 & D3
  A4 --> S8 --> P1
  A5 --> S9 --> D1 & D2 & D3
  A5 -.uses.-> L1 & L2 & L4
  A6 --> S12 --> D4
  A7 --> S11
  A8 --> S13
  A8 -.dup.-> S7
  P4 --> D1 & D2 & D3

  classDef legacy fill:#3b1212,stroke:#a33,color:#fdd;
  class L1,L2,L3,L4,L5,L6 legacy;
```

## Key

- **Solid arrow** — active read/write today.
- **Dotted arrow** — read-only safety-net (kept for now) or duplicate path.
- **Red boxes** — Brilliant/BD/legacy modules to archive in Phase 7.

## Hot spots

1. `S3 (getMember360)` and `S5 (resyncUserFromStripe)` both dip into `bd_member_seed` to discover Stripe customer ids. That read is acceptable safety-net behaviour and can stay until Phase 7 confirms every active subscription is reachable from `subscriptions.stripe_customer_id` alone.
2. `A5 (/admin/ops/billing)` is the heaviest concentration of legacy cards: `BdRailSwapCard`, `BdSetupLinkCard`, `PriceIdBackfillCard`. They are read-or-trigger-only — none of them are required for steady-state operations.
3. `A8 → S7` (support `MemberCancelCard` calling `cancelAndDeleteMember`) duplicates `A3 → S7`. Phase 6 collapses both into a single Member 360 Danger Zone path.
4. `S9` (ops billing health) overlaps with `S6` (billing console KPIs). The console is the canonical surface; the ops health tiles should be folded into the console or a slimmed Operations hub.
