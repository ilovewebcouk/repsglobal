## Plan: keep enquire-page pro image at `rounded-[14px]` + update radius rule

### Decision
Leave `src/routes/pro.$slug.enquire.tsx:305` untouched — the 64×64 image in the summary card is a scaled-down version of the pro's profile photo, deliberately matching the softer corner feel of the profile hero (`rounded-[24px]`). Treating it as a generic "avatar" (12px) would make it read as a different shape from the profile page.

### What changes
Only the memory rule — no code edits.

Update `mem://index.md` Core rule for the radius system to carve out a documented exception:

- Before: "Never 14/20/28/32px or `rounded-xl/2xl/3xl`."
- After: "Never 20/28/32px or `rounded-xl/2xl/3xl`. 14px allowed ONLY for scaled-down pro/profile photos that need to read as the same shape as their larger source image (e.g. enquire-page summary card)."

### Result
- One-line radius "violation" is reclassified as intentional.
- Compliance audit script should be updated later (out of scope here) to whitelist `pro.$slug.enquire.tsx:305` or to allow `rounded-[14px]` on `<img>` elements specifically. For now it can be ignored.
- No visual change on the page.