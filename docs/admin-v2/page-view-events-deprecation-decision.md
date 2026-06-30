# page_view_events Deprecation Decision

**Status:** Accepted — 2026-06-30
**Action:** **Freeze writes, retain table, no hard delete.**
**Owner:** Platform / Admin v2
**Related:** `docs/admin-v2/activity-architecture-decision.md`, `docs/privacy/public-analytics-v1-1-plan.md`

## Tables in scope of this audit

| Table | Decision | Rationale |
| --- | --- | --- |
| `page_view_events` | **Freeze writes** (no writer in current code; mark deprecated) | Anonymous event shape; never gated by consent; replaced by `member_session_events` for logged-in users and by future v1.1 capture for anonymous users |
| `profile_view_events` | **Keep — operational** | Read by professional-facing analytics ("X people viewed your profile this week"); no replacement until v1.1 |
| `search_appearance_events` | **Keep — operational** | Read by search-impression metrics; no replacement until v1.1 |
| `lead_activity` | **Keep — business** | Lead/CRM signal; not analytics |
| `enquiries` | **Keep — business** | Core business table |

## `page_view_events` — full audit

### Schema today

```
id uuid pk
user_id uuid (nullable, fk auth.users)
anon_id uuid NOT NULL
session_id uuid (nullable, fk user_sessions)
path text NOT NULL
referrer text
ip_hash text
user_agent text
country_code text
city text                ← removed in v1 migration
device / browser / os text
is_admin_view boolean NOT NULL default false
created_at timestamptz NOT NULL default now()
```

RLS: admin SELECT only. No INSERT/UPDATE/DELETE policies.

### Writers (audit result)

`rg "page_view_events" src/ ` → matches only in `src/integrations/supabase/types.ts`.

There is **no application code path that inserts into `page_view_events`**. Any historic rows came from a previous experimental beacon that has since been removed. The table is effectively cold.

### Readers (audit result)

Same audit: no `select(...).from("page_view_events")`, no `from('page_view_events')`, no RPC. The table is **read by nothing in the application today**.

### Is the data trustworthy?

No. It is a mixture of:

- Historic anonymous beacon writes from a previous experiment.
- Admin-self traffic (`is_admin_view = true`).
- No consent banner was live when these were captured.

We cannot represent the historic rows in product analytics or report on them publicly. They are not a reliable record of customer behaviour.

### Did capture happen without consent?

Yes — the historic rows pre-date any consent banner. This is one of the main reasons v1 explicitly does **not** turn this back on.

### Freeze / archive / export decision

- **Freeze writes:** no current writer; we add a `COMMENT ON TABLE` marking it deprecated and a CI lint that fails any new `from("page_view_events").insert(...)` call so a regression cannot reintroduce silent capture.
- **Retain table:** allows admins to inspect historic rows during the v1.1 design phase.
- **No export:** rows are low-trust; exporting them externally would imply they are usable analytics, which they are not.
- **No hard delete:** drop is reversible only via backup; we prefer to keep the table behind RLS and revisit in 90 days.

### What replaces it

| Audience | Replacement | Status |
| --- | --- | --- |
| Logged-in member traffic | `member_session_events` + `user_sessions` | **Shipped in v1** |
| Anonymous public traffic | v1.1 capture (PostHog-hybrid, gated by consent) | **Designed in v1, not enabled** |

### Rollback

If, in the next 90 days, we find a hidden reader or auditor that requires `page_view_events` writes again:

1. Re-enable writes by removing the lint rule.
2. Re-introduce a writer behind the consent banner that is being designed for v1.1 — never re-introduce silent capture.
3. Document the decision in a follow-up ADR.

## `profile_view_events`, `search_appearance_events`, `lead_activity`, `enquiries`

These are **operational** tables (member-facing analytics + business CRM) and remain unchanged. They are unioned into `getActivityFeed` as data sources, not deprecated.

If v1.1 anonymous analytics lands via PostHog (recommended), we may **also** stop writing anonymous-only rows into `profile_view_events` and `search_appearance_events` and rely on PostHog for the anonymous slice — but that is a v1.1 decision and not in scope here.
