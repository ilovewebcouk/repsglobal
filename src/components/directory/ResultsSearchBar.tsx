/**
 * Sticky results search bar for /find-a-professional.
 *
 * One search primitive, two presentations — this is the compact working
 * sibling of the homepage hero (`src/components/home/HeroSearch.tsx`).
 *
 * Layout (desktop):
 *   [What chip] [Where chip] · [Mode toggle] [Filters ▾]   {count} [Sort ▾]
 *
 * Mobile collapses to: What + Where chips above, then a single Filters
 * sheet with mode/rating/radius/venue/sort.
 *
 * Every chip change reads & writes URL search params so back-button, share
 * and SSR all work. Source-of-truth for filters is the URL, not state.
 */

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Crosshair,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  type SearchEntry,
  type RankedEntry,
  getPopularEntries,
  searchTaxonomy,
} from "@/lib/search/taxonomy";
import { PROFESSIONS, getProfessionLabel } from "@/lib/professions";
import { SPECIALISMS, getSpecialismLabel } from "@/lib/specialisms";
import { VENUES } from "@/components/marketing/VenueWordmarks";
import {
  loadPlacesLibrary,
  UK_POSTCODE_RE,
  type PlacesSuggestion,
  type PlacesLibrary,
} from "@/lib/google/places";
import { useViewerOrigin } from "@/lib/useViewerOrigin";
import { useResolveViewerLocation } from "@/lib/profile/useResolveViewerLocation";
import { cn } from "@/lib/utils";

export type ResultsBarSort = "recommended" | "nearest" | "rating" | "most_reviewed" | "newest";
export type ResultsBarMode = "any" | "in_person" | "online";
export type ResultsBarView = "list" | "split" | "map";

export type ResultsBarState = {
  profession?: string;
  specialism?: string;
  q?: string;
  city?: string;
  venue?: string;
  mode: ResultsBarMode;
  min_rating: number; // 0 = any
  radius_mi: number; // 0 = any
  sort: ResultsBarSort;
  view: ResultsBarView;
};

type Patch = Partial<ResultsBarState> & { page?: number };

