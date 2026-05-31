import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  Flame,
  MapPin,
  MessagesSquare,
  MoreHorizontal,
  Plus,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";


import { ProShell } from "@/components/dashboard/ProShell";
export const Route = createFileRoute("/dashboard_/clients/$slug")({
  head: () => ({
    meta: [
      { title: "Sarah Johnson — Client record · REPs Professional" },
      {
        name: "description",
        content:
          "Client record, progress, coaching plan and account status inside the REPs professional dashboard.",
      },
      {
        property: "og:title",
        content: "Sarah Johnson — Client record · REPs Professional",
      },
      {
        property: "og:description",
        content:
          "Client record, progress, coaching plan and account status.",
      },
    ],
  }),
  component: ClientProfilePage,
});

/* ============================================================
   SIDEBAR — Clients active
   ============================================================ */

type NavItem = {
  icon: LucideIcon;
  label: string;
  to?: string;
  badge?: string;
  active?: boolean;
};

const NAV: NavItem[] = [
  { icon: Calendar, label: "Calendar" },
  { icon: Dumbbell, label: "Programs" },
  { icon: Apple, label: "Nutrition" },
  { icon: ClipboardList, label: "Check-Ins" },
  { icon: MessagesSquare, label: "Messages", badge: "6" },
  { icon: CreditCard, label: "Payments" },
  { icon: FileText, label: "Content Studio" },
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
        <Link
          to="/dashboard"
          className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/55 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to clients
        </Link>
        <h1 className="font-display text-[22px] font-bold leading-tight text-white">
          Sarah Johnson
        </h1>
        <p className="mt-0.5 text-[13px] text-white/55">
          Client record, progress, coaching plan and account status.
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
          <Send className="h-4 w-4" />
          Message
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
        >
          <CalendarPlus className="h-4 w-4" />
          Book session
        </button>
        <button
          type="button"
          aria-label="More"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel text-white/70 shadow-none transition-colors hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
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

function KeyVal({
  rows,
}: {
  rows: [string, React.ReactNode][];
}) {
  return (
    <dl className="space-y-2.5 text-[12.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-3">
          <dt className="text-white/50">{k}</dt>
          <dd className="text-right font-medium text-white/85">{v}</dd>
        </div>
      ))}
    </dl>
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

/* ============================================================
   HEADER CARD
   ============================================================ */

