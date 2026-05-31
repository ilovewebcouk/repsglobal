import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  ShieldCheck,
  Star,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { AdminShell } from "@\/components\/dashboard\/AdminShell";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — REPs" },
      {
        name: "description",
        content:
          "REPs Admin Dashboard — platform overview, registrations, verifications, revenue and system status.",
      },
      { property: "og:title", content: "REPs Admin Dashboard" },
      {
        property: "og:description",
        content:
          "Real-time overview of the REPs platform and key operational metrics.",
      },
      { property: "og:url", content: "/admin" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: AdminDashboardPage,
});

/* ============================================================
   PRIMITIVES
   ============================================================ */

function Card({
  children,
  className = "",
  size = "card",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "card" | "panel";
}) {
  const radius = size === "panel" ? "rounded-[22px]" : "rounded-[18px]";
  return (
    <div
      className={`${radius} border border-reps-border bg-reps-panel p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function PanelHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-[15px] font-semibold text-white">
        {title}
      </h2>
      {right}
    </div>
  );
}

function Delta({
  value,
  positive = true,
}: {
  value: string;
  positive?: boolean;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? "text-reps-green" : "text-reps-red";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[12px] font-semibold ${color}`}
    >
      <Icon className="h-3 w-3" /> {value}
    </span>
  );
}

