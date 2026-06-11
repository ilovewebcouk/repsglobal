import { createFileRoute } from "@tanstack/react-router";
import {
  Apple,
  Beef,
  Coffee,
  Croissant,
  Drumstick,
  Filter,
  Flame,
  MoreHorizontal,
  Plus,
  Salad,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

import { PCard, PPanel, ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/_authenticated/_professional/_pro/dashboard_/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition — REPS Professional" },
      { name: "description", content: "Build meal plans, set macro targets and track client adherence." },
      { property: "og:title", content: "Nutrition — REPS Professional" },
      { property: "og:description", content: "Meal plans, macros and adherence." },
      { property: "og:url", content: "/dashboard/nutrition" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/nutrition" }],
  }),
  component: NutritionPage,
});

const PLANS = [
  { name: "Lean Build — Sarah Johnson", kcal: "2,150", protein: "165g", carbs: "210g", fats: "65g", adherence: 84, active: true },
  { name: "Hypertrophy — Marcus Hall", kcal: "2,820", protein: "190g", carbs: "320g", fats: "75g", adherence: 78 },
  { name: "Fat Loss — Hannah Reid", kcal: "1,720", protein: "135g", carbs: "150g", fats: "55g", adherence: 91 },
  { name: "Performance — Daniel Okafor", kcal: "2,950", protein: "180g", carbs: "360g", fats: "80g", adherence: 72 },
  { name: "Recovery Week — Priya Mehta", kcal: "1,950", protein: "140g", carbs: "200g", fats: "60g", adherence: 88 },
];

const MEALS = [
  { name: "Breakfast", time: "07:30", kcal: 480, protein: 38, carbs: 52, fats: 12, items: ["Greek yoghurt 200g", "Oats 60g", "Blueberries 80g", "Whey 1 scoop"], icon: Coffee },
  { name: "Mid-morning", time: "10:30", kcal: 280, protein: 22, carbs: 28, fats: 8, items: ["Cottage cheese 150g", "Rye crackers x3", "Apple"], icon: Croissant },
  { name: "Lunch", time: "13:00", kcal: 620, protein: 45, carbs: 65, fats: 18, items: ["Chicken breast 180g", "Basmati rice 90g dry", "Mixed salad", "Olive oil 10ml"], icon: Salad },
  { name: "Pre-training", time: "16:00", kcal: 220, protein: 18, carbs: 32, fats: 3, items: ["Rice cakes x3", "Whey 1 scoop", "Banana"], icon: Apple },
  { name: "Dinner", time: "19:30", kcal: 550, protein: 42, carbs: 33, fats: 24, items: ["Salmon 160g", "Sweet potato 200g", "Tenderstem broccoli", "Avocado 1/4"], icon: Beef },
];

const MACROS = [
  { label: "Calories", value: "2,150", target: "2,150", pct: 100, icon: Flame },
  { label: "Protein", value: "165g", target: "165g", pct: 100, icon: Drumstick },
  { label: "Carbs", value: "210g", target: "210g", pct: 100, icon: Croissant },
  { label: "Fats", value: "65g", target: "65g", pct: 100, icon: Apple },
];

