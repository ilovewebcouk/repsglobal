import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import {
  Apple,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  Flame,
  Footprints,
  GlassWater,
  MessagesSquare,
  Moon,
  Play,
  Plus,
  Scale,
  Target,
  TrendingUp,
} from "lucide-react";

import { ClientShell, PortalCard } from "@/components/portal/ClientShell";

export const Route = createFileRoute("/portal_/today")({
  ssr: false,
  beforeLoad: requireRole(['client', 'professional']),
  head: () => ({
    meta: [
      { title: "Today — REPS Client Portal" },
      { name: "description", content: "Your training, nutrition and check-ins for today." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  return (
    <ClientShell
      active="Today"
      title="Good morning, Sarah"
      subtitle="Sunday · 31 May · 4 sessions this week · On track"
    >
      {/* Hero */}
      <section className="mb-6 overflow-hidden rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-orange/20 via-reps-panel to-reps-panel p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/65">
              <Flame className="h-3.5 w-3.5 text-reps-orange" /> Today's session
            </div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-white md:text-[30px]">
              Lower body strength · Block 2, Day 3
            </h1>
            <p className="mt-2 max-w-md text-[13.5px] text-white/65">
              7 exercises · 52 min · Squat focus. James left a note about your hip mobility warm-up.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to="/portal/today"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                <Play className="h-4 w-4" /> Start workout
              </Link>
              <button className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-4 text-[13px] font-medium text-white/85 hover:text-white">
                View programme
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat icon={Flame} label="Calories" value="1,820" sub="of 2,150" />
            <MiniStat icon={Footprints} label="Steps" value="6,420" sub="of 10k" />
            <MiniStat icon={GlassWater} label="Water" value="1.4L" sub="of 2.5L" />
          </div>
        </div>
      </section>

      {/* Three columns */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Programme */}
        <PortalCard>
          <SectionHeader icon={Dumbbell} title="Programme" hint="Week 6 of 12" />
          <ul className="mt-4 space-y-2.5">
            {[
              { name: "Back squat", sets: "4 × 6 @ 80kg", done: false },
              { name: "Romanian deadlift", sets: "3 × 8 @ 70kg", done: false },
              { name: "Walking lunges", sets: "3 × 12 ea", done: false },
              { name: "Hip thrust", sets: "3 × 10 @ 90kg", done: false },
              { name: "Single-leg calf raise", sets: "3 × 15 ea", done: false },
            ].map((ex) => (
              <li
                key={ex.name}
                className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-reps-border text-white/55">
                  <Check className="h-3.5 w-3.5 opacity-0" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-white">{ex.name}</div>
                  <div className="truncate text-[12px] text-white/55">{ex.sets}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40" />
              </li>
            ))}
          </ul>
        </PortalCard>

        {/* Nutrition */}
        <PortalCard>
          <SectionHeader icon={Apple} title="Nutrition" hint="1,820 / 2,150 kcal" />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Macro label="Protein" value={142} target={170} unit="g" />
            <Macro label="Carbs" value={196} target={240} unit="g" />
            <Macro label="Fats" value={58} target={70} unit="g" />
          </div>
          <ul className="mt-4 space-y-2">
            {[
              { meal: "Breakfast", food: "Greek yoghurt + berries", kcal: 380 },
              { meal: "Lunch", food: "Chicken & rice bowl", kcal: 640 },
              { meal: "Snack", food: "Whey + banana", kcal: 320 },
              { meal: "Dinner", food: "Pending", kcal: null as number | null },
            ].map((row) => (
              <li
                key={row.meal}
                className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-white/85">{row.meal}</div>
                  <div className="truncate text-[12px] text-white/55">{row.food}</div>
                </div>
                <div className="text-[12.5px] font-medium text-white/75">
                  {row.kcal ? `${row.kcal} kcal` : <span className="text-reps-orange">+ Log</span>}
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink text-[12.5px] font-medium text-white/80 hover:text-white">
            <Plus className="h-3.5 w-3.5" /> Log food
          </button>
        </PortalCard>

        {/* Check-in + coach */}
        <div className="space-y-5">
          <PortalCard>
            <SectionHeader icon={Scale} title="Check-in" hint="Weekly · due tomorrow" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Weight" value="68.4 kg" delta="−0.3" tone="good" />
              <Stat label="Sleep avg" value="7h 12m" delta="+18m" tone="good" />
              <Stat label="Energy" value="7.8 /10" delta="+0.4" tone="good" />
              <Stat label="Soreness" value="3 /10" delta="−1" tone="good" />
            </div>
            <button className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white hover:bg-reps-orange-hover">
              <CheckCircle2 className="h-4 w-4" /> Submit weekly check-in
            </button>
          </PortalCard>

          <PortalCard>
            <SectionHeader icon={MessagesSquare} title="Coach" hint="James Carter" />
            <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-ink p-3">
              <div className="text-[12.5px] text-white/75">
                "Nice session yesterday — really clean reps on the deadlift. Add 2.5kg next week."
              </div>
              <div className="mt-2 text-[11px] text-white/45">2h ago</div>
            </div>
            <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink text-[12.5px] font-medium text-white/80 hover:text-white">
              Reply to James
            </button>
          </PortalCard>
        </div>
      </div>

      {/* Habits row */}
      <PortalCard className="mt-5">
        <SectionHeader icon={Target} title="Daily habits" hint="3 of 5 done" />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "10k steps", icon: Footprints, done: true },
            { label: "2.5L water", icon: GlassWater, done: false },
            { label: "8h sleep", icon: Moon, done: true },
            { label: "Mobility 10m", icon: TrendingUp, done: true },
            { label: "Log all meals", icon: Apple, done: false },
          ].map((h) => {
            const Icon = h.icon;
            return (
              <button
                key={h.label}
                className={`flex items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                  h.done
                    ? "border-reps-orange/40 bg-reps-orange-soft text-reps-orange"
                    : "border-reps-border bg-reps-ink text-white/70 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{h.label}</span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    h.done ? "border-reps-orange bg-reps-orange text-white" : "border-reps-border"
                  }`}
                >
                  {h.done && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </PortalCard>
    </ClientShell>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Dumbbell;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13.5px] font-semibold text-white">{title}</span>
      </div>
      {hint && <span className="text-[11.5px] text-white/55">{hint}</span>}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-reps-ink/70 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-white/55">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-[18px] font-semibold leading-tight text-white">{value}</div>
      <div className="text-[11px] text-white/50">{sub}</div>
    </div>
  );
}

function Macro({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold text-white">
        {value}
        <span className="text-[11px] font-medium text-white/45">/{target}{unit}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-reps-orange" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "good" | "warn";
}) {
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
        {label}
      </div>
      <div className="mt-0.5 text-[15px] font-semibold text-white">{value}</div>
      <div
        className={`mt-0.5 text-[11px] font-medium ${
          tone === "good" ? "text-reps-green" : "text-amber-400"
        }`}
      >
        {delta} vs last week
      </div>
    </div>
  );
}
