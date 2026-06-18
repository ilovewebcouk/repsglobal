/**
 * Shared hero-search controller.
 *
 * Renders a working "What" combobox (PROFESSIONS + SPECIALISMS + synonyms)
 * and a "Where" Google Places + geolocate picker inside a caller-supplied
 * `<form>` shell. Used by:
 *
 *   - /                          (HomeHeroSearch, dark glass shell)
 *   - /professions/$profession   (light ivory shell, profession locked)
 *   - /in/$location              (light ivory shell, city pre-filled)
 *
 * Submit URL contract (matches HomeHeroSearch):
 *   - lockedProfession or picked profession  → ?profession=<slug>
 *   - picked specialism / mode               → ?specialism=<slug>
 *   - free-text fallback                     → ?q=<text>
 *   - resolved origin                        → ?sort=nearest
 *   - else city label                        → ?city=<text>
 *   navigates to /find-a-professional
 */

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Crosshair, MapPin, Search, X } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  SEARCH_ENTRIES,
  type SearchEntry,
  type RankedEntry,
  getPopularEntries,
  searchTaxonomy,
} from "@/lib/search/taxonomy";
import { useViewerOrigin } from "@/lib/useViewerOrigin";
import { useResolveViewerLocation } from "@/lib/profile/useResolveViewerLocation";
import {
  loadPlacesLibrary,
  UK_POSTCODE_RE,
  type PlacesSuggestion,
  type PlacesLibrary,
} from "@/lib/google/places";

type Variant = "dark" | "light";

type SelectedWhat =
  | { mode: "entry"; entry: SearchEntry }
  | { mode: "free"; text: string }
  | null;

type SelectedWhere =
  | { mode: "origin"; label: string }
  | { mode: "city"; label: string }
  | null;

export type InlineHeroSearchProps = {
  variant: Variant;
  /** Outer `<form>` className — caller owns the visual shell. */
  className?: string;
  /** Inline style passthrough for the outer `<form>` (e.g. animationDelay). */
  style?: React.CSSProperties;
  /** Optional submit-button overrides. */
  buttonClassName?: string;
  buttonLabel?: string;
  /** Render a vertical divider between the two fields (homepage flex shell). */
  showDivider?: boolean;
  /** When set, profession is fixed; combobox hides the Professions group. */
  lockedProfession?: string;
  /** When set and no viewer origin, pre-fills the Where field. */
  defaultCity?: string;
  /** Placeholder for the What trigger. */
  whatPlaceholder?: string;
  /** Placeholder for the Where trigger. */
  wherePlaceholder?: string;
};

