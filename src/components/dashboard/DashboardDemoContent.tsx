import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Inbox,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
  LockKeyhole,
  type LucideIcon
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import holoFigure from "@/assets/dashboard-holo-figure.png";
import { Button } from "@/components/ui/button";

/* ============================================================
   PRIMITIVES
   ============================================================ */

export function Card({ children,
  className = "",
  size = "card"
}: { children: React.ReactNode;
  className?: string;
  size?: "card" | "panel";
}) {
  const radius = size === "panel" ? "rounded-[22px]" : "rounded-[18px]";
  return (
    <div
      className={`${radius} relative border border-reps-border bg-reps-panel p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ title,
  right,
  icon: Icon
}: { title: string;
  right?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-white/70" /> : null}
        <h2 className="font-display text-[15px] font-semibold text-white">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

export function OutlineButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft text-[13px] font-semibold text-white/80 shadow-none transition-colors hover:bg-reps-panel-soft/70 hover:text-white"
    >
      {children}
    </button>
  );
}

export function GhostButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none transition-colors hover:text-white"
    >
      {children}
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

export function Delta({ value,
  positive = true
}: { value: string;
  positive?: boolean;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? "text-reps-green" : "text-reps-red";
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${color}`}>
      <Icon className="h-3 w-3" /> {value}
    </span>
  );
}

