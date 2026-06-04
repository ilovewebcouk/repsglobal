import { Building2, Laptop, User } from "lucide-react";

const CASES = [
  {
    icon: User,
    eyebrow: "Solo PT",
    title: "Run your whole practice from one tool.",
    body: "Get found, manage leads, book sessions, track payments and deliver coaching without juggling five different tools.",
    bullets: ["Verified profile in the public register", "Bookings, payments and CRM in one place", "AI drafts replies, programmes and content"],
  },
  {
    icon: Laptop,
    eyebrow: "Online coach",
    title: "One platform for every client, anywhere.",
    body: "Run programmes, check-ins, nutrition, progress tracking and client communication from one connected platform.",
    bullets: ["Programme builder with video demos", "AI-summarised weekly check-ins", "Branded client portal on web and mobile"],
  },
  {
    icon: Building2,
    eyebrow: "Studio or gym",
    title: "Your team, your members, one dashboard.",
    body: "Manage your team, your bookings, your members and your revenue in one place — with a verified public profile for every coach on your roster.",
    bullets: ["Multi-coach roster and permissions", "Shared calendar and class scheduling", "Verified profile for every coach"],
  },
];

export function UseCaseTriad() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {CASES.map((c) => (
        <div
          key={c.eyebrow}
          className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <c.icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              {c.eyebrow}
            </span>
          </div>
          <h3 className="mt-4 font-display text-[20px] font-bold leading-tight text-white">
            {c.title}
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{c.body}</p>
          <ul className="mt-4 space-y-1.5 text-[12.5px] text-white/70">
            {c.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-reps-orange" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
