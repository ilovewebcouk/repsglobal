import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — REPs" },
      { name: "description", content: "The terms that govern your use of the REPs platform, marketplace and professional services." },
      { property: "og:title", content: "Terms of service — REPs" },
      { property: "og:description", content: "Read the REPs platform terms of service." },
    ],
  }),
  component: () => (
    <LegalShell
      eyebrow="Legal"
      title="Terms of service"
      lastUpdated="31 May 2026"
      intro="These terms govern your access to and use of REPs — the Register of Exercise Professionals — including our public directory, professional dashboard and any related services."
      sections={[
        { id: "acceptance", title: "Acceptance of terms", body: <p>By creating an account or using REPs you agree to be bound by these terms, our Privacy Policy and our Cookie Policy. If you do not agree, do not use the platform.</p> },
        { id: "accounts", title: "Accounts and eligibility", body: <p>You must be at least 18 years old to create a professional account. You are responsible for keeping your credentials secure and for all activity on your account.</p> },
        { id: "professional-conduct", title: "Professional conduct", body: <p>Verified REPs professionals warrant that their qualifications, insurance and DBS status are current and truthful. We may suspend any account found to misrepresent credentials.</p> },
        { id: "bookings-payments", title: "Bookings and payments", body: <p>Bookings made through REPs are contracts between the client and the professional. REPs facilitates payment via Stripe and charges platform fees as set out in your subscription tier.</p> },
        { id: "content", title: "User content", body: <p>You retain ownership of profile content you upload, and grant REPs a worldwide licence to display it in the directory and marketing materials.</p> },
        { id: "prohibited", title: "Prohibited use", body: <p>You may not use REPs to harass other users, post false credentials, scrape data, or interfere with the platform's operation.</p> },
        { id: "termination", title: "Termination", body: <p>We may suspend or terminate accounts that breach these terms or compromise platform trust. You may close your account at any time from settings.</p> },
        { id: "liability", title: "Liability", body: <p>REPs is a marketplace and verification register. We are not party to client–professional sessions and accept no liability for outcomes of those sessions beyond what is required by law.</p> },
        { id: "governing-law", title: "Governing law", body: <p>These terms are governed by the laws of England and Wales. Disputes will be resolved in the courts of England and Wales.</p> },
        { id: "contact", title: "Contact", body: <p>Questions about these terms? Email <a href="mailto:legal@repsglobal.com" className="font-semibold text-reps-orange hover:underline">legal@repsglobal.com</a>.</p> },
      ]}
    />
  ),
});