export function ResultsSearchBar({
  state,
  total,
  countLabel,
}: {
  state: ResultsBarState;
  total: number;
  countLabel: string;
}) {
  const navigate = useNavigate();
  const { origin } = useViewerOrigin();

  const patch = React.useCallback(
    (p: Patch) => {
      navigate({
        to: "/find-a-professional",
        search: (prev: Record<string, unknown>) => {
          // View changes shouldn't reset pagination; everything else should.
          const isViewOnly = Object.keys(p).length === 1 && "view" in p;
          const next = { ...prev, ...p } as Record<string, unknown>;
          if (!isViewOnly) next.page = 1;
          // Strip falsy/default values so URLs stay clean.
          for (const k of Object.keys(next)) {
            const v = next[k];
            if (v == null || v === "" || v === "any" || v === 0) delete next[k];
          }
          // Defaults that should not appear in the URL.
          if (next.sort === "nearest") delete next.sort;
          if (next.view === "list") delete next.view;
          return next;
        },
      });
    },
    [navigate],
  );

  const activeFilterCount =
    (state.mode !== "any" ? 1 : 0) +
    (state.min_rating > 0 ? 1 : 0) +
    (state.radius_mi > 0 ? 1 : 0) +
    (state.venue ? 1 : 0);

  const whatLabel = whatToLabel(state);
  const whereLabel =
    origin?.town ?? origin?.postcode_outward ?? state.city ?? null;

  // Add a soft shadow once the user scrolls so the bar separates from the
  // ivory results without an always-on hairline border under the dark header.
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "sticky top-[72px] z-30 bg-reps-warm-white/95 backdrop-blur-md transition-shadow",
        scrolled && "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="mx-auto max-w-[1320px] px-4 py-2.5 sm:px-6 lg:px-10 lg:py-3">
        {/* Row 1 — Search chips */}
        <div className="flex flex-wrap items-center gap-2">
          <WhatChip
            label={whatLabel}
            onPick={(entry) =>
              patch({
                profession: entry?.route.profession,
                specialism: entry?.route.specialism,
                q: undefined,
              })
            }
            onFreeText={(t) =>
              patch({ q: t, profession: undefined, specialism: undefined })
            }
            onClear={() =>
              patch({ profession: undefined, specialism: undefined, q: undefined })
            }
          />

          <WhereChip
            label={whereLabel}
            origin={origin}
            currentCity={state.city}
            // Setting any origin (city, postcode, geo) forces sort→nearest so
            // the list immediately re-ranks by distance.
            onCity={(c) => patch({ city: c, sort: "nearest" })}
            onOriginSet={() => patch({ sort: "nearest" })}
            onClear={() => patch({ city: undefined })}
          />

          {/* Desktop: inline mode toggle. Mobile: hidden, lives in sheet. */}
          <div className="hidden lg:block">
            <ModeToggle
              value={state.mode}
              onChange={(m) => patch({ mode: m })}
            />
          </div>

          {/* Desktop filters popover (rating + radius + venue) */}
          <div className="hidden lg:block">
            <FiltersPopover
              state={state}
              originAvailable={Boolean(origin)}
              onChange={patch}
              activeCount={activeFilterCount - (state.mode !== "any" ? 1 : 0)}
            />
          </div>

          {/* Mobile: single filters sheet (everything) */}
          <div className="lg:hidden">
            <MobileFiltersSheet
              state={state}
              originAvailable={Boolean(origin)}
              activeCount={activeFilterCount}
              onChange={patch}
            />
          </div>

          {/* Right side: count + view toggle (desktop) + sort */}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[12.5px] text-reps-muted-light md:inline">
              {countLabel}
            </span>
            <ViewToggle
              value={state.view}
              onChange={(v) => patch({ view: v })}
            />
            <SortSelect
              value={state.sort}
              originAvailable={Boolean(origin)}
              onChange={(s) => patch({ sort: s })}
            />
          </div>
        </div>

        {/* Row 2 — Active filter chips, only when something is set beyond defaults */}
        {activeFilterCount > 0 || state.q || state.profession || state.specialism ? (
          <ActiveChipsRow state={state} total={total} onClear={patch} />
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================ WhatChip */

function WhatChip({
  label,
  onPick,
  onFreeText,
  onClear,
}: {
  label: string | null;
  onPick: (entry: SearchEntry) => void;
  onFreeText: (text: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const ranked: RankedEntry[] = React.useMemo(
    () => searchTaxonomy(query),
    [query],
  );
  const popular = React.useMemo(() => getPopularEntries(), []);

  const grouped = React.useMemo(() => {
    const out: Record<string, RankedEntry[]> = {
      Professions: [],
      "Goals & specialisms": [],
      "Training mode": [],
    };
    for (const r of ranked) out[r.group].push(r);
    return out;
  }, [ranked]);

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-full border bg-reps-warm-white transition-colors",
        label
          ? "border-reps-orange/40 bg-reps-orange/8 hover:border-reps-orange/60"
          : "border-reps-stone hover:border-reps-orange/40",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium text-reps-charcoal"
          >
            <Search className="h-3.5 w-3.5 text-reps-orange" />
            <span className="max-w-[180px] truncate">
              {label ?? "What are you looking for?"}
            </span>
            {label ? null : <ChevronDown className="size-3.5 text-reps-muted-light" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-[340px] rounded-[16px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Try 'PT', 'fat loss', 'bad back', 'yoga'…"
            />
            <CommandList>
              {query.trim() === "" ? (
                <CommandGroup heading="Popular">
                  {popular.map((entry) => (
                    <CommandItem
                      key={entry.slug}
                      value={entry.slug}
                      onSelect={() => {
                        onPick(entry);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      {entry.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <>
                  <CommandEmpty>
                    <button
                      type="button"
                      onClick={() => {
                        onFreeText(query.trim());
                        setOpen(false);
                        setQuery("");
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] text-reps-charcoal hover:bg-reps-warm-white"
                    >
                      Search for <span className="font-semibold">"{query.trim()}"</span>
                    </button>
                  </CommandEmpty>
                  {(
                    ["Professions", "Goals & specialisms", "Training mode"] as const
                  ).map((group) =>
                    grouped[group].length > 0 ? (
                      <CommandGroup key={group} heading={group}>
                        {grouped[group].map((entry) => (
                          <CommandItem
                            key={entry.slug}
                            value={entry.slug}
                            onSelect={() => {
                              onPick(entry);
                              setOpen(false);
                              setQuery("");
                            }}
                          >
                            <span>{entry.label}</span>
                            {entry.matchedSynonym ? (
                              <span className="ml-auto text-[11px] text-reps-muted-light">
                                matched "{entry.matchedSynonym}"
                              </span>
                            ) : null}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : null,
                  )}
                  {ranked.length > 0 ? <CommandSeparator /> : null}
                  <CommandGroup>
                    <CommandItem
                      value={`__free:${query}`}
                      onSelect={() => {
                        onFreeText(query.trim());
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      Search for <span className="font-semibold">"{query.trim()}"</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {label ? (
        <button
          type="button"
          aria-label="Clear what"
          onClick={onClear}
          className="mr-2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-reps-muted-light hover:bg-reps-stone/60 hover:text-reps-charcoal"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}


/* =========================================================== WhereChip */

function WhereChip({
  label,
  origin,
  currentCity,
  onCity,
  onOriginSet,
  onClear,
}: {
  label: string | null;
  origin: ReturnType<typeof useViewerOrigin>["origin"];
  currentCity: string | undefined;
  onCity: (city: string) => void;
  onOriginSet: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const { setOrigin, runPostcode, runGeolocate, setManual, busy } =
    useResolveViewerLocation({ onResolved: () => { onOriginSet(); setOpen(false); } });

  const [text, setText] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<PlacesSuggestion[]>([]);
  const [placesReady, setPlacesReady] = React.useState(false);
  const placesLibRef = React.useRef<PlacesLibrary | null>(null);
  const sessionTokenRef = React.useRef<unknown>(null);

  React.useEffect(() => {
    if (!open || placesReady) return;
    void loadPlacesLibrary()
      .then((lib) => {
        placesLibRef.current = lib;
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
        setPlacesReady(true);
      })
      .catch(() => setPlacesReady(false));
  }, [open, placesReady]);

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text.trim()), 220);
    return () => window.clearTimeout(id);
  }, [text]);

  React.useEffect(() => {
    if (!debounced || !placesReady || !placesLibRef.current) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    placesLibRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: debounced,
      includedRegionCodes: ["gb"],
      includedPrimaryTypes: [
        "locality",
        "postal_code",
        "postal_town",
        "administrative_area_level_2",
      ],
      sessionToken: sessionTokenRef.current,
    })
      .then(({ suggestions: s }) => {
        if (!cancelled) setSuggestions(s ?? []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, placesReady]);

  const isPostcode = UK_POSTCODE_RE.test(text.trim());

  const pickSuggestion = async (s: PlacesSuggestion) => {
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress", "displayName"] });
      const lat = place.location?.lat();
      const lng = place.location?.lng();
      const labelText =
        s.placePrediction.structuredFormat?.mainText?.text ??
        place.displayName ??
        s.placePrediction.text.text;
      if (typeof lat === "number" && typeof lng === "number") {
        setManual({
          postcode_outward: labelText.slice(0, 16),
          town: labelText,
          latitude: lat,
          longitude: lng,
        });
        setOpen(false);
      } else {
        onCity(labelText);
        setOpen(false);
      }
    } catch {
      onCity(text.trim());
      setOpen(false);
    }
  };

  const clearAll = () => {
    setOrigin(null);
    onClear();
    setText("");
  };

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-full border bg-reps-warm-white transition-colors",
        label
          ? "border-reps-orange/40 bg-reps-orange/8 hover:border-reps-orange/60"
          : "border-reps-stone hover:border-reps-orange/40",
      )}
    >
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium text-reps-charcoal"
        >
          <MapPin className="h-3.5 w-3.5 text-reps-muted-light" />
          <span className="max-w-[160px] truncate">{label ?? "Anywhere"}</span>
          {label ? null : <ChevronDown className="size-3.5 text-reps-muted-light" />}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className="w-[340px] rounded-[16px] p-3">
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-[10px] shadow-none"
            onClick={() => runGeolocate()}
            disabled={busy}
          >
            <Crosshair className="h-3.5 w-3.5" />
            Use my current location
          </Button>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-reps-muted-light">
            <span className="h-px flex-1 bg-reps-stone" />
            or
            <span className="h-px flex-1 bg-reps-stone" />
          </div>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="City, town or postcode (e.g. SW1A)"
            className="rounded-[12px]"
            disabled={busy}
            autoFocus
          />
          {isPostcode ? (
            <button
              type="button"
              onClick={() => runPostcode(text.trim())}
              disabled={busy}
              className="flex items-center justify-between rounded-[10px] border border-reps-orange/30 bg-reps-orange/10 px-3 py-2 text-[13px] font-medium text-reps-charcoal transition-colors hover:bg-reps-orange/15 disabled:opacity-50"
            >
              <span>
                Search around{" "}
                <span className="font-semibold">{text.trim().toUpperCase()}</span>
              </span>
              <MapPin className="h-3.5 w-3.5 text-reps-orange" />
            </button>
          ) : null}
          {suggestions.length > 0 ? (
            <ul className="flex flex-col overflow-hidden rounded-[10px] border border-reps-stone">
              {suggestions.slice(0, 6).map((s) => {
                const main =
                  s.placePrediction.structuredFormat?.mainText?.text ??
                  s.placePrediction.text.text;
                const sec =
                  s.placePrediction.structuredFormat?.secondaryText?.text ?? "";
                return (
                  <li key={s.placePrediction.placeId}>
                    <button
                      type="button"
                      onClick={() => void pickSuggestion(s)}
                      className="flex w-full items-center gap-2 border-b border-reps-stone/60 px-3 py-2 text-left text-[13px] transition-colors last:border-b-0 hover:bg-reps-warm-white"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-reps-muted-light" />
                      <span className="flex-1 truncate">
                        <span className="font-medium text-reps-charcoal">{main}</span>
                        {sec ? (
                          <span className="ml-1.5 text-reps-muted-light">{sec}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {text.trim() && !isPostcode && suggestions.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                onCity(text.trim());
                setOpen(false);
              }}
              className="rounded-[10px] border border-reps-stone px-3 py-2 text-left text-[13px] text-reps-charcoal transition-colors hover:bg-reps-warm-white"
            >
              Search "{text.trim()}" as a city
            </button>
          ) : null}
          <p className="text-[11px] leading-snug text-reps-muted-light">
            Used only to rank results by distance — never stored on our servers.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ========================================================== ModeToggle */

function ModeToggle({
  value,
  onChange,
}: {
  value: ResultsBarMode;
  onChange: (m: ResultsBarMode) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ResultsBarMode)}
      className="h-10 rounded-full border border-reps-stone bg-reps-warm-white p-0.5"
    >
      <ToggleGroupItem
        value="any"
        className="h-9 rounded-full px-3 text-[12.5px] font-medium data-[state=on]:bg-reps-charcoal data-[state=on]:text-white"
      >
        Any
      </ToggleGroupItem>
      <ToggleGroupItem
        value="in_person"
        className="h-9 rounded-full px-3 text-[12.5px] font-medium data-[state=on]:bg-reps-charcoal data-[state=on]:text-white"
      >
        In-person
      </ToggleGroupItem>
      <ToggleGroupItem
        value="online"
        className="h-9 rounded-full px-3 text-[12.5px] font-medium data-[state=on]:bg-reps-charcoal data-[state=on]:text-white"
      >
        Online
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/* ============================================================ ViewToggle */

function ViewToggle({
  value,
  onChange,
}: {
  value: ResultsBarView;
  onChange: (v: ResultsBarView) => void;
}) {
  // Mobile: List ↔ Map. Desktop (lg): List · Split · Map.
  // Split is the rich power-user view; mobile collapses to a binary.
  return (
    <div className="hidden items-center gap-0.5 rounded-full border border-reps-stone bg-reps-warm-white p-0.5 md:inline-flex">
      <button
        type="button"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={cn(
          "h-9 rounded-full px-3 text-[12.5px] font-medium transition-colors",
          value === "list"
            ? "bg-reps-charcoal text-white"
            : "text-reps-charcoal hover:bg-white",
        )}
      >
        List
      </button>
      <button
        type="button"
        aria-pressed={value === "split"}
        onClick={() => onChange("split")}
        className={cn(
          "hidden h-9 rounded-full px-3 text-[12.5px] font-medium transition-colors lg:inline-flex lg:items-center",
          value === "split"
            ? "bg-reps-charcoal text-white"
            : "text-reps-charcoal hover:bg-white",
        )}
      >
        Split
      </button>
      <button
        type="button"
        aria-pressed={value === "map"}
        onClick={() => onChange("map")}
        className={cn(
          "h-9 rounded-full px-3 text-[12.5px] font-medium transition-colors",
          value === "map"
            ? "bg-reps-charcoal text-white"
            : "text-reps-charcoal hover:bg-white",
        )}
      >
        Map
      </button>
    </div>
  );
}



/* ========================================================== SortSelect */

function SortSelect({
  value,
  originAvailable,
  onChange,
}: {
  value: ResultsBarSort;
  originAvailable: boolean;
  onChange: (s: ResultsBarSort) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ResultsBarSort)}>
      <SelectTrigger className="h-10 w-auto gap-1.5 rounded-full border-reps-stone bg-reps-warm-white px-3.5 text-[12.5px] font-medium text-reps-charcoal">
        <span className="text-reps-muted-light">Sort:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-[12px]">
        <SelectGroup>
          <SelectItem value="nearest" disabled={!originAvailable}>
            {originAvailable ? "Nearest" : "Nearest (set location)"}
          </SelectItem>
          <SelectItem value="recommended">Recommended</SelectItem>
          <SelectItem value="rating">Highest rated</SelectItem>
          <SelectItem value="most_reviewed">Most reviewed</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/* ======================================================= FiltersPopover */

const RATING_OPTIONS = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3★ & up" },
  { value: 4, label: "4★ & up" },
  { value: 5, label: "5★ only" },
];

const RADIUS_OPTIONS = [
  { value: 0, label: "Any distance" },
  { value: 1, label: "Within 1 mi" },
  { value: 5, label: "Within 5 mi" },
  { value: 10, label: "Within 10 mi" },
  { value: 25, label: "Within 25 mi" },
  { value: 50, label: "Within 50 mi" },
];

function FiltersPopover({
  state,
  originAvailable,
  onChange,
  activeCount,
}: {
  state: ResultsBarState;
  originAvailable: boolean;
  onChange: (p: Patch) => void;
  activeCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full border bg-reps-warm-white px-3.5 text-[13.5px] font-medium transition-colors",
            activeCount > 0
              ? "border-reps-orange/40 bg-reps-orange/8 text-reps-charcoal"
              : "border-reps-stone text-reps-charcoal hover:border-reps-orange/40",
          )}
        >
          <SlidersHorizontal className="size-3.5 text-reps-muted-light" />
          Filters
          {activeCount > 0 ? (
            <Badge variant="secondary" className="rounded-full px-1.5 text-[11px]">
              {activeCount}
            </Badge>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[320px] rounded-[16px] p-4">
        <FiltersBody
          state={state}
          originAvailable={originAvailable}
          onChange={onChange}
          showMode={false}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ===================================================== MobileFiltersSheet */

function MobileFiltersSheet({
  state,
  originAvailable,
  activeCount,
  onChange,
}: {
  state: ResultsBarState;
  originAvailable: boolean;
  activeCount: number;
  onChange: (p: Patch) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full border bg-reps-warm-white px-3.5 text-[13.5px] font-medium",
            activeCount > 0
              ? "border-reps-orange/40 bg-reps-orange/8 text-reps-charcoal"
              : "border-reps-stone text-reps-charcoal",
          )}
        >
          <Filter className="size-3.5" />
          Filters
          {activeCount > 0 ? (
            <Badge variant="secondary" className="rounded-full px-1.5 text-[11px]">
              {activeCount}
            </Badge>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[22px] p-0">
        <SheetHeader className="border-b border-reps-stone/70 px-5 py-4 text-left">
          <SheetTitle className="text-[16px] font-semibold text-reps-charcoal">
            Filter results
          </SheetTitle>
        </SheetHeader>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <FiltersBody
            state={state}
            originAvailable={originAvailable}
            onChange={onChange}
            showMode
          />
        </div>
        <SheetFooter className="flex flex-row gap-2 border-t border-reps-stone/70 p-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-[10px]"
            onClick={() =>
              onChange({
                mode: "any",
                min_rating: 0,
                radius_mi: 0,
                venue: undefined,
              })
            }
          >
            Clear all
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-[10px]"
            onClick={() => setOpen(false)}
          >
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ============================================================ FiltersBody */

function FiltersBody({
  state,
  originAvailable,
  onChange,
  showMode,
}: {
  state: ResultsBarState;
  originAvailable: boolean;
  onChange: (p: Patch) => void;
  showMode: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {showMode ? (
        <FilterBlock label="Training mode">
          <ModeToggle
            value={state.mode}
            onChange={(m) => onChange({ mode: m })}
          />
        </FilterBlock>
      ) : null}

      <FilterBlock label="Minimum rating">
        <RadioGroup
          value={String(state.min_rating)}
          onValueChange={(v) => onChange({ min_rating: Number(v) })}
          className="flex flex-col gap-2"
        >
          {RATING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 text-[13px] text-reps-charcoal"
            >
              <RadioGroupItem value={String(opt.value)} id={`rating-${opt.value}`} />
              <span className="flex items-center gap-1.5">
                {opt.value > 0 ? (
                  <span className="inline-flex items-center text-reps-orange">
                    {Array.from({ length: opt.value }).map((_, i) => (
                      <Star key={i} className="size-3 fill-reps-orange" />
                    ))}
                  </span>
                ) : null}
                {opt.label}
              </span>
            </label>
          ))}
        </RadioGroup>
      </FilterBlock>

      <FilterBlock
        label="Distance"
        hint={originAvailable ? undefined : "Set your location to use this"}
      >
        <Select
          value={String(state.radius_mi)}
          onValueChange={(v) => onChange({ radius_mi: Number(v) })}
          disabled={!originAvailable}
        >
          <SelectTrigger className="rounded-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-[12px]">
            <SelectGroup>
              {RADIUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </FilterBlock>

      <FilterBlock label="Gym / venue">
        <Select
          value={state.venue ?? "any"}
          onValueChange={(v) => onChange({ venue: v === "any" ? undefined : v })}
        >
          <SelectTrigger className="rounded-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-[12px]">
            <SelectGroup>
              <SelectItem value="any">Any venue</SelectItem>
              {VENUES.map((v) => (
                <SelectItem key={v.slug} value={v.slug}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </FilterBlock>
    </div>
  );
}

function FilterBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-reps-muted-light">
          {label}
        </span>
        {hint ? (
          <span className="text-[10.5px] text-reps-muted-light">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/* ======================================================== ActiveChipsRow */

function ActiveChipsRow({
  state,
  total,
  onClear,
}: {
  state: ResultsBarState;
  total: number;
  onClear: (p: Patch) => void;
}) {
  const chips: Array<{ key: string; label: string; clear: Patch }> = [];

  if (state.profession) {
    chips.push({
      key: "profession",
      label: getProfessionLabel(state.profession) ?? state.profession,
      clear: { profession: undefined },
    });
  }
  if (state.specialism) {
    chips.push({
      key: "specialism",
      label: getSpecialismLabel(state.specialism) ?? state.specialism,
      clear: { specialism: undefined },
    });
  }
  if (state.q) {
    chips.push({ key: "q", label: `"${state.q}"`, clear: { q: undefined } });
  }
  if (state.mode !== "any") {
    chips.push({
      key: "mode",
      label: state.mode === "in_person" ? "In-person" : "Online",
      clear: { mode: "any" },
    });
  }
  if (state.min_rating > 0) {
    chips.push({
      key: "rating",
      label: `${state.min_rating}★ & up`,
      clear: { min_rating: 0 },
    });
  }
  if (state.radius_mi > 0) {
    chips.push({
      key: "radius",
      label: `Within ${state.radius_mi} mi`,
      clear: { radius_mi: 0 },
    });
  }
  if (state.venue) {
    const v = VENUES.find((x) => x.slug === state.venue);
    chips.push({
      key: "venue",
      label: v?.label ?? state.venue,
      clear: { venue: undefined },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <span className="text-[11px] text-reps-muted-light md:hidden">
        {total.toLocaleString()} results
      </span>
      <Separator orientation="vertical" className="hidden h-4 md:block" />
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onClear(c.clear)}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-reps-orange/30 bg-reps-orange/8 px-2.5 text-[11.5px] font-medium text-reps-charcoal transition-colors hover:border-reps-orange/50"
        >
          {c.label}
          <X className="size-3 text-reps-muted-light" />
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          onClear({
            profession: undefined,
            specialism: undefined,
            q: undefined,
            mode: "any",
            min_rating: 0,
            radius_mi: 0,
            venue: undefined,
          })
        }
        className="text-[11.5px] font-semibold text-reps-orange hover:text-reps-orange-dark"
      >
        Clear all
      </button>
    </div>
  );
}

/* ============================================================== helpers */

function whatToLabel(state: ResultsBarState): string | null {
  if (state.profession) {
    const p = PROFESSIONS.find((x) => x.slug === state.profession);
    return p?.label ?? state.profession;
  }
  if (state.specialism) {
    const s = SPECIALISMS.find((x) => x.slug === state.specialism);
    return s?.label ?? state.specialism;
  }
  if (state.q) return `"${state.q}"`;
  return null;
}
