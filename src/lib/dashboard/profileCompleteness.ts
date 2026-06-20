import type { DashboardProfile } from "@/lib/profile/dashboard-profile.functions";

export type CompletenessChecklistItem = { label: string; done: boolean };
export type CompletenessResult = {
  pct: number;
  done: number;
  total: number;
  checklist: CompletenessChecklistItem[];
};

/**
 * Polish-only profile completeness. Mirrors the locked checklist used inside
 * `/dashboard/profile`. Never affects Verified badge — that's tracked separately
 * by identity / insurance / qualifications.
 */
export function profileCompleteness(p: DashboardProfile | null | undefined): CompletenessResult {
  if (!p) {
    return { pct: 0, done: 0, total: 7, checklist: [] };
  }
  const checklist: CompletenessChecklistItem[] = [
    { label: "Basic information", done: !!(p.full_name && p.primary_profession && p.city) },
    { label: "About and bio", done: !!(p.bio && p.bio.length > 80) },
    { label: "Profile photo", done: !!p.avatar_url },
    { label: "Specialisms", done: (p.specialisms?.length ?? 0) >= 1 },
    { label: "Languages", done: (p.languages?.length ?? 0) >= 1 },
    { label: "Contact details", done: !!p.contact_phone },
    {
      label: "Social link",
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