export function Sparkline({ trend = "up" }: { trend?: "up" | "down" }) {
  const path =
    trend === "up"
      ? "M0 28 L10 24 L20 26 L30 18 L40 20 L50 12 L60 16 L70 8 L80 14 L90 6 L100 10"
      : "M0 6 L10 10 L20 8 L30 16 L40 14 L50 22 L60 18 L70 26 L80 20 L90 28 L100 24";
  return (
    <svg
      viewBox="0 0 100 32"
      className="h-8 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="var(--reps-orange)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockOverlay({ title = "Pro Preview" }: { title?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit] bg-reps-midnight/60 backdrop-blur-[2px]">
      <div className="flex flex-col items-center rounded-[22px] border border-reps-border bg-reps-panel p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-center text-sm text-white/60">Included with REPS Pro.</p>
        <Button asChild size="sm" className="mt-4 bg-reps-orange hover:bg-reps-orange-hover">
          <Link to="/dashboard/start" search={{ tier: "pro" }}>Upgrade</Link>
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const SCHEDULE = [
  { time: "09:00", title: "PT Session", sub: "Sarah Mitchell" },
  { time: "11:00", title: "Pilates Class", sub: "Group Session" },
  { time: "14:00", title: "Online Check-Ins", sub: "8 Clients" },
  { time: "17:00", title: "Consultation Call", sub: "New Lead: Tom" },
  { time: "19:00", title: "Strength Class", sub: "Group Session" },
];

const AI_INSIGHTS = [
  { icon: TrendingUp,
    title: "Revenue is up 14% this month",
    sub: "Great work! You are on track to hit £15k this month."
  },
  { icon: Activity,
    title: "3 clients are at cancellation risk",
    sub: "We recommend reaching out to them this week."
  },
  { icon: ClipboardList,
    title: "8 check-ins require your review",
    sub: "Clients are waiting for your feedback."
  },
  { icon: Target,
    title: "2 leads are likely to convert today",
    sub: "High intent leads ready for your follow up."
  },
];

const CLIENT_ALERTS = [
  { avatar: proSophie,
    name: "Sarah Mitchell",
    risk: "High Risk",
    riskColor: "bg-reps-red/15 text-reps-red",
    note: "Weight loss has stalled for 14 days. Adherence down 23%."
  },
  { avatar: proDaniel,
    name: "Mike Johnson",
    risk: "Medium Risk",
    riskColor: "bg-reps-orange-soft text-reps-orange",
    note: "Recovery score is low. Injury risk is elevated."
  },
  { avatar: proLaura,
    name: "Emma Davis",
    risk: "Medium Risk",
    riskColor: "bg-reps-orange-soft text-reps-orange",
    note: "Missed 2 workouts this week. Engagement declining."
  },
];

const LEAD_PIPELINE = [
  { stage: "Leads", value: 32, color: "text-white" },
  { stage: "Call Booked", value: 18, color: "text-white" },
  { stage: "Proposal Sent", value: 11, color: "text-white" },
  { stage: "Trial", value: 7, color: "text-white" },
  { stage: "Client", value: 5, color: "text-reps-green" },
];

const LEADS = [
  { avatar: proDaniel,
    name: "Tom Harris",
    sub: "Enquired 2h ago",
    intent: "High intent",
    intentColor: "bg-reps-green/15 text-reps-green"
  },
  { avatar: proLaura,
    name: "Lucy Green",
    sub: "Enquired 1d ago",
    intent: "Medium intent",
    intentColor: "bg-reps-orange-soft text-reps-orange"
  },
  { avatar: proJames,
    name: "David Wilson",
    sub: "Enquired 2d ago",
    intent: "High intent",
    intentColor: "bg-reps-green/15 text-reps-green"
  },
];

const CONTENT_ITEMS = [
  { title: "7 Breakfast Ideas for Fat Loss",
    sub: "Instagram Post",
    status: "Scheduled for Tomorrow",
    statusColor: "bg-reps-blue/15 text-reps-blue"
  },
  { title: "5 Tips to Improve Your Sleep",
    sub: "Email",
    status: "Scheduled for 19 May",
    statusColor: "bg-reps-blue/15 text-reps-blue"
  },
  { title: "Full Body Strength Workout",
    sub: "YouTube Video",
    status: "Draft",
    statusColor: "bg-reps-panel-soft text-white/70"
  },
  { title: "May Challenge | 10K Steps",
    sub: "Challenge",
    status: "Active",
    statusColor: "bg-reps-green/15 text-reps-green"
  },
];

const PROGRAMS = [
  { name: "Strength Program", pct: 87, color: "var(--reps-orange)" },
  { name: "Fat Loss Plan", pct: 74, color: "var(--reps-orange)" },
  { name: "Muscle Building", pct: 68, color: "var(--reps-orange)" },
  { name: "Mobility & Recovery", pct: 61, color: "var(--reps-orange)" },
  { name: "HIIT Program", pct: 52, color: "var(--reps-red)" },
];

const SPOTLIGHT = [
  { avatar: proSophie, name: "Sarah Mitchell", program: "Weight Loss Plan", delta: "-4.2kg", adherence: "94%" },
  { avatar: proJames, name: "James Wilson", program: "Muscle Building", delta: "+2.8kg", adherence: "91%" },
  { avatar: proLaura, name: "Emma Davis", program: "Strength Program", delta: "+15%", adherence: "89%" },
];

const TASKS = [
  { title: "Review 8 client check-ins", pill: "High Priority", color: "bg-reps-red/15 text-reps-red" },
  { title: "Follow up with 2 leads", pill: "Due Today", color: "bg-reps-orange-soft text-reps-orange" },
  { title: "Update program for Sarah M.", pill: "Due Today", color: "bg-reps-orange-soft text-reps-orange" },
  { title: "Send progress reports", pill: "Due Tomorrow", color: "bg-reps-blue/15 text-reps-blue" },
  { title: "Plan content for next week", pill: "Due Tomorrow", color: "bg-reps-blue/15 text-reps-blue" },
];

const EVENTS = [
  { month: "MAY", day: "17", title: "Group HIIT Class", sub: "Saturday, 09:00", trailing: "5 Attending" },
  { month: "MAY", day: "19", title: "Webinar: Building Your Brand", sub: "Monday, 19:00", trailing: "12 Registered" },
  { month: "MAY", day: "21", title: "CPD Workshop: Nutrition", sub: "Wednesday, 10:00", trailing: "8 Registered" },
];

const TIPS = [
  { icon: TrendingUp, title: "Optimise your pricing", sub: "We recommend increasing your online coaching rate by 15%." },
  { icon: Users, title: "Expand your reach", sub: "Your 'Fat Loss' specialty is trending in your local area." },
  { icon: Sparkles, title: "Try AI program design", sub: "Save up to 4 hours per week by using our AI assistant." },
];

/* ============================================================
   SECTIONS
   ============================================================ */

export function KpiRow({ isLocked = false }: { isLocked?: boolean }) {
  return (
    <div className="relative grid grid-cols-2 gap-4 overflow-hidden rounded-[22px] sm:grid-cols-3 xl:grid-cols-6">
      <div className="relative col-span-2 grid grid-cols-2 gap-4 sm:col-span-3 sm:grid-cols-3 xl:col-span-3">
        <KpiTile label="Monthly Revenue" value="£12,480" delta="14.3%" sub="vs last month £10,910" />
        <KpiTile label="Active Clients" value="142" delta="8" sub="vs last month 134" />
        <KpiTile label="Client Adherence" value="87%" delta="5%" sub="vs last month 82%" />
      </div>
      <Card>
        <div className="text-[12px] text-white/55">REPS Professional Score</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-[24px] font-bold leading-none text-white">942</div>
            <div className="text-[11px] font-semibold text-reps-orange">Elite</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-white/50">Top 10% of REPS members</div>
      </Card>
      <Card>
        <div className="text-[12px] text-white/55">Membership Status</div>
        <div className="mt-2 font-display text-[20px] font-bold leading-tight text-reps-orange">REPS Premium</div>
        <div className="text-[11px] text-white/55">Renews 24 May 2026</div>
        <span className="mt-3 inline-flex h-6 items-center rounded-full bg-reps-green/15 px-2.5 text-[11px] font-semibold text-reps-green">Active</span>
      </Card>
      <Card className="overflow-hidden">
        <div className="text-[12px] text-white/55">AI Business Insight</div>
        <div className="mt-2 flex items-start gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="flex-1 text-[12px] leading-snug text-white/80">Your business is performing well</p>
        </div>
        <button type="button" className="mt-3 flex h-8 w-full items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft text-[12px] font-semibold text-white/80 shadow-none hover:text-white">View insights</button>
      </Card>
      {isLocked && <LockOverlay title="Business overview" />}
    </div>
  );
}

function KpiTile({ label, value, delta, sub }: { label: string; value: string; delta: string; sub: string }) {
  return (
    <Card>
      <div className="text-[12px] text-white/55">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-[26px] font-bold leading-none text-white">{value}</span>
        <Delta value={delta} />
      </div>
      <div className="mt-1 text-[11px] text-white/45">{sub}</div>
      <div className="-mb-1 mt-2"><Sparkline /></div>
    </Card>
  );
}

export function ScheduleAndAi({ isLocked = false, statusData }: { isLocked?: boolean; statusData?: any }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Today's Schedule */}
      <Card>
        <PanelHeader title="Today's Schedule" icon={Calendar} />
        <div className="text-[12px] text-white/55">Friday, 16 May</div>
        <ul className="mt-3 space-y-2">
          {SCHEDULE.map((s) => (
            <li key={s.time} className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2">
              <span className="w-12 text-[12px] font-semibold text-reps-orange">{s.time}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">{s.title}</div>
                <div className="truncate text-[11px] text-white/55">{s.sub}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4"><OutlineButton>View full calendar</OutlineButton></div>
        {isLocked && <LockOverlay title="Schedule" />}
      </Card>

      {/* AI Business Command Centre */}
      <Card size="panel" className="relative overflow-hidden">
        <PanelHeader
          title="AI Command Centre"
          icon={Sparkles}
          right={<button type="button" className="inline-flex h-8 items-center gap-1 rounded-full bg-reps-orange px-4 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"><Sparkles className="h-3 w-3" /> Ask AI</button>}
        />
        <div className="relative">
          <img src={holoFigure} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="pointer-events-none absolute -right-4 -top-2 h-[280px] w-auto object-contain opacity-60" />
          <ul className="relative space-y-3 pr-[120px]">
            {AI_INSIGHTS.map((i) => (
              <li key={i.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange"><i.icon className="h-3.5 w-3.5" /></span>
                <div>
                  <div className="text-[13px] font-semibold text-white">{i.title}</div>
                  <div className="text-[11.5px] leading-snug text-white/55">{i.sub}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4"><OutlineButton>View all recommendations</OutlineButton></div>
        {isLocked && <LockOverlay title="AI Command Centre" />}
      </Card>

      {/* Professional Status */}
      <Card>
        <PanelHeader
          title="Your Professional Status"
          icon={Trophy}
          right={<Button asChild variant="outline" size="sm" className="h-8 rounded-[8px] bg-reps-panel-soft border-reps-border text-[12px]"><Link to="/dashboard/profile-edit">View profile</Link></Button>}
        />
        <ul className="space-y-3">
          <StatusRow
            icon={CheckCircle2}
            iconColor={statusData?.isVerified ? "text-reps-green" : "text-reps-orange"}
            title="REPS Verified Member"
            sub={statusData?.isVerified ? "Verified Professional" : "Verification pending"}
          />
          <StatusRow
            icon={CheckCircle2}
            iconColor={statusData?.hasInsurance ? "text-reps-green" : "text-white/40"}
            title="Professional Indemnity Insurance"
            sub={statusData?.insuranceDetail || "Not uploaded"}
          />
          <li className="rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-white/70">CPD Progress</span>
              <span className="font-semibold text-white">18 / 20 pts</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-reps-border">
              <div className="h-full rounded-full bg-reps-orange" style={{ width: "90%" }} />
            </div>
          </li>
          <PillRow icon={GraduationCap} label="Qualifications" pill={statusData?.qualCount || "3 Active"} />
          <PillRow icon={Trophy} label="Endorsements" pill="12" />
          <li className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5">
            <span className="flex items-center gap-2 text-[12.5px] text-white/80">
              <Star className="h-4 w-4 text-reps-orange" />
              Client Reviews
            </span>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-white">
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-3 w-3 fill-reps-orange text-reps-orange" />
                ))}
              </span>
              4.9 <span className="text-white/55">(128)</span>
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}

export function StatusRow({ icon: Icon, iconColor, title, sub }: { icon: LucideIcon; iconColor: string; title: string; sub: string }) {
  return (
    <li className="flex items-start gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
      <div>
        <div className="text-[13px] font-semibold text-white">{title}</div>
        <div className="text-[11px] text-white/55">{sub}</div>
      </div>
    </li>
  );
}

export function PillRow({ icon: Icon, label, pill }: { icon: LucideIcon; label: string; pill: string }) {
  return (
    <li className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5">
      <span className="flex items-center gap-2 text-[12.5px] text-white/80">
        <Icon className="h-4 w-4 text-reps-orange" />
        {label}
      </span>
      <span className="inline-flex h-5 items-center rounded-full bg-reps-orange-soft px-2 text-[11px] font-semibold text-reps-orange">
        {pill}
      </span>
    </li>
  );
}

export function PerformanceRow({ isLocked = false }: { isLocked?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <Card className="xl:col-span-1 overflow-hidden">
        <PanelHeader title="Client Performance" right={<GhostButton>This Month</GhostButton>} />
        <LineChartSvg />
        <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
          <MiniStat label="Adherence" value="87%" delta="5%" />
          <MiniStat label="Retention" value="93%" delta="4%" />
          <MiniStat label="Results" value="78%" delta="6%" />
          <MiniStat label="Revenue" value="£12,480" delta="14%" />
        </div>
        {isLocked && <LockOverlay title="Performance Metrics" />}
      </Card>

      <Card className="overflow-hidden">
        <PanelHeader title="AI Client Alerts" right={<span className="text-[12px] font-semibold text-reps-orange">View all (12)</span>} />
        <ul className="space-y-3">
          {CLIENT_ALERTS.map((a) => (
            <li key={a.name} className="flex items-start gap-3">
              <img src={a.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-white">{a.name}</span>
                  <span className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold ${a.riskColor}`}>{a.risk}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/55">{a.note}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4"><OutlineButton>Go to Check-Ins</OutlineButton></div>
        {isLocked && <LockOverlay title="AI Client Monitoring" />}
      </Card>

      <Card className="overflow-hidden">
        <PanelHeader title="Lead Pipeline" right={<GhostButton>All Leads</GhostButton>} />
        <div className="grid grid-cols-5 gap-1.5">
          {LEAD_PIPELINE.map((p) => (
            <div key={p.stage} className="rounded-[10px] border border-reps-border bg-reps-panel-soft p-2 text-center">
              <div className="text-[9px] leading-tight text-white/55">{p.stage}</div>
              <div className={`mt-1 font-display text-[16px] font-bold ${p.color}`}>{p.value}</div>
            </div>
          ))}
        </div>
        <ul className="mt-3 space-y-2.5">
          {LEADS.map((l) => (
            <li key={l.name} className="flex items-center gap-3">
              <img src={l.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-white">{l.name}</div>
                <div className="truncate text-[10.5px] text-white/55">{l.sub}</div>
              </div>
              <span className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold ${l.intentColor}`}>{l.intent}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4"><OutlineButton>View all leads</OutlineButton></div>
        {isLocked && <LockOverlay title="Lead CRM" />}
      </Card>

      <Card className="overflow-hidden">
        <PanelHeader title="Content Studio" right={<button type="button" className="inline-flex h-8 items-center gap-1 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"><Plus className="h-3 w-3" /> Create New</button>} />
        <ul className="mt-3 space-y-2.5">
          {CONTENT_ITEMS.map((c) => (
            <li key={c.title} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange"><FileText className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-white">{c.title}</div>
                <div className="truncate text-[10.5px] text-white/55">{c.sub}</div>
              </div>
              <span className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold ${c.statusColor}`}>{c.status}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4"><OutlineButton>Go to Content Studio</OutlineButton></div>
        {isLocked && <LockOverlay title="Content Studio" />}
      </Card>
    </div>
  );
}

function MiniStat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div>
      <div className="truncate text-[10px] text-white/55">{label}</div>
      <div className="mt-0.5 font-display text-[13px] font-bold text-white">{value}</div>
      <div className="text-[10px] font-semibold text-reps-green">↑ {delta}</div>
    </div>
  );
}

function LineChartSvg() {
  return (
    <svg viewBox="0 0 320 140" className="mt-3 h-[150px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="adh-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 50, 80, 110].map((y) => (
        <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="var(--reps-border)" strokeDasharray="2 4" />
      ))}
      <path d="M0 90 L40 78 L80 84 L120 60 L160 66 L200 48 L240 54 L280 30 L320 38" fill="none" stroke="var(--reps-orange)" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 90 L40 78 L80 84 L120 60 L160 66 L200 48 L240 54 L280 30 L320 38 L320 140 L0 140 Z" fill="url(#adh-fill)" />
    </svg>
  );
}

export function RevenueRow({ isLocked = false }: { isLocked?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card size="panel" className="overflow-hidden">
        <PanelHeader title="Revenue Overview" right={<GhostButton>This Month</GhostButton>} />
        <div className="flex items-baseline gap-3"><span className="font-display text-[28px] font-bold leading-none text-white">£12,480</span><Delta value="14.3% vs last month" /></div>
        <RevenueChart />
        {isLocked && <LockOverlay title="Revenue Analytics" />}
      </Card>

      <Card className="overflow-hidden">
        <PanelHeader title="Client Check-Ins" right={<GhostButton>This Week</GhostButton>} />
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <DonutChart />
          <ul className="space-y-3 text-[12px]">
            <DonutLegend color="var(--reps-green)" label="Up to date" value="98 (69%)" />
            <DonutLegend color="var(--reps-orange)" label="Due" value="28 (20%)" />
            <DonutLegend color="var(--reps-red)" label="Overdue" value="16 (11%)" />
          </ul>
        </div>
        {isLocked && <LockOverlay title="Client Tracking" />}
      </Card>

      <Card className="overflow-hidden">
        <PanelHeader title="Program Engagement" right={<GhostButton>This Month</GhostButton>} />
        <ul className="space-y-3">
          {PROGRAMS.map((p) => (
            <li key={p.name}>
              <div className="flex items-center justify-between text-[12.5px]"><span className="text-white/80">{p.name}</span><span className="font-semibold text-white">{p.pct}%</span></div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-reps-border">
                <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
              </div>
            </li>
          ))}
        </ul>
        {isLocked && <LockOverlay title="Program Analytics" />}
      </Card>
    </div>
  );
}

function RevenueChart() {
  return (
    <svg viewBox="0 0 600 200" className="mt-4 h-[200px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="var(--reps-border)" strokeDasharray="2 4" />
      ))}
      <path d="M0 140 L40 130 L80 138 L120 118 L160 124 L200 100 L240 108 L280 88 L320 96 L360 72 L400 80 L440 60 L480 68 L520 48 L560 56 L600 40" fill="none" stroke="var(--reps-orange)" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 140 L40 130 L80 138 L120 118 L160 124 L200 100 L240 108 L280 88 L320 96 L360 72 L400 80 L440 60 L480 68 L520 48 L560 56 L600 40 L600 200 L0 200 Z" fill="url(#rev-fill)" />
    </svg>
  );
}

function DonutChart() {
  const r = 56;
  const c = 2 * Math.PI * r;
  const seg = (pct: number) => (pct / 100) * c;
  return (
    <svg viewBox="0 0 160 160" className="h-[160px] w-[160px]" aria-hidden>
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--reps-panel-soft)" strokeWidth="16" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--reps-green)" strokeWidth="16" strokeDasharray={`${seg(69)} ${c - seg(69)}`} transform="rotate(-90 80 80)" strokeLinecap="butt" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--reps-orange)" strokeWidth="16" strokeDasharray={`${seg(20)} ${c - seg(20)}`} strokeDashoffset={-seg(69)} transform="rotate(-90 80 80)" strokeLinecap="butt" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--reps-red)" strokeWidth="16" strokeDasharray={`${seg(11)} ${c - seg(11)}`} strokeDashoffset={-(seg(69) + seg(20))} transform="rotate(-90 80 80)" strokeLinecap="butt" />
      <text x="80" y="76" textAnchor="middle" className="fill-white font-display font-bold" style={{ fontSize: 22 }}>142</text>
      <text x="80" y="94" textAnchor="middle" className="fill-white/55" style={{ fontSize: 9 }}>Total Clients</text>
    </svg>
  );
}

function DonutLegend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <li className="flex items-center gap-2 whitespace-nowrap">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-white/80">{label}</span>
      <span className="text-white/55">{value}</span>
    </li>
  );
}

export function SpotlightRow({ isLocked = false }: { isLocked?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="overflow-hidden">
        <PanelHeader title="Client Spotlight" right={<span className="text-[12px] font-semibold text-reps-orange">View all</span>} />
        <div className="grid grid-cols-3 gap-2">
          {SPOTLIGHT.map((s) => (
            <div key={s.name} className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-3 text-center">
              <img src={s.avatar} alt="" className="mx-auto h-10 w-10 rounded-full object-cover" />
              <div className="mt-2 truncate text-[11px] font-semibold text-white">{s.name.split(" ")[0]}</div>
              <div className="text-[10px] font-bold text-reps-orange">{s.delta}</div>
            </div>
          ))}
        </div>
        {isLocked && <LockOverlay title="Client Spotlight" />}
      </Card>

      <Card className="overflow-hidden">
        <PanelHeader title="Action Items" icon={ClipboardList} />
        <ul className="space-y-2">
          {TASKS.map((t) => (
            <li key={t.title} className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2">
              <span className="truncate text-[12px] text-white/80">{t.title}</span>
              <span className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[9px] font-semibold ${t.color}`}>{t.pill.split(" ")[0]}</span>
            </li>
          ))}
        </ul>
        {isLocked && <LockOverlay title="Task Management" />}
      </Card>

      <Card className="overflow-hidden">
        <PanelHeader title="Upcoming Events" icon={Calendar} />
        <ul className="space-y-3">
          {EVENTS.map((e) => (
            <li key={e.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <span className="text-[9px] font-bold">{e.month}</span>
                <span className="text-[14px] font-bold leading-none">{e.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-white">{e.title}</div>
                <div className="truncate text-[10.5px] text-white/55">{e.sub}</div>
              </div>
            </li>
          ))}
        </ul>
        {isLocked && <LockOverlay title="Event Calendar" />}
      </Card>
    </div>
  );
}

export function BottomRow({ isLocked = false }: { isLocked?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <PanelHeader title="Business Growth Tips" icon={Sparkles} />
        <ul className="space-y-3">
          {TIPS.map((t) => (
            <li key={t.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange"><t.icon className="h-4 w-4" /></span>
              <div>
                <div className="text-[13px] font-semibold text-white">{t.title}</div>
                <div className="text-[11.5px] leading-snug text-white/55">{t.sub}</div>
              </div>
            </li>
          ))}
        </ul>
        {isLocked && <LockOverlay title="Business Growth" />}
      </Card>
      <Card>
        <PanelHeader title="Quick Support" icon={Inbox} />
        <p className="text-[13px] text-white/55">Need help with your REPS profile or business tools? Our team is here to help you succeed.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <OutlineButton><Mail className="h-4 w-4" /> Message Support</OutlineButton>
          <OutlineButton><FileText className="h-4 w-4" /> Help Center</OutlineButton>
        </div>
      </Card>
    </div>
  );
}

export function DashboardFooter() {
  return (
    <footer className="mt-8 flex flex-col items-center justify-between gap-3 px-8 py-6 text-[12px] text-white/55 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="font-display text-[18px] font-bold tracking-tight text-white">REPS</span>
        <span className="border-l border-white/15 pl-3 text-[10px] leading-tight">The Register of<br />Exercise Professionals</span>
      </div>
      <div className="flex items-center gap-5">
        <span>© 2026 REPS. All rights reserved.</span>
        <a href="#" className="hover:text-white">Privacy Policy</a>
        <a href="#" className="hover:text-white">Terms of Service</a>
      </div>
    </footer>
  );
}
