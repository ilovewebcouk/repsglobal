# Public Analytics v1 — Banner Copy Approval Pack

Status: **Awaiting legal/user approval.** No capture until this pack is signed off and `VITE_POSTHOG_PUBLIC_KEY` is set.

All copy below is the exact string proposed for production. Placeholders are wrapped in `{}`; nothing else should be edited without a re-review.

---

## 1. Cookie banner — collapsed / default state

**Location:** fixed bottom bar on every public surface (not admin/dashboard/portal/auth).
**Component:** `src/components/consent/CookieBanner.tsx`.

**Heading**

> Cookies on REPS

**Body**

> We use essential cookies to make REPS work, and — if you agree — anonymous analytics cookies to understand which pages help pros and clients most. No advertising cookies. [Learn more](/cookies).

**Buttons (left → right)**

- `Customise` — opens the preferences sheet (§2).
- `Reject non-essential` — records rejection, closes banner.
- `Accept all` — enables analytics, closes banner.

**Behaviour**

- Never shown on `/admin`, `/dashboard`, `/portal`, `/auth`, `/api`, `/lovable/`.
- Auto-rejected (no banner shown) when DNT or GPC is on.
- Dismissed state remembered for 12 months via first-party cookie `reps.consent.v1`.

---

## 2. Customise / preferences sheet

**Title**

> Cookie preferences

**Description**

> Choose what you're happy for REPS to store on your device. You can change this any time from the footer.

**Row — Essential**

- Label: **Essential**
- Body: *Sign-in, security, and preferences. Required for REPS to work.*
- Control: **Always on** status pill (not a toggle).

**Row — Analytics**

- Label: **Analytics**
- Body: *Anonymous, aggregate usage via our first-party proxy to PostHog (EU). Never shared with advertisers.*
- Control: switch, off by default.

**Footer buttons**

- `Cancel` — close without saving.
- `Save preferences` — persist choice, close both sheets.

---

## 3. Manage preferences link (footer)

Placed in the site footer alongside legal links.

> Cookie preferences

Clicking dispatches `reps:open-cookie-preferences` to reopen the banner.

---

## 4. Privacy notice amendment

Add the following section to `/privacy` under a new heading **"Website analytics (PostHog EU)"**.

> If you accept analytics cookies, REPS uses PostHog — hosted in the EU — to understand how visitors use our public website. This helps us improve pages that connect clients to the right professionals.
>
> - Analytics is optional. It is off until you accept.
> - We route all analytics through our own domain (`repsuk.org/_a`) and strip your IP address before it reaches PostHog. Your country is derived from a network-level header only.
> - We do not use analytics cookies for advertising, and we never sell your data.
> - We honour Do Not Track and Global Privacy Control signals — if either is on, we do not capture analytics regardless of your cookie choice.
> - You can withdraw consent at any time from the "Cookie preferences" link in the footer. Withdrawing consent immediately stops capture and clears PostHog cookies from your device.
>
> Lawful basis: consent (UK GDPR Art. 6(1)(a)) and PECR reg. 6.

---

## 5. Cookie policy amendment

Add to `/cookies` under **"Analytics cookies"**.

| Cookie | Provider | Purpose | Duration |
| --- | --- | --- | --- |
| `ph_*` | PostHog (EU), routed via `repsuk.org/_a` | Anonymous usage analytics (page views, referrers, enquiry conversions). No IP stored. | Up to 12 months |
| `reps.consent.v1` | REPS (essential) | Remembers your cookie choice. | 12 months |
| `reps.public.session_id` | REPS (essential, session) | Groups a single visit for analytics rollups (only used if analytics accepted). | Until browser tab closes |

Add note:

> Essential cookies are always active because REPS will not function without them. Analytics cookies are set only after you accept, and never if your browser sends Do Not Track or Global Privacy Control.

---

## 6. Copy guarantees (what this pack promises the user)

- Analytics is **optional**.
- Analytics is **off until accepted**.
- REPS uses **PostHog EU** for public website analytics.
- Analytics helps us understand **profile views, searches, referrers, and enquiries**.
- **Essential cookies are separate** from analytics.
- Users can **reject and still use the site**.
- Users can **change preferences later** via the footer link.
- **DNT/GPC is respected** and overrides any accept choice.

---

## Sign-off checklist

- [ ] Legal review of §4 and §5.
- [ ] Product review of §1 and §2.
- [ ] Confirmation that `VITE_POSTHOG_PUBLIC_KEY` is set in Project Settings.
- [ ] Once approved: run activation QA scenarios and append results to `docs/admin-v2/public-analytics-v1-activation-report.md`.
