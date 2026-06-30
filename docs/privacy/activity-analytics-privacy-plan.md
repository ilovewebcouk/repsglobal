# Activity Analytics — Privacy Plan (v1, operational logging only)

**Status:** Accepted — 2026-06-30
**Scope:** Only the operational activity introduced by Admin Activity v1.
**Out of scope:** Anonymous/public visitor analytics — covered by `docs/privacy/public-analytics-v1-1-plan.md`.

## What is operational logging?

Logging required to **run** REPs safely and support members:

- Sign-in, sign-out, sign-in-failed, password-reset, email-confirmed
- Per-page session events for logged-in members (path, session id, last-seen heartbeat)
- Business events that already exist in REPs (payments, subscriptions, disputes, enquiries, reviews, support, verification, admin actions, email, churn)

Operational logging applies **only** to authenticated users. Unauthenticated visitors are not captured in v1.

## Lawful basis

- **Legitimate interest** (UK GDPR Art. 6(1)(f)) for security, fraud prevention, account support, and dispute response. Operational logs are the minimum we need to investigate a billing dispute, recover an account, or respond to a verification appeal.
- Auth events and session events are tied to an authenticated user who has accepted the REPs terms when creating an account; no additional consent banner is required for this minimum operational set.

## What is stored

| Field | Reason | Retained |
| --- | --- | --- |
| `user_id` | Map event to the member | 12 months (auth) / 90 days (sessions) |
| Event type & timestamp | Reconstruct lifecycle | as above |
| `ip_hash` (HMAC-SHA256 with rotating salt) | Detect repeated failed sign-ins, surface obvious anomalies | as above |
| `country_code` from `CF-IPCountry` | Anomaly detection only ("sign-in from a country the member has never used") | as above |
| `device / browser / os` (parsed from UA) | Anomaly detection, support context | as above |
| `path` (member-only) | Help support reproduce the member's journey | 90 days |

**Never stored:**

- Raw IP addresses. Only HMAC hashes with a server secret (`ACTIVITY_IP_SALT`).
- City-level geo.
- Query strings on paths.
- Form field contents.
- Anything from unauthenticated visitors.

## DNT / GPC

Where the client sends `DNT: 1` or `Sec-GPC: 1`, the per-page beacon downgrades to a session-start only (we still record the fact that a session existed for "who's online now") and skips path events. Auth events are not affected — they are required for security/audit.

## Admin impersonation

When an admin is actively impersonating a member, the beacon **does not fire**, and the capture endpoints **no-op**. Admin browsing on behalf of a member must never pollute the member's session trail. Admin-side activity is recorded in `admin_audit_log` and surfaced separately in the activity feed.

## Retention

| Table | Raw retention | After |
| --- | --- | --- |
| `auth_events` | 12 months | hard delete |
| `member_session_events` | 90 days | rolled into `metrics_monthly_activity`, then hard delete |
| `user_sessions` | 90 days from `ended_at` | hard delete |
| `metrics_monthly_activity` | indefinite, aggregate only | kept |
| `admin_audit_log`, `payment_events`, `disputes` | per existing billing/audit policy | unchanged |

A `pg_cron` job (`purge_activity_detail`, 03:40 UTC nightly) enforces retention. It is explicitly forbidden from deleting billing or audit records.

## Account deletion

When a member is hard-deleted via the canonical `cancelAndDeleteMember` path:

- `auth_events`, `member_session_events`, `user_sessions` rows: `user_id` is set to NULL via the existing `ON DELETE SET NULL` FK so we keep aggregate counts but lose member linkage. The rows themselves are subject to normal retention and disappear naturally.
- `admin_audit_log`, `payment_events`, `disputes`: kept (legal/billing/audit retention) — the `target_id`/`user_id` may be NULLed depending on the source table's existing FK rules.
- Aggregate counts in `metrics_monthly_activity` are not member-identifying and are retained.

## Member rights

- **Subject access:** the operational activity for a member is visible to admins in `/admin/members/<id>` (Sessions tab and Activity Timeline). On request we can export a member's auth events and session events to CSV for the 12/90 day retention windows.
- **Objection:** because the lawful basis is legitimate interest, members can object via support. We will balance the objection against the security/dispute justification on a per-case basis.
- **Erasure:** the hard-delete path above handles erasure within retention.

## What v1 does NOT do

- No anonymous/public visitor tracking.
- No persistent anonymous IDs.
- No cookie banner (operational logging is not classified as a cookie use here; the only client storage is a per-tab `sessionStorage` session id, which is short-lived and not used to track across visits).
- No third-party analytics scripts.
- No city-level location.
- No content of messages, form fields, or query strings.

Any of the above turning on requires the **public analytics v1.1 plan** to be approved first.
