import { createFileRoute, Link } from"@tanstack/react-router";
import { Award, Globe, Heart, ShieldCheck, Sparkles, Target, Users } from"lucide-react";

import { PublicHeader } from"@/components/public/PublicHeader";
import { PublicFooter } from"@/components/public/PublicFooter";
import heroCoaching from"@/assets/hero-coaching-moment";
import ctaBand from"@/assets/cta-band.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title:"About REPs — The Register of Exercise Professionals" },
      {
        name:"description",
        content:
"REPs is the global register of verified exercise professionals — a single, trusted home for qualified PTs, coaches, instructors and nutritionists.",
      },
      { property:"og:title", content:"About REPs" },
      {
        property:"og:description",
        content:"The global register of verified exercise professionals.",
      },
      { property:"og:url", content:"/about" },
    ],
    links: [{ rel:"canonical", href:"/about" }],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: ShieldCheck, title:"Verified by default", body:"Every professional on REPs is checked for qualifications, insurance and ongoing CPD." },
  { icon: Heart, title:"Built around clients", body:"Honest reviews, transparent pricing, and the freedom to choose who you train with." },
  { icon: Target, title:"Standards that grow", body:"We continually raise the bar on what it means to be a registered exercise professional." },
  { icon: Globe, title:"Global, local, online", body:"Search across cities or online sessions — REPs works wherever you do." },
];

const STATS = [
  { v:"25,000+", k:"Verified professionals" },
  { v:"1M+", k:"Sessions booked" },
  { v:"120+", k:"Countries" },
  { v:"4.8★", k:"Avg. client rating" },
];

const TIMELINE = [
  { yr:"2009", t:"Body & Discipline founded", body:"Our predecessor register builds the foundation of recognised fitness standards." },
  { yr:"2018", t:"Global standards programme", body:"Cross-border CPD frameworks aligned with EuropeActive and ICREPs." },
  { yr:"2024", t:"REPs relaunches", body:"A modern register: verified, searchable, client-first." },
  { yr:"2026", t:"REPs goes global", body:"BD members migrate to REPs as we open new regions." },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden">
        <img
          src={heroCoaching}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/70 via-reps-ink/85 to-reps-ink" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-24 text-center lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> About REPs
          </span>
          <h1 className="mt-5 font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            The global register for
            <br />
            <span className="text-reps-orange">verified exercise professionals.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[16px] leading-relaxed text-white/70">
            REPs exists so people can find, trust and train with qualified professionals — and so professionals
            can build their reputation on a register that means something.
          </p>
        </div>
      </section>

      <section className="bg-reps-panel/40">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border md:grid-cols-4 px-6 my-12 lg:px-10">
          {STATS.map((s) => (
            <div key={s.k} className="bg-reps-panel p-6 text-center">
              <div className="font-display text-[28px] font-bold text-white">{s.v}</div>
              <div className="mt-1 text-[12px] text-white/55">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                Our mission
              </span>
              <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
                Make finding a great trainer feel as safe as booking a doctor.
              </h2>
            </div>
            <p className="text-[15px] leading-relaxed text-white/70">
              Anyone can call themselves a personal trainer. We think clients deserve more than that. REPs verifies
              qualifications, insurance and continuing professional development — then surfaces honest reviews
              alongside transparent pricing and availability. The result: less guessing, more training, and a
              register the industry can be proud of.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <h2 className="font-display text-[28px] font-bold text-white">What we stand for</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            Since 2009
          </span>
          <h2 className="mt-2 font-display text-[28px] font-bold text-white lg:text-[34px]">
            A short history.
          </h2>
          <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-white/65">
            REPs was built on the register the public has trusted since 2009 — rebuilt for a global, verified,
            AI-powered fitness profession.
          </p>

          <ol className="mt-8 space-y-6">
            {TIMELINE.map((t) => (
              <li
                key={t.yr}
                className="flex gap-6 rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="w-20 shrink-0 font-display text-[22px] font-bold text-reps-orange">
                  {t.yr}
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-bold text-white">{t.t}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/65">{t.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <img src={ctaBand} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-reps-ink/85" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <h2 className="font-display text-[34px] font-bold leading-tight text-white lg:text-[44px]">
            Join the register that means something.
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
            Whether you're looking for a trainer or you are one, REPs is built around trust, quality and growth.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Find a professional
            </Link>
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Join as a professional
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
