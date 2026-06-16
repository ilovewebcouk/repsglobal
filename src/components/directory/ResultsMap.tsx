/**
 * ResultsMap — Google Maps view for /find-a-professional.
 *
 * Renders an orange pin per pro with valid coords, fits bounds to the
 * visible set (plus viewer origin if set), syncs hover state with the
 * results list, and navigates to /pro/$slug on pin click.
 *
 * Pure presentation: parent owns pros / origin / hoveredSlug.
 */

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  loadMapsLibrary,
  type GoogleMapInstance,
  type GoogleMarker,
  type MapsLibrary,
} from "@/lib/google/maps";
import { Crosshair, Loader2, Maximize2, Minimize2 } from "lucide-react";

export type MapPro = {
  slug: string;
  name: string;
  from_price_pence: number | null;
  coords?: { latitude: number; longitude: number };
};

type Props = {
  pros: MapPro[];
  origin: { latitude: number; longitude: number } | null;
  hoveredSlug: string | null;
  onHover?: (slug: string | null) => void;
  className?: string;
  /** When provided, renders an Airbnb-style expand pill (lg+ only). */
  expanded?: boolean;
  onToggleExpand?: () => void;
};


// Inline SVG pin (data URI) — orange dot with white ring + price chip.
function pinIcon(active: boolean, priceLabel: string | null) {
  const fill = active ? "#1A1A1A" : "#EA580C";
  const text = active ? "#FFFFFF" : "#FFFFFF";
  const width = priceLabel ? 64 : 28;
  const svg = priceLabel
    ? `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='34' viewBox='0 0 ${width} 34'>
        <rect x='0.5' y='0.5' width='${width - 1}' height='25' rx='12.5' fill='${fill}' stroke='white' stroke-width='2'/>
        <text x='${width / 2}' y='17' text-anchor='middle' font-family='-apple-system,Segoe UI,Roboto,Inter,sans-serif' font-size='12' font-weight='700' fill='${text}'>${priceLabel}</text>
        <path d='M${width / 2 - 5} 25 L${width / 2 + 5} 25 L${width / 2} 33 Z' fill='${fill}' stroke='white' stroke-width='2' stroke-linejoin='round'/>
      </svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='34' viewBox='0 0 28 34'>
        <circle cx='14' cy='14' r='11.5' fill='${fill}' stroke='white' stroke-width='2'/>
        <path d='M9 24 L19 24 L14 33 Z' fill='${fill}' stroke='white' stroke-width='2' stroke-linejoin='round'/>
      </svg>`;
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize: { width, height: 34 },
    anchor: { x: width / 2, y: 33 },
  };
}

function priceShort(pence: number | null): string | null {
  if (pence == null) return null;
  const p = Math.round(pence / 100);
  return `£${p}`;
}

// Subtle dark-mode-friendly Google Maps style.
const MAP_STYLES = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
];

