/**
 * Google Maps (New) loader — reuses the same script injection as
 * `loadPlacesLibrary` so the API is loaded exactly once per session.
 */

declare global {
  interface Window {
    __repsPlacesInit?: () => void;
  }
}

export type MapsLibrary = {
  Map: new (
    container: HTMLElement,
    options?: Record<string, unknown>,
  ) => GoogleMapInstance;
  Marker: new (options?: Record<string, unknown>) => GoogleMarker;
  Circle: new (options?: Record<string, unknown>) => GoogleCircle;
  LatLng: new (lat: number, lng: number) => GoogleLatLng;
  LatLngBounds: new () => GoogleLatLngBounds;
  event: {
    addListener: (
      instance: unknown,
      event: string,
      handler: () => void,
    ) => void;
    removeListener: (listener: unknown) => void;
  };
};

export type GoogleMapInstance = {
  setCenter: (latLng: unknown) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: unknown, padding?: number) => void;
  panTo: (latLng: unknown) => void;
  getBounds: () => unknown | null;
};

export type GoogleMarker = {
  setMap: (map: GoogleMapInstance | null) => void;
  setIcon: (icon: unknown) => void;
  setZIndex: (z: number) => void;
  addListener: (event: string, handler: () => void) => void;
  getPosition: () => unknown | null;
};

export type GoogleCircle = {
  setMap: (map: GoogleMapInstance | null) => void;
};

export type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

export type GoogleLatLngBounds = {
  extend: (latLng: unknown) => void;
};

let mapsPromise: Promise<MapsLibrary> | null = null;

export async function loadMapsLibrary(): Promise<MapsLibrary> {
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Maps JS requires a browser."));
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
      // Load every namespace we use (core = LatLng/LatLngBounds, maps = Map/Marker/Circle).
      await Promise.all([importLibrary("core"), importLibrary("maps")]);
      // The full `google.maps` namespace is the library — `importLibrary("maps")`
      // alone doesn't include LatLng/LatLngBounds (those live in "core").
      resolve(window.google!.maps as unknown as MapsLibrary);
    };

    if (window.google?.maps?.importLibrary) {
      void ensureLib().catch(reject);
      return;
    }

    // Reuse the same callback / script tag that places.ts uses.
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

    // Script not present yet — inject it ourselves (same URL as places.ts).
    window.__repsPlacesInit = () => {
      void ensureLib().catch(reject);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places&loading=async&callback=__repsPlacesInit`;
    script.async = true;
    script.defer = true;
    script.dataset.repsPlaces = "1";
    script.onerror = () => reject(new Error("Failed to load Google Maps JS."));
    document.head.appendChild(script);
  });

  return mapsPromise;
}
