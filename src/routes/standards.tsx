import { createFileRoute, Link } from"@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  FileCheck,
  Fingerprint,
  HeartPulse,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
} from"lucide-react";

import { PublicHeader } from"@/components/public/PublicHeader";
import { PublicFooter } from"@/components/public/PublicFooter";
import heroGym from"@/assets/hero-gym-bg.jpg";
import ctaBand from"@/assets/cta-band.jpg";

export const Route = createFileRoute("/standards")({
  head: () => ({
    meta: [
      { title:"Safeguarding & standards — REPs verification" },
      {
        name:"description",
        content:
"Every professional on REPs is verified for qualifications, insurance, ID and ongoing CPD. Learn how we uphold safeguarding and trust standards.",
      },
      { property:"og:title", content:"Safeguarding & standards — REPs" },
      {
        property:"og:description",
        content:
"How REPs verifies professionals and keeps clients safe.",
      },
      { property:"og:url", content:"/standards" },
    ],
    links: [{ rel:"canonical", href:"/standards" }],
  }),
  component: StandardsPage,
});

const VERIFICATIONS = [
  {
    icon: FileCheck,
    title:"Qualifications checked",
    body:"We verify certificates against awarding-body registers. Every claim is backed by documentation — not just a tick box.",
  },
  {
    icon: ShieldCheck,
    title:"Insurance verified",
    body:"Professionals must hold current public liability and professional indemnity cover. We check expiry dates and renewal records.",
  },
  {
    icon: Fingerprint,
    title:"Identity confirmed",
    body:"Government-issued photo ID is matched against the person on the profile. No aliases, no borrowed credentials.",
  },
  {
    icon: RefreshCw,
    title:"Ongoing CPD tracking",
    body:"Members log continuing professional development quarterly. Lapses trigger a profile suspension until evidence is re-submitted.",
  },
];

const SAFEGUARDS = [
  {
    icon: HeartPulse,
    title:"Safeguarding by design",
    body:"All members agree to our Safeguarding & Professional Conduct code before joining. It covers physical safety, data protection, boundaries and duty of care.",
  },
  {
    icon: Users,
    title:"Complaints process",
    body:"Clients can raise concerns directly through REPs. Every complaint is reviewed within 48 hours, escalated where necessary, and logged transparently.",
  },
  {
    icon: UserCheck,
    title:"Continuous monitoring",
    body:"Profiles are re-audited every six months. Insurance lapses, qualification gaps or conduct flags automatically hide the profile from search.",
  },
];

const TRUST = [
  {
    icon: BadgeCheck,
    title:"Verified badge",
    body:"The orange badge on a profile means every claim has been checked by our team — not self-declared.",
  },
  {
    icon: Star,
    title:"Verified reviews only",
    body:"Reviews come from clients with confirmed bookings. Anonymous ratings and bulk submissions are blocked.",
  },
  {
    icon: BookOpen,
    title:"Transparent history",
    body:"Professional profiles show CPD logs, insurance renewals and any past complaints — so you can choose with confidence.",
  },
];

function StandardsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroGym}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Trust & safety
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Verified. Insured. Accountable.{""}
            <span className="text-reps-orange">That's the REPs standard.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            Anyone can list a profile. On REPs, every professional is checked, monitored and held to a
            code of conduct — so clients can train with total confidence.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Find a verified pro <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Join the register
            </Link>
          </div>
        </div>
      </section>

      {/* What we verify */}
      <section className="">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Verification</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Four checks before a profile goes live.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {VERIFICATIONS.map((v) => (
              <div
                key={v.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6 lg:p-8"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[18px] font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safeguarding */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Safeguarding</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Safety isn't an afterthought — it's built in.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SAFEGUARDS.map((s) => (
              <div
                key={s.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How clients know */}
      <section className="">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Reading a profile</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              How to spot a verified REPs professional.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TRUST.map((t) => (
              <div
                key={t.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <t.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{t.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <img src={ctaBand} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-reps-ink/85" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <h2 className="font-display text-[34px] font-bold leading-tight text-white lg:text-[44px]">
            Train with professionals you can trust.
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
            Every profile on REPs is verified, monitored and backed by a clear complaints process. Start your search today.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
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
              Join as a professional
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
