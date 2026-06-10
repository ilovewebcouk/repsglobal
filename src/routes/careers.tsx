import { createFileRoute, Link } from"@tanstack/react-router";
import { ArrowRight, Heart, Globe2, Rocket, Users, Sparkles, Mail } from"lucide-react";

import { PublicHeader } from"@/components/public/PublicHeader";
import { PublicFooter } from"@/components/public/PublicFooter";
import heroGym from"@/assets/hero-gym-bg.jpg";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title:"Careers at REPs — Build the Global Standard for Fitness" },
      {
        name:"description",
        content:
"Help build the global trust layer for the fitness industry. Open roles, our values and what it's like to work at REPs.",
      },
      { property:"og:title", content:"Careers at REPs" },
      { property:"og:description", content:"Open roles and what it's like to work at REPs." },
      { property:"og:url", content:"https://repsglobal.lovable.app/careers" },
    ],
    links: [{ rel:"canonical", href:"https://repsglobal.lovable.app/careers" }],
  }),
  component: CareersPage,
});

const VALUES = [
  { icon: Heart, title:"Trust, by default", body:"We protect both sides of the marketplace — clients and pros — every decision, every day." },
  { icon: Globe2, title:"Global ambition", body:"REPs is built for every market where someone trains. Local enough to matter, global enough to scale." },
  { icon: Rocket, title:"Shipping over talking", body:"Small teams, short feedback loops, no theatre. We ship and learn." },
  { icon: Users, title:"Industry insiders", body:"We hire coaches, ex-coaches and people who'd happily train at 6am. Lived experience matters." },
];

const ROLES = [
  { team:"Engineering", title:"Senior Full-Stack Engineer", location:"Remote (Global)" },
  { team:"Design", title:"Product Designer", location:"Remote (Global)" },
  { team:"Industry", title:"Head of Professional Standards", location:"London / Hybrid" },
  { team:"Growth", title:"SEO & Content Lead", location:"Remote (Global)" },
];

function CareersPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden">
        <img src={heroGym} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Careers
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Build the global standard for <span className="text-reps-orange">fitness.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            We're building the trust layer for an industry that desperately needs one — and we're
            hiring for it. Small, senior team. Remote-first. Long-term mission.
          </p>
        </div>
      </section>

      <section className="">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">How we work</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Four things we actually mean.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
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

      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Open roles</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Currently hiring.
            </h2>
          </div>
          <div className="mt-10 grid gap-4">
            {ROLES.map((r) => (
              <div
                key={r.title}
                className="flex flex-col gap-3 rounded-[18px] border border-reps-border bg-reps-panel p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                    {r.team}
                  </div>
                  <h3 className="mt-1 font-display text-[18px] font-bold text-white">{r.title}</h3>
                  <div className="mt-1 text-[13px] text-white/60">{r.location}</div>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 px-5 text-[13px] font-semibold text-white hover:bg-white/10"
                >
                  Apply <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[22px] border border-reps-border bg-reps-panel/60 p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[20px] font-bold text-white">Don't see your role?</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                  We're always open to hearing from exceptional people in engineering, design,
                  industry and growth. Email us at{""}
                  <a href="mailto:careers@repsglobal.com" className="text-reps-orange hover:underline">
                    careers@repsglobal.com
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
