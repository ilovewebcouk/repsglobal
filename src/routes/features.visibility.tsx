import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Globe, Star } from "lucide-react";

import { PillarPage, type PillarFeature } from "@/components/features/PillarPage";
import heroVisibility from "@/assets/hero-visibility-bg.jpg.asset.json";

const FEATURES: PillarFeature[] = [
  {
    tag: "Capability 1 · Verified profile",
    title: "The profile clients actually trust before they enquire.",
    body:
      "A REPs profile isn't a listing — it's a credential. Qualifications, insurance and DBS are checked once and stamped on the record, so prospects stop interrogating and start booking.",
    bullets: [
      "REPs Verified badge after credentials are checked",
      "Qualifications, insurance and DBS shown on the record",
      "Specialisms, services and pricing in one scan",
      "Mobile-first layout that converts on a phone, not just desktop",
    ],
    mockup: {
      kind: "cinematic",
      composition: "card-trail",
      image: {
        src: heroVisibility.url,
        alt: "Verified REPs trainer coaching a client at a premium boutique studio",
      },
      stats: [
        {
          label: "Verified",
          value: "L3 PT",
          delta: "Insurance · DBS",
          icon: BadgeCheck,
        },
        {
          label: "Profile rating",
          value: "4.9",
          delta: "+18% enquiries",
          icon: Star,
        },
      ],
    },
    learnMoreSlug: "profile-and-reviews",
  },
  {
    tag: "Capability 2 · Directory placement",
    title: "Be the first verified pro a local client sees.",
    body:
      "The REPs directory at /find is where the public already searches for a trusted fitness professional. Profiles rank on reviews, recency and proximity — not on who paid for ads.",
    bullets: [
      "Indexed in /find by city, specialism and distance",
      "Verified-only filter — you're not buried under unchecked accounts",
      "Featured slots for Pro+ tiers when you're a strong match",
      "Live click and impression count on your dashboard",
    ],
    mockup: { device: "laptop", src: "/find", title: "REPs directory search results" },
  },
  {
    tag: "Capability 3 · Reviews on the record",
    title: "Reviews collected by REPs — and they stay on the record.",
    body:
      "Reviews are requested automatically after a real session and tied to a verified client record. You can reply. You can't delete. That's why prospects believe them.",
    bullets: [
      "Auto-requested 24h after a completed booking",
      "Only verified clients can leave one — no drive-by ratings",
      "Public reply thread on every review",
      "Aggregate score feeds your search ranking",
    ],
    mockup: { device: "laptop", src: "/pro/james-carter#reviews", title: "Reviews on the verified profile" },
    learnMoreSlug: "profile-and-reviews",
  },
  {
    tag: "Capability 4 · City & specialism pages",
    title: "REPs ranks for the searches your future clients are typing.",
    body:
      "Hundreds of city and specialism landing pages — \u201Cpilates instructors in Manchester\u201D, \u201Cstrength coach in Brixton\u201D — pull verified pros to the top of Google. You inherit that distribution the day you join.",
    bullets: [
      "Auto-listed on every relevant /in/<city> page",
      "Auto-listed on every /specialisms/<specialism> page",
      "Featured card placement for Pro+ tiers",
      "Schema and Open Graph rendered for every profile",
    ],
    mockup: { device: "laptop", src: "/in/manchester", title: "City landing page — Manchester" },
  },
  {
    tag: "Capability 5 · Share kit & social proof",
    title: "A polished share kit so every link looks like a brand, not a screenshot.",
    body:
      "Every Pro gets a generated share card, QR poster and social-ready assets — pre-branded with REPs Verified. Share once; look credible in every feed, DM and in-gym poster.",
    bullets: [
      "Open Graph share card auto-generated per profile",
      "Printable QR poster for the studio, table card or van",
      "Instagram story, LinkedIn header and email signature assets",
      "Profile-views and link-click count on your dashboard",
    ],
    mockup: { device: "phone", src: "/c/james-wilson", title: "Pro shop-front — the link people share" },
  },
];

export const Route = createFileRoute("/features/visibility")({
  head: () => ({
    meta: [
      { title: "Visibility — Get found by the right clients · REPs" },
      {
        name: "description",
        content:
          "Verified profile, reviews on the record, directory ranking, city/specialism SEO pages and a share kit. REPs is the one place the public already searches for a trusted fitness professional.",
      },
      { property: "og:title", content: "Visibility — REPs for Professionals" },
      {
        property: "og:description",
        content:
          "Be found. Be trusted. Be booked. Verified profile, reviews and directory placement.",
      },
      { property: "og:image", content: heroVisibility.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/visibility" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/visibility" }],
  }),
  component: () => (
    <PillarPage
      groupKey="visibility"
      heroLead="Not just a listing."
      heroAccent="The verified profile the public already trusts."
      heroImage={{
        src: heroVisibility.url,
        alt: "Verified REPs trainer standing outside a premium boutique studio at dusk",
      }}
      features={FEATURES}
    >
      {/* Cross-link to shop-front, which formally lives under its own pillar */}
      <section className="border-t border-reps-border/60 bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-8 rounded-[22px] border border-reps-border bg-reps-panel p-8 lg:grid-cols-[1fr_auto] lg:gap-12 lg:p-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                <Globe className="h-3.5 w-3.5" />
                Pro &amp; Studio
              </span>
              <h3 className="mt-3 font-display text-[26px] font-bold leading-tight text-white lg:text-[32px]">
                Want more than a profile? Add your own shop-front.
              </h3>
              <p className="mt-3 max-w-[560px] text-[14.5px] leading-relaxed text-white/70">
                Pro and Studio tiers get a full single-page site at{" "}
                <code className="rounded-[6px] bg-white/5 px-1.5 py-0.5 text-[13px] text-reps-orange">
                  /c/your-name
                </code>{" "}
                — your photo, your method, your tiers, your accent colour. Every CTA still drops
                into your REPs enquiry inbox.
              </p>
            </div>
            <Link
              to="/features/shop-front"
              className="inline-flex h-12 items-center gap-2 self-start rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover lg:self-center"
            >
              See the shop-front <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PillarPage>
  ),
});
