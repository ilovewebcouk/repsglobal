import { Link } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  Bell,
  Calendar as CalendarIcon,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";

export type ProActive =
  | "Dashboard"
  | "Clients"
  | "Calendar"
  | "Bookings"
  | "Programs"
  | "Nutrition"
  | "Check-Ins"
  | "Messages"
  | "Leads"
  | "Payments"
  | "Reports"
  | "Content Studio"
  | "Education & CPD"
  | "Community"
  | "Business Tools"
  | "Settings";

type NavItem = {
  icon: LucideIcon;
  label: ProActive;
  to?: string;
  badge?: string;
};

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Users, label: "Clients" },
  { icon: CalendarIcon, label: "Calendar", to: "/dashboard/calendar" },
  { icon: CreditCard, label: "Bookings", to: "/dashboard/bookings" },
  { icon: Dumbbell, label: "Programs", to: "/dashboard/programs" },
  { icon: Apple, label: "Nutrition", to: "/dashboard/nutrition" },
  { icon: ClipboardList, label: "Check-Ins", to: "/dashboard/check-ins" },
  { icon: MessagesSquare, label: "Messages", to: "/dashboard/messages", badge: "6" },
  { icon: Target, label: "Leads", to: "/dashboard/leads" },
  { icon: CreditCard, label: "Payments", to: "/dashboard/payments" },
  { icon: AreaChart, label: "Reports" },
  { icon: FileText, label: "Content Studio" },
  { icon: GraduationCap, label: "Education & CPD", to: "/dashboard/cpd" },
  { icon: Users, label: "Community" },
  { icon: Wrench, label: "Business Tools" },
  { icon: Settings, label: "Settings", to: "/dashboard/settings" },
];

function Sidebar({ active }: { active: ProActive }) {
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
            const isActive = item.label === active;
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
            const cls = isActive
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
          <img src={proJames} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">James Carter</div>
            <div className="truncate text-[11px] text-white/55">Personal Trainer</div>
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

function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-6 px-8 pt-7">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-bold leading-tight text-white">{title}</h1>
        <p className="mt-0.5 text-[13px] text-white/55">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-[240px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel px-3 text-[13px] text-white/55 md:flex">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search…</span>
          <kbd className="rounded-[6px] border border-reps-border bg-reps-ink px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
            ⌘K
          </kbd>
        </div>
        {actions}
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

export function ProShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: ProActive;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <div className="flex min-h-screen">
        <Sidebar active={active} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} subtitle={subtitle} actions={actions} />
          <main className="flex-1 px-8 pb-12 pt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PCard({
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

export function PPanel({
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
