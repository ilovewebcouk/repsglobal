Remove "Card required" from the Pro plan meta text under the price, on both monthly and annual views, so the wording is cleaner and consistent with the Verified plan style.

Changes in `src/components/pricing/pricing-data.ts`:
- **Pro monthly meta**: change from `Card required · £0 today · then billed monthly after 30 days` to `£0 today · then billed monthly after 30 days`
- **Pro annual meta**: change from `Card required · £590 billed yearly after trial · 2 months free` to `£590 billed yearly after trial · 2 months free`