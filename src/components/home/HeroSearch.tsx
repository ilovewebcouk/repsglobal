/**
 * Homepage hero search — 10/10 build.
 *
 * "What" field   → shadcn Command combobox over PROFESSIONS + SPECIALISMS
 *                   + synonyms ("PT", "bad back", "prenatal" all route).
 * "Where" field  → Google Places (New) autocomplete + geolocate + UK
 *                   postcode shortcut. Resolved location is persisted via
 *                   useViewerOrigin so nearest-sort works on results.
 *
 * Submit is deterministic:
 *   - profession picked → ?profession=<slug>
 *   - specialism / mode → ?specialism=<slug>
 *   - free text fallback → ?q=<text>
 *   - location resolved → ?sort=nearest, else ?city=<text>
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

type SelectedWhat =
  | { mode: "entry"; entry: SearchEntry }
  | { mode: "free"; text: string }
  | null;

type SelectedWhere =
  | { mode: "origin"; label: string }
  | { mode: "city"; label: string }
  | null;


export function HomeHeroSearch() {
  const navigate = useNavigate();
  const { origin } = useViewerOrigin();

  const [whatOpen, setWhatOpen] = React.useState(false);
  const [whatQuery, setWhatQuery] = React.useState("");
  const [what, setWhat] = React.useState<SelectedWhat>(null);

  const [whereOpen, setWhereOpen] = React.useState(false);
  const [where, setWhere] = React.useState<SelectedWhere>(
    origin ? { mode: "origin", label: origin.town ?? origin.postcode_outward } : null,
  );

  // Keep where label in sync if the origin changes elsewhere.
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
      sort: "recommended" | "nearest" | "rating";
    } = { page: 1, sort: "recommended" };

    if (what?.mode === "entry") {
      if (what.entry.route.profession) search.profession = what.entry.route.profession;
      if (what.entry.route.specialism) search.specialism = what.entry.route.specialism;
    } else if (what?.mode === "free") {
      const t = what.text.trim();
      if (t) search.q = t;
    } else if (whatQuery.trim()) {
      // user typed without selecting → treat as free text
      search.q = whatQuery.trim();
    }

    if (origin) {
      search.sort = "nearest";
    } else if (where?.mode === "city") {
      search.city = where.label;
    }

    navigate({ to: "/find-a-professional", search });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-rise-in mt-8 flex flex-col gap-2 rounded-[22px] border border-white/10 bg-reps-ink/60 p-2 backdrop-blur-md sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
      style={{ animationDelay: "320ms" }}
    >
      {/* WHAT — combobox */}
      <WhatField
        open={whatOpen}
        setOpen={setWhatOpen}
        query={whatQuery}
        setQuery={setWhatQuery}
        selected={what}
        setSelected={setWhat}
        label={whatLabel}
        onSubmitForm={handleSubmit}
      />

      <span aria-hidden className="hidden h-8 w-px self-center bg-white/10 sm:block" />

      {/* WHERE — places + geolocate + postcode */}
      <WhereField
        open={whereOpen}
        setOpen={setWhereOpen}
        selected={where}
        setSelected={setWhere}
        label={whereLabel}
      />

      <button
        type="submit"
        className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,122,0,0.6)] transition-all hover:bg-reps-orange-dark hover:shadow-[0_14px_38px_-10px_rgba(255,122,0,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Search className="h-4 w-4" aria-hidden />
        Find your coach
      </button>
    </form>
  );
}

// ---------------------------------------------------------------- WhatField

