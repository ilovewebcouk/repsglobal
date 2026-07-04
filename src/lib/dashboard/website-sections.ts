/**
 * Pure computation of the 9 Website-editor section statuses.
 *
 * Shared between:
 *   - the Website editor route (`dashboard_.website.tsx`) — feeds the sidebar
 *   - the server-side readiness fn (`readiness.functions.ts`) — feeds the
 *     dashboard's Readiness card + Needs-your-attention list
 *
 * Both call this helper with the same shape so the sidebar's "6/9 IN PROGRESS"
 * pill and the dashboard's readiness roll-up can never drift apart.
 */

export type SectionStatus = "done" | "partial" | "empty";

export type WebsiteSectionId =
  | "profile"
  | "basics"
  | "specialisms"
  | "location"
  | "plans"
  | "method"
  | "results"
  | "faqs"
  | "contact";

export type WebsiteSection = {
  id: WebsiteSectionId;
  label: string;
  status: SectionStatus;
};

export type WebsiteSectionsInput = {
  hasAvatar: boolean;
  tagline: string | null | undefined;
  subtitle: string | null | undefined;
  about: string | null | undefined;
  heroImageUrl: string | null | undefined;
  specialismCount: number;
  hasPostcode: boolean;
  hasDelivery: boolean;
  serviceCount: number;
  /** true when we actually loaded the websites row (else all content sections are empty). */
  hasWebsiteRow: boolean;
  methodName: string | null | undefined;
  /** Pillars with both a title and a body. */
  methodPillarCount: number;
  transformationCount: number;
  faqCount: number;
  languageCount: number;
  socialCount: number;
  hasPhone: boolean;
};

const trimmed = (s: string | null | undefined) => (s ?? "").trim();

/** Short attention-row copy shown on the dashboard when a section is < done. */
export const SECTION_ATTENTION_COPY: Record<
  WebsiteSectionId,
  { partial: string; empty: string }
> = {
  profile: {
    partial: "Add a clear profile photo",
    empty: "Add a clear profile photo",
  },
  basics: {
    partial: "Finish your website basics (tagline, about, hero)",
    empty: "Add your website basics (tagline, about, hero)",
  },
  specialisms: {
    partial: "Pick your specialisms",
    empty: "Pick your specialisms",
  },
  location: {
    partial: "Confirm where you train",
    empty: "Add where you train",
  },
  plans: {
    partial: "Publish all 3 coaching plans",
    empty: "Add your 3 coaching plans",
  },
  method: {
    partial: "Finish How I coach (name + 3 pillars)",
    empty: "Describe how you coach",
  },
  results: {
    partial: "Add at least one client result",
    empty: "Add at least one client result",
  },
  faqs: {
    partial: "Answer at least one FAQ",
    empty: "Answer common FAQs",
  },
  contact: {
    partial: "Add languages, phone and a social link",
    empty: "Add languages, phone and a social link",
  },
};

export function computeWebsiteSections(x: WebsiteSectionsInput): WebsiteSection[] {
  const photoStatus: SectionStatus = x.hasAvatar ? "done" : "empty";

  const basicsFilled = [x.tagline, x.subtitle, x.about, x.heroImageUrl]
    .filter((v) => trimmed(v))
    .length;
  const basicsStatus: SectionStatus =
    basicsFilled === 4 ? "done" : basicsFilled === 0 ? "empty" : "partial";

  const specialismsStatus: SectionStatus = x.specialismCount > 0 ? "done" : "empty";

  const locationStatus: SectionStatus =
    x.hasPostcode && x.hasDelivery
      ? "done"
      : x.hasPostcode || x.hasDelivery
        ? "partial"
        : "empty";

  const plansStatus: SectionStatus =
    x.serviceCount >= 3 ? "done" : x.serviceCount > 0 ? "partial" : "empty";

  const methodStatus: SectionStatus = !x.hasWebsiteRow
    ? "empty"
    : trimmed(x.methodName) && x.methodPillarCount >= 3
      ? "done"
      : trimmed(x.methodName) || x.methodPillarCount > 0
        ? "partial"
        : "empty";

  const resultsStatus: SectionStatus = !x.hasWebsiteRow
    ? "empty"
    : x.transformationCount >= 1
      ? "done"
      : "empty";

  const faqsStatus: SectionStatus = !x.hasWebsiteRow
    ? "empty"
    : x.faqCount >= 1
      ? "done"
      : "empty";

  const contactFilled = [x.languageCount > 0, x.socialCount > 0, x.hasPhone].filter(
    Boolean,
  ).length;
  const contactStatus: SectionStatus =
    contactFilled === 3 ? "done" : contactFilled === 0 ? "empty" : "partial";

  return [
    { id: "profile", label: "Profile photo", status: photoStatus },
    { id: "basics", label: "Website basics", status: basicsStatus },
    { id: "specialisms", label: "Specialisms", status: specialismsStatus },
    { id: "location", label: "Where I train", status: locationStatus },
    { id: "plans", label: "Coaching plans", status: plansStatus },
    { id: "method", label: "How I coach", status: methodStatus },
    { id: "results", label: "Client results", status: resultsStatus },
    { id: "faqs", label: "FAQs", status: faqsStatus },
    { id: "contact", label: "Languages & socials", status: contactStatus },
  ];
}

export function countSectionsDone(sections: WebsiteSection[]): number {
  return sections.filter((s) => s.status === "done").length;
}
