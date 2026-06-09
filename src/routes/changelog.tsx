import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import {
  FeatureStatusBadge,
  type FeatureStatus,
} from "@/components/marketing/FeatureStatusBadge";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — REPs Pro · Founder Access" },
      {
        name: "description",
        content:
          "Recent releases, improvements and beta updates on REPs Pro. Updated as features ship through Founder Access.",
      },
      { property: "og:title", content: "REPs changelog" },
      {
        property: "og:description",
        content: "Recent releases and beta updates on REPs Pro.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/changelog" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/changelog" }],
  }),
  component: ChangelogPage,
});

type ChangelogEntry = {
  date: string;
  title: string;
  body: string;
  status?: FeatureStatus;
};

type ChangelogRelease = {
  label: string;
  entries: ChangelogEntry[];
};

const RELEASES: ChangelogRelease[] = [
  {
    label: "June 2026",
    entries: [
      {
        date: "9 Jun 2026",
        title: "Founder Access disclosure system",
        body: "Public roadmap, changelog and feature status labels rolled out across Pro feature pages and pricing.",
        status: "available",
      },
      {
        date: "7 Jun 2026",
        title: "Exercise library — upload your own",
        body: "Library tabs now show curated demos by category, and Pros can upload their own clips alongside the library.",
        status: "beta",
      },
      {
        date: "4 Jun 2026",
        title: "Programme delivery mock-up refreshed",
        body: "New live exercise demos, cleaner tabs and a clearer split between library exercises and your own uploads.",
        status: "beta",
      },
    ],
  },
  {
    label: "May 2026",
    entries: [
      {
        date: "28 May 2026",
        title: "Client record beta released",
        body: "Single source of truth for each client: sessions, forms, notes, payments and history.",
        status: "beta",
      },
      {
        date: "21 May 2026",
        title: "Check-in workflow improved",
        body: "Weekly check-ins now group ratings, photos and notes into a single review surface.",
        status: "beta",
      },
      {
        date: "14 May 2026",
        title: "Bookings — pending forms surfaced",
        body: "Outstanding PAR-Qs and consents now surface on the operations dashboard before sessions start.",
        status: "available",
      },
      {
        date: "6 May 2026",
        title: "Shop Front enquiry flow",
        body: "Service pages now feed structured enquiries into your leads list, scored and ready to action.",
        status: "available",
      },
    ],
  },
  {
    label: "April 2026",
    entries: [
      {
        date: "29 Apr 2026",
        title: "Nutrition coaching moved to Coming soon",
        body: "Nutrition targets, plans and check-ins entered active build. Track progress on the roadmap.",
        status: "soon",
      },
      {
        date: "22 Apr 2026",
        title: "Founder pricing launched",
        body: "Early access pricing opened for the first cohort of REPs Pro Founder members.",
        status: "available",
      },
      {
        date: "10 Apr 2026",
        title: "Operations pillar — first beta",
        body: "Dashboard, calendar, bookings, forms and client records released as the first connected operations beta.",
        status: "beta",
      },
    ],
  },
];

function ChangelogPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange/40 bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
            <Sparkles className="size-3.5" /> Founder Access · Changelog
          </span>
          <h1 className="mt-5 max-w-[820px] font-display text-[40px] font-bold leading-tight text-white lg:text-[56px]">
            What's shipping on
            <br />
            <span className="text-reps-orange">REPs Pro this month.</span>
          </h1>
          <p className="mt-5 max-w-[680px] text-[16px] leading-relaxed text-white/75">
            Follow what Founder members are getting first. New features, beta updates and quality
            improvements — updated as they ship.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/roadmap"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-white/20 bg-white/5 px-5 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              View roadmap <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/20 bg-white/5 px-5 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[920px] px-6 py-16 lg:px-10 lg:py-20">
          <ol className="flex flex-col gap-12">
            {RELEASES.map((release) => (
              <li key={release.label} className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[20px] font-bold text-white">
                    {release.label}
                  </span>
                  <span className="h-px flex-1 bg-reps-border" />
                </div>
                <ul className="flex flex-col gap-4">
                  {release.entries.map((entry) => (
                    <li
                      key={entry.title}
                      className="rounded-[16px] border border-reps-border bg-reps-panel p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
                          {entry.date}
                        </span>
                        {entry.status ? (
                          <FeatureStatusBadge status={entry.status} compact />
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-display text-[17px] font-bold text-white">
                        {entry.title}
                      </h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">
                        {entry.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
