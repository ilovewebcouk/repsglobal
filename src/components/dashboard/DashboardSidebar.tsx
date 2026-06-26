import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

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
import { useMySupportUnread } from "@/hooks/useMySupportUnread";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTrustState } from "@/lib/verification/trust.functions";
import { getEnquiryStats } from "@/lib/enquiries/enquiries.functions";
import { VerifiedCountChip } from "@/components/verification/VerifiedBadge";
import { initialsFromName } from "@/lib/initials";

import type {
  DashboardActive,
  DashboardShellMember,
  Role,
  Tier,
} from "./DashboardShell.types";
import {
  ADMIN_NAV,
  PRO_NAV,
  VERIFIED_NAV,
  type NavGroup,
  type NavItem,
} from "./nav-data";

/* ------------------------------------------------------------------------- */
/* Nav data (tier-aware)                                                      */
/* ------------------------------------------------------------------------- */

function trainerNav(tier: Tier): readonly NavGroup[] {
  if (tier === "verified") return VERIFIED_NAV;
  return PRO_NAV;
}

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

function FooterItemBadge({ item }: { item: NavItem }) {
  if (item.label === "Support" && item.to === "/admin/support") {
    return <SupportUnreadBadge />;
  }
  if (item.label === "Support" && item.to === "/dashboard/support") {
    return <MySupportUnreadBadge />;
  }
  if (item.badge) return <CountPill>{item.badge}</CountPill>;
  return null;
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
  const { isAdmin } = useSessionUser();
  const { unread } = useSupportUnread({ enabled: isAdmin });
  if (!unread) return null;
  return <CountPill>{unread > 99 ? "99+" : unread}</CountPill>;
}

function MySupportUnreadBadge() {
  const { user } = useSessionUser();
  const { unread } = useMySupportUnread({ enabled: !!user });
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
  if (item.label === "Support" && item.to === "/dashboard/support") {
    return <MySupportUnreadBadge />;
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
    <div
      className={cn(
        // Framed in expanded mode, borderless in icon mode.
        "flex items-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel-soft/40 p-2.5",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0",
      )}
    >
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
            // Pathname-only match (label fallback removed — typecheck now
            // guarantees every `active` value corresponds to a nav item).
            const isActive = pathname === item.to || item.label === active;
            const Icon = item.icon;
            const badge = <ItemBadge item={item} />;
            const hasBadge =
              item.badge !== undefined ||
              item.label === "Verification" ||
              item.label === "Enquiries" ||
              item.label === "Support" ||
              item.label === "Reviews";
            
            return (
              <SidebarMenuItem key={`${group.title}:${item.label}`}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "h-10 rounded-[10px] text-[13px] font-medium text-white/70 hover:bg-reps-panel hover:text-white",
                    "data-[active=true]:bg-reps-orange-soft data-[active=true]:text-reps-orange data-[active=true]:hover:bg-reps-orange/25 data-[active=true]:hover:text-reps-orange",
                  )}
                >
                  <Link
                    to={item.to}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="relative inline-flex shrink-0">
                      <Icon className="h-[18px] w-[18px]" />
                      {/* Dot indicator visible only in icon-collapsed mode
                          when the item carries a badge — keeps unread state
                          discoverable on the rail. */}
                      {hasBadge ? (
                        <span
                          aria-hidden
                          className="absolute -right-1 -top-1 hidden h-1.5 w-1.5 rounded-full bg-reps-orange group-data-[collapsible=icon]:block"
                        />
                      ) : null}
                    </span>
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups: readonly NavGroup[] = role === "admin" ? ADMIN_NAV : trainerNav(tier);
  const scrollableGroups = groups.filter(
    (g) => g.title !== "Help" && g.title !== "System",
  );
  const preFooterItems = groups
    .filter((g) => g.title === "Help" || g.title === "System")
    .flatMap((g) => g.items);

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

      <SidebarContent
        className={cn(
          "px-2",
          // Themed thin scrollbar — replaces the ugly native one when the
          // nav overflows on shorter viewports. Firefox + WebKit.
          "[scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/0.12)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/25",
          "[&::-webkit-scrollbar-button]:hidden",
        )}
      >
        {scrollableGroups.map((g) => (
          <NavSectionGroup key={g.title} group={g} active={active} />
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 px-3 pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        {preFooterItems.length > 0 ? (
          <SidebarMenu className="gap-1">
            {preFooterItems.map((item) => {
              const isActive = pathname === item.to || item.label === active;
              const Icon = item.icon;
              const badge = <FooterItemBadge item={item} />;
              const hasBadge = item.badge !== undefined || item.label === "Support";
              return (
                <SidebarMenuItem key={`footer:${item.label}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      "h-10 rounded-[10px] text-[13px] font-medium text-white/70 hover:bg-reps-panel hover:text-white",
                      "data-[active=true]:bg-reps-orange-soft data-[active=true]:text-reps-orange data-[active=true]:hover:bg-reps-orange/25 data-[active=true]:hover:text-reps-orange",
                    )}
                  >
                    <Link
                      to={item.to}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="relative inline-flex shrink-0">
                        <Icon className="h-[18px] w-[18px]" />
                        {hasBadge ? (
                          <span
                            aria-hidden
                            className="absolute -right-1 -top-1 hidden h-1.5 w-1.5 rounded-full bg-reps-orange group-data-[collapsible=icon]:block"
                          />
                        ) : null}
                      </span>
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
        ) : null}
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
              <Link to="/contact">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Join Pro waitlist
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="icon"
              aria-label="Join Pro waitlist"
              className="hidden size-9 group-data-[collapsible=icon]:flex"
            >
              <Link to="/contact">
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
