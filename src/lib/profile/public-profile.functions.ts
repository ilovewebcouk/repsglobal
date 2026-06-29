// ⚠️ NEVER select `contact_phone` in any query in this file.
// Phone numbers are internal-only (account recovery + booking alerts).
// All client ↔ pro communication routes through the platform.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type PublicLocation = {
  postcode_outward: string | null;
  town: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

async function fetchPrimaryLocations(
  proIds: string[],
): Promise<Map<string, PublicLocation>> {
  const out = new Map<string, PublicLocation>();
  if (!proIds.length) return out;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("professional_locations")
    .select("professional_id, postcode_outward, town, region, latitude, longitude")
    .in("professional_id", proIds)
    .eq("is_primary", true)
    .eq("is_public", true);
  for (const r of data ?? []) {
    out.set(r.professional_id, {
      postcode_outward: r.postcode_outward,
      town: r.town,
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
    });
  }
  return out;
}

const PRO_PUBLIC_COLUMNS =
  "id, slug, headline, primary_profession, bio, specialisms, city, country, online_available, in_person_available, hourly_rate_pence, verification_status, is_published, member_since";

const PRO_LIST_COLUMNS =
  "id, slug, headline, primary_profession, specialisms, city, country, hourly_rate_pence, verification_status, in_person_available, online_available";

type ProPublicRow = {
  id: string;
  slug: string | null;
  headline: string | null;
  primary_profession: string | null;
  bio: string | null;
  specialisms: string[] | null;
  city: string | null;
  country: string | null;
  online_available: boolean | null;
  in_person_available: boolean | null;
  hourly_rate_pence: number | null;
  verification_status: string | null;
  is_published: boolean | null;
  member_since: string | null;
};

type ProListRow = {
  id: string;
  slug: string | null;
  headline: string | null;
  primary_profession: string | null;
  specialisms: string[] | null;
  city: string | null;
  country: string | null;
  hourly_rate_pence: number | null;
  verification_status: string | null;
  in_person_available: boolean | null;
  online_available: boolean | null;
};

