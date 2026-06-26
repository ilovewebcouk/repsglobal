import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "insurance",
  category: "verification",
  title: "Insurance — what counts and how to upload",
  summary: "Active professional liability cover, in your own name, valid for what you teach.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["insurance", "liability", "renewal", "expiry"],
  related: [
    "verification/how-verification-works",
    "verification/typical-verification-times",
  ],
  Body: () => (
    <>
      <p>
        Insurance is the badge that protects clients. We require active professional liability
        cover, in your own name, valid for the services you're listing.
      </p>
      <h2 id="what-we-need-to-see">What we need to see on the certificate</h2>
      <ul>
        <li>Your full name as the policy holder</li>
        <li>Provider name and policy reference</li>
        <li>Expiry date — must be in the future at the point of upload</li>
        <li>Cover description that includes the services you teach</li>
      </ul>
      <Callout tone="warning" title="A schedule, not a quote">
        Quotes, renewal invitations and "thanks for your application" emails aren't proof of
        cover. We need the certificate / schedule of insurance issued by the provider.
      </Callout>
      <h2 id="recognised-providers">Recognised providers</h2>
      <p>
        We accept certificates from any UK-regulated provider that offers fitness professional
        liability cover — including Insure4Sport, Westminster, Salon Gold, Bluefin, Protectivity
        and others.
      </p>
      <h2 id="renewal-and-expiry">Renewal and expiry</h2>
      <p>
        We flag your insurance 30, 14 and 3 days before expiry, then again on the day. If the
        certificate lapses, your verified badge is automatically held until you upload a new one.
      </p>
      <DeepLinkButton to="/dashboard/verification" label="Upload your insurance" />
    </>
  ),
};
