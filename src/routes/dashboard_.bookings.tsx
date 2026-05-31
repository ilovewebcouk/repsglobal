import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  ArrowUpRight,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  Dumbbell,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  MessagesSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Video,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";

export const Route = createFileRoute("/dashboard_/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — REPs Professional" },
      {
        name: "description",
        content:
          "Track upcoming, completed, cancelled and refund-requested bookings across your REPs services.",
      },
      { property: "og:title", content: "Bookings — REPs Professional" },
      {
        property: "og:description",
        content:
          "Track upcoming, completed, cancelled and refund-requested bookings.",
      },
      { property: "og:url", content: "/dashboard/bookings" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/bookings" }],
  }),
  component: BookingsPage,
});

/* ============================================================
   SIDEBAR — Bookings active
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
  { icon: CreditCard, label: "Bookings", active: true },
  { icon: Dumbbell, label: "Programs", to: "/dashboard/programs" },
  { icon: Apple, label: "Nutrition" },
  { icon: ClipboardList, label: "Check-Ins", to: "/dashboard/check-ins" },
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
          Bookings
        </h1>
        <p className="mt-0.5 text-[13px] text-white/55">
          Every session, consultation, class and online booking across your REPs services.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-[240px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel px-3 text-[13px] text-white/55 md:flex">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search bookings…</span>
          <kbd className="rounded-[6px] border border-reps-border bg-reps-ink px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
            ⌘K
          </kbd>
        </div>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
        >
          <Plus className="h-4 w-4" />
          New booking
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

/* ============================================================
   DATA
   ============================================================ */

const KPIS = [
  { label: "Upcoming", value: "38", delta: "+6 vs last week", tone: "up" as const },
  { label: "Today", value: "7", delta: "Next at 09:30", tone: "neutral" as const },
  { label: "This week", value: "24", delta: "82% capacity", tone: "up" as const },
  { label: "Completed (30d)", value: "146", delta: "+18% MoM", tone: "up" as const },
  { label: "Cancellations (30d)", value: "9", delta: "6.2% rate", tone: "down" as const },
  { label: "Refund requests", value: "3", delta: "Needs review", tone: "warn" as const },
];

type BookingStatus =
  | "Confirmed"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "Refund requested"
  | "No-show";

type Booking = {
  id: string;
  client: { name: string; initials: string };
  service: string;
  type: "In-person" | "Online" | "Class";
  location: string;
  date: string;
  time: string;
  duration: string;
  amount: string;
  status: BookingStatus;
};

const BOOKINGS: Booking[] = [
  {
    id: "REP-2841",
    client: { name: "Sarah Johnson", initials: "SJ" },
    service: "1:1 Strength Coaching",
    type: "In-person",
    location: "REPs Studio, Manchester",
    date: "Mon 31 May",
    time: "09:30",
    duration: "60 min",
    amount: "£72.00",
    status: "Confirmed",
  },
  {
    id: "REP-2840",
    client: { name: "Daniel Okafor", initials: "DO" },
    service: "Performance Consultation",
    type: "Online",
    location: "Zoom",
    date: "Mon 31 May",
    time: "11:00",
    duration: "45 min",
    amount: "£55.00",
    status: "Confirmed",
  },
  {
    id: "REP-2839",
    client: { name: "Priya Mehta", initials: "PM" },
    service: "Hybrid Programme Review",
    type: "Online",
    location: "Zoom",
    date: "Mon 31 May",
    time: "13:15",
    duration: "30 min",
    amount: "£35.00",
    status: "Pending",
  },
  {
    id: "REP-2838",
    client: { name: "Olivia Brennan", initials: "OB" },
    service: "Group Conditioning Class",
    type: "Class",
    location: "REPs Studio, Manchester",
    date: "Mon 31 May",
    time: "18:00",
    duration: "50 min",
    amount: "£18.00",
    status: "Confirmed",
  },
  {
    id: "REP-2837",
    client: { name: "Marcus Hall", initials: "MH" },
    service: "1:1 Strength Coaching",
    type: "In-person",
    location: "REPs Studio, Manchester",
    date: "Tue 1 Jun",
    time: "07:00",
    duration: "60 min",
    amount: "£72.00",
    status: "Confirmed",
  },
  {
    id: "REP-2836",
    client: { name: "Hannah Reid", initials: "HR" },
    service: "Nutrition Strategy Call",
    type: "Online",
    location: "Zoom",
    date: "Tue 1 Jun",
    time: "10:30",
    duration: "45 min",
    amount: "£60.00",
    status: "Refund requested",
  },
  {
    id: "REP-2835",
    client: { name: "Tom Whitfield", initials: "TW" },
    service: "1:1 Strength Coaching",
    type: "In-person",
    location: "REPs Studio, Manchester",
    date: "Sat 29 May",
    time: "08:00",
    duration: "60 min",
    amount: "£72.00",
    status: "Completed",
  },
  {
    id: "REP-2834",
    client: { name: "Aisha Khan", initials: "AK" },
    service: "Performance Consultation",
    type: "Online",
    location: "Zoom",
    date: "Fri 28 May",
    time: "16:00",
    duration: "45 min",
    amount: "£55.00",
    status: "Cancelled",
  },
  {
    id: "REP-2833",
    client: { name: "Ben Adeyemi", initials: "BA" },
    service: "Onboarding Assessment",
    type: "In-person",
    location: "REPs Studio, Manchester",
    date: "Fri 28 May",
    time: "12:00",
    duration: "75 min",
    amount: "£90.00",
    status: "No-show",
  },
];

