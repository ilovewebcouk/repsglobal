import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { backfillPrimaryLocations } from "@/lib/profile/location.functions";
import { listAdminAuditLog, type AuditLogRow } from "@/lib/admin-audit-list.functions";
import { TimeAgo } from "@/components/verification/TimeAgo";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/settings")({
  ssr: false,
  beforeLoad: requireRole(['admin']),
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
    <DashboardShell role="admin" active="Settings" title="Platform settings" subtitle="Production environment · v2026.05.31">
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
        <PPanel className="p-6">
          <h2 className="font-display text-[16px] font-semibold text-white">General</h2>
          <div className="mt-5 space-y-5">
            <Row label="Platform name" value="REPS — The Register of Exercise Professionals" />
            <Row label="Primary domain" value="repsglobal.com" />
            <Row label="Default region" value="Global" />
            <Row label="Currency" value="GBP (£)" />
            <Row label="Maintenance mode" value="Off" />
            <Row label="Public sign-ups" value="Enabled" />
          </div>
        </PPanel>

        <div className="space-y-6">
          <PCard>
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
          </PCard>

          <PCard>
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
          </PCard>

          <PCard>
            <h3 className="font-display text-[14px] font-semibold text-white">Integrations</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-white/80">
              {["Stripe — Payouts", "Resend — Transactional email", "Cloudflare R2 — Storage", "Mapbox — Location"].map((i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{i}</span>
                  <span className="text-[11px] font-semibold text-reps-green">Connected</span>
                </li>
              ))}
            </ul>
          </PCard>

          <MaintenanceCard />
        </div>
      </div>


      <AuditLogPanel />
    </DashboardShell>
  );
}

function AuditLogPanel() {
  const run = useServerFn(listAdminAuditLog);
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setErr(null);
    try {
      const r = await run({ data: { limit: 200 } });
      setRows(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PPanel className="mt-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-white">Audit log</h2>
          <p className="mt-1 text-[12px] text-white/55">
            Every privileged admin action recorded across the platform — most recent first.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={busy}>
          {busy ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {err ? <p className="mt-4 text-[12px] text-red-300">{err}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
              <th className="py-2 font-semibold">When</th>
              <th className="py-2 font-semibold">Actor</th>
              <th className="py-2 font-semibold">Action</th>
              <th className="py-2 font-semibold">Target</th>
              <th className="py-2 font-semibold">Reason / details</th>
            </tr>
          </thead>
          <tbody>
            {rows == null ? (
              <tr><td colSpan={5} className="py-6 text-center text-white/55">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-white/55">No admin actions yet.</td></tr>
            ) : rows.map((r) => {
              const details = r.reason ?? formatStateDelta(r.before_state, r.after_state);
              const target = r.target_name
                ? `${r.target_name}${r.target_table ? ` · ${r.target_table}` : ""}`
                : r.target_table
                  ? `${r.target_table}${r.target_id ? ` · ${r.target_id.slice(0, 8)}…` : ""}`
                  : "—";
              return (
                <tr key={r.id} className="border-t border-reps-border/60 align-top text-white/80">
                  <td className="py-3 pr-4 text-white/55 whitespace-nowrap">
                    <TimeAgo iso={r.created_at} />
                  </td>
                  <td className="py-3 pr-4 font-semibold text-white whitespace-nowrap">
                    {r.actor_name ?? r.actor_email ?? (r.actor_id ? `${r.actor_id.slice(0, 8)}…` : "System")}
                    {r.actor_email && r.actor_name ? (
                      <div className="text-[11px] font-normal text-white/45">{r.actor_email}</div>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-white/80 whitespace-nowrap font-mono text-[12px]">{r.action}</td>
                  <td className="py-3 pr-4 text-white/65">{target}</td>
                  <td className="py-3 text-white/55 text-[12px]">{details ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PPanel>
  );
}

function formatStateDelta(before: string | null, after: string | null): string | null {
  if (!before && !after) return null;
  const b = before ? safeParse(before) : null;
  const a = after ? safeParse(after) : null;
  if (b && a && typeof b === "object" && typeof a === "object") {
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    const parts: string[] = [];
    for (const k of keys) {
      const bv = (b as Record<string, unknown>)[k];
      const av = (a as Record<string, unknown>)[k];
      if (JSON.stringify(bv) !== JSON.stringify(av)) {
        parts.push(`${k}: ${fmt(bv)} → ${fmt(av)}`);
      }
    }
    if (parts.length) return parts.join(" · ");
  }
  return after ?? before;
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "string") return v.length > 40 ? `${v.slice(0, 40)}…` : v;
  return JSON.stringify(v);
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

function MaintenanceCard() {
  const run = useServerFn(backfillPrimaryLocations);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ updated: number; skipped: number; failed: number; total: number } | null>(null);

  async function onBackfill() {
    setBusy(true);
    try {
      const r = await run();
      setResult(r);
      toast.success(`Re-derived ${r.updated} of ${r.total} primary locations.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PCard>
      <h3 className="font-display text-[14px] font-semibold text-white">Maintenance</h3>
      <p className="mt-2 text-[12px] text-white/55">
        Re-resolve every primary postcode through postcodes.io and refresh town / region / district to the latest display rules (e.g. "Holborn and Covent Garden, London" instead of just "London").
      </p>
      <Button
        size="sm"
        onClick={onBackfill}
        disabled={busy}
        className="mt-3"
      >
        {busy ? "Re-deriving…" : "Re-derive primary locations"}
      </Button>
      {result ? (
        <p className="mt-2 text-[12px] text-white/65">
          Updated {result.updated} · Skipped {result.skipped} · Failed {result.failed} · Total {result.total}
        </p>
      ) : null}
    </PCard>
  );
}
