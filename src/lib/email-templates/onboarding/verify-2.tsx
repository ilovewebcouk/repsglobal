import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const VERIFY = "https://repsuk.org/dashboard/verification";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Clients filter by verified. Un-verified profiles don't appear in results."
    heading="Clients filter for the verified badge"
    proName={proName}
    paragraphs={[
      "When someone searches REPS for a trainer, the results default to Verified only. That's the trust signal that turns a search into an enquiry.",
      "You're one document upload away from having that badge on your profile.",
    ]}
    ctaHref={VERIFY}
    ctaLabel="Upload documents"
  />
);

export const template = {
  component: Email,
  subject: "Clients search for the verified badge — get yours",
  displayName: "Onboarding · Verify #2 (trust signal)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
