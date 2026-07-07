## Goal

Make the directory tiles show the same cover + logo that already appear on `/t/$slug` for the two demo providers (Forge, Northline), and remove the fork so both surfaces read from one place going forward.

## What changes

### 1. Extract the demo asset map to a shared module

**New file:** `src/lib/directory/demo-provider-assets.ts`

```ts
import diverseLogo from "@/assets/diverse-logo.svg.asset.json";
import origymLogo from "@/assets/origym-logo.webp.asset.json";
import forgeCover from "@/assets/providers/forge-cover.jpg.asset.json";
import northlineCover from "@/assets/providers/northline-cover.jpg.asset.json";

export const DEMO_PROVIDER_LOGOS: Record<string, string> = {
  "northline-fitness-academy": diverseLogo.url,
  "forge-strength-institute": origymLogo.url,
};

export const DEMO_PROVIDER_COVERS: Record<string, string> = {
  "northline-fitness-academy": northlineCover.url,
  "forge-strength-institute": forgeCover.url,
};
```

### 2. Use the map in the directory server function

`src/lib/directory/providers.functions.ts` — after building each row, apply the demo overlay:

```ts
avatar_url: prof.avatar ?? DEMO_PROVIDER_LOGOS[slug] ?? null,
hero_image_url: heroById[r.id] ?? DEMO_PROVIDER_COVERS[slug] ?? null,
```

DB values still win; demo assets only fill in where the DB is empty.

### 3. Point `/t/$slug` at the shared map

`src/routes/t.$slug.index.tsx` — delete the two local `const DEMO_PROVIDER_*` declarations and the four asset imports, import them from `@/lib/directory/demo-provider-assets` instead. Behaviour unchanged.

## Result

- `/find-a-training-provider` tiles for Forge + Northline now show the real cover image + logo chip — matching `/t/$slug`.
- Any future provider without a DB hero/logo still gets the gradient + monogram fallback.
- Once real providers upload their own via the website editor, the DB values take over automatically — no code change needed.

## Out of scope

- Building/checking the provider-side upload UI (that's the follow-up path you mentioned earlier).
- Any change to the coach cards, styling, or radius.

## Acceptance

- Directory shows real cover + logo for Forge and Northline.
- Directory still shows gradient + monogram for any other provider without DB imagery.
- `/t/forge-strength-institute` looks identical to today (same cover + logo, just sourced from the shared module).