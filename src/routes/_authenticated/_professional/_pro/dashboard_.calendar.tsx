import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Target,
  Users,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
export const Route = createFileRoute("/_authenticated/_professional/_pro/dashboard_/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — REPS Professional" },
      {
        name: "description",
        content:
          "Manage sessions, consultations, classes and online bookings from your REPS professional dashboard.",
      },
      { property: "og:title", content: "Calendar — REPS Professional" },
      {
        property: "og:description",
        content:
          "Manage sessions, consultations, classes and online bookings.",
      },
      { property: "og:url", content: "/dashboard/calendar" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/calendar" }],
  }),
  component: CalendarPage,
});

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
   CONTROLS ROW
   ============================================================ */

const VIEW_TABS = ["Day", "Week", "Month"];
const FILTERS = [
  "All bookings",
  "PT sessions",
  "Consultations",
  "Classes",
  "Online check-ins",
];

function ControlsRow() {
  return (
    <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          Today
        </button>
        <div className="flex h-9 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft">
          <button
            type="button"
            aria-label="Previous week"
            className="flex h-9 w-9 items-center justify-center text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="border-x border-reps-border px-3 text-[12.5px] font-semibold text-white">
            20 – 26 May 2025
          </span>
          <button
            type="button"
            aria-label="Next week"
            className="flex h-9 w-9 items-center justify-center text-white/70 transition-colors hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-9 items-center gap-1 rounded-[10px] border border-reps-border bg-reps-panel-soft p-1">
          {VIEW_TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`h-7 rounded-[8px] px-3 text-[12px] font-semibold shadow-none transition-colors ${
                t === "Week"
                  ? "bg-reps-orange text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              type="button"
              className={`h-8 rounded-full px-3 text-[11.5px] font-semibold shadow-none transition-colors ${
                i === 0
                  ? "bg-white/10 text-white"
                  : "border border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          Filter
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </Panel>
  );
}

/* ============================================================
   WEEK CALENDAR
   ============================================================ */

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07..20
const DAYS = [
  { label: "Mon", date: "20", today: false },
  { label: "Tue", date: "21", today: false },
  { label: "Wed", date: "22", today: true },
  { label: "Thu", date: "23", today: false },
  { label: "Fri", date: "24", today: false },
  { label: "Sat", date: "25", today: false },
  { label: "Sun", date: "26", today: false },
];

type Tone = "confirmed" | "group" | "online" | "lead" | "pending" | "review";

const TONE_STYLE: Record<
  Tone,
  { bg: string; border: string; text: string; dot: string; chipBg: string; chipText: string; chipLabel: string }
> = {
  confirmed: {
    bg: "bg-emerald-500/12",
    border: "border-emerald-500/30",
    text: "text-emerald-50",
    dot: "bg-emerald-400",
    chipBg: "bg-emerald-500/20",
    chipText: "text-emerald-200",
    chipLabel: "Confirmed",
  },
  group: {
    bg: "bg-sky-500/12",
    border: "border-sky-500/30",
    text: "text-sky-50",
    dot: "bg-sky-400",
    chipBg: "bg-sky-500/20",
    chipText: "text-sky-200",
    chipLabel: "Group",
  },
  online: {
    bg: "bg-violet-500/12",
    border: "border-violet-500/30",
    text: "text-violet-50",
    dot: "bg-violet-400",
    chipBg: "bg-violet-500/20",
    chipText: "text-violet-200",
    chipLabel: "Online",
  },
  lead: {
    bg: "bg-reps-orange/15",
    border: "border-reps-orange-border",
    text: "text-orange-50",
    dot: "bg-reps-orange",
    chipBg: "bg-reps-orange-soft",
    chipText: "text-reps-orange",
    chipLabel: "New lead",
  },
  pending: {
    bg: "bg-amber-500/12",
    border: "border-amber-500/30",
    text: "text-amber-50",
    dot: "bg-amber-400",
    chipBg: "bg-amber-500/20",
    chipText: "text-amber-200",
    chipLabel: "Pending",
  },
  review: {
    bg: "bg-rose-500/12",
    border: "border-rose-500/30",
    text: "text-rose-50",
    dot: "bg-rose-400",
    chipBg: "bg-rose-500/20",
    chipText: "text-rose-200",
    chipLabel: "Needs review",
  },
};

type Booking = {
  day: number; // 0..6
  start: number; // hour in float, e.g. 8.5
  end: number;
  title: string;
  sub: string;
  meta: string;
  tone: Tone;
  chip?: string;
};

const BOOKINGS: Booking[] = [
  { day: 0, start: 9, end: 10, title: "Sarah Johnson", sub: "PT Session", meta: "Performance Studio", tone: "confirmed" },
  { day: 0, start: 18, end: 19, title: "Strength Class", sub: "Group Session", meta: "5 attending", tone: "group", chip: "5 attending" },
  { day: 1, start: 8.5, end: 9.5, title: "Emma Wilson", sub: "Online Coaching Review", meta: "Zoom", tone: "online" },
  { day: 1, start: 17, end: 18, title: "James Smith", sub: "Consultation", meta: "Discovery call", tone: "lead" },
  { day: 2, start: 10, end: 11, title: "Michael Brown", sub: "PT Session", meta: "Payment pending", tone: "pending", chip: "Payment pending" },
  { day: 3, start: 14, end: 15.5, title: "Online Check-ins", sub: "8 clients due", meta: "Needs review", tone: "review", chip: "8 clients" },
  { day: 4, start: 7.5, end: 8.5, title: "Sarah Johnson", sub: "Online Check-in Review", meta: "Zoom", tone: "online" },
  { day: 4, start: 12, end: 13, title: "David Lee", sub: "Strength Session", meta: "Gym floor", tone: "confirmed" },
  { day: 5, start: 9, end: 10.5, title: "Group HIIT Class", sub: "Studio A", meta: "12 attending", tone: "group", chip: "12 attending" },
  { day: 6, start: 10, end: 11, title: "Recovery & Mobility", sub: "Studio B", meta: "7 attending", tone: "group", chip: "7 attending" },
];

const ROW_H = 56; // px per hour
const HEADER_H = 56;

function WeekCalendar() {
  return (
    <Panel className="overflow-hidden">
      <SectionHeader
        title="Weekly calendar"
        subtitle="Mon 20 – Sun 26 May · 38 sessions scheduled"
        right={
          <div className="flex items-center gap-3 text-[11px] text-white/55">
            <Legend tone="confirmed" label="Confirmed" />
            <Legend tone="online" label="Online" />
            <Legend tone="group" label="Group" />
            <Legend tone="pending" label="Pending" />
          </div>
        }
      />

      <div className="px-5 pb-5">
        <div className="overflow-hidden rounded-[16px] border border-reps-border">
          {/* Day header row */}
          <div
            className="grid border-b border-reps-border bg-reps-panel-soft"
            style={{ gridTemplateColumns: "64px repeat(7, minmax(0,1fr))" }}
          >
            <div className="border-r border-reps-border" />
            {DAYS.map((d) => (
              <div
                key={d.label}
                className={`flex items-center justify-center gap-2 border-r border-reps-border py-3 last:border-r-0 ${
                  d.today ? "bg-reps-orange/8" : ""
                }`}
                style={{ height: HEADER_H }}
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
                  {d.label}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-bold ${
                    d.today
                      ? "bg-reps-orange text-white"
                      : "text-white/85"
                  }`}
                >
                  {d.date}
                </span>
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: "64px repeat(7, minmax(0,1fr))",
              height: HOURS.length * ROW_H,
            }}
          >
            {/* Time column */}
            <div className="relative border-r border-reps-border">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-2 pt-1 text-[10.5px] font-semibold text-white/40"
                  style={{ height: ROW_H }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((d, di) => (
              <div
                key={d.label}
                className={`relative border-r border-reps-border last:border-r-0 ${
                  d.today ? "bg-reps-orange/[0.04]" : ""
                }`}
              >
                {HOURS.map((_, hi) => (
                  <div
                    key={hi}
                    className="border-b border-reps-border/60 last:border-b-0"
                    style={{ height: ROW_H }}
                  />
                ))}

                {BOOKINGS.filter((b) => b.day === di).map((b, i) => {
                  const topHours = b.start - HOURS[0];
                  const heightHours = b.end - b.start;
                  const top = topHours * ROW_H + 2;
                  const height = heightHours * ROW_H - 4;
                  const tone = TONE_STYLE[b.tone];
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`absolute left-1.5 right-1.5 overflow-hidden rounded-[10px] border ${tone.border} ${tone.bg} px-2 py-1.5 text-left shadow-none transition-colors hover:brightness-125`}
                      style={{ top, height }}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65">
                        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                        {fmtTime(b.start)}–{fmtTime(b.end)}
                      </div>
                      <div className={`mt-0.5 truncate text-[11.5px] font-bold ${tone.text}`}>
                        {b.title}
                      </div>
                      <div className="truncate text-[10.5px] text-white/65">
                        {b.sub}
                      </div>
                      {b.chip ? (
                        <span
                          className={`mt-1 inline-flex h-4 items-center rounded-full px-1.5 text-[9.5px] font-semibold ${tone.chipBg} ${tone.chipText}`}
                        >
                          {b.chip}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Legend({ tone, label }: { tone: Tone; label: string }) {
  const t = TONE_STYLE[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${t.dot}`} />
      {label}
    </span>
  );
}

function fmtTime(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* ============================================================
   RIGHT COLUMN CARDS
   ============================================================ */

function TodaysSchedule() {
  const items = [
    { time: "09:00", title: "Sarah Johnson", sub: "PT Session", tone: "confirmed" as Tone },
    { time: "11:00", title: "James Smith", sub: "New lead call", tone: "lead" as Tone },
    { time: "14:00", title: "Online check-ins", sub: "8 clients", tone: "review" as Tone },
    { time: "17:30", title: "Emma Wilson", sub: "Coaching review", tone: "online" as Tone },
  ];
  return (
    <Card>
      <SectionHeader title="Today’s schedule" subtitle="Wednesday 22 May" />
      <ul className="space-y-2.5">
        {items.map((i) => {
          const t = TONE_STYLE[i.tone];
          return (
            <li
              key={i.time + i.title}
              className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3"
            >
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-reps-orange">
                  {i.time}
                </span>
                <span className={`mt-1 h-2 w-2 rounded-full ${t.dot}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">
                  {i.title}
                </div>
                <div className="truncate text-[11px] text-white/55">
                  {i.sub}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <GhostButton className="mt-4 w-full">
        <CalendarIcon className="h-4 w-4" />
        View today
      </GhostButton>
    </Card>
  );
}

function BookingSummary() {
  const rows: { label: string; value: string; dot: string }[] = [
    { label: "Sessions this week", value: "38", dot: "bg-white/40" },
    { label: "Completed", value: "24", dot: "bg-emerald-400" },
    { label: "Upcoming", value: "9", dot: "bg-sky-400" },
    { label: "Pending payment", value: "3", dot: "bg-amber-400" },
    { label: "Cancellations", value: "2", dot: "bg-rose-400" },
  ];
  return (
    <Card>
      <SectionHeader title="Booking summary" subtitle="Last 7 days" />
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12.5px]"
          >
            <span className="inline-flex items-center gap-2 text-white/75">
              <span className={`h-2 w-2 rounded-full ${r.dot}`} />
              {r.label}
            </span>
            <span className="font-display text-[15px] font-bold text-white">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Availability() {
  const items = [
    { day: "Monday", slot: "07:00 – 12:00 · 16:00 – 20:00" },
    { day: "Tuesday", slot: "08:00 – 13:00" },
    { day: "Wednesday", slot: "10:00 – 18:00" },
    { day: "Thursday", slot: "Online only" },
    { day: "Friday", slot: "07:00 – 15:00" },
  ];
  return (
    <Card>
      <SectionHeader title="Availability" subtitle="Weekly default" />
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.day}
            className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12px]"
          >
            <span className="font-semibold text-white">{i.day}</span>
            <span className="text-right text-white/65">{i.slot}</span>
          </li>
        ))}
      </ul>
      <GhostButton className="mt-4 w-full">
        <Clock className="h-4 w-4" />
        Edit availability
      </GhostButton>
    </Card>
  );
}

function BookingAlerts() {
  const items: { title: string; meta: string; tone: Tone; sub: string }[] = [
    {
      title: "Michael Brown",
      sub: "Payment pending",
      meta: "Session tomorrow",
      tone: "pending",
    },
    {
      title: "James Smith",
      sub: "Consultation not confirmed",
      meta: "Follow up today",
      tone: "lead",
    },
    {
      title: "Online check-ins",
      sub: "8 clients due",
      meta: "Review required",
      tone: "review",
    },
  ];
  return (
    <Card>
      <SectionHeader title="Booking alerts" subtitle="Needs your attention" />
      <ul className="space-y-2.5">
        {items.map((i) => {
          const t = TONE_STYLE[i.tone];
          return (
            <li
              key={i.title}
              className={`rounded-[12px] border ${t.border} ${t.bg} p-3`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white">{i.title}</div>
                <span
                  className={`inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold ${t.chipBg} ${t.chipText}`}
                >
                  {t.chipLabel}
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-white/70">{i.sub}</div>
              <div className="text-[10.5px] text-white/45">{i.meta}</div>
            </li>
          );
        })}
      </ul>
      <GhostButton className="mt-4 w-full">Review alerts</GhostButton>
    </Card>
  );
}

/* ============================================================
   LOWER CARDS
   ============================================================ */

function UpcomingConsultations() {
  const rows = [
    { name: "James Smith", when: "Tomorrow · 17:00", tag: "New lead" },
    { name: "Olivia Taylor", when: "Friday · 13:00", tag: "Pilates enquiry" },
    { name: "Daniel Hughes", when: "Monday · 09:30", tag: "Online coaching enquiry" },
  ];
  return (
    <Card>
      <SectionHeader title="Upcoming consultations" subtitle="Next 7 days" />
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li
            key={r.name}
            className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
              {r.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-white">
                {r.name}
              </div>
              <div className="text-[11px] text-white/55">{r.when}</div>
            </div>
            <span className="inline-flex h-5 items-center rounded-full bg-reps-orange-soft px-2 text-[10.5px] font-semibold text-reps-orange">
              {r.tag}
            </span>
          </li>
        ))}
      </ul>
      <Link
        to="/dashboard/leads"
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
      >
        <Target className="h-4 w-4" />
        Open leads
      </Link>
    </Card>
  );
}

function RevenueSpark() {
  const w = 240;
  const h = 56;
  const pts = [32, 38, 30, 44, 52, 48, 64, 70, 68, 76];
  const min = Math.min(...pts) - 4;
  const max = Math.max(...pts) + 4;
  const stepX = w / (pts.length - 1);
  const line = pts
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)} ${(
          h - ((v - min) / (max - min)) * h
        ).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[56px] w-full">
      <defs>
        <linearGradient id="calRevFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill="url(#calRevFill)" />
      <path d={line} fill="none" stroke="var(--reps-orange)" strokeWidth="2" />
    </svg>
  );
}

function SessionRevenue() {
  const rows = [
    { label: "Booked this week", value: "£2,460" },
    { label: "Paid", value: "£1,920" },
    { label: "Pending", value: "£540" },
    { label: "Avg. session value", value: "£64" },
  ];
  return (
    <Card>
      <SectionHeader
        title="Session revenue"
        subtitle="Week of 20 May"
        right={
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-reps-orange">
            <ArrowUpRight className="h-3 w-3" />
            +12%
          </span>
        }
      />
      <div className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-3">
        <RevenueSpark />
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12.5px]"
          >
            <span className="text-white/70">{r.label}</span>
            <span className="font-semibold text-white">{r.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ClassAttendance() {
  const rows = [
    { name: "Strength Class", attended: 5, capacity: 8 },
    { name: "Group HIIT", attended: 12, capacity: 15 },
    { name: "Recovery & Mobility", attended: 7, capacity: 10 },
    { name: "Pilates Class", attended: 6, capacity: 8 },
  ];
  return (
    <Card>
      <SectionHeader title="Class attendance" subtitle="This week" />
      <ul className="space-y-3">
        {rows.map((r) => {
          const pct = (r.attended / r.capacity) * 100;
          return (
            <li key={r.name}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-white">{r.name}</span>
                <span className="text-white/55">
                  <span className="font-semibold text-white">{r.attended}</span>
                  <span className="text-white/35"> / {r.capacity}</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-reps-orange"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <GhostButton className="mt-4 w-full">
        <Users className="h-4 w-4" />
        Manage classes
      </GhostButton>
    </Card>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function CalendarPage() {
  return (
    <DashboardShell role="trainer" tier="pro"
      active="Calendar"
      title="Calendar"
      subtitle="Manage sessions, consultations, classes and online bookings."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
          >
            <Clock className="h-4 w-4" />
            Set availability
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
          >
            <Plus className="h-4 w-4" />
            New booking
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <ControlsRow />

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-9">
            <WeekCalendar />
          </div>
          <div className="col-span-12 space-y-5 xl:col-span-3">
            <TodaysSchedule />
            <BookingSummary />
            <Availability />
            <BookingAlerts />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <UpcomingConsultations />
          <SessionRevenue />
          <ClassAttendance />
        </div>
      </div>
    </DashboardShell>
  );
}
