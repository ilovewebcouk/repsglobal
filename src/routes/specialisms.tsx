import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, Flower2, Apple, Activity, Laptop, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGym from "@/assets/hero-gym-bg.jpg";

export const Route = createFileRoute("/specialisms")({
  head: () => ({
    meta: [
      { title: "Specialisms — REPs" },
      {
        name: "description",
        content:
          "Browse REPs specialisms — personal trainers, Pilates instructors, nutritionists, strength coaches and online coaches. All verified.",
      },
      { property: "og:title", content: "Specialisms — REPs" },
      { property: "og:description", content: "Every REPs-verified specialism in one place." },
      { property: "og:url", content: "https://repsglobal.lovable.app/specialisms" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/specialisms" }],
  }),
  component: SpecialismsPage,
});

const SPECIALISMS = [
  { slug: "personal-trainer", label: "Personal Trainers", icon: Dumbbell, blurb: "1:1 coaching for strength, fitness, fat loss and habit change." },
  { slug: "pilates-instructor", label: "Pilates Instructors", icon: Flower2, blurb: "Mat and reformer specialists for posture, mobility and core control." },
  { slug: "nutritionist", label: "Nutritionists", icon: Apple, blurb: "Evidence-based nutrition coaching — performance, body comp, health." },
  { slug: "strength-coach", label: "Strength Coaches", icon: Activity, blurb: "Barbell-led programming for athletes and serious lifters." },
  { slug: "online-coach", label: "Online Coaches", icon: Laptop, blurb: "Remote programming, weekly check-ins and video feedback." },
];

function SpecialismsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroGym} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Specialisms
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Every REPs specialism, <span className="text-reps-orange">verified.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            Choose the kind of professional you're looking for. Every listing is identity-checked,
            qualification-verified and insurance-current.
          </p>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SPECIALISMS.map((s) => (
              <Link
                key={s.slug}
                to="/professions/$profession"
                params={{ profession: s.slug }}
                className="group rounded-[18px] border border-reps-border bg-reps-panel p-6 transition-colors hover:border-reps-orange-border"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[18px] font-bold text-white">{s.label}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{s.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange">
                  Browse <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
