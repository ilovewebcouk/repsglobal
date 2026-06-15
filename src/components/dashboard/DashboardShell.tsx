import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileCheck,
  FileText,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Megaphone,
  MessagesSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";


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
import { UserAccountMenu } from "@/components/account/UserAccountMenu";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { useSupportUnread } from "@/hooks/useSupportUnread";


import { useAccountMenu } from "@/hooks/use-account-menu";
import { initialsFromName } from "@/lib/initials";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTrustState } from "@/lib/verification/trust.functions";
import { getEnquiryStats } from "@/lib/enquiries/enquiries.functions";
import { VerifiedCountChip } from "@/components/verification/VerifiedBadge";




/* ------------------------------------------------------------------------- */
/* Types                                                                      */
/* ------------------------------------------------------------------------- */

export type TrainerActive =
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
  | "Services"
  | "Shop-front"
  | "Enquiries"
  | "Edit Profile"
  | "Verification"
  | "Payments"
  | "Business Tools"
  | "Settings";

export type AdminActive =
  | "Overview"
  | "Professionals"
  | "Verification"
  | "Memberships"
  | "Directory"
  | "Gyms"
  | "Reviews"
  | "Payments"
  | "CPD"
  | "Migration"
  | "Support"
  | "Campaigns"
  | "Settings";

export type DashboardActive = TrainerActive | AdminActive;

export type Tier = "verified" | "pro" | "studio";
export type Role = "admin" | "trainer";

export type DashboardShellMember = {
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  tierLabel?: string;
};

type NavItem<L extends string = string> = {
  icon: LucideIcon;
  label: L;
  to: string;
  badge?: string;
};

type NavGroup<L extends string = string> = { title: string; items: NavItem<L>[] };

/* ------------------------------------------------------------------------- */
/* Trainer nav (tier-aware)                                                   */
/* ------------------------------------------------------------------------- */

const VERIFIED_NAV: NavGroup<TrainerActive>[] = [
  {
    title: "Account",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: Inbox, label: "Enquiries", to: "/dashboard/enquiries" },
      { icon: UserCircle, label: "Public Profile", to: "/dashboard/profile" },
      { icon: ShieldCheck, label: "Verification", to: "/dashboard/verification" },
      { icon: GraduationCap, label: "Education & CPD", to: "/dashboard/cpd" },
      { icon: Settings, label: "Settings", to: "/dashboard/settings" },
    ],
  },
];



