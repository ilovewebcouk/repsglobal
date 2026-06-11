import { Link, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  Bell,
  Briefcase,
  Calendar as CalendarIcon,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  LockKeyhole,
  Menu,
  Search,
  Settings,
  Sparkles,
  Star,
  Target,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type ProActive =
  | "Dashboard"
  | "Leads"
  | "Clients"
  | "Calendar"
  | "Bookings"
  | "Messages"
  | "Programs"
  | "Nutrition"
  | "Check-Ins"
  | "Reviews"
  | "Reports"
  | "Content Studio"
  | "Community"
  | "Education & CPD"
  | "Public Profile"
  | "Payments"
  | "Business Tools"
  | "Settings";

type NavItem = {
  icon: LucideIcon;
  label: ProActive;
  to: string;
  badge?: string;
};

type NavGroup = { title: string; items: NavItem[] };

export type ProShellMember = {
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  tierLabel?: string;
};

const VERIFIED_ROUTES = new Set(["/dashboard", "/dashboard/profile-edit", "/dashboard/settings"]);

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Work",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: Target, label: "Leads", to: "/dashboard/leads" },
      { icon: Users, label: "Clients", to: "/dashboard/clients" },
      { icon: CalendarIcon, label: "Calendar", to: "/dashboard/calendar" },
      { icon: CreditCard, label: "Bookings", to: "/dashboard/bookings" },
      { icon: MessagesSquare, label: "Messages", to: "/dashboard/messages" },
    ],
  },
  {
    title: "Deliver",
    items: [
      { icon: Dumbbell, label: "Programs", to: "/dashboard/programs" },
      { icon: Apple, label: "Nutrition", to: "/dashboard/nutrition" },
      { icon: ClipboardList, label: "Check-Ins", to: "/dashboard/check-ins" },
      { icon: Star, label: "Reviews", to: "/dashboard/reviews" },
    ],
  },
  {
    title: "Grow",
    items: [
      { icon: AreaChart, label: "Reports", to: "/dashboard/reports" },
      { icon: FileText, label: "Content Studio", to: "/dashboard/content" },
      { icon: Users, label: "Community", to: "/dashboard/community" },
      { icon: GraduationCap, label: "Education & CPD", to: "/dashboard/cpd" },
      { icon: UserCircle, label: "Public Profile", to: "/dashboard/profile-edit" },
    ],
  },
  {
    title: "Money & Admin",
    items: [
      { icon: CreditCard, label: "Payments", to: "/dashboard/payments" },
      { icon: Briefcase, label: "Business Tools", to: "/dashboard/business" },
      { icon: Settings, label: "Settings", to: "/dashboard/settings" },
    ],
  },
];

function Sidebar({ active, hasProAccess, member }: { active: ProActive; hasProAccess: boolean; member?: ProShellMember }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const initials = (member?.name ?? "REPS Member").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex h-full flex-col bg-reps-midnight">
      <Link to="/" className="flex items-center gap-3 px-5 pb-6 pt-6">
        <RepsWordmark className="h-[22px] text-white" />
        <span className="border-l border-white/15 pl-3 text-[10px] leading-tight text-white/65">
          The Register of
          <br />
          Exercise Professionals
        </span>
      </Link>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
              {group.title}
            </div>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = item.label === active || pathname === item.to;
                const locked = !hasProAccess && !VERIFIED_ROUTES.has(item.to);
                const base =
                  "flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors";
                const cls = isActive
                  ? `${base} bg-reps-orange-soft text-reps-orange`
                  : `${base} text-white/70 hover:bg-reps-panel hover:text-white`;
                return (
                  <li key={item.label}>
                    <Link
                      to={locked ? "/dashboard/start" : item.to}
                      search={locked ? { tier: "pro", period: "monthly" } : undefined}
                      className={cn(cls, locked && "text-white/45")}
                      aria-label={locked ? `${item.label} — included with Pro` : item.label}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {locked ? <LockKeyhole className="size-3.5" /> : null}
                      {item.badge ? (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-3 px-3 pb-5">
        <div className="flex items-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-3">
          <Avatar className="size-10">
            <AvatarImage src={member?.avatarUrl ?? proJames} alt="" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">{member?.name ?? "James Carter"}</div>
            <div className="truncate text-[11px] text-white/55">{member?.headline ?? "Personal Trainer"}</div>
            <Badge className="mt-1 border-reps-orange-border bg-reps-orange-soft text-reps-orange">{member?.tierLabel ?? "Pro"}</Badge>
          </div>
        </div>
        <Button asChild variant="outline" disabled={!hasProAccess}>
          <Link to={hasProAccess ? "/dashboard" : "/dashboard/start"} search={hasProAccess ? undefined : { tier: "pro", period: "monthly" }}>
          <Sparkles className="h-4 w-4" />
          {hasProAccess ? "AI Assistant" : "Explore Pro"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TopBar({
  title,
  subtitle,
  actions,
  mobileNav,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  mobileNav?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7">
      <div className="flex min-w-0 items-center gap-3">
        {mobileNav}
        <div className="min-w-0">
        <h1 className="font-display text-[22px] font-bold leading-tight text-white">{title}</h1>
        <p className="mt-0.5 text-[13px] text-white/55">{subtitle}</p>
        </div>
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
        <Button variant="outline" size="icon" aria-label="Notifications" disabled>
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export function ProShell({
  active,
  title,
  subtitle,
  actions,
  hasProAccess = true,
  member,
  children,
}: {
  active: ProActive;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  hasProAccess?: boolean;
  member?: ProShellMember;
  children: React.ReactNode;
}) {
  const mobileNav = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open dashboard navigation">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] border-reps-border bg-reps-midnight p-0">
        <SheetTitle className="sr-only">Professional dashboard navigation</SheetTitle>
        <SheetDescription className="sr-only">Navigate between your REPs dashboard areas.</SheetDescription>
        <Sidebar active={active} hasProAccess={hasProAccess} member={member} />
      </SheetContent>
    </Sheet>
  );
  return (
    <div className="h-screen bg-reps-ink text-reps-text">
      <div className="flex h-screen">
        <aside className="hidden h-screen w-[232px] shrink-0 border-r border-reps-border lg:block">
          <Sidebar active={active} hasProAccess={hasProAccess} member={member} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <TopBar title={title} subtitle={subtitle} actions={actions} mobileNav={mobileNav} />
          <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</main>
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
