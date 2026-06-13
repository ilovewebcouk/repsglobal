/**
 * Google Places API (New) wrapper — server-only.
 *
 * All calls go through the Lovable connector gateway; never call Google
 * directly. The connection key is provided by the linked Google Maps
 * Platform connector.
 *
 * Used by: src/lib/gyms.functions.ts (searchGymsExternal, importGoogleGym).
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function gatewayHeaders(extra: Record<string, string> = {}): HeadersInit {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gmapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey || !gmapsKey) {
    throw new Error("Google Maps connector credentials missing on the server.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": gmapsKey,
    "Content-Type": "application/json",
    ...extra,
  };
}

export type PlacesSearchHit = {
  placeId: string;
  name: string;
  formattedAddress: string;
  locality: string | null;
  area: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  types: string[];
  businessStatus: string | null;
};

const ALLOWED_TYPES = new Set([
  "gym",
  "fitness_center",
  "health_club",
  "sports_club",
  "physical_fitness_program",
  "yoga_studio",
  "pilates_studio",
]);

function extractAddressParts(components: Array<{
  longText?: string;
  shortText?: string;
  types?: string[];
}> | undefined): { locality: string | null; area: string | null; postcode: string | null } {
  const out = { locality: null as string | null, area: null as string | null, postcode: null as string | null };
  if (!components) return out;
  for (const c of components) {
    const t = c.types ?? [];
    const v = c.longText ?? c.shortText ?? null;
    if (!v) continue;
    if (t.includes("postal_code") && !out.postcode) out.postcode = v;
    if (t.includes("postal_town") && !out.locality) out.locality = v;
    if (!out.locality && (t.includes("locality") || t.includes("administrative_area_level_2"))) out.locality = v;
    if (!out.area && (t.includes("sublocality") || t.includes("sublocality_level_1") || t.includes("neighborhood"))) {
      out.area = v;
    }
  }
  return out;
}

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.types",
  "places.businessStatus",
  "places.addressComponents",
].join(",");

/** Text search via Places API (New). Limits to fitness venues in GB by default. */
export async function placesTextSearch(query: string, opts: { regionCode?: string; maxResults?: number } = {}): Promise<PlacesSearchHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: gatewayHeaders({ "X-Goog-FieldMask": SEARCH_FIELD_MASK }),
    body: JSON.stringify({
      textQuery: q,
      regionCode: opts.regionCode ?? "GB",
      maxResultCount: Math.min(opts.maxResults ?? 8, 10),
      includedType: "gym",
      strictTypeFiltering: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places search failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      shortFormattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      types?: string[];
      businessStatus?: string;
      addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
    }>;
  };

  const hits: PlacesSearchHit[] = (json.places ?? [])
    .filter((p) => {
      const ts = p.types ?? [];
      return ts.some((t) => ALLOWED_TYPES.has(t));
    })
    .map((p) => {
      const parts = extractAddressParts(p.addressComponents);
      return {
        placeId: p.id,
        name: p.displayName?.text ?? "Unknown gym",
        formattedAddress: p.shortFormattedAddress ?? p.formattedAddress ?? "",
        locality: parts.locality,
        area: parts.area,
        postcode: parts.postcode,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        types: p.types ?? [],
        businessStatus: p.businessStatus ?? null,
      };
    });

  return hits;
}

/** Get details for a single place. Returns null if not operational or wrong type. */
export async function placeDetails(placeId: string): Promise<PlacesSearchHit | null> {
  const id = placeId.trim();
  if (!id) return null;
  const res = await fetch(`${GATEWAY_URL}/places/v1/places/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: gatewayHeaders({
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "shortFormattedAddress",
        "location",
        "types",
        "businessStatus",
        "addressComponents",
      ].join(","),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places details failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const p = (await res.json()) as {
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    types?: string[];
    businessStatus?: string;
    addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
  };
  const types = p.types ?? [];
  if (!types.some((t) => ALLOWED_TYPES.has(t))) return null;
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return null;
  const parts = extractAddressParts(p.addressComponents);
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "Unknown gym",
    formattedAddress: p.shortFormattedAddress ?? p.formattedAddress ?? "",
    locality: parts.locality,
    area: parts.area,
    postcode: parts.postcode,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    types,
    businessStatus: p.businessStatus ?? null,
  };
}

/** Geocode a free-text address (used to backfill lat/lng for curated seed gyms). */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; postcode: string | null } | null> {
  const a = address.trim();
  if (!a) return null;
  const res = await fetch(
    `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(a)}&region=gb`,
    { headers: gatewayHeaders() },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    status?: string;
    results?: Array<{
      geometry?: { location?: { lat?: number; lng?: number } };
      address_components?: Array<{ long_name?: string; types?: string[] }>;
    }>;
  };
  if (json.status !== "OK" || !json.results?.length) return null;
  const r = json.results[0];
  const lat = r.geometry?.location?.lat;
  const lng = r.geometry?.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const postcode = r.address_components?.find((c) => c.types?.includes("postal_code"))?.long_name ?? null;
  return { lat, lng, postcode };
}

/* ----------------------------- chain normalisation ----------------------------- */

/**
 * Map curated chain slugs to a matcher (case-insensitive prefix on display name).
 * Keeps in sync with the curated seed in supabase/migrations/...gyms_seed.
 */
const CHAIN_MATCHERS: Array<{ slug: string; name: string; patterns: RegExp[] }> = [
  { slug: "pure-gym", name: "PureGym", patterns: [/^puregym\b/i, /^pure gym\b/i] },
  { slug: "the-gym-group", name: "The Gym Group", patterns: [/^the gym group\b/i, /^the gym\b/i] },
  { slug: "third-space", name: "Third Space", patterns: [/^third space\b/i] },
  { slug: "barrys", name: "Barry's", patterns: [/^barry'?s\b/i] },
  { slug: "1rebel", name: "1Rebel", patterns: [/^1\s?rebel\b/i] },
  { slug: "f45", name: "F45 Training", patterns: [/^f45\b/i] },
  { slug: "david-lloyd", name: "David Lloyd", patterns: [/^david lloyd\b/i] },
  { slug: "virgin-active", name: "Virgin Active", patterns: [/^virgin active\b/i] },
  { slug: "nuffield", name: "Nuffield Health", patterns: [/^nuffield\b/i] },
  { slug: "bannatyne", name: "Bannatyne", patterns: [/^bannatyne\b/i] },
  { slug: "equinox", name: "Equinox", patterns: [/^equinox\b/i] },
  { slug: "gymbox", name: "Gymbox", patterns: [/^gymbox\b/i] },
  { slug: "bxr", name: "BXR", patterns: [/^bxr\b/i] },
  { slug: "kx", name: "KX", patterns: [/^kx\b/i] },
  { slug: "psycle", name: "Psycle", patterns: [/^psycle\b/i] },
  { slug: "frame", name: "Frame", patterns: [/^frame\b/i] },
  { slug: "embody", name: "Embody", patterns: [/^embody\b/i] },
];

export function matchChain(displayName: string): { chain_slug: string | null; chain_name: string | null } {
  const n = displayName.trim();
  for (const c of CHAIN_MATCHERS) {
    if (c.patterns.some((p) => p.test(n))) return { chain_slug: c.slug, chain_name: c.name };
  }
  return { chain_slug: null, chain_name: null };
}
