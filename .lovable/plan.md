## Plan

I’ll make the Training Providers segment behave as the user expects: every training provider account is listed as a REPs member, even if they have not clicked their email link.

## What I already checked

- There are 24 training provider accounts in the backend.
- All 24 currently have unconfirmed email status, which is why the existing member-list filter hides them.
- All 24 have subscription records counted as active/billable.
- Their renewal date field is currently empty, so I will inspect and correct that if the existing import data has the renewal date elsewhere.

## Changes to make

1. Remove the “Invited” tab from Admin → Members.
2. Remove the special backend tab/filter logic for “invited”.
3. Change the Admin → Members list logic so:
   - Professionals still only show confirmed joined members.
   - Training Providers show all non-demo provider accounts as members, regardless of whether the email link has been clicked.
   - Admin accounts remain excluded.
4. Verify the provider subscription rows:
   - Confirm each of the 24 provider accounts has a subscription row.
   - Confirm the tier/status used by the admin table is correct.
   - If renewal dates are missing because the import did not populate them, fix the provider subscription renewal data from the available source data before claiming completion.
5. Validate in the running app:
   - Open `/admin/members`.
   - Switch to “Training Providers”.
   - Confirm the table shows 24 providers instead of zero.
   - Confirm the plan/subscription status appears in the table.
6. Run the REPs UI compliance audit after the UI code change.

## Files likely affected

- `src/lib/admin/professionals.functions.ts`
- `src/routes/admin_.members.tsx`
- Backend data only if the subscription renewal dates are confirmed missing and recoverable from existing provider/import records.