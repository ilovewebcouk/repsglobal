## Clean up Member 360 header

Strip the noise. Match the professionals list exactly.

**Remove:**
- "Matches professionals list" consistency badge row (entire amber/green block under the pills)
- `ConsistencyBadge` component + `verifyMemberMatchesProfessionalsRow` call from header
- (Keep the server fn file for now, just unwire from UI)

**Header pills become exactly three + profession:**
1. **Profession** (e.g. "Personal trainer") — muted text next to email, not a pill
2. **Tier pill** — "Core" (orange)
3. **Trial pill** — "Trial · 324d left" (only if trialing), styled same as professionals list
4. **Status pill** — "Active" / "Past due" / "Canceled" etc.

Renewal date moves out of the pill row into the Billing tab only (where it already lives). No "Scheduled Core renewal" pill in the header.

**Files:**
- `src/routes/admin_.members.$userId.tsx` — remove ConsistencyBadge render + import; rewrite pill row to render Profession (text) + Core + Trial (conditional) + Status, mirroring the chip styles used in `src/routes/admin_.professionals.tsx`
