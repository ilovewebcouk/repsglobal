import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";

const CANONICAL = "https://repsuk.org/privacy";
const META_TITLE = "Privacy Policy — REPs";
const META_DESC =
  "How REPs collects, uses, shares and protects personal data — your rights under UK GDPR, retention periods and how to contact us.";
const LAST_UPDATED = "1 July 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: PrivacyPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          <strong>REPs</strong> ("REPs", "we", "us") is the data controller
          for the personal information described in this policy.
        </p>
        <p>
          For any privacy question, request or complaint, contact us at{" "}
          <a href="mailto:support@repsuk.org">support@repsuk.org</a>.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What data we collect",
    body: (
      <>
        <p>We only collect what we need to run REPs:</p>
        <ul>
          <li>
            <strong>Account data</strong> — name, email, password (hashed),
            account type (client or professional).
          </li>
          <li>
            <strong>Profile data</strong> — for professionals: photo, bio,
            specialisms, location, services and prices.
          </li>
          <li>
            <strong>Verification evidence</strong> — government-issued ID,
            qualification certificates and insurance documents.
          </li>
          <li>
            <strong>Reviews and messages</strong> — content you submit through
            enquiries, reviews and support tickets.
          </li>
          <li>
            <strong>Payment data</strong> — handled by our third-party payments
            processor. We don't store full card details.
          </li>
          <li>
            <strong>Technical data</strong> — IP address, device and browser
            info, pages visited and basic interaction analytics.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <>
        <ul>
          <li>Operate REPs and provide the features you use.</li>
          <li>
            Verify that listed professionals are who they say they are and meet
            our published <Link to="/standards">standards</Link>.
          </li>
          <li>Detect and prevent fraud, abuse and policy violations.</li>
          <li>
            Communicate with you about your account, enquiries, bookings and
            service updates.
          </li>
          <li>Improve REPs based on aggregate, non-identifying usage data.</li>
          <li>Meet legal, tax and regulatory obligations.</li>
        </ul>
      </>
    ),
  },
  {
    id: "lawful-bases",
    title: "Lawful bases",
    body: (
      <>
        <p>
          Under UK GDPR we process personal data under the following lawful
          bases:
        </p>
        <ul>
          <li>
            <strong>Contract</strong> — to provide REPs to you and fulfil our
            terms.
          </li>
          <li>
            <strong>Legitimate interests</strong> — to verify professionals,
            keep the platform safe, prevent fraud and improve the service.
          </li>
          <li>
            <strong>Consent</strong> — for non-essential cookies and any
            optional marketing communications.
          </li>
          <li>
            <strong>Legal obligation</strong> — for tax, accounting and
            responses to lawful requests.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Sharing & subprocessors",
    body: (
      <>
        <p>
          We share personal data only with service providers we need to run
          REPs. These fall into the following categories:
        </p>
        <ul>
          <li>Hosting and infrastructure provider.</li>
          <li>Payments processor.</li>
          <li>Email delivery provider.</li>
          <li>Analytics provider (aggregate usage measurement only).</li>
          <li>AI provider (for AI-assisted features).</li>
        </ul>
        <p>
          Each provider is bound by a written data-processing agreement and may
          only use your data on our instructions. We don't sell personal data.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "International transfers",
    body: (
      <p>
        Some of our providers may process data outside the UK. Where they do,
        transfers are protected by the UK International Data Transfer
        Agreement (IDTA), the EU Standard Contractual Clauses (SCCs) with the
        UK Addendum, or an adequacy decision recognised by the UK.
      </p>
    ),
  },
  {
    id: "retention",
    title: "Retention",
    body: (
      <>
        <p>We keep personal data only as long as we need it:</p>
        <ul>
          <li>
            <strong>Account data</strong> — while your account is active, plus
            up to 6 years afterwards for tax and accounting records.
          </li>
          <li>
            <strong>Verification evidence</strong> — while you're listed on
            REPs, plus up to 2 years afterwards to handle disputes.
          </li>
          <li>
            <strong>Support tickets</strong> — up to 3 years from closure.
          </li>
          <li>
            <strong>Analytics</strong> — typically 26 months in aggregate form.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under UK GDPR you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Have inaccurate data corrected.</li>
          <li>
            Have data erased where there's no overriding lawful basis to keep it.
          </li>
          <li>Restrict or object to certain processing.</li>
          <li>Receive your data in a portable format.</li>
          <li>Withdraw consent at any time where consent is the basis.</li>
        </ul>
        <p>
          To exercise any of these, email{" "}
          <a href="mailto:support@repsuk.org">support@repsuk.org</a>. You also
          have the right to complain to the UK Information Commissioner's
          Office (ICO) at ico.org.uk.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        REPs is not intended for under-16s. If you're under 18, you must have
        consent from a parent or guardian to use REPs. If we learn we've
        collected data from a child without appropriate consent, we'll delete
        it.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use TLS in transit, role-based access controls, and infrastructure
        that encrypts data at rest through our hosting provider. No system is
        ever completely secure, but we work to limit what's collected, who can
        see it and how long it's kept.
      </p>
    ),
  },
  {
    id: "website-analytics",
    title: "Website analytics (PostHog EU)",
    body: (
      <>
        <p>
          If you accept analytics cookies, REPs uses PostHog — hosted in the
          EU — to understand how visitors use our public website. This helps us
          improve pages that connect clients to the right professionals.
        </p>
        <ul>
          <li>Analytics is optional. It is off until you accept.</li>
          <li>
            We route all analytics through our own domain
            (<code>repsuk.org/_a</code>) and strip your IP address before it
            reaches PostHog. Your country is derived from a network-level
            header only.
          </li>
          <li>
            We do not use analytics cookies for advertising, and we never sell
            your data.
          </li>
          <li>
            We honour Do Not Track and Global Privacy Control signals — if
            either is on, we do not capture analytics regardless of your
            cookie choice.
          </li>
          <li>
            You can withdraw consent at any time from the "Cookie preferences"
            link in the footer. Withdrawing consent immediately stops capture
            and clears PostHog cookies from your device.
          </li>
        </ul>
        <p>
          Lawful basis: consent (UK GDPR Art. 6(1)(a)) and PECR reg. 6.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as REPs evolves. The "Last updated" date at
        the top of this page always reflects the current version, and material
        changes are notified in-app or by email before they take effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "How to contact us",
    body: (
      <p>
        Email <a href="mailto:support@repsuk.org">support@repsuk.org</a> for
        any privacy question, request or complaint. We aim to respond within 5
        working days.
      </p>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lede="What personal data we collect, why we collect it, how long we keep it and what rights you have over it."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
