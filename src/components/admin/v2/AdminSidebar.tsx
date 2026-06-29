// Admin v2 sidebar — REPs-branded operator console nav.
//
// Brand-orange active state via the locked --brand-orange token; never raw hex.
// Phase C ships Overview + Member 360; the other items route to stub pages so
// the shell is fully navigable while Phase C2 wires the real cockpits.

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Scale,
  TrendingDown,
  Users,
  ArrowLeft,
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
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const ITEMS = [
  { title: "Overview", to: "/admin/v2", icon: LayoutDashboard, exact: true },
  { title: "Members", to: "/admin/v2/members", icon: Users },
  { title: "Billing", to: "/admin/v2/billing", icon: CreditCard },
  { title: "Churn", to: "/admin/v2/churn", icon: TrendingDown },
  { title: "Reconciliation", to: "/admin/v2/reconciliation", icon: Scale },
  { title: "Operations", to: "/admin/v2/ops", icon: Activity },
  { title: "Support", to: "/admin/v2/support", icon: LifeBuoy },
] as const;

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-12 items-center gap-2 px-2">
          <div
            className="flex size-7 items-center justify-center rounded-[8px] font-display text-xs font-semibold text-white"
            style={{ background: "var(--brand-orange)" }}
          >
            R
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold">REPs Admin</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                v2 · mirror-first
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Console</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map((item) => {
                const active = isActive(item.to, "exact" in item ? item.exact : false);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={
                        active
                          ? "border-l-2 border-[var(--brand-orange)] bg-[color-mix(in_oklab,var(--brand-orange)_12%,transparent)] text-foreground hover:bg-[color-mix(in_oklab,var(--brand-orange)_16%,transparent)]"
                          : ""
                      }
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to legacy admin">
              <Link to="/admin">
                <ArrowLeft />
                <span>Legacy admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
