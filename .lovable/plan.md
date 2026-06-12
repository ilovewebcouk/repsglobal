# Fix avatar upload failure + corner radius mismatch

## Diagnosis (confirmed from production logs)

1. **Upload failure** — The AI image-check server function call returns 500 with `Server function info not found for 964c43e6...`. The deployed preview build's client bundle references a server function ID that the server bundle doesn't have — a client/server build mismatch. The crop/Jimp code is already gone and the current source is correct; the deployed build is the problem.
2. **Raw HTML in toast** — When that 500 happens, the platform returns an HTML error page and the toast prints it verbatim. Users must never see that.
3. **Corner radius** — Directory result-card photos use 12px radius; the dashboard Profile editor avatar uses 18px on a smaller (80px) image, so it reads far too round.

## Fix plan

### 1. Force a clean, consistent build and reproduce
- Trigger a fresh build of the current code and test the full upload flow live in the browser as the demo pro (pick photo → upload → AI validate → client crop → commit) on the actual preview.
- If `Server function info not found` still reproduces on the fresh build, investigate the server-function registration itself (module import graph for `avatar-ai.functions.ts`, stable export shape) and restructure until client and server IDs match. I will not stop at "it builds" — the live flow must succeed.

### 2. Bulletproof error handling (no raw HTML, ever)
- Wrap all avatar server-function calls (`validateAvatar`, `commitAvatar`, `regenerateAvatar`) in a helper that detects HTML / non-JSON error bodies and replaces them with clean messages (e.g. "Our image check hit a server problem — please try again.").
- Add a single automatic retry on transient 5xx for the validate step.
- Clean up the temp upload from storage if any step after upload fails.

### 3. Corner radius consistency
- Change the Profile editor avatar (80px, currently 18px radius) and the preview-card avatar (64px, currently 18px) to **12px** to match the directory result-card photo radius, including their fallback initials blocks. Buttons/cards around them untouched.

### 4. Verification (before claiming anything works)
- Live browser test on the preview: sign in as demo pro, upload a real test headshot end-to-end → confirm success toast, avatar updates in editor, preview card, and navbar.
- Re-check server logs: zero 500s on the avatar functions during the test.
- Test the rejection path (upload a non-headshot) → clean, human-readable rejection message, no HTML.
- Visual check of avatar corners in dashboard vs directory side by side.

## Technical details
- Files: `src/routes/_authenticated/_professional/dashboard_.profile.tsx` (error handling, retry, radius), possibly `src/lib/profile/avatar-ai.functions.ts` (registration restructure only if the mismatch reproduces on a fresh build).
- No changes to locked Phase 1 visuals beyond the dashboard avatar radius correction (12px is the existing directory standard).
