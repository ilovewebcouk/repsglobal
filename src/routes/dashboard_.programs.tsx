import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Copy,
  CreditCard,
  Dumbbell,
  FileText,
  Filter,
  GraduationCap,
  GripVertical,
  LayoutDashboard,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";

export const Route = createFileRoute("/dashboard_/programs")({
  head: () => ({
    meta: [
      { title: "Programme Builder — REPs Professional" },
      {
        name: "description",
        content:
          "Create, structure and assign professional training programmes from your REPs dashboard.",
      },
      { property: "og:title", content: "Programme Builder — REPs Professional" },
      {
        property: "og:description",
        content: "Create, structure and assign professional training programmes.",
      },
    ],
    links: [{ rel: "canonical", href: "/dashboard/programs" }],
  }),
  component: ProgramsPage,
});

/* ============================================================
   SIDEBAR
   ============================================================ */

type NavItem = {
  icon: LucideIcon;
  label: string;
  to?: string;
  badge?: string;
  active?: boolean;
};

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Users, label: "Clients" },
  { icon: CalendarIcon, label: "Calendar", to: "/dashboard/calendar" },
  { icon: Dumbbell, label: "Programs", active: true },
  { icon: Apple, label: "Nutrition" },
  { icon: ClipboardList, label: "Check-Ins" },
  { icon: MessagesSquare, label: "Messages", badge: "6" },
  { icon: Target, label: "Leads", to: "/dashboard/leads" },
  { icon: CreditCard, label: "Payments" },
  { icon: AreaChart, label: "Reports" },
  { icon: FileText, label: "Content Studio" },
  { icon: GraduationCap, label: "Education & CPD" },
  { icon: Users, label: "Community" },
  { icon: Wrench, label: "Business Tools" },
  { icon: Settings, label: "Settings" },
];

