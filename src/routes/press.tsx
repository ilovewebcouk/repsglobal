import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, FileText, Image as ImageIcon, Mail, Quote, Download } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGym from "@/assets/hero-gym-bg.jpg";

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: "Press & Media — REPs" },
      {
        name: "description",
        content:
          "Press releases, brand assets, fast facts and media contact for REPs — the global Register of Exercise Professionals.",
      },
      { property: "og:title", content: "Press & Media — REPs" },
      { property: "og:description", content: "Press kit, releases and media contact for REPs." },
      { property: "og:url", content: "https://repsglobal.lovable.app/press" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/press" }],
  }),
  component: PressPage,
});

const FACTS = [
  { label: "Founded", value: "2024" },
  { label: "Verified professionals", value: "12,400+" },
  { label: "Specialisms covered", value: "5 core + growing" },
  { label: "Headquarters", value: "London, UK" },
];

const ASSETS = [
  { icon: ImageIcon, title: "Logo pack", body: "REPs wordmark and monogram in SVG and PNG, light and dark." },
  { icon: FileText, title: "Brand guidelines", body: "Colour, typography and badge usage rules — one PDF." },
  { icon: Quote, title: "Boilerplate", body: "Standard about-REPs paragraph for press releases and articles." },
];

function PressPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroGym} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Press & Media
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Writing about REPs? <span className="text-reps-orange">Start here.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            Brand assets, fast facts and a direct line to our press team. We respond to
            journalists within one working day.
          </p>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Fast facts</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              REPs at a glance.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.label} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                  {f.label}
                </div>
                <div className="mt-2 font-display text-[28px] font-bold text-white">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Press kit</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Download brand assets.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {ASSETS.map((a) => (
              <div key={a.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <a.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{a.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{a.body}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-reps-orange hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-8 lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[22px] font-bold text-white">Media enquiries</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                  For interviews, comment requests or anything else, email{" "}
                  <a href="mailto:press@repsglobal.com" className="text-reps-orange hover:underline">
                    press@repsglobal.com
                  </a>{" "}
                  with your deadline. We reply within one working day.
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
