import { ChevronRight } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";
import { PanelHeader } from "@/components/admin/PanelHeader";
import { Delta } from "@/components/admin/Delta";
import { RangePill } from "@/components/admin/RangePill";
import { StatTile } from "@/components/admin/StatTile";

function RevenueArea() {
  const path =
    "M0 110 C 25 95, 50 60, 70 55 S 110 80, 140 70 S 180 45, 210 50 S 260 60, 300 55 S 360 50, 400 48 L 450 50";
  return (
    <svg viewBox="0 0 450 160" className="h-[180px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="revArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 40, 80, 120].map((y) => (
        <line key={y} x1="0" x2="450" y1={y + 10} y2={y + 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={`${path} L 450 160 L 0 160 Z`} fill="url(#revArea)" />
      <path d={path} fill="none" stroke="var(--reps-orange)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MembershipBars() {
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const data = [
    { n: 70, r: 30 }, { n: 80, r: 35 }, { n: 78, r: 40 }, { n: 85, r: 42 },
    { n: 88, r: 45 }, { n: 92, r: 48 }, { n: 95, r: 52 }, { n: 100, r: 55 },
    { n: 96, r: 50 }, { n: 102, r: 56 }, { n: 105, r: 58 },
  ];
  const max = 170;
  return (
    <svg viewBox="0 0 450 180" className="h-[180px] w-full" preserveAspectRatio="none" aria-hidden>
      {[0, 40, 80, 120, 160].map((y) => (
        <line key={y} x1="0" x2="450" y1={160 - y} y2={160 - y} stroke="rgba(255,255,255,0.05)" />
      ))}
      {data.map((d, i) => {
        const x = 12 + i * 38;
        const newH = (d.n / max) * 160;
        const retH = (d.r / max) * 160;
        return (
          <g key={i}>
            <rect x={x} y={160 - newH} width="22" height={newH} rx="3" fill="var(--reps-orange)" />
            <rect x={x} y={160 - newH - retH} width="22" height={retH} rx="3" fill="var(--reps-blue)" />
            <text x={x + 11} y="178" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.45)">
              {months[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RevenueAndMembership() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AdminCard size="panel">
        <PanelHeader title="Revenue Overview" right={<RangePill />} />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">£128,480</span>
          <Delta value="14.3%" />
        </div>
        <div className="mt-1 text-[11px] text-white/45">vs last 30 days £112,480</div>
        <div className="mt-4">
          <RevenueArea />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <StatTile label="Total Revenue" value="£128,480" delta="14.3%" />
          <StatTile label="Subscriptions" value="£98,200" delta="12.6%" />
          <StatTile label="One-off Payments" value="£24,080" delta="18.7%" />
          <StatTile label="Refunds" value="£3,800" delta="5.2%" positive={false} />
        </div>
        <div className="mt-4 text-center">
          <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
            View full financial report <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </AdminCard>

      <AdminCard size="panel">
        <PanelHeader title="Membership Growth" right={<RangePill label="Last 12 months" />} />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">156,783</span>
          <Delta value="8.7%" />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[11px] text-white/45">vs previous 12 months 144,163</span>
          <div className="flex items-center gap-4 text-[11px] text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px] bg-reps-orange" /> New Members
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px] bg-reps-blue" /> Returning Members
            </span>
          </div>
        </div>
        <div className="mt-4">
          <MembershipBars />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-x-6 gap-y-3">
          <StatTile label="New Members" value="89,456" delta="9.2%" />
          <StatTile label="Returning Members" value="67,327" delta="7.9%" />
          <StatTile label="Retention Rate" value="71%" delta="3.4%" />
        </div>
        <div className="mt-4 text-center">
          <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
            View full membership report <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
