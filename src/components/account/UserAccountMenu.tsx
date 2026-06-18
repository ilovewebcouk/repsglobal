import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  LogOut,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  UserCircle,
  CreditCard,
  Target,
  MessagesSquare,
  CalendarCheck,
  Heart,
  Globe,
  Users,
  BadgeCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/account/UserAvatar";
import { useAccountMenu, type AccountRole } from "@/hooks/use-account-menu";
import { cn } from "@/lib/utils";

export type UserAccountMenuSurface = "public" | "dashboard";

type Item = {
  to: string;
  label: string;
  icon: LucideIcon;
};

function itemsForRole(role: AccountRole): Item[] {
  switch (role) {
    case "admin":
      return [
        { to: "/admin", label: "Admin console", icon: ShieldCheck },
        { to: "/admin/professionals", label: "Professionals", icon: Users },
        { to: "/admin/verification", label: "Verification", icon: BadgeCheck },
        { to: "/admin/memberships", label: "Memberships", icon: CreditCard },
        { to: "/admin/settings", label: "Settings", icon: Settings },
      ];
    case "pro":
    case "studio":
      return [
        { to: "/dashboard", label: "My dashboard", icon: LayoutDashboard },
        { to: "/dashboard/profile", label: "Public profile", icon: UserCircle },
        { to: "/dashboard/leads", label: "Leads", icon: Target },
        { to: "/dashboard/messages", label: "Messages", icon: MessagesSquare },
        { to: "/dashboard/payments", label: "Payments", icon: CreditCard },
        { to: "/dashboard/settings", label: "Settings", icon: Settings },
      ];
    case "verified":
      return [
        { to: "/dashboard", label: "My dashboard", icon: LayoutDashboard },
        { to: "/dashboard/profile", label: "Public profile", icon: UserCircle },
        { to: "/dashboard/settings", label: "Settings", icon: Settings },
      ];
    case "client":
      return [
        { to: "/portal/today", label: "My bookings", icon: CalendarCheck },
        { to: "/find-a-professional", label: "Saved pros", icon: Heart },
        { to: "/portal/messages", label: "Messages", icon: MessagesSquare },
        { to: "/portal/profile", label: "Account settings", icon: Settings },
      ];
    default:
      return [];
  }
}

function roleBadgeClass(role: AccountRole) {
  if (role === "admin") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }
  return "border-reps-orange-border bg-reps-orange-soft text-reps-orange";
}

export function UserAccountMenu({
  surface,
  className,
}: {
  surface: UserAccountMenuSurface;
  className?: string;
}) {
  const { user, role, tier, isAdmin, isProfessional, roleLabel, avatarUrl, signOut } =
    useAccountMenu();

  if (!user) return null;

  const items = itemsForRole(role);
  const showUpgrade = role === "verified" && isProfessional;
  // Dual-role: admin + professional → expose a Switch view block.
  const dualProRole: AccountRole | null =
    isAdmin && isProfessional ? (tier ?? "verified") : null;

  // The avatar IS the trigger. No chevron, no wrapper div, no name.
  const ringClass =
    surface === "public"
      ? "ring-1 ring-white/25 hover:ring-white/60 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink"
      : "ring-1 ring-reps-border hover:ring-reps-orange/60 focus-visible:ring-2 focus-visible:ring-reps-orange/70";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "inline-flex items-center justify-center rounded-[10px] transition-shadow focus:outline-none",
            ringClass,
            className,
          )}
        >
          <UserAvatar
            name={user.name}
            avatarUrl={avatarUrl}
            size="md"
            className="size-10 rounded-[10px]"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[260px] rounded-[16px] border border-reps-stone bg-white p-1.5 text-reps-charcoal"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center gap-3">
            <UserAvatar name={user.name} avatarUrl={avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold leading-tight text-reps-charcoal">
                {user.name}
              </div>
              <div className="truncate text-[11px] font-normal leading-tight text-reps-charcoal/60">
                {user.email}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "mt-1 h-5 rounded-full border px-2 text-[10px] font-semibold uppercase tracking-wide",
                  roleBadgeClass(role),
                )}
              >
                {roleLabel}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        {dualProRole ? (
          <>
            <DropdownMenuSeparator className="my-1 bg-reps-stone" />
            <DropdownMenuLabel className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
              Switch view
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
                <Link to="/admin">
                  <ShieldCheck className="mr-2 size-4 text-reps-orange" aria-hidden />
                  Admin console
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 size-4 text-reps-orange" aria-hidden />
                  Professional dashboard
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}

        <DropdownMenuSeparator className="my-1 bg-reps-stone" />
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.to}
              asChild
              className="rounded-[10px] focus:bg-reps-warm-white"
            >
              <Link to={item.to}>
                <item.icon className="mr-2 size-4 text-reps-orange" aria-hidden />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        {isAdmin ? (
          <>
            <DropdownMenuSeparator className="my-1 bg-reps-stone" />
            <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
              <Link to="/">
                <Globe className="mr-2 size-4 text-reps-orange" aria-hidden />
                View public site
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        {showUpgrade ? (
          <>
            <DropdownMenuSeparator className="my-1 bg-reps-stone" />
            <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
              <Link to="/pricing" className="font-semibold text-reps-orange">
                <Sparkles className="mr-2 size-4 text-reps-orange" aria-hidden />
                Upgrade to Pro
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator className="my-1 bg-reps-stone" />
        <DropdownMenuItem
          onSelect={() => {
            void signOut();
          }}
          className="rounded-[10px] focus:bg-reps-warm-white"
        >
          <LogOut className="mr-2 size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
