import * as React from "react";
import { BadgeCheck, ShieldCheck, Search, GraduationCap, FileCheck, Star } from "lucide-react";

const PROOFS = [
  {
    icon: BadgeCheck,
    stat: "Verified",
    title: "The register the public searches",
    body: "REPs is the verified register UK clients already know — qualifications, insurance and CPD checked, not self-declared.",
  },
  {
    icon: ShieldCheck,
    stat: "Trust layer",
    title: "Backed by a credentialed register",
    body: "A long-standing register heritage — your badge means something the screenshot-and-bio crowd can't fake.",
  },
  {
    icon: Search,
    stat: "Discoverable",
    title: "Where clients actively land",
    body: "Profiles are indexed by location, specialism and price band — built so clients can find you, not just scroll past you.",
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
