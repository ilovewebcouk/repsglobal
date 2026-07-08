// Shared demo imagery for the two seeded training-provider accounts.
// Used as a fallback when the provider hasn't uploaded their own hero/logo
// via the website editor yet. Consumed by:
//   - /find-a-training-provider (directory tiles)
//   - /t/$slug (public provider page)
// DB values always take precedence — these only fill NULLs.

import diverseLogo from "@/assets/diverse-logo.svg.asset.json";
import origymLogo from "@/assets/origym-logo.webp.asset.json";
import forgeCover from "@/assets/providers/forge-cover.jpg.asset.json";
import northlineCover from "@/assets/providers/northline-cover.jpg.asset.json";

export const DEMO_PROVIDER_LOGOS: Record<string, string> = {
  "northline-fitness-academy": diverseLogo.url,
  "diverse-trainers": diverseLogo.url,
  "forge-strength-institute": origymLogo.url,
};

export const DEMO_PROVIDER_COVERS: Record<string, string> = {
  "northline-fitness-academy": northlineCover.url,
  "diverse-trainers": northlineCover.url,
  "forge-strength-institute": forgeCover.url,
};
