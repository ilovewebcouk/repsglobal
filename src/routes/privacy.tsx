import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — REPs" },
      { name: "description", content: "How REPs collects, uses and protects your personal data under GDPR." },
      { property: "og:title", content: "Privacy policy — REPs" },
      { property: "og:description", content: "Our GDPR-aligned privacy practices." },
    ],
  }),
  component: () => (
    <LegalShell
      eyebrow="Legal"
      title="Privacy policy"
      lastUpdated="31 May 2026"
      intro="REPs takes the privacy of our professionals and clients seriously. This policy explains what data we collect, how we use it, and the rights you have under GDPR and equivalent data-protection laws."
      sections={[
        { id: "data-we-collect", title: "Data we collect", body: <p>Account details (name, email, password hash), professional credentials (qualifications, DBS, insurance), profile content, booking and payment metadata, and usage analytics.</p> },
        { id: "how-we-use-it", title: "How we use your data", body: <p>To operate the platform, verify professionals, process payments, surface relevant search results, send transactional and (with consent) marketing communications, and detect fraud.</p> },
        { id: "lawful-basis", title: "Lawful basis for processing", body: <p>We process data under contract (to deliver the service), legitimate interests (platform safety, fraud prevention), legal obligation (record-keeping), and consent (optional marketing and cookies).</p> },
        { id: "sharing", title: "Who we share with", body: <p>Stripe (payments), Resend (email), Cloudflare (hosting/storage), Mapbox (location), and verification partners where required. We never sell personal data.</p> },
        { id: "international", title: "International transfers", body: <p>We may transfer data internationally to processors that support our service. Where we do, we rely on recognised adequacy decisions and Standard Contractual Clauses (or local equivalents) to protect your data.</p> },
        { id: "retention", title: "Data retention", body: <p>Account data is kept for as long as your account is active, plus 6 years for accounting records. Closed-account data is anonymised on a rolling 90-day schedule.</p> },
        { id: "your-rights", title: "Your rights", body: <p>Under GDPR and equivalent laws you can access, rectify, erase, restrict and port your data, and object to processing. Email <a href="mailto:privacy@repsglobal.com" className="font-semibold text-reps-orange hover:underline">privacy@repsglobal.com</a> to exercise these.</p> },
        { id: "security", title: "Security", body: <p>We use TLS 1.3, at-rest encryption, scoped access controls, and quarterly third-party penetration testing.</p> },
        { id: "complaints", title: "Complaints", body: <p>You can lodge a complaint with your local data-protection authority.</p> },
      ]}
    />
  ),
});
