import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, RefreshCw, Award, BookOpen, ShieldCheck, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGym from "@/assets/hero-gym-bg.jpg";
import ctaBand from "@/assets/cta-band.jpg";

export const Route = createFileRoute("/cpd")({
  head: () => ({
    meta: [
      { title: "CPD & Education — REPs" },
      {
        name: "description",
        content:
          "How REPs Continuing Professional Development keeps fitness professionals current — quarterly logging, accredited learning and verified standards.",
      },
      { property: "og:title", content: "CPD & Education — REPs" },
      { property: "og:description", content: "Continuing Professional Development for REPs members." },
      { property: "og:url", content: "https://repsglobal.lovable.app/cpd" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/cpd" }],
  }),
  component: CpdPage,
});

const PILLARS = [
  { icon: GraduationCap, title: "Accredited learning", body: "CPD must come from approved providers — courses, conferences, peer-reviewed reading." },
  { icon: RefreshCw, title: "Logged quarterly", body: "Members log activity in their dashboard every quarter. Lapses suspend the verified badge." },
  { icon: Award, title: "Specialism upgrades", body: "Stack CPD towards new specialisms — nutrition, rehab, strength, online coaching." },
  { icon: ShieldCheck, title: "Audited annually", body: "Random audits each year keep the standard real, not just declared." },
];

function CpdPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroGym} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> CPD & Education
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Standards that <span className="text-reps-orange">keep evolving.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            Qualifying once isn't enough. Every REPs professional commits to ongoing CPD —
            so the badge on their profile means current, not historic.
          </p>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">How it works</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Four pillars of REPs CPD.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">For professionals</span>
              <h2 className="mt-2 font-display text-[30px] font-bold leading-tight text-white lg:text-[36px]">
                Log it in your dashboard.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/65">
                Every REPs member gets a CPD log inside their dashboard. Upload certificates, track
                hours, and see at a glance what's due before your next audit.
              </p>
            </div>
            <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-white">Minimum standard</div>
                  <div className="text-[12px] text-white/60">20 CPD hours per year</div>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-[13px] text-white/70">
                <li>• Logged quarterly via the member dashboard</li>
                <li>• Evidenced with certificates or reading notes</li>
                <li>• Audited at random each year</li>
                <li>• Lapses suspend the verified badge until current</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={ctaBand} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-reps-ink/85" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <h2 className="font-display text-[34px] font-bold leading-tight text-white lg:text-[44px]">
            Join REPs. Keep raising the bar.
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
            Membership comes with the CPD log, audit support and access to accredited learning partners.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Join REPs <ArrowRight className="h-4 w-4" />
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
