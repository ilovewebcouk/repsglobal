import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const WEBSITE = "https://repsuk.org/dashboard/website";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Verified pros with a published website get 3x more enquiries."
    heading="Published sites get 3x more enquiries"
    proName={proName}
    paragraphs={[
      "Across REPS, verified pros with a published website receive roughly 3x the enquiries of verified pros without one. It's the single biggest lift you can make right now.",
      "Your site is drafted — take five minutes, tweak the hero, hit publish.",
    ]}
    ctaHref={WEBSITE}
    ctaLabel="Publish my site"
  />
);

export const template = {
  component: Email,
  subject: "Published sites get 3x more enquiries",
  displayName: "Onboarding · Website #2 (proof)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