export function ResultsMap({ pros, origin, hoveredSlug, onHover, className, expanded, onToggleExpand }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<GoogleMapInstance | null>(null);
  const libRef = React.useRef<MapsLibrary | null>(null);
  const markersRef = React.useRef<Map<string, GoogleMarker>>(new Map());
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const navigate = useNavigate();

  const validPros = React.useMemo(() => pros.filter((p) => p.coords), [pros]);

  // Load + init map once.
  React.useEffect(() => {
    let cancelled = false;
    loadMapsLibrary()
      .then((lib) => {
        if (cancelled || !ref.current) return;
        libRef.current = lib;
        const center = origin
          ? { lat: origin.latitude, lng: origin.longitude }
          : { lat: 54.2, lng: -2.5 };
        mapRef.current = new lib.Map(ref.current, {
          center,
          zoom: origin ? 11 : 6,
          minZoom: 5,
          maxZoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: MAP_STYLES,
        });
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[ResultsMap] failed to load Google Maps", err);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers + fit bounds whenever pros or origin change.
  React.useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || status !== "ready") return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    if (validPros.length === 0 && !origin) return;

    // When an origin is set, only pin the nearest ~12 pros within a tight
    // window so the bounds stay local. Without origin, we pin everything
    // in the current page (already capped by pagination).
    const PIN_LIMIT = origin ? 12 : validPros.length;
    const NEAR_RADIUS_MI = 60;
    const toMiles = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
      const R = 3958.7613;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(b.latitude - a.latitude);
      const dLng = toRad(b.longitude - a.longitude);
      const lat1 = toRad(a.latitude);
      const lat2 = toRad(b.latitude);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    };
    let pinList = validPros;
    if (origin) {
      pinList = validPros
        .map((p) => ({ p, d: toMiles(origin, p.coords!) }))
        .filter((x) => x.d <= NEAR_RADIUS_MI)
        .sort((a, b) => a.d - b.d)
        .slice(0, PIN_LIMIT)
        .map((x) => x.p);
    }

    const bounds = new lib.LatLngBounds();

    pinList.forEach((p) => {
      const isActive = p.slug === hoveredSlug;
      const marker = new lib.Marker({
        position: { lat: p.coords!.latitude, lng: p.coords!.longitude },
        map,
        icon: pinIcon(isActive, priceShort(p.from_price_pence)),
        zIndex: isActive ? 999 : 1,
        title: p.name,
      });
      marker.addListener("click", () => {
        navigate({ to: "/pro/$slug", params: { slug: p.slug } });
      });
      marker.addListener("mouseover", () => onHover?.(p.slug));
      marker.addListener("mouseout", () => onHover?.(null));
      markersRef.current.set(p.slug, marker);
      bounds.extend(new lib.LatLng(p.coords!.latitude, p.coords!.longitude));
    });

    if (origin) bounds.extend(new lib.LatLng(origin.latitude, origin.longitude));

    if (!origin) {
      // No location set → don't zoom to global pros (that's how we end up
      // viewing the whole world). Hold a steady UK-centered view that
      // reads well on both mobile and desktop without showing Europe.
      map.setCenter({ lat: 54.2, lng: -2.5 });
      map.setZoom(6);
    } else if (pinList.length === 0) {
      // Origin set but nothing nearby — center on origin at city zoom.
      map.setCenter({ lat: origin.latitude, lng: origin.longitude });
      map.setZoom(11);
    } else {
      map.fitBounds(bounds, 64);
      // Clamp maxZoom after fit so a single nearby pin doesn't snap to street level.
      const listenerLib = lib as unknown as { event: { addListenerOnce: (m: unknown, e: string, cb: () => void) => void } };
      listenerLib.event.addListenerOnce(map, "idle", () => {
        const z = (map as unknown as { getZoom: () => number; setZoom: (n: number) => void }).getZoom();
        if (z > 13) (map as unknown as { setZoom: (n: number) => void }).setZoom(13);
        if (z < 8) (map as unknown as { setZoom: (n: number) => void }).setZoom(10);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPros, origin, status]);

  // Update icon when hover changes (without rebuilding markers).
  React.useEffect(() => {
    if (status !== "ready") return;
    markersRef.current.forEach((marker, slug) => {
      const pro = validPros.find((p) => p.slug === slug);
      if (!pro) return;
      const active = slug === hoveredSlug;
      marker.setIcon(pinIcon(active, priceShort(pro.from_price_pence)));
      marker.setZIndex(active ? 999 : 1);
    });
  }, [hoveredSlug, validPros, status]);

  return (
    <div className={`relative overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white ${className ?? ""}`}>
      <div ref={ref} className="absolute inset-0" aria-label="Map of professionals" role="application" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-reps-muted-light">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-reps-muted-light">
          <Crosshair className="h-6 w-6" />
          <p className="text-[13px]">Couldn't load the map.</p>
        </div>
      )}
      {status === "ready" && !origin && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-medium text-reps-charcoal shadow-md ring-1 ring-reps-stone">
          Set your location to see pros near you
        </div>
      )}
      {status === "ready" && origin && validPros.length === 0 && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-medium text-reps-charcoal shadow-md ring-1 ring-reps-stone">
          No mappable professionals in this view
        </div>
      )}
      {status === "ready" && onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? "Show list" : "Expand map"}
          className="absolute right-3 top-3 z-10 hidden items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-reps-charcoal shadow-md ring-1 ring-reps-stone transition-colors hover:bg-white lg:inline-flex"
        >
          {expanded ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" />
              Show list
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5" />
              Expand map
            </>
          )}
        </button>
      )}
    </div>
  );

}
