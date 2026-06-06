import { useEffect, useRef, useState } from "react";
import { Apple, Check, ClipboardCheck, Dumbbell, Smartphone, Users } from "lucide-react";

import {
  CheckInsMockup,
  ClientsCrmMockup,
  ProgrammesMockup,
} from "@/components/mockups/PlatformMockups";

type Block = {
  id: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  bullets: string[];
  mockup: React.ReactNode;
};

function NutritionMockup() {
  const meals = [
    ["Breakfast", "Oats, berries, whey", "520 kcal"],
    ["Lunch", "Chicken, rice, greens", "640 kcal"],
    ["Snack", "Greek yoghurt, almonds", "320 kcal"],
    ["Dinner", "Salmon, sweet potato", "720 kcal"],
  ];
  return (
    <div className="flex h-[420px] flex-col gap-3 bg-reps-ink p-4 text-[12px] text-white/85">
      <div className="grid grid-cols-4 gap-2">
        {[
          ["Calories", "2,210", "/ 2,300"],
          ["Protein", "168g", "/ 170g"],
          ["Carbs", "212g", "/ 220g"],
          ["Fats", "78g", "/ 80g"],
        ].map(([l, v, t]) => (
          <div key={l} className="rounded-[12px] border border-reps-border bg-reps-panel p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-white/45">{l}</div>
            <div className="mt-0.5 font-display text-[15px] font-bold text-white">{v}</div>
            <div className="text-[10px] text-reps-orange">{t}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden rounded-[12px] border border-reps-border bg-reps-panel">
        <div className="border-b border-reps-border px-3 py-2 text-[11px] font-semibold text-white">
          Today's plan · Emma Robinson
        </div>
        <ul className="divide-y divide-reps-border">
          {meals.map(([m, f, k]) => (
            <li key={m} className="flex items-center justify-between px-3 py-2.5">
              <div>
                <div className="text-[11px] font-semibold text-white">{m}</div>
                <div className="text-[10.5px] text-white/55">{f}</div>
              </div>
              <span className="font-mono text-[10.5px] text-reps-orange">{k}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ClientPortalMockup() {
  return (
    <div className="flex h-[420px] items-center justify-center bg-gradient-to-br from-reps-panel/40 to-reps-ink p-6">
      <div className="relative w-[230px] overflow-hidden rounded-[28px] border-[6px] border-reps-ink bg-reps-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between bg-reps-panel/60 px-3 py-1.5 text-[9px] text-white/55">
          <span>09:14</span>
          <span>REPs</span>
        </div>
        <div className="space-y-2.5 p-3 text-[11px] text-white/85">
          <div>
            <div className="text-[9.5px] uppercase tracking-wider text-white/45">Today</div>
            <div className="mt-1 rounded-[14px] border border-reps-orange-border bg-reps-orange-soft p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
                09:30 · Strength block
              </div>
              <div className="mt-1 text-[12px] font-bold text-white">Lower body · Week 3</div>
              <div className="mt-0.5 text-[10px] text-white/65">7 exercises · 52 min</div>
            </div>
          </div>
          <div className="rounded-[14px] border border-reps-border bg-reps-panel p-3">
            <div className="text-[9.5px] uppercase tracking-wider text-white/45">Nutrition</div>
            <div className="mt-1 flex items-end justify-between">
              <div>
                <div className="text-[15px] font-bold text-white">1,460</div>
                <div className="text-[10px] text-white/55">of 2,300 kcal</div>
              </div>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-reps-ink">
                <div className="h-full w-2/3 bg-reps-orange" />
              </div>
            </div>
          </div>
          <div className="rounded-[14px] border border-reps-border bg-reps-panel p-3">
            <div className="text-[9.5px] uppercase tracking-wider text-white/45">Check-in</div>
            <div className="mt-1 text-[11px] font-medium text-white">Due Sunday</div>
            <button className="mt-2 w-full rounded-[10px] bg-reps-orange py-1.5 text-[10px] font-semibold text-white">
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const BLOCKS: Block[] = [
  {
    id: "coach-programmes",
    tag: "Programmes",
    icon: Dumbbell,
    title: "Programmes your clients show off.",
    body: "Weeks, workouts, sets, reps, rest, RPE and video demos — built in a clean editor and assigned in one click. Or one-line brief in, 12-week plan out, drafted by REPs AI.",
    bullets: [
      "Week-by-week structure with progression",
      "Curated exercise library with video demos",
      "One-click assignment, bulk edits across clients",
      "AI Programme Writer — drafted from a brief",
    ],
    mockup: <ProgrammesMockup />,
  },
  {
    id: "coach-checkins",
    tag: "Check-ins",
    icon: ClipboardCheck,
    title: "Reclaim your Sunday evenings.",
    body: "Adherence, sleep, stress, training, nutrition, measurements and photos summarised into one card per client — with a reply already drafted in your tone of voice.",
    bullets: [
      "Single-screen check-in review per client",
      "AI Check-in Summariser — headline, change, ask",
      "Nutrition targets vs actuals with deltas",
      "Progress photos and measurements side-by-side",
    ],
    mockup: <CheckInsMockup />,
  },
  {
    id: "coach-nutrition",
    tag: "Nutrition",
    icon: Apple,
    title: "Replaces MyFitnessPal — wired to the programme.",
    body: "Macros and meal plans built from goal, preferences and allergies. Targets and actuals sit next to the training plan, not in a different app.",
    bullets: [
      "Macros and meal plans drafted by REPs AI",
      "Food database — branded and generic",
      "Targets vs actuals with deltas in the check-in",
      "No paid add-on — included on Pro and Studio",
    ],
    mockup: <NutritionMockup />,
  },
  {
    id: "coach-clients",
    tag: "Client record",
    icon: Users,
    title: "One record. The whole client.",
    body: "Goals, programme, last check-in, next session, lifetime value, outstanding invoice — on one screen. The CRM the coaching apps don't have, wired to the coaching tools the CRMs don't have.",
    bullets: [
      "Full client record with adherence and progress",
      "Programme and nutrition snapshot at the top",
      "Notes, bookings and payments in the same view",
      "Lifetime value and renewal date surfaced",
    ],
    mockup: <ClientsCrmMockup />,
  },
  {
    id: "coach-portal",
    tag: "Client portal",
    icon: Smartphone,
    title: "The app your clients tell their friends about.",
    body: "A portal that looks like a premium product, not a beta. Today's session, this week's targets, next booking, last message — wherever they open it.",
    bullets: [
      "Client dashboard on web and mobile",
      "Programme, nutrition and check-ins in one tab each",
      "One-tap check-in with photos and metrics",
      "Bookings and payment history visible to the client",
    ],
    mockup: <ClientPortalMockup />,
  },
];

export function CoachingScrollPanel() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const candidates = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            index: refs.current.findIndex((r) => r === e.target),
            ratio: e.intersectionRatio,
          }))
          .filter((c) => c.index !== -1)
          .sort((a, b) => b.ratio - a.ratio);
        if (candidates[0]) setActive(candidates[0].index);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    refs.current.forEach((r) => r && observer.observe(r));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:gap-14">
      {/* Sticky mockup column */}
      <div className="hidden lg:block">
        <div className="sticky top-32">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[28px] bg-[radial-gradient(60%_50%_at_50%_30%,rgba(255,122,0,0.16),transparent_70%)] blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-ink shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]">
              {BLOCKS.map((b, i) => (
                <div
                  key={b.id}
                  className={`transition-opacity duration-500 ${
                    active === i ? "opacity-100" : "absolute inset-0 opacity-0 pointer-events-none"
                  }`}
                >
                  {b.mockup}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling copy column */}
      <div className="space-y-10 lg:space-y-20">
        {BLOCKS.map((b, i) => (
          <div
            key={b.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="scroll-mt-32"
          >
            {/* Mobile mockup */}
            <div className="mb-5 overflow-hidden rounded-[18px] border border-reps-border lg:hidden">
              {b.mockup}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                active === i ? "text-reps-orange" : "text-white/45"
              }`}
            >
              <b.icon className="h-3.5 w-3.5" />
              Pillar 4 · Coaching · {b.tag}
            </span>
            <h3 className="mt-2 font-display text-[24px] font-bold leading-tight text-white lg:text-[30px]">
              {b.title}
            </h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">{b.body}</p>
            <ul className="mt-4 space-y-2">
              {b.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-2 text-[13.5px] text-white/80"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
