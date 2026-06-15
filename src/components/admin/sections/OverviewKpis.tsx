import type { LucideIcon } from "lucide-react";
import { TrendingUp, Users, UserCheck, UserPlus, Wallet } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";

function KpiSparkline() {
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <defs>
        <linearGradient id="kpiSpark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 24 L10 22 L20 23 L30 18 L40 20 L50 14 L60 17 L70 10 L80 13 L90 7 L100 9 L100 32 L0 32 Z"
        fill="url(#kpiSpark)"
      />
      <path
        d="M0 24 L10 22 L20 23 L30 18 L40 20 L50 14 L60 17 L70 10 L80 13 L90 7 L100 9"
        fill="none"
        stroke="var(--reps-orange)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  delta,
  sub,
  trend = "up",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  sub: string;
  trend?: "up" | "down";
}) {
  const color = trend === "up" ? "text-reps-green" : "text-reps-red";
  return (
    <AdminCard>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-white/55">{label}</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-[26px] font-bold leading-none text-white">
              {value}
            </span>
            <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${color}`}>
              <TrendingUp className="h-3 w-3" /> {delta}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-white/45">{sub}</div>
        </div>
      </div>
      <div className="mt-3">
        <KpiSparkline />
      </div>
    </AdminCard>
  );
}



export function OverviewKpis() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        icon={Users}
        label="Total Professionals"
        value="24,892"
        delta="12.4%"
        sub="vs last 30 days 22,150"
        trend="up"
      />
      <KpiTile
        icon={UserCheck}
        label="Total Members"
        value="156,783"
        delta="8.7%"
        sub="vs last 30 days 144,163"
        trend="up"
      />
      <KpiTile
        icon={UserPlus}
        label="New Registrations"
        value="1,842"
        delta="15.3%"
        sub="vs last 30 days 1,598"
        trend="up"
      />
      <KpiTile
        icon={Wallet}
        label="Total Revenue"
        value="£128,480"
        delta="14.3%"
        sub="vs last 30 days £112,480"
        trend="up"
      />
    </div>
  );
}
