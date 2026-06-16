/**
 * Google Maps (New) loader — reuses the same script injection as
 * `loadPlacesLibrary` so the API is loaded exactly once per session.
 */

let mapsPromise: Promise<MapsLibrary> | null = null;

export type MapsLibrary = typeof import("google.maps");

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
      const lib = (await importLibrary("maps")) as MapsLibrary;
      resolve(lib);
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
    (window as Record<string, unknown>).__repsPlacesInit = () => {
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
