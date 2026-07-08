/**
 * AddressAutocomplete — Google Places (New) full-address picker.
 *
 * Renders a single-line text input with a suggestions dropdown. On pick,
 * we fetch the place's `formattedAddress` and emit it upstream. The parent
 * stores a plain string; no coordinates are captured here.
 *
 * Reuses `loadPlacesLibrary()` from `@/lib/google/places` so we share the
 * same lazily-loaded script tag as the directory + hero search bars.
 */
import * as React from "react";
import { Loader2, MapPin } from "lucide-react";

import {
  loadPlacesLibrary,
  type PlacesLibrary,
  type PlacesSuggestion,
} from "@/lib/google/places";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  /** ISO-3166-1 alpha-2 codes to bias/restrict results. Optional. */
  regionCodes?: string[];
};

const inputCls =
  "h-10 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 pr-9 text-[13px] text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none";

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  regionCodes,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(value);
  const [debounced, setDebounced] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<PlacesSuggestion[]>([]);
  const [placesReady, setPlacesReady] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const placesLibRef = React.useRef<PlacesLibrary | null>(null);
  const sessionTokenRef = React.useRef<unknown>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  // Keep local text in sync when the parent resets `value` (e.g. after load).
  React.useEffect(() => {
    setText(value);
  }, [value]);

  // Lazy-load the Places library the first time the input is focused.
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
    const req: Record<string, unknown> = {
      input: debounced,
      sessionToken: sessionTokenRef.current,
    };
    if (regionCodes && regionCodes.length > 0) {
      req.includedRegionCodes = regionCodes.map((c) => c.toLowerCase());
    }
    placesLibRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions(req)
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
  }, [debounced, placesReady, regionCodes]);

  // Close on outside click.
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
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "displayName"] });
      const addr =
        place.formattedAddress ??
        s.placePrediction.text.text ??
        place.displayName ??
        "";
      setText(addr);
      onChange(addr);
      setOpen(false);
      // Rotate session token per completed session (billing best practice).
      if (placesLibRef.current) {
        sessionTokenRef.current = new placesLibRef.current.AutocompleteSessionToken();
      }
    } catch {
      const fallback = s.placePrediction.text.text ?? "";
      setText(fallback);
      onChange(fallback);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <input
        type="text"
        className={inputCls}
        value={text}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
          if (!open) setOpen(true);
        }}
        autoComplete="off"
        spellCheck={false}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
      </span>

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
