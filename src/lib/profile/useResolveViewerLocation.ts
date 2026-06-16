import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  resolveViewerPostcode,
  resolveViewerLatLng,
} from "@/lib/profile/location.functions";
import { useViewerOrigin, type ViewerOrigin } from "@/lib/useViewerOrigin";

/**
 * Shared hook for resolving the viewer's location into a persisted
 * { postcode_outward, town, lat, lng } origin. Used by the directory
 * inline control AND the homepage hero "where" field.
 */
export function useResolveViewerLocation(opts?: { onResolved?: (o: ViewerOrigin) => void }) {
  const { origin, setOrigin } = useViewerOrigin();
  const resolvePc = useServerFn(resolveViewerPostcode);
  const resolveGeo = useServerFn(resolveViewerLatLng);

  const apply = (o: ViewerOrigin) => {
    setOrigin(o);
    opts?.onResolved?.(o);
    toast.success(`Searching from ${o.postcode_outward}.`);
  };

  const postcodeMutation = useMutation({
    mutationFn: (pc: string) => resolvePc({ data: { postcode: pc } }),
    onSuccess: (r) =>
      apply({
        postcode_outward: r.postcode_outward,
        town: r.town,
        latitude: r.latitude,
        longitude: r.longitude,
      }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Lookup failed."),
  });

  const geoMutation = useMutation({
    mutationFn: async () => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        throw new Error("Geolocation is not available in this browser.");
      }
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }),
      );
      const r = await resolveGeo({
        data: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      });
      if (!r) throw new Error("Could not match your location to a UK postcode.");
      return r;
    },
    onSuccess: (r) =>
      apply({
        postcode_outward: r.postcode_outward,
        town: r.town,
        latitude: r.latitude,
        longitude: r.longitude,
      }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Location blocked."),
  });

  const setManual = (o: ViewerOrigin) => apply(o);

  return {
    origin,
    setOrigin,
    setManual,
    runPostcode: (pc: string) => postcodeMutation.mutate(pc),
    runGeolocate: () => geoMutation.mutate(),
    busy: postcodeMutation.isPending || geoMutation.isPending,
  };
}