const PRO_NAV: NavGroup<TrainerActive>[] = [
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
      { icon: UserCircle, label: "Public Profile", to: "/dashboard/profile" },
      { icon: ShieldCheck, label: "Verification", to: "/dashboard/verification" },
      { icon: GraduationCap, label: "Education & CPD", to: "/dashboard/cpd" },
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

function trainerNav(tier: Tier): NavGroup<TrainerActive>[] {
  if (tier === "verified") return VERIFIED_NAV;
  // Studio currently mirrors Pro; Studio-only nav slots are deferred.
  return PRO_NAV;
}

/* ------------------------------------------------------------------------- */
/* Admin nav                                                                  */
/* ------------------------------------------------------------------------- */

const ADMIN_NAV: NavGroup<AdminActive>[] = [
  {
    title: "Manage",
    items: [
      { icon: LayoutDashboard, label: "Overview", to: "/admin" },
      { icon: Users, label: "Professionals", to: "/admin/professionals" },
      { icon: ShieldCheck, label: "Verification", to: "/admin/verification" },
      { icon: UserCheck, label: "Memberships", to: "/admin/memberships" },
      { icon: Target, label: "Directory", to: "/admin/directory" },
      { icon: Building2, label: "Gyms", to: "/admin/gyms" },
      { icon: Star, label: "Reviews", to: "/admin/reviews" },
      { icon: CreditCard, label: "Payments", to: "/admin/payments" },
      { icon: GraduationCap, label: "CPD", to: "/admin/cpd" },
    ],
  },
  {
    title: "Platform",
    items: [
      { icon: FileCheck, label: "Migration", to: "/admin/migration", badge: "BD" },
      { icon: LifeBuoy, label: "Support", to: "/admin/support" },
      { icon: Megaphone, label: "Campaigns", to: "/admin/campaigns" },
      { icon: Settings, label: "Settings", to: "/admin/settings" },
    ],
  },
];

/* ------------------------------------------------------------------------- */
/* (Verification module nav removed — trust lives on /dashboard/profile.)     */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* ------------------------------------------------------------------------- */

function NavSection({
  group,
  active,
}: {
  group: NavGroup;
  active: DashboardActive;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-5">
      <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
        {group.title}
      </div>
      <ul className="flex flex-col gap-1">
        {group.items.map((item) => {
          const isActive = item.label === active || pathname === item.to;
          const base =
            "flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors";
          const cls = isActive
            ? `${base} bg-reps-orange-soft text-reps-orange`
            : `${base} text-white/70 hover:bg-reps-panel hover:text-white`;
          return (
            <li key={item.label}>
              <Link to={item.to} className={cls} aria-label={item.label}>
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.label === "Verification" && item.to === "/dashboard/verification" ? (
                  <VerificationCountBadge />
                ) : item.label === "Enquiries" && item.to === "/dashboard/enquiries" ? (
                  <EnquiriesUnreadBadge />
                ) : item.label === "Support" && item.to === "/admin/support" ? (
                  <SupportUnreadBadge />
                ) : item.badge ? (
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
  );
}

function MemberCard({ member }: { member?: DashboardShellMember }) {
  const account = useAccountMenu();
  // Prefer the real signed-in user; fall back to the prop (mock previews).
  const name = account.user?.name ?? member?.name ?? "REPS Member";
  const email = account.user?.email ?? null;
  const avatarUrl = account.avatarUrl ?? member?.avatarUrl ?? null;
  const headline = email ?? member?.headline ?? "Professional";
  const tierLabel = account.user
    ? account.roleLabel
    : member?.tierLabel ?? null;
  const initials = initialsFromName(name);
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-3">
      <Avatar className="size-10 rounded-[10px]">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="rounded-[10px]" /> : null}
        <AvatarFallback className="rounded-[10px] bg-reps-panel-soft text-white/40">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-white">{name}</div>
        <div className="truncate text-[11px] text-white/55">{headline}</div>
        {tierLabel ? (
          <Badge className="mt-1 border-reps-orange-border bg-reps-orange-soft text-reps-orange">
            {tierLabel}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}



function VerificationCountBadge() {
  const fetchTrust = useServerFn(getTrustState);
  const { data } = useQuery({
    queryKey: ["my-trust-state"],
    queryFn: () => fetchTrust(),
    staleTime: 30_000,
  });
  const completed = (data?.completedCount ?? 0) as 0 | 1 | 2 | 3;
  return <VerifiedCountChip completed={completed} />;
}

function EnquiriesUnreadBadge() {
  const fetchStats = useServerFn(getEnquiryStats);
  const { data } = useQuery({
    queryKey: ["my-enquiry-stats"],
    queryFn: () => fetchStats(),
    staleTime: 30_000,
  });
  const unread = data?.unread ?? 0;
  if (!unread) return null;
  return (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
      {unread > 99 ? "99+" : unread}
    </span>
  );
}

function SupportUnreadBadge() {
  const { unread } = useSupportUnread();
  if (!unread) return null;
  return (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
      {unread > 99 ? "99+" : unread}
    </span>
  );
}




function AdminBadge() {
  return (
    <div className="mx-3 mb-3 flex items-center gap-2 rounded-[10px] bg-reps-orange-soft px-3 py-2">
      <ShieldCheck className="h-4 w-4 text-reps-orange" />
      <span className="text-[12px] font-semibold text-reps-orange">REPS Admin</span>
    </div>
  );
}

function Sidebar({
  role,
  tier,
  active,
  member,
}: {
  role: Role;
  tier: Tier;
  active: DashboardActive;
  member?: DashboardShellMember;
}) {
  const account = useAccountMenu();
  const groups: NavGroup[] =
    role === "admin" ? (ADMIN_NAV as NavGroup[]) : (trainerNav(tier) as NavGroup[]);

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

      {role === "admin" ? <AdminBadge /> : null}

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <NavSection key={g.title} group={g} active={active} />
        ))}
      </nav>


      <div className="flex flex-col gap-3 px-3 pb-5">
        <MemberCard member={member} />
        {role === "trainer" && account.isAdmin ? (
          <Button asChild variant="outline" className="justify-between">
            <Link to="/admin">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Admin console
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
        {role === "trainer" && tier === "verified" ? (
          <Button asChild className="justify-between">
            <Link to="/pricing">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <Sparkles className="h-4 w-4" />
            AI Assistant · coming soon
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* TopBar                                                                     */
/* ------------------------------------------------------------------------- */

export type DashboardSearch = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

function TopBar({
  role,
  title,
  subtitle,
  actions,
  mobileNav,
  searchPlaceholder,
  search,
}: {
  role: Role;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  mobileNav?: React.ReactNode;
  searchPlaceholder: string;
  search?: DashboardSearch;
}) {

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (!search) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7">
      <div className="flex min-w-0 items-center gap-3">
        {mobileNav}
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-bold leading-tight text-white">{title}</h1>
          <p className="mt-0.5 text-[13px] text-white/55">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {search ? (
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/45" />
            <input
              ref={inputRef}
              type="search"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? searchPlaceholder}
              className="h-10 w-[260px] rounded-[12px] border border-reps-border bg-reps-panel pl-9 pr-12 text-[12.5px] text-white placeholder:text-white/45 shadow-none transition-colors focus-visible:outline-none focus-visible:border-reps-orange/60 focus-visible:bg-reps-panel-soft"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] border border-reps-border bg-reps-panel-soft px-1.5 py-0.5 text-[10px] font-medium text-white/55">
              ⌘K
            </kbd>
          </div>
        ) : (
          <div className="hidden h-10 w-[240px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel px-3 text-[13px] text-white/45 md:flex">
            <Search className="h-4 w-4" />
            <span className="flex-1">{searchPlaceholder}</span>
            <kbd className="rounded-[6px] border border-reps-border bg-reps-ink px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
              ⌘K
            </kbd>
          </div>
        )}

        {actions}
        {role === "admin" ? (
          <NotificationsBell />
        ) : (
          <Button
            variant="outline"
            size="icon"
            aria-label="Notifications"
            disabled
            className="border-reps-border bg-reps-panel text-white/70 transition-colors hover:bg-reps-panel-soft hover:text-white"
          >
            <Bell className="h-4 w-4" />
          </Button>
        )}

        <UserAccountMenu surface="dashboard" />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------------- */
/* Shell                                                                      */
/* ------------------------------------------------------------------------- */

export type DashboardShellProps = {
  /** "trainer" routes use tier-aware nav; "admin" uses admin nav. */
  role: Role;
  /** Required when role is "trainer". Ignored for admin. */
  tier?: Tier;
  active: DashboardActive;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  search?: DashboardSearch;
  member?: DashboardShellMember;
  children: React.ReactNode;
};

export function DashboardShell({
  role,
  // Least-privilege default. Trainer pages MUST pass `tier` explicitly
  // (usually from `useTrainerTier()`). If they don't, we render the
  // Verified nav set rather than silently leaking Pro/Studio links.
  tier = "verified",
  active,
  title,
  subtitle,
  actions,
  search,
  member,
  children,
}: DashboardShellProps) {
  const ariaLabel =
    role === "admin" ? "Admin dashboard navigation" : "Professional dashboard navigation";
  const searchPlaceholder =
    role === "admin" ? "Search professionals, members, leads…" : "Search…";

  const mobileNav = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open dashboard navigation">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] border-reps-border bg-reps-midnight p-0">
        <SheetTitle className="sr-only">{ariaLabel}</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate between your REPs dashboard areas.
        </SheetDescription>
        <Sidebar role={role} tier={tier} active={active} member={member} />
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-screen bg-reps-ink text-reps-text">
      <div className="flex h-screen">
        <aside className="hidden h-screen w-[232px] shrink-0 border-r border-reps-border lg:block">
          <Sidebar role={role} tier={tier} active={active} member={member} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <TopBar
            role={role}
            title={title}
            subtitle={subtitle}
            actions={actions}
            mobileNav={mobileNav}
            searchPlaceholder={searchPlaceholder}
            search={search}
          />
          <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
