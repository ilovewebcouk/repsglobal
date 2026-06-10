import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import {
  FeatureStatusBadge,
  FEATURE_STATUS_LABEL,
  type FeatureStatus,
} from "@/components/marketing/FeatureStatusBadge";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — REPs Pro · Founder Access" },
      {
        name: "description",
        content:
          "What's available now, in beta, coming soon and planned on REPs Pro. Founder Access is staged — see how the platform is expanding.",
      },
      { property: "og:title", content: "REPs Pro roadmap" },
      {
        property: "og:description",
        content: "Available now, in beta, coming soon and planned on REPs Pro.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/roadmap" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/roadmap" }],
  }),
  component: RoadmapPage,
});

type RoadmapItem = {
  title: string;
  body: string;
  href?: string;
};

const AVAILABLE: RoadmapItem[] = [
  { title: "REPs profile", body: "Public, verified professional profile with services and proof.", href: "/features/visibility" },
  { title: "Shop Front", body: "Service pages, enquiry flow and lead capture connected to your record.", href: "/features/shop-front" },
  { title: "Client records", body: "Single source of truth for every client, session and note.", href: "/features/operations" },
  { title: "Bookings & calendar", body: "Sessions, consultations and assessments in one calendar.", href: "/features/operations" },
  { title: "Forms & waivers", body: "PAR-Q, consent and onboarding forms with signatures.", href: "/features/operations" },
];

const BETA: RoadmapItem[] = [
  { title: "Programme delivery", body: "Build, deliver and update programmes from your library or your own clips.", href: "/features/coaching" },
  { title: "Exercise library", body: "Curated library plus your own uploaded exercises and videos.", href: "/features/coaching" },
  { title: "Check-ins", body: "Weekly check-ins, ratings and structured client responses.", href: "/features/coaching" },
  { title: "Messaging", body: "In-platform messaging tied to each client record.", href: "/features/coaching" },
  { title: "Payments", body: "Take card payments for services, packages and subscriptions.", href: "/features/operations" },
];

const SOON: RoadmapItem[] = [
  { title: "Nutrition coaching", body: "Targets, plans and weekly nutrition check-ins inside the client record.", href: "/features/coaching" },
  { title: "Habit tracking", body: "Daily habit prompts and streaks alongside training.", href: "/features/coaching" },
  { title: "Automations", body: "Lead, onboarding and check-in workflows that run themselves.", href: "/features/operations" },
  { title: "AI programme writer", body: "Draft programmes from goals, history and constraints.", href: "/features/ai" },
  { title: "AI check-in summariser", body: "Summarise client check-ins and flag risk in seconds.", href: "/features/ai" },
];

const PLANNED: RoadmapItem[] = [
  { title: "Wearable data connections", body: "Apple Health, Garmin and Whoop data into the client record.", href: "/features/coaching" },
  { title: "Group programming", body: "Programme and check in on small groups from one view.", href: "/features/coaching" },
  { title: "Public reviews", body: "Verified reviews collected through completed sessions.", href: "/features/visibility" },
  { title: "Marketplace lead routing", body: "Qualified enquiries routed to the right pro by city and specialism.", href: "/features/visibility" },
];

type Section = {
  status: FeatureStatus;
  intro: string;
  items: RoadmapItem[];
};

const SECTIONS: Section[] = [
  { status: "available", intro: "Live in the current beta for every Founder member.", items: AVAILABLE },
  { status: "beta", intro: "Released and being refined with early members in real workflows.", items: BETA },
  { status: "soon", intro: "Next on the build queue — staged releases through the Founder period.", items: SOON },
  { status: "planned", intro: "On the roadmap. We'll announce timing once they enter active build.", items: PLANNED },
];

function RoadmapPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange/40 bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
            <Sparkles className="size-3.5" /> Founder Access · Roadmap
          </span>
          <h1 className="mt-5 max-w-[820px] font-display text-[40px] font-bold leading-tight text-white lg:text-[56px]">
            What's live, what's next,
            <br />
            <span className="text-reps-orange">and where REPs Pro is heading.</span>
          </h1>
          <p className="mt-5 max-w-[680px] text-[16px] leading-relaxed text-white/75">
            REPs Pro is launching through Founder Access — core tools first, then advanced
            coaching, nutrition, automation and integration features in stages. Founder pricing
            is available during beta and remains active while your subscription stays active.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Join as a Founder member <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/changelog"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/20 bg-white/5 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See changelog
            </Link>
          </div>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.status} className="border-b border-reps-border">
          <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <FeatureStatusBadge status={section.status} />
                <h2 className="mt-3 font-display text-[28px] font-bold text-white lg:text-[36px]">
                  {FEATURE_STATUS_LABEL[section.status]}
                </h2>
                <p className="mt-2 max-w-[560px] text-[14px] text-white/65">{section.intro}</p>
              </div>
              <span className="text-[12px] text-white/45">
                {section.items.length} {section.items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <li
                  key={item.title}
                  className="flex flex-col gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-[16px] font-bold text-white">{item.title}</h3>
                    <FeatureStatusBadge status={section.status} compact />
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-white/65">{item.body}</p>
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="mt-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-reps-orange hover:underline"
                    >
                      Learn more <ArrowRight className="size-3.5" />
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[820px] px-6 py-16 text-center lg:px-10">
          <h2 className="font-display text-[24px] font-bold text-white">
            Following along as REPs Pro expands.
          </h2>
          <p className="mt-3 text-[14px] text-white/65">
            Releases are tracked on the changelog. Founder members get early access to every new
            feature as it ships.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/changelog"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              View changelog <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center rounded-[10px] border border-white/20 bg-white/5 px-5 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
