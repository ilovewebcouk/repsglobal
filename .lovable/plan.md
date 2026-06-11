# Correct the Verified dashboard implementation

## Honest diagnosis

The live `/dashboard` is not the dashboard we agreed to build. The previous implementation reused the new sidebar shell, but replaced the main full mock-up composition with a simplified membership/onboarding status page and four generic “Pro preview” placeholders.

That is why it feels like the old onboarding dashboard. The locked professional dashboard still exists in `/dashboard-demo` and `src/mockups/reps_fullpage_professional_dashboard_v1.png`, but its actual KPI, schedule, AI command, client, lead, activity, CPD and task panels were not carried into the authenticated `/dashboard` route.

This was an implementation miss, not an intentional Verified-tier design decision.

## Implementation plan

1. **Restore the locked dashboard composition**
   - Use the full-page professional dashboard mock-up and `/dashboard-demo` as the visual source of truth.
   - Move the complete dashboard panel composition into the authenticated `/dashboard` route rather than showing generic preview blocks.
   - Preserve the existing responsive `ProShell`, real member identity and mobile navigation.

2. **Apply truthful Verified-tier states**
   - Keep real Verified data visible: membership, verification, listing status, profile details and renewal state.
   - Render every Pro module in its proper mock-up position, but place a clear locked treatment over its contents with a concise Pro-tier explanation and upgrade action.
   - Do not invent live metrics for Verified users; static preview values should be visibly presented as previews, not account data.

3. **Keep onboarding as an overlay only**
   - Retain the four-step onboarding `Dialog`, auto-opening only for incomplete setup and remaining dismissible for the session.
   - Remove onboarding/status content from dominating the dashboard body.
   - Keep the small “Finish setup · X/4” control in the header for incomplete accounts.

4. **Preserve access controls**
   - Verified users stay on `/dashboard` and see locked Pro modules.
   - Direct visits to Pro-only module routes continue redirecting to `/dashboard/start`.
   - Admins continue redirecting from `/dashboard` to `/admin`.

5. **Validate both account states**
   - Check the fully completed Verified demo account against the locked mock-up.
   - Check the fresh professional account to confirm the onboarding dialog appears over the same real dashboard shell.
   - Verify desktop and mobile layouts, module locks, upgrade links and role redirects.