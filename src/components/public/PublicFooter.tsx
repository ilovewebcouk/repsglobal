import { Link } from "@tanstack/react-router";
import { RepsWordmark } from "@/components/brand/RepsWordmark";

type FooterLink = { label: string; to: string };

const cols: { title: string; links: FooterLink[] }[] = [
  {
    title: "For Members",
    links: [
      { label: "Find a Professional", to: "/find-a-professional" },
      { label: "How REPs Works", to: "/how-it-works" },
      { label: "Specialisms", to: "/specialisms" },
      { label: "Reviews", to: "/reviews" },
      { label: "Help Centre", to: "/help" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    title: "For Professionals",
    links: [
      { label: "Join REPs", to: "/for-professionals" },
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "CPD & Education", to: "/cpd" },
      { label: "REPs vs Trainerize", to: "/compare/reps-vs-trainerize" },
      { label: "REPs vs MyPTHub", to: "/compare/reps-vs-mypthub" },
      { label: "REPs vs PT Distinction", to: "/compare/reps-vs-pt-distinction" },
      { label: "Compare all platforms", to: "/compare" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About REPs", to: "/about" },
      { label: "Standards", to: "/standards" },
      { label: "Verification", to: "/verify" },
      { label: "Resources", to: "/resources" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Use", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Cookies", to: "/cookies" },
      { label: "Complaints", to: "/complaints" },
      { label: "Comparison methodology", to: "/comparison-methodology" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-reps-ink text-reps-text-soft">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <RepsWordmark className="h-[20px] text-white" />
              <span className="border-l border-white/15 pl-3 text-[11px] leading-tight text-white/60">
                The Register of
                <br />
                Exercise Professionals
              </span>
            </div>
            <p className="mt-5 max-w-[320px] text-[14px] leading-relaxed text-reps-muted">
              The global professional standard for fitness. Verified credentials, public reviews
              and a trusted directory of exercise professionals.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[14px] text-reps-muted transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-reps-border pt-6 text-[13px] text-reps-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} REPs. The Register of Exercise Professionals.</p>
          <p>Find. Trust. Train. Transform.</p>
        </div>
      </div>
    </footer>
  );
}
