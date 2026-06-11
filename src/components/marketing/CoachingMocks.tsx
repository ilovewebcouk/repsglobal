/**
 * Static coaching-mock components used on /features/coaching.
 *
 * Pure presentational JSX — no data, no logic. These are visual stand-ins for
 * REPS Pro coaching screens that don't exist as live routes yet (programme
 * builder, client portal, client record). When the real routes ship, swap
 * these for AnnotatedMock + DeviceMockup.
 */

import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  ClipboardList,
  Dumbbell,
  FileText,
  Flame,
  HeartPulse,
  LineChart,
  MessageSquare,
  Target,
  Timer,
  TrendingUp,
  Video,
} from "lucide-react";

import { LaptopFrame } from "./LaptopFrame";
import { MockupStage } from "./MockupStage";

// -----------------------------------------------------------------------------
// CoachingDashboardMock — programme delivery dashboard
// -----------------------------------------------------------------------------

const PROGRAMME_WEEK = [
  { day: "Mon", focus: "Lower body strength", status: "done" as const },
  { day: "Tue", focus: "Conditioning", status: "done" as const },
  { day: "Wed", focus: "Rest / mobility", status: "rest" as const },
  { day: "Thu", focus: "Upper push", status: "today" as const },
  { day: "Fri", focus: "Upper pull", status: "upcoming" as const },
  { day: "Sat", focus: "Lower hinge", status: "upcoming" as const },
  { day: "Sun", focus: "Rest", status: "rest" as const },
];

const EXERCISE_ROWS = [
  { name: "Back squat", sets: "4", reps: "5", tempo: "3-0-1", rest: "180s", video: true },
  { name: "Romanian deadlift", sets: "3", reps: "8", tempo: "2-1-1", rest: "120s", video: true },
  { name: "Bulgarian split squat", sets: "3", reps: "10/leg", tempo: "2-0-1", rest: "90s", video: true },
  { name: "Single-leg calf raise", sets: "3", reps: "12/leg", tempo: "2-1-2", rest: "60s", video: false },
];

