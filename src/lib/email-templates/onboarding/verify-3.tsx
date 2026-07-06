import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const VERIFY = "https://repsuk.org/dashboard/verification";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Insurance is the fastest of the three. Upload the PDF and you're basically done."
    heading="Insurance is the quick win"
    proName={proName}
    paragraphs={[
      "Of the three verification steps, insurance is usually the fastest. If you have your public liability certificate to hand, uploading it takes less than a minute.",
      "That alone flips a big chunk of your profile trust score. Add ID and qualification when you have five minutes and you're fully verified.",
    ]}
    ctaHref={VERIFY}
    ctaLabel="Upload insurance now"
  />
);

export const template = {
  component: Email,
  subject: "Insurance takes 60 seconds — biggest verification win",
  displayName: "Onboarding · Verify #3 (insurance quick win)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
