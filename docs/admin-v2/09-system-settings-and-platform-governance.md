# REPS Admin v2
## Part IX — System, Settings & Platform Governance

**Document:** 09  
**Status:** Draft specification for approval  
**Audience:** Founder, engineering, operations, security, Lovable implementation agent  
**Scope:** Team, Settings, roles, permissions, impersonation, audit logs, feature flags, GDPR, retention, migration governance  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

System pages are dangerous because they often look simple but control important platform behaviour.

Admin v2 separates configuration, governance and operations. Settings is not a place for broken forms or fake integration status. Team management must be explicit. Audit logs must be available. Impersonation must be visible. GDPR retention must be documented.

The System section is small by design.

---

## 1. System Navigation

```text
System
  Team
  Settings
```

Related operational tools live elsewhere:

- Platform Health lives in Operations.
- Webhook Recovery lives in Operations.
- Migration lives in Operations.
- Reconciliation lives in Revenue.

---

## 2. Team Page

### Route

```text
/admin/team
```

### Purpose

Manage admin access.

### Required capabilities

- list admins,
- grant admin by email,
- invite new admin,
- revoke admin,
- block self-revoke,
- show last login,
- show pending invites,
- audit every change.

### Required columns

- name,
- email,
- role,
- granted by,
- granted at,
- last login,
- status,
- actions.

### Revocation

Revoke requires confirmation.

Self-revoke is blocked.

---

## 3. Settings Page

### Route

```text
/admin/settings
```

### Purpose

Manage platform configuration.

### Rule

If a setting is not editable, it must not present an active Edit button.

Bad:

```text
Edit
```

with no action.

Good:

```text
Read-only
```

or

```text
Coming soon
```

### Settings groups

- General
- Branding
- Email
- Integrations
- Feature Flags
- Maintenance
- Audit Log

Tabs must switch content. If tabs are not ready, show all sections scrollably or disable unavailable tabs.

---

## 4. Feature Flags

Feature flags must be real or clearly marked.

A feature flag row should show:

- key,
- description,
- current value,
- scope,
- last changed by,
- last changed at,
- audit link.

Changing a flag requires confirmation if it affects production users.

---

## 5. Integrations

Integration status must be live where possible.

Examples:

- Stripe
- Mail provider
- Supabase Storage
- Google APIs
- AI providers

Settings may link to Ops Platform Health for live connectivity.

Do not hardcode "Connected" without checking.

---

## 6. Maintenance Tools

Maintenance tools must be visually separated from settings.

Examples:

- backfill location data,
- sweep orphan subscriptions,
- run safe reindex,
- refresh cache.

Every maintenance action must show:

- what it does,
- whether it writes data,
- estimated scope,
- confirmation if destructive,
- audit log entry,
- result summary.

---

## 7. Audit Log

The audit log records admin actions.

It should be searchable and filterable by:

- actor,
- action,
- target kind,
- target id,
- date range,
- severity.

Each row should show:

- actor,
- action,
- target,
- before/after summary,
- timestamp,
- IP/device where available.

Audit log retention must be documented.

---

## 8. Impersonation

Impersonation is a powerful support tool and must be obvious.

Requirements:

- global impersonation banner,
- target user shown,
- actor shown,
- stop impersonation button,
- audit log entry,
- no destructive admin actions while impersonating unless explicitly allowed,
- clear visual separation.

Every admin page must render the impersonation banner.

---

## 9. Permissions

All admin pages require admin role.

Role checks must be server-enforced, not only client-side.

Public callable RPCs must be deliberate and documented.

Security-definer functions must have:

- restricted grants where possible,
- explicit `search_path`,
- comments explaining why definer is required.

---

## 10. GDPR and Retention

Account deletion must handle:

- auth user,
- profiles,
- professionals,
- subscriptions,
- payment records,
- payment events,
- legacy links,
- BD seed data,
- storage objects,
- email logs,
- audit logs,
- analytics events.

Some records are retained for legal/accounting purposes. Retention must be documented.

### Retention documentation required

- admin_audit_log,
- email_send_log,
- payment_events,
- Stripe IDs,
- support tickets,
- verification records.

The admin should link to the retention policy from Settings.

---

## 11. Migration Governance

Migration tools are operational, not permanent system features.

Migration pages must show:

- migration status,
- remaining rows,
- last run,
- errors,
- safe dry-run,
- destructive action confirmations,
- audit history.

The migration section should be removed or archived once migration is complete.

---

## 12. No Dead Controls

System pages have a stricter rule:

> If it looks like it changes production, it must either work or be disabled.

No dead Edit buttons.
No inactive toggles.
No fake integration status.
No fake settings rows.

---

## 13. Acceptance Criteria

System & Platform Governance is complete when:

- admin access is manageable and auditable,
- settings are either functional or honestly disabled,
- maintenance actions are safe and audited,
- impersonation is visible everywhere,
- retention policy is documented,
- dangerous actions require confirmation,
- no system page displays fake controls or fake statuses.
