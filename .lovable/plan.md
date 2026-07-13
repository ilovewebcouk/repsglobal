## Goal
Establish exactly why the Lovable email preview UI is still showing `502 Bad Gateway`, fix the root cause, and only mark it complete after visual proof.

## What I know so far
- The sending domain is verified.
- The backend email preview routes are receiving dashboard preview requests and returning `200` in server logs.
- Your browser screenshot still shows `GET https://lovable.dev/api/email-preview?... 502`, so the failing layer is the Lovable dashboard preview proxy or the shape/content it receives from the app preview endpoint.
- I will not call this fixed until I can capture a screenshot showing the email preview loading successfully.

## QA and audit plan

1. **Map the full preview chain**
   - Identify which app endpoint the dashboard proxy is calling for auth email previews and app email previews.
   - Confirm the exact request method, content type, response size, and payload shape each endpoint returns.
   - Compare that against what the Lovable dashboard preview proxy appears to expect.

2. **Audit server responses, not just status codes**
   - Test every email preview route locally and through the deployed preview URL.
   - Confirm whether the response is valid JSON for list endpoints and valid standalone HTML for rendered email previews.
   - Check whether any route is returning the normal app shell by mistake.
   - Check whether the full all-template preview payload is too large or malformed for the proxy.

3. **Audit every template render**
   - Render all registered app email templates one by one.
   - Render all auth email templates one by one.
   - Capture template name, render status, subject, HTML byte size, and any error.
   - Fix any template that fails, returns invalid output, or has missing/unsafe preview data.

4. **Make the preview endpoints proxy-friendly**
   - Add stricter request parsing for likely dashboard parameters such as template name/type.
   - Return small, predictable responses where possible.
   - Ensure unsupported methods/unknown templates return clear JSON errors, not the app page.
   - Add safe diagnostic logging around preview requests so future 502s show which template or payload failed.

5. **Re-test delivery health separately**
   - Query recent email logs using the deduplicated latest-status rule.
   - Confirm whether actual email sending is failing or whether the issue is isolated to dashboard preview loading.
   - Summarize any dead-letter/backlog issue separately from preview rendering.

6. **Visual verification before saying fixed**
   - Use browser automation to open the relevant preview/dashboard page where possible.
   - Capture screenshots of:
     - a rendered auth email preview,
     - a rendered app email preview,
     - and any preview list/picker if accessible.
   - Inspect the screenshot before reporting completion.
   - If the Lovable dashboard frame itself is not accessible from automation, I will still capture screenshots of the exact app preview endpoints and clearly state that the remaining `lovable.dev/api/email-preview` proxy error is outside the app route if it persists despite valid endpoint screenshots.

## Technical details
- Files likely involved:
  - `src/routes/lovable/email/auth/preview.ts`
  - `src/routes/lovable/email/transactional/preview.ts`
  - `src/routes/lovable/email/auth/webhook.ts`
  - `src/routes/lovable/email/transactional/send.ts`
  - `src/lib/email-templates/registry.ts`
  - individual templates under `src/lib/email-templates/**`
- Signals to use:
  - email domain health
  - server route logs
  - endpoint response bodies
  - template render audit output
  - browser screenshots

## Acceptance criteria
- No template render failures in the audit.
- Preview endpoints return valid expected content, not the app shell.
- The browser screenshot shows the preview content loaded.
- If the external Lovable preview proxy still returns 502 while app endpoints are proven healthy, the final report will separate app-side status from platform-proxy status instead of claiming it is fixed.