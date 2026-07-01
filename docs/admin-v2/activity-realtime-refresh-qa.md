# Activity Realtime Refresh QA

Source: `src/routes/admin_.activity.tsx` (lines 110–121).

## Panel refresh intervals

| Panel | Query key | Interval | Auto-refresh? |
|---|---|---|---|
| Realtime summary | `a-realtime` | **10 s** | ✅ |
| KPI strip | `a-kpis` | 30 s | ✅ |
| Online Now | `a-online` | 15 s | ✅ |
| Current Pages | `a-current` | 20 s | ✅ |
| Top Member Pages | `a-top` | 60 s | ✅ |
| Geo / Map | `a-geo` | 30 s | ✅ |
| Needs Attention | `a-attention` | 30 s | ✅ |
| Recent Activity feed | `a-feed` | 20 s | ✅ |

All panels auto-refresh — the manual **Refresh** button in the header is
technically redundant.

## Answers

- Auto-refresh: **yes**, per table above.
- Tab-hidden pausing: ⚠️ Not explicit. React Query defaults
  (`refetchOnWindowFocus: true`) mean queries refetch on focus, and
  `refetchInterval` **does** pause when the tab is hidden because
  `refetchIntervalInBackground` defaults to `false`. So pausing works
  by default; no manual visibility handling needed.
- Manual refresh still needed: **No** for normal use.
- Should the button be removed? **No — relabel to "Refresh now"** and keep
  as an escape hatch (users like the affordance; QA needs it).
- Live status indicator: **Not implemented**. Recommend adding.
- Degraded / offline state: **Not implemented** — a failed poll silently
  fails. Recommend a small "Last update failed — retrying" chip.

## Recommendations (not yet implemented — QA phase only)

1. Rename **Refresh → Refresh now** with a small clock icon.
2. Add `Live · updated Xs ago` badge next to the Refresh button, driven by
   `realtimeQ.dataUpdatedAt`.
3. Add `Reconnecting…` / `Offline` chip when `realtimeQ.status === "error"`
   for > 30 s.
4. Consider dropping the interval on `a-realtime` to 5 s if backend load
   allows (currently 10 s is fine).

## Verdict

Auto-refresh is correctly implemented. The perception of "the page feels
static" is because — as of 2026-07-01 — there are **0 rows in
`member_session_events`** to refresh from (see freshness audit). Fix the
capture pipeline first; realtime will animate itself.
