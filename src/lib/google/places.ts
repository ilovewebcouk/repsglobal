/**
 * Shared Google Places (New) loader + types. Loads the JS API lazily and
 * exactly once per browser session — both the homepage hero and the
 * directory results bar reuse this.
 */

export const UK_POSTCODE_RE = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d?[A-Z]{0,2}$/i;

export type PlacesSuggestion = {
  placePrediction: {
    placeId: string;
    text: { text: string };
    structuredFormat?: {
      mainText?: { text: string };
      secondaryText?: { text: string };
    };
    toPlace: () => {
      fetchFields: (opts: { fields: string[] }) => Promise<void>;
    } & {
      location?: { lat: () => number; lng: () => number };
      formattedAddress?: string;
      displayName?: string;
    };
  };
};

export type PlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (
      req: Record<string, unknown>,
    ) => Promise<{ suggestions: PlacesSuggestion[] }>;
  };
  AutocompleteSessionToken: new () => unknown;
};

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (name: string) => Promise<unknown>;
      };
    };
    __repsPlacesInit?: () => void;
  }
}

let placesPromise: Promise<PlacesLibrary> | null = null;

export function loadPlacesLibrary(): Promise<PlacesLibrary> {
  if (placesPromise) return placesPromise;

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
      const lib = (await importLibrary("places")) as PlacesLibrary;
      resolve(lib);
    };

    if (window.google?.maps?.importLibrary) {
      void ensureLib().catch(reject);
      return;
    }

    window.__repsPlacesInit = () => {
      void ensureLib().catch(reject);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-reps-places="1"]',
    );
    if (existing) {
      const checker = window.setInterval(() => {
        if (window.google?.maps?.importLibrary) {
          window.clearInterval(checker);
          void ensureLib().catch(reject);
        }
      }, 100);
      window.setTimeout(() => window.clearInterval(checker), 8000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places&loading=async&callback=__repsPlacesInit`;
    script.async = true;
    script.defer = true;
    script.dataset.repsPlaces = "1";
    script.onerror = () => reject(new Error("Failed to load Google Maps JS."));
    document.head.appendChild(script);
  });

  return placesPromise;
}
