## Problem

Looked at the source `cta-band.jpg`: trainers occupy roughly **55%–100%** of the image width. My current desktop gradient still has ~55% ink at the 55% mark, which falls right on the female trainer — that's why she looks washed out / invisible.

## Fix — pull gradient stops left so trainers are 100% clear

**Desktop (`lg`)**: copy column is `max-w-[520px]` inside `px-14` padding = ends around the 46% mark in a ~1240px container. Trainers start at 55%. So the gradient must be fully transparent by ~50%.

New stops:
- `#0B0D10` 0% → `rgba(11,13,16,0.95)` 25% → `rgba(11,13,16,0.55)` 38% → `rgba(11,13,16,0)` **50%**

That keeps the copy panel dense ink, and gives the trainers a 50%→100% completely clear band.

**Tablet (`md`–`lg`)**: same idea but vertical. Trainers occupy the top portion of the cropped image. Currently transparent from 0–30%, ramping in by 60%. That's fine — trainers stay clear up top. No change needed there, but I'll verify after the desktop fix.

**Mobile**: image is on its own (no overlay), already clean.

## Single-line code change

`src/routes/index.tsx`, the `lg:block` gradient div — swap its `backgroundImage` for the new stops above. Tablet gradient and text contrast stay as-is.

## Out of scope

No new asset, no token changes, no other sections.
