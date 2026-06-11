import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarPlus,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Upload,
  UserCheck,
} from "lucide-react";

import { ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/leads")({
  head: () => ({
    meta: [
      { title: "Leads pipeline — REPS Professional" },
      {
        name: "description",
        content:
          "Track enquiries, prioritise follow-ups and convert leads into clients from your REPS professional dashboard.",
      },
      { property: "og:title", content: "Leads pipeline — REPS Professional" },
      {
        property: "og:description",
        content:
          "Track enquiries, prioritise follow-ups and convert leads into clients.",
      },
      { property: "og:url", content: "/dashboard/leads" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/leads" }],
  }),
  component: LeadsPage,
});

/* ============================================================
   PRIMITIVES
   ============================================================ */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[16px] border border-reps-border bg-reps-panel p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-reps-border bg-reps-panel ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[15px] font-semibold text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-white/55">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

/* ============================================================
   PIPELINE METRIC CARDS
   ============================================================ */

type Metric = {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "soft";
};

const METRICS: Metric[] = [
  { label: "New leads", value: "32", delta: "+12% this week", tone: "up" },
  { label: "Call booked", value: "18", delta: "+8% this week", tone: "up" },
  { label: "Proposal sent", value: "11", delta: "+5% this week", tone: "up" },
  { label: "Trial booked", value: "7", delta: "+3% this week", tone: "up" },
  { label: "Converted", value: "5", delta: "+20% this week", tone: "up" },
];

function MetricCard({ m }: { m: Metric }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-white/50">
        {m.label}
      </div>
      <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">
        {m.value}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-reps-orange">
        <ArrowUpRight className="h-3 w-3" />
        {m.delta}
      </div>
    </Card>
  );
}

function RevenueInsight() {
  return (
    <Card className="flex flex-col justify-between bg-gradient-to-br from-reps-panel to-reps-orange/10 p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-white/55">
        Potential monthly revenue
      </div>
      <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">
        £4,780
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-reps-orange">
        <Sparkles className="h-3 w-3" />
        Based on pipeline value
      </div>
    </Card>
  );
}

/* ============================================================
   PIPELINE TABLE
   ============================================================ */

type LeadStatus =
  | "New"
  | "Call booked"
  | "Proposal sent"
  | "Trial booked"
  | "Converted";
type LeadPriority = "High" | "Medium" | "Low";

type Lead = {
  name: string;
  initials: string;
  goal: string;
  source: string;
  status: LeadStatus;
  value: string;
  followUp: string;
  priority: LeadPriority;
};

const LEADS: Lead[] = [
  {
    name: "Sarah Johnson",
    initials: "SJ",
    goal: "Weight loss coaching",
    source: "REPS profile",
    status: "New",
    value: "£600",
    followUp: "Today",
    priority: "High",
  },
  {
    name: "Michael Brown",
    initials: "MB",
    goal: "Strength training",
    source: "Directory search",
    status: "Call booked",
    value: "£480",
    followUp: "Tomorrow",
    priority: "Medium",
  },
  {
    name: "Emma Wilson",
    initials: "EW",
    goal: "Online coaching",
    source: "Website",
    status: "Proposal sent",
    value: "£720",
    followUp: "2 days",
    priority: "High",
  },
  {
    name: "David Lee",
    initials: "DL",
    goal: "Muscle building",
    source: "Referral",
    status: "Trial booked",
    value: "£900",
    followUp: "3 days",
    priority: "High",
  },
  {
    name: "Olivia Taylor",
    initials: "OT",
    goal: "Pilates and mobility",
    source: "Instagram",
    status: "Call booked",
    value: "£360",
    followUp: "4 days",
    priority: "Medium",
  },
  {
    name: "James Smith",
    initials: "JS",
    goal: "General fitness",
    source: "Facebook",
    status: "New",
    value: "£300",
    followUp: "Today",
    priority: "Low",
  },
];

const STATUS_STYLE: Record<LeadStatus, string> = {
  New: "bg-reps-orange-soft text-reps-orange",
  "Call booked": "bg-sky-500/15 text-sky-300",
  "Proposal sent": "bg-violet-500/15 text-violet-300",
  "Trial booked": "bg-amber-500/15 text-amber-300",
  Converted: "bg-emerald-500/15 text-emerald-300",
};

