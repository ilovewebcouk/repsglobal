Update copy on `/cpd` to replace slang with hard-hitting, professional wording that matches the tone of `/specialisms` and `/for-professionals`.

## Changes

| Location | Current | New |
|---|---|---|
| Meta description (line 51) | "how to spot a dodgy training provider" | "how to spot a worthless training provider" |
| Sticky nav label (line 102 area) | "Spot a dodgy course" | "Spot a worthless course" |
| FAQ question (line 447 area) | "How do I report a dodgy provider or coach?" | "How do I report a predatory provider or coach?" |
| Body copy (line 807 area) | "most punters don't know the difference" | "most buyers don't know the difference" |
| Body copy (line 892 area) | "This is where punters get scammed most." | "This is where buyers get burned most." |
| Section H2 (line 1149 area) | "Spot a dodgy course" | "Spot a worthless course" |
| Subhead under H2 | (none / current subhead) | "How to tell a real qualification from a bad one" |
| Body copy (line 1155 area) | "Most scammy training providers follow…" | "The most predatory training providers follow…" |
| Step title (line 1209 area) | "Siphon out the bullshit." | "Cut the noise." |

## What's not changing

- Section anchor `id="dodgy-courses"` stays as-is (internal slug only).
- No structural, component, or image changes.

## Verification

After edits, `rg -n "punter|scammed|scammy|bullshit|Siphon" src/routes/cpd.tsx` returns zero matches.