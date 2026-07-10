## Unify the level badge on the qualifications list

Right now the two row types on `/dashboard/qualifications` render the level pill differently:

- **Ofqual row** (`RegulatedRow`, line ~368): orange badge, text comes from the Ofqual snapshot so it reads "Level 4".
- **REPS course row** (`CpdRow`, line ~518): neutral white/5 badge with text "L4".

They should match.

### Change
In `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx`, update the REPS course row's level badge to match the Ofqual style:

```tsx
{level != null ? (
  <Badge className="border-reps-orange/30 bg-reps-orange-soft text-reps-orange">
    Level {level}
  </Badge>
) : null}
```

That gives both rows the same orange pill and the same "Level N" wording.

### Out of scope
No other row styling, no changes to the Ofqual row, no changes to the REPS logo tile from the previous turn.