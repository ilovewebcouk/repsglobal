import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const VERIFY = "https://repsuk.org/dashboard/verification";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Final verification nudge. We'll stop after this."
    heading="Last verification reminder"
    proName={proName}
    paragraphs={[
      "This is the final onboarding nudge from us on verification. Your account stays active either way — but without verification your profile doesn't appear in public search results.",
      "If you'd like to finish, the button below drops you straight on the upload page.",
    ]}
    ctaHref={VERIFY}
    ctaLabel="Finish verification"
    ps="After this we'll stop reminding you. If you get stuck, reply and support will help."
  />
);

export const template = {
  component: Email,
  subject: "Final verification reminder",
  displayName: "Onboarding · Verify #4 (final)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
