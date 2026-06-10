/**
 * Interactive coaching mocks for /features/coaching.
 *
 * Pure presentational JSX with local useState toggles. No data, no logic.
 * Each mock uses the shared MockShell (laptop chrome with in-frame pill
 * toggle) so the page feels coherent rather than a carousel zoo.
 *
 * Toggle pattern (LOCKED):
 *   - Real <button> elements with aria-pressed
 *   - Instant swap, no animation between states
 *   - Default state set so the section reads correctly with zero clicks
 */

import { ReactNode, useState } from "react";
import {
  Apple,
  Award,
  
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  Droplets,
  Dumbbell,
  Filter,
  FileText,
  Flame,
  Footprints,
  HeartPulse,
  Image as ImageIcon,
  Lock,
  Mail,
  MessageSquare,
  Mic,
  Moon,
  PlayCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Utensils,
  Video,
  Watch,
  Zap,
} from "lucide-react";

import { MockupStage } from "../MockupStage";

// -----------------------------------------------------------------------------
// Shared shell — laptop chrome with in-frame pill toggle
// -----------------------------------------------------------------------------

interface MockShellProps<T extends string> {
  label: string;
  states: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
}

function MockShell<T extends string>({
  label,
  states,
  active,
  onChange,
  children,
}: MockShellProps<T>) {
  return (
    <MockupStage variant="laptop">
      <div className="relative w-full max-w-full overflow-hidden">
        <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-reps-panel shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
          {/* Top bar with toggle */}
          <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-reps-ink/85 px-3">
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
            <span className="ml-2 hidden text-[10px] font-medium text-white/40 sm:inline">
              {label}
            </span>
            <div
              role="tablist"
              aria-label={label}
              className="ml-auto flex items-center gap-0.5 rounded-full border border-white/10 bg-reps-panel/60 p-0.5"
            >
              {states.map((s) => {
                const isActive = s.id === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-pressed={isActive}
                    aria-selected={isActive}
                    onClick={() => onChange(s.id)}
                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold transition-colors ${
                      isActive
                        ? "bg-reps-orange text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white/80"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Viewport */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-reps-ink">
            {children}
          </div>
        </div>
        <div className="relative mx-auto h-2 w-[106%] -translate-x-[3%] rounded-b-[10px] bg-gradient-to-b from-white/15 to-white/5" />
        <div className="mx-auto h-1 w-[88%] rounded-b-[8px] bg-black/40" />
      </div>
    </MockupStage>
  );
}

// helpers ----------------------------------------------------------------------
const card = "rounded-[8px] border border-white/10 bg-reps-panel/40 p-2";
const cardTight = "rounded-[6px] border border-white/10 bg-reps-panel/40 p-1.5";
const label = "text-[6.5px] font-semibold uppercase tracking-wider text-white/45";
const labelInline =
  "flex items-center gap-1 text-[6.5px] font-semibold uppercase tracking-wider text-white/45";

// =============================================================================
// 1. PROGRAMME — Week 1 / Week 4 / Week 8
// =============================================================================

const PROGRAMME_STATES = [
  { id: "w1", label: "Wk 1" },
  { id: "w4", label: "Wk 4" },
  { id: "w8", label: "Wk 8" },
] as const;
type ProgrammeState = (typeof PROGRAMME_STATES)[number]["id"];

const PROGRAMME_DATA: Record<
  ProgrammeState,
  { phase: string; subtitle: string; squat: string; status: string; rows: { name: string; sets: string; reps: string; tempo: string; load: string }[] }
> = {
  w1: {
    phase: "Foundation block · Week 1 of 8",
    subtitle: "Building patterns, learning RPE",
    squat: "Back squat — 80 kg × 5",
    status: "Onboarding",
    rows: [
      { name: "Back squat", sets: "3", reps: "5", tempo: "3-0-1", load: "80 kg" },
      { name: "Romanian deadlift", sets: "3", reps: "8", tempo: "2-1-1", load: "70 kg" },
      { name: "Goblet split squat", sets: "3", reps: "10/leg", tempo: "2-0-1", load: "20 kg" },
      { name: "Calf raise", sets: "3", reps: "12", tempo: "2-1-2", load: "BW" },
    ],
  },
  w4: {
    phase: "Hypertrophy block · Week 4 of 8",
    subtitle: "Pushing volume, adapting to load",
    squat: "Back squat — 117.5 kg × 5",
    status: "On track",
    rows: [
      { name: "Back squat", sets: "4", reps: "5", tempo: "3-0-1", load: "117.5 kg" },
      { name: "Romanian deadlift", sets: "3", reps: "8", tempo: "2-1-1", load: "95 kg" },
      { name: "Bulgarian split squat", sets: "3", reps: "10/leg", tempo: "2-0-1", load: "22 kg" },
      { name: "Single-leg calf raise", sets: "3", reps: "12/leg", tempo: "2-1-2", load: "16 kg" },
    ],
  },
  w8: {
    phase: "Peak & test · Week 8 of 8",
    subtitle: "Heavy singles, deload before retest",
    squat: "Back squat — 130 kg × 3",
    status: "Peak week",
    rows: [
      { name: "Back squat", sets: "5", reps: "3", tempo: "3-0-1", load: "130 kg" },
      { name: "Romanian deadlift", sets: "3", reps: "6", tempo: "2-1-1", load: "110 kg" },
      { name: "Bulgarian split squat", sets: "3", reps: "8/leg", tempo: "2-0-1", load: "26 kg" },
      { name: "Single-leg calf raise", sets: "4", reps: "10/leg", tempo: "2-1-2", load: "20 kg" },
    ],
  },
};

type FeaturedExerciseProp = {
  exerciseId: string;
  name: string;
  videoUrl: string;
  posterUrl: string;
  bodyPart?: string;
  equipment?: string;
} | null | undefined;

type CuratedExerciseProp = {
  exerciseId: string;
  name: string;
  imageUrl: string;
  category: "lower" | "upper" | "cond";
};

export function ProgrammeMock({ featured }: { featured?: FeaturedExerciseProp } = {}) {
  const [state, setState] = useState<ProgrammeState>("w4");
  const d = PROGRAMME_DATA[state];

  return (
    <MockShell
      label="Programme · James Carter"
      states={PROGRAMME_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
              {d.phase}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">{d.subtitle}</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-emerald-300">
            {d.status}
          </span>
        </div>

        <div className="mt-2.5 rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="size-2.5 text-reps-orange" />
            <p className="text-[9px] font-bold text-white">Thursday · Lower body</p>
            <span className="ml-auto text-[7px] text-white/55">~ 55 min</span>
          </div>
          <div className="mt-2 overflow-hidden rounded-[6px] border border-white/5">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-1 border-b border-white/5 bg-reps-ink/60 px-1.5 py-1 text-[6.5px] font-semibold uppercase tracking-wider text-white/45">
              <span>Exercise</span>
              <span>Sets</span>
              <span>Reps</span>
              <span>Tempo</span>
              <span>Load</span>
            </div>
            {d.rows.map((r) => (
              <div
                key={r.name}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] items-center gap-1 border-b border-white/5 px-1.5 py-1 text-[7.5px] text-white/80 last:border-b-0"
              >
                <span className="truncate font-medium text-white">{r.name}</span>
                <span>{r.sets}</span>
                <span>{r.reps}</span>
                <span>{r.tempo}</span>
                <span className="font-semibold text-reps-orange">{r.load}</span>
              </div>
            ))}
          </div>
        </div>

        {featured ? (
          <div className="mt-2 rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
            <div className="flex items-center gap-1.5">
              <PlayCircle className="size-2.5 text-reps-orange" />
              <p className="text-[8px] font-semibold text-white">{featured.name}</p>
              <span className="ml-auto rounded-full bg-emerald-500/15 px-1.5 py-[1px] text-[6.5px] font-semibold text-emerald-300">
                Live demo
              </span>
            </div>
            <div className="mt-1.5 overflow-hidden rounded-[6px] border border-white/5">
              <video
                src={featured.videoUrl}
                poster={featured.posterUrl}
                muted
                loop
                playsInline
                autoPlay
                className="aspect-video w-full bg-black object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className={cardTight}>
              <div className={labelInline}>
                <Target className="size-2 text-reps-orange" />
                Goal
              </div>
              <p className="mt-0.5 text-[8px] font-medium text-white">+5 kg squat</p>
            </div>
            <div className={cardTight}>
              <div className={labelInline}>
                <TrendingUp className="size-2 text-reps-orange" />
                Progression
              </div>
              <p className="mt-0.5 text-[8px] font-medium text-white">{d.squat}</p>
            </div>
            <div className={cardTight}>
              <div className={labelInline}>
                <Sparkles className="size-2 text-reps-orange" />
                Note
              </div>
              <p className="mt-0.5 text-[8px] font-medium text-white">Knee 9/10</p>
            </div>
          </div>
        )}
      </div>
    </MockShell>
  );
}

// =============================================================================
// 2. EXERCISE LIBRARY — All / Lower / Upper / Conditioning (real media)
// =============================================================================

const LIBRARY_STATES = [
  { id: "all", label: "All" },
  { id: "lower", label: "Lower" },
  { id: "upper", label: "Upper" },
  { id: "cond", label: "Cond." },
] as const;
type LibraryState = (typeof LIBRARY_STATES)[number]["id"];

export function ExerciseLibraryMock({
  curated,
  featured,
}: {
  curated?: CuratedExerciseProp[];
  featured?: FeaturedExerciseProp;
} = {}) {
  const [state, setState] = useState<LibraryState>("all");
  const list = curated ?? [];
  const filtered = state === "all" ? list : list.filter((e) => e.category === state);
  const total = list.length;

  return (
    <MockShell
      label="Exercise library"
      states={LIBRARY_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5 rounded-[6px] border border-white/10 bg-reps-panel/40 px-2 py-1">
            <Search className="size-2.5 text-white/45" />
            <span className="text-[8px] text-white/55">Search 10,000+ exercises…</span>
          </div>
          <div className="flex items-center gap-1 rounded-[6px] border border-white/10 bg-reps-panel/40 px-2 py-1 text-[8px] text-white/55">
            <Filter className="size-2.5 text-reps-orange" />{" "}
            {filtered.length} of {total || "10,000+"}
          </div>
        </div>

        {state === "all" && featured ? (
          <div className="mt-2 overflow-hidden rounded-[6px] border border-reps-orange/30 bg-reps-panel/40 p-1.5">
            <div className="overflow-hidden rounded-[5px] border border-white/10">
              <video
                src={featured.videoUrl}
                poster={featured.posterUrl}
                muted
                loop
                playsInline
                autoPlay
                className="aspect-video w-full bg-black object-cover"
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-[8px] font-semibold text-white">{featured.name}</p>
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-[1px] text-[6.5px] font-semibold text-emerald-300">
                Live demo
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {filtered.slice(0, state === "all" ? 8 : 9).map((e) => (
            <div
              key={e.exerciseId}
              className="rounded-[6px] border border-white/10 bg-reps-panel/40 p-1.5"
            >
              <div className="relative aspect-video overflow-hidden rounded-[5px] bg-reps-ink">
                <img
                  src={e.imageUrl}
                  alt={e.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute right-1 top-1 rounded-full bg-black/50 px-1 py-[1px] text-[6px] font-semibold text-white/80">
                  HD
                </span>
              </div>
              <p className="mt-1 truncate text-[8px] font-semibold text-white">{e.name}</p>
              <div className="mt-0.5 flex items-center justify-end text-[6.5px] text-white/55">
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 rounded-full bg-reps-orange/15 px-1 py-[1px] font-semibold text-reps-orange"
                >
                  <Plus className="size-2" /> Add
                </button>
              </div>
            </div>
          ))}

          {/* Upload-your-own tile — always present, always last */}
          <button
            type="button"
            className="group flex flex-col items-stretch rounded-[6px] border border-dashed border-reps-orange/40 bg-reps-orange/[0.06] p-1.5 text-left transition-colors hover:bg-reps-orange/[0.12]"
          >
            <div className="flex aspect-video items-center justify-center rounded-[5px] bg-reps-ink/60">
              <Video className="size-4 text-reps-orange" />
            </div>
            <p className="mt-1 truncate text-[8px] font-semibold text-white">Upload your own</p>
            <div className="mt-0.5 flex items-center justify-between text-[6.5px] text-white/55">
              <span>Your clip · your cues</span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-reps-orange">
                <Plus className="size-2" /> New
              </span>
            </div>
          </button>
        </div>

        <p className="mt-2 text-[7px] text-white/45">
          HD video demos with cues, regressions and progressions — plus your own uploads alongside.
        </p>
      </div>
    </MockShell>
  );
}


// =============================================================================
// 3. NUTRITION — Library → Draft → Approve → Assigned (AI-draft / coach-approve)
// =============================================================================

const NUTRITION_STATES = [
  { id: "library", label: "Library" },
  { id: "draft", label: "Draft" },
  { id: "approve", label: "Approve" },
  { id: "assigned", label: "Assigned" },
] as const;
type NutritionState = (typeof NUTRITION_STATES)[number]["id"];

const LIBRARY_FILTERS = ["Recipes", "Ingredients", "Meals", "Recipe books", "Templates"];

const LIBRARY_RECIPES = [
  { title: "High-protein chicken rice bowl", macros: "640 kcal · 48P / 70C / 14F", tag: "HP", ings: "12 ingredients" },
  { title: "Tofu peanut noodles", macros: "560 kcal · 28P / 72C / 18F", tag: "V", ings: "9 ingredients" },
  { title: "Overnight oats + berries", macros: "420 kcal · 22P / 58C / 12F", tag: "GF", ings: "6 ingredients" },
  { title: "Salmon traybake", macros: "580 kcal · 42P / 38C / 24F", tag: "HP", ings: "10 ingredients" },
];

const BRIEF_CHIPS = ["James C", "1,800 kcal", "High protein", "7 days", "No dairy"];

const DRAFT_MEALS = [
  { meal: "Breakfast", item: "Overnight oats + berries", k: 420 },
  { meal: "Lunch", item: "Chicken rice bowl", k: 640 },
  { meal: "Snack", item: "Greek yogurt + almonds", k: 240 },
  { meal: "Dinner", item: "Tofu peanut noodles", k: 500 },
];

const APPROVE_MEALS: {
  meal: string;
  item: string;
  k: number;
  flag?: "swap" | "note";
  flagText?: string;
}[] = [
  { meal: "Breakfast", item: "Overnight oats + berries", k: 420 },
  { meal: "Lunch", item: "Chicken rice bowl", k: 640, flag: "note", flagText: "+30g rice on training days" },
  { meal: "Snack", item: "Greek yogurt + almonds", k: 240 },
  { meal: "Dinner", item: "Salmon traybake", k: 500, flag: "swap", flagText: "Swapped → Salmon traybake" },
];

export function NutritionMock() {
  const [state, setState] = useState<NutritionState>("draft");

  return (
    <MockShell
      label="Nutrition · James Carter"
      states={NUTRITION_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        {state === "library" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
                  REPs Nutrition Library
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Recipes &nbsp;·&nbsp; 248 in your library
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-semibold text-emerald-300">
                Approved by you · 248
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {LIBRARY_FILTERS.map((f, i) => (
                <span
                  key={f}
                  className={`rounded-full px-1.5 py-0.5 text-[7px] font-semibold ${
                    i === 0
                      ? "bg-reps-orange text-white"
                      : "border border-white/10 bg-reps-panel/40 text-white/65"
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {LIBRARY_RECIPES.map((r) => (
                <div key={r.title} className={card}>
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="text-[8.5px] font-semibold text-white">{r.title}</p>
                    <span className="rounded-[3px] border border-reps-orange/30 bg-reps-orange/10 px-1 py-px text-[6px] font-bold uppercase text-reps-orange">
                      {r.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[7.5px] text-white/65">{r.macros}</p>
                  <p className="mt-0.5 text-[6.5px] text-white/45">{r.ings}</p>
                </div>
              ))}
            </div>

            <p className="mt-2 text-[7px] text-white/45">
              The AI only suggests meals from this approved set — never a random food database.
            </p>
          </>
        )}

        {state === "draft" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
                  AI draft · brief
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Draft a plan from your library
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-reps-orange/30 bg-reps-orange/15 px-1.5 py-0.5 text-[7px] font-semibold text-reps-orange">
                <Sparkles className="size-2.5" /> Generate draft
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {BRIEF_CHIPS.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-white/10 bg-reps-panel/40 px-1.5 py-0.5 text-[7px] font-semibold text-white/75"
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-2 space-y-1">
              {DRAFT_MEALS.map((m) => (
                <div
                  key={m.meal}
                  className="flex items-center gap-2 rounded-[5px] border border-white/5 bg-reps-panel/40 px-2 py-1"
                >
                  <Utensils className="size-2.5 text-reps-orange" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] font-semibold text-white">{m.meal}</p>
                    <p className="truncate text-[7px] text-white/60">{m.item}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-[3px] border border-reps-orange/30 bg-reps-orange/10 px-1 py-px text-[6.5px] font-semibold text-reps-orange">
                    <Sparkles className="size-2" /> AI suggested
                  </span>
                  <span className="text-[7.5px] font-semibold text-white/65">{m.k} kcal</span>
                </div>
              ))}
            </div>

            <p className="mt-2 text-[7px] text-white/45">
              Draft only — not sent to client. Coach reviews next.
            </p>
          </>
        )}

        {state === "approve" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
                  Coach review
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Awaiting sign-off &nbsp;·&nbsp; 2 edits made
                </p>
              </div>
              <div className="flex gap-1">
                <span className="rounded-[4px] border border-white/15 bg-reps-panel/60 px-1.5 py-0.5 text-[7px] font-semibold text-white/75">
                  Edit
                </span>
                <span className="flex items-center gap-1 rounded-[4px] border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-semibold text-emerald-300">
                  <Check className="size-2.5" /> Approve
                </span>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {APPROVE_MEALS.map((m) => (
                <div
                  key={m.meal}
                  className="rounded-[5px] border border-white/5 bg-reps-panel/40 px-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="size-2.5 text-reps-orange" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[7.5px] font-semibold text-white">{m.meal}</p>
                      <p className="truncate text-[7px] text-white/60">{m.item}</p>
                    </div>
                    <span className="text-[7.5px] font-semibold text-white/65">{m.k} kcal</span>
                  </div>
                  {m.flag === "swap" && (
                    <p className="mt-1 ml-4 inline-block rounded-[3px] border border-emerald-400/30 bg-emerald-500/10 px-1 py-px text-[6.5px] font-semibold text-emerald-300">
                      {m.flagText}
                    </p>
                  )}
                  {m.flag === "note" && (
                    <p className="mt-1 ml-4 inline-block rounded-[3px] border border-white/10 bg-reps-ink/40 px-1 py-px text-[6.5px] font-semibold text-white/70">
                      Coach note · {m.flagText}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-2 text-[7px] text-white/55">
              Nothing reaches the client until you sign it off.
            </p>
          </>
        )}

        {state === "assigned" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.18em] text-emerald-300">
                  <CheckCircle2 className="size-3" /> Approved &amp; assigned
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Assigned to James &nbsp;·&nbsp; Mon 10 Jun
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-semibold text-emerald-300">
                Signed off by you
              </span>
            </div>

            <div className="mt-2 space-y-1 opacity-90">
              {APPROVE_MEALS.map((m) => (
                <div
                  key={m.meal}
                  className="flex items-center gap-2 rounded-[5px] border border-white/5 bg-reps-panel/40 px-2 py-1"
                >
                  <CheckCircle2 className="size-2.5 text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] font-semibold text-white">{m.meal}</p>
                    <p className="truncate text-[7px] text-white/60">{m.item}</p>
                  </div>
                  <span className="text-[7.5px] font-semibold text-white/65">{m.k} kcal</span>
                </div>
              ))}
            </div>

            <div className="mt-2 rounded-[6px] border border-white/10 bg-reps-panel/40 p-2">
              <p className={label}>Audit trail</p>
              <p className="mt-0.5 text-[7.5px] text-white/75">
                Generated by AI · 2 swaps · 1 coach note · approved by coach · saved to client record
              </p>
            </div>
          </>
        )}
      </div>
    </MockShell>
  );
}


// =============================================================================
// 4. HABITS & WEARABLES — Sleep / Steps / Water / Workouts
// =============================================================================

const HABITS_STATES = [
  { id: "sleep", label: "Sleep" },
  { id: "steps", label: "Steps" },
  { id: "water", label: "Water" },
  { id: "trains", label: "Training" },
] as const;
type HabitState = (typeof HABITS_STATES)[number]["id"];

const HABIT_BARS: Record<HabitState, { d: string; v: number; raw: string }[]> = {
  sleep: [
    { d: "Mon", v: 78, raw: "7h 30m" },
    { d: "Tue", v: 84, raw: "8h 05m" },
    { d: "Wed", v: 72, raw: "6h 55m" },
    { d: "Thu", v: 80, raw: "7h 45m" },
    { d: "Fri", v: 62, raw: "6h 00m" },
    { d: "Sat", v: 92, raw: "8h 50m" },
    { d: "Sun", v: 86, raw: "8h 15m" },
  ],
  steps: [
    { d: "Mon", v: 75, raw: "8,420" },
    { d: "Tue", v: 92, raw: "11,200" },
    { d: "Wed", v: 60, raw: "6,800" },
    { d: "Thu", v: 88, raw: "10,640" },
    { d: "Fri", v: 70, raw: "7,900" },
    { d: "Sat", v: 95, raw: "12,300" },
    { d: "Sun", v: 65, raw: "7,200" },
  ],
  water: [
    { d: "Mon", v: 85, raw: "2.6 L" },
    { d: "Tue", v: 92, raw: "2.9 L" },
    { d: "Wed", v: 75, raw: "2.3 L" },
    { d: "Thu", v: 88, raw: "2.7 L" },
    { d: "Fri", v: 60, raw: "1.8 L" },
    { d: "Sat", v: 90, raw: "2.8 L" },
    { d: "Sun", v: 80, raw: "2.5 L" },
  ],
  trains: [
    { d: "Mon", v: 100, raw: "Lower" },
    { d: "Tue", v: 100, raw: "Cond" },
    { d: "Wed", v: 0, raw: "Rest" },
    { d: "Thu", v: 100, raw: "Push" },
    { d: "Fri", v: 100, raw: "Pull" },
    { d: "Sat", v: 100, raw: "Hinge" },
    { d: "Sun", v: 0, raw: "Rest" },
  ],
};

const HABIT_META: Record<
  HabitState,
  { icon: typeof Moon; title: string; avg: string }
> = {
  sleep: { icon: Moon, title: "Sleep · last 7 days", avg: "Avg 7h 38m · target 8h" },
  steps: { icon: Footprints, title: "Steps · last 7 days", avg: "Avg 9,210 · target 10k" },
  water: { icon: Droplets, title: "Hydration · last 7 days", avg: "Avg 2.5 L · target 3 L" },
  trains: { icon: Dumbbell, title: "Training sessions logged", avg: "5 / 5 planned · 100%" },
};

export function HabitsMock() {
  const [state, setState] = useState<HabitState>("sleep");
  const bars = HABIT_BARS[state];
  const meta = HABIT_META[state];
  const Icon = meta.icon;

  return (
    <MockShell
      label="Habits & wearables"
      states={HABITS_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon className="size-3 text-reps-orange" />
            <div>
              <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
                {meta.title}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-white">{meta.avg}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-emerald-300">
            <span className="size-1 rounded-full bg-emerald-300" /> Live sync
          </span>
        </div>

        <div className="mt-3 flex h-[100px] items-end gap-2">
          {bars.map((b) => (
            <div key={b.d} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[6.5px] font-semibold text-white/70">{b.raw}</span>
              <div
                className={`w-full rounded-t-[3px] ${
                  b.v === 0
                    ? "bg-white/10"
                    : b.v >= 85
                    ? "bg-emerald-400/70"
                    : b.v >= 70
                    ? "bg-reps-orange/70"
                    : "bg-white/30"
                }`}
                style={{ height: `${Math.max(b.v, 6)}%` }}
              />
              <span className="text-[6.5px] text-white/55">{b.d}</span>
            </div>
          ))}
        </div>

        <div className="mt-2.5">
          <p className={label}>Connected sources</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {[
              { i: Apple, l: "Apple Health" },
              { i: Watch, l: "Garmin" },
              { i: HeartPulse, l: "Whoop" },
              { i: Zap, l: "Fitbit" },
            ].map((s) => (
              <span
                key={s.l}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[7px] font-medium text-white/80"
              >
                <s.i className="size-2 text-emerald-300" /> {s.l}
                <span className="text-[6px] text-emerald-300">●</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </MockShell>
  );
}

// =============================================================================
// 5. CHECK-INS INBOX — Pending / Replied / Flagged
// =============================================================================

const INBOX_STATES = [
  { id: "pending", label: "Pending" },
  { id: "replied", label: "Replied" },
  { id: "flagged", label: "Flagged" },
] as const;
type InboxState = (typeof INBOX_STATES)[number]["id"];

type InboxRow = {
  name: string;
  initials: string;
  preview: string;
  when: string;
  tag: "pending" | "replied" | "flagged";
  badge?: string;
};

const INBOX_ALL: InboxRow[] = [
  { name: "James Carter", initials: "JC", preview: "Felt strong on Tuesday — squat could go up.", when: "2h", tag: "pending" },
  { name: "Priya Shah", initials: "PS", preview: "Sleep was rough — only 5h Friday.", when: "5h", tag: "pending" },
  { name: "Marcus Hill", initials: "MH", preview: "Down 0.8 kg, energy good.", when: "1d", tag: "pending" },
  { name: "Sara Lin", initials: "SL", preview: "Coach reply: bump squat to 122.5 kg Thursday.", when: "1d", tag: "replied" },
  { name: "Tom Reid", initials: "TR", preview: "Coach reply: rest Wednesday, push Friday.", when: "2d", tag: "replied" },
  { name: "Amal Khan", initials: "AK", preview: "Coach reply: great consistency — let's set a new PB target.", when: "3d", tag: "replied" },
  { name: "Daisy Wu", initials: "DW", preview: "No check-in for 2 weeks · pause programme?", when: "14d", tag: "flagged", badge: "Quiet" },
  { name: "Ben Owusu", initials: "BO", preview: "Adherence dropped to 50% this block.", when: "1w", tag: "flagged", badge: "Low adherence" },
];

export function CheckInsInboxMock() {
  const [state, setState] = useState<InboxState>("pending");
  const rows = INBOX_ALL.filter((r) => r.tag === state);

  return (
    <MockShell
      label="Check-ins inbox"
      states={INBOX_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
              Check-ins · this week
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">
              {rows.length} {state}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-reps-panel/40 px-1.5 py-0.5 text-[7px] font-medium text-white/70">
            14 clients total
          </span>
        </div>

        <div className="mt-2 space-y-1">
          {rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-2 rounded-[6px] border border-white/10 bg-reps-panel/40 px-2 py-1.5"
            >
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-reps-orange to-amber-400 text-[7.5px] font-bold text-white">
                {r.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[8px] font-semibold text-white">{r.name}</p>
                  {r.badge && (
                    <span className="rounded-full bg-reps-orange/15 px-1 py-[1px] text-[6px] font-semibold uppercase text-reps-orange">
                      {r.badge}
                    </span>
                  )}
                </div>
                <p className="truncate text-[7px] text-white/60">{r.preview}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[6.5px] text-white/45">{r.when}</span>
                {state === "pending" && (
                  <span className="size-1.5 rounded-full bg-reps-orange" />
                )}
                {state === "replied" && (
                  <CheckCircle2 className="size-2.5 text-emerald-400" />
                )}
                {state === "flagged" && <Bell className="size-2.5 text-reps-orange" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockShell>
  );
}

// =============================================================================
// 6. PROGRESS — Strength / Body / Adherence / Photos
// =============================================================================

const PROGRESS_STATES = [
  { id: "strength", label: "Strength" },
  { id: "body", label: "Body" },
  { id: "adh", label: "Adherence" },
  { id: "photos", label: "Photos" },
] as const;
type ProgressState = (typeof PROGRESS_STATES)[number]["id"];

function LineChartSvg({ points, color = "#FF7A00" }: { points: number[]; color?: string }) {
  const w = 280;
  const h = 90;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * (h - 10) - 5;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <path d={area} fill={color} fillOpacity="0.12" />
      <path d={path} stroke={color} strokeWidth="1.6" fill="none" />
      {points.map((p, i) => {
        const x = i * step;
        const y = h - ((p - min) / range) * (h - 10) - 5;
        return <circle key={i} cx={x} cy={y} r="1.6" fill={color} />;
      })}
    </svg>
  );
}

export function ProgressMock() {
  const [state, setState] = useState<ProgressState>("strength");

  return (
    <MockShell
      label="Progress · James Carter"
      states={PROGRESS_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        {state === "strength" && (
          <>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
              Strength progress · 8 weeks
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">
              Back squat 1RM &nbsp;·&nbsp; 110 kg → 130 kg
            </p>
            <div className="mt-2 h-[100px] rounded-[6px] border border-white/10 bg-reps-panel/40 p-1.5">
              <LineChartSvg points={[110, 112, 115, 117.5, 120, 122.5, 127.5, 130]} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[
                { l: "Back squat", v: "130 kg", d: "+20" },
                { l: "Deadlift", v: "160 kg", d: "+15" },
                { l: "Bench", v: "92.5 kg", d: "+7.5" },
              ].map((m) => (
                <div key={m.l} className={cardTight}>
                  <p className={label}>{m.l}</p>
                  <p className="mt-0.5 text-[9.5px] font-bold text-white">{m.v}</p>
                  <p className="text-[6.5px] font-semibold text-emerald-300">+{m.d.replace("+", "")} kg</p>
                </div>
              ))}
            </div>
          </>
        )}

        {state === "body" && (
          <>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
              Body composition · 8 weeks
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">
              Bodyweight 84.2 → 81.6 kg &nbsp;·&nbsp; −2.6 kg
            </p>
            <div className="mt-2 h-[100px] rounded-[6px] border border-white/10 bg-reps-panel/40 p-1.5">
              <LineChartSvg
                points={[84.2, 83.8, 83.4, 83.0, 82.6, 82.2, 81.9, 81.6]}
                color="#34d399"
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[
                { l: "Waist", v: "84 cm", d: "−3" },
                { l: "Hip", v: "98 cm", d: "−1" },
                { l: "Chest", v: "104 cm", d: "+1" },
              ].map((m) => (
                <div key={m.l} className={cardTight}>
                  <p className={label}>{m.l}</p>
                  <p className="mt-0.5 text-[9.5px] font-bold text-white">{m.v}</p>
                  <p className="text-[6.5px] font-semibold text-emerald-300">{m.d} cm</p>
                </div>
              ))}
            </div>
          </>
        )}

        {state === "adh" && (
          <>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
              Adherence · 8 weeks
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">
              92% sessions &nbsp;·&nbsp; 88% check-ins
            </p>
            <div className="mt-2 grid grid-cols-8 gap-1">
              {Array.from({ length: 8 }).map((_, i) => {
                const v = [85, 100, 75, 100, 100, 88, 100, 92][i];
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-[80px] w-full overflow-hidden rounded-[4px] bg-white/5">
                      <div
                        className={`mt-auto w-full ${v >= 90 ? "bg-emerald-400/70" : v >= 75 ? "bg-reps-orange/70" : "bg-white/30"}`}
                        style={{ height: `${v}%`, marginTop: `${100 - v}%` }}
                      />
                    </div>
                    <span className="text-[6px] text-white/55">W{i + 1}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <div className={cardTight}>
                <p className={label}>Sessions</p>
                <p className="mt-0.5 text-[9.5px] font-bold text-white">22 / 24</p>
              </div>
              <div className={cardTight}>
                <p className={label}>Check-ins</p>
                <p className="mt-0.5 text-[9.5px] font-bold text-white">7 / 8</p>
              </div>
              <div className={cardTight}>
                <p className={label}>Streak</p>
                <p className="mt-0.5 text-[9.5px] font-bold text-white">4 weeks</p>
              </div>
            </div>
          </>
        )}

        {state === "photos" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
                  Progress photos · stored privately
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Week 1 &nbsp;·&nbsp; Week 4 &nbsp;·&nbsp; Week 8
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-reps-panel/40 px-1.5 py-0.5 text-[7px] text-white/65">
                <Lock className="size-2 text-emerald-300" /> Client-only by default
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {["Wk 1", "Wk 4", "Wk 8"].map((w) => (
                <div key={w} className="space-y-1">
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[6px] border border-white/10 bg-gradient-to-br from-reps-panel/80 to-reps-ink">
                    <Camera className="size-5 text-white/30" />
                  </div>
                  <p className="text-center text-[7.5px] font-semibold text-white">{w}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[7px] leading-relaxed text-white/55">
              Photos require explicit client consent each time. They are stored encrypted and
              never appear on your public profile.
            </p>
          </>
        )}
      </div>
    </MockShell>
  );
}

// =============================================================================
// 7. MESSAGING — Text / Voice / Form-reply
// =============================================================================

const MESSAGING_STATES = [
  { id: "text", label: "Text" },
  { id: "voice", label: "Voice" },
  { id: "form", label: "Form" },
] as const;
type MessagingState = (typeof MESSAGING_STATES)[number]["id"];

export function MessagingMock() {
  const [state, setState] = useState<MessagingState>("text");

  return (
    <MockShell
      label="Messages · James Carter"
      states={MESSAGING_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-reps-orange to-amber-400 text-[7.5px] font-bold text-white">
            JC
          </div>
          <div className="flex-1">
            <p className="text-[8.5px] font-bold text-white">James Carter</p>
            <p className="text-[6.5px] text-white/55">Active client · Hypertrophy block wk 4</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[6.5px] font-semibold uppercase tracking-wider text-emerald-300">
            Online
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-[8px] rounded-tl-[2px] border border-white/10 bg-reps-panel/60 px-2 py-1.5">
              <p className="text-[8px] text-white/85">
                Squat felt heavy today — knee was fine though.
              </p>
              <p className="mt-0.5 text-[6px] text-white/45">James · 14:02</p>
            </div>
          </div>

          {state === "text" && (
            <>
              <div className="flex justify-end">
                <div className="max-w-[70%] rounded-[8px] rounded-tr-[2px] bg-reps-orange px-2 py-1.5 text-white">
                  <p className="text-[8px]">
                    Good. Let's hold 117.5 kg for one more session, then test on Thursday.
                  </p>
                  <p className="mt-0.5 text-[6px] text-white/70">You · 14:04</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[70%] rounded-[8px] rounded-tl-[2px] border border-white/10 bg-reps-panel/60 px-2 py-1.5">
                  <p className="text-[8px] text-white/85">Got it. 👍</p>
                  <p className="mt-0.5 text-[6px] text-white/45">James · 14:05</p>
                </div>
              </div>
            </>
          )}

          {state === "voice" && (
            <div className="flex justify-end">
              <div className="flex max-w-[80%] items-center gap-2 rounded-[8px] rounded-tr-[2px] bg-reps-orange px-2 py-2 text-white">
                <button className="flex size-6 items-center justify-center rounded-full bg-white/15">
                  <PlayCircle className="size-3.5" />
                </button>
                <div className="flex flex-1 items-center gap-[2px]">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[2px] rounded-full bg-white/80"
                      style={{ height: `${4 + Math.sin(i * 0.8) * 6 + Math.random() * 6}px` }}
                    />
                  ))}
                </div>
                <span className="text-[7px] font-semibold text-white/80">0:34</span>
              </div>
            </div>
          )}

          {state === "form" && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-[8px] rounded-tl-[2px] border border-reps-orange/30 bg-reps-orange/10 p-2">
                <div className="flex items-center gap-1 text-[6.5px] font-semibold uppercase tracking-wider text-reps-orange">
                  <ClipboardCheck className="size-2.5" /> Weekly check-in submitted
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1">
                  {[
                    { l: "Energy", v: "8/10" },
                    { l: "Sleep", v: "7/10" },
                    { l: "Adh.", v: "92%" },
                  ].map((m) => (
                    <div key={m.l} className="rounded-[4px] bg-reps-ink/50 px-1 py-1">
                      <p className="text-[6px] uppercase text-white/45">{m.l}</p>
                      <p className="text-[8px] font-bold text-white">{m.v}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[7px] text-white/70">
                  "Knee felt fine through Bulgarian split squats."
                </p>
                <p className="mt-0.5 text-[6px] text-white/45">James · Sunday 19:14</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1.5 rounded-[6px] border border-white/10 bg-reps-panel/60 px-2 py-1.5">
          {state === "voice" ? (
            <>
              <Mic className="size-3 text-reps-orange" />
              <span className="text-[8px] text-white/55">Hold to record · max 3 min</span>
            </>
          ) : (
            <>
              <span className="text-[8px] text-white/55">Type a reply…</span>
              <div className="ml-auto flex items-center gap-1.5 text-white/45">
                <Mic className="size-2.5" />
                <Send className="size-2.5 text-reps-orange" />
              </div>
            </>
          )}
        </div>
      </div>
    </MockShell>
  );
}

// =============================================================================
// 8. CLIENT PORTAL — Today / Programme / Check-in / Progress
// =============================================================================

const PORTAL_STATES = [
  { id: "today", label: "Today" },
  { id: "prog", label: "Programme" },
  { id: "check", label: "Check-in" },
  { id: "prog2", label: "Progress" },
] as const;
type PortalState = (typeof PORTAL_STATES)[number]["id"];

export function ClientPortalInteractiveMock() {
  const [state, setState] = useState<PortalState>("today");

  return (
    <MockShell
      label="Client portal · what James sees"
      states={PORTAL_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden bg-gradient-to-br from-reps-panel/60 to-reps-ink p-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[7.5px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Your coaching
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">Hi James — let's go.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-4 rounded-full bg-gradient-to-br from-reps-orange to-amber-400" />
            <p className="text-[8px] font-medium text-white">Coach Sarah</p>
          </div>
        </div>

        {state === "today" && (
          <>
            <div className="mt-2.5 rounded-[8px] border border-reps-orange/30 bg-reps-orange/10 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-2.5 text-reps-orange" />
                  <p className="text-[8.5px] font-bold text-white">Today · Thursday 6:30am</p>
                </div>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[6.5px] font-semibold text-white/80">
                  Lower body
                </span>
              </div>
              <p className="mt-1 text-[7.5px] text-white/65">4 exercises · 55 min · video demos</p>
            </div>
            <div className="mt-2 space-y-1">
              {[
                { l: "Complete today's session", due: "When you train", urgent: true },
                { l: "Submit weekly check-in", due: "Sunday", urgent: false },
                { l: "Log Wednesday's meals", due: "Today", urgent: false },
              ].map((t) => (
                <div
                  key={t.l}
                  className="flex items-start gap-1.5 rounded-[5px] border border-white/10 bg-reps-panel/40 px-2 py-1.5"
                >
                  <span
                    className={`mt-0.5 size-1.5 shrink-0 rounded-full ${t.urgent ? "bg-reps-orange" : "bg-white/20"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[8px] font-semibold text-white">{t.l}</p>
                    <p className="text-[6.5px] text-white/50">{t.due}</p>
                  </div>
                  <Clock className="size-2.5 text-white/45" />
                </div>
              ))}
            </div>
          </>
        )}

        {state === "prog" && (
          <div className="mt-2.5 rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
            <p className="text-[8px] font-bold text-white">Thursday · Lower body</p>
            <div className="mt-1.5 space-y-1">
              {[
                { n: "Back squat", s: "4 × 5 @ 117.5 kg" },
                { n: "Romanian deadlift", s: "3 × 8 @ 95 kg" },
                { n: "Bulgarian split squat", s: "3 × 10/leg @ 22 kg" },
                { n: "Single-leg calf raise", s: "3 × 12/leg @ 16 kg" },
              ].map((e) => (
                <div
                  key={e.n}
                  className="flex items-center justify-between rounded-[5px] border border-white/5 bg-reps-ink/40 px-2 py-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <PlayCircle className="size-3 text-reps-orange" />
                    <div>
                      <p className="text-[8px] font-semibold text-white">{e.n}</p>
                      <p className="text-[6.5px] text-white/55">{e.s}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-white/20 px-2 py-[2px] text-[6.5px] font-semibold text-white/85"
                  >
                    Log set
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {state === "check" && (
          <div className="mt-2.5 rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
            <p className="text-[8px] font-bold text-white">Weekly check-in</p>
            <div className="mt-1.5 space-y-1">
              {[
                { q: "How was energy this week?", a: "8 / 10" },
                { q: "How was sleep?", a: "7 / 10" },
                { q: "Adherence to programme?", a: "92%" },
                { q: "Bodyweight (kg)", a: "82.4" },
                { q: "Anything to flag?", a: "Knee fine. Felt strong on Tuesday." },
              ].map((r) => (
                <div key={r.q} className="rounded-[5px] border border-white/5 bg-reps-ink/40 px-2 py-1">
                  <p className="text-[6.5px] uppercase tracking-wider text-white/45">{r.q}</p>
                  <p className="text-[8px] text-white/85">{r.a}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-1.5 w-full rounded-full bg-reps-orange py-1 text-[8px] font-bold text-white"
            >
              Submit check-in
            </button>
          </div>
        )}

        {state === "prog2" && (
          <div className="mt-2.5 rounded-[8px] border border-white/10 bg-reps-panel/40 p-2">
            <p className="text-[8px] font-bold text-white">Your progress · last 8 weeks</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {[
                { l: "Squat 1RM", v: "130 kg", d: "+20" },
                { l: "Bodyweight", v: "81.6 kg", d: "−2.6 kg" },
                { l: "Adherence", v: "92%", d: "+4%" },
                { l: "Sessions", v: "22 / 24", d: "" },
              ].map((m) => (
                <div key={m.l} className="rounded-[5px] bg-reps-ink/50 p-1.5">
                  <p className="text-[6px] uppercase tracking-wider text-white/45">{m.l}</p>
                  <p className="text-[9.5px] font-bold text-white">{m.v}</p>
                  {m.d && <p className="text-[6.5px] font-semibold text-emerald-300">{m.d}</p>}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-1 rounded-[5px] border border-reps-orange/30 bg-reps-orange/10 px-1.5 py-1">
              <Trophy className="size-2.5 text-reps-orange" />
              <p className="text-[7px] font-semibold text-white">New PB · Back squat 130 kg</p>
            </div>
          </div>
        )}

        <p className="absolute bottom-1.5 left-3 right-3 text-center text-[6.5px] text-white/40">
          Opens in browser via magic link — no app install required.
        </p>
      </div>
    </MockShell>
  );
}

// =============================================================================
// 9. ACCOUNTABILITY — scenario triggers a flag in the inbox
// =============================================================================

const ACC_SCENARIOS = [
  {
    id: "overdue",
    label: "Check-in overdue",
    flag: {
      icon: Bell,
      title: "Check-in overdue · Daisy Wu",
      body: "14 days since last submission. Send a nudge or pause programme?",
      cta: "Send nudge",
    },
  },
  {
    id: "low",
    label: "Low adherence",
    flag: {
      icon: HeartPulse,
      title: "Low adherence · Ben Owusu",
      body: "Only 50% sessions completed this block. Review and re-plan?",
      cta: "Open programme",
    },
  },
  {
    id: "quiet",
    label: "Quiet client",
    flag: {
      icon: MessageSquare,
      title: "Quiet client · Tom Reid",
      body: "No app activity in 10 days. Suggested: voice note check-in.",
      cta: "Open chat",
    },
  },
  {
    id: "milestone",
    label: "Milestone hit",
    flag: {
      icon: Trophy,
      title: "Milestone · James Carter",
      body: "Hit 130 kg back squat — a +20 kg PB. Worth celebrating today.",
      cta: "Send celebration",
    },
  },
  {
    id: "ending",
    label: "Programme ending",
    flag: {
      icon: Timer,
      title: "Block ending · Priya Shah",
      body: "Hypertrophy block ends in 5 days. Time to plan the next block.",
      cta: "Plan next block",
    },
  },
] as const;
type AccId = (typeof ACC_SCENARIOS)[number]["id"];

export function AccountabilityMock({
  scenario,
  onChange,
}: {
  scenario: AccId;
  onChange: (id: AccId) => void;
}) {
  const active = ACC_SCENARIOS.find((s) => s.id === scenario) ?? ACC_SCENARIOS[0];
  const Icon = active.flag.icon;

  return (
    <MockShell
      label="Needs attention · today"
      states={ACC_SCENARIOS.map((s) => ({ id: s.id, label: s.label.split(" ")[0] }))}
      active={scenario}
      onChange={(id) => onChange(id as AccId)}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
              Needs attention · today
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">3 signals worth a response</p>
          </div>
          <span className="rounded-full bg-reps-orange/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-reps-orange">
            New
          </span>
        </div>

        {/* Featured flag */}
        <div className="mt-2.5 rounded-[8px] border border-reps-orange/30 bg-reps-orange/10 p-2">
          <div className="flex items-start gap-1.5">
            <Icon className="mt-0.5 size-3 shrink-0 text-reps-orange" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-white">{active.flag.title}</p>
              <p className="mt-0.5 text-[7.5px] text-white/75">{active.flag.body}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full bg-reps-orange px-2 py-[3px] text-[7px] font-bold text-white"
            >
              {active.flag.cta}
            </button>
          </div>
        </div>

        {/* Other flags list */}
        <div className="mt-2 space-y-1">
          {ACC_SCENARIOS.filter((s) => s.id !== scenario)
            .slice(0, 3)
            .map((s) => {
              const I = s.flag.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange(s.id)}
                  className="flex w-full items-center gap-1.5 rounded-[6px] border border-white/10 bg-reps-panel/40 px-2 py-1.5 text-left transition-colors hover:bg-reps-panel/60"
                >
                  <I className="size-2.5 shrink-0 text-reps-orange" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[7.5px] font-semibold text-white">{s.flag.title}</p>
                    <p className="truncate text-[6.5px] text-white/55">{s.flag.body}</p>
                  </div>
                  <span className="shrink-0 text-[6.5px] text-white/45">View</span>
                </button>
              );
            })}
        </div>
      </div>
    </MockShell>
  );
}

export { ACC_SCENARIOS };
export type { AccId };

// =============================================================================
// 10. AUTOMATIONS — Onboarding / Re-engagement / Reminders
// =============================================================================

const AUTO_STATES = [
  { id: "onb", label: "Onboarding" },
  { id: "reeng", label: "Re-engage" },
  { id: "rem", label: "Reminders" },
] as const;
type AutoState = (typeof AUTO_STATES)[number]["id"];

const AUTO_FLOWS: Record<AutoState, { trigger: string; steps: { i: typeof Mail; l: string; w: string }[] }> = {
  onb: {
    trigger: "Trigger · new client added to roster",
    steps: [
      { i: Mail, l: "Welcome email + screening form", w: "Immediately" },
      { i: Calendar, l: "Book your first session", w: "+ 1 hour" },
      { i: FileText, l: "Goals & expectations doc", w: "+ 1 day" },
      { i: Video, l: "How to use your client portal", w: "+ 2 days" },
      { i: HeartPulse, l: "First check-in form", w: "+ 7 days" },
    ],
  },
  reeng: {
    trigger: "Trigger · no app activity for 10 days",
    steps: [
      { i: MessageSquare, l: "Gentle check-in message from coach", w: "Day 10" },
      { i: Mail, l: "Personal email: how can I help?", w: "Day 14" },
      { i: Calendar, l: "Offer a free reset call", w: "Day 21" },
      { i: Bell, l: "Flag for human follow-up", w: "Day 28" },
    ],
  },
  rem: {
    trigger: "Trigger · scheduled per client",
    steps: [
      { i: Bell, l: "Session reminder · 24h before", w: "Daily" },
      { i: HeartPulse, l: "Weekly check-in due", w: "Sundays" },
      { i: Camera, l: "Progress photo prompt", w: "Every 4 weeks" },
      { i: Award, l: "Milestone celebration", w: "On PB" },
    ],
  },
};

export function AutomationsMock() {
  const [state, setState] = useState<AutoState>("onb");
  const f = AUTO_FLOWS[state];

  return (
    <MockShell
      label="Automations"
      states={AUTO_STATES}
      active={state}
      onChange={setState}
    >
      <div className="h-full overflow-hidden p-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-reps-orange">
              {f.trigger}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white">
              Pre-built sequence · editable per client
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-emerald-300">
            <span className="size-1 rounded-full bg-emerald-300" /> Active
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          {f.steps.map((s, i) => (
            <div key={s.l} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="flex size-5 items-center justify-center rounded-full border border-reps-orange/40 bg-reps-orange/15 text-[7px] font-bold text-reps-orange">
                  {i + 1}
                </div>
                {i < f.steps.length - 1 && <div className="h-2 w-px bg-white/15" />}
              </div>
              <div className="flex flex-1 items-center justify-between rounded-[6px] border border-white/10 bg-reps-panel/40 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <s.i className="size-2.5 text-reps-orange" />
                  <p className="text-[8px] font-semibold text-white">{s.l}</p>
                </div>
                <span className="rounded-full bg-white/5 px-1.5 py-[2px] text-[6.5px] font-medium text-white/65">
                  {s.w}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-2 text-[7px] text-white/45">
          You write the messages once. Edit per client before they go out — no spray-and-pray.
        </p>
      </div>
    </MockShell>
  );
}

// =============================================================================
// 11. AI ASSIST mock — programme draft + check-in summary
// =============================================================================

export function AiAssistMock() {
  return (
    <MockupStage variant="laptop">
      <div className="relative w-full max-w-full overflow-hidden">
        <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-reps-panel shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
          <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-reps-ink/80 px-3">
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
            <span className="ml-3 inline-flex items-center gap-1 text-[10px] font-medium text-white/55">
              <Sparkles className="size-3 text-reps-orange" /> AI assist · review before sending
            </span>
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-reps-ink p-3 text-left">
            <div className="grid h-full grid-cols-2 gap-2">
              <div className="rounded-[6px] border border-reps-orange/30 bg-reps-orange/5 p-2">
                <p className="text-[7.5px] font-semibold uppercase tracking-wider text-reps-orange">
                  Programme draft · Hypertrophy block
                </p>
                <p className="mt-1 text-[8px] text-white/80">
                  Based on James's goals, screening notes and last block's progress, here's a draft Week 1:
                </p>
                <div className="mt-1.5 space-y-1">
                  {[
                    "Mon · Lower (squat focus)",
                    "Tue · Upper push + carries",
                    "Wed · Rest / mobility",
                    "Thu · Lower (hinge focus)",
                    "Fri · Upper pull",
                  ].map((l) => (
                    <p key={l} className="text-[7.5px] text-white/70">
                      · {l}
                    </p>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-1">
                  <button className="rounded-full bg-reps-orange px-2 py-[3px] text-[7px] font-bold text-white">
                    Accept draft
                  </button>
                  <button className="rounded-full border border-white/20 px-2 py-[3px] text-[7px] font-semibold text-white/85">
                    Edit
                  </button>
                </div>
              </div>
              <div className="rounded-[6px] border border-white/10 bg-reps-panel/40 p-2">
                <p className="text-[7.5px] font-semibold uppercase tracking-wider text-white/55">
                  Check-in summary · 14 clients
                </p>
                <div className="mt-1.5 space-y-1">
                  {[
                    { l: "On track", v: "9", c: "emerald" },
                    { l: "Worth a reply", v: "3", c: "orange" },
                    { l: "Need attention", v: "2", c: "white" },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="flex items-center justify-between rounded-[5px] border border-white/5 bg-reps-ink/40 px-2 py-1"
                    >
                      <p className="text-[8px] text-white/80">{m.l}</p>
                      <span
                        className={`text-[9px] font-bold ${
                          m.c === "emerald"
                            ? "text-emerald-300"
                            : m.c === "orange"
                            ? "text-reps-orange"
                            : "text-white"
                        }`}
                      >
                        {m.v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-[5px] border border-reps-orange/30 bg-reps-orange/10 p-1.5">
                  <p className="text-[7px] font-semibold text-reps-orange">Suggested reply · Daisy</p>
                  <p className="mt-0.5 text-[7.5px] text-white/80">
                    "Saw you missed two sessions — anything I can shift to fit your week?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mx-auto h-2 w-[106%] -translate-x-[3%] rounded-b-[10px] bg-gradient-to-b from-white/15 to-white/5" />
        <div className="mx-auto h-1 w-[88%] rounded-b-[8px] bg-black/40" />
      </div>
    </MockupStage>
  );
}
