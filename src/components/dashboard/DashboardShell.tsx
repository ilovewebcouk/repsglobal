import * as React from "react";
import { Bell, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { UserAccountMenu } from "@/components/account/UserAccountMenu";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { RepsWordmark } from "@/components/brand/RepsWordmark";

import { DashboardSidebar } from "./DashboardSidebar";
import type {
  AdminActive,
  DashboardActive,
  DashboardShellMember,
  Role,
  Tier,
  TrainerActive,
} from "./DashboardShell.types";

// Re-export shared types for legacy import sites.
export type {
  AdminActive,
  DashboardActive,
  DashboardShellMember,
  Role,
  Tier,
  TrainerActive,
};

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
  searchPlaceholder,
  search,
}: {
  role: Role;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
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
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger
          aria-label="Toggle navigation"
          className={cn(
            "size-9 shrink-0 rounded-[10px] border border-reps-border bg-reps-panel text-white/70 hover:bg-reps-panel-soft hover:text-white",
          )}
        />
        <Link
          to={role === "admin" ? "/admin" : "/dashboard"}
          aria-label="REPS dashboard home"
          className="shrink-0 sm:hidden"
        >
          <RepsWordmark className="h-[16px] text-white" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[20px] font-bold leading-tight text-white sm:text-[22px]">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[13px] text-white/55">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
  const searchPlaceholder =
    role === "admin" ? "Search professionals, members, leads…" : "Search…";

  // Read the persisted sidebar state from cookie so the very first paint
  // matches the user's last choice (avoids an expanded→collapsed flash).
  const defaultOpen = React.useMemo(() => {
    if (typeof document === "undefined") return true;
    const match = document.cookie.match(/(?:^|; )sidebar_state=([^;]+)/);
    return match ? match[1] !== "false" : true;
  }, []);

  return (
    <div className="h-screen bg-reps-ink text-reps-text">
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "232px",
            "--sidebar-width-icon": "3.25rem",
          } as React.CSSProperties
        }
      >
        <DashboardSidebar role={role} tier={tier} active={active} member={member} />
        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-reps-ink">
          <ImpersonationBanner />
          <TopBar
            role={role}
            title={title}
            subtitle={subtitle}
            actions={actions}
            searchPlaceholder={searchPlaceholder}
            search={search}
          />
          <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
