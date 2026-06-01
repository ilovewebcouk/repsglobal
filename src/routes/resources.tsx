import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users, Briefcase, BadgeCheck, Megaphone, BookOpen } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGym from "@/assets/hero-gym-bg.jpg";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "REPs Resources — Guides for Clients & Fitness Professionals" },
      {
        name: "description",
        content:
          "Plain-English guides for people looking for a trainer, and growth playbooks for REPs-verified professionals. Plus verification explainers and platform updates.",
      },
      { property: "og:title", content: "REPs Resources" },
      {
        property: "og:description",
        content:
          "Guides for clients, growth playbooks for pros, verification explainers and platform updates.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/resources" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/resources" }],
  }),
  component: ResourcesPage,
});

const HUBS = [
  {
    icon: Users,
    badge: "For the public",
    title: "Finding the right professional",
    body: "How to choose a personal trainer, what verification actually means, and how to spot a quality coach before you book.",
  },
  {
    icon: Briefcase,
    badge: "For professionals",
    title: "Grow your fitness business",
    body: "Win more clients, run better check-ins, structure programmes and convert enquiries — written by working coaches.",
  },
  {
    icon: BadgeCheck,
    badge: "Verification & standards",
    title: "How REPs keeps the bar high",
    body: "Behind the badge — what we check, how we audit and how complaints are handled.",
  },
  {
    icon: Megaphone,
    badge: "Platform updates",
    title: "What's new on REPs",
    body: "Product changelogs, new tools for pros and improvements to the public directory.",
  },
];

const FEATURED = [
  { tag: "For the public", title: "How to choose the right personal trainer" },
  { tag: "For the public", title: "What does a REPs Verified Professional mean?" },
  { tag: "For the public", title: "Online coaching vs in-person personal training" },
  { tag: "For professionals", title: "How to convert enquiries into paying clients" },
  { tag: "For professionals", title: "How to run better weekly client check-ins" },
  { tag: "Verification", title: "Why verified profiles build more trust" },
];

function ResourcesPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroGym} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Resources
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Plain-English guides for <span className="text-reps-orange">both sides</span> of the
            marketplace.
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            For clients: how to find and choose a trainer you can actually trust. For
            professionals: how to grow your business and stand out on REPs.
          </p>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Browse by hub</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Four resource hubs.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {HUBS.map((h) => (
              <div key={h.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <h.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                    {h.badge}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[20px] font-bold text-white">{h.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Coming soon</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Featured guides we're writing first.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              The REPs Resources library launches alongside the platform. Here's the lineup
              going live first — bookmark this page or check back soon.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((f) => (
              <div key={f.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                  <BookOpen className="h-3.5 w-3.5" /> {f.tag}
                </div>
                <h3 className="mt-3 font-display text-[16px] font-bold leading-snug text-white">
                  {f.title}
                </h3>
                <span className="mt-3 inline-block text-[12px] text-white/50">Coming soon</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Find a professional <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Join REPs
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
