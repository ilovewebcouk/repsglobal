import { Fragment } from "react";
/**
 * Reusable, presentation-only platform mockups.
 * Pure Tailwind + REPs tokens — no real data, no images required.
 * Used on /for-professionals and across /features/* pages.
 */
import {
  Activity,
  BadgeCheck,
  Calendar,
  Check,
  ChevronRight,
  CircleDot,
  CreditCard,
  Dumbbell,
  FileText,
  Inbox,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

/* ---------------- shared chrome ---------------- */

function AppSidebar({ active }: { active: string }) {
  const items = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Calendar", icon: Calendar },
    { label: "Clients", icon: Users },
    { label: "Programmes", icon: Dumbbell },
    { label: "Messages", icon: MessageSquare },
    { label: "Payments", icon: CreditCard },
    { label: "Insights", icon: LineChart },
  ];
  return (
    <aside className="hidden w-[180px] shrink-0 border-r border-reps-border bg-reps-panel/40 px-3 py-4 md:block">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="font-display text-[15px] font-bold text-white">REPs</span>
        <span className="rounded-[6px] bg-reps-orange-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-reps-orange">
          Pro
        </span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {items.map((i) => {
          const isActive = i.label === active;
          return (
            <span
              key={i.label}
              className={
                isActive
                  ? "flex items-center gap-2 rounded-[8px] bg-reps-orange-soft px-2 py-1.5 text-[12px] font-semibold text-reps-orange"
                  : "flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[12px] text-white/65"
              }
            >
              <i.icon className="h-3.5 w-3.5" />
              {i.label}
            </span>
          );
        })}
      </nav>
    </aside>
  );
}

function AppTopbar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-reps-border bg-reps-panel/30 px-5 py-3">
      <h3 className="font-display text-[14px] font-semibold text-white">{title}</h3>
      <div className="flex items-center gap-2">
        <span className="hidden h-7 w-[180px] items-center gap-2 rounded-[8px] border border-reps-border bg-reps-ink px-2 text-[11px] text-white/50 sm:flex">
          <Search className="h-3 w-3" /> Search…
        </span>
        <span className="h-7 w-7 rounded-full bg-reps-orange/80" />
      </div>
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-1 font-display text-[18px] font-bold text-white">{value}</div>
      {delta && <div className="mt-0.5 text-[10px] text-reps-green">{delta}</div>}
    </div>
  );
}

/* ---------------- 1. Dashboard ---------------- */

