import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { AlertTriangle, Globe2, Star } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/admin_/directory")({
  ssr: false,
  beforeLoad: requireRole(['admin']),
  head: () => ({
    meta: [
      { title: "Directory health — REPS Admin" },
      { name: "description", content: "Monitor public directory completeness, broken links and featured rotation." },
      { property: "og:title", content: "Directory health — REPS Admin" },
      { property: "og:description", content: "Public directory health and featured-pro rotation." },
    ],
  }),
  component: AdminDirectory,
});

function AdminDirectory() {
  return (
    <DashboardShell role="admin" active="Directory" title="Directory health" subtitle="2,418 live listings · 87% completeness average">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Live listings", value: "2,418", delta: "+62 this week" },
          { label: "Completeness", value: "87%", delta: "+3.2% vs last month" },
          { label: "Broken links", value: "14", delta: "−6 this week", tone: "warn" },
          { label: "Featured slots", value: "12 / 12", delta: "Next rotation Mon" },
        ].map((k) => (
          <PCard key={k.label}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">{k.label}</div>
            <div className="mt-2 font-display text-[28px] font-bold text-white">{k.value}</div>
            <div className={`mt-1 text-[12px] ${k.tone === "warn" ? "text-rose-400" : "text-reps-green"}`}>{k.delta}</div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PPanel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[16px] font-semibold text-white">Listings needing attention</h2>
            <button className="text-[12px] font-semibold text-reps-orange hover:underline">View all</button>
          </div>
          <table className="mt-4 w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                <th className="py-2 font-semibold">Professional</th>
                <th className="py-2 font-semibold">Issue</th>
                <th className="py-2 font-semibold">Completeness</th>
                <th className="py-2 font-semibold">Last edit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: "Aaron Mitchell", i: "Missing services pricing", c: 64, l: "8d ago" },
                { n: "Bethany Ngozi", i: "Broken Instagram link", c: 78, l: "3d ago" },
                { n: "Connor Davies", i: "No profile photo", c: 52, l: "21d ago" },
                { n: "Diya Kapoor", i: "Qualifications unverified", c: 71, l: "1d ago" },
                { n: "Ewan MacLeod", i: "Empty about section", c: 58, l: "14d ago" },
                { n: "Freya Lockhart", i: "Studio address invalid", c: 69, l: "6d ago" },
              ].map((r) => (
                <tr key={r.n} className="border-t border-reps-border/60 text-white/80">
                  <td className="py-3 font-semibold text-white">{r.n}</td>
                  <td className="py-3 text-white/65">{r.i}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-reps-ink">
                        <div className="h-full rounded-full bg-reps-orange" style={{ width: `${r.c}%` }} />
                      </div>
                      <span className="text-[12px] text-white/55">{r.c}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-white/55">{r.l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PPanel>

        <div className="space-y-6">
          <PPanel className="p-6">
            <div className="flex items-center gap-2 text-white">
              <Star className="h-4 w-4 text-reps-orange" />
              <h2 className="font-display text-[16px] font-semibold">Featured rotation</h2>
            </div>
            <ul className="mt-4 space-y-3 text-[13px]">
              {[
                "James Carter — Personal Trainer · London",
                "Sophie Williams — Pilates · Manchester",
                "Marcus Reid — S&C Coach · Bristol",
                "Priya Shah — Nutritionist · Leeds",
              ].map((p) => (
                <li key={p} className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-ink px-3 py-2 text-white/80">
                  {p}
                  <button className="text-[11px] font-semibold text-reps-orange hover:underline">Demote</button>
                </li>
              ))}
            </ul>
          </PPanel>
          <PCard>
            <div className="flex items-center gap-2 text-white">
              <Globe2 className="h-4 w-4 text-reps-orange" />
              <h3 className="font-display text-[14px] font-semibold">Geographic coverage</h3>
            </div>
            <ul className="mt-3 space-y-2 text-[13px] text-white/75">
              {[
                ["London", 412], ["Manchester", 188], ["Birmingham", 142], ["Leeds", 96], ["Bristol", 84],
              ].map(([city, n]) => (
                <li key={city as string} className="flex items-center justify-between">
                  <span>{city}</span>
                  <span className="font-semibold text-white">{n}</span>
                </li>
              ))}
            </ul>
          </PCard>
          <PCard className="border-rose-500/30 bg-rose-500/[0.04]">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="font-display text-[14px] font-semibold">Crawl alerts</h3>
            </div>
            <p className="mt-2 text-[12px] text-white/70">
              14 outbound links failed in the last sweep. Re-run scan or open the broken-links queue to triage.
            </p>
            <button className="mt-3 inline-flex h-9 items-center rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
              Re-run crawl
            </button>
          </PCard>
        </div>
      </div>
    </DashboardShell>
  );
}
