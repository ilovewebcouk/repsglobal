import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { Dumbbell, Play, RefreshCw, CheckCircle2, Flame } from "lucide-react";
import { ClientShell, PortalCard } from "@/components/portal/ClientShell";

export const Route = createFileRoute("/portal_/programme")({
  ssr: false,
  beforeLoad: requireRole(['client', 'professional']),
  head: () => ({
    meta: [
      { title: "Programme — REPS Client Portal" },
      { name: "description", content: "Your weekly training plan." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgrammePage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY_IDX = 2;

function ProgrammePage() {
  return (
    <ClientShell active="Programme" title="Programme" subtitle="Block 2 · Week 6 of 12 · Lower / Upper split">
      <section className="mb-5 grid grid-cols-7 gap-2">
        {DAYS.map((d, i) => {
          const done = i < TODAY_IDX;
          const active = i === TODAY_IDX;
          return (
            <div
              key={d}
              className={`rounded-[16px] border px-3 py-3 text-center ${
                active
                  ? "border-reps-orange bg-reps-orange-soft"
                  : done
                    ? "border-reps-border bg-reps-panel"
                    : "border-reps-border bg-reps-ink"
              }`}
            >
              <div className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] ${active ? "text-reps-orange" : "text-white/45"}`}>{d}</div>
              <div className={`mt-1 text-[15px] font-semibold ${active ? "text-reps-orange" : done ? "text-white" : "text-white/70"}`}>{18 + i}</div>
              <div className="mt-1 text-[10.5px] text-white/45">{done ? "Done" : active ? "Today" : "Rest"}</div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <PortalCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
                <Dumbbell className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="text-[14px] font-semibold text-white">Lower body strength</div>
                <div className="text-[11.5px] text-white/55">7 exercises · 52 min · Squat focus</div>
              </div>
            </div>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white hover:bg-reps-orange-hover">
              <Play className="h-3.5 w-3.5" /> Start
            </button>
          </div>

          <div className="mt-4 rounded-[12px] border border-reps-border bg-reps-ink/60 p-3 text-[12.5px] text-white/65">
            <span className="font-semibold text-reps-orange">Warm-up · 8 min</span> — bike easy, then 2× world's greatest stretch, hip CARs, banded glute bridge.
          </div>

          <ul className="mt-3 space-y-2">
            {[
              { name: "Back squat", sets: "4 × 6", load: "@ 80kg", rpe: "RPE 7" },
              { name: "Romanian deadlift", sets: "3 × 8", load: "@ 70kg", rpe: "RPE 7" },
              { name: "Walking lunge", sets: "3 × 12 ea", load: "@ 16kg DB", rpe: "RPE 8" },
              { name: "Hip thrust", sets: "3 × 10", load: "@ 90kg", rpe: "RPE 8" },
              { name: "Single-leg calf raise", sets: "3 × 15 ea", load: "BW", rpe: "RPE 9" },
              { name: "Hanging knee raise", sets: "3 × 12", load: "BW", rpe: "RPE 8" },
            ].map((ex) => (
              <li key={ex.name} className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-white">{ex.name}</div>
                  <div className="text-[11.5px] text-white/55">{ex.sets} · {ex.load} · {ex.rpe}</div>
                </div>
                <button className="inline-flex h-7 items-center gap-1 rounded-full border border-reps-border px-2.5 text-[11px] font-medium text-white/70 hover:text-white">
                  <RefreshCw className="h-3 w-3" /> Swap
                </button>
                <button className="inline-flex h-7 items-center gap-1 rounded-full bg-reps-orange-soft px-2.5 text-[11px] font-semibold text-reps-orange">
                  <CheckCircle2 className="h-3 w-3" /> Mark
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-ink/60 p-3 text-[12.5px] text-white/65">
            <span className="font-semibold text-reps-orange">Finisher · 6 min</span> — 3 rounds: 12 KB swings @ 20kg, 10 push-ups, 30s plank.
          </div>
        </PortalCard>

        <div className="space-y-5">
          <PortalCard>
            <div className="text-[13.5px] font-semibold text-white">This week</div>
            <ul className="mt-3 space-y-2">
              {[
                { d: "Mon", s: "Upper push", done: true },
                { d: "Tue", s: "Conditioning · 30 min", done: true },
                { d: "Wed", s: "Lower body strength", done: false, today: true },
                { d: "Thu", s: "Rest", done: false },
                { d: "Fri", s: "Upper pull", done: false },
                { d: "Sat", s: "Long walk · zone 2", done: false },
                { d: "Sun", s: "Rest", done: false },
              ].map((row) => (
                <li key={row.d} className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2 text-[12.5px]">
                  <div>
                    <span className="font-medium text-white/85">{row.d}</span>{" "}
                    <span className="text-white/55">· {row.s}</span>
                  </div>
                  <span className={row.done ? "text-reps-green" : row.today ? "text-reps-orange" : "text-white/40"}>
                    {row.done ? "Done" : row.today ? "Today" : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </PortalCard>

          <PortalCard>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-reps-orange" />
              <span className="text-[13.5px] font-semibold text-white">Block 2 progress</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full bg-reps-orange" style={{ width: "50%" }} />
            </div>
            <div className="mt-2 text-[11.5px] text-white/55">Week 6 of 12 · 18 sessions complete · 92% adherence</div>
          </PortalCard>
        </div>
      </div>
    </ClientShell>
  );
}
