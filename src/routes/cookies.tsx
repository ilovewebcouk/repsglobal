import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";

const CANONICAL = "https://repsuk.org/cookies";
const META_TITLE = "Cookie Policy — REPs";
const META_DESC =
  "How REPs uses cookies and similar technologies, what categories we use, and how to manage your preferences.";
const LAST_UPDATED = "1 July 2026";

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
  provider: string;
  purpose: string;
  duration: string;
  required: boolean;
}[] = [
  {
    name: "reps.consent.v1",
    provider: "REPS (essential)",
    purpose: "Remembers your cookie choice.",
    duration: "12 months",
    required: true,
  },
  {
    name: "reps.public.session_id",
    provider: "REPS (essential, session)",
    purpose:
      "Groups a single visit for analytics rollups (only used if analytics accepted).",
    duration: "Until browser tab closes",
    required: true,
  },
  {
    name: "ph_*",
    provider: "PostHog (EU), routed via repsuk.org/_a",
    purpose:
      "Anonymous usage analytics (page views, referrers, enquiry conversions). No IP stored.",
    duration: "Up to 12 months",
    required: false,
  },
];

function CookieTable() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
      <div className="hidden grid-cols-[180px_1fr_180px_140px] gap-4 border-b border-reps-border bg-reps-panel/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 lg:grid">
        <span>Cookie</span>
        <span>Purpose</span>
        <span>Provider</span>
        <span>Duration</span>
      </div>
      <ul>
        {CATEGORIES.map((cat, i) => (
          <li
            key={cat.name}
            className={`grid gap-2 px-5 py-5 lg:grid-cols-[180px_1fr_180px_140px] lg:items-start lg:gap-4 ${
              i > 0 ? "border-t border-reps-border" : ""
            }`}
          >
            <span className="font-display text-[14px] font-semibold text-white">
              <code>{cat.name}</code>
              <span
                className={
                  cat.required
                    ? "ml-2 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300"
                    : "ml-2 inline-flex items-center rounded-full border border-reps-border bg-reps-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70"
                }
              >
                {cat.required ? "Always on" : "Optional"}
              </span>
            </span>
            <span className="text-[14px] leading-relaxed text-white/75">
              {cat.purpose}
            </span>
            <span className="text-[13px] text-white/60">{cat.provider}</span>
            <span className="text-[13px] text-white/60">{cat.duration}</span>
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
    title: "Analytics cookies",
    body: (
      <>
        <p>
          We use a small, defined set of cookies. Essential cookies are always
          active because REPs will not function without them. Analytics
          cookies are set only after you accept, and never if your browser
          sends Do Not Track or Global Privacy Control.
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
          You can change your choice at any time using the{" "}
          <strong>"Cookie preferences"</strong> link in the site footer, or
          directly through your browser settings. Withdrawing analytics
          consent immediately stops capture and clears PostHog cookies from
          your device.
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
