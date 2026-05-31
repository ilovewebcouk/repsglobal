import { Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  Bell,
  ClipboardCheck,
  Dumbbell,
  Home,
  LineChart,
  MessagesSquare,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type PortalActive = "Today" | "Programme" | "Nutrition" | "Check-ins" | "Messages";

const NAV: { label: PortalActive; to: string; icon: LucideIcon }[] = [
  { label: "Today", to: "/portal/today", icon: Home },
  { label: "Programme", to: "/portal/programme", icon: Dumbbell },
  { label: "Nutrition", to: "/portal/nutrition", icon: Apple },
  { label: "Check-ins", to: "/portal/check-ins", icon: LineChart },
  { label: "Messages", to: "/portal/messages", icon: MessagesSquare },
];

function Sidebar({ active }: { active: PortalActive }) {
  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col border-r border-reps-border bg-reps-panel md:flex">
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange text-white">
          <Activity className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-white">REPs</span>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/45">
            Client portal
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-reps-orange-soft text-reps-orange"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-reps-border px-3 py-3">
        <Link
          to="/portal/today"
          className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium text-white/65 hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex items-center gap-4 border-b border-reps-border bg-reps-panel/60 px-6 py-4 backdrop-blur">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[18px] font-semibold tracking-tight text-white">{title}</div>
        <div className="truncate text-[12.5px] text-white/55">{subtitle}</div>
      </div>
      <button className="hidden h-10 w-72 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white/55 lg:flex">
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search foods, workouts…</span>
      </button>
      <button className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-reps-border bg-reps-ink text-white/70 hover:text-white">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-reps-orange" />
      </button>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange text-[13px] font-semibold text-white">
        S
      </div>
    </header>
  );
}

export function ClientShell({
  active,
  title,
  subtitle,
  children,
}: {
  active: PortalActive;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-reps-ink text-reps-text">
      <div className="flex h-screen">
        <Sidebar active={active} />
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <TopBar title={title} subtitle={subtitle} />
          <main className="flex-1 px-6 pb-12 pt-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PortalCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[18px] border border-reps-border bg-reps-panel p-5 ${className}`}>
      {children}
    </section>
  );
}

export { ClipboardCheck };
