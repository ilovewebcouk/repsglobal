## Pricing page: reorder sections and deduplicate heading

### 1. Reorder sections on `/pricing`
Swap the **PricingCompare** (plan-by-plan comparison table) and **PricingFAQ** sections so the comparison table appears **before** the FAQ.

Current order:
- PricingPlans
- PricingFAQ
- PricingCompare + "Looking at other platforms?" CTA
- Final CTA

New order:
- PricingPlans
- PricingCompare
- PricingFAQ
- "Looking at other platforms?" CTA
- Final CTA

### 2. Remove duplicate heading from `PricingCompare.tsx`
The component currently renders its own heading:
- **"Compare every feature"** (h2, inside `PricingCompare.tsx`)

The `/pricing` page already wraps the component with:
- **"Every feature, every REPs tier."** (h2, in `pricing.tsx`)

Remove the internal heading from `PricingCompare.tsx` so only the page-level heading remains. Keep the subtitle paragraph and the tier selector/table intact.

### Files to touch
- `src/routes/pricing.tsx`
- `src/components/pricing/PricingCompare.tsx`