const PRIORITY_STYLE: Record<LeadPriority, string> = {
  High: "bg-reps-orange-soft text-reps-orange",
  Medium: "bg-white/10 text-white/75",
  Low: "bg-white/5 text-white/55",
};

const FILTER_CHIPS = [
  "All leads",
  "New",
  "Call booked",
  "Proposal sent",
  "Trial booked",
  "Converted",
];

const SOURCE_CHIPS = [
  "All sources",
  "REPS profile",
  "Directory search",
  "Website",
  "Referral",
  "Instagram",
];

function PipelinePanel() {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Lead pipeline"
        subtitle="32 active leads · sorted by priority and follow-up"
        right={
          <div className="flex h-9 w-[260px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">Search leads…</span>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTER_CHIPS.map((c, i) => (
          <button
            key={c}
            type="button"
            className={`h-8 rounded-full px-3 text-[12px] font-semibold shadow-none transition-colors ${
              i === 0
                ? "bg-reps-orange text-white"
                : "border border-reps-border bg-reps-panel-soft text-white/70 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
          Source
        </span>
        {SOURCE_CHIPS.map((c, i) => (
          <button
            key={c}
            type="button"
            className={`h-7 rounded-full px-2.5 text-[11px] font-medium shadow-none transition-colors ${
              i === 0
                ? "bg-white/10 text-white"
                : "border border-reps-border bg-reps-panel-soft text-white/60 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-[16px] border border-reps-border">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-reps-panel-soft">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
              <th className="px-4 py-3">Lead</th>
              <th className="px-3 py-3">Goal</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Est. value</th>
              <th className="px-3 py-3">Follow-up</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {LEADS.map((lead, idx) => (
              <tr
                key={lead.name}
                className={`border-t border-reps-border ${
                  idx === 0 ? "bg-reps-orange/5" : "hover:bg-white/[0.02]"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                      {lead.initials}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{lead.name}</div>
                      <div className="text-[11px] text-white/45">
                        Lead · {lead.source}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-white/80">{lead.goal}</td>
                <td className="px-3 py-3 text-white/65">{lead.source}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${STATUS_STYLE[lead.status]}`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-3 py-3 font-semibold text-white">
                  {lead.value}
                </td>
                <td className="px-3 py-3 text-white/75">{lead.followUp}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${PRIORITY_STYLE[lead.priority]}`}
                  >
                    {lead.priority}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      aria-label="Message"
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/70 shadow-none transition-colors hover:text-white"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Call"
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/70 shadow-none transition-colors hover:text-white"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="More"
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/70 shadow-none transition-colors hover:text-white"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ============================================================
   SELECTED LEAD DETAIL
   ============================================================ */

function SelectedLead() {
  const rows: [string, string][] = [
    ["Source", "REPS profile"],
    ["Goal", "Weight loss coaching"],
    ["Estimated value", "£600"],
    ["Preferred format", "In-person and online"],
    ["Location", "London"],
    ["Last activity", "Enquired 2 hours ago"],
    ["Follow-up due", "Today"],
  ];
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-reps-orange-soft text-[14px] font-semibold text-reps-orange">
          SJ
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-semibold text-white">
            Sarah Johnson
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
            <span className="inline-flex h-5 items-center rounded-full bg-reps-orange-soft px-2 font-semibold text-reps-orange">
              New lead
            </span>
            <span className="text-white/50">
              <MapPin className="mr-1 inline h-3 w-3" />
              London
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-5 space-y-2.5 text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <dt className="text-white/50">{k}</dt>
            <dd className="text-right font-medium text-white/85">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 rounded-[12px] border border-reps-border bg-reps-panel-soft p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Lead message
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-white/80">
          “Hi James, I’m looking for help with fat loss and getting back into
          consistent training. I’d like to know more about your coaching
          options.”
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
        >
          <CalendarPlus className="h-4 w-4" />
          Book call
        </button>
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          <Send className="h-4 w-4" />
          Send message
        </button>
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
        >
          <FileText className="h-4 w-4" />
          Create proposal
        </button>
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-3 text-[12.5px] font-semibold text-reps-orange shadow-none transition-colors hover:bg-reps-orange/15"
        >
          <UserCheck className="h-4 w-4" />
          Convert to client
        </button>
      </div>
    </Panel>
  );
}

function AiInsight() {
  return (
    <Card className="border-reps-orange-border bg-gradient-to-br from-reps-panel to-reps-orange/10">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="font-display text-[13.5px] font-semibold text-white">
            AI lead insight
          </div>
          <div className="text-[11px] text-white/55">
            High-intent enquiry · auto-scored
          </div>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-white/80">
        High-intent enquiry. Sarah mentioned a clear goal, preferred coaching
        format and requested next steps. Recommended action: book a
        consultation today.
      </p>
      <button
        type="button"
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Draft reply
      </button>
    </Card>
  );
}

/* ============================================================
   LOWER SUPPORTING CARDS
   ============================================================ */

function FollowUpsCard() {
  const items: { name: string; initials: string; when: string; tone: string }[] = [
    { name: "Sarah Johnson", initials: "SJ", when: "Today", tone: "text-reps-orange" },
    { name: "James Smith", initials: "JS", when: "Today", tone: "text-reps-orange" },
    { name: "Michael Brown", initials: "MB", when: "Tomorrow", tone: "text-white/65" },
  ];
  return (
    <Card>
      <SectionHeader title="Follow-ups due" subtitle="Next 48 hours" />
      <ul className="space-y-3">
        {items.map((i) => (
          <li
            key={i.name}
            className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
              {i.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-white">
                {i.name}
              </div>
              <div className={`text-[11px] font-medium ${i.tone}`}>{i.when}</div>
            </div>
            <button
              type="button"
              className="flex h-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel px-3 text-[11.5px] font-semibold text-white/80 shadow-none transition-colors hover:text-white"
            >
              Open
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LeadSourcesCard() {
  const items = [
    { label: "REPS profile", pct: 42 },
    { label: "Directory search", pct: 28 },
    { label: "Website", pct: 18 },
    { label: "Referral", pct: 12 },
  ];
  return (
    <Card>
      <SectionHeader title="Lead sources" subtitle="Last 30 days" />
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.label}>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-white/75">{i.label}</span>
              <span className="font-semibold text-white">{i.pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-reps-orange"
                style={{ width: `${i.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ConversionCard() {
  const items = [
    { label: "Lead to call", pct: "56%" },
    { label: "Call to proposal", pct: "42%" },
    { label: "Proposal to client", pct: "31%" },
  ];
  return (
    <Card>
      <SectionHeader title="Conversion performance" subtitle="Rolling 30-day" />
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li
            key={i.label}
            className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12.5px]"
          >
            <span className="text-white/75">{i.label}</span>
            <span className="font-semibold text-white">{i.pct}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-[12px] border border-reps-orange-border bg-reps-orange-soft px-3 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-reps-orange/85">
            Average client value
          </div>
          <div className="mt-0.5 font-display text-[18px] font-bold text-white">
            £480
          </div>
        </div>
        <CheckCircle2 className="h-5 w-5 text-reps-orange" />
      </div>
    </Card>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function LeadsPage() {
  return (
    <ProShell
      active="Leads"
      title="Leads pipeline"
      subtitle="Track enquiries, prioritise follow-ups and convert leads into clients."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none transition-colors hover:text-white"
          >
            <Upload className="h-4 w-4" />
            Import leads
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
          >
            <Plus className="h-4 w-4" />
            New lead
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Pipeline metric strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {METRICS.map((m) => (
            <MetricCard key={m.label} m={m} />
          ))}
          <RevenueInsight />
        </div>

        {/* Main grid: pipeline + selected lead */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-8">
            <PipelinePanel />
          </div>
          <div className="col-span-12 space-y-5 xl:col-span-4">
            <SelectedLead />
            <AiInsight />
          </div>
        </div>

        {/* Lower supporting cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <FollowUpsCard />
          <LeadSourcesCard />
          <ConversionCard />
        </div>
      </div>
    </ProShell>
  );
}