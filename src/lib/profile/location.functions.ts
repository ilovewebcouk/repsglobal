import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type PrimaryLocation = {
  postcode: string | null; // FULL — only returned to the owning trainer
  postcode_outward: string | null;
  town: string | null;
  region: string | null;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
};

export type PublicOrigin = {
  postcode_outward: string;
  town: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
};

/* -------------------------------------------------------------------------- */
/* postcodes.io helpers (UK only, no key required)                             */
/* -------------------------------------------------------------------------- */

// UK postcode shape, tolerant of spacing/case
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function normalisePostcode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

type PostcodesIoResult = {
  postcode: string;
  outcode: string;
  admin_district: string | null;
  admin_ward: string | null;
  region: string | null;
  longitude: number;
  latitude: number;
  ttwa: string | null;
  bua: string | null;
  parish: string | null;
};

// TTWAs broad enough that the ward/neighbourhood reads better as the primary
// label, with the city kept as the secondary qualifier. Case-insensitive.
const BIG_CITY_TTWAS = new Set([
  "london",
  "manchester",
  "birmingham",
  "leeds",
  "liverpool",
  "glasgow",
  "edinburgh",
  "bristol",
  "sheffield",
  "newcastle",
  "newcastle upon tyne",
  "cardiff",
  "nottingham",
]);

function stripParenthetical(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.replace(/\s*\(.+\)\s*$/, "").trim() || null;
}

/**
 * Pick a recognisable, appropriately granular place name pair for a postcode.
 *
 * - In big-city TTWAs (London, Manchester, …) we surface the admin_ward as
 *   `town` ("Holborn and Covent Garden") and keep the TTWA city as `region`
 *   ("London"). "London" alone is too broad to be useful to a client
 *   searching by postcode.
 * - Outside big metros, we keep the previous behaviour: TTWA as `town`
 *   ("Brighton", "Lowestoft") and postcodes.io's `region` as `region`
 *   ("South East").
 *
 * `district` always carries the raw admin_ward when available.
 */
function deriveDisplay(r: PostcodesIoResult): {
  town: string | null;
  region: string | null;
  district: string | null;
} {
  const ward = stripParenthetical(r.admin_ward);
  const ttwa = stripParenthetical(r.ttwa);
  const isBigCity = !!ttwa && BIG_CITY_TTWAS.has(ttwa.toLowerCase());

  if (isBigCity && ward) {
    return { town: ward, region: ttwa, district: ward };
  }

  const fallbackTown =
    ttwa ??
    stripParenthetical(r.bua) ??
    stripParenthetical(r.parish) ??
    stripParenthetical(r.admin_district);

  return {
    town: fallbackTown,
    region: stripParenthetical(r.region),
    district: ward,
  };
}

async function lookupPostcode(pc: string): Promise<PostcodesIoResult> {
  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`,
    { headers: { accept: "application/json" } },
  );
  if (res.status === 404) {
    throw new Error("That postcode could not be found. Check it and try again.");
  }
  if (!res.ok) {
    throw new Error("Postcode lookup is temporarily unavailable. Please try again.");
  }
  const body = (await res.json()) as { result: PostcodesIoResult };
  return body.result;
}

async function reverseLookup(lat: number, lng: number): Promise<PostcodesIoResult | null> {
  const res = await fetch(
    `https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as { result: PostcodesIoResult[] | null };
  return body.result?.[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Trainer: get own primary location                                           */
/* -------------------------------------------------------------------------- */

export const getMyPrimaryLocation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<PrimaryLocation | null> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("professional_locations")
      .select(
        "postcode, postcode_outward, town, region, country_code, latitude, longitude",
      )
      .eq("professional_id", userId)
      .eq("is_primary", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      postcode: data.postcode,
      postcode_outward: data.postcode_outward,
      town: data.town,
      region: data.region,
      country_code: data.country_code ?? "GB",
      latitude: data.latitude,
      longitude: data.longitude,
    };
  });

/* -------------------------------------------------------------------------- */
/* Trainer: save primary postcode (resolves via postcodes.io)                  */
/* -------------------------------------------------------------------------- */

const SavePostcodeInput = z.object({
  postcode: z.string().trim().min(1).max(12),
});

export const saveMyPrimaryPostcode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => SavePostcodeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const pc = normalisePostcode(data.postcode);
    if (!UK_POSTCODE_RE.test(pc)) {
      throw new Error("That doesn't look like a valid UK postcode.");
    }
    const r = await lookupPostcode(pc);
    const { town, region, district } = deriveDisplay(r);

    // Does the pro already have a primary row?
    const { data: existing } = await supabase
      .from("professional_locations")
      .select("id")
      .eq("professional_id", userId)
      .eq("is_primary", true)
      .maybeSingle();

    const payload = {
      professional_id: userId,
      type: "primary" as const,
      label: "Primary training postcode",
      postcode: r.postcode,
      postcode_outward: r.outcode,
      town,
      region,
      district,
      country_code: "GB",
      latitude: r.latitude,
      longitude: r.longitude,
      is_primary: true,
      is_public: true,
    };

    if (existing) {
      const { error } = await supabase
        .from("professional_locations")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("professional_locations")
        .insert(payload);
      if (error) throw error;
    }

    // Back-compat: mirror derived town to professionals.city so any older
    // reads (admin lists, dashboard greeting) stay in sync.
    await supabase
      .from("professionals")
      .update({ city: town })
      .eq("id", userId);

    return {
      postcode_outward: r.outcode,
      town,
      region,
    };
  });

/* -------------------------------------------------------------------------- */
/* Public: resolve a viewer's postcode (used by the directory origin chip)     */
/* -------------------------------------------------------------------------- */

export const resolveViewerPostcode = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ postcode: z.string().trim().min(1).max(12) }).parse(d),
  )
  .handler(async ({ data }): Promise<PublicOrigin> => {
    const pc = normalisePostcode(data.postcode);
    if (!UK_POSTCODE_RE.test(pc)) {
      throw new Error("That doesn't look like a valid UK postcode.");
    }
    const r = await lookupPostcode(pc);
    return {
      postcode_outward: r.outcode,
      town: deriveTown(r),
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
    };
  });

export const resolveViewerLatLng = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<PublicOrigin | null> => {
    const r = await reverseLookup(data.latitude, data.longitude);
    if (!r) return null;
    return {
      postcode_outward: r.outcode,
      town: deriveTown(r),
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
    };
  });
