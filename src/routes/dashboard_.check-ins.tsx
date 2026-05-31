import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  ArrowUpRight,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Download,
  Dumbbell,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";

export const Route = createFileRoute("/dashboard_/check-ins")({
  head: () => ({
    meta: [
      { title: "Check-ins — REPs Professional" },
      {
        name: "description",
        content:
          "Review client check-ins, track adherence and respond with clear next steps from your REPs professional dashboard.",
      },
      { property: "og:title", content: "Check-ins — REPs Professional" },
      {
        property: "og:description",
        content:
          "Review client check-ins, track adherence and respond with clear next steps.",
      },
      { property: "og:url", content: "/dashboard/check-ins" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/check-ins" }],
  }),
  component: CheckInsReviewPage,
});

/* ============================================================
   SIDEBAR — Check-ins active
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
  { icon: Dumbbell, label: "Programs", to: "/dashboard/programs" },
  { icon: Apple, label: "Nutrition" },
  { icon: ClipboardList, label: "Check-ins", active: true, badge: "8" },
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
          Check-ins
        </h1>
        <p className="mt-0.5 text-[13px] text-white/55">
          Review client updates, track adherence and respond with clear next steps.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-[240px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel px-3 text-[13px] text-white/55 md:flex">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search…</span>
          <kbd className="rounded-[6px] border border-reps-border bg-reps-ink px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
            ⌘K
          </kbd>
        </div>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          <FileText className="h-4 w-4" />
          Create template
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
        >
          <Send className="h-4 w-4" />
          Send check-in
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          <Download className="h-4 w-4" />
          Export
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
      className={`flex h-10 items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover ${className}`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   KPI ROW
   ============================================================ */

const KPIS = [
  { label: "Due today", value: "8", hint: "Needs review" },
  { label: "Submitted", value: "24", hint: "This week" },
  { label: "Reviewed", value: "19", hint: "79% complete" },
  { label: "At risk", value: "3", hint: "Requires action", danger: true },
  {
    label: "Average adherence",
    value: "87%",
    hint: "+5% this month",
    positive: true,
  },
  { label: "Response time", value: "4.2 hrs", hint: "Average" },
];

function KpiRow() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {KPIS.map((k) => (
        <div
          key={k.label}
          className="rounded-[16px] border border-reps-border bg-reps-panel p-4"
        >
          <div className="text-[11.5px] font-medium uppercase tracking-wide text-white/55">
            {k.label}
          </div>
          <div className="mt-2 font-display text-[24px] font-bold leading-none text-white">
            {k.value}
          </div>
          <div
            className={`mt-2 text-[11.5px] font-medium ${
              k.danger
                ? "text-red-400"
                : k.positive
                  ? "text-emerald-400"
                  : "text-white/55"
            }`}
          >
            {k.hint}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   INBOX (LEFT)
   ============================================================ */

type Status = "Needs review" | "At risk" | "Overdue" | "Reviewed";
type Priority = "High" | "Medium" | "Low";

const INBOX_FILTERS = [
  "All",
  "Due today",
  "Submitted",
  "Needs review",
  "At risk",
  "Reviewed",
];

const INBOX: {
  name: string;
  initials: string;
  meta: string;
  programme: string;
  adherence: string;
  status: Status;
  priority: Priority;
  selected?: boolean;
}[] = [
  {
    name: "Sarah Johnson",
    initials: "SJ",
    meta: "Submitted yesterday",
    programme: "Fat Loss Phase 2",
    adherence: "85%",
    status: "Needs review",
    priority: "Medium",
    selected: true,
  },
  {
    name: "Mike Evans",
    initials: "ME",
    meta: "Submitted 2h ago",
    programme: "Strength Foundation",
    adherence: "58%",
    status: "At risk",
    priority: "High",
  },
  {
    name: "Emma Wilson",
    initials: "EW",
    meta: "Submitted today",
    programme: "Online Coaching",
    adherence: "92%",
    status: "Needs review",
    priority: "Low",
  },
  {
    name: "David Lee",
    initials: "DL",
    meta: "Due today",
    programme: "Muscle Building Phase",
    adherence: "—",
    status: "Overdue",
    priority: "High",
  },
  {
    name: "Olivia Taylor",
    initials: "OT",
    meta: "Submitted yesterday",
    programme: "Pilates & Mobility",
    adherence: "88%",
    status: "Reviewed",
    priority: "Low",
  },
  {
    name: "James Smith",
    initials: "JS",
    meta: "Submitted today",
    programme: "Beginner Fitness",
    adherence: "74%",
    status: "Needs review",
    priority: "Medium",
  },
];

function statusBadge(s: Status) {
  const map: Record<Status, string> = {
    "Needs review": "bg-reps-orange-soft text-reps-orange",
    "At risk": "bg-red-500/15 text-red-300",
    Overdue: "bg-red-500/15 text-red-300",
    Reviewed: "bg-emerald-500/15 text-emerald-300",
  };
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${map[s]}`}
    >
      {s}
    </span>
  );
}

function priorityDot(p: Priority) {
  const map: Record<Priority, string> = {
    High: "bg-red-400",
    Medium: "bg-reps-orange",
    Low: "bg-white/30",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-white/55">
      <span className={`h-1.5 w-1.5 rounded-full ${map[p]}`} />
      {p}
    </span>
  );
}

function Inbox() {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">
          Check-in inbox
        </h2>
        <button
          type="button"
          aria-label="More"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-reps-panel-soft hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-3 flex h-10 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white/55">
        <Search className="h-4 w-4" />
        <input
          aria-label="Search clients"
          placeholder="Search clients..."
          className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {INBOX_FILTERS.map((f, i) => (
          <button
            key={f}
            type="button"
            className={`h-7 rounded-full px-3 text-[11px] font-semibold shadow-none transition-colors ${
              i === 0
                ? "bg-reps-orange text-white"
                : "border border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <ul className="space-y-1.5">
        {INBOX.map((c) => (
          <li key={c.name}>
            <button
              type="button"
              className={`group flex w-full items-start gap-3 rounded-[12px] border px-3 py-3 text-left transition-colors ${
                c.selected
                  ? "border-reps-orange-border bg-reps-orange-soft/40"
                  : "border-reps-border bg-reps-panel-soft hover:border-white/15 hover:bg-reps-panel"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                  c.selected
                    ? "bg-reps-orange text-white"
                    : "bg-reps-ink text-white/75"
                }`}
              >
                {c.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-white">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-white/45">
                    {c.meta}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11.5px] text-white/55">
                  {c.programme}
                </span>
                <span className="mt-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {statusBadge(c.status)}
                    {priorityDot(c.priority)}
                  </span>
                  <span className="text-[11px] font-semibold text-white/75">
                    {c.adherence}
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ============================================================
   CENTRE — SARAH JOHNSON REVIEW
   ============================================================ */

function ReviewHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-reps-border p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-reps-orange text-[14px] font-semibold text-white">
          SJ
        </span>
        <div>
          <div className="font-display text-[18px] font-semibold text-white">
            Sarah Johnson — Weekly check-in
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/55">
            <span>Programme: Fat Loss Phase 2</span>
            <span className="text-white/25">•</span>
            <span>Week 5 of 12</span>
            <span className="text-white/25">•</span>
            <span>Submitted: Yesterday, 20:14</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 items-center rounded-full bg-reps-orange-soft px-2.5 text-[10.5px] font-semibold text-reps-orange">
          Needs review
        </span>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-reps-border bg-reps-panel-soft px-2.5 text-[10.5px] font-semibold text-white/75">
          <span className="h-1.5 w-1.5 rounded-full bg-reps-orange" />
          Medium priority
        </span>
      </div>
    </div>
  );
}

const SCORE_TILES = [
  { label: "Adherence", value: "85%" },
  { label: "Energy", value: "4 / 5" },
  { label: "Sleep", value: "7 hrs" },
  { label: "Stress", value: "Mild" },
];

function ScoreSummary() {
  return (
    <div className="grid grid-cols-2 gap-3 px-5 pt-5 md:grid-cols-4">
      {SCORE_TILES.map((t) => (
        <div
          key={t.label}
          className="rounded-[12px] border border-reps-border bg-reps-panel-soft px-4 py-3"
        >
          <div className="text-[11px] font-medium uppercase tracking-wide text-white/55">
            {t.label}
          </div>
          <div className="mt-1 font-display text-[20px] font-bold text-white">
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}

const QA = [
  {
    q: "How did training go this week?",
    a: "Training felt good overall. Lower body session was hard but manageable. I completed 3 out of 4 workouts and felt stronger on the upper body day.",
  },
  {
    q: "How was nutrition adherence?",
    a: "Mostly good. I tracked food on 5 days and stayed close to calories. Protein was slightly low on two days.",
  },
  {
    q: "How were sleep and recovery?",
    a: "Sleep was okay but not perfect. I had two late nights due to work and felt more tired during the conditioning session.",
  },
  {
    q: "Any issues, pain or concerns?",
    a: "No pain. Slight knee tightness after lunges but it settled quickly.",
  },
];

function Responses() {
  return (
    <div className="space-y-3 px-5 pt-5">
      {QA.map((item) => (
        <div
          key={item.q}
          className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-4"
        >
          <div className="text-[12.5px] font-semibold text-white">
            {item.q}
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/70">
            {item.a}
          </p>
        </div>
      ))}
    </div>
  );
}

const METRICS = [
  { label: "Body weight", value: "74.8 kg" },
  { label: "Weekly change", value: "−0.4 kg", positive: true },
  { label: "Total change", value: "−4.2 kg", positive: true },
  { label: "Waist", value: "−1 cm this week", positive: true },
  { label: "Steps average", value: "8,900" },
  { label: "Workouts completed", value: "3 / 4" },
  { label: "Nutrition adherence", value: "82%" },
  { label: "Programme adherence", value: "85%" },
];

function ProgressMetrics() {
  return (
    <div className="px-5 pt-5">
      <div className="mb-3 text-[12.5px] font-semibold text-white">
        Progress metrics
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-reps-border bg-reps-border md:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-reps-panel-soft px-4 py-3">
            <div className="text-[10.5px] font-medium uppercase tracking-wide text-white/50">
              {m.label}
            </div>
            <div
              className={`mt-1 text-[14px] font-semibold ${
                m.positive ? "text-emerald-300" : "text-white"
              }`}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHART_TABS = ["Weight", "Adherence", "Sleep", "Steps"];

function ProgressChart() {
  // 11 weeks weight trend
  const points = [78.5, 78.1, 77.6, 77.0, 76.4, 75.9, 75.6, 75.4, 75.2, 74.9, 74.8];
  const w = 640;
  const h = 180;
  const pad = 16;
  const min = Math.min(...points) - 0.2;
  const max = Math.max(...points) + 0.2;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + ((max - p) / (max - min)) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0]},${h - pad} L${coords[0][0]},${h - pad} Z`;

  return (
    <div className="px-5 pb-5 pt-5">
      <div className="rounded-[16px] border border-reps-border bg-reps-ink p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[12.5px] font-semibold text-white">
              Progress chart
            </div>
            <div className="text-[11px] text-white/50">
              Last 11 weeks · Weight trend
            </div>
          </div>
          <div className="flex h-8 items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft p-1">
            {CHART_TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                className={`h-6 rounded-[8px] px-2.5 text-[11px] font-semibold shadow-none transition-colors ${
                  i === 0
                    ? "bg-reps-orange text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-[180px] w-full"
        >
          <defs>
            <linearGradient id="ciFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={pad}
              x2={w - pad}
              y1={pad + g * (h - pad * 2)}
              y2={pad + g * (h - pad * 2)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}
          <path d={area} fill="url(#ciFill)" />
          <path d={line} stroke="#FF7A00" strokeWidth={2} fill="none" />
          {coords.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.5} fill="#FF7A00" />
          ))}
        </svg>
      </div>
    </div>
  );
}

function ReviewPanel() {
  return (
    <Panel>
      <ReviewHeader />
      <ScoreSummary />
      <Responses />
      <ProgressMetrics />
      <ProgressChart />
    </Panel>
  );
}

/* ============================================================
   RIGHT STACK
   ============================================================ */

function AISummaryCard() {
  return (
    <section className="overflow-hidden rounded-[16px] border border-reps-orange-border bg-gradient-to-br from-reps-orange-soft to-reps-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-reps-orange text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-white">
            AI check-in summary
          </div>
          <div className="text-[10.5px] text-white/55">
            Generated · review before sending
          </div>
        </div>
      </div>
      <p className="text-[12.5px] leading-relaxed text-white/80">
        Sarah is progressing well. Weight is down 0.4 kg this week, adherence is
        strong and workouts are mostly complete. Sleep has dropped slightly, so
        avoid increasing training volume this week.
      </p>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/55">
        Suggested actions
      </div>
      <ul className="mt-2 space-y-1.5 text-[12px] text-white/75">
        {[
          "Keep calories stable",
          "Maintain current training volume",
          "Monitor knee tightness",
          "Reinforce protein target",
          "Review sleep next week",
        ].map((s) => (
          <li key={s} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <PrimaryButton className="flex-1">
          <Sparkles className="h-3.5 w-3.5" />
          Use summary
        </PrimaryButton>
        <GhostButton className="flex-1">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </GhostButton>
      </div>
    </section>
  );
}

function CoachResponseCard() {
  return (
    <Card>
      <SectionHeader
        title="Coach response"
        subtitle="Draft will be sent to Sarah"
      />
      <textarea
        rows={7}
        defaultValue={`Great work this week Sarah. Your consistency is strong and the 0.4kg drop is exactly where we want it. Keep calories steady, aim to hit protein more consistently and let's keep training volume the same this week while we monitor sleep and knee tightness.`}
        className="block w-full resize-none rounded-[12px] border border-reps-border bg-reps-ink p-3 text-[12.5px] leading-relaxed text-white placeholder:text-white/40 focus:border-reps-orange-border focus:outline-none focus:ring-2 focus:ring-reps-orange/30"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <PrimaryButton>
          <Send className="h-3.5 w-3.5" />
          Send
        </PrimaryButton>
        <GhostButton>Save draft</GhostButton>
        <GhostButton>
          <Plus className="h-3.5 w-3.5" />
          Add note
        </GhostButton>
      </div>
    </Card>
  );
}

const RISKS: { label: string; tone: "warn" | "danger" }[] = [
  { label: "Sleep lower than target", tone: "warn" },
  { label: "Protein below target on 2 days", tone: "warn" },
  { label: "Knee tightness reported", tone: "danger" },
  { label: "One missed workout", tone: "warn" },
];

function RiskIndicators() {
  return (
    <Card>
      <SectionHeader title="Risk indicators" />
      <ul className="space-y-2.5">
        {RISKS.map((r) => (
          <li
            key={r.label}
            className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                r.tone === "danger" ? "bg-red-400" : "bg-reps-orange"
              }`}
            />
            <span className="text-[12.5px] text-white/80">{r.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const NEXT_ACTIONS = [
  "Send check-in response",
  "Add knee note to client record",
  "Keep programme unchanged",
  "Review nutrition target",
  "Schedule next check-in",
];

function NextActions() {
  return (
    <Card>
      <SectionHeader title="Next actions" />
      <ul className="space-y-2">
        {NEXT_ACTIONS.map((a, i) => (
          <li
            key={a}
            className="flex items-center gap-3 rounded-[10px] px-2 py-1.5"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border ${
                i === 0
                  ? "border-reps-orange bg-reps-orange text-white"
                  : "border-reps-border bg-reps-panel-soft"
              }`}
            >
              {i === 0 ? <CheckCircle2 className="h-3 w-3" /> : null}
            </span>
            <span
              className={`text-[12.5px] ${
                i === 0 ? "text-white/55 line-through" : "text-white/85"
              }`}
            >
              {a}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ============================================================
   BOTTOM ROW
   ============================================================ */

const AT_RISK = [
  {
    name: "Mike Evans",
    detail: "Adherence 58% · Missed 3 sessions",
  },
  {
    name: "David Lee",
    detail: "Check-in overdue · No response",
  },
  {
    name: "Chloe Martin",
    detail: "Low recovery · Poor sleep",
  },
];

function AtRiskClients() {
  return (
    <Card>
      <SectionHeader
        title="At-risk clients"
        right={
          <span className="inline-flex h-6 items-center rounded-full bg-red-500/15 px-2 text-[10.5px] font-semibold text-red-300">
            3 flagged
          </span>
        }
      />
      <ul className="space-y-2">
        {AT_RISK.map((c) => (
          <li
            key={c.name}
            className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-ink text-[11px] font-semibold text-white/80">
              {c.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold text-white">
                {c.name}
              </div>
              <div className="truncate text-[11px] text-white/55">
                {c.detail}
              </div>
            </div>
            <Flame className="h-4 w-4 text-red-400" />
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">
        Review risk list
        <ArrowUpRight className="h-3.5 w-3.5" />
      </GhostButton>
    </Card>
  );
}

const TEMPLATES = [
  "Weekly coaching check-in",
  "Fat loss progress review",
  "Strength block review",
  "Online coaching check-in",
  "Injury/recovery update",
];

function Templates() {
  return (
    <Card>
      <SectionHeader title="Check-in templates" subtitle="Reusable across clients" />
      <ul className="space-y-1.5">
        {TEMPLATES.map((t, i) => (
          <li
            key={t}
            className="flex items-center justify-between gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-3.5 w-3.5 text-reps-orange" />
              <span className="text-[12.5px] font-medium text-white">{t}</span>
            </div>
            <span className="text-[10.5px] text-white/45">
              {i === 0 ? "Default" : "Custom"}
            </span>
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">
        Manage templates
        <ArrowUpRight className="h-3.5 w-3.5" />
      </GhostButton>
    </Card>
  );
}

function AdherenceTrends() {
  const points = [72, 76, 74, 79, 82, 84, 81, 86, 87];
  const w = 320;
  const h = 70;
  const pad = 4;
  const min = Math.min(...points) - 4;
  const max = Math.max(...points) + 2;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + ((max - p) / (max - min)) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");

  const stats = [
    { label: "Average adherence", value: "87%" },
    { label: "Check-in completion", value: "91%" },
    { label: "Response rate", value: "84%" },
    { label: "At-risk clients", value: "3" },
  ];
  return (
    <Card>
      <SectionHeader title="Adherence trends" subtitle="Last 9 weeks" />
      <div className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[70px] w-full">
          <path d={line} stroke="#FF7A00" strokeWidth={2} fill="none" />
        </svg>
      </div>
      <ul className="mt-3 space-y-2">
        {stats.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between text-[12.5px]"
          >
            <span className="text-white/60">{s.label}</span>
            <span className="font-semibold text-white">{s.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function CheckInsReviewPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar />
          <div className="space-y-5 px-8 pb-10 pt-6">
            <KpiRow />

            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 xl:col-span-3">
                <Inbox />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <ReviewPanel />
              </div>
              <div className="col-span-12 space-y-5 xl:col-span-3">
                <AISummaryCard />
                <CoachResponseCard />
                <RiskIndicators />
                <NextActions />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <AtRiskClients />
              <Templates />
              <AdherenceTrends />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

void ChevronDown;
