import { Link } from "@tanstack/react-router";

const cols = [
  {
    title: "For Members",
    links: ["Find a Professional", "How REPs Works", "Specialisms", "Reviews", "Help Centre"],
  },
  {
    title: "For Professionals",
    links: ["Join REPs", "Pricing", "Dashboard", "CPD & Education", "Business Tools"],
  },
  {
    title: "Company",
    links: ["About REPs", "Standards", "Verification", "Careers", "Press"],
  },
  {
    title: "Legal",
    links: ["Terms of Use", "Privacy Policy", "Cookies", "Complaints", "Contact"],
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-reps-ink text-reps-text-soft">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-[28px] font-bold tracking-tight text-white">
                REPs
              </span>
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
                  <li key={link}>
                    <Link
                      to="/"
                      className="text-[14px] text-reps-muted transition-colors hover:text-white"
                    >
                      {link}
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