export function CoachingDashboardMock() {
  return (
    <MockupStage variant="laptop">
      <LaptopFrame>
        <div className="flex h-full text-left">
          {/* Sidebar */}
          <div className="hidden w-[18%] shrink-0 border-r border-white/5 bg-reps-ink/80 p-2 sm:block">
            <div className="space-y-1">
              {["Today", "Clients", "Programmes", "Check-ins", "Templates", "Library"].map((l, i) => (
                <div
                  key={l}
                  className={`flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[7px] font-medium ${
                    i === 2 ? "bg-reps-orange/15 text-reps-orange" : "text-white/55"
                  }`}
                >
                  <span className="size-1 rounded-full bg-current opacity-50" />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 overflow-hidden p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
                  Programme · James Carter
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Hypertrophy block — Week 4 of 8
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-emerald-300">
                On track
              </span>
            </div>

            {/* Week strip */}
            <div className="mt-2.5 grid grid-cols-7 gap-1">
              {PROGRAMME_WEEK.map((d) => (
                <div
                  key={d.day}
                  className={`rounded-[6px] border p-1 ${
                    d.status === "today"
                      ? "border-reps-orange/60 bg-reps-orange/10"
                      : d.status === "done"
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : d.status === "rest"
                      ? "border-white/10 bg-reps-ink/60"
                      : "border-white/10 bg-reps-panel/40"
                  }`}
                >
                  <p className="text-[7px] font-semibold uppercase tracking-wider text-white/65">
                    {d.day}
                  </p>
                  <p className="mt-0.5 truncate text-[7.5px] text-white/80">{d.focus}</p>
                  <div className="mt-1 flex items-center gap-0.5 text-[6.5px] text-white/55">
                    {d.status === "done" ? (
                      <CheckCircle2 className="size-2 text-emerald-400" />
                    ) : d.status === "today" ? (
                      <Flame className="size-2 text-reps-orange" />
                    ) : (
                      <Circle className="size-2" />
                    )}
                    <span className="capitalize">{d.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Today's session */}
            <div className="mt-2.5 rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="size-2.5 text-reps-orange" />
                  <p className="text-[9px] font-bold text-white">Thursday · Lower body strength</p>
                </div>
                <span className="text-[7px] text-white/55">~ 55 min</span>
              </div>

              <div className="mt-2 overflow-hidden rounded-[6px] border border-white/5">
                <div className="grid grid-cols-[2fr_repeat(4,1fr)_auto] gap-1 border-b border-white/5 bg-reps-ink/60 px-1.5 py-1 text-[6.5px] font-semibold uppercase tracking-wider text-white/45">
                  <span>Exercise</span>
                  <span>Sets</span>
                  <span>Reps</span>
                  <span>Tempo</span>
                  <span>Rest</span>
                  <span className="w-3" />
                </div>
                {EXERCISE_ROWS.map((r) => (
                  <div
                    key={r.name}
                    className="grid grid-cols-[2fr_repeat(4,1fr)_auto] items-center gap-1 border-b border-white/5 px-1.5 py-1 text-[7.5px] text-white/80 last:border-b-0"
                  >
                    <span className="truncate font-medium text-white">{r.name}</span>
                    <span>{r.sets}</span>
                    <span>{r.reps}</span>
                    <span>{r.tempo}</span>
                    <span>{r.rest}</span>
                    <Video
                      className={`size-2 ${r.video ? "text-reps-orange" : "text-white/20"}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row */}
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[
                { icon: Target, label: "Goal", value: "Add 5kg squat" },
                { icon: TrendingUp, label: "Adherence", value: "92% · 4 wks" },
                { icon: MessageSquare, label: "Note", value: "Knee feeling 9/10" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-[6px] border border-white/5 bg-reps-ink/40 p-1.5"
                >
                  <div className="flex items-center gap-1 text-[6.5px] uppercase tracking-wider text-white/45">
                    <s.icon className="size-2 text-reps-orange" />
                    {s.label}
                  </div>
                  <p className="mt-0.5 text-[8px] font-medium text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LaptopFrame>
    </MockupStage>
  );
}

// -----------------------------------------------------------------------------
// ClientPortalMock — what the client sees
// -----------------------------------------------------------------------------

const PORTAL_TASKS = [
  { label: "Complete weekly check-in", due: "Due today", urgent: true },
  { label: "Watch: How to set up your squat", due: "Programme video" },
  { label: "Log Tuesday's session", due: "Optional" },
];

export function ClientPortalMock() {
  return (
    <MockupStage variant="laptop">
      <LaptopFrame>
        <div className="h-full bg-gradient-to-br from-reps-panel/60 to-reps-ink p-3 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[7.5px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Your coaching · James
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-white">Hi James — here's your week.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-gradient-to-br from-reps-orange to-amber-400" />
              <p className="text-[8px] font-medium text-white">Coach Sarah</p>
            </div>
          </div>

          {/* Next session card */}
          <div className="mt-2.5 rounded-[8px] border border-reps-orange/30 bg-reps-orange/10 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="size-2.5 text-reps-orange" />
                <p className="text-[8.5px] font-bold text-white">Next session — Thursday 6:30am</p>
              </div>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[6.5px] font-semibold text-white/80">
                Lower body
              </span>
            </div>
            <p className="mt-1 text-[7.5px] text-white/65">
              4 exercises · 55 min · video demos included
            </p>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {/* Tasks */}
            <div className="rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
              <div className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-wider text-white/55">
                <ClipboardList className="size-2 text-reps-orange" /> What's next
              </div>
              <div className="mt-1.5 space-y-1">
                {PORTAL_TASKS.map((t) => (
                  <div
                    key={t.label}
                    className="flex items-start gap-1.5 rounded-[5px] border border-white/5 bg-reps-ink/40 p-1"
                  >
                    {t.urgent ? (
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-reps-orange" />
                    ) : (
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-white/20" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[7.5px] font-medium text-white">{t.label}</p>
                      <p className="text-[6.5px] text-white/50">{t.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
              <div className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-wider text-white/55">
                <LineChart className="size-2 text-reps-orange" /> Your progress
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                {[
                  { label: "Squat 1RM", value: "118 kg", delta: "+8" },
                  { label: "Bodyweight", value: "82.4 kg", delta: "-1.2" },
                  { label: "Adherence", value: "92%", delta: "+4%" },
                  { label: "Sessions", value: "16 / 24", delta: "" },
                ].map((m) => (
                  <div key={m.label} className="rounded-[5px] bg-reps-ink/50 p-1">
                    <p className="text-[6px] uppercase tracking-wider text-white/45">{m.label}</p>
                    <p className="text-[8.5px] font-bold text-white">{m.value}</p>
                    {m.delta ? (
                      <p className="text-[6px] font-semibold text-emerald-300">{m.delta}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-[6px] border border-white/10 bg-reps-ink/40 px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="size-2.5 text-reps-orange" />
              <p className="text-[7.5px] font-medium text-white">
                Sarah: "Great work this week — let's chase 120kg on Thursday."
              </p>
            </div>
            <span className="text-[6.5px] text-white/45">2h ago</span>
          </div>
        </div>
      </LaptopFrame>
    </MockupStage>
  );
}

// -----------------------------------------------------------------------------
// ClientRecordMock — single client coaching record
// -----------------------------------------------------------------------------

export function ClientRecordMock() {
  return (
    <MockupStage variant="laptop">
      <LaptopFrame>
        <div className="h-full p-3 text-left">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-reps-orange to-amber-400 text-[9px] font-bold text-white">
              JC
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-white">James Carter</p>
              <p className="text-[7px] text-white/55">
                Hypertrophy block · Wk 4/8 · Last seen yesterday
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[6.5px] font-semibold uppercase tracking-wider text-emerald-300">
              On track
            </span>
          </div>

          {/* Tabs */}
          <div className="mt-2 flex gap-1 text-[7px] font-semibold uppercase tracking-wider">
            {["Overview", "Programme", "Check-ins", "Progress", "Notes"].map((t, i) => (
              <span
                key={t}
                className={`rounded-[5px] px-1.5 py-1 ${
                  i === 0
                    ? "bg-reps-orange/15 text-reps-orange"
                    : "text-white/50"
                }`}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className="col-span-2 rounded-[6px] border border-white/10 bg-reps-panel/40 p-2">
              <div className="flex items-center gap-1 text-[6.5px] uppercase tracking-wider text-white/45">
                <Target className="size-2 text-reps-orange" /> Goals & context
              </div>
              <ul className="mt-1.5 space-y-1 text-[7.5px] text-white/80">
                <li>· Add 5 kg to back squat by Sept</li>
                <li>· Return to 5-a-side, knee-confident</li>
                <li className="text-white/55">· Note: left knee — mild patellar grumble, avoid deep front squat</li>
              </ul>
            </div>

            <div className="rounded-[6px] border border-white/10 bg-reps-panel/40 p-2">
              <div className="flex items-center gap-1 text-[6.5px] uppercase tracking-wider text-white/45">
                <HeartPulse className="size-2 text-reps-orange" /> Latest check-in
              </div>
              <p className="mt-1 text-[8.5px] font-bold text-white">Energy 8 · Sleep 7</p>
              <p className="text-[6.5px] text-white/55">Submitted Sunday · 4 days ago</p>
            </div>

            <div className="col-span-3 rounded-[6px] border border-white/10 bg-reps-panel/40 p-2">
              <div className="flex items-center gap-1 text-[6.5px] uppercase tracking-wider text-white/45">
                <Timer className="size-2 text-reps-orange" /> Timeline
              </div>
              <div className="mt-1.5 space-y-1">
                {[
                  { d: "Yesterday", e: "Completed Tuesday conditioning · noted shoulder fine" },
                  { d: "Sun", e: "Check-in submitted — energy ↑, weight 82.4 kg" },
                  { d: "Last wk", e: "PB: Romanian deadlift 100 kg × 8" },
                  { d: "Wk 2", e: "Programme adapted — added single-leg work for knee" },
                ].map((r) => (
                  <div key={r.d} className="flex items-start gap-1.5 text-[7.5px]">
                    <span className="w-12 shrink-0 text-white/45">{r.d}</span>
                    <span className="text-white/80">{r.e}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-3 rounded-[6px] border border-reps-orange/30 bg-reps-orange/10 p-2">
              <div className="flex items-center gap-1.5">
                <FileText className="size-2.5 text-reps-orange" />
                <p className="text-[8px] font-semibold text-white">
                  Coach note: review programme Sunday — bump squat to 122.5 kg if Thursday clean.
                </p>
              </div>
            </div>
          </div>
        </div>
      </LaptopFrame>
    </MockupStage>
  );
}
