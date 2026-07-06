import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const DASH = "https://repsuk.org/dashboard";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="You're fully set up on REPS — here's what top pros do in week one."
    heading="You're live on REPS"
    proName={proName}
    paragraphs={[
      "Nice work. You're signed in, verified, and your trainer website is published. Your profile is fully active and receiving enquiries.",
      "Three things top pros do in their first week:",
    ]}
    bullets={[
      "Add 3–5 photos to your gallery (finished profiles convert best)",
      "Ask a recent client for a review — the request tool is on your dashboard",
      "Set your services and pricing so enquiries arrive pre-qualified",
    ]}
    ctaHref={DASH}
    ctaLabel="Open my dashboard"
    ps="This is the last onboarding email — from here we only email you when something needs your attention (enquiry, review, renewal)."
  />
);

export const template = {
  component: Email,
  subject: "You're live on REPS — 3 quick wins for week one",
  displayName: "Onboarding · Complete (congrats)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