const TODAY = BOOKINGS.filter((b) => b.date === "Mon 31 May");

const REFUNDS = BOOKINGS.filter((b) => b.status === "Refund requested").concat([
  {
    id: "REP-2829",
    client: { name: "Lucy Hartwell", initials: "LH" },
    service: "Group Conditioning Class",
    type: "Class",
    location: "REPs Studio, Manchester",
    date: "Wed 26 May",
    time: "18:00",
    duration: "50 min",
    amount: "£18.00",
    status: "Refund requested",
  },
  {
    id: "REP-2821",
    client: { name: "Noah Ellis", initials: "NE" },
    service: "Onboarding Assessment",
    type: "In-person",
    location: "REPs Studio, Manchester",
    date: "Tue 25 May",
    time: "09:00",
    duration: "75 min",
    amount: "£90.00",
    status: "Refund requested",
  },
]);

const TYPE_MIX = [
  { label: "1:1 In-person", value: "62%", count: "91 bookings", bar: 62 },
  { label: "Online consultations", value: "24%", count: "35 bookings", bar: 24 },
  { label: "Group classes", value: "14%", count: "20 bookings", bar: 14 },
];

/* ============================================================
   HELPERS
   ============================================================ */

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    Confirmed: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
    Pending: "bg-amber-500/12 text-amber-300 border-amber-500/25",
    Completed: "bg-white/8 text-white/70 border-white/15",
    Cancelled: "bg-white/6 text-white/50 border-white/12",
    "Refund requested": "bg-reps-orange-soft text-reps-orange border-reps-orange-border",
    "No-show": "bg-rose-500/12 text-rose-300 border-rose-500/25",
  };
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}

