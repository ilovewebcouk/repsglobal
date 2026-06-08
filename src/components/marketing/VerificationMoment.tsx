import { Link } from "@tanstack/react-router";
import { ArrowRight, QrCode, Share2, ShieldCheck } from "lucide-react";

import { SectionHeader } from "./SectionHeader";
import { VerificationCard } from "./VerificationCard";

interface VerificationMomentProps {
  audience: "consumer" | "professional";
  /** Featured pro shown inside the credential card. */
  pro: {
    name: string;
    role: string;
    location: string;
    photo: string;
    slug: string;
    verifiedId: string;
    lastVerified: string;
    renewsOn?: string;
  };
}

const CONSUMER_COPY = {
  eyebrow: "Public verification",
  heading: "A verified pro isn't a badge. It's a record you can scan.",
  lede:
    "Every REPs professional has a public verification page — qualifications, insurance, identity and CPD, all checked, dated and traceable. Scan the QR in person, share the link before you book.",
  bullets: [
    {
      icon: QrCode,
      title: "Scan it in the gym",
      body: "Every verified pro can show their card from the REPs app. One scan brings up the live record on your phone.",
    },
    {
      icon: Share2,
      title: "Share it before you book",
      body: "Send the verification link to a parent, partner or club. Anyone can check the chain — no account needed.",
    },
    {
      icon: ShieldCheck,
      title: "Backed by the register",
      body: "Trusted by clients and employers since 2009. Withdrawn pros disappear from the register — and from search.",
    },
  ],
  cta: { href: "/verify", label: "How verification works" },
};

const PROFESSIONAL_COPY = {
  eyebrow: "Your verification page",
  heading: "Your standards, made public — in one card you can share anywhere.",
  lede:
    "When you join REPs, you get a public verification page at repsglobal.app/verify/your-id. Add the QR to your gym door, your shop-front, your DMs. Clients stop asking 'are you legit?' — they just scan.",
  bullets: [
    {
      icon: ShieldCheck,
      title: "Verified once, shown everywhere",
      body: "Pull your live verification card into your shop-front, your Instagram bio link, even printed posters.",
    },
    {
      icon: QrCode,
      title: "QR on your gym door",
      body: "Studios using a verified-only door policy can scan members and trainers in seconds.",
    },
    {
      icon: Share2,
      title: "Renewal is automatic",
      body: "We pull your insurance, CPD and registry data on a rolling basis. The card stays current — nothing for you to chase.",
    },
  ],
  cta: { href: "/for-professionals", label: "See what verification unlocks" },
};

export function VerificationMoment({ audience, pro }: VerificationMomentProps) {
  const copy = audience === "consumer" ? CONSUMER_COPY : PROFESSIONAL_COPY;
  const verifyUrl = `https://repsglobal.lovable.app/verify/${pro.verifiedId.toLowerCase()}`;

  return (
    <section className="relative overflow-hidden bg-reps-ink text-white">
      {/* Subtle ambient orange wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-reps-orange/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-[-10%] h-[420px] w-[420px] rounded-full bg-reps-orange/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader eyebrow={copy.eyebrow} heading={copy.heading} lede={copy.lede} />

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_minmax(360px,440px)] lg:gap-16">
          {/* LEFT — explainer */}
          <div className="order-2 lg:order-1">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {copy.bullets.map((b) => (
                <li
                  key={b.title}
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange/15 text-reps-orange ring-1 ring-reps-orange/30">
                    <b.icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-3 font-display text-[17px] font-bold text-white">{b.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/65">{b.body}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/verify/$id"
                params={{ id: pro.verifiedId.toLowerCase() }}
                className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-3 text-[13.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
              >
                View a live verification
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={copy.cta.href}
                className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {copy.cta.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT — the credential */}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative">
              {/* soft floor glow */}
              <div
                aria-hidden
                className="absolute -inset-x-6 -bottom-6 h-12 rounded-full bg-reps-orange/20 blur-2xl"
              />
              <div className="relative -rotate-[1.5deg] transition-transform duration-500 hover:rotate-0">
                <VerificationCard
                  name={pro.name}
                  role={pro.role}
                  location={pro.location}
                  photo={pro.photo}
                  verifiedId={pro.verifiedId}
                  verifyUrl={verifyUrl}
                  lastVerified={pro.lastVerified}
                  renewsOn={pro.renewsOn}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
