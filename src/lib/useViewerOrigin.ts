import * as React from "react";

const KEY = "reps:viewerOrigin";
const EVT = "reps:viewerOrigin:change";

export type ViewerOrigin = {
  postcode_outward: string;
  town: string | null;
  latitude: number;
  longitude: number;
};

function read(): ViewerOrigin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as ViewerOrigin;
    if (
      typeof v?.latitude === "number" &&
      typeof v?.longitude === "number" &&
      typeof v?.postcode_outward === "string"
    ) {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cross-instance sync: every `useViewerOrigin()` consumer in the same tab
 * must update when ANY consumer calls setOrigin. The native `storage` event
 * only fires for OTHER tabs, so we broadcast via a custom event on window.
 */
export function useViewerOrigin() {
  // Lazy initializer reads localStorage synchronously on first render so the
  // very first query/route render already knows the origin (no useEffect race,
  // no silent "nearest sort but no origin" first paint). SSR-guarded inside read().
  const [origin, setOriginState] = React.useState<ViewerOrigin | null>(() => read());

  React.useEffect(() => {
    // Re-sync in case another tab / consumer changed it between SSR and hydration.
    const current = read();
    setOriginState((prev) => (JSON.stringify(prev) === JSON.stringify(current) ? prev : current));
    const onChange = () => setOriginState(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) onChange();
    });
    return () => window.removeEventListener(EVT, onChange);
  }, []);

  const setOrigin = React.useCallback((v: ViewerOrigin | null) => {
    if (typeof window === "undefined") return;
    if (v) {
      window.localStorage.setItem(KEY, JSON.stringify(v));
    } else {
      window.localStorage.removeItem(KEY);
    }
    setOriginState(v);
    window.dispatchEvent(new Event(EVT));
  }, []);

  return { origin, setOrigin };
}
