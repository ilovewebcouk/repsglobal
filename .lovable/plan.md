## Remove Pricing Section from /for-professionals

### Scope
Remove the pricing preview section (lines 463–538) from `src/routes/for-professionals.tsx`, which currently renders a 3-tier plan grid below the AI Operating Layer and above the Final CTA.

### Clean-up
Also remove unused imports that only the pricing section consumes:
- `PLANS` from `@/components/pricing/pricing-data`
- `FoundingBanner` from `@/components/pricing/FoundingBanner`

### Verification
Build passes cleanly with no unused-import TypeScript errors.