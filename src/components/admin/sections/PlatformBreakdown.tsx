import { ChevronRight } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";
import { PanelHeader } from "@/components/admin/PanelHeader";
import { RangePill } from "@/components/admin/RangePill";

function BreakdownDonut() {
  const segments = [
    { value: 74.5, color: "var(--reps-green)" },
    { value: 14.0, color: "var(--reps-orange)" },
    { value: 7.4, color: "var(--reps-red)" },
    { value: 4.1, color: "#5D6573" },
  ];
  const r = 50;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="h-[140px] w-[140px]" aria-hidden>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--reps-panel-soft)" strokeWidth="20" />
      {segments.map((s, i) => {
        const len = (s.value / 100) * c;
        const el = (
          <circle
            key={i}
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="20"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

function WorldMap() {
  return (
    <svg viewBox="0 0 220 140" className="h-[140px] w-full" aria-hidden>
      <path d="M10 30 Q 20 18 38 22 Q 55 18 60 40 Q 58 60 42 66 Q 24 70 14 55 Z" fill="var(--reps-orange)" opacity="0.7" />
      <path d="M48 76 Q 58 72 60 90 Q 56 110 48 118 Q 40 110 42 92 Z" fill="var(--reps-orange)" opacity="0.45" />
      <path d="M100 28 Q 112 22 120 30 Q 124 42 116 48 Q 104 50 98 40 Z" fill="var(--reps-orange)" opacity="0.95" />
      <path d="M108 58 Q 124 56 130 78 Q 126 100 116 108 Q 104 100 104 80 Z" fill="var(--reps-orange)" opacity="0.5" />
      <path d="M130 26 Q 160 18 188 30 Q 196 50 180 60 Q 154 62 138 52 Z" fill="var(--reps-orange)" opacity="0.65" />
      <path d="M174 90 Q 192 88 198 100 Q 192 112 178 110 Q 168 102 174 92 Z" fill="var(--reps-orange)" opacity="0.8" />
    </svg>
  );
}

function Funnel() {
  const rows = [
    { label: "5,763", sub: "", w: 100, color: "var(--reps-orange)" },
    { label: "3,842", sub: "(66.7%)", w: 80, color: "var(--reps-orange-hover)" },
    { label: "2,481", sub: "(43.1%)", w: 60, color: "var(--reps-orange-dark)" },
    { label: "1,842", sub: "(32.0%)", w: 42, color: "#A85200" },
  ];
  return (
    <div className="space-y-2.5 py-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-center">
          <div
            className="flex h-10 items-center justify-end rounded-[8px] px-4 text-[12px] font-semibold text-white"
            style={{ background: r.color, width: `${r.w}%` }}
          >
            <span>
              {r.label}{" "}
              {r.sub ? <span className="font-normal opacity-80">{r.sub}</span> : null}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BreakdownRowItem({ color, label, count, pct }: { color: string; label: string; count: string; pct: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-white/80">{label}</span>
      <span className="w-12 text-right font-semibold text-white/80">{count}</span>
      <span className="w-12 text-right text-white/50">({pct})</span>
    </li>
  );
}

function GeoRow({ color, label, pct }: { color: string; label: string; pct: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-white/80">{label}</span>
      <span className="font-semibold text-white/80">{pct}</span>
    </li>
  );
}

export function PlatformBreakdown() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <AdminCard>
        <PanelHeader title="Professional Breakdown" right={<RangePill label="By Status" />} />
        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
          <BreakdownDonut />
          <ul className="space-y-2.5 text-[12px]">
            <BreakdownRowItem color="var(--reps-green)" label="Verified" count="18,542" pct="74.5%" />
            <BreakdownRowItem color="var(--reps-orange)" label="Pending" count="3,482" pct="14.0%" />
            <BreakdownRowItem color="var(--reps-red)" label="Suspended" count="1,852" pct="7.4%" />
            <BreakdownRowItem color="#5D6573" label="Expired" count="1,016" pct="4.1%" />
          </ul>
        </div>
        <div className="mt-3 text-center">
          <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
            View all professionals <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </AdminCard>

      <AdminCard>
        <PanelHeader title="Geographic Distribution" right={<RangePill label="By Country" />} />
        <div className="grid grid-cols-[1fr_140px] gap-4">
          <WorldMap />
          <ul className="space-y-2.5 text-[12px]">
            <GeoRow color="var(--reps-orange)" label="United States" pct="34%" />
            <GeoRow color="var(--reps-orange-hover)" label="United Kingdom" pct="22%" />
            <GeoRow color="var(--reps-orange-dark)" label="Australia" pct="14%" />
            <GeoRow color="#A85200" label="Canada" pct="10%" />
            <GeoRow color="#5D6573" label="Other" pct="20%" />
          </ul>
        </div>
        <div className="mt-3 text-center">
          <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
            View full geographic report <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </AdminCard>

      <AdminCard>
        <PanelHeader title="Lead Conversion Funnel" right={<RangePill />} />
        <Funnel />
        <div className="mt-3 text-center">
          <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline">
            View full funnel analysis <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
