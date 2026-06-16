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
  // Initial render returns null on both server and client to avoid hydration
  // mismatches. localStorage is read after mount; consumers refetch when
  // `origin` changes from null → value.
  const [origin, setOriginState] = React.useState<ViewerOrigin | null>(null);

  React.useEffect(() => {
    setOriginState(read());
    const onChange = () => setOriginState(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) onChange();
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onStorage);
    };
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
