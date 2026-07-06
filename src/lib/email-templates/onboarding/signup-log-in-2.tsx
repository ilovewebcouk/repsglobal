import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const LOGIN = "https://repsuk.org/auth";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Your trainer website is pre-built and waiting inside your dashboard."
    heading="Your trainer website is ready to unlock"
    proName={proName}
    paragraphs={[
      "When you signed up, we scaffolded a public trainer website for you — bio, services, gallery, contact form. It's included in your membership.",
      "Sign in and you'll see it in the website editor, ready to review and publish.",
    ]}
    ctaHref={LOGIN}
    ctaLabel="Sign in and open my website"
    ps="Forgotten your password? Use the reset link on the sign-in page."
  />
);

export const template = {
  component: Email,
  subject: "Your REPS trainer website is waiting",
  displayName: "Onboarding · Signup · Log in #2 (website waiting)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
