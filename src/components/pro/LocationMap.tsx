import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

type Props = { lat: number; lng: number; label?: string };

declare global {
  interface Window {
    __repsMapInit?: () => void;
    __repsMapLoading?: Promise<void>;
  }
}


const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
  | string
  | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
  | string
  | undefined;

function loadMapsApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__repsMapLoading) return window.__repsMapLoading;
  if (!BROWSER_KEY) return Promise.reject(new Error("Maps key missing"));
  window.__repsMapLoading = new Promise<void>((resolve, reject) => {
    window.__repsMapInit = () => resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__repsMapInit",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Maps script failed"));
    document.head.appendChild(s);
  });
  return window.__repsMapLoading;
}

export function LocationMap({ lat, lng, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMapsApi()
      .then(() => {
        const g = (window as any).google;
        if (cancelled || !ref.current || !g?.maps) return;
        const map = new g.maps.Map(ref.current, {
          center: { lat, lng },
          zoom: 13,
          disableDefaultUI: true,
          gestureHandling: "cooperative",
          clickableIcons: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#ece4d3" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#5b5341" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#f4eedd" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#e0d6bf" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d8d6" }] },
          ],
        });
        new g.maps.Marker({ position: { lat, lng }, map, title: label });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, label]);

  if (failed || !BROWSER_KEY) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-reps-stone text-reps-charcoal/60">
        <MapPin className="h-6 w-6" />
      </div>
    );
  }

  return <div ref={ref} className="absolute inset-0" />;
}