function ClientHeaderCard() {
  const rows: [string, React.ReactNode][] = [
    ["Client since", "12 March 2024"],
    ["Goal", "Fat loss and improved fitness"],
    ["Coaching type", "Hybrid coaching"],
    ["Programme", "Fat Loss Phase 2"],
    [
      "Location",
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        London, UK
      </span>,
    ],
    ["Next session", "Tomorrow, 10:00 AM"],
    [
      "Payment status",
      <span className="inline-flex h-5 items-center rounded-full bg-emerald-500/15 px-2 text-[11px] font-semibold text-emerald-300">
        Paid
      </span>,
    ],
  ];
  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-reps-orange-soft text-[20px] font-bold text-reps-orange ring-2 ring-reps-orange-border">
            SJ
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[20px] font-bold leading-none text-white">
                Sarah Johnson
              </h2>
              <span className="inline-flex h-5 items-center rounded-full bg-emerald-500/15 px-2 text-[11px] font-semibold text-emerald-300">
                Active
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[12px] text-white/55">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                London, UK
              </span>
              <span>·</span>
              <span>Hybrid coaching</span>
              <span>·</span>
              <span>Fat Loss Phase 2</span>
            </div>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 border-t border-reps-border pt-4 sm:grid-cols-3 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                {k}
              </span>
              <span className="mt-0.5 text-[12.5px] font-medium text-white/85">
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ============================================================
   TABS
   ============================================================ */

const TABS = [
  "Overview",
  "Programmes",
  "Check-ins",
  "Nutrition",
  "Bookings",
  "Payments",
  "Messages",
  "Notes",
];

function Tabs() {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-[16px] border border-reps-border bg-reps-panel p-1.5">
      {TABS.map((t, i) => (
        <button
          key={t}
          type="button"
          className={`h-9 whitespace-nowrap rounded-[10px] px-3.5 text-[12.5px] font-semibold shadow-none transition-colors ${
            i === 0
              ? "bg-reps-orange-soft text-reps-orange"
              : "text-white/65 hover:bg-reps-panel-soft hover:text-white"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   METRIC STRIP
   ============================================================ */

type Metric = { label: string; value: string; delta: string };
const METRICS: Metric[] = [
  { label: "Adherence", value: "85%", delta: "+6% this month" },
  { label: "Weight change", value: "-4.2kg", delta: "Since start" },
  { label: "Workouts completed", value: "24", delta: "This month" },
  { label: "Check-ins", value: "7/8", delta: "On time" },
  { label: "Revenue", value: "£420", delta: "This month" },
];

function MetricCard({ m }: { m: Metric }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-white/50">
        {m.label}
      </div>
      <div className="mt-2 font-display text-[24px] font-bold leading-none text-white">
        {m.value}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-reps-orange">
        <ArrowUpRight className="h-3 w-3" />
        {m.delta}
      </div>
    </Card>
  );
}

/* ============================================================
   PROGRESS CHART (custom SVG)
   ============================================================ */

const CHART_TABS = ["Weight", "Adherence", "Measurements", "Workouts"];

function ProgressChart() {
  const w = 560;
  const h = 200;
  const pad = 24;
  const pts = [82, 81, 80.4, 79.8, 79.1, 78.6, 78.0, 77.8, 77.3, 77.0, 76.5];
  const min = Math.min(...pts) - 0.5;
  const max = Math.max(...pts) + 0.5;
  const stepX = (w - pad * 2) / (pts.length - 1);
  const pointXY = (v: number, i: number) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
    return { x, y };
  };
  const line = pts
    .map((v, i) => {
      const { x, y } = pointXY(v, i);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L ${pad + (pts.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Progress summary"
        subtitle="Trend across the last 11 weeks"
        right={
          <div className="flex items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft p-1">
            {CHART_TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                className={`h-7 rounded-[8px] px-2.5 text-[11.5px] font-semibold shadow-none transition-colors ${
                  i === 0
                    ? "bg-reps-orange text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />
      <div className="rounded-[16px] border border-reps-border bg-reps-panel-soft p-4">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[200px] w-full">
          <defs>
            <linearGradient id="cliFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((r) => (
            <line
              key={r}
              x1={pad}
              x2={w - pad}
              y1={pad + r * (h - pad * 2)}
              y2={pad + r * (h - pad * 2)}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 4"
            />
          ))}
          <path d={area} fill="url(#cliFill)" />
          <path d={line} fill="none" stroke="var(--reps-orange)" strokeWidth="2.25" />
          {pts.map((v, i) => {
            const { x, y } = pointXY(v, i);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i === pts.length - 1 ? 4 : 2.5}
                fill="var(--reps-orange)"
                stroke="#0b0b10"
                strokeWidth={i === pts.length - 1 ? 2 : 0}
              />
            );
          })}
        </svg>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Weight", "-4.2kg"],
          ["Body fat", "-3.8%"],
          ["Waist", "-6cm"],
          ["Workouts", "24"],
          ["Adherence", "85%"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5"
          >
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-white/50">
              {k}
            </div>
            <div className="mt-1 font-display text-[15px] font-bold text-white">
              {v}
            </div>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/* ============================================================
   ROW PANELS
   ============================================================ */

function ClientOverviewCard() {
  return (
    <Card>
      <SectionHeader
        title="Client overview"
        subtitle="Coaching agreement and targets"
      />
      <KeyVal
        rows={[
          ["Goal", "Lose fat and improve fitness"],
          ["Start date", "12 March 2024"],
          ["Current phase", "Fat Loss Phase 2"],
          ["Coaching format", "In-person and online"],
          ["Training days", "4 per week"],
          ["Nutrition target", "1,850 kcal"],
          ["Protein target", "135g"],
        ]}
      />
      <div className="mt-4 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3 text-[12.5px] leading-relaxed text-white/75">
        <span className="font-semibold text-white">Notes · </span>
        Sarah is progressing well. Keep focus on consistency, steps and recovery.
      </div>
    </Card>
  );
}

function LatestCheckIn() {
  const rows: [string, React.ReactNode][] = [
    ["Submitted", "Yesterday"],
    ["Energy", "4 / 5"],
    ["Sleep", "7 hrs"],
    ["Mood", "Good"],
    ["Stress", "Mild"],
    ["Adherence", "85%"],
    [
      "Coach review",
      <span className="inline-flex h-5 items-center rounded-full bg-emerald-500/15 px-2 text-[11px] font-semibold text-emerald-300">
        Reviewed
      </span>,
    ],
  ];
  return (
    <Card>
      <SectionHeader title="Latest check-in" subtitle="Weekly summary" />
      <KeyVal rows={rows} />
      <GhostButton className="mt-4 w-full">
        <ClipboardList className="h-4 w-4" />
        View full check-in
      </GhostButton>
    </Card>
  );
}

function AssignedProgramme() {
  return (
    <Card>
      <SectionHeader title="Assigned programme" subtitle="Current block" />
      <div className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-[14.5px] font-semibold text-white">
              Fat Loss Phase 2
            </div>
            <div className="text-[11.5px] text-white/55">Week 5 of 12</div>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
            <Dumbbell className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-reps-orange" style={{ width: "42%" }} />
        </div>
      </div>
      <KeyVal
        rows={[
          ["Current focus", "Strength retention & conditioning"],
          ["Next workout", "Lower body strength"],
          ["This week", "3 / 4 sessions"],
        ]}
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PrimaryButton>Open programme</PrimaryButton>
        <GhostButton>Adjust plan</GhostButton>
      </div>
    </Card>
  );
}

function NutritionSnapshot() {
  const items = [
    { label: "Calories", target: "1,850 kcal", actual: "1,910 kcal", pct: 103 },
    { label: "Protein", target: "135g", actual: "128g", pct: 95 },
    { label: "Water", target: "2.5L", actual: "2.2L", pct: 88 },
  ];
  return (
    <Card>
      <SectionHeader title="Nutrition snapshot" subtitle="7-day average" />
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.label}>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-white">{i.label}</span>
              <span className="text-white/55">
                {i.actual}{" "}
                <span className="text-white/35">/ {i.target}</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-reps-orange"
                style={{ width: `${Math.min(i.pct, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-[12px] border border-reps-orange-border bg-reps-orange-soft px-3 py-2.5">
        <span className="text-[12px] font-semibold text-reps-orange">
          Nutrition adherence
        </span>
        <span className="font-display text-[15px] font-bold text-white">82%</span>
      </div>
      <GhostButton className="mt-4 w-full">
        <Apple className="h-4 w-4" />
        View nutrition plan
      </GhostButton>
    </Card>
  );
}

function UpcomingBookings() {
  const items: {
    when: string;
    title: string;
    where: string;
    status: "Confirmed" | "Scheduled";
  }[] = [
    {
      when: "Tomorrow, 10:00 AM",
      title: "Personal Training",
      where: "REPs Performance Studio",
      status: "Confirmed",
    },
    {
      when: "Friday, 7:30 AM",
      title: "Online Check-in Review",
      where: "Zoom",
      status: "Scheduled",
    },
    {
      when: "Monday, 6:00 PM",
      title: "Strength Session",
      where: "Gym floor",
      status: "Confirmed",
    },
  ];
  return (
    <Card>
      <SectionHeader title="Upcoming bookings" subtitle="Next 7 days" />
      <ul className="space-y-3">
        {items.map((b) => (
          <li
            key={b.when}
            className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-3"
          >
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="font-semibold text-reps-orange">{b.when}</span>
              <span
                className={`inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold ${
                  b.status === "Confirmed"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-sky-500/15 text-sky-300"
                }`}
              >
                {b.status}
              </span>
            </div>
            <div className="mt-1 text-[13px] font-semibold text-white">
              {b.title}
            </div>
            <div className="text-[11.5px] text-white/55">{b.where}</div>
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">
        <Calendar className="h-4 w-4" />
        View calendar
      </GhostButton>
    </Card>
  );
}

function ProgressPhotos() {
  const labels = ["Start", "Week 4", "Week 8", "Latest"];
  return (
    <Card>
      <SectionHeader title="Progress photos" subtitle="Visual transformation" />
      <div className="grid grid-cols-4 gap-2.5">
        {labels.map((l) => (
          <div key={l}>
            <div className="aspect-[3/4] w-full overflow-hidden rounded-[12px] border border-reps-border bg-gradient-to-br from-reps-panel-soft to-reps-ink">
              <div className="flex h-full w-full items-center justify-center text-white/20">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-1.5 text-center text-[10.5px] font-semibold text-white/60">
              {l}
            </div>
          </div>
        ))}
      </div>
      <GhostButton className="mt-4 w-full">View progress</GhostButton>
    </Card>
  );
}

function RecentActivity() {
  const items: { text: string; icon: LucideIcon; when: string }[] = [
    { text: "Completed Lower Body Strength", icon: Dumbbell, when: "2h ago" },
    { text: "Submitted weekly check-in", icon: ClipboardList, when: "Yesterday" },
    { text: "Nutrition plan updated", icon: Apple, when: "2 days ago" },
    { text: "Payment received", icon: CreditCard, when: "5 days ago" },
    { text: "Message sent by coach", icon: MessagesSquare, when: "1 week ago" },
  ];
  return (
    <Card>
      <SectionHeader title="Recent activity" subtitle="Last 30 days" />
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.text} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <i.icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-white/85">
                {i.text}
              </div>
              <div className="text-[10.5px] text-white/45">{i.when}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PaymentStatus() {
  return (
    <Card>
      <SectionHeader title="Payment status" subtitle="Subscription overview" />
      <div className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Current plan
            </div>
            <div className="mt-0.5 font-display text-[15px] font-bold text-white">
              Hybrid Coaching
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-[20px] font-bold text-white">
              £210
            </div>
            <div className="text-[10.5px] text-white/50">per month</div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <KeyVal
          rows={[
            [
              "Last payment",
              <span className="inline-flex h-5 items-center rounded-full bg-emerald-500/15 px-2 text-[11px] font-semibold text-emerald-300">
                Paid
              </span>,
            ],
            ["Next payment", "25 May 2025"],
            ["Outstanding balance", "£0"],
          ]}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PrimaryButton>View payments</PrimaryButton>
        <GhostButton>Create invoice</GhostButton>
      </div>
    </Card>
  );
}

/* ============================================================
   COACH NOTES + AI INSIGHT
   ============================================================ */

function CoachNotes() {
  const notes = [
    {
      text: "Good consistency this week. Keep calories steady and maintain step target.",
      when: "Today",
    },
    {
      text: "Sleep dropped slightly. Review recovery if this continues next week.",
      when: "3 days ago",
    },
    {
      text: "Strength numbers holding well despite weight loss phase.",
      when: "1 week ago",
    },
  ];
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Coach notes"
        subtitle="Private notes visible only to you"
        right={
          <div className="flex items-center gap-2">
            <GhostButton className="h-9 px-3 text-[12px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Create follow-up task
            </GhostButton>
            <PrimaryButton className="h-9 px-3 text-[12px]">
              <Plus className="h-3.5 w-3.5" />
              Add note
            </PrimaryButton>
          </div>
        }
      />
      <ul className="space-y-3">
        {notes.map((n) => (
          <li
            key={n.text}
            className="flex items-start gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-4"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-relaxed text-white/85">
                {n.text}
              </p>
              <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-white/40">
                James Carter · {n.when}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function AiCoachingInsight() {
  return (
    <Card className="border-reps-orange-border bg-gradient-to-br from-reps-panel to-reps-orange/10">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="font-display text-[13.5px] font-semibold text-white">
            AI coaching insight
          </div>
          <div className="text-[11px] text-white/55">
            Auto-generated · weekly summary
          </div>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-white/80">
        Sarah is progressing well overall. Weight loss is steady, adherence is
        strong and workouts are consistent. Watch sleep and recovery over the
        next 7 days before increasing training volume.
      </p>
      <button
        type="button"
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Draft check-in reply
      </button>
    </Card>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function ClientProfilePage() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar />
          <div className="space-y-5 px-8 pb-10 pt-6">
            <ClientHeaderCard />
            <Tabs />

            {/* Metric strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {METRICS.map((m) => (
                <MetricCard key={m.label} m={m} />
              ))}
            </div>

            {/* Row 1: overview / chart / check-in */}
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 xl:col-span-3">
                <ClientOverviewCard />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <ProgressChart />
              </div>
              <div className="col-span-12 xl:col-span-3">
                <LatestCheckIn />
              </div>
            </div>

            {/* Row 2: programme / nutrition / bookings */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <AssignedProgramme />
              <NutritionSnapshot />
              <UpcomingBookings />
            </div>

            {/* Row 3: photos / activity / payments */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <ProgressPhotos />
              <RecentActivity />
              <PaymentStatus />
            </div>

            {/* Notes + AI */}
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 xl:col-span-8">
                <CoachNotes />
              </div>
              <div className="col-span-12 xl:col-span-4">
                <AiCoachingInsight />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* unused-icon guard so linter sees them as referenced */
void Activity;
