import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, AlertTriangle, CreditCard, Gauge, Mail, Radio, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: "/admin/ops", label: "Hub", icon: Gauge },
  { to: "/admin/billing", label: "Billing", icon: CreditCard },
  { to: "/admin/ops/platform", label: "Platform", icon: Activity },
  { to: "/admin/ops/customer", label: "Customer", icon: Users },
  { to: "/admin/ops/email", label: "Email", icon: Mail },
  { to: "/admin/ops/activity", label: "Activity", icon: Radio },
  { to: "/admin/ops/alerts", label: "Alerts", icon: AlertTriangle },
];

/**
 * Persistent sub-nav strip rendered on every `/admin/ops/*` page so operators
 * can hop between Hub / Billing / Platform / Customer / Email / Activity /
 * Alerts in one click without going back to the Hub.
 */
export function OpsSubNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="sticky top-0 z-10 -mx-6 mb-6 flex flex-wrap gap-1 border-b border-reps-border bg-reps-ink/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/75">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.to === "/admin/ops"
            ? pathname === "/admin/ops"
            : pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold transition ${
              active
                ? "bg-reps-orange-soft text-reps-orange"
                : "text-white/65 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
