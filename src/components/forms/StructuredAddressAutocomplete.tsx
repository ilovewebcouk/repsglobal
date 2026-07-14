/**
 * StructuredAddressAutocomplete — Google Places (New) picker that emits
 * parsed address components (line 1, line 2, city, postcode, country code)
 * so a multi-field shipping form can be autofilled from a single pick.
 *
 * Reuses `loadPlacesLibrary()` from `@/lib/google/places` so we share the
 * same lazily-loaded script tag as the directory + hero search bars and the
 * simpler formatted-string AddressAutocomplete.
 */
import * as React from "react";
import { Check, Loader2, MapPin, X } from "lucide-react";

import {
  loadPlacesLibrary,
  type PlacesLibrary,
  type PlacesSuggestion,
} from "@/lib/google/places";

export type ParsedAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  countryCode: string;
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type Props = {
  onSelect: (parts: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
};

const inputCls =
  "h-10 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 pr-9 text-[13px] text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none";

function pickComponent(
  comps: AddressComponent[],
  types: string[],
  short = false,
): string {
  for (const t of types) {
    const c = comps.find((x) => (x.types ?? []).includes(t));
    if (c) return (short ? c.shortText : c.longText) ?? "";
  }
  return "";
}

function parse(comps: AddressComponent[]): ParsedAddress {
  const streetNumber = pickComponent(comps, ["street_number"]);
  const route = pickComponent(comps, ["route"]);
  const premise = pickComponent(comps, ["premise"]);
  const subpremise = pickComponent(comps, ["subpremise"]);

  let line1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  let line2 = subpremise;
  if (!line1) {
    // No numbered street — fall back to premise / subpremise + route.
    line1 = [premise || subpremise, route].filter(Boolean).join(" ").trim();
    if (line1 === subpremise) line2 = "";
  }

  const city = pickComponent(comps, [
    "postal_town",
    "locality",
    "administrative_area_level_2",
    "sublocality_level_1",
  ]);
  const postcode = pickComponent(comps, ["postal_code"]);
  const countryCode = pickComponent(comps, ["country"], true).toUpperCase();

  return {
    addressLine1: line1,
    addressLine2: line2,
    city,
    postcode,
    countryCode,
  };
}

export function StructuredAddressAutocomplete({
  onSelect,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<PlacesSuggestion[]>([]);
  const [placesReady, setPlacesReady] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState(false);
  const placesLibRef = React.useRef<PlacesLibrary | null>(null);
  const sessionTokenRef = React.useRef<unknown>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

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
    setLoading(true);
    placesLibRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: debounced,
      sessionToken: sessionTokenRef.current,
    })
      .then(({ suggestions: s }) => {
        if (!cancelled) setSuggestions(s ?? []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, placesReady]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = async (s: PlacesSuggestion) => {
    try {
      const place = s.placePrediction.toPlace() as unknown as {
        fetchFields: (opts: { fields: string[] }) => Promise<void>;
        addressComponents?: AddressComponent[];
        formattedAddress?: string;
      };
      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress"],
      });
      const parts = parse(place.addressComponents ?? []);
      onSelect(parts);
      setText(place.formattedAddress ?? s.placePrediction.text.text ?? "");
      setSelected(true);
      setOpen(false);
      if (placesLibRef.current) {
        sessionTokenRef.current = new placesLibRef.current.AutocompleteSessionToken();
      }
    } catch {
      setOpen(false);
    }
  };

  const clear = () => {
    setText("");
    setSelected(false);
    setSuggestions([]);
    setOpen(true);
    // Re-focus so the user can immediately type a new search
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <input
        ref={inputRef}
        type="text"
        className={inputCls}
        value={text}
        placeholder={placeholder ?? "Start typing your address…"}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setSelected(false);
          if (!open) setOpen(true);
        }}
        autoComplete="off"
        spellCheck={false}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/40">
        {selected ? (
          <Check className="h-3.5 w-3.5 text-emerald-300" aria-label="Address selected" />
        ) : null}
        {loading ? (
          <Loader2 className="pointer-events-none h-3.5 w-3.5 animate-spin" />
        ) : text ? (
          <button
            type="button"
            aria-label="Clear address"
            onClick={clear}
            className="rounded-full p-0.5 hover:bg-white/10 hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <MapPin className="pointer-events-none h-3.5 w-3.5" />
        )}
      </span>

      {selected ? (
        <p className="mt-1 text-[11.5px] text-white/45">
          Address selected — edit the fields below to adjust, or clear to search again.
        </p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-[12px] border border-reps-border bg-reps-panel-soft py-1 shadow-lg"
        >
          {suggestions.map((s) => {
            const main =
              s.placePrediction.structuredFormat?.mainText?.text ??
              s.placePrediction.text.text;
            const secondary =
              s.placePrediction.structuredFormat?.secondaryText?.text ?? null;
            return (
              <li key={s.placePrediction.placeId}>
                <button
                  type="button"
                  onClick={() => void pick(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-white">
                      {main}
                    </span>
                    {secondary ? (
                      <span className="block truncate text-[11.5px] text-white/50">
                        {secondary}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
