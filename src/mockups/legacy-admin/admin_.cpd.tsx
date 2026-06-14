import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/admin_/cpd")({
  ssr: false,
  beforeLoad: requireRole(['admin']),
  head: () => ({
    meta: [
      { title: "CPD oversight — REPS Admin" },
      { name: "description", content: "Track CPD compliance, evidence audits and the course catalogue." },
      { property: "og:title", content: "CPD oversight — REPS Admin" },
      { property: "og:description", content: "Cycle compliance and evidence review for REPS professionals." },
    ],
  }),
  component: AdminCpd,
});

function AdminCpd() {
  return (
    <DashboardShell role="admin" active="CPD" title="CPD oversight" subtitle="Current cycle: Jan 2026 – Dec 2026">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Compliance", v: "84%", d: "1,824 / 2,168 pros" },
          { l: "At risk", v: "168", d: "< 12 points logged", tone: "warn" },
          { l: "Evidence pending", v: "47", d: "Awaiting audit" },
          { l: "Courses in catalogue", v: "312", d: "12 awaiting moderation" },
        ].map((k) => (
          <PCard key={k.l}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">{k.l}</div>
            <div className="mt-2 font-display text-[28px] font-bold text-white">{k.v}</div>
            <div className={`mt-1 text-[12px] ${k.tone === "warn" ? "text-rose-400" : "text-reps-green"}`}>{k.d}</div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PPanel className="p-6">
          <h2 className="font-display text-[16px] font-semibold text-white">Pros at risk this cycle</h2>
          <table className="mt-4 w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                <th className="py-2 font-semibold">Professional</th>
                <th className="py-2 font-semibold">Points</th>
                <th className="py-2 font-semibold">Deadline</th>
                <th className="py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Aaron Mitchell", 4, "31 Dec 2026"],
                ["Bethany Ngozi", 6, "31 Dec 2026"],
                ["Connor Davies", 8, "31 Dec 2026"],
                ["Diya Kapoor", 9, "31 Dec 2026"],
                ["Ewan MacLeod", 10, "31 Dec 2026"],
              ].map(([n, p, d]) => (
                <tr key={n as string} className="border-t border-reps-border/60 text-white/80">
                  <td className="py-3 font-semibold text-white">{n}</td>
                  <td className="py-3">
                    <span className="inline-flex h-6 items-center rounded-full bg-rose-500/15 px-2.5 text-[11px] font-semibold text-rose-300">
                      {p} / 20
                    </span>
                  </td>
                  <td className="py-3 text-white/65">{d}</td>
                  <td className="py-3">
                    <button className="text-[12px] font-semibold text-reps-orange hover:underline">Send reminder</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PPanel>

        <PPanel className="p-6">
          <h2 className="font-display text-[16px] font-semibold text-white">Course catalogue moderation</h2>
          <ul className="mt-4 space-y-3 text-[13px]">
            {[
              { t: "Coaching the postnatal client", p: "FitPro Education", s: "Pending" },
              { t: "Pre-screening for return-to-sport", p: "Sports Therapy Institute", s: "Pending" },
              { t: "Nutrition coaching essentials", p: "REPS Academy", s: "Approved" },
              { t: "Strength for over-50s", p: "Active IQ", s: "Pending" },
            ].map((c) => (
              <li key={c.t} className="rounded-[10px] border border-reps-border bg-reps-ink p-3">
                <div className="text-[13px] font-semibold text-white">{c.t}</div>
                <div className="mt-0.5 text-[11px] text-white/55">{c.p}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${c.s === "Approved" ? "bg-reps-green/15 text-reps-green" : "bg-reps-orange-soft text-reps-orange"}`}>
                    {c.s}
                  </span>
                  <button className="text-[11px] font-semibold text-reps-orange hover:underline">Review</button>
                </div>
              </li>
            ))}
          </ul>
        </PPanel>
      </div>
    </DashboardShell>
  );
}