function NutritionPage() {
  const total = MEALS.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.protein, c: a.c + m.carbs, f: a.f + m.fats }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  return (
    <ProShell
      active="Nutrition"
      title="Nutrition"
      subtitle="Meal plans, macro targets and adherence tracking for every client."
      actions={
        <>
          <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-4 text-[13px] font-semibold text-reps-orange shadow-none">
            <Sparkles className="h-4 w-4" />
            AI plan draft
          </button>
          <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
            <Plus className="h-4 w-4" />
            New meal plan
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT — plan list */}
        <div className="xl:col-span-3">
          <PPanel className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-reps-border px-4 py-3">
              <div className="flex h-9 flex-1 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                <Search className="h-3.5 w-3.5" />
                <span>Search plans…</span>
              </div>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft text-white/70 shadow-none">
                <Filter className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="divide-y divide-reps-border/60">
              {PLANS.map((p) => (
                <li key={p.name}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${p.active ? "bg-reps-orange-soft/50" : "hover:bg-reps-panel-soft/50"}`}
                  >
                    {p.active && <span className="-ml-4 h-12 w-1 rounded-r-full bg-reps-orange" />}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[13px] font-semibold ${p.active ? "text-white" : "text-white/85"}`}>{p.name}</div>
                      <div className="mt-0.5 text-[11px] text-white/55">{p.kcal} kcal · {p.protein} protein</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-reps-panel-soft">
                          <div className="h-full rounded-full bg-reps-orange" style={{ width: `${p.adherence}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-white/70">{p.adherence}%</span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </PPanel>
        </div>

        {/* CENTER — plan builder */}
        <div className="space-y-6 xl:col-span-6">
          <PPanel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Active plan</div>
                <h3 className="mt-1 font-display text-[18px] font-bold text-white">Lean Build — Sarah Johnson</h3>
                <p className="mt-0.5 text-[12px] text-white/55">Week 5 of 12 · 4 training days · Updated 2 days ago</p>
              </div>
              <span className="flex h-6 items-center rounded-full bg-emerald-500/12 px-2.5 text-[11px] font-semibold text-emerald-300">Active</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {MACROS.map((m) => (
                <div key={m.label} className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{m.label}</span>
                    <m.icon className="h-3.5 w-3.5 text-reps-orange" />
                  </div>
                  <div className="mt-1 font-display text-[18px] font-bold text-white">{m.value}</div>
                  <div className="text-[11px] text-white/55">of {m.target}</div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-reps-panel">
                    <div className="h-full rounded-full bg-reps-orange" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </PPanel>

          {MEALS.map((meal) => (
            <PPanel key={meal.name} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-reps-orange-soft text-reps-orange">
                    <meal.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-white">{meal.name}</h4>
                    <p className="text-[11px] text-white/55">{meal.time} · {meal.kcal} kcal · {meal.protein}P / {meal.carbs}C / {meal.fats}F</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white">
                    <Plus className="h-3.5 w-3.5" /> Item
                  </button>
                  <button type="button" aria-label="More" className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/60 shadow-none hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5">
                {meal.items.map((it) => (
                  <li key={it} className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[12px] text-white/85">
                    <span>{it}</span>
                    <span className="text-white/45">portion</span>
                  </li>
                ))}
              </ul>
            </PPanel>
          ))}

          <PCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Daily total</div>
                <div className="mt-1 font-display text-[20px] font-bold text-white">{total.kcal} kcal</div>
              </div>
              <div className="text-right text-[12px] text-white/65">
                Protein {total.p}g · Carbs {total.c}g · Fats {total.f}g
              </div>
            </div>
          </PCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-3">
          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Client adherence</h3>
                <p className="mt-1 text-[12px] text-white/55">Last 7 days · all active plans</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {PLANS.slice(0, 4).map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate text-white/80">{p.name.split("—")[1].trim()}</span>
                    <span className="text-white">{p.adherence}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-reps-panel-soft">
                    <div className="h-full rounded-full bg-reps-orange" style={{ width: `${p.adherence}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </PCard>

          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">AI nutrition insight</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                  Sarah's evening calories are 18% under target on training days. Consider adding 30g carbs to her post-training snack.
                </p>
                <button type="button" className="mt-3 flex h-8 items-center rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                  Apply suggestion
                </button>
              </div>
            </div>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">Plan templates</h3>
            <ul className="mt-3 space-y-2">
              {["Lean Build template", "Hypertrophy template", "Fat Loss template", "Recovery week template"].map((t) => (
                <li key={t} className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[12px] text-white/80">
                  {t}
                  <button type="button" className="text-[11px] font-semibold text-reps-orange">Use</button>
                </li>
              ))}
            </ul>
          </PCard>
        </div>
      </div>
    </ProShell>
  );
}
