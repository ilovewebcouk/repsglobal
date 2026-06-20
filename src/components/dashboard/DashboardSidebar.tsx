import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  AreaChart,
  ArrowRight,
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
  Megaphone,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  Target,
  UserCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { cn } from "@/lib/utils";

import { useAccountMenu } from "@/hooks/use-account-menu";
import { useEffectiveIdentity } from "@/hooks/use-effective-identity";
import { useSessionUser } from "@/hooks/use-session-user";
import { useReviewsUnread } from "@/hooks/useReviewsUnread";
import { useSupportUnread } from "@/hooks/useSupportUnread";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTrustState } from "@/lib/verification/trust.functions";
import { getEnquiryStats } from "@/lib/enquiries/enquiries.functions";
import { VerifiedCountChip } from "@/components/verification/VerifiedBadge";
import { initialsFromName } from "@/lib/initials";

import type {
  AdminActive,
  DashboardActive,
  DashboardShellMember,
  Role,
  Tier,
  TrainerActive,
} from "./DashboardShell.types";

/* ------------------------------------------------------------------------- */
/* Nav data (tier-aware)                                                      */
/* ------------------------------------------------------------------------- */

type NavItem<L extends string = string> = {
  icon: LucideIcon;
  label: L;
  to: string;
  badge?: string;
};
type NavGroup<L extends string = string> = { title: string; items: NavItem<L>[] };

const VERIFIED_NAV: NavGroup<TrainerActive>[] = [
  {
    title: "Account",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: Inbox, label: "Enquiries", to: "/dashboard/enquiries" },
      { icon: Star, label: "Reviews", to: "/dashboard/reviews" },
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
      { icon: Store, label: "Shop-front", to: "/dashboard/shop-front" },
      { icon: Tag, label: "Services", to: "/dashboard/services" },
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
      { icon: CreditCard, label: "Stripe", to: "/dashboard/payments" },
      { icon: Briefcase, label: "Business Tools", to: "/dashboard/business" },
      { icon: Settings, label: "Settings", to: "/dashboard/settings" },
    ],
  },
];

function trainerNav(tier: Tier): NavGroup<TrainerActive>[] {
  if (tier === "verified") return VERIFIED_NAV;
  return PRO_NAV;
}

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
      { icon: CreditCard, label: "Stripe", to: "/admin/payments" },
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
/* Live counter badges                                                        */
/* ------------------------------------------------------------------------- */

function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
      {children}
    </span>
  );
}

function VerificationCountBadge() {
  const { user } = useSessionUser();
  const fetchTrust = useServerFn(getTrustState);
  const { data } = useQuery({
    queryKey: ["my-trust-state"],
    queryFn: () => fetchTrust(),
    staleTime: 30_000,
    enabled: !!user,
  });
  const completed = (data?.completedCount ?? 0) as 0 | 1 | 2 | 3;
  return <VerifiedCountChip completed={completed} />;
}

function EnquiriesUnreadBadge() {
  const { user } = useSessionUser();
  const fetchStats = useServerFn(getEnquiryStats);
  const { data } = useQuery({
    queryKey: ["my-enquiry-stats"],
    queryFn: () => fetchStats(),
    staleTime: 30_000,
    enabled: !!user,
  });
  const unread = data?.unread ?? 0;
  if (!unread) return null;
  return <CountPill>{unread > 99 ? "99+" : unread}</CountPill>;
}

function SupportUnreadBadge() {
  const { unread } = useSupportUnread();
  if (!unread) return null;
  return <CountPill>{unread > 99 ? "99+" : unread}</CountPill>;
}

function ReviewsUnreadBadge() {
  const { user } = useSessionUser();
  const { unread } = useReviewsUnread({ enabled: !!user });
  if (!unread) return null;
  return <CountPill>{unread > 99 ? "99+" : unread}</CountPill>;
}

function ItemBadge({ item }: { item: NavItem }) {
  if (item.label === "Verification" && item.to === "/dashboard/verification") {
    return <VerificationCountBadge />;
  }
  if (item.label === "Enquiries" && item.to === "/dashboard/enquiries") {
    return <EnquiriesUnreadBadge />;
  }
  if (item.label === "Support" && item.to === "/admin/support") {
    return <SupportUnreadBadge />;
  }
  if (
    item.label === "Reviews" &&
    (item.to === "/admin/reviews" || item.to === "/dashboard/reviews")
  ) {
    return <ReviewsUnreadBadge />;
  }
  if (item.badge) return <CountPill>{item.badge}</CountPill>;
  return null;
}

