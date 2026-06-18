/**
 * Homepage hero search — dark glass shell wrapper around InlineHeroSearch.
 * All combobox + Places + geolocate logic lives in InlineHeroSearch.
 */

import { InlineHeroSearch } from "@/components/search/InlineHeroSearch";

export function HomeHeroSearch() {
  return (
    <InlineHeroSearch
      variant="dark"
      showDivider
      className="animate-rise-in mt-8 flex flex-col gap-2 rounded-[22px] border border-white/10 bg-reps-ink/60 p-2 backdrop-blur-md sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
      style={{ animationDelay: "320ms" }}
      buttonLabel="Find your coach"
    />
  );
}
