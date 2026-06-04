import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, AlertTriangle, Mail, ClipboardList, Search, Gavel, Shield } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGym from "@/assets/hero-gym-bg.jpg";

export const Route = createFileRoute("/complaints")({
  head: () => ({
    meta: [
      { title: "Complaints & Conduct — REPs" },
      {
        name: "description",
        content:
          "How to raise a complaint about a REPs-verified professional. Our process, timelines and the sanctions we can apply.",
      },
      { property: "og:title", content: "Complaints & Conduct — REPs" },
      { property: "og:description", content: "How REPs handles complaints about its members." },
      { property: "og:url", content: "https://repsglobal.lovable.app/complaints" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/complaints" }],
  }),
  component: ComplaintsPage,
});

const STEPS = [
  { icon: ClipboardList, title: "1. Submit", body: "Tell us what happened using the complaints form or by email. Include dates, names and any evidence." },
  { icon: Search, title: "2. Review", body: "Our Standards team acknowledges within 2 working days and opens a case file." },
  { icon: Mail, title: "3. Respond", body: "The professional is given a fair chance to respond. Both sides are heard." },
  { icon: Gavel, title: "4. Decide", body: "We close the case with a written outcome — typically within 21 days for most complaints." },
];

const SANCTIONS = [
  { title: "Advisory note", body: "A formal note placed on the member's record. Visible internally for future audits." },
  { title: "Required training", body: "Member must complete specific CPD before continuing to practise on REPs." },
  { title: "Suspension", body: "Verified badge removed and profile hidden from search while the case is active." },
  { title: "Removal", body: "Permanent removal from the register. Profile delisted and badge revoked." },
];

function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroGym} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Complaints & Conduct
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Standards are only real if <span className="text-reps-orange">they're enforced.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            If a REPs-verified professional has fallen short, we want to hear about it. Every
            complaint is reviewed by our Standards team, with a written outcome at the end.
          </p>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">The process</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Four steps. Clear timelines.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
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

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Possible outcomes</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Sanctions we can apply.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SANCTIONS.map((s) => (
              <div key={s.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Shield className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-orange-soft p-8 lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange text-white">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[20px] font-bold text-white">In an emergency</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/80">
                  If you or someone else is in immediate danger, please contact your local emergency
                  services first. REPs handles professional conduct — not criminal matters.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Submit a complaint <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/standards"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Read full standards
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