function TypeIcon({ type }: { type: Booking["type"] }) {
  if (type === "Online") return <Video className="h-3.5 w-3.5" />;
  if (type === "Class") return <Users className="h-3.5 w-3.5" />;
  return <MapPin className="h-3.5 w-3.5" />;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-semibold text-reps-orange">
      {initials}
    </span>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function BookingsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="flex-1 px-8 pb-12 pt-6">
            {/* KPI ROW */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {KPIS.map((k) => (
                <Card key={k.label} className="!p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                    {k.label}
                  </div>
                  <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">
                    {k.value}
                  </div>
                  <div
                    className={`mt-2 text-[11px] font-medium ${
                      k.tone === "up"
                        ? "text-emerald-300"
                        : k.tone === "down"
                          ? "text-rose-300"
                          : k.tone === "warn"
                            ? "text-reps-orange"
                            : "text-white/55"
                    }`}
                  >
                    {k.delta}
                  </div>
                </Card>
              ))}
            </div>

            {/* MAIN GRID */}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* LEFT — bookings table */}
              <div className="xl:col-span-8">
                <Panel>
                  {/* Filter / search bar */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-reps-border px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: "All", count: 146, active: true },
                        { label: "Upcoming", count: 38 },
                        { label: "Today", count: 7 },
                        { label: "Completed", count: 92 },
                        { label: "Cancelled", count: 9 },
                        { label: "Refund requested", count: 3 },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          className={`flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] font-medium transition-colors ${
                            chip.active
                              ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                              : "border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
                          }`}
                        >
                          {chip.label}
                          <span
                            className={`text-[10px] font-semibold ${
                              chip.active ? "text-reps-orange/80" : "text-white/45"
                            }`}
                          >
                            {chip.count}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="flex h-9 w-[220px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                        <Search className="h-3.5 w-3.5" />
                        <span className="flex-1">Search client or service…</span>
                      </div>
                      <button
                        type="button"
                        className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white"
                      >
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                      </button>
                      <button
                        type="button"
                        className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Last 30 days
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-reps-border text-[11px] font-semibold uppercase tracking-wider text-white/45">
                          <th className="px-5 py-3 font-semibold">Client</th>
                          <th className="px-3 py-3 font-semibold">Service</th>
                          <th className="px-3 py-3 font-semibold">When</th>
                          <th className="px-3 py-3 font-semibold">Type</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 text-right font-semibold">Amount</th>
                          <th className="px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {BOOKINGS.map((b) => (
                          <tr
                            key={b.id}
                            className="border-b border-reps-border/60 last:border-b-0 hover:bg-reps-panel-soft/60"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <Avatar initials={b.client.initials} />
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-semibold text-white">
                                    {b.client.name}
                                  </div>
                                  <div className="text-[11px] text-white/45">{b.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="text-[13px] text-white/85">{b.service}</div>
                              <div className="mt-0.5 text-[11px] text-white/45">
                                {b.duration}
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="text-[13px] text-white/85">{b.date}</div>
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/45">
                                <Clock className="h-3 w-3" />
                                {b.time}
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-reps-border bg-reps-panel-soft px-2.5 text-[11px] font-medium text-white/75">
                                <TypeIcon type={b.type} />
                                {b.type}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="px-3 py-3.5 text-right font-semibold text-white">
                              {b.amount}
                            </td>
                            <td className="px-3 py-3.5 text-right">
                              <button
                                type="button"
                                aria-label="Booking actions"
                                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/60 shadow-none hover:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-reps-border px-5 py-3 text-[12px] text-white/55">
                    <span>Showing 9 of 146 bookings</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex h-8 items-center rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 font-semibold text-white/75 shadow-none hover:text-white"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="flex h-8 items-center rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 font-semibold text-white/75 shadow-none hover:text-white"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </Panel>

                {/* Booking type mix */}
                <Card className="mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">
                        Booking mix — last 30 days
                      </h3>
                      <p className="mt-0.5 text-[12px] text-white/55">
                        Where your bookings are coming from.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white"
                    >
                      View report
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-5 space-y-4">
                    {TYPE_MIX.map((row) => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-white/80">{row.label}</span>
                          <span className="text-white/55">
                            {row.count} · <span className="text-white">{row.value}</span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-reps-panel-soft">
                          <div
                            className="h-full rounded-full bg-reps-orange"
                            style={{ width: `${row.bar}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* RIGHT — today + refunds */}
              <div className="space-y-6 xl:col-span-4">
                <Panel>
                  <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">Today</h3>
                      <p className="mt-0.5 text-[12px] text-white/55">
                        Monday, 31 May · 7 sessions
                      </p>
                    </div>
                    <Link
                      to="/dashboard/calendar"
                      className="text-[12px] font-semibold text-reps-orange hover:text-reps-orange-hover"
                    >
                      Calendar
                    </Link>
                  </div>
                  <ul className="divide-y divide-reps-border/60">
                    {TODAY.map((b) => (
                      <li key={b.id} className="flex items-start gap-3 px-5 py-3.5">
                        <div className="flex w-12 shrink-0 flex-col items-center rounded-[8px] border border-reps-border bg-reps-panel-soft py-1">
                          <span className="text-[11px] font-semibold text-reps-orange">
                            {b.time}
                          </span>
                          <span className="text-[10px] text-white/50">{b.duration}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {b.client.name}
                          </div>
                          <div className="truncate text-[12px] text-white/60">
                            {b.service}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-white/45">
                            <TypeIcon type={b.type} />
                            {b.location}
                          </div>
                        </div>
                        <StatusBadge status={b.status} />
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel>
                  <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">
                        Refund queue
                      </h3>
                      <p className="mt-0.5 text-[12px] text-white/55">
                        3 requests awaiting your decision
                      </p>
                    </div>
                    <span className="flex h-6 items-center rounded-full bg-reps-orange-soft px-2.5 text-[11px] font-semibold text-reps-orange">
                      Action needed
                    </span>
                  </div>
                  <ul className="divide-y divide-reps-border/60">
                    {REFUNDS.map((b) => (
                      <li key={b.id} className="px-5 py-3.5">
                        <div className="flex items-start gap-3">
                          <Avatar initials={b.client.initials} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-[13px] font-semibold text-white">
                                {b.client.name}
                              </span>
                              <span className="text-[12px] font-semibold text-white">
                                {b.amount}
                              </span>
                            </div>
                            <div className="truncate text-[12px] text-white/60">
                              {b.service} · {b.date}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-reps-orange text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft text-[12px] font-semibold text-white/80 shadow-none hover:text-white"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Decline
                          </button>
                          <button
                            type="button"
                            aria-label="More"
                            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/60 shadow-none hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Card>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold text-white">
                        AI booking insight
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                        Tuesday 09:00–11:00 has been your most cancelled window in the last
                        4 weeks. Consider blocking it for admin or moving Marcus Hall's
                        recurring slot to 07:00.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="flex h-8 items-center rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                        >
                          Apply suggestion
                        </button>
                        <button
                          type="button"
                          className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
