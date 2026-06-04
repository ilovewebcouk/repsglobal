import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  FileCheck,
  Fingerprint,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGym from "@/assets/hero-gym-bg.jpg";
import ctaBand from "@/assets/cta-band.jpg";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify a REPs Professional — Trust & Safety" },
      {
        name: "description",
        content:
          "Learn what the REPs Verified Professional badge means, how we check qualifications, insurance and identity, and how to verify any trainer you meet.",
      },
      { property: "og:title", content: "Verify a REPs Professional" },
      {
        property: "og:description",
        content:
          "How to spot a verified REPs professional and check any trainer before you book.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/verify" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/verify" }],
  }),
  component: VerifyPage,
});

const CHECKS = [
  {
    icon: FileCheck,
    title: "Qualifications checked",
    body: "Certificates matched against awarding-body registers — not taken on trust.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance verified",
    body: "Current public liability and professional indemnity, with expiry dates on file.",
  },
  {
    icon: Fingerprint,
    title: "Identity confirmed",
    body: "Government-issued photo ID matched to the person on the profile.",
  },
  {
    icon: RefreshCw,
    title: "Ongoing CPD",
    body: "Continuing development logged quarterly. Lapses suspend the profile.",
  },
];

const SPOT = [
  {
    icon: BadgeCheck,
    title: "On a pro's profile",
    body: "The orange Verified Professional badge sits next to the name at the top of every REPs profile.",
  },
  {
    icon: Search,
    title: "In search results",
    body: "Every listing on Find a Professional shows the badge inline — unverified profiles are never publicly listed.",
  },
  {
    icon: Star,
    title: "Next to reviews",
    body: "Reviews come from clients with confirmed bookings — not anonymous submissions.",
  },
];

const OFFLINE = [
  {
    icon: QrCode,
    title: "Scan their REPs QR",
    body: "Verified pros can display a personal REPs QR code on posters, business cards or social media. Scanning takes you straight to their REPs profile.",
  },
  {
    icon: Search,
    title: "Search their name",
    body: "Type the trainer's name into Find a Professional. If they're a REPs member in good standing, their verified profile will appear.",
  },
  {
    icon: Camera,
    title: "Ask for their REPs ID",
    body: "Every REPs member has a unique ID. Ask for it, then look them up directly — no ID means no current registration.",
  },
];

function VerifyPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <img
          src={heroGym}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Verify a professional
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            How to know your trainer is{" "}
            <span className="text-reps-orange">actually verified.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            The REPs Verified Professional badge isn't self-declared. Every pro on the register has
            passed independent checks on qualifications, insurance and identity — and is monitored
            for as long as they hold the badge.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Look up a professional <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/standards"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Our full standards
            </Link>
          </div>
        </div>
      </section>

      {/* What the badge means */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">What it means</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Four checks behind every Verified badge.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {CHECKS.map((c) => (
              <div
                key={c.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spotting the badge on REPs */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">On REPs</span>
              <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
                Spotting the badge on the platform.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/65">
                Wherever a REPs professional appears across the platform, the verified badge travels
                with them — so you always know what you're looking at.
              </p>

              <div className="mt-6 inline-flex items-center gap-3 rounded-[18px] border border-reps-orange-border bg-reps-orange-soft px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange text-white">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold uppercase tracking-wider text-reps-orange">REPs Verified Professional</div>
                  <div className="text-[12px] text-white/60">This is what the badge looks like.</div>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              {SPOT.map((s) => (
                <div
                  key={s.title}
                  className="flex gap-4 rounded-[18px] border border-reps-border bg-reps-panel p-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] font-bold text-white">{s.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/65">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Off-platform verification */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Off the platform</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Checking a trainer you met in real life.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              Saw a poster in your gym? Following a coach on Instagram? Here's how to check they're
              who they say they are before you book a session.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {OFFLINE.map((o) => (
              <div
                key={o.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <o.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{o.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{o.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[22px] border border-reps-border bg-reps-panel/60 p-8 lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[20px] font-bold text-white">What the badge doesn't say</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                  Verification confirms a professional is qualified, insured and accountable. It is not a
                  personal endorsement of their coaching style, personality or specialism — that's what
                  reviews and the profile are for. If someone claims to be a REPs member but can't be
                  found on a public search or won't share a profile link, treat that as a red flag.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={ctaBand} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-reps-ink/85" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <h2 className="font-display text-[34px] font-bold leading-tight text-white lg:text-[44px]">
            Train with confidence. Every time.
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
            Look up any REPs professional before you book — or browse the full register of verified pros.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Find a professional <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/standards"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See full standards
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
