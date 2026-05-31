import { Link } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CreditCard,
  FileCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Target,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";

export type AdminActive =
  | "Overview"
  | "Professionals"
  | "Verification"
  | "Memberships"
  | "Directory"
  | "Reviews"
  | "Payments"
  | "CPD"
  | "Migration"
  | "Support"
  | "Settings";

type NavItem = { icon: LucideIcon; label: AdminActive; to?: string; badge?: string };

const NAV_MANAGE: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", to: "/admin" },
  { icon: Users, label: "Professionals", to: "/admin/professionals" },
  { icon: ShieldCheck, label: "Verification", to: "/admin/verification" },
  { icon: UserCheck, label: "Memberships", to: "/admin/memberships" },
  { icon: Target, label: "Directory", to: "/admin/directory" },
  { icon: Star, label: "Reviews", to: "/admin/reviews" },
  { icon: CreditCard, label: "Payments", to: "/admin/payments" },
  { icon: GraduationCap, label: "CPD", to: "/admin/cpd" },
];

const NAV_PLATFORM: NavItem[] = [
  { icon: FileCheck, label: "Migration", to: "/admin/migration", badge: "BD" },
  { icon: LifeBuoy, label: "Support", to: "/admin/support", badge: "5" },
  { icon: Settings, label: "Settings", to: "/admin/settings" },
];

function Sidebar({ active }: { active: AdminActive }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-reps-border bg-reps-midnight lg:flex">
      <Link to="/" className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="font-display text-[26px] font-bold leading-none tracking-tight text-white">
          REPs
        </span>
        <span className="border-l border-white/15 pl-3 text-[10px] leading-tight text-white/65">
          The Register of
          <br />
          Exercise Professionals
        </span>
      </Link>

      <div className="mx-3 mb-3 flex items-center gap-2 rounded-[10px] bg-reps-orange-soft px-3 py-2">
        <ShieldCheck className="h-4 w-4 text-reps-orange" />
        <span className="text-[12px] font-semibold text-reps-orange">REPs Admin</span>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <NavSection title="Manage" items={NAV_MANAGE} active={active} />
        <NavSection title="Platform" items={NAV_PLATFORM} active={active} />
      </nav>

      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-3">
          <img src={proJames} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">James Admin</div>
            <div className="truncate text-[11px] text-white/55">Super Administrator</div>
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-reps-green">
              <span className="h-1.5 w-1.5 rounded-full bg-reps-green" />
              Online
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  title,
  items,
  active,
}: {
  title: string;
  items: NavItem[];
  active: AdminActive;
}) {
  return (
    <div className="mb-5">
      <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
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
    </div>
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
      <div>
        <h1 className="font-display text-[22px] font-bold leading-tight text-white">{title}</h1>
        <p className="mt-0.5 text-[13px] text-white/55">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-[320px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel px-3 text-[13px] text-white/55 md:flex">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search professionals, members, leads…</span>
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

export function AdminShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: AdminActive;
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

export function ACard({
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

export function APanel({
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
