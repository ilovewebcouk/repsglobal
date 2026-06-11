import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, ACard, APanel } from "@/components/dashboard/AdminShell";

export const Route = createFileRoute("/admin_/settings")({
  head: () => ({
    meta: [
      { title: "Platform settings — REPS Admin" },
      { name: "description", content: "Configure REPS platform-wide settings: branding, email, integrations and feature flags." },
      { property: "og:title", content: "Platform settings — REPS Admin" },
      { property: "og:description", content: "REPS platform configuration." },
    ],
  }),
  component: AdminSettings,
});

const TABS = ["General", "Branding", "Email", "Integrations", "Feature flags", "Audit log"] as const;

function AdminSettings() {
  return (
    <AdminShell active="Settings" title="Platform settings" subtitle="Production environment · v2026.05.31">
      <div className="mb-6 flex flex-wrap gap-1 rounded-[10px] border border-reps-border bg-reps-panel p-1 text-[12px] font-medium">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`rounded-[8px] px-3 py-2 ${i === 0 ? "bg-reps-orange-soft text-reps-orange" : "text-white/65 hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <APanel className="p-6">
          <h2 className="font-display text-[16px] font-semibold text-white">General</h2>
          <div className="mt-5 space-y-5">
            <Row label="Platform name" value="REPS — The Register of Exercise Professionals" />
            <Row label="Primary domain" value="repsglobal.com" />
            <Row label="Default region" value="Global" />
            <Row label="Currency" value="GBP (£)" />
            <Row label="Maintenance mode" value="Off" />
            <Row label="Public sign-ups" value="Enabled" />
          </div>
        </APanel>

        <div className="space-y-6">
          <ACard>
            <h3 className="font-display text-[14px] font-semibold text-white">Branding</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { token: "--reps-orange", label: "Brand orange" },
                { token: "--reps-ink", label: "Ink" },
                { token: "--reps-warm-white", label: "Warm white" },
              ].map((c) => (
                <div key={c.token} className="rounded-[8px] border border-reps-border bg-reps-ink p-3">
                  <div className="h-10 rounded-[6px]" style={{ background: `var(${c.token})` }} />
                  <div className="mt-1.5 font-mono text-[10px] text-white/55">{c.token}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-white/55">Primary brand orange, ink and warm white tokens.</p>
          </ACard>

          <ACard>
            <h3 className="font-display text-[14px] font-semibold text-white">Feature flags</h3>
            <ul className="mt-3 space-y-2 text-[13px]">
              {[
                ["AI Business Command Centre", true],
                ["Nutrition plan builder", true],
                ["Live booking calendar", true],
                ["BD migration imports", false],
                ["Public review responses", true],
              ].map(([l, on]) => (
                <li key={l as string} className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-ink px-3 py-2">
                  <span className="text-white/80">{l}</span>
                  <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${on ? "bg-reps-green/15 text-reps-green" : "bg-white/10 text-white/55"}`}>
                    {on ? "On" : "Off"}
                  </span>
                </li>
              ))}
            </ul>
          </ACard>

          <ACard>
            <h3 className="font-display text-[14px] font-semibold text-white">Integrations</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-white/80">
              {["Stripe — Payouts", "Resend — Transactional email", "Cloudflare R2 — Storage", "Mapbox — Location"].map((i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{i}</span>
                  <span className="text-[11px] font-semibold text-reps-green">Connected</span>
                </li>
              ))}
            </ul>
          </ACard>
        </div>
      </div>

      <APanel className="mt-6 p-6">
        <h2 className="font-display text-[16px] font-semibold text-white">Recent audit log</h2>
        <table className="mt-4 w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
              <th className="py-2 font-semibold">When</th>
              <th className="py-2 font-semibold">Actor</th>
              <th className="py-2 font-semibold">Action</th>
              <th className="py-2 font-semibold">Target</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Today 14:02", "James Admin", "Approved verification", "Aaron Mitchell"],
              ["Today 11:47", "Emma R.", "Toggled feature flag", "Public review responses → On"],
              ["Yesterday", "Tom B.", "Refunded payment", "INV-2024-0918 · £180"],
              ["Yesterday", "James Admin", "Suspended account", "spammer-acct-2241"],
              ["2d ago", "System", "Crawl completed", "2,418 listings scanned"],
            ].map((r, i) => (
              <tr key={i} className="border-t border-reps-border/60 text-white/80">
                <td className="py-3 text-white/55">{r[0]}</td>
                <td className="py-3 font-semibold text-white">{r[1]}</td>
                <td className="py-3 text-white/70">{r[2]}</td>
                <td className="py-3 text-white/65">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </APanel>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-reps-border/60 pb-4 last:border-0 last:pb-0">
      <div className="text-[13px] text-white/65">{label}</div>
      <div className="flex items-center gap-3">
        <div className="text-[13px] font-semibold text-white">{value}</div>
        <button className="text-[12px] font-semibold text-reps-orange hover:underline">Edit</button>
      </div>
    </div>
  );
}
