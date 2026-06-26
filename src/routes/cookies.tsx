import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";

const CANONICAL = "https://repsuk.org/cookies";
const META_TITLE = "Cookie Policy — REPs";
const META_DESC =
  "How REPs uses cookies and similar technologies, what categories we use, and how to manage your preferences.";
const LAST_UPDATED = "26 June 2026";

export const Route = createFileRoute("/cookies")({
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
  component: CookiesPage,
});

const CATEGORIES: {
  name: string;
  required: boolean;
  purpose: string;
  examples: string;
}[] = [
  {
    name: "Essential",
    required: true,
    purpose:
      "Authentication, security and load balancing. The platform cannot function without these.",
    examples: "reps_session, csrf_token",
  },
  {
    name: "Functional",
    required: false,
    purpose:
      "Remember preferences such as language, region and saved professionals.",
    examples: "reps_locale, reps_saved_pros",
  },
  {
    name: "Analytics",
    required: false,
    purpose:
      "Help us understand how the platform is used so we can improve it. Aggregated, not used to identify you.",
    examples: "Anonymous usage IDs",
  },
  {
    name: "Marketing",
    required: false,
    purpose:
      "Measure the performance of REPs campaigns and surface relevant content.",
    examples: "Campaign attribution IDs",
  },
];

function CookieTable() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
      <div className="hidden grid-cols-[140px_1fr_180px_120px] gap-4 border-b border-reps-border bg-reps-panel/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 lg:grid">
        <span>Category</span>
        <span>Purpose</span>
        <span>Examples</span>
        <span>Status</span>
      </div>
      <ul>
        {CATEGORIES.map((cat, i) => (
          <li
            key={cat.name}
            className={`grid gap-2 px-5 py-5 lg:grid-cols-[140px_1fr_180px_120px] lg:items-start lg:gap-4 ${
              i > 0 ? "border-t border-reps-border" : ""
            }`}
          >
            <span className="font-display text-[15px] font-semibold text-white">
              {cat.name}
            </span>
            <span className="text-[14px] leading-relaxed text-white/75">
              {cat.purpose}
            </span>
            <span className="text-[13px] text-white/60">{cat.examples}</span>
            <span>
              <span
                className={
                  cat.required
                    ? "inline-flex items-center rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-orange"
                    : "inline-flex items-center rounded-full border border-reps-border bg-reps-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70"
                }
              >
                {cat.required ? "Always on" : "Optional"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "what-cookies-are",
    title: "What cookies are",
    body: (
      <>
        <p>
          Cookies are small text files stored on your device when you visit a
          website. We use cookies and similar technologies (such as
          localStorage and pixel tags) to keep you signed in, remember your
          preferences and understand how REPs is used.
        </p>
        <p>
          This page explains what we use and how to control it. You can change
          your preferences at any time.
        </p>
      </>
    ),
  },
  {
    id: "categories",
    title: "Categories we use",
    body: (
      <>
        <p>
          We group cookies into four categories. Only "Essential" cookies are
          always on — the rest are optional.
        </p>
        <CookieTable />
      </>
    ),
  },
  {
    id: "managing",
    title: "Managing your preferences",
    body: (
      <>
        <p>
          You can manage non-essential cookies through our in-app preferences
          (coming soon) or directly through your browser settings. Most
          browsers let you block or delete cookies and warn you before they're
          set.
        </p>
        <p>
          Blocking essential cookies will prevent core features — such as
          signing in — from working.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third-party cookies",
    body: (
      <p>
        Some pages embed services from third parties — for example, our
        analytics provider and our payments processor at checkout. These
        providers may set their own cookies under their own policies. We never
        share personal data with third parties for their own marketing
        without your consent.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the platform evolves. The "Last updated"
        date at the top of this page always reflects the current version.
      </p>
    ),
  },
  {
    id: "contact",
    title: "How to contact us",
    body: (
      <p>
        Email <a href="mailto:support@repsuk.org">support@repsuk.org</a> with
        any question about cookies or this policy.
      </p>
    ),
  },
];

function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      lede="How REPs uses cookies and similar technologies, and how you can control them."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
