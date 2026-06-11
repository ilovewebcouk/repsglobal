import { createFileRoute } from "@tanstack/react-router";
import { Apple, Plus, Search, GlassWater, Barcode, Camera } from "lucide-react";
import { ClientShell, PortalCard } from "@/components/portal/ClientShell";

export const Route = createFileRoute("/portal_/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition — REPS Client Portal" },
      { name: "description", content: "Daily food log, macros and hydration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NutritionPage,
});

function NutritionPage() {
  const target = 2150;
  const eaten = 1820;
  const remaining = target - eaten;
  const pct = Math.min(100, (eaten / target) * 100);

  return (
    <ClientShell active="Nutrition" title="Nutrition" subtitle="Sunday · 31 May · 1,820 / 2,150 kcal">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <PortalCard>
          <div className="flex items-center justify-center">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="#ff6a00" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 326.7} 326.7`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">Remaining</div>
                <div className="text-[26px] font-semibold text-white">{remaining}</div>
                <div className="text-[11px] text-white/45">kcal</div>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { l: "Protein", v: 142, t: 170, c: "#ff6a00" },
              { l: "Carbs", v: 196, t: 240, c: "#5b8def" },
              { l: "Fats", v: 58, t: 70, c: "#f2c14e" },
            ].map((m) => (
              <div key={m.l} className="rounded-[12px] border border-reps-border bg-reps-ink p-3 text-center">
                <div className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-white/55">{m.l}</div>
                <div className="mt-1 text-[14px] font-semibold text-white">{m.v}<span className="text-[11px] text-white/45">/{m.t}g</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full" style={{ width: `${(m.v / m.t) * 100}%`, background: m.c }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[12px] border border-reps-border bg-reps-ink p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/80">
                <GlassWater className="h-4 w-4 text-reps-orange" /> Water · 1.4 / 2.5 L
              </div>
              <button className="inline-flex h-7 items-center gap-1 rounded-full bg-reps-orange px-2.5 text-[11px] font-semibold text-white">
                <Plus className="h-3 w-3" /> 250ml
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < 6 ? "bg-reps-orange" : "bg-white/8"}`} />
              ))}
            </div>
          </div>
        </PortalCard>

        <div className="space-y-5">
          <PortalCard>
            <div className="flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3">
              <Search className="h-4 w-4 text-white/45" />
              <input
                placeholder="Search foods, brands or recent meals…"
                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 focus:outline-none"
              />
              <button className="inline-flex h-7 items-center gap-1 rounded-full bg-reps-orange-soft px-2 text-[11px] font-semibold text-reps-orange">
                <Barcode className="h-3 w-3" /> Scan
              </button>
              <button className="inline-flex h-7 items-center gap-1 rounded-full bg-reps-orange-soft px-2 text-[11px] font-semibold text-reps-orange">
                <Camera className="h-3 w-3" /> Photo
              </button>
            </div>
          </PortalCard>

          {[
            {
              meal: "Breakfast",
              kcal: 380,
              items: [
                { food: "Greek yoghurt 0%", srv: "200g", kcal: 116, p: 20, c: 8, f: 0 },
                { food: "Mixed berries", srv: "100g", kcal: 50, p: 1, c: 12, f: 0 },
                { food: "Granola", srv: "40g", kcal: 180, p: 4, c: 28, f: 6 },
                { food: "Black coffee", srv: "240ml", kcal: 2, p: 0, c: 0, f: 0 },
                { food: "Banana", srv: "1 med", kcal: 105, p: 1, c: 27, f: 0 },
              ],
            },
            {
              meal: "Lunch",
              kcal: 640,
              items: [
                { food: "Chicken breast, grilled", srv: "180g", kcal: 297, p: 56, c: 0, f: 6 },
                { food: "Basmati rice, cooked", srv: "200g", kcal: 260, p: 5, c: 56, f: 1 },
                { food: "Mixed salad + olive oil", srv: "1 bowl", kcal: 83, p: 2, c: 6, f: 6 },
              ],
            },
            { meal: "Snack", kcal: 320, items: [{ food: "Whey isolate + oat milk", srv: "scoop", kcal: 220, p: 26, c: 8, f: 3 }, { food: "Banana", srv: "1 med", kcal: 100, p: 1, c: 26, f: 0 }] },
            { meal: "Dinner", kcal: null as number | null, items: [] as { food: string; srv: string; kcal: number; p: number; c: number; f: number }[] },
          ].map((sec) => (
            <PortalCard key={sec.meal}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
                    <Apple className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[13.5px] font-semibold text-white">{sec.meal}</span>
                </div>
                <div className="text-[12px] text-white/55">{sec.kcal ? `${sec.kcal} kcal` : "Not logged"}</div>
              </div>
              {sec.items.length > 0 ? (
                <ul className="mt-3 divide-y divide-reps-border/60">
                  {sec.items.map((it) => (
                    <li key={it.food} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-white">{it.food}</div>
                        <div className="text-[11.5px] text-white/55">{it.srv} · {it.p}P · {it.c}C · {it.f}F</div>
                      </div>
                      <div className="text-[12.5px] font-semibold text-white/85">{it.kcal} kcal</div>
                    </li>
                  ))}
                </ul>
              ) : null}
              <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink text-[12.5px] font-medium text-white/80 hover:text-white">
                <Plus className="h-3.5 w-3.5" /> Add food
              </button>
            </PortalCard>
          ))}
        </div>
      </div>
    </ClientShell>
  );
}
