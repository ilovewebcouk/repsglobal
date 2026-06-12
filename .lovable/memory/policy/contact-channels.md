---
name: Contact channels policy
description: Phone is internal-only; all comms route through the platform; SMS Phase 3 transactional only; WhatsApp out of scope.
type: feature
---
**LOCKED 2026-06-12.**

- `professionals.contact_phone` is **internal-only**. Never render on any public route (`/pro/$slug`, `/c/$slug`, `/in/$location`, `/pro/$slug/enquire`, FeaturedProCard, search cards, OG/meta, JSON-LD). Never select in `public-profile.functions.ts`.
- Stored as **E.164** (`+[country][subscriber]`, regex `^\+[1-9]\d{6,14}$`). DB check constraint `professionals_contact_phone_e164_chk` enforces this.
- Required at profile activation. Field uses `src/components/forms/PhoneField.tsx` (built on `react-phone-number-input`, default country GB, shadcn Select for country picker).
- **All client ↔ pro communication goes through the platform** — in-app messages + email notifications (existing pgmq queue infra). No public phone, no public email-as-primary-CTA, no `wa.me` / WhatsApp deep-links anywhere.
- **SMS** = Phase 3, transactional only (booking confirmed / session reminder via Twilio). Never free-form chat over SMS.
- **WhatsApp Business API** = out of scope. Do not add.
- Phone OTP / 2FA via Supabase phone auth = future, not in Phase 2.
