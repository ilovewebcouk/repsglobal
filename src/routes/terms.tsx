import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";

const CANONICAL = "https://repsuk.org/terms";
const META_TITLE = "Terms of Use — REPs";
const META_DESC =
  "The terms that govern your use of REPs — accounts, listings, reviews, payments, acceptable use and your statutory rights.";
const LAST_UPDATED = "26 June 2026";

export const Route = createFileRoute("/terms")({
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
  component: TermsPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms form a binding agreement between you and{" "}
          <strong>Scott McKay, trading as REPs</strong> ("REPs", "we", "us").
          They apply to everyone who uses REPs — both clients searching for
          professionals and professionals listed on the platform.
        </p>
        <p>
          By creating an account or using REPs, you agree to these terms. If
          you don't, please don't use REPs.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    body: (
      <p>
        You must be at least 16 years old and have the legal capacity to enter
        into a contract. If you're under 18, you must have consent from a
        parent or guardian.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <ul>
        <li>Use accurate, current information when you sign up.</li>
        <li>Keep your password confidential — you're responsible for activity on your account.</li>
        <li>Tell us promptly if you suspect unauthorised access.</li>
        <li>
          We may suspend or close accounts that breach these terms, our{" "}
          <Link to="/standards">standards</Link>, or applicable law.
        </li>
      </ul>
    ),
  },
  {
    id: "listings",
    title: "Professional listings & standards",
    body: (
      <>
        <p>
          Professionals listed on REPs commit to our published{" "}
          <Link to="/standards">standards</Link> and are verified against them.
          Verification is a platform-level check by REPs — it doesn't replace
          statutory regulators, awarding bodies or the courts, and isn't a
          guarantee of any specific outcome.
        </p>
        <p>
          Professionals are independent and contract directly with clients.
          REPs is not the employer or supervisor of any listed professional.
        </p>
      </>
    ),
  },
  {
    id: "reviews",
    title: "Reviews",
    body: (
      <>
        <p>
          Reviews must be genuine and based on a real interaction with the
          professional. We may remove reviews that are fake, abusive,
          discriminatory, contain personal data of third parties, or breach
          our content rules.
        </p>
        <p>
          Professionals may publicly respond to reviews. Editing or buying
          reviews — whether positive or negative — is grounds for removal from
          REPs.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Bookings, payments & refunds",
    body: (
      <>
        <p>
          Any service booked through REPs is a direct agreement between the
          client and the professional. REPs is not a party to that agreement
          and isn't responsible for the delivery, quality or outcome of the
          service.
        </p>
        <p>
          Payments are processed by a third-party payments processor. Refund
          requests are handled by the professional in line with their stated
          terms, except where consumer-protection law requires otherwise.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Scrape, copy or bulk-extract content from REPs.</li>
          <li>Impersonate another person or misrepresent your qualifications.</li>
          <li>Use REPs to harass, threaten or discriminate against anyone.</li>
          <li>Upload unlawful, defamatory or infringing content.</li>
          <li>Interfere with the security or integrity of the platform.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <>
        <p>
          REPs, the REPs name, logos and platform are owned by us and
          protected by intellectual-property law. You may not use our branding
          without written permission.
        </p>
        <p>
          You keep ownership of the content you submit. You grant REPs a
          non-exclusive, worldwide, royalty-free licence to host, display and
          distribute that content as needed to operate the platform.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers & liability",
    body: (
      <>
        <p>
          REPs is provided "as is" and "as available". To the maximum extent
          allowed by law, we exclude implied warranties and aren't liable for
          loss of profits, business, or indirect or consequential loss.
        </p>
        <p>
          Nothing in these terms excludes or limits our liability for death or
          personal injury caused by our negligence, fraud, or any other
          liability that can't lawfully be excluded — including your statutory
          rights as a consumer under English law.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Suspension & termination",
    body: (
      <p>
        We may suspend or close your account if you breach these terms, our
        standards or applicable law. You can close your account at any time
        from your dashboard or by emailing{" "}
        <a href="mailto:support@repsuk.org">support@repsuk.org</a>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. For material changes,
        we'll give you at least 30 days' notice in-app or by email before they
        take effect. Continuing to use REPs after that means you accept the
        updated terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law & disputes",
    body: (
      <p>
        These terms and any dispute arising from them are governed by the laws
        of England & Wales, and the courts of England & Wales have exclusive
        jurisdiction. If you're a consumer, you keep the benefit of any
        mandatory consumer-protection rights in your country of residence.
      </p>
    ),
  },
  {
    id: "contact",
    title: "How to contact us",
    body: (
      <p>
        Email <a href="mailto:support@repsuk.org">support@repsuk.org</a> for
        any question about these terms.
      </p>
    ),
  },
];

function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Use"
      lede="The rules that govern how REPs is used by clients and professionals — written in plain English."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
