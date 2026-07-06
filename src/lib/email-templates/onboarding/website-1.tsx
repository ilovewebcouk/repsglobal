import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const WEBSITE = "https://repsuk.org/dashboard/website";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="You're verified. Your public trainer website is 80% built — hit publish."
    heading="You're verified. Now put your site live."
    proName={proName}
    paragraphs={[
      "Big step — you're verified. Your public listing is live and searchable.",
      "The next lever is your trainer website. We've pre-built the structure from your profile — bio, services, gallery, contact form — you just need to review it and publish.",
    ]}
    ctaHref={WEBSITE}
    ctaLabel="Open website editor"
    ps="You can edit anything after publishing. Publish first, polish later."
  />
);

export const template = {
  component: Email,
  subject: "You're verified — publish your trainer website",
  displayName: "Onboarding · Website #1 (verified, publish)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
