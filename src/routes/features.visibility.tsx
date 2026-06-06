import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, MapPin, Search, ShieldCheck, Sparkles, Star } from "lucide-react";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import heroVisibility from "@/assets/hero-visibility-bg.jpg.asset.json";

export const Route = createFileRoute("/features/visibility")({
  head: () => ({
    meta: [
      { title: "Visibility — Get found by the right clients · REPs" },
      {
        name: "description",
        content:
          "The verified profile on the register the public already searches. Real qualifications, real reviews, real placement in your city.",
      },
      { property: "og:title", content: "Visibility — REPs for Professionals" },
      {
        property: "og:description",
        content: "Be found. Be trusted. Be booked. Your verified REPs profile.",
      },
      { property: "og:image", content: heroVisibility.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/visibility" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/visibility" }],
  }),
  component: VisibilityPillar,
});

function VisibilityPillar() {
  return (
    <FeatureGroupLayout
      groupKey="visibility"
      heroLead="Stop shouting into Instagram."
      heroAccent="Show up where the public is already looking."
      heroImage={{
        src: heroVisibility.url,
        alt: "Verified REPs trainer standing outside a premium boutique studio at dusk",
      }}
    >
      {/* WHAT VERIFIED ACTUALLY MEANS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              What "verified" actually means
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
              Anyone can call themselves a coach. The badge means someone checked.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Every REPs profile is reviewed by the standards team before it goes live. Four things checked — properly, by humans, against the documents you upload.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, title: "Qualifications", body: "Level 3 PT minimum. Specialisms checked against the awarding body — not just a screenshot." },
              { icon: ShieldCheck, title: "Insurance", body: "Live public liability cover. Expires? Your badge greys out until you renew." },
              { icon: Check, title: "Identity & DBS", body: "Photo ID and (where you choose) an enhanced DBS check. Clients can filter for it." },
              { icon: Sparkles, title: "CPD on file", body: "Ongoing learning logged on your profile. Not a one-off tick from five years ago." },
            ].map((s) => (
              <div key={s.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHERE YOU SHOW UP */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Where you show up
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
              One verified profile. Four places clients find you.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { icon: Search, title: "Directory search", body: "Filter by goal, location, gender, in-person or online. Verified pros only — no clutter." },
              { icon: MapPin, title: "City & suburb pages", body: "Real pages for real places. \"Personal trainers in Clapham\" is a page, not a search URL." },
              { icon: Star, title: "Profession pages", body: "Pilates. Strength. Pre/post-natal. Each one its own page, ranking on Google." },
              { icon: Sparkles, title: "AI search results", body: "When someone asks ChatGPT for a verified PT near them, REPs is the source it cites." },
            ].map((s) => (
              <div key={s.title} className="flex gap-4 rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Reviews that mean something
              </span>
              <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
                Only your actual clients can leave one.
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                Every review is tied to a real client record — someone who's booked, paid and trained with you on REPs. No anonymous Google bombing. No paid-for stars. The reviews on your profile are the same ones on your shop-front, on the public record.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Tied to a verified client booking — not an anonymous form.",
                  "You can reply once, publicly. No back-and-forth review wars.",
                  "Bad-faith reviews are flagged and removed by the standards team.",
                  "Your overall score follows you, even if you change gyms.",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[22px] border border-reps-border bg-reps-panel p-7">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-reps-orange text-reps-orange" />
                ))}
                <span className="ml-1 text-[13px] font-semibold text-white">4.9</span>
                <span className="text-[13px] text-white/55">· 47 verified reviews</span>
              </div>
              <blockquote className="mt-5 text-[16px] leading-relaxed text-white/85">
                "James got me from a 100kg deadlift to 160kg in eleven months without my back going. The check-ins kept me honest when I'd have skipped the boring sessions."
              </blockquote>
              <div className="mt-4 flex items-center gap-3 text-[12.5px] text-white/55">
                <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-reps-orange">
                  <BadgeCheck className="h-3 w-3" /> Verified client
                </span>
                <span>· 14 months training</span>
              </div>
              <Link
                to="/c/$slug"
                params={{ slug: "james-wilson" }}
                target="_blank"
                className="mt-6 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange hover:underline"
              >
                See a live profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </FeatureGroupLayout>
  );
}
