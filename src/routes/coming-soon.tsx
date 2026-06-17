import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ShieldCheck, Globe2, Hammer, BadgeCheck, Store, Workflow, Dumbbell, Brain, TrendingUp } from "lucide-react";

import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";

import { CountdownGrid } from "@/components/launch/CountdownGrid";
import { WaitlistForm } from "@/components/launch/WaitlistForm";

import heroAsset from "@/assets/about/about-hero.jpg.asset.json";

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: [
      { title: "REPS — Launching 26 June 2026" },
      {
        name: "description",
        content:
          "The professional platform for the modern fitness industry. Launching Friday 26 June 2026. Join the waitlist.",
      },
      { property: "og:title", content: "REPS — Launching 26 June 2026" },
      {
        property: "og:description",
        content: "The professional platform for the modern fitness industry. Launching Friday 26 June 2026.",
      },
      { property: "og:image", content: heroAsset.url },
      { property: "og:url", content: "/coming-soon" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "REPS — Launching 26 June 2026" },
      { name: "twitter:image", content: heroAsset.url },
      // Coming-soon page IS indexable (root is noindex by default — this overrides for this page only).
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "/coming-soon" }],
  }),
  component: ComingSoonPage,
});

const PROOF = [
  {
    icon: ShieldCheck,
    title: "An independent register",
    body: "Identity checked. Qualifications verified against the issuing awarding body. Insurance evidenced.",
  },
  {
    icon: Globe2,
    title: "Built for clients worldwide",
    body: "Find a professional you can trust wherever you train — in your city or online.",
  },
  {
    icon: Hammer,
    title: "Built with professionals",
    body: "Visibility, shop-front, operations, coaching, growth — one connected platform, not another directory.",
  },
];

const LAUNCHING = [
  {
    icon: BadgeCheck,
    label: "The verified register",
    body: "Identity checked. Qualifications verified against the issuing awarding body. Insurance evidenced. A profile that finally proves what someone is qualified to do.",
  },
  {
    icon: Store,
    label: "Pro shop-fronts",
    body: "A client-facing page that presents services, packages and proof with clarity — and a clean route to enquire, book and pay. No more linktrees and DMs.",
  },
  {
    icon: Workflow,
    label: "Operations that run the day",
    body: "Enquiries, bookings, forms, waivers, payments, client records and tasks in one place — replacing the spreadsheet-and-six-apps stack most pros are stuck with.",
  },
  {
    icon: Dumbbell,
    label: "Coaching, properly built",
    body: "Programmes, nutrition, check-ins, progress photos and a branded client portal — purpose-built for how real coaches actually work with real clients.",
  },
  {
    icon: Brain,
    label: "REPS AI",
    body: "Your day re-ranked by impact. Drafted replies in your tone. Risk alerts before a client ghosts. The signal — not the noise.",
  },
  {
    icon: TrendingUp,
    label: "Growth that compounds",
    body: "Reviews, retention, reactivation, referrals and business performance — surfaced as ranked actions, not another dashboard you'll never open.",
  },
];

function ComingSoonPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      {/* ----- 1. Hero ----------------------------------------------- */}
      <section className="relative overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Editorial portrait of a REPS-registered strength coach with an embroidered white REPS wordmark on the chest."
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <HeroOverlay copySide="left" />

        <div className="relative mx-auto flex max-w-[1320px] flex-col items-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="w-full max-w-[680px]">
            <MarketingHeroEyebrow icon={Sparkles}>
              Launching 26 June 2026
            </MarketingHeroEyebrow>

            <h1
              className="mt-5 font-display text-[44px] font-bold leading-[1.05] text-white animate-fade-in lg:text-[64px]"
              style={{ animationDelay: "80ms", animationDuration: "640ms" }}
            >
              The professional standard for fitness is almost here.
            </h1>

            <p
              className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/80 animate-fade-in"
              style={{ animationDelay: "180ms", animationDuration: "560ms" }}
            >
              A new professional home for fitness professionals — combining public trust,
              visibility, education, reviews and business software in one connected platform.
            </p>

            <div
              className="mt-10 animate-fade-in"
              style={{ animationDelay: "260ms", animationDuration: "560ms" }}
            >
              <CountdownGrid />
            </div>

            <div
              className="mt-8 max-w-[520px] animate-fade-in"
              style={{ animationDelay: "340ms", animationDuration: "560ms" }}
            >
              <WaitlistForm id="join" />
            </div>
          </div>
        </div>
      </section>

      {/* ----- 2. Proof strip (tight under hero) --------------------- */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 pt-10 pb-16 lg:px-10 lg:pt-12 lg:pb-20">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border md:grid-cols-3">
            {PROOF.map((p) => (
              <div key={p.title} className="bg-reps-panel px-6 py-8">
                <p.icon className="h-5 w-5 text-reps-orange" aria-hidden />
                <div className="mt-4 font-display text-[18px] font-semibold leading-tight text-white lg:text-[20px]">
                  {p.title}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- 3. What's launching ----------------------------------- */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[780px]">
            <SectionEyebrow>What's launching</SectionEyebrow>
            <SectionHeading className="mt-3">
              Not another directory. Not another booking app. The professional platform fitness has been waiting for.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              Six connected products under one professional standard — public trust, visibility,
              shop-front, operations, coaching and growth — built around the way fitness
              professionals actually work today.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {LAUNCHING.map((item, idx) => (
              <article
                key={item.label}
                className="group relative overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel p-7 transition-colors hover:border-reps-orange-border"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft text-reps-orange">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-[20px] font-semibold leading-tight text-white lg:text-[22px]">
                  {item.label}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----- 4. Close — bring people back to the form -------------- */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-10 text-center lg:p-16">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
            />
            <div className="relative mx-auto max-w-[640px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                Friday 26 June 2026 · 00:00 BST
              </span>
              <h2 className="mt-5 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
                Be the first to know.
                <br />
                <span className="text-reps-orange">No noise. One email.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[480px] text-[15px] text-white/70">
                We'll send a single email the moment REPS goes live — with priority access
                for professionals who join the waitlist today.
              </p>
              <div className="mx-auto mt-8 max-w-[480px]">
                <WaitlistForm id="join-bottom" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----- Existing member notice -------------------------------- */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 pb-16 lg:px-10 lg:pb-20">
          <div className="mx-auto flex max-w-[720px] flex-col items-center gap-3 rounded-[18px] border border-reps-border bg-reps-panel/40 px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <div className="font-display text-[15px] font-semibold text-white">
                Already a member of the previous register?
              </div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/65">
                Your existing profile is still available while we migrate to the new platform.
              </p>
            </div>
            <a
              href="https://legacy.repsuk.org"
              className="inline-flex shrink-0 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-4 py-2 text-[13px] font-semibold text-reps-orange transition-colors hover:bg-reps-orange hover:text-white"
            >
              Access legacy site
            </a>
          </div>
        </div>
      </section>

      {/* ----- Minimal footer ---------------------------------------- */}
      <footer>
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-6 pb-10 pt-2 text-[12px] text-white/45 sm:flex-row lg:px-10">
          <span>© REPS {new Date().getFullYear()}</span>
          <a
            href="mailto:press@repsuk.org"
            className="transition-colors hover:text-white/70"
          >
            press@repsuk.org
          </a>
        </div>
      </footer>
    </div>
  );
}