function WhatField(props: {
  open: boolean;
  setOpen: (b: boolean) => void;
  query: string;
  setQuery: (s: string) => void;
  selected: SelectedWhat;
  setSelected: (s: SelectedWhat) => void;
  label: string | null;
  onSubmitForm: (e: React.FormEvent) => void;
}) {
  const { open, setOpen, query, setQuery, selected, setSelected, label } = props;

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex flex-1 items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none"
        >
          <Search className="h-4 w-4 shrink-0 text-reps-orange" aria-hidden />
          <span
            className={
              label
                ? "flex-1 truncate text-[15px] font-medium text-white"
                : "flex-1 truncate text-[15px] font-medium text-white/50"
            }
          >
            {label ?? "Personal trainer, fat loss, yoga…"}
          </span>
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
              className="ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
            placeholder="Try 'PT', 'fat loss', 'bad back', 'yoga'…"
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
                {(["Professions", "Goals & specialisms", "Training mode"] as const).map(
                  (group) =>
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
  open: boolean;
  setOpen: (b: boolean) => void;
  selected: SelectedWhere;
  setSelected: (s: SelectedWhere) => void;
  label: string | null;
}) {
  const { open, setOpen, selected, setSelected, label } = props;
  const { runPostcode, runGeolocate, setManual, busy } =
    useResolveViewerLocation({
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
  const placesLibRef = React.useRef<{
    AutocompleteSuggestion: {
      fetchAutocompleteSuggestions: (req: Record<string, unknown>) => Promise<{ suggestions: PlacesSuggestion[] }>;
    };
    AutocompleteSessionToken: new () => unknown;
  } | null>(null);

  // Lazy-load Places JS on first open.
  React.useEffect(() => {
    if (!open || placesReady) return;
    void loadPlacesLibrary()
      .then((lib) => {
        placesLibRef.current = lib;
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
        setPlacesReady(true);
      })
      .catch(() => {
        // If Places fails to load, the postcode + geolocate paths still work.
        setPlacesReady(false);
      });
  }, [open, placesReady]);

  // Debounce input.
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text.trim()), 220);
    return () => window.clearTimeout(id);
  }, [text]);

  // Fetch suggestions.
  React.useEffect(() => {
    if (!debounced || !placesReady || !placesLibRef.current) {
      setSuggestions([]);
      return;
    }
    if (UK_POSTCODE_RE.test(debounced)) {
      // Postcode handled separately as a top shortcut — still surface
      // Places results as fallback.
    }
    let cancelled = false;
    placesLibRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: debounced,
      includedRegionCodes: ["gb"],
      includedPrimaryTypes: ["locality", "postal_code", "postal_town", "administrative_area_level_2"],
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
        // No coords → fall back to city text mode.
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none sm:w-[200px] lg:w-[240px]"
        >
          <MapPin className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
          <span
            className={
              label
                ? "flex-1 truncate text-[15px] font-medium text-white"
                : "flex-1 truncate text-[15px] font-medium text-white/50"
            }
          >
            {label ?? "City or postcode"}
          </span>
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
              className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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

// ------------------------------------------------------- Places JS loader

let placesPromise: Promise<NonNullable<unknown>> | null = null;

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (name: string) => Promise<unknown>;
      };
    };
    __repsHeroPlacesInit?: () => void;
  }
}

function loadPlacesLibrary(): Promise<{
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (req: Record<string, unknown>) => Promise<{ suggestions: PlacesSuggestion[] }>;
  };
  AutocompleteSessionToken: new () => unknown;
}> {
  if (placesPromise) return placesPromise as Promise<never>;

  placesPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Places JS requires a browser."));
      return;
    }

    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
      | string
      | undefined;
    if (!key) {
      reject(new Error("Google Maps browser key not configured."));
      return;
    }

    const ensureLib = async () => {
      const importLibrary = window.google?.maps?.importLibrary;
      if (!importLibrary) throw new Error("Google Maps API not ready.");
      const lib = (await importLibrary("places")) as {
        AutocompleteSuggestion: {
          fetchAutocompleteSuggestions: (
            req: Record<string, unknown>,
          ) => Promise<{ suggestions: PlacesSuggestion[] }>;
        };
        AutocompleteSessionToken: new () => unknown;
      };
      resolve(lib);
    };

    if (window.google?.maps?.importLibrary) {
      void ensureLib().catch(reject);
      return;
    }

    window.__repsHeroPlacesInit = () => {
      void ensureLib().catch(reject);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-reps-places="1"]',
    );
    if (existing) {
      // Another mount is already loading the script — wait for it.
      const checker = window.setInterval(() => {
        if (window.google?.maps?.importLibrary) {
          window.clearInterval(checker);
          void ensureLib().catch(reject);
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(checker);
      }, 8000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places&loading=async&callback=__repsHeroPlacesInit`;
    script.async = true;
    script.defer = true;
    script.dataset.repsPlaces = "1";
    script.onerror = () => reject(new Error("Failed to load Google Maps JS."));
    document.head.appendChild(script);
  });

  return placesPromise as Promise<never>;
}
