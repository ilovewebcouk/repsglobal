import type { DashboardProfile } from "@/lib/profile/dashboard-profile.functions";

export type CompletenessChecklistItem = { label: string; done: boolean };
export type CompletenessResult = {
  pct: number;
  done: number;
  total: number;
  checklist: CompletenessChecklistItem[];
};

/**
 * Polish-only profile completeness. Aligned with the current dashboard layout
 * (Verification + Website editor). Reads from the sources the editor actually
 * writes to: `professionals.*` for identity + specialisms + contact + socials,
 * and `websites.about` for the About copy. Never affects Verified badge —
 * that's tracked separately by identity / insurance / qualifications.
 */
export function profileCompleteness(
  p: DashboardProfile | null | undefined,
): CompletenessResult {
  if (!p) {
    return { pct: 0, done: 0, total: 7, checklist: [] };
  }
  // Prefer the live website "About" (source of truth) but fall back to the
  // legacy `professionals.bio` so pros who haven't touched the new editor
  // still count as complete if their old bio is there.
  const aboutText = (p.about && p.about.trim().length > 0 ? p.about : p.bio) ?? "";
  const checklist: CompletenessChecklistItem[] = [
    { label: "Name, profession & city", done: !!(p.full_name && p.primary_profession && p.city) },
    { label: "About your coaching", done: aboutText.trim().length > 80 },
    { label: "Profile photo", done: !!p.avatar_url },
    { label: "Specialisms", done: (p.specialisms?.length ?? 0) >= 1 },
    { label: "Languages spoken", done: (p.languages?.length ?? 0) >= 1 },
    { label: "Contact phone", done: !!p.contact_phone },
    {
      label: "At least one social link",
      done: !!(
        p.social_instagram ||
        p.social_linkedin ||
        p.social_youtube ||
        p.social_tiktok ||
        p.social_x
      ),
    },
  ];
  const done = checklist.filter((c) => c.done).length;
  const total = checklist.length;
  const pct = Math.round((done / total) * 100);
  return { pct, done, total, checklist };
}

