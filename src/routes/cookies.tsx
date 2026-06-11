import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie policy — REPS" },
      { name: "description", content: "How REPS uses cookies and similar technologies, and how to manage your preferences." },
      { property: "og:title", content: "Cookie policy — REPS" },
      { property: "og:description", content: "Cookie categories and preferences for REPS." },
    ],
  }),
  component: CookiesPage,
});

const CATEGORIES: { name: string; required: boolean; purpose: string; examples: string }[] = [
  { name: "Essential", required: true, purpose: "Authentication, security and load balancing. The platform cannot function without these.", examples: "reps_session, csrf_token, cf_clearance" },
  { name: "Functional", required: false, purpose: "Remember preferences such as language, region and saved professionals.", examples: "reps_locale, reps_saved_pros" },
  { name: "Analytics", required: false, purpose: "Help us understand how the platform is used so we can improve it. Aggregated, not used to identify you.", examples: "_ga, posthog_id" },
  { name: "Marketing", required: false, purpose: "Used to measure the performance of REPS ad campaigns and to suggest relevant content.", examples: "_fbp, _gcl_au" },
];

function CookiesPage() {
  return (
    <div className="min-h-screen bg-reps-warm-white text-reps-charcoal">
      <div className="bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />
        <div className="mx-auto max-w-[1320px] px-6 pb-14 pt-10 lg:px-10">
          <span className="inline-flex items-center rounded-full bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-orange">
            Legal
          </span>
          <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-white lg:text-[52px]">
            Cookie policy
          </h1>
          <p className="mt-4 max-w-[760px] text-[15px] leading-relaxed text-white/70">
            REPS uses cookies and similar technologies to keep you signed in, remember your
            preferences, and understand how the platform is used. You're in control — manage your
            preferences below.
          </p>
          <p className="mt-5 text-[12px] uppercase tracking-[0.08em] text-white/45">
            Last updated · 31 May 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 py-16 lg:px-10">
        <div className="overflow-hidden rounded-[18px] border border-reps-stone bg-white">
          <table className="w-full text-[13px]">
            <thead className="bg-reps-ivory text-left text-[11px] uppercase tracking-[0.08em] text-reps-muted-light">
              <tr>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Purpose</th>
                <th className="px-5 py-3 font-semibold">Examples</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr key={c.name} className="border-t border-reps-stone align-top">
                  <td className="px-5 py-4 font-display text-[14px] font-semibold text-reps-charcoal">{c.name}</td>
                  <td className="px-5 py-4 text-reps-charcoal/80">{c.purpose}</td>
                  <td className="px-5 py-4 font-mono text-[12px] text-reps-muted-light">{c.examples}</td>
                  <td className="px-5 py-4">
                    {c.required ? (
                      <span className="inline-flex h-6 items-center rounded-full bg-reps-charcoal/10 px-2.5 text-[11px] font-semibold text-reps-charcoal">
                        Always on
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex h-7 w-12 items-center rounded-full bg-reps-orange p-0.5 shadow-none"
                        aria-label={`Toggle ${c.name} cookies`}
                      >
                        <span className="ml-auto h-6 w-6 rounded-full bg-white" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-reps-stone bg-reps-ivory p-5">
          <p className="max-w-[600px] text-[13px] text-reps-charcoal/80">
            Changes apply across all your REPS sessions. Essential cookies cannot be disabled because
            the platform needs them to keep you signed in securely.
          </p>
          <div className="flex gap-2">
            <button className="inline-flex h-10 items-center rounded-[10px] border border-reps-stone bg-white px-4 text-[13px] font-semibold text-reps-charcoal shadow-none hover:bg-reps-ivory">
              Reject optional
            </button>
            <button className="inline-flex h-10 items-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
              Save preferences
            </button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
