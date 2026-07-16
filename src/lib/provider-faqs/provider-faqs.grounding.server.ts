// Server-only helper that assembles the facts we pass to the AI when
// drafting FAQ suggestions for a training provider. Kept out of the
// `.functions.ts` module so nothing here leaks into the client bundle.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ProviderGroundingFacts = {
  providerName: string;
  tagline: string | null;
  about: string | null;
  city: string | null;
  address: string | null;
  contactEmail: string | null;
  domain: string | null;
  regulated: Array<{
    title: string;
    level: string | null;
    awardingBody: string | null;
    ofqualRef: string | null;
  }>;
  courses: Array<{
    title: string;
    level: number | null;
    deliveryMode: string | null;
    hours: number | null;
    forWho: string | null;
  }>;
};

/**
 * Load the real, admin-approved facts we're happy to let the model
 * reference. Nothing invented, nothing draft-status.
 */
export async function loadProviderGroundingFacts(
  professionalId: string,
): Promise<ProviderGroundingFacts> {
  const [prof, profile, regulated, courses, domain] = await Promise.all([
    supabaseAdmin
      .from("professionals")
      .select(
        "id, tagline, about, city, address, contact_email, headline",
      )
      .eq("id", professionalId)
      .maybeSingle(),
    supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", professionalId)
      .maybeSingle(),
    supabaseAdmin
      .from("provider_regulated_permissions")
      .select(
        "id, ofqual_number, ofqual_snapshot, reps_qualification_number, status",
      )
      .eq("provider_id", professionalId)
      .eq("status", "approved")
      .limit(20),
    supabaseAdmin
      .from("reps_courses")
      .select(
        "id, proposed_title, official_title, official_level, proposed_level, proposed_delivery_mode, proposed_total_hours, proposed_who_for, status",
      )
      .eq("provider_id", professionalId)
      .in("status", ["approved", "accredited", "published"])
      .limit(20),
    supabaseAdmin
      .from("provider_domain_verifications")
      .select("domain, status")
      .eq("professional_id", professionalId)
      .eq("status", "approved")
      .maybeSingle(),
  ]);

  const proRow = (prof.data ?? {}) as Record<string, unknown>;
  const profRow = (profile.data ?? {}) as Record<string, unknown>;
  const providerName =
    (profRow.full_name as string | null)?.trim() ||
    (proRow.headline as string | null)?.trim() ||
    "Training provider";

  type OfqualSnapshot = {
    title?: string | null;
    level?: string | null;
    awardingOrganisation?: string | null;
  };

  const regulatedFacts = (regulated.data ?? []).flatMap((row) => {
    const snap = (row as { ofqual_snapshot?: OfqualSnapshot | null }).ofqual_snapshot ?? null;
    const title = snap?.title ?? null;
    if (!title) return [];
    return [
      {
        title,
        level: snap?.level ?? null,
        awardingBody: snap?.awardingOrganisation ?? null,
        ofqualRef: (row as { ofqual_number?: string | null }).ofqual_number ?? null,
      },
    ];
  });

  const courseFacts = (courses.data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      title:
        ((r.official_title as string | null)?.trim() ||
          (r.proposed_title as string | null)?.trim() ||
          "Course") as string,
      level:
        (r.official_level as number | null) ??
        (r.proposed_level as number | null) ??
        null,
      deliveryMode: (r.proposed_delivery_mode as string | null) ?? null,
      hours: (r.proposed_total_hours as number | null) ?? null,
      forWho: (r.proposed_who_for as string | null) ?? null,
    };
  });

  return {
    providerName,
    tagline: (proRow.tagline as string | null) ?? null,
    about: (proRow.about as string | null) ?? null,
    city: (proRow.city as string | null) ?? null,
    address: (proRow.address as string | null) ?? null,
    contactEmail: (proRow.contact_email as string | null) ?? null,
    domain: (domain.data as { domain?: string | null } | null)?.domain ?? null,
    regulated: regulatedFacts,
    courses: courseFacts,
  };
}

/** Turn the facts into a compact, unambiguous block the model can lean on. */
export function renderGroundingForPrompt(facts: ProviderGroundingFacts): string {
  const lines: string[] = [];
  lines.push(`Provider name: ${facts.providerName}`);
  if (facts.tagline) lines.push(`Tagline: ${facts.tagline}`);
  if (facts.city) lines.push(`City: ${facts.city}`);
  if (facts.address) lines.push(`Address: ${facts.address}`);
  if (facts.domain) lines.push(`Verified website: ${facts.domain}`);
  if (facts.contactEmail) lines.push(`Contact email: ${facts.contactEmail}`);
  if (facts.about) {
    lines.push("");
    lines.push("About (provider's own words):");
    lines.push(facts.about.slice(0, 800));
  }

  if (facts.regulated.length) {
    lines.push("");
    lines.push("Approved regulated qualifications (Ofqual-recognised):");
    for (const q of facts.regulated) {
      const bits = [
        q.title,
        q.level ? `(${q.level})` : "",
        q.awardingBody ? `— ${q.awardingBody}` : "",
        q.ofqualRef ? `[Ofqual ${q.ofqualRef}]` : "",
      ]
        .filter(Boolean)
        .join(" ");
      lines.push(`- ${bits}`);
    }
  }

  if (facts.courses.length) {
    lines.push("");
    lines.push("Published REPS-endorsed courses:");
    for (const c of facts.courses) {
      const bits = [
        c.title,
        c.level ? `(Level ${c.level})` : "",
        c.deliveryMode ? `— ${c.deliveryMode}` : "",
        c.hours ? `${c.hours}h` : "",
      ]
        .filter(Boolean)
        .join(" ");
      lines.push(`- ${bits}`);
      if (c.forWho) lines.push(`  For: ${c.forWho.slice(0, 200)}`);
    }
  }

  return lines.join("\n");
}

/** True when we have enough real data to justify drafting FAQs. */
export function hasEnoughGrounding(facts: ProviderGroundingFacts): boolean {
  return facts.regulated.length > 0 || facts.courses.length > 0;
}
