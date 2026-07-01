// Admin Activity v1.2 — GA-style world map with country bubbles.
//
// Amendment 2: The route (`admin_.activity.tsx`) uses `ssr: false`, so
// react-simple-maps loads only on the client. If topojson fetch fails, we
// render an honest fallback list rather than crashing the map area.
// Amendment 5: "Unknown country" bubbles are excluded from the map — they
// are only surfaced in the Top Countries list.

import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from "react-simple-maps";
import { AlertTriangle, Globe, Minus, Plus, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { countryDisplay, COUNTRY_NAMES } from "@/lib/activity/labels";
import { COUNTRY_CENTROIDS, centroidFor } from "@/lib/geo/country-centroids";
import type { GeoRow } from "@/lib/ops/activity-panels.functions";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface WorldMapPanelProps {
  countries: GeoRow[];
  loading: boolean;
  selectedCountry?: string;
  onSelectCountry: (cc: string | undefined) => void;
}

interface Bubble {
  cc: string;
  name: string;
  lng: number;
  lat: number;
  online: number;
  views: number;
  radius: number;
}

export function WorldMapPanel({ countries, loading, selectedCountry, onSelectCountry }: WorldMapPanelProps) {
  const [mapError, setMapError] = useState(false);
  const [hoverCc, setHoverCc] = useState<string | null>(null);

  const bubbles = useMemo<Bubble[]>(() => {
    const withGeo = countries
      .filter((c) => c.country_code !== "??" && c.country_code !== "XX")
      .map((c) => {
        const centroid = centroidFor(c.country_code);
        if (!centroid) return null;
        return { c, centroid };
      })
      .filter((x): x is { c: GeoRow; centroid: NonNullable<ReturnType<typeof centroidFor>> } => x !== null);

    const maxViews = Math.max(1, ...withGeo.map(({ c }) => c.page_views_24h));
    return withGeo.map(({ c, centroid }) => {
      const scale = Math.sqrt(c.page_views_24h / maxViews);
      return {
        cc: c.country_code,
        name: COUNTRY_NAMES[c.country_code] ?? centroid.name,
        lng: centroid.lng,
        lat: centroid.lat,
        online: c.online_now,
        views: c.page_views_24h,
        radius: Math.max(4, 4 + scale * 22),
      };
    });
  }, [countries]);

  // Auto-fit: pick a viewport based on where activity actually is. Prefer
  // live (online > 0); fall back to any 24h activity. This gives GB-only
  // traffic a gentle zoom toward GB, and multi-country traffic a bounds-fit.
  const autoView = useMemo(() => {
    const live = bubbles.filter((b) => b.online > 0);
    const pool = live.length > 0 ? live : bubbles;
    if (pool.length === 0) return { center: [10, 20] as [number, number], zoom: 1 };
    if (pool.length === 1) {
      const b = pool[0]!;
      return { center: [b.lng, b.lat] as [number, number], zoom: 3.2 };
    }
    const lngs = pool.map((b) => b.lng);
    const lats = pool.map((b) => b.lat);
    const cx = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const cy = (Math.min(...lats) + Math.max(...lats)) / 2;
    const spanLng = Math.max(...lngs) - Math.min(...lngs);
    const spanLat = Math.max(...lats) - Math.min(...lats);
    const span = Math.max(spanLng, spanLat);
    // Rough heuristic: broader spread → smaller zoom, capped for context.
    const zoom = span < 20 ? 3 : span < 60 ? 2 : span < 120 ? 1.5 : 1;
    return { center: [cx, cy] as [number, number], zoom };
  }, [bubbles]);

  // Local zoom/center override so admins can pan and reset.
  const [override, setOverride] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const view = override ?? autoView;
  // Re-key ZoomableGroup so react-simple-maps applies the new center/zoom
  // when the fitted view changes (e.g. new live activity arrives).
  const viewKey = `${view.center[0].toFixed(1)}:${view.center[1].toFixed(1)}:${view.zoom.toFixed(2)}`;

  const totalOnline = bubbles.reduce((s, b) => s + b.online, 0);
  const totalViews = bubbles.reduce((s, b) => s + b.views, 0);
  const unknownCountry = countries.find((c) => c.country_code === "??" || c.country_code === "XX");

  return (
    <section className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
      <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-white/60" />
          <div className="min-w-0">
            <h2 className="truncate font-display text-[14px] font-semibold text-white">
              Realtime member activity map
            </h2>
            <p className="truncate text-[11px] text-white/45">
              Country-level bubbles · logged-in member activity only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10.5px] text-white/55">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {totalOnline} online
          </span>
          <span className="text-white/25">·</span>
          <span>{totalViews.toLocaleString()} views 24h</span>
        </div>
      </header>

      <div className="relative">
        {mapError ? (
          <MapFallback bubbles={bubbles} loading={loading} onSelect={onSelectCountry} selected={selectedCountry} />
        ) : (
          <div
            className="relative h-[460px] w-full"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, #1a2436 0%, #0e141d 55%, #080c13 100%)",
            }}
          >
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 175 }}
              width={980}
              height={500}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup
                key={viewKey}
                center={view.center}
                zoom={view.zoom}
                minZoom={0.9}
                maxZoom={6}
                onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) =>
                  setOverride({ center: coordinates, zoom })
                }
              >
                <Geographies geography={GEO_URL} onError={() => setMapError(true)}>
                  {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name?: string } }> }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: { fill: "#243244", stroke: "#3a4a60", strokeWidth: 0.6, outline: "none" },
                          hover:   { fill: "#2c3c52", stroke: "#4a5c76", strokeWidth: 0.8, outline: "none" },
                          pressed: { fill: "#2c3c52", stroke: "#4a5c76", strokeWidth: 0.8, outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>
                {bubbles.map((b) => {
                  const isSelected = selectedCountry === b.cc;
                  const isHover = hoverCc === b.cc;
                  const isLive = b.online > 0;
                  const dim = selectedCountry && !isSelected ? 0.35 : 1;
                  return (
                    <Marker key={b.cc} coordinates={[b.lng, b.lat]}
                      onMouseEnter={() => setHoverCc(b.cc)}
                      onMouseLeave={() => setHoverCc((v) => (v === b.cc ? null : v))}
                      onClick={() => onSelectCountry(isSelected ? undefined : b.cc)}
                      style={{ default: { cursor: "pointer", opacity: dim }, hover: { cursor: "pointer", opacity: 1 }, pressed: { cursor: "pointer" } }}
                    >
                      {isLive ? (
                        <>
                          <circle r={b.radius + 12} fill="rgba(249,115,22,0.08)" className="animate-ping" style={{ animationDuration: "2.4s" }} />
                          <circle r={b.radius + 6} fill="rgba(249,115,22,0.18)" />
                        </>
                      ) : null}
                      <circle
                        r={b.radius}
                        fill={
                          isSelected
                            ? "#F97316"
                            : isLive
                              ? "rgba(249,115,22,0.95)"
                              : "rgba(125,211,252,0.55)"
                        }
                        stroke={isSelected || isHover ? "#fff" : isLive ? "rgba(255,255,255,0.85)" : "rgba(125,211,252,0.9)"}
                        strokeWidth={isSelected ? 2.5 : isHover ? 1.8 : 1.2}
                      />
                      {isHover || isSelected || b.radius > 10 ? (
                        <text
                          y={-b.radius - 5}
                          textAnchor="middle"
                          style={{
                            fontFamily: "system-ui, sans-serif",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            fill: "#fff",
                            paintOrder: "stroke",
                            stroke: "rgba(0,0,0,0.65)",
                            strokeWidth: 3,
                            pointerEvents: "none",
                          }}
                        >
                          {b.cc}
                        </text>
                      ) : null}
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>

            {/* Hover tooltip */}
            {hoverCc ? <MapTooltip bubble={bubbles.find((b) => b.cc === hoverCc) ?? null} /> : null}

            {/* Zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-[10px] border border-white/10 bg-black/60 p-1 backdrop-blur-md">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setOverride({ center: view.center, zoom: Math.min(6, view.zoom * 1.5) })}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setOverride({ center: view.center, zoom: Math.max(0.9, view.zoom / 1.5) })}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Reset to world view"
                onClick={() => setOverride({ center: [10, 20], zoom: 1 })}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-white/80 hover:bg-white/10 hover:text-white"
                title="Reset to world view"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>


            {/* Legend */}
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10.5px] text-white/80 backdrop-blur-md">
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-reps-orange opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-reps-orange" />
                </span>
                Live · online now
              </span>
              <span className="text-white/25">·</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-300/70 ring-1 ring-sky-200/80" /> 24h activity</span>
              {selectedCountry ? (
                <>
                  <span className="text-white/25">·</span>
                  <button
                    type="button"
                    onClick={() => onSelectCountry(undefined)}
                    className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-white/20"
                  >
                    Clear filter <X className="h-2.5 w-2.5" />
                  </button>
                </>
              ) : null}
            </div>

            {loading && bubbles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/40">
                Loading map…
              </div>
            ) : bubbles.length === 0 && !loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                <Globe className="h-6 w-6 text-white/25" />
                <div className="text-[12px] font-medium text-white/60">No country activity yet</div>
                <div className="max-w-[280px] text-[10.5px] text-white/40">
                  Country bubbles appear here as logged-in members are active.
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Unknown-country strip (Amendment 5) */}
        {unknownCountry && (unknownCountry.online_now > 0 || unknownCountry.page_views_24h > 0) ? (
          <div className="flex items-center justify-between gap-2 border-t border-reps-border/60 bg-white/5 px-4 py-2 text-[11px] text-white/60">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium text-white/75">Unknown country</span>
              <span className="text-white/45">Location unresolved · {unknownCountry.online_now} online · {unknownCountry.page_views_24h} views 24h</span>
            </span>
            <span className="text-[10px] text-white/35">Not shown on map</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MapTooltip({ bubble }: { bubble: Bubble | null }) {
  if (!bubble) return null;
  const d = countryDisplay(bubble.cc);
  return (
    <div className="pointer-events-none absolute right-3 top-3 rounded-[10px] border border-reps-border bg-reps-panel/95 px-3 py-2 text-[11px] text-white/85 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 font-semibold text-white">
        <span className="text-[14px]">{d.flag}</span>
        {d.label}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-white/60">
        <span>Online now</span><span className="text-right font-medium text-emerald-300">{bubble.online}</span>
        <span>Views 24h</span><span className="text-right font-medium text-white/85">{bubble.views.toLocaleString()}</span>
      </div>
    </div>
  );
}

function MapFallback({
  bubbles, loading, onSelect, selected,
}: { bubbles: Bubble[]; loading: boolean; onSelect: (cc: string | undefined) => void; selected?: string }) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Map failed to load — showing country list instead.
      </div>
      {loading ? (
        <div className="text-[12px] text-white/40">Loading…</div>
      ) : (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {bubbles.map((b) => (
            <li key={b.cc}>
              <button
                type="button"
                onClick={() => onSelect(selected === b.cc ? undefined : b.cc)}
                className={cn(
                  "flex w-full items-center justify-between rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1.5 text-left text-[11px] hover:bg-white/10",
                  selected === b.cc && "border-reps-orange bg-reps-orange/10",
                )}
              >
                <span className="truncate text-white/85">{b.name}</span>
                <span className="shrink-0 text-white/55">{b.online} online · {b.views.toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Client-only guard used by the route: react-simple-maps must not run during
// SSR. The route is already `ssr: false`, but we double-guard for HMR.
export function ClientOnlyMap(props: WorldMapPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="h-[380px] w-full animate-pulse rounded-[18px] border border-reps-border bg-reps-panel" />
    );
  }
  return <WorldMapPanel {...props} />;
}

// keep bundlers happy — referenced for tree-shaking sanity
void COUNTRY_CENTROIDS;
