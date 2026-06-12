## Diagnosis (confirmed, not guessed)

I reproduced the exact failure by calling the avatar-save server function directly with a real signed-in session. The photo upload itself **works** (your file is in storage), but the final step — writing the photo URL onto your profile — is rejected by the database with:

```
42501: permission denied for function is_coach_of
```

**Why:** the access rule "Pros view their clients' profile" on the `profiles` table calls the helper function `is_coach_of(...)`. That function was created without granting signed-in users permission to execute it. So any profile update by a signed-in user trips that rule and fails — that's the "Upload failed" toast (and it would also break "Save changes" the same way in some cases).

I audited every helper function in the database and found **two** with this problem:

| Function | Used by | Missing permission |
|---|---|---|
| `is_coach_of` | profiles + clients access rules | signed-in users |
| `has_active_tier` | client roster access rule | signed-in users |

Everything else checked out: sign-in works, URL signing works, table permissions are correct, the server code is correct, and the dev server is healthy (the earlier stale-cache 500s are gone — the failures in the logs from before 06:33 were the old issue; this one is new and purely database-side).

## Fix

1. **One small migration** granting signed-in users permission to execute `is_coach_of` and `has_active_tier`. No table or code changes needed.
2. **Verify end-to-end**: re-run the same direct call that failed — it should now save the photo URL. Your already-uploaded photo (from your last attempt) gets linked to your profile in that same verification step, so it will appear immediately.
3. You then refresh `/dashboard/profile` — avatar should show in the editor, the top-right menu, and the sidebar footer.

No locked screens are touched; this is backend-only.