export const getPublicProfileBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("professionals")
      .select(PRO_PUBLIC_COLUMNS)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;

    // Phase 5 public-visibility gate: hide profiles with no active paid sub.
    const { isProPubliclyVisible } = await import(
      "@/lib/visibility/public-gate.server"
    );
    if (!(await isProPubliclyVisible((row as { id: string }).id))) return null;

    const r = row as unknown as ProPublicRow;

    const [{ data: prof }, locMap] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", r.id)
        .maybeSingle(),
      fetchPrimaryLocations([r.id]),
    ]);
    const loc = locMap.get(r.id) ?? null;

    const { data: qualRows } = await supabaseAdmin
      .from("verification_submissions")
      .select(
        "id, awarding_body, awarding_body_slug, qualification, qualification_number, issue_date, year, expiry_date, regulator_verified, reviewed_at",
      )
      .eq("professional_id", r.id)
      .eq("status", "approved")
      .order("issue_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    const { data: gymRows } = await supabaseAdmin
      .from("professional_gyms")
      .select("position, gyms ( name, chain_name, area, city )")
      .eq("professional_id", r.id)
      .order("position", { ascending: true });

    const gyms = (gymRows ?? [])
      .map((row) => {
        const g = (row as { gyms: { name: string | null; chain_name: string | null; area: string | null; city: string | null } | null }).gyms;
        if (!g) return null;
        return {
          label: g.chain_name?.trim() || g.name?.trim() || "Gym",
          branch: g.area?.trim() || g.city?.trim() || "",
        };
      })
      .filter((g): g is { label: string; branch: string } => g !== null);

    const { data: insuranceRow } = await supabaseAdmin
      .from("insurance_policies")
      .select("expiry_date, status")
      .eq("professional_id", r.id)
      .eq("status", "active")
      .gte("expiry_date", new Date().toISOString().slice(0, 10))
      .order("expiry_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: proExtra } = await supabaseAdmin
      .from("professionals")
      .select("verification, identity_status, insurance_valid_until, identity_verified_at")
      .eq("id", r.id)
      .maybeSingle();

    // Suppress the public "REPS Verified" trust badge while a payment dispute
    // (chargeback) is open, even though the underlying verification evidence
    // (ID, qualifications, insurance) remains intact.
    let inDispute = false;
    try {
      const { data: dr } = await supabaseAdmin.rpc("is_in_payment_dispute", { _user_id: r.id });
      inDispute = !!dr;
    } catch { /* helper missing — treat as not disputed */ }

    const { data: photoRows } = await supabaseAdmin
      .from("professional_photos")
      .select("id, storage_path, sort_order, width, height")
      .eq("professional_id", r.id)
      .order("sort_order", { ascending: true });

    const { data: serviceRows } = await supabaseAdmin
      .from("services")
      .select(
        "id, title, description, price_pence, price_label, duration_minutes, mode, sort_order, is_featured",
      )
      .eq("professional_id", r.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(3);

    const supabaseUrl =
      process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
    const gallery = (photoRows ?? []).map((p) => ({
      id: p.id as string,
      url: `${supabaseUrl}/storage/v1/object/public/pro-photos/${p.storage_path}`,
      width: p.width as number | null,
      height: p.height as number | null,
    }));


    return {
      ...r,
      primary_profession: r.primary_profession ?? null,
      specialisms: Array.isArray(r.specialisms) ? r.specialisms : [],
      full_name: prof?.full_name ?? null,
      avatar_url: prof?.avatar_url ?? null,
      location: loc,
      qualifications: (qualRows ?? []) as Array<{
        id: string;
        awarding_body: string | null;
        awarding_body_slug: string | null;
        qualification: string | null;
        qualification_number: string | null;
        issue_date: string | null;
        year: number | null;
        expiry_date: string | null;
        regulator_verified: boolean | null;
      }>,
      gyms,
      gallery,
      services: (serviceRows ?? []) as Array<{
        id: string;
        title: string;
        description: string | null;
        price_pence: number | null;
        price_label: string | null;
        duration_minutes: number | null;
        mode: string;
        sort_order: number;
        is_featured: boolean;
      }>,
      trust: {
        verified:
          !inDispute &&
          (proExtra?.verification ?? r.verification_status) === "verified" &&
          proExtra?.identity_status === "approved" &&
          Boolean(insuranceRow),
        insurance_expiry:
          insuranceRow?.expiry_date ?? proExtra?.insurance_valid_until ?? null,
        identity_verified_at: proExtra?.identity_verified_at ?? null,
        qualifications_checked_at: qualRows && qualRows.length > 0 
          ? qualRows.find(q => q.reviewed_at)?.reviewed_at || qualRows[0].reviewed_at || null 
          : null,
      },
    };
  });


export const listPublishedProfessionals = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getPubliclyVisibleProIds } = await import(
      "@/lib/visibility/public-gate.server"
    );
    const visibleIds = Array.from(await getPubliclyVisibleProIds());
    if (visibleIds.length === 0) return [];
    const { data, error } = await supabaseAdmin
      .from("professionals")
      .select(PRO_LIST_COLUMNS)
      .in("id", visibleIds)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    const rows = (data ?? []) as unknown as ProListRow[];
    const ids = rows.map((r) => r.id).filter(Boolean);

    let profileById = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      profileById = new Map(
        (profs ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
      );
    }

    const locMap = await fetchPrimaryLocations(ids);

    return rows.map((r) => ({
      ...r,
      primary_profession: r.primary_profession ?? null,
      specialisms: Array.isArray(r.specialisms) ? r.specialisms : [],
      full_name: profileById.get(r.id)?.full_name ?? null,
      avatar_url: profileById.get(r.id)?.avatar_url ?? null,
      location: locMap.get(r.id) ?? null,
    }));
  },
);