/* ------------------------------------------------------------------------- */
/* Footer                                                                     */
/* ------------------------------------------------------------------------- */

function MemberRow({ member }: { member?: DashboardShellMember }) {
  const id = useEffectiveIdentity();
  const name = id.name ?? member?.name ?? "REPS Member";
  const email = id.email;
  const avatarUrl = id.avatarUrl ?? member?.avatarUrl ?? null;
  const headline = email ?? member?.headline ?? "Professional";
  const tierLabel = id.tierLabel ?? member?.tierLabel ?? null;
  const initials = initialsFromName(name);
  const tierBadgeClass = id.isImpersonating
    ? "mt-1 border-reps-orange-border bg-reps-orange/20 text-reps-orange hover:bg-reps-orange/20"
    : "mt-1 border-reps-orange-border bg-reps-orange-soft text-reps-orange hover:bg-reps-orange-soft";

  return (
    <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
      <Avatar className="size-9 rounded-[10px] group-data-[collapsible=icon]:size-8">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="rounded-[10px]" /> : null}
        <AvatarFallback className="rounded-[10px] bg-reps-panel-soft text-[11px] text-white/60">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <div className="truncate text-[13px] font-semibold text-white">{name}</div>
        <div className="truncate text-[11px] text-white/55">{headline}</div>
        {tierLabel ? <Badge className={tierBadgeClass}>{tierLabel}</Badge> : null}
      </div>
    </div>
  );
}

function AdminBadgeRow() {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-reps-orange-soft px-3 py-2 group-data-[collapsible=icon]:hidden">
      <ShieldCheck className="h-4 w-4 text-reps-orange" />
      <span className="text-[12px] font-semibold text-reps-orange">REPS Admin</span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* DashboardSidebar                                                           */
/* ------------------------------------------------------------------------- */

function NavSectionGroup({ group, active }: { group: NavGroup; active: DashboardActive }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
        {group.title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            // Pathname is the primary signal — `active` is only a fallback for
            // routes whose pathname doesn't exactly match an item's `to`.
            const isActive = pathname === item.to || item.label === active;
            const Icon = item.icon;
            const badge = <ItemBadge item={item} />;
            return (
              <SidebarMenuItem key={`${group.title}:${item.label}`}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "h-10 rounded-[10px] text-[13px] font-medium text-white/70 hover:bg-reps-panel hover:text-white",
                    "data-[active=true]:bg-reps-orange-soft data-[active=true]:text-reps-orange data-[active=true]:hover:bg-reps-orange/20 data-[active=true]:hover:text-reps-orange",
                  )}
                >
                  <Link
                    to={item.to}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge className="bg-transparent p-0 text-inherit">
                  {badge}
                </SidebarMenuBadge>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardSidebar({
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
  const id = useEffectiveIdentity();
  const groups: NavGroup[] =
    role === "admin" ? (ADMIN_NAV as NavGroup[]) : (trainerNav(tier) as NavGroup[]);

  const homeHref = role === "admin" ? "/admin" : "/dashboard";

  return (
    <Sidebar collapsible="icon" className="border-r border-reps-border">
      <SidebarHeader className="gap-2 px-4 pb-2 pt-4 group-data-[collapsible=icon]:px-2">
        <Link
          to={homeHref}
          className="flex items-center justify-center"
          aria-label="REPS dashboard home"
        >
          <RepsWordmark className="h-[18px] text-white group-data-[collapsible=icon]:hidden" />
          <span className="hidden font-display text-[18px] font-bold text-white group-data-[collapsible=icon]:inline">
            R
          </span>
        </Link>
        {role === "admin" ? <AdminBadgeRow /> : null}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {groups.map((g) => (
          <NavSectionGroup key={g.title} group={g} active={active} />
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 px-3 pb-4 group-data-[collapsible=icon]:px-2">
        <MemberRow member={member} />
        {role === "trainer" && account.isAdmin && !id.isImpersonating ? (
          <>
            <Button
              asChild
              variant="outline"
              className="justify-between text-foreground group-data-[collapsible=icon]:hidden"
            >
              <Link to="/admin">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Admin console
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label="Admin console"
              className="hidden size-9 group-data-[collapsible=icon]:flex"
            >
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : null}
        {role === "trainer" && tier === "verified" && !id.isImpersonating ? (
          <>
            <Button asChild className="justify-between group-data-[collapsible=icon]:hidden">
              <Link to="/pricing">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Pro
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="icon"
              aria-label="Upgrade to Pro"
              className="hidden size-9 group-data-[collapsible=icon]:flex"
            >
              <Link to="/pricing">
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