export function InlineHeroSearch(props: InlineHeroSearchProps) {
  const {
    variant,
    className,
    style,
    buttonClassName,
    buttonLabel = "Search",
    showDivider = false,
    lockedProfession,
    defaultCity,
    whatPlaceholder,
    wherePlaceholder = "City or postcode",
  } = props;

  const navigate = useNavigate();
  const { origin } = useViewerOrigin();

  const [whatOpen, setWhatOpen] = React.useState(false);
  const [whatQuery, setWhatQuery] = React.useState("");
  const [what, setWhat] = React.useState<SelectedWhat>(() => {
    if (lockedProfession) {
      const entry = SEARCH_ENTRIES.find(
        (e) => e.kind === "profession" && e.slug === lockedProfession,
      );
      if (entry) return { mode: "entry", entry };
    }
    return null;
  });

  const isLockedSelection =
    Boolean(lockedProfession) &&
    what?.mode === "entry" &&
    what.entry.kind === "profession" &&
    what.entry.slug === lockedProfession;

  const [whereOpen, setWhereOpen] = React.useState(false);
  const [where, setWhere] = React.useState<SelectedWhere>(() => {
    if (origin) {
      return { mode: "origin", label: origin.town ?? origin.postcode_outward };
    }
    if (defaultCity) {
      return { mode: "city", label: defaultCity };
    }
    return null;
  });

  React.useEffect(() => {
    if (origin) {
      setWhere({ mode: "origin", label: origin.town ?? origin.postcode_outward });
    }
  }, [origin?.postcode_outward, origin?.town]);

  const whatLabel = React.useMemo(() => {
    if (!what) return null;
    return what.mode === "entry" ? what.entry.label : `"${what.text}"`;
  }, [what]);

  const whereLabel = where?.mode === "origin" || where?.mode === "city" ? where.label : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const search: {
      q?: string;
      city?: string;
      profession?: string;
      specialism?: string;
      page: number;
      sort: "recommended" | "nearest" | "rating" | "most_reviewed" | "newest";
    } = { page: 1, sort: "recommended" };

    // Profession: locked wins; else picked entry's profession.
    if (lockedProfession) {
      search.profession = lockedProfession;
    }

    if (what?.mode === "entry") {
      if (what.entry.route.profession && !lockedProfession) {
        search.profession = what.entry.route.profession;
      }
      if (what.entry.route.specialism) {
        search.specialism = what.entry.route.specialism;
      }
    } else if (what?.mode === "free") {
      const t = what.text.trim();
      if (t) search.q = t;
    } else if (whatQuery.trim()) {
      search.q = whatQuery.trim();
    }

    if (origin) {
      search.sort = "nearest";
    } else if (where?.mode === "city") {
      search.city = where.label;
    }

    navigate({ to: "/find-a-professional", search });
  };

  const defaultButtonClass =
    variant === "dark"
      ? "inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,122,0,0.6)] transition-all hover:bg-reps-orange-dark hover:shadow-[0_14px_38px_-10px_rgba(255,122,0,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      : "inline-flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark";

  return (
    <form onSubmit={handleSubmit} className={className} style={style}>
      <WhatField
        variant={variant}
        open={whatOpen}
        setOpen={setWhatOpen}
        query={whatQuery}
        setQuery={setWhatQuery}
        selected={what}
        setSelected={setWhat}
        label={whatLabel}
        lockedProfession={lockedProfession}
        hideClear={isLockedSelection}
        placeholder={
          whatPlaceholder ??
          (lockedProfession
            ? "Goal or specialism (e.g. fat loss)"
            : "Personal trainer, fat loss, yoga…")
        }
      />

      {showDivider ? (
        <span aria-hidden className="hidden h-8 w-px self-center bg-white/10 sm:block" />
      ) : null}

      <WhereField
        variant={variant}
        open={whereOpen}
        setOpen={setWhereOpen}
        selected={where}
        setSelected={setWhere}
        label={whereLabel}
        placeholder={wherePlaceholder}
      />

      <button type="submit" className={buttonClassName ?? defaultButtonClass}>
        {variant === "dark" ? <Search className="h-4 w-4" aria-hidden /> : null}
        {buttonLabel}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------- WhatField

function WhatField(props: {
  variant: Variant;
  open: boolean;
  setOpen: (b: boolean) => void;
  query: string;
  setQuery: (s: string) => void;
  selected: SelectedWhat;
  setSelected: (s: SelectedWhat) => void;
  label: string | null;
  lockedProfession?: string;
  placeholder: string;
}) {
  const {
    variant,
    open,
    setOpen,
    query,
    setQuery,
    selected: _selected,
    setSelected,
    label,
    lockedProfession,
    placeholder,
  } = props;

  const ranked: RankedEntry[] = React.useMemo(() => searchTaxonomy(query), [query]);

  const popular = React.useMemo(() => {
    const all = getPopularEntries();
    if (!lockedProfession) return all;
    // When profession is locked, only suggest specialisms/modes.
    return all.filter((e) => e.kind !== "profession");
  }, [lockedProfession]);

  const grouped = React.useMemo(() => {
    const out: Record<string, RankedEntry[]> = {
      Professions: [],
      "Goals & specialisms": [],
      "Training mode": [],
    };
    for (const r of ranked) {
      if (lockedProfession && r.group === "Professions") continue;
      out[r.group].push(r);
    }
    return out;
  }, [ranked, lockedProfession]);

  const pickEntry = (entry: SearchEntry) => {
    setSelected({ mode: "entry", entry });
    setQuery("");
    setOpen(false);
  };

  const pickFreeText = (text: string) => {
    setSelected({ mode: "free", text });
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    setSelected(null);
    setQuery("");
  };

  const triggerBase =
    variant === "dark"
      ? "group flex flex-1 items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none"
      : "group flex w-full items-center gap-2 rounded-[12px] bg-reps-ivory px-3 py-2.5 text-left transition-colors hover:bg-reps-ivory/70 focus:outline-none";

  const iconClass = variant === "dark" ? "text-reps-orange" : "text-reps-muted-light";
  const labelTextClass =
    variant === "dark"
      ? label
        ? "flex-1 truncate text-[15px] font-medium text-white"
        : "flex-1 truncate text-[15px] font-medium text-white/50"
      : label
      ? "flex-1 truncate text-[14px] text-reps-charcoal"
      : "flex-1 truncate text-[14px] text-reps-muted-light";
  const clearClass =
    variant === "dark"
      ? "ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      : "ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-reps-muted-light transition-colors hover:bg-reps-ink/5 hover:text-reps-charcoal";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerBase}>
          <Search className={cn("h-4 w-4 shrink-0", iconClass)} aria-hidden />
          <span className={labelTextClass}>{label ?? placeholder}</span>
          {label ? (
            <span
              role="button"
              aria-label="Clear"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  clear();
                }
              }}
              className={clearClass}
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[320px] rounded-[16px] p-0"
        sideOffset={8}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={
              lockedProfession
                ? "Try 'fat loss', 'bad back', 'mobility'…"
                : "Try 'PT', 'fat loss', 'bad back', 'yoga'…"
            }
          />
          <CommandList>
            {query.trim() === "" ? (
              <CommandGroup heading="Popular">
                {popular.map((entry) => (
                  <CommandItem
                    key={entry.slug}
                    value={entry.slug}
                    onSelect={() => pickEntry(entry)}
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
                    onClick={() => pickFreeText(query.trim())}
                    className="w-full px-3 py-2 text-left text-[13px] text-reps-charcoal hover:bg-reps-warm-white"
                  >
                    Search for{" "}
                    <span className="font-semibold">"{query.trim()}"</span>
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
                          onSelect={() => pickEntry(entry)}
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
                    onSelect={() => pickFreeText(query.trim())}
                  >
                    <span>
                      Search for{" "}
                      <span className="font-semibold">"{query.trim()}"</span>
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// --------------------------------------------------------------- WhereField

function WhereField(props: {
  variant: Variant;
  open: boolean;
  setOpen: (b: boolean) => void;
  selected: SelectedWhere;
  setSelected: (s: SelectedWhere) => void;
  label: string | null;
  placeholder: string;
}) {
  const { variant, open, setOpen, selected: _selected, setSelected, label, placeholder } = props;
  const { runPostcode, runGeolocate, setManual, busy } = useResolveViewerLocation({
    onResolved: (o) => {
      setSelected({ mode: "origin", label: o.town ?? o.postcode_outward });
      setOpen(false);
    },
  });

  const [text, setText] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<PlacesSuggestion[]>([]);
  const [placesReady, setPlacesReady] = React.useState(false);
  const sessionTokenRef = React.useRef<unknown>(null);
  const placesLibRef = React.useRef<PlacesLibrary | null>(null);

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
      } else {
        setSelected({ mode: "city", label: labelText });
        setOpen(false);
      }
    } catch {
      setSelected({ mode: "city", label: text.trim() });
      setOpen(false);
    }
  };

  const clear = () => {
    setSelected(null);
    setText("");
  };

  const triggerBase =
    variant === "dark"
      ? "group flex items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none sm:w-[200px] lg:w-[240px]"
      : "group flex w-full items-center gap-2 rounded-[12px] bg-reps-ivory px-3 py-2.5 text-left transition-colors hover:bg-reps-ivory/70 focus:outline-none";

  const iconClass = variant === "dark" ? "text-white/60" : "text-reps-muted-light";
  const labelTextClass =
    variant === "dark"
      ? label
        ? "flex-1 truncate text-[15px] font-medium text-white"
        : "flex-1 truncate text-[15px] font-medium text-white/50"
      : label
      ? "flex-1 truncate text-[14px] text-reps-charcoal"
      : "flex-1 truncate text-[14px] text-reps-muted-light";
  const clearClass =
    variant === "dark"
      ? "inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      : "inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-reps-muted-light transition-colors hover:bg-reps-ink/5 hover:text-reps-charcoal";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerBase}>
          <MapPin className={cn("h-4 w-4 shrink-0", iconClass)} aria-hidden />
          <span className={labelTextClass}>{label ?? placeholder}</span>
          {label ? (
            <span
              role="button"
              aria-label="Clear"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  clear();
                }
              }}
              className={clearClass}
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[340px] rounded-[16px] p-3"
        sideOffset={8}
      >
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
                setSelected({ mode: "city", label: text.trim() });
                setOpen(false);
              }}
              className="rounded-[10px] border border-reps-stone px-3 py-2 text-left text-[13px] text-reps-charcoal transition-colors hover:bg-reps-warm-white"
            >
              Search "{text.trim()}" as a city
            </button>
          ) : null}

          <p className="text-[11px] leading-snug text-reps-muted-light">
            We only use this to rank results by distance — it's never stored on
            our servers.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