export function DashboardMockup() {
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Good morning, Sophie" />
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          <Stat label="This week" value="14 sessions" delta="+3 vs last" />
          <Stat label="Revenue (MTD)" value="£2,840" delta="+18%" />
          <Stat label="New leads" value="6" delta="2 unread" />
          <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Today · Tuesday
              </div>
              <span className="text-[10px] text-reps-orange">4 sessions</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {[
                ["07:00", "Emma R.", "1-1 PT"],
                ["09:30", "Marcus B.", "Strength block"],
                ["12:00", "Lina F.", "Onboarding"],
                ["17:30", "James K.", "Mobility"],
              ].map(([t, n, k]) => (
                <li
                  key={t}
                  className="flex items-center justify-between rounded-[8px] bg-reps-ink/60 px-2 py-1.5"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-white/55">{t}</span>
                    <span className="font-medium text-white">{n}</span>
                  </span>
                  <span className="text-[10px] text-white/45">{k}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
              Leads inbox
            </div>
            <ul className="mt-2 space-y-2">
              {[
                ["Tom W.", "Fat loss · 2x/week"],
                ["Aoife M.", "Pre-natal"],
                ["Carlos D.", "Strength"],
              ].map(([n, m]) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-reps-orange" />
                  <div>
                    <div className="text-[11px] font-semibold text-white">{n}</div>
                    <div className="text-[10px] text-white/55">{m}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 2. Bookings ---------------- */

export function BookingsMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sessions: { day: number; row: number; len: number; label: string; tag: string }[] = [
    { day: 0, row: 0, len: 1, label: "Emma R.", tag: "PT" },
    { day: 0, row: 4, len: 1, label: "Group HIIT", tag: "Class" },
    { day: 1, row: 1, len: 2, label: "Marcus B.", tag: "Strength" },
    { day: 2, row: 0, len: 1, label: "Lina F.", tag: "Onboard" },
    { day: 2, row: 3, len: 2, label: "James K.", tag: "Mobility" },
    { day: 3, row: 2, len: 1, label: "Aoife M.", tag: "Pre-natal" },
    { day: 4, row: 0, len: 1, label: "Tom W.", tag: "Intro" },
    { day: 4, row: 4, len: 1, label: "Sarah L.", tag: "PT" },
    { day: 5, row: 1, len: 2, label: "Group Strength", tag: "Class" },
  ];
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Calendar" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="This week · 14 sessions · £540 deposits" />
        <div className="grid h-[calc(100%-49px)] grid-cols-[36px_repeat(6,1fr)] gap-px bg-reps-border p-px">
          <div className="bg-reps-panel" />
          {days.map((d) => (
            <div
              key={d}
              className="flex items-center justify-center bg-reps-panel py-1 text-[10px] font-semibold uppercase tracking-wider text-white/55"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: 6 }).map((_, row) => (
            <Fragment key={row}>
              <div className="flex items-start justify-end bg-reps-panel pr-1 pt-0.5 font-mono text-[9px] text-white/40">
                {7 + row * 2}:00
              </div>
              {days.map((_, day) => {
                const s = sessions.find((x) => x.day === day && x.row === row);
                return (
                  <div key={`${day}-${row}`} className="relative bg-reps-panel">
                    {s && (
                      <div
                        className="absolute inset-x-0.5 top-0.5 rounded-[6px] border border-reps-orange-border bg-reps-orange-soft p-1"
                        style={{ height: `calc(${s.len * 100}% - 4px)` }}
                      >
                        <div className="text-[10px] font-semibold text-white">{s.label}</div>
                        <div className="text-[9px] text-reps-orange">{s.tag}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 3. Payments ---------------- */

export function PaymentsMockup() {
  const rows = [
    ["Emma Robinson", "Block of 10", "£450", "Paid"],
    ["Marcus Bell", "Monthly subscription", "£189", "Paid"],
    ["Lina Fischer", "Onboarding session", "£60", "Paid"],
    ["Aoife Murphy", "Pre-natal block", "£320", "Pending"],
    ["James Karim", "Single session", "£45", "Paid"],
  ];
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Payments" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Payments · February" />
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <Stat label="MRR" value="£3,240" delta="+12%" />
          <Stat label="Next payout" value="£1,820" delta="Fri 28 Feb" />
          <Stat label="Subscriptions" value="38 active" delta="3 new" />
        </div>
        <div className="mx-4 overflow-hidden rounded-[12px] border border-reps-border">
          <table className="w-full">
            <thead>
              <tr className="bg-reps-panel/60 text-left text-[10px] uppercase tracking-wider text-white/45">
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([c, i, a, s]) => (
                <tr key={c} className="border-t border-reps-border bg-reps-panel/30">
                  <td className="px-3 py-2 font-medium text-white">{c}</td>
                  <td className="px-3 py-2 text-white/65">{i}</td>
                  <td className="px-3 py-2 font-mono text-white">{a}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        s === "Paid"
                          ? "rounded-full bg-reps-green/15 px-2 py-0.5 text-[10px] font-semibold text-reps-green"
                          : "rounded-full bg-reps-gold/15 px-2 py-0.5 text-[10px] font-semibold text-reps-gold"
                      }
                    >
                      {s}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 4. Clients CRM ---------------- */

export function ClientsCrmMockup() {
  const clients = [
    { name: "Emma Robinson", goal: "Fat loss", last: "2d ago", img: proLaura },
    { name: "Marcus Bell", goal: "Strength", last: "Today", img: proJames, active: true },
    { name: "Lina Fischer", goal: "Mobility", last: "1d ago", img: proSophie },
    { name: "Aoife Murphy", goal: "Pre-natal", last: "4d ago", img: proLaura },
    { name: "James Karim", goal: "Sport", last: "Today", img: proDaniel },
  ];
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Clients" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Clients · 38 active" />
        <div className="grid h-[calc(100%-49px)] grid-cols-[1fr_1.2fr] divide-x divide-reps-border">
          <ul className="overflow-y-auto p-2">
            {clients.map((c) => (
              <li
                key={c.name}
                className={
                  c.active
                    ? "flex items-center gap-2 rounded-[10px] bg-reps-orange-soft p-2"
                    : "flex items-center gap-2 rounded-[10px] p-2 hover:bg-reps-panel/50"
                }
              >
                <img src={c.img} alt="" className="h-8 w-8 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-[10px] text-white/55">{c.goal}</div>
                </div>
                <div className="text-[10px] text-white/45">{c.last}</div>
              </li>
            ))}
          </ul>
          <div className="overflow-y-auto p-4">
            <div className="flex items-center gap-3">
              <img src={proJames} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <div className="font-display text-[14px] font-bold text-white">Marcus Bell</div>
                <div className="text-[10px] text-white/55">Strength · 12 weeks · 4× per week</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="Sessions" value="34" />
              <Stat label="Adherence" value="92%" />
              <Stat label="LTV" value="£1,840" />
            </div>
            <div className="mt-3 rounded-[10px] border border-reps-border bg-reps-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Recent notes</div>
              <p className="mt-1 text-[11px] text-white/80">
                Hit 140kg deadlift PB. Programme cycle 3 ends Friday — plan deload next.
              </p>
            </div>
            <div className="mt-3 rounded-[10px] border border-reps-border bg-reps-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Next session</div>
              <p className="mt-1 text-[11px] text-white">Today 09:30 · Strength block</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 5. Programmes ---------------- */

export function ProgrammesMockup() {
  const days = [
    { d: "Mon", title: "Upper push", items: ["Bench 4×6", "OHP 3×8", "Dips 3×10"] },
    { d: "Tue", title: "Conditioning", items: ["Row 5×500m", "Sled 6×40m"] },
    { d: "Wed", title: "Lower", items: ["Squat 4×5", "RDL 3×8", "Walking lunge 3×12"] },
    { d: "Thu", title: "Rest", items: ["Mobility 20 min"] },
    { d: "Fri", title: "Upper pull", items: ["Pull-up 4×6", "Row 4×8", "Curl 3×12"] },
  ];
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Programmes" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Programme · Strength block · Week 3 of 6" />
        <div className="grid h-[calc(100%-49px)] grid-cols-5 gap-2 p-3">
          {days.map((d) => (
            <div
              key={d.d}
              className="flex flex-col rounded-[12px] border border-reps-border bg-reps-panel p-2"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                {d.d}
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-white">{d.title}</div>
              <ul className="mt-2 space-y-1">
                {d.items.map((i) => (
                  <li
                    key={i}
                    className="rounded-[6px] bg-reps-ink/60 px-1.5 py-1 text-[10px] text-white/80"
                  >
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 6. Check-ins ---------------- */

export function CheckInsMockup() {
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Clients" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Check-in · Emma Robinson · Week 8" />
        <div className="grid h-[calc(100%-49px)] grid-cols-[1.1fr_1fr] gap-3 p-4">
          <div className="space-y-2">
            <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Form</div>
              <div className="mt-2 space-y-1.5">
                {[
                  ["Energy this week", "8/10"],
                  ["Sleep avg", "7.4h"],
                  ["Adherence", "5/5 sessions"],
                  ["Stress", "Low"],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between text-[11px]">
                    <span className="text-white/60">{l}</span>
                    <span className="font-semibold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Notes</div>
              <p className="mt-1 text-[11px] text-white/80">
                Big win — hit 8k steps every day. Knee twinge on Wed lower session, kept weight light.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Weight (kg)</div>
              <div className="mt-2 flex h-[80px] items-end gap-1">
                {[74, 73.4, 73.6, 72.9, 72.4, 71.8, 71.5, 71.2].map((w, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="rounded-t-[3px] bg-reps-orange"
                      style={{ height: `${(w - 70) * 22}px` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Photos</div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className="aspect-[3/4] rounded-[6px] bg-reps-panel-soft" />
                <div className="aspect-[3/4] rounded-[6px] bg-reps-panel-soft" />
                <div className="aspect-[3/4] rounded-[6px] bg-reps-panel-soft" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 7. Messaging ---------------- */

export function MessagesMockup() {
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Messages" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Messages · 3 unread" />
        <div className="grid h-[calc(100%-49px)] grid-cols-[1fr_1.4fr] divide-x divide-reps-border">
          <ul className="overflow-y-auto">
            {[
              { n: "Marcus Bell", p: "Smashed it today 💪", t: "2m", img: proJames, active: true },
              { n: "Emma Robinson", p: "Can we move tomorrow?", t: "1h", img: proLaura, unread: true },
              { n: "Lina Fischer", p: "Programme sent ✅", t: "3h", img: proSophie },
              { n: "Aoife Murphy", p: "Feeling much better", t: "1d", img: proLaura },
            ].map((c) => (
              <li
                key={c.n}
                className={
                  c.active
                    ? "flex items-start gap-2 border-l-2 border-reps-orange bg-reps-orange-soft/40 p-3"
                    : "flex items-start gap-2 border-l-2 border-transparent p-3 hover:bg-reps-panel/40"
                }
              >
                <img src={c.img} alt="" className="h-8 w-8 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{c.n}</span>
                    <span className="text-[10px] text-white/45">{c.t}</span>
                  </div>
                  <p className={c.unread ? "truncate text-[11px] text-white" : "truncate text-[11px] text-white/60"}>
                    {c.p}
                  </p>
                </div>
                {c.unread && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-reps-orange" />}
              </li>
            ))}
          </ul>
          <div className="flex flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-[12px] rounded-bl-[4px] bg-reps-panel px-3 py-2 text-[11px] text-white/85">
                  Hit 140kg today. Felt good.
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-[12px] rounded-br-[4px] bg-reps-orange px-3 py-2 text-[11px] text-white">
                  Massive. Deload next week, then we push 145.
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-[12px] rounded-bl-[4px] bg-reps-panel px-3 py-2 text-[11px] text-white/85">
                  Smashed it today 💪
                </div>
              </div>
            </div>
            <div className="border-t border-reps-border p-2">
              <div className="mb-1.5 flex flex-wrap gap-1">
                {["Nice work 🔥", "See you Friday", "Send programme"].map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-reps-orange-border bg-reps-orange-soft px-2 py-0.5 text-[10px] text-reps-orange"
                  >
                    <Sparkles className="mr-1 inline h-2.5 w-2.5" />
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-2 py-1.5">
                <span className="flex-1 text-[11px] text-white/45">Type a message…</span>
                <Send className="h-3.5 w-3.5 text-reps-orange" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 8. Leads ---------------- */

export function LeadsMockup() {
  const cols = [
    {
      title: "New",
      count: 6,
      cards: [
        ["Tom W.", "Fat loss · 2×/wk", "£45 budget"],
        ["Aoife M.", "Pre-natal", "Asks about insurance"],
        ["Carlos D.", "Strength", "Online ok"],
      ],
    },
    {
      title: "Qualified",
      count: 4,
      cards: [
        ["Sarah L.", "Mobility · 1×/wk", "Replied Tue"],
        ["Dev P.", "Sport · rugby", "Call booked"],
      ],
    },
    {
      title: "Booked",
      count: 3,
      cards: [
        ["Maria G.", "Block of 10", "£450 paid"],
        ["Olu N.", "Onboarding", "Today 12:00"],
      ],
    },
  ];
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Clients" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Lead pipeline · 13 active" />
        <div className="grid h-[calc(100%-49px)] grid-cols-3 gap-2 p-3">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col rounded-[12px] bg-reps-panel/40 p-2">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] font-semibold text-white">{c.title}</span>
                <span className="rounded-full bg-reps-panel px-1.5 text-[10px] text-white/55">
                  {c.count}
                </span>
              </div>
              <div className="space-y-1.5">
                {c.cards.map(([n, g, m]) => (
                  <div
                    key={n}
                    className="rounded-[10px] border border-reps-border bg-reps-panel p-2"
                  >
                    <div className="text-[11px] font-semibold text-white">{n}</div>
                    <div className="text-[10px] text-white/55">{g}</div>
                    <div className="mt-1 text-[10px] text-reps-orange">{m}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 9. Insights ---------------- */

export function InsightsMockup() {
  const months = [42, 51, 58, 64, 71, 82, 78, 96];
  return (
    <div className="flex h-[420px] text-[12px] text-white/85">
      <AppSidebar active="Insights" />
      <div className="flex-1 overflow-hidden">
        <AppTopbar title="Insights · Last 8 weeks" />
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          <Stat label="Revenue" value="£12.4k" delta="+24%" />
          <Stat label="Retention" value="92%" delta="+4 pts" />
          <Stat label="New clients" value="11" delta="+3" />
          <div className="rounded-[12px] border border-reps-border bg-reps-panel p-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-white">Revenue trend</div>
              <span className="text-[10px] text-reps-green">+24% vs prior 8 wks</span>
            </div>
            <div className="mt-3 flex h-[120px] items-end gap-2">
              {months.map((m, i) => (
                <div key={i} className="flex-1">
                  <div
                    className="rounded-t-[4px] bg-gradient-to-t from-reps-orange/40 to-reps-orange"
                    style={{ height: `${m}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[12px] border border-reps-orange-border bg-reps-orange-soft p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
              <Sparkles className="h-3 w-3" />
              Next move
            </div>
            <p className="mt-1 text-[11px] font-medium text-white">
              3 leads from last week unreplied. Replying within 24h converts 2.4× more often.
            </p>
            <button className="mt-2 rounded-[8px] bg-reps-orange px-2 py-1 text-[10px] font-semibold text-white">
              View leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 10. Public profile preview ---------------- */

export function ProfileMockup() {
  return (
    <div className="h-[420px] overflow-hidden bg-reps-ivory text-reps-charcoal">
      <div className="grid h-full grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden">
          <img src={proSophie} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-reps-orange">
              <BadgeCheck className="h-3 w-3" />
              REPs Verified
            </div>
            <div className="mt-2 font-display text-[18px] font-bold text-white">Sophie Williams</div>
            <div className="text-[11px] text-white/85">Pilates Instructor · Manchester</div>
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          <div className="flex items-center gap-1 text-[11px]">
            <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
            <span className="font-semibold">4.9</span>
            <span className="text-reps-muted-light">· 128 reviews</span>
          </div>
          <h4 className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-reps-muted-light">
            Specialisms
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["Reformer Pilates", "Pre-natal", "Rehab", "Mobility"].map((s) => (
              <span
                key={s}
                className="rounded-full border border-reps-stone bg-reps-warm-white px-2 py-0.5 text-[10px]"
              >
                {s}
              </span>
            ))}
          </div>
          <h4 className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-reps-muted-light">
            Services
          </h4>
          <ul className="mt-1.5 space-y-1.5">
            {[
              ["1-1 Reformer", "£65 · 60 min"],
              ["Group class", "£18 · 50 min"],
              ["Online programme", "£99/mo"],
            ].map(([n, p]) => (
              <li
                key={n}
                className="flex items-center justify-between rounded-[10px] border border-reps-stone bg-reps-warm-white px-2.5 py-1.5"
              >
                <span className="text-[11px] font-medium">{n}</span>
                <span className="text-[10px] text-reps-orange">{p}</span>
              </li>
            ))}
          </ul>
          <button className="mt-3 w-full rounded-[10px] bg-reps-orange py-2 text-[11px] font-semibold text-white">
            Enquire now
          </button>
        </div>
      </div>
    </div>
  );
}
