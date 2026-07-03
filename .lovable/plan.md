## Problem

The `WebsiteContentEditor` component currently renders panels in this order:
1. Where I train (`WhereITrainPanel`)
2. Client results intro
3. Foundation Method · How I coach
4. Client transformations
5. Client result quotes
6. FAQs

Because `WebsiteContentEditor` sits directly below `ServicesEditor` (Coaching plans), the user sees "Where I train" immediately after Coaching plans. The "Foundation Method · How I coach" section is buried two panels down, making it feel like it's not below Coaching plans at all.

## Plan

Reorder the panels inside the `WebsiteContentEditor` component so that **"Foundation Method · How I coach" renders first**, followed by the remaining panels in a sensible order.

### Proposed new order inside `WebsiteContentEditor`:
1. **Foundation Method · How I coach** (moved to top)
2. Client results intro
3. Where I train (`WhereITrainPanel`)
4. Client transformations
5. Client result quotes
6. FAQs

This keeps all panels within `WebsiteContentEditor` (no state extraction needed) while ensuring the section the user cares about is the very next thing visible after Coaching plans.

## Scope
- Single file: `src/routes/_authenticated/_professional/dashboard_.website.tsx`
- Reorder JSX blocks inside `WebsiteContentEditor`'s return statement
- No logic changes, no prop drilling, no new components
- Preserve all existing handlers and state wiring