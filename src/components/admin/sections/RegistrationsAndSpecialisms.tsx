import { ChevronRight } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";
import { PanelHeader } from "@/components/admin/PanelHeader";
import { RangePill } from "@/components/admin/RangePill";

const SPECIALISMS = [
  { label: "Personal Training", pct: "28%", count: "6,969", color: "var(--reps-orange)" },
  { label: "Strength & Conditioning", pct: "18%", count: "4,480", color: "var(--reps-blue)" },
  { label: "Pilates", pct: "14%", count: "3,486", color: "var(--reps-green)" },
  { label: "Nutrition", pct: "11%", count: "2,738", color: "var(--reps-gold)" },
  { label: "Sports Coaching", pct: "9%", count: "2,239", color: "#9B6BE2" },
  { label: "Pre & Postnatal", pct: "7%", count: "1,743", color: "var(--reps-orange)" },
  { label: "Other", pct: "13%", count: "3,237", color: "#5D6573" },
];

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function RegistrationsChart() {
  const proPath =
    "M0 110 C 30 90, 60 100, 90 80 S 150 60, 180 70 S 240 50, 270 55 S 330 40, 360 45 S 420 30, 450 35";
  const memPath =
    "M0 80 C 30 70, 60 60, 90 65 S 150 40, 180 45 S 240 30, 270 35 S 330 20, 360 25 S 420 15, 450 20";
  return (
    <svg viewBox="0 0 450 160" className="h-[180px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="regProArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="regMemArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-blue)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--reps-blue)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 40, 80, 120].map((y) => (
        <line key={y} x1="0" x2="450" y1={y + 10} y2={y + 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={`${memPath} L 450 160 L 0 160 Z`} fill="url(#regMemArea)" />
      <path d={`${proPath} L 450 160 L 0 160 Z`} fill="url(#regProArea)" />
      <path d={memPath} fill="none" stroke="var(--reps-blue)" strokeWidth="2" strokeLinecap="round" />
      <path d={proPath} fill="none" stroke="var(--reps-orange)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SpecialismsDonut() {
  const segments = [
    { value: 28, color: "var(--reps-orange)" },
    { value: 18, color: "var(--reps-blue)" },
    { value: 14, color: "var(--reps-green)" },
    { value: 11, color: "var(--reps-gold)" },
    { value: 9, color: "#9B6BE2" },
    { value: 7, color: "var(--reps-orange-hover)" },
    { value: 13, color: "#5D6573" },
  ];
  const r = 56;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" className="h-[160px] w-[160px]" aria-hidden>
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--reps-panel-soft)" strokeWidth="22" />
      {segments.map((s, i) => {
        const len = (s.value / 100) * c;
        const dash = `${len} ${c - len}`;
        const el = (
          <circle
            key={i}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="22"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform="rotate(-90 80 80)"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export function RegistrationsAndSpecialisms() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AdminCard size="panel">
        <PanelHeader title="Registrations Over Time" right={<RangePill label="Daily" />} />
        <div className="flex items-center gap-6 text-[12px] text-white/65">
          <Legend color="var(--reps-orange)" label="Professionals" value="1,842" />
          <Legend color="var(--reps-blue)" label="Members" value="5,763" />
        </div>
        <div className="mt-3">
          <RegistrationsChart />
        </div>
        <div className="mt-2 text-center">
          <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
            View full analytics <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </AdminCard>

      <AdminCard size="panel">
        <PanelHeader title="Top Specialisms" right={<RangePill label="By Professionals" />} />
        <div className="grid grid-cols-[160px_1fr] items-center gap-6">
          <SpecialismsDonut />
          <ul className="space-y-2.5">
            {SPECIALISMS.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-[12px]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-white/80">{s.label}</span>
                <span className="w-10 text-right font-semibold text-white/70">{s.pct}</span>
                <span className="w-14 text-right text-white/55">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3 text-center">
          <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
            View all specialisms <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
