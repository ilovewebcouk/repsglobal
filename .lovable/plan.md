## Problem

The hero chip on `/dashboard/verification` always reads **"Identity verified"** and **"Domain confirmed"**, regardless of whether those checks have actually passed. Only the dot colour changes (grey vs emerald). Meanwhile the section below correctly says **"Start ID check"** because identity isn't done. Same story for domain.

That's why the two areas contradict each other — the chip label is a fixed string that describes the *earned* state, not the current state.

For Diverse Trainers (`11111111-…0002`):
- `professionals.identity_status = 'unverified'`, no `identity_documents` row → `t.ticks.identity = false`
- no `provider_domain_verifications` row → `d.status = 'unstarted'` → `domainDone = false`

So both chips are correctly *not earned* (grey dot), but the text still reads "Identity verified / Domain confirmed", which is misleading.

## Fix

In `src/components/dashboard/organisation/VerificationPage.tsx` (Hero component, lines 197–200), make the chip label reflect actual state:

- Identity chip: `"Identity verified"` when `identityDone`, else `"Identity — not started"` (or `"Identity — in review"` when `t?.identity.status === 'pending'`).
- Domain chip: `"Domain confirmed"` when `domainDone`, `"Domain — in review"` when `domainStatus === 'pending_admin_review'`, `"Domain — email sent"` when `'email_sent'`, else `"Domain — not started"`.

Pass `identityStatus` (from `t?.identity.status`) into `Hero` alongside `domainStatus` so the chip can pick the right label. `LayerChip` stays visually identical; only its `label` prop changes.

No DB / server changes. No copy elsewhere changes. This is a pure UI label fix so the hero, section, and badge tier all tell the same story.