function RangePill({ label = "Last 30 days" }: { label?: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none transition-colors hover:text-white"
    >
      <span>{label}</span>
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

function ViewAllLink() {
  return (
    <button
      type="button"
      className="text-[12px] font-semibold text-reps-orange hover:underline"
    >
      View all
    </button>
  );
}

/* ============================================================
   ROW 1 — KPI tiles
   ============================================================ */

function KpiRow() {
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
        currency
      />
    </div>
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
  currency?: boolean;
}) {
  return (
    <Card>
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
            <Delta value={delta} positive={trend === "up"} />
          </div>
          <div className="mt-1 text-[11px] text-white/45">{sub}</div>
        </div>
      </div>
      <div className="mt-3">
        <KpiSparkline />
      </div>
    </Card>
  );
}

function KpiSparkline() {
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden
    >
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

/* ============================================================
   ROW 2 — Registrations Over Time + Top Specialisms
   ============================================================ */

function RegistrationsAndSpecialisms() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card size="panel">
        <PanelHeader
          title="Registrations Over Time"
          right={<RangePill label="Daily" />}
        />
        <div className="flex items-center gap-6 text-[12px] text-white/65">
          <Legend color="var(--reps-orange)" label="Professionals" value="1,842" />
          <Legend color="var(--reps-blue)" label="Members" value="5,763" />
        </div>
        <div className="mt-3">
          <RegistrationsChart />
        </div>
        <div className="mt-2 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View full analytics <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Card>

      <Card size="panel">
        <PanelHeader
          title="Top Specialisms"
          right={<RangePill label="By Professionals" />}
        />
        <div className="grid grid-cols-[160px_1fr] items-center gap-6">
          <SpecialismsDonut />
          <ul className="space-y-2.5">
            {SPECIALISMS.map((s) => (
              <li
                key={s.label}
                className="flex items-center gap-3 text-[12px]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="flex-1 text-white/80">{s.label}</span>
                <span className="w-10 text-right font-semibold text-white/70">
                  {s.pct}
                </span>
                <span className="w-14 text-right text-white/55">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View all specialisms <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function RegistrationsChart() {
  // Two smoothed line series — Professionals (orange) & Members (blue).
  const proPath =
    "M0 110 C 30 90, 60 100, 90 80 S 150 60, 180 70 S 240 50, 270 55 S 330 40, 360 45 S 420 30, 450 35";
  const memPath =
    "M0 80 C 30 70, 60 60, 90 65 S 150 40, 180 45 S 240 30, 270 35 S 330 20, 360 25 S 420 15, 450 20";
  return (
    <svg
      viewBox="0 0 450 160"
      className="h-[180px] w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
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
      {/* Grid lines */}
      {[0, 40, 80, 120].map((y) => (
        <line
          key={y}
          x1="0"
          x2="450"
          y1={y + 10}
          y2={y + 10}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      <path d={`${memPath} L 450 160 L 0 160 Z`} fill="url(#regMemArea)" />
      <path d={`${proPath} L 450 160 L 0 160 Z`} fill="url(#regProArea)" />
      <path
        d={memPath}
        fill="none"
        stroke="var(--reps-blue)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={proPath}
        fill="none"
        stroke="var(--reps-orange)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SPECIALISMS = [
  { label: "Personal Training", pct: "28%", count: "6,969", color: "var(--reps-orange)" },
  { label: "Strength & Conditioning", pct: "18%", count: "4,480", color: "var(--reps-blue)" },
  { label: "Pilates", pct: "14%", count: "3,486", color: "var(--reps-green)" },
  { label: "Nutrition", pct: "11%", count: "2,738", color: "var(--reps-gold)" },
  { label: "Sports Coaching", pct: "9%", count: "2,239", color: "#9B6BE2" },
  { label: "Pre & Postnatal", pct: "7%", count: "1,743", color: "var(--reps-orange)" },
  { label: "Other", pct: "13%", count: "3,237", color: "#5D6573" },
];

function SpecialismsDonut() {
  // Simple stacked donut — segments via stroke-dasharray on a circle.
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

/* ============================================================
   ROW 3 — Recent Activity / Verification Queue / Reviews / System Status
   ============================================================ */

type ActivityItem = {
  icon: LucideIcon;
  title: string;
  sub: string;
  time: string;
  tag?: string;
  avatar?: string;
};

const RECENT: ActivityItem[] = [
  {
    icon: UserPlus,
    title: "Sophie Williams",
    sub: "New professional registration",
    time: "2m ago",
    tag: "NEW",
    avatar: proSophie,
  },
  {
    icon: FileText,
    title: "Daniel Roberts",
    sub: "Profile updated",
    time: "15m ago",
    avatar: proDaniel,
  },
  {
    icon: GraduationCap,
    title: "Mike Johnson",
    sub: "CPD certificate uploaded",
    time: "1h ago",
  },
  {
    icon: UserCheck,
    title: "Emma Davis",
    sub: "Member verified",
    time: "2h ago",
  },
  {
    icon: Star,
    title: "Tom Harris",
    sub: "New review received",
    time: "3h ago",
  },
];

type VerifyItem = { name: string; role: string; submitted: string; avatar: string };
const VERIFY: VerifyItem[] = [
  { name: "Alex Thompson", role: "Personal Trainer", submitted: "Submitted 1h ago", avatar: proJames },
  { name: "Olivia Parker", role: "Pilates Instructor", submitted: "Submitted 3h ago", avatar: proLaura },
  { name: "James Cooper", role: "Strength Coach", submitted: "Submitted 5h ago", avatar: proDaniel },
  { name: "Chloe Martin", role: "Nutritionist", submitted: "Submitted 6h ago", avatar: proSophie },
];

type ReviewItem = { name: string; role: string; rating: number; avatar: string };
const REVIEWS: ReviewItem[] = [
  { name: "Laura Mitchell", role: "Personal Trainer", rating: 4.9, avatar: proLaura },
  { name: "Ryan Foster", role: "Strength Coach", rating: 4.8, avatar: proJames },
  { name: "Hannah Scott", role: "Pilates Instructor", rating: 4.7, avatar: proSophie },
  { name: "Adam Lee", role: "Nutritionist", rating: 4.9, avatar: proDaniel },
];

const SYSTEM = [
  { label: "Website", sub: "All systems operational" },
  { label: "Professional Directory", sub: "All systems operational" },
  { label: "Payment Gateway", sub: "All systems operational" },
  { label: "Email Service", sub: "All systems operational" },
  { label: "Document Storage", sub: "All systems operational" },
];

function ActivityRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Recent Activity */}
      <Card>
        <PanelHeader title="Recent Activity" right={<ViewAllLink />} />
        <ul className="space-y-3">
          {RECENT.map((r) => (
            <li key={r.title} className="flex items-center gap-3">
              {r.avatar ? (
                <img
                  src={r.avatar}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-panel-soft text-white/60">
                  <r.icon className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-white">
                    {r.title}
                  </span>
                  {r.tag ? (
                    <span className="inline-flex h-4 items-center rounded-[6px] bg-reps-green/20 px-1.5 text-[9px] font-bold uppercase tracking-wider text-reps-green">
                      {r.tag}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-[11px] text-white/55">{r.sub}</div>
              </div>
              <span className="text-[11px] text-white/45">{r.time}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Verification Queue */}
      <Card>
        <PanelHeader
          title="Verification Queue"
          right={
            <div className="flex items-center gap-2">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
                23
              </span>
              <ViewAllLink />
            </div>
          }
        />
        <ul className="space-y-3">
          {VERIFY.map((v) => (
            <li key={v.name} className="flex items-center gap-3">
              <img
                src={v.avatar}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">
                  {v.name}
                </div>
                <div className="truncate text-[11px] text-white/55">
                  {v.role}
                </div>
                <div className="truncate text-[10px] text-white/40">
                  {v.submitted}
                </div>
              </div>
              <span className="inline-flex h-6 items-center rounded-full bg-reps-orange-soft px-2.5 text-[10px] font-semibold text-reps-orange">
                Pending
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Reviews Pending */}
      <Card>
        <PanelHeader
          title="Reviews Pending"
          right={
            <div className="flex items-center gap-2">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-orange px-1.5 text-[10px] font-semibold text-white">
                18
              </span>
              <ViewAllLink />
            </div>
          }
        />
        <ul className="space-y-3">
          {REVIEWS.map((r) => (
            <li key={r.name} className="flex items-center gap-3">
              <img
                src={r.avatar}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">
                  {r.name}
                </div>
                <div className="truncate text-[11px] text-white/55">
                  {r.role}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Stars value={r.rating} />
                <span className="text-[11px] font-semibold text-white/70">
                  {r.rating}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* System Status */}
      <Card>
        <PanelHeader title="System Status" right={<ViewAllLink />} />
        <ul className="space-y-3">
          {SYSTEM.map((s) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-green/15 text-reps-green">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">
                  {s.label}
                </div>
                <div className="truncate text-[11px] text-white/55">{s.sub}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(value)
              ? "fill-reps-orange text-reps-orange"
              : "text-white/20"
          }`}
        />
      ))}
    </span>
  );
}

/* ============================================================
   ROW 4 — Revenue Overview + Membership Growth
   ============================================================ */

function RevenueAndMembership() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Revenue Overview */}
      <Card size="panel">
        <PanelHeader title="Revenue Overview" right={<RangePill />} />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">
            £128,480
          </span>
          <Delta value="14.3%" />
        </div>
        <div className="mt-1 text-[11px] text-white/45">
          vs last 30 days £112,480
        </div>
        <div className="mt-4">
          <RevenueArea />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Stat label="Total Revenue" value="£128,480" delta="14.3%" />
          <Stat label="Subscriptions" value="£98,200" delta="12.6%" />
          <Stat label="One-off Payments" value="£24,080" delta="18.7%" />
          <Stat label="Refunds" value="£3,800" delta="5.2%" positive={false} />
        </div>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View full financial report <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Card>

      {/* Membership Growth */}
      <Card size="panel">
        <PanelHeader
          title="Membership Growth"
          right={<RangePill label="Last 12 months" />}
        />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">
            156,783
          </span>
          <Delta value="8.7%" />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[11px] text-white/45">
            vs previous 12 months 144,163
          </span>
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
          <Stat label="New Members" value="89,456" delta="9.2%" />
          <Stat label="Returning Members" value="67,327" delta="7.9%" />
          <Stat label="Retention Rate" value="71%" delta="3.4%" />
        </div>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View full membership report <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  positive = true,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-white/55">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[16px] font-bold leading-none text-white">
          {value}
        </span>
        <Delta value={delta} positive={positive} />
      </div>
    </div>
  );
}

function RevenueArea() {
  const path =
    "M0 110 C 25 95, 50 60, 70 55 S 110 80, 140 70 S 180 45, 210 50 S 260 60, 300 55 S 360 50, 400 48 L 450 50";
  return (
    <svg
      viewBox="0 0 450 160"
      className="h-[180px] w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="revArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 40, 80, 120].map((y) => (
        <line
          key={y}
          x1="0"
          x2="450"
          y1={y + 10}
          y2={y + 10}
          stroke="rgba(255,255,255,0.05)"
        />
      ))}
      <path d={`${path} L 450 160 L 0 160 Z`} fill="url(#revArea)" />
      <path
        d={path}
        fill="none"
        stroke="var(--reps-orange)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MembershipBars() {
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const data = [
    { n: 70, r: 30 },
    { n: 80, r: 35 },
    { n: 78, r: 40 },
    { n: 85, r: 42 },
    { n: 88, r: 45 },
    { n: 92, r: 48 },
    { n: 95, r: 52 },
    { n: 100, r: 55 },
    { n: 96, r: 50 },
    { n: 102, r: 56 },
    { n: 105, r: 58 },
  ];
  const max = 170;
  return (
    <svg
      viewBox="0 0 450 180"
      className="h-[180px] w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {[0, 40, 80, 120, 160].map((y) => (
        <line
          key={y}
          x1="0"
          x2="450"
          y1={160 - y}
          y2={160 - y}
          stroke="rgba(255,255,255,0.05)"
        />
      ))}
      {data.map((d, i) => {
        const x = 12 + i * 38;
        const newH = (d.n / max) * 160;
        const retH = (d.r / max) * 160;
        return (
          <g key={i}>
            <rect
              x={x}
              y={160 - newH}
              width="22"
              height={newH}
              rx="3"
              fill="var(--reps-orange)"
            />
            <rect
              x={x}
              y={160 - newH - retH}
              width="22"
              height={retH}
              rx="3"
              fill="var(--reps-blue)"
            />
            <text
              x={x + 11}
              y="178"
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.45)"
            >
              {months[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   ROW 5 — Professional Breakdown / Geographic / Lead Funnel
   ============================================================ */

function BreakdownRow() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Professional Breakdown */}
      <Card>
        <PanelHeader
          title="Professional Breakdown"
          right={<RangePill label="By Status" />}
        />
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
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View all professionals <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <PanelHeader
          title="Geographic Distribution"
          right={<RangePill label="By Country" />}
        />
        <div className="grid grid-cols-[1fr_140px] gap-4">
          <WorldMap />
          <ul className="space-y-2.5 text-[12px]">
            <GeoRow color="var(--reps-orange)" label="United Kingdom" pct="62%" />
            <GeoRow color="var(--reps-orange-hover)" label="United States" pct="12%" />
            <GeoRow color="var(--reps-orange-dark)" label="Australia" pct="8%" />
            <GeoRow color="#A85200" label="Canada" pct="6%" />
            <GeoRow color="#5D6573" label="Other" pct="12%" />
          </ul>
        </div>
        <div className="mt-3 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View full geographic report <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Card>

      {/* Lead Conversion Funnel */}
      <Card>
        <PanelHeader
          title="Lead Conversion Funnel"
          right={<RangePill />}
        />
        <Funnel />
        <div className="mt-3 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View full funnel analysis <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function BreakdownRowItem({
  color,
  label,
  count,
  pct,
}: {
  color: string;
  label: string;
  count: string;
  pct: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-white/80">{label}</span>
      <span className="w-12 text-right font-semibold text-white/80">{count}</span>
      <span className="w-12 text-right text-white/50">({pct})</span>
    </li>
  );
}

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

function GeoRow({ color, label, pct }: { color: string; label: string; pct: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-white/80">{label}</span>
      <span className="font-semibold text-white/80">{pct}</span>
    </li>
  );
}

function WorldMap() {
  // Stylised abstract continents (decorative; not a real geo plot).
  return (
    <svg viewBox="0 0 220 140" className="h-[140px] w-full" aria-hidden>
      {/* North America */}
      <path
        d="M10 30 Q 20 18 38 22 Q 55 18 60 40 Q 58 60 42 66 Q 24 70 14 55 Z"
        fill="var(--reps-orange)"
        opacity="0.7"
      />
      {/* South America */}
      <path
        d="M48 76 Q 58 72 60 90 Q 56 110 48 118 Q 40 110 42 92 Z"
        fill="var(--reps-orange)"
        opacity="0.45"
      />
      {/* Europe */}
      <path
        d="M100 28 Q 112 22 120 30 Q 124 42 116 48 Q 104 50 98 40 Z"
        fill="var(--reps-orange)"
        opacity="0.95"
      />
      {/* Africa */}
      <path
        d="M108 58 Q 124 56 130 78 Q 126 100 116 108 Q 104 100 104 80 Z"
        fill="var(--reps-orange)"
        opacity="0.5"
      />
      {/* Asia */}
      <path
        d="M130 26 Q 160 18 188 30 Q 196 50 180 60 Q 154 62 138 52 Z"
        fill="var(--reps-orange)"
        opacity="0.65"
      />
      {/* Australia */}
      <path
        d="M174 90 Q 192 88 198 100 Q 192 112 178 110 Q 168 102 174 92 Z"
        fill="var(--reps-orange)"
        opacity="0.8"
      />
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

/* ============================================================
   ROW 6 — Top Performing Professionals
   ============================================================ */

const TOP_PROS = [
  {
    rank: 1,
    name: "Sarah Mitchell",
    specialism: "Personal Trainer",
    rating: 4.9,
    reviews: 189,
    views: "2,845",
    leads: 156,
    conv: "21.3%",
    avatar: proLaura,
  },
  {
    rank: 2,
    name: "James Cooper",
    specialism: "Strength Coach",
    rating: 4.8,
    reviews: 142,
    views: "2,156",
    leads: 128,
    conv: "19.6%",
    avatar: proJames,
  },
  {
    rank: 3,
    name: "Emma Davis",
    specialism: "Pilates Instructor",
    rating: 4.8,
    reviews: 132,
    views: "1,987",
    leads: 112,
    conv: "18.7%",
    avatar: proSophie,
  },
  {
    rank: 4,
    name: "Michael Johnson",
    specialism: "Nutritionist",
    rating: 4.7,
    reviews: 98,
    views: "1,654",
    leads: 94,
    conv: "17.9%",
    avatar: proDaniel,
  },
  {
    rank: 5,
    name: "Hannah Scott",
    specialism: "Personal Trainer",
    rating: 4.7,
    reviews: 87,
    views: "1,432",
    leads: 81,
    conv: "16.8%",
    avatar: proLaura,
  },
];

function TopProsTable() {
  return (
    <Card size="panel">
      <PanelHeader title="Top Performing Professionals" right={<ViewAllLink />} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-white/45">
              <th className="w-12 pb-3 font-semibold">Rank</th>
              <th className="pb-3 font-semibold">Professional</th>
              <th className="pb-3 font-semibold">Specialism</th>
              <th className="pb-3 font-semibold">Rating</th>
              <th className="pb-3 font-semibold">Reviews</th>
              <th className="pb-3 font-semibold">Profile Views</th>
              <th className="pb-3 font-semibold">Leads</th>
              <th className="pb-3 font-semibold">Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            {TOP_PROS.map((p) => (
              <tr key={p.rank} className="border-t border-reps-border">
                <td className="py-3 font-display text-[14px] font-bold text-white/85">
                  {p.rank}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="font-semibold text-white">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 text-white/75">{p.specialism}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="font-semibold text-white">{p.rating}</span>
                    <Stars value={p.rating} />
                  </span>
                </td>
                <td className="py-3 text-white/75">{p.reviews}</td>
                <td className="py-3 text-white/75">{p.views}</td>
                <td className="py-3 text-white/75">{p.leads}</td>
                <td className="py-3 font-semibold text-reps-green">{p.conv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-center">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
        >
          View full leaderboard <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function AdminDashboardPage() {
  return (
    <AdminShell
      active="Overview"
      title="Platform Overview"
      subtitle="Real-time overview of the REPs platform and key operational metrics."
      actions={<RangePill />}
    >
      <div className="space-y-6">
        <KpiRow />
        <RegistrationsAndSpecialisms />
        <ActivityRow />
        <RevenueAndMembership />
        <BreakdownRow />
        <TopProsTable />
      </div>
    </AdminShell>
  );
}
