## Two issues on `/t/diverse-trainers` hero

### 1. Logo doesn't reflect the provider's profile

`src/routes/t.$slug.index.tsx` line 140:

```ts
const logoUrl = DEMO_PROVIDER_LOGOS[slug] ?? sf.avatar_url ?? null;
```

The seeded demo constant wins over the profile avatar, so uploading a new logo from the provider dashboard has no visible effect on this page. The directory route already does it the other way round (`prof.avatar ?? DEMO_PROVIDER_LOGOS[slug]`).

**Fix:** flip the priority so DB wins, demo is only a fallback for NULLs:

```ts
const logoUrl = sf.avatar_url ?? DEMO_PROVIDER_LOGOS[slug] ?? null;
```

### 2. Floating logo chip is smaller than the directory tile

Directory card (`find-a-training-provider.tsx` line 221) uses a 72×72 chip with `rounded-[14px]`, `p-1.5`, `ring-1 ring-black/5`, `shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)]`.

Hero chip (`t.$slug.index.tsx` line 225) uses only 56×56 (`h-14 w-14`), `rounded-[12px]`, `p-2`, `border` + heavier shadow — reads much smaller against the 280px cover.

**Fix:** align the hero chip to the directory spec so the same provider reads the same on both surfaces:

```tsx
<div className="absolute bottom-3 left-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[14px] bg-white ring-1 ring-black/5 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)]">
  <img src={logoUrl} alt={`${providerName} logo`} className="h-full w-full object-contain p-1.5" loading="eager" />
</div>
```

No other files touched. No DB / DTO changes needed (`avatar_url` is already returned).
