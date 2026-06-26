import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "cancel-or-pause-your-account",
  category: "account-billing",
  title: "Cancel or pause your account",
  summary: "You can hide your profile, pause notifications, or close the account fully.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["cancel", "pause", "close", "delete"],
  Body: () => (
    <>
      <p>
        You're in charge of your listing. There are three ways to step back from REPS, depending
        on whether you want to come back later.
      </p>
      <h2 id="hide-your-profile">Hide your profile</h2>
      <p>
        Unpublish from your dashboard. Your URL still resolves but returns a "this profile is
        currently unavailable" page. You keep all data, reviews and enquiries.
      </p>
      <h2 id="pause-notifications">Pause notifications</h2>
      <p>
        From <strong>Settings → Notifications</strong>, turn off enquiry and review emails. Your
        profile stays live.
      </p>
      <h2 id="close-the-account">Close the account</h2>
      <p>
        Email <a href="mailto:support@repsuk.org">support@repsuk.org</a> from the address on the
        account. We'll confirm, then permanently delete the profile and personal data within 30
        days. Reviews left by clients are anonymised and retained for trust integrity.
      </p>
      <Callout tone="warning" title="Closure is permanent">
        Once an account is closed and 30 days have passed, the slug, the profile and the history
        cannot be restored.
      </Callout>
      <DeepLinkButton to="/dashboard/settings" label="Open settings" />
    </>
  ),
};
