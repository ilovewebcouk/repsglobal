import * as React from "react";

const KEY = "reps:viewerOrigin";

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

export function useViewerOrigin() {
  const [origin, setOriginState] = React.useState<ViewerOrigin | null>(() => read());

  // Cross-tab sync
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setOriginState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setOrigin = React.useCallback((v: ViewerOrigin | null) => {
    if (typeof window === "undefined") return;
    if (v) {
      window.localStorage.setItem(KEY, JSON.stringify(v));
    } else {
      window.localStorage.removeItem(KEY);
    }
    setOriginState(v);
  }, []);

  return { origin, setOrigin };
}
