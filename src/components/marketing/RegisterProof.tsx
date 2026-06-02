import * as React from "react";
import { BadgeCheck, ShieldCheck, Search, GraduationCap, FileCheck, Star } from "lucide-react";

const PROOFS = [
  {
    icon: BadgeCheck,
    stat: "25,000+",
    title: "Verified professionals",
    body: "The largest verified register of UK fitness professionals — and growing globally.",
  },
  {
    icon: ShieldCheck,
    stat: "Since 2009",
    title: "The industry's trust layer",
    body: "Qualifications, insurance and CPD checked by humans — not a self-declared profile bio.",
  },
  {
    icon: Search,
    stat: "1M+ searches",
    title: "Where the public lands",
    body: "Clients actively search REPs when they're looking for a trusted pro. You don't have to.",
  },
];

const CREDENTIALS = [
  { icon: GraduationCap, label: "Qualifications verified" },
  { icon: FileCheck, label: "Insurance on file" },
  { icon: BadgeCheck, label: "CPD tracked" },
  { icon: Star, label: "Reviews on the record" },
];

export function RegisterProof() {
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-3">
        {PROOFS.map((p) => (
          <div
            key={p.title}
            className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <p.icon className="h-5 w-5" />
            </span>
            <div className="mt-4 font-display text-[26px] font-bold leading-none text-white">
              {p.stat}
            </div>
            <h3 className="mt-2 font-display text-[15px] font-bold uppercase tracking-wider text-white/90">
              {p.title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-[18px] border border-reps-gold/30 bg-gradient-to-r from-reps-panel via-reps-panel/80 to-reps-panel p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-gold">
          The verified credential
        </span>
        {CREDENTIALS.map((c) => (
          <span
            key={c.label}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-white/85"
          >
            <c.icon className="h-4 w-4 text-reps-gold" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
