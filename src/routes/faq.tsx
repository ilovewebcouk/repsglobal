import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently asked questions — REPs" },
      { name: "description", content: "Answers to the most common questions about REPs for clients, professionals and billing." },
      { property: "og:title", content: "FAQ — REPs" },
      { property: "og:description", content: "FAQs for REPs clients and professionals." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What does the REPs verified badge mean?",
              acceptedAnswer: { "@type": "Answer", text: "It means we've confirmed the professional's qualifications, insurance and DBS status." },
            },
            {
              "@type": "Question",
              name: "How much does REPs cost for professionals?",
              acceptedAnswer: { "@type": "Answer", text: "REPs has 3 tiers: Verified £99/year, Pro £59/month and Studio £149/month. Every feature in your chosen tier is included." },
            },
          ],
        }),
      },
    ],
  }),
  component: FaqPage,
});

const GROUPS: { audience: string; items: { q: string; a: string }[] }[] = [
  {
    audience: "For clients",
    items: [
      { q: "What does the REPs verified badge mean?", a: "It means we've independently confirmed the professional's qualifications, insurance and DBS status — and that they've agreed to our code of professional conduct." },
      { q: "How do I book a session?", a: "Find a professional in the directory, open their profile, and use the Enquire Now or booking widget. Payment is handled securely via Stripe." },
      { q: "Are bookings refundable?", a: "Each professional sets their own cancellation policy, shown on their profile. REPs facilitates refunds in line with that policy." },
      { q: "Can I leave a review?", a: "Yes — once you've completed a session you'll receive an email invitation to leave a review. Verified bookings are clearly marked." },
    ],
  },
  {
    audience: "For professionals",
    items: [
      { q: "How do I get verified?", a: "Upload your qualifications, insurance and DBS in your dashboard. Most submissions are reviewed within 3 working days." },
      { q: "What tier should I start on?", a: "Verified (£99/year) gets you the verified badge, reviews and enquiries. Pro (£59/month) adds the full operating system — bookings, CRM, programmes, advanced nutrition and check-ins, plus AI across the platform. Studio (£149/month) is for multi-coach teams." },
      { q: "How do payouts work?", a: "Connect your Stripe account from settings. Payouts arrive in your bank account 2 working days after the session." },
      { q: "Can I import data from Brilliant Directories?", a: "Yes — during the migration window we'll move your profile, reviews and credentials across automatically." },
    ],
  },
  {
    audience: "Billing & subscriptions",
    items: [
      { q: "How much does REPs cost?", a: "Verified is £99/year. Pro is £59/month or £590/year. Studio is £149/month or £1,490/year. Every feature in your chosen tier is included. All tiers can be cancelled any time." },
      { q: "Does REPs take a commission on bookings?", a: "No. REPs does not take a commission on bookings. You pay for your tier and keep what your clients pay you. Standard payment-processor fees from your payment provider still apply on whatever checkout you use." },
      { q: "Do you offer student or NHS rates?", a: "Yes — verified students and NHS-affiliated practitioners receive a discount on Pro. Email billing@repsglobal.com with proof." },
      { q: "How do I cancel my subscription?", a: "Go to Settings → Billing → Manage subscription. Your tier remains active until the end of the paid period." },
    ],
  },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-reps-warm-white text-reps-charcoal">
      <div className="bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />
        <div className="mx-auto max-w-[1320px] px-6 pb-14 pt-12 lg:px-10">
          <span className="inline-flex items-center rounded-full bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-orange">
            FAQ
          </span>
          <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-white lg:text-[52px]">
            Frequently asked questions
          </h1>
          <p className="mt-4 max-w-[760px] text-[15px] leading-relaxed text-white/70">
            Quick answers to the questions we hear most. Can't find what you need? Visit the{" "}
            <Link to="/help" className="font-semibold text-reps-orange hover:underline">help centre</Link>{" "}or{" "}
            <Link to="/contact" className="font-semibold text-reps-orange hover:underline">contact our team</Link>.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[920px] px-6 py-16 lg:px-10">
        {GROUPS.map((g) => (
          <section key={g.audience} className="mb-12 last:mb-0">
            <h2 className="font-display text-[24px] font-bold text-reps-charcoal">{g.audience}</h2>
            <div className="mt-5 overflow-hidden rounded-[18px] border border-reps-stone bg-white">
              {g.items.map((it, idx) => (
                <details
                  key={it.q}
                  className={`group ${idx !== 0 ? "border-t border-reps-stone" : ""}`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[15px] font-semibold text-reps-charcoal">
                    {it.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-reps-muted-light transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-[14px] leading-relaxed text-reps-charcoal/80">
                    {it.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <PublicFooter />
    </div>
  );
}
