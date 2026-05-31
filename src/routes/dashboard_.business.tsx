import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ClipboardList,
  FileCheck2,
  FileSignature,
  FileText,
  Plus,
  Receipt,
  Search,
  Sparkles,
} from "lucide-react";

import { PCard, PPanel, ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/dashboard_/business")({
  head: () => ({
    meta: [
      { title: "Business Tools — REPs Professional" },
      {
        name: "description",
        content:
          "Invoices, contracts, intake forms, waivers and HMRC-ready exports — run the admin side of your business without leaving REPs.",
      },
      { property: "og:title", content: "Business Tools — REPs Professional" },
      { property: "og:description", content: "Business tools for REPs professionals." },
      { property: "og:url", content: "/dashboard/business" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/business" }],
  }),
  component: BusinessPage,
});

const TABS = [
  { l: "Invoices", icon: Receipt, active: true },
  { l: "Contracts", icon: FileSignature },
  { l: "Intake Forms", icon: ClipboardList },
  { l: "Waivers", icon: FileCheck2 },
  { l: "Tax & Exports", icon: ArrowDownToLine },
];

const STATS = [
  { label: "Outstanding", value: "£2,140", sub: "4 invoices" },
  { label: "Paid · 30d", value: "£12,680", sub: "23 invoices" },
  { label: "Overdue", value: "£480", sub: "1 invoice", tone: "warn" },
  { label: "Avg days to pay", value: "5.2", sub: "Industry avg 11" },
];

const INVOICES = [
  { no: "INV-1042", client: "Sarah Johnson", issued: "30 May", due: "13 Jun", amount: "£420", status: "Paid", tone: "ok" },
  { no: "INV-1041", client: "Marcus Hall", issued: "28 May", due: "11 Jun", amount: "£680", status: "Sent", tone: "neutral" },
  { no: "INV-1040", client: "Priya Mehta", issued: "26 May", due: "9 Jun", amount: "£240", status: "Paid", tone: "ok" },
  { no: "INV-1039", client: "Tom Whitfield", issued: "22 May", due: "5 Jun", amount: "£540", status: "Sent", tone: "neutral" },
  { no: "INV-1038", client: "Hannah Reid", issued: "18 May", due: "1 Jun", amount: "£480", status: "Overdue", tone: "warn" },
  { no: "INV-1037", client: "Eve Robinson", issued: "15 May", due: "29 May", amount: "£360", status: "Paid", tone: "ok" },
  { no: "INV-1036", client: "Rishi Patel", issued: "12 May", due: "26 May", amount: "£820", status: "Paid", tone: "ok" },
];

const TEMPLATES = [
  { name: "1:1 Coaching Agreement", signed: 34, last: "2 days ago" },
  { name: "Hybrid Programme T&Cs", signed: 18, last: "5 days ago" },
  { name: "Group Class Liability Waiver", signed: 96, last: "Yesterday" },
];

function toneClass(tone: string) {
  if (tone === "ok") return "bg-emerald-500/12 text-emerald-300";
  if (tone === "warn") return "bg-rose-500/12 text-rose-300";
  return "bg-reps-panel-soft text-white/70";
}

function BusinessPage() {
  return (
    <ProShell
      active="Business Tools"
      title="Business Tools"
      subtitle="Invoices, contracts, forms, waivers and tax exports — all in one place."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[13px] font-semibold text-white/80 shadow-none hover:text-white"
          >
            <ArrowDownToLine className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            <Plus className="h-4 w-4" /> New invoice
          </button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-reps-border pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.l}
              type="button"
              className={`flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold ${
                t.active
                  ? "bg-reps-orange-soft text-reps-orange"
                  : "text-white/65 hover:bg-reps-panel hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.l}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((s) => (
          <PCard key={s.label} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              {s.label}
            </div>
            <div
              className={`mt-2 font-display text-[24px] font-bold leading-none ${
                s.tone === "warn" ? "text-rose-300" : "text-white"
              }`}
            >
              {s.value}
            </div>
            <div className="mt-2 text-[11px] text-white/55">{s.sub}</div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT — invoices */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Invoices</h3>
              <div className="flex h-9 w-[220px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                <Search className="h-3.5 w-3.5" /> Search by client or no…
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-[11px] uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-5 py-3 font-medium">Invoice</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Issued</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-reps-border/60">
                  {INVOICES.map((i) => (
                    <tr key={i.no} className="transition-colors hover:bg-reps-panel-soft/40">
                      <td className="px-5 py-3 font-semibold text-white">{i.no}</td>
                      <td className="px-5 py-3 text-white/85">{i.client}</td>
                      <td className="px-5 py-3 text-white/65">{i.issued}</td>
                      <td className="px-5 py-3 text-white/65">{i.due}</td>
                      <td className="px-5 py-3 text-right font-semibold text-white">{i.amount}</td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${toneClass(
                            i.tone,
                          )}`}
                        >
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PPanel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-4">
          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Tax season ready</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                  Your 2025/26 self-assessment export is ready — £74,820 turnover, £18,940
                  allowable expenses, pre-filled HMRC fields.
                </p>
                <button
                  type="button"
                  className="mt-3 flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Download pack
                </button>
              </div>
            </div>
          </PCard>

          <PCard>
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Contracts & waivers</h3>
              <FileText className="h-4 w-4 text-white/55" />
            </div>
            <ul className="mt-3 space-y-3">
              {TEMPLATES.map((t) => (
                <li
                  key={t.name}
                  className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-3"
                >
                  <div className="text-[12.5px] font-semibold text-white">{t.name}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/55">
                    <span>{t.signed} signed</span>
                    <span>Updated {t.last}</span>
                  </div>
                </li>
              ))}
            </ul>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">Intake forms</h3>
            <p className="mt-1 text-[12px] text-white/55">3 active templates · 12 responses this week</p>
            <button
              type="button"
              className="mt-3 flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] font-semibold text-white/80 shadow-none hover:text-white"
            >
              <ClipboardList className="h-3.5 w-3.5" /> Manage templates
            </button>
          </PCard>
        </div>
      </div>
    </ProShell>
  );
}
