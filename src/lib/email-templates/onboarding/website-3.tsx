import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const WEBSITE = "https://repsuk.org/dashboard/website";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Final website nudge. Publish or we'll stop reminding you."
    heading="Last website reminder"
    proName={proName}
    paragraphs={[
      "Final onboarding email from us. If publishing your trainer website isn't a priority right now, no problem — but we'll stop reminding you after this.",
      "If you want it live, one click:",
    ]}
    ctaHref={WEBSITE}
    ctaLabel="Publish my site"
  />
);

export const template = {
  component: Email,
  subject: "Last reminder — publish your trainer website",
  displayName: "Onboarding · Website #3 (final)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