function Sidebar() {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-reps-border bg-reps-midnight lg:flex">
      <Link to="/" className="flex items-center gap-3 px-5 pb-6 pt-6">
        <span className="font-display text-[26px] font-bold leading-none tracking-tight text-white">
          REPs
        </span>
        <span className="border-l border-white/15 pl-3 text-[10px] leading-tight text-white/65">
          The Register of
          <br />
          Exercise Professionals
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const content = (
              <>
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            const base =
              "flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors";
            const cls = item.active
              ? `${base} bg-reps-orange-soft text-reps-orange`
              : `${base} text-white/70 hover:bg-reps-panel hover:text-white`;
            return (
              <li key={item.label}>
                {item.to ? (
                  <Link to={item.to} className={cls}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={cls}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-3 px-3 pb-5">
        <div className="flex items-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-3">
          <img
            src={proJames}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">
              James Carter
            </div>
            <div className="truncate text-[11px] text-white/55">
              Personal Trainer
            </div>
            <span className="mt-1 inline-flex h-4 items-center rounded-full bg-reps-orange-soft px-2 text-[10px] font-semibold text-reps-orange">
              REPs Level 3
            </span>
          </div>
        </div>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft text-[13px] font-semibold text-reps-orange shadow-none transition-colors hover:bg-reps-orange/15"
        >
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   TOP BAR
   ============================================================ */

function TopBar() {
  return (
    <header className="flex items-center justify-between gap-6 px-8 pt-7">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-bold leading-tight text-white">
          Programme builder
        </h1>
        <p className="mt-0.5 text-[13px] text-white/55">
          Create, structure and assign professional training programmes.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-[220px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel px-3 text-[13px] text-white/55 md:flex">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search…</span>
          <kbd className="rounded-[6px] border border-reps-border bg-reps-ink px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
            ⌘K
          </kbd>
        </div>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-4 text-[13px] font-semibold text-reps-orange shadow-none transition-colors hover:bg-reps-orange/15"
        >
          <Sparkles className="h-4 w-4" />
          Use AI draft
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          <Plus className="h-4 w-4" />
          New programme
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
        >
          <Save className="h-4 w-4" />
          Save programme
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel text-white/70 shadow-none transition-colors hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-reps-orange px-1 text-[9px] font-semibold text-white">
            12
          </span>
        </button>
        <img
          src={proJames}
          alt=""
          className="h-10 w-10 rounded-full object-cover ring-2 ring-reps-border"
        />
      </div>
    </header>
  );
}

/* ============================================================
   PRIMITIVES
   ============================================================ */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[16px] border border-reps-border bg-reps-panel p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-reps-border bg-reps-panel ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[15px] font-semibold text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-white/55">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function GhostButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex h-9 items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3.5 text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   PROGRAMME SELECTOR ROW
   ============================================================ */

function ProgrammeSelectorRow() {
  return (
    <Panel className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] font-semibold text-white"
        >
          <Dumbbell className="h-4 w-4 text-reps-orange" />
          Fat Loss Phase 2
          <ChevronDown className="h-4 w-4 text-white/55" />
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] font-medium text-white/85"
        >
          <img src={proJames} alt="" className="h-6 w-6 rounded-full object-cover" />
          Sarah Johnson
          <ChevronDown className="h-4 w-4 text-white/55" />
        </button>
        <span className="inline-flex h-7 items-center rounded-full bg-[#1f7a4d]/20 px-3 text-[11px] font-semibold text-[#4ade80]">
          Active
        </span>
        <div className="h-6 w-px bg-reps-border" />
        <Meta label="Duration" value="12 weeks" />
        <Meta label="Current week" value="Week 5" />
        <Meta label="Goal" value="Fat loss and strength retention" />
      </div>
    </Panel>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10.5px] font-medium uppercase tracking-wide text-white/45">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-white">{value}</span>
    </div>
  );
}

/* ============================================================
   TABS
   ============================================================ */

const TABS = ["Overview", "Builder", "Clients", "Progress", "Settings"];

function Tabs() {
  return (
    <div className="flex items-center gap-1 border-b border-reps-border">
      {TABS.map((t) => {
        const active = t === "Builder";
        return (
          <button
            key={t}
            type="button"
            className={`-mb-px flex h-10 items-center border-b-2 px-4 text-[13px] font-semibold transition-colors ${
              active
                ? "border-reps-orange text-white"
                : "border-transparent text-white/55 hover:text-white"
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   PROGRAMME STRUCTURE (LEFT)
   ============================================================ */

type WeekStatus = "Completed" | "Active" | "Scheduled";

const WEEKS: { num: number; label: string; status: WeekStatus }[] = [
  { num: 1, label: "Foundation", status: "Completed" },
  { num: 2, label: "Build", status: "Completed" },
  { num: 3, label: "Strength", status: "Completed" },
  { num: 4, label: "Progression", status: "Completed" },
  { num: 5, label: "Current", status: "Active" },
  { num: 6, label: "Progression", status: "Scheduled" },
  { num: 7, label: "Deload", status: "Scheduled" },
  { num: 8, label: "Rebuild", status: "Scheduled" },
];

function StatusPill({ status }: { status: WeekStatus }) {
  const cls =
    status === "Active"
      ? "bg-reps-orange-soft text-reps-orange"
      : status === "Completed"
        ? "bg-[#1f7a4d]/20 text-[#4ade80]"
        : "bg-white/5 text-white/55";
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

function ProgrammeStructure() {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Programme structure"
        subtitle="12-week plan"
        right={
          <button
            type="button"
            aria-label="More"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        }
      />
      <ul className="space-y-2">
        {WEEKS.map((w) => {
          const active = w.status === "Active";
          return (
            <li
              key={w.num}
              className={`group flex items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors ${
                active
                  ? "border-reps-orange-border bg-reps-orange-soft"
                  : "border-reps-border bg-reps-panel-soft hover:border-white/15"
              }`}
            >
              <GripVertical className="h-4 w-4 text-white/35" />
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[13px] font-semibold ${active ? "text-white" : "text-white"}`}
                >
                  Week {w.num}
                </div>
                <div className="text-[11.5px] text-white/55">{w.label}</div>
              </div>
              <StatusPill status={w.status} />
            </li>
          );
        })}
      </ul>
      <div className="mt-4 grid grid-cols-1 gap-2">
        <GhostButton>
          <Plus className="h-4 w-4" />
          Add week
        </GhostButton>
        <GhostButton>
          <Copy className="h-4 w-4" />
          Duplicate week
        </GhostButton>
        <GhostButton>
          <Dumbbell className="h-4 w-4" />
          Add deload
        </GhostButton>
      </div>
    </Panel>
  );
}

/* ============================================================
   BUILDER (CENTER) — Workouts & exercises
   ============================================================ */

type Exercise = {
  name: string;
  spec: string;
  rpe?: string;
  rest?: string;
};

type Workout = {
  title: string;
  exercises: Exercise[];
};

const WORKOUTS: Workout[] = [
  {
    title: "Day 1 — Lower body strength",
    exercises: [
      { name: "Back Squat", spec: "4 × 6", rpe: "RPE 7", rest: "150s" },
      { name: "Romanian Deadlift", spec: "3 × 8", rpe: "RPE 7", rest: "120s" },
      { name: "Walking Lunge", spec: "3 × 12 steps", rest: "90s" },
      { name: "Leg Curl", spec: "3 × 12", rest: "75s" },
    ],
  },
  {
    title: "Day 2 — Upper body strength",
    exercises: [
      { name: "Bench Press", spec: "4 × 6", rpe: "RPE 7", rest: "150s" },
      { name: "Pull-Up", spec: "4 × 6", rest: "120s" },
      { name: "Seated Row", spec: "3 × 10", rest: "90s" },
      { name: "Dumbbell Shoulder Press", spec: "3 × 10", rest: "90s" },
    ],
  },
  {
    title: "Day 3 — Conditioning",
    exercises: [
      { name: "Bike Intervals", spec: "10 rounds", rpe: "30s hard / 90s easy" },
      { name: "Sled Push", spec: "6 rounds", rpe: "20 metres" },
      { name: "Farmer Carry", spec: "4 rounds", rpe: "40 metres" },
    ],
  },
  {
    title: "Day 4 — Full body",
    exercises: [
      { name: "Trap Bar Deadlift", spec: "4 × 5", rpe: "RPE 7" },
      { name: "Incline Dumbbell Press", spec: "3 × 10" },
      { name: "Lat Pulldown", spec: "3 × 10" },
      { name: "Plank", spec: "3 × 45s" },
    ],
  },
];

function ExerciseRow({ ex }: { ex: Exercise }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-[12px] border border-reps-border bg-reps-ink/40 px-3 py-2.5 transition-colors hover:border-white/15">
      <div className="col-span-5 flex items-center gap-2 min-w-0">
        <GripVertical className="h-4 w-4 shrink-0 text-white/35" />
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-reps-panel-soft text-white/55">
          <Dumbbell className="h-4 w-4" />
        </div>
        <span className="truncate text-[13px] font-semibold text-white">
          {ex.name}
        </span>
      </div>
      <div className="col-span-2 text-[12.5px] font-medium text-white/85">
        {ex.spec}
      </div>
      <div className="col-span-2 text-[12px] text-white/65">{ex.rpe ?? "—"}</div>
      <div className="col-span-2 text-[12px] text-white/65">
        {ex.rest ? `Rest ${ex.rest}` : "—"}
      </div>
      <div className="col-span-1 flex items-center justify-end gap-1">
        <button
          type="button"
          aria-label="Edit"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-reps-panel-soft hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="More"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-reps-panel-soft hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function WorkoutCard({ w }: { w: Workout }) {
  return (
    <div className="rounded-[16px] border border-reps-border bg-reps-panel-soft p-4 transition-colors hover:border-white/15">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-white/35" />
          <h3 className="font-display text-[14px] font-semibold text-white">
            {w.title}
          </h3>
          <span className="inline-flex h-5 items-center rounded-full bg-white/5 px-2 text-[10px] font-semibold text-white/65">
            {w.exercises.length} exercises
          </span>
        </div>
        <div className="flex items-center gap-1">
          <GhostButton className="h-8 px-2.5 text-[11.5px]">
            <Plus className="h-3.5 w-3.5" />
            Add exercise
          </GhostButton>
          <button
            type="button"
            aria-label="More"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-reps-ink/40 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {w.exercises.map((ex) => (
          <ExerciseRow key={ex.name} ex={ex} />
        ))}
      </div>
    </div>
  );
}

function BuilderPanel() {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Week 5 — Strength retention"
        subtitle="Maintain strength while in a calorie deficit"
        right={
          <div className="flex items-center gap-2">
            <GhostButton>
              <Copy className="h-4 w-4" />
              Duplicate workout
            </GhostButton>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-3.5 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
            >
              <Plus className="h-4 w-4" />
              Add workout
            </button>
          </div>
        }
      />
      <div className="space-y-4">
        {WORKOUTS.map((w) => (
          <WorkoutCard key={w.title} w={w} />
        ))}
      </div>
    </Panel>
  );
}

/* ============================================================
   RIGHT SIDEBAR CARDS
   ============================================================ */

const LIBRARY_CATEGORIES = ["All", "Strength", "Conditioning", "Mobility", "Core"];

const LIBRARY_ITEMS: { name: string; category: string }[] = [
  { name: "Back Squat", category: "Strength" },
  { name: "Bench Press", category: "Strength" },
  { name: "Romanian Deadlift", category: "Strength" },
  { name: "Pull-Up", category: "Strength" },
  { name: "Walking Lunge", category: "Strength" },
  { name: "Bike Intervals", category: "Conditioning" },
  { name: "Sled Push", category: "Conditioning" },
  { name: "Plank", category: "Core" },
];

function ExerciseLibraryCard() {
  return (
    <Card>
      <SectionHeader
        title="Exercise library"
        right={
          <button
            type="button"
            aria-label="Filter"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:text-white"
          >
            <Filter className="h-4 w-4" />
          </button>
        }
      />
      <div className="flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] text-white/55">
        <Search className="h-4 w-4" />
        <span className="flex-1">Search exercises…</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {LIBRARY_CATEGORIES.map((c, i) => {
          const active = i === 0;
          return (
            <button
              key={c}
              type="button"
              className={`flex h-7 items-center rounded-full px-3 text-[11.5px] font-semibold transition-colors ${
                active
                  ? "bg-reps-orange-soft text-reps-orange"
                  : "border border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      <ul className="mt-3 space-y-1.5">
        {LIBRARY_ITEMS.map((ex) => (
          <li
            key={ex.name}
            className="flex items-center gap-3 rounded-[10px] border border-reps-border bg-reps-panel-soft p-2 transition-colors hover:border-white/15"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-reps-ink/60 text-white/55">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-white">
                {ex.name}
              </div>
              <div className="text-[10.5px] text-white/55">{ex.category}</div>
            </div>
            <button
              type="button"
              aria-label="Add"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-reps-orange-border bg-reps-orange-soft text-reps-orange hover:bg-reps-orange/15"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">View all exercises</GhostButton>
    </Card>
  );
}

function ClientAssignmentCard() {
  const rows = [
    ["Assigned client", "Sarah Johnson"],
    ["Programme", "Fat Loss Phase 2"],
    ["Start date", "22 April 2025"],
    ["End date", "14 July 2025"],
    ["Current week", "5 of 12"],
  ];
  return (
    <Card>
      <SectionHeader title="Client assignment" />
      <div className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3">
        <img
          src={proJames}
          alt=""
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">
            Sarah Johnson
          </div>
          <div className="truncate text-[11px] text-white/55">
            Fat Loss Phase 2
          </div>
        </div>
        <span className="inline-flex h-5 items-center rounded-full bg-[#1f7a4d]/20 px-2 text-[10px] font-semibold text-[#4ade80]">
          Active
        </span>
      </div>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-[12px]">
            <dt className="text-white/55">{k}</dt>
            <dd className="font-semibold text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11.5px]">
          <span className="text-white/55">Completion</span>
          <span className="font-semibold text-white">68%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-reps-orange" style={{ width: "68%" }} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <GhostButton>
          <Users className="h-4 w-4" />
          Assign client
        </GhostButton>
        <GhostButton>
          <MessagesSquare className="h-4 w-4" />
          Send update
        </GhostButton>
      </div>
    </Card>
  );
}

function TrendLine() {
  return (
    <svg viewBox="0 0 240 56" className="h-14 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="prog-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,40 L30,34 L60,38 L90,28 L120,30 L150,22 L180,26 L210,18 L240,20 L240,56 L0,56 Z"
        fill="url(#prog-grad)"
      />
      <path
        d="M0,40 L30,34 L60,38 L90,28 L120,30 L150,22 L180,26 L210,18 L240,20"
        stroke="var(--reps-orange)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgrammePerformanceCard() {
  const metrics = [
    ["Workout completion", "84%"],
    ["Average RPE", "7.2"],
    ["Missed sessions", "2"],
    ["Strength trend", "Stable"],
    ["Adherence", "85%"],
  ];
  return (
    <Card>
      <SectionHeader
        title="Programme performance"
        right={
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4ade80]">
            <TrendingUp className="h-3.5 w-3.5" />
            On track
          </span>
        }
      />
      <TrendLine />
      <dl className="mt-3 space-y-2">
        {metrics.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-[12px]">
            <dt className="text-white/55">{k}</dt>
            <dd className="font-semibold text-white">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function AIInsightCard() {
  return (
    <section className="rounded-[16px] border border-reps-orange-border bg-gradient-to-br from-reps-orange-soft to-reps-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-reps-orange/20 text-reps-orange">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-[14px] font-semibold text-white">
            AI programme insight
          </h2>
          <div className="text-[10.5px] text-white/55">Updated just now</div>
        </div>
      </div>
      <p className="text-[12.5px] leading-relaxed text-white/85">
        Sarah is maintaining strength well during the fat loss phase. Keep
        lower-body volume stable this week and avoid increasing conditioning
        until sleep improves.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <GhostButton>Review suggestion</GhostButton>
        <button
          type="button"
          className="flex h-9 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-3.5 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
        >
          Draft next week
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   LOWER SECTION — Templates, recent changes, feedback
   ============================================================ */

function TemplatesCard() {
  const items = [
    "12-week fat loss",
    "Strength foundation",
    "Beginner gym confidence",
    "Hypertrophy phase",
    "Return to training",
  ];
  return (
    <Card>
      <SectionHeader title="Programme templates" />
      <ul className="space-y-2">
        {items.map((t) => (
          <li
            key={t}
            className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2.5"
          >
            <span className="text-[12.5px] font-semibold text-white">{t}</span>
            <button
              type="button"
              className="text-[11.5px] font-semibold text-reps-orange hover:underline"
            >
              Use
            </button>
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">Browse templates</GhostButton>
    </Card>
  );
}

function RecentChangesCard() {
  const items = [
    "Added conditioning workout to Week 5",
    "Reduced squat volume by 1 set",
    "Updated nutrition note for Sarah",
    "Added deload week to Week 7",
  ];
  return (
    <Card>
      <SectionHeader title="Recent programme changes" />
      <ul className="space-y-3">
        {items.map((t, i) => (
          <li key={t} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-white">{t}</div>
              <div className="text-[10.5px] text-white/45">
                {["Today, 09:42", "Yesterday, 17:10", "Mon, 11:25", "Sun, 19:02"][i]}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">View history</GhostButton>
    </Card>
  );
}

function ClientFeedbackCard() {
  const items = [
    { t: "Lower body session felt strong", tag: "Workout" },
    { t: "Energy good this week", tag: "Wellbeing" },
    { t: "Sleep slightly down", tag: "Recovery" },
    { t: "Conditioning felt manageable", tag: "Workout" },
  ];
  return (
    <Card>
      <SectionHeader title="Client feedback" />
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.t}
            className="flex items-start gap-3 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2.5"
          >
            <img
              src={proJames}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-white">{it.t}</div>
              <span className="mt-1 inline-flex h-5 items-center rounded-full bg-white/5 px-2 text-[10px] font-semibold text-white/65">
                {it.tag}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">Open check-ins</GhostButton>
    </Card>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function ProgramsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar />
          <div className="space-y-5 px-8 pb-10 pt-6">
            <ProgrammeSelectorRow />
            <Tabs />

            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 xl:col-span-3">
                <ProgrammeStructure />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <BuilderPanel />
              </div>
              <div className="col-span-12 space-y-5 xl:col-span-3">
                <ExerciseLibraryCard />
                <ClientAssignmentCard />
                <ProgrammePerformanceCard />
                <AIInsightCard />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <TemplatesCard />
              <RecentChangesCard />
              <ClientFeedbackCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
