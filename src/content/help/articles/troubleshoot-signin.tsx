import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "cant-sign-in",
  category: "troubleshooting",
  title: "I can't sign in",
  summary: "The four most common reasons sign-in fails — and how to fix each.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["signin", "login", "password", "magic link"],
  Body: () => (
    <>
      <h2 id="forgot-password">1. Forgot your password</h2>
      <p>
        Use the <strong>Forgot password</strong> link on the sign-in page. You'll get a reset
        email within a few minutes.
      </p>
      <h2 id="magic-link-expired">2. Magic link expired</h2>
      <p>
        Magic links are valid for 60 minutes and one click only. If yours has expired or you've
        already opened it, request a new one.
      </p>
      <h2 id="wrong-email">3. Wrong email address</h2>
      <p>
        We don't tell you whether an address is registered (it's a security choice). If a reset
        email never arrives, you're probably trying a different address than you signed up with.
      </p>
      <h2 id="email-blocked">4. Reset email blocked</h2>
      <p>
        Check spam and any work-email filtering rules. Add <code>@repsuk.org</code> to your
        allowed senders.
      </p>
      <DeepLinkButton to="/signin" label="Try signing in again" />
    </>
  ),
};
