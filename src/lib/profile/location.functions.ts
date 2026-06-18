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
  region: string | null;
  longitude: number;
  latitude: number;
  ttwa: string | null;
  bua: string | null;
  parish: string | null;
};

/**
 * Pick the most recognisable place name for a postcode.
 *
 * postcodes.io's `post_town` field is always null on the free tier, so we
 * fall back to the Travel-to-Work Area (which maps cleanly: NR32 → Lowestoft,
 * SW1A → London, M1 → Manchester, EH1 → Edinburgh). `bua` and `admin_district`
 * are last-ditch fallbacks; `admin_district` is council-level ("East Suffolk")
 * which we want to avoid showing publicly.
 */
function deriveTown(r: PostcodesIoResult): string | null {
  const raw = r.ttwa ?? r.bua ?? r.parish ?? r.admin_district;
  if (!raw) return null;
  // bua values like "Leeds (Leeds)" — strip the parenthetical suffix.
  return raw.replace(/\s*\(.+\)\s*$/, "").trim() || null;
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
    const town = deriveTown(r);

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
      region: r.region,
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
      region: r.region,
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
