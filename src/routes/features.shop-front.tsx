import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, Globe, LayoutTemplate, Palette, Sparkles, Star, Zap } from "lucide-react";

import { SectionHeading } from "@/components/marketing/SectionHeading";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import coachJamesCoaching from "@/assets/coach-james-coaching.jpg";

export const Route = createFileRoute("/features/shop-front")({
  head: () => ({
    meta: [
      { title: "Shop-front — Your own page at /c/your-name · REPs" },
      {
        name: "description",
        content:
          "Every Pro and Studio member gets a personalised shop-front at /c/your-name — your photo, your method, your tiers, your proof. Every CTA drops into your REPs enquiry inbox.",
      },
      { property: "og:title", content: "Shop-front — REPs for Professionals" },
      {
        property: "og:description",
        content: "A page that sells you while you sleep. Included in Pro and Studio.",
      },
      { property: "og:image", content: coachJamesCoaching },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/shop-front" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/shop-front" }],
  }),
  component: ShopFrontPillar,
});

function ShopFrontPillar() {
  return (
    <FeatureGroupLayout
      groupKey="shopfront"
      heroLead="A page that sells you"
      heroAccent="while you sleep."
      heroImage={{
        src: coachJamesCoaching,
        alt: "REPs trainer coaching a client through a dumbbell row in a premium gym",
      }}
    >
      {/* SEE IT LIVE */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Live example
              </span>
              <SectionHeading className="mt-5">See an actual REPs shop-front.</SectionHeading>
              <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-white/70">
                This isn't a template preview — it's a fully-built Pro-tier page running on REPs. Open it in a new tab and scroll: outcome-led hero, three tier services, a methodology section, real transformations, reviews, FAQ and a contact panel — all wired into the same enquiry inbox you use in your dashboard.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/c/$slug"
                  params={{ slug: "james-wilson" }}
                  target="_blank"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Open the example <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
                >
                  See Pro pricing
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
              <img
                src={coachJamesCoaching}
                alt="REPs Pro shop-front for James Wilson"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-reps-ink/95 to-transparent p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                  /c/james-wilson
                </div>
                <div className="mt-1 font-display text-[20px] font-bold text-white">
                  Get visibly stronger in 12 weeks.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S ON THE PAGE */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              What's on the page
            </span>
            <SectionHeading className="mt-3">Nine sections. Every one of them earning its place.</SectionHeading>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Outcome hero", body: "Your headline is the promise, not your name. Coaching-action photo, floating verified card, scarcity line." },
              { title: "Sticky section nav", body: "Services · Method · Results · Reviews · FAQ · Contact — always one tap away." },
              { title: "Three tier services", body: "Online / Hybrid / In-Person. Middle tier marked 'Most popular' in your accent." },
              { title: "Methodology", body: "Three numbered pillars in your voice. The reason clients choose you over a cheaper coach." },
              { title: "About + venues", body: "A bio that pulls back, plus the gyms and studios you work from." },
              { title: "Transformations", body: "Real client results with metric overlays — not stock smiles." },
              { title: "Verified reviews", body: "The same reviews shown on your directory profile. On the public record." },
              { title: "Qualifications", body: "Level 3/4 PT, specialisms, insurance — all checked by the REPs standards team." },
              { title: "Contact panel", body: "Big enquire CTA, social icon row, client-login link. Every button lands in your inbox." },
            ].map((s) => (
              <div key={s.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <h3 className="font-display text-[16px] font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOUR BRAND, LIGHTLY */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Your brand, lightly
            </span>
            <SectionHeading className="mt-3">Personalised — without becoming a Wix project.</SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              You pick an accent colour from the REPs palette. You upload a coaching-action hero photo, a portrait for the about section, and three transformation images. You write your method, your tiers, your bio. REPs takes care of the rest — typography, spacing, dark theme, mobile, performance, SEO.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Palette, title: "Accent colour", body: "Pick from the REPs palette. Drives CTAs, ticks, badges and the hero glow." },
              { icon: LayoutTemplate, title: "Locked layout", body: "Section order, hero structure and tier-card design are designed once, well — so you can't break it." },
              { icon: Globe, title: "One link", body: "/c/your-name — a clean, shareable URL for your bio, your DMs and your business card." },
            ].map((s) => (
              <div key={s.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WIRED INTO REPS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Wired into REPs
            </span>
            <SectionHeading className="mt-3">Not a separate website. Part of the operating system.</SectionHeading>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Every enquire CTA drops into your REPs leads pipeline, scored by AI.",
              "The Verified badge and credentials read live from your standards record.",
              "Reviews shown are the same verified reviews on your directory profile.",
              "Client login deep-links to the same portal your existing clients already use.",
              "Tier card CTAs preselect the service in the locked enquiry flow.",
              "Edits go live instantly — no rebuild, no DNS, no Squarespace.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-[18px] border border-reps-border bg-reps-panel p-5 text-[14.5px] text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT COMPARES */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              How it compares
            </span>
            <SectionHeading className="mt-3">Other platforms give you a client portal. REPs gives you a shop-front.</SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Trainerize, MyPTHub and PT Distinction give you a login-walled app where existing clients track sessions. None of them publish a public single-page site at your own URL. That's the gap REPs Pro closes.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/compare"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Compare platforms <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/c/$slug"
              params={{ slug: "james-wilson" }}
              target="_blank"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
            >
              Open the live example
            </Link>
          </div>
        </div>
      </section>
    </FeatureGroupLayout>
  );
}
