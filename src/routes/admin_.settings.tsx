import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { backfillPrimaryLocations } from "@/lib/profile/location.functions";
import { listAdminAuditLog, type AuditLogRow } from "@/lib/admin-audit-list.functions";
import { sendRelaunchTestEmail } from "@/lib/admin/send-relaunch-test.functions";
import { getRelaunchBroadcastStatus, previewRelaunchAudience, sendRelaunchBroadcast } from "@/lib/admin/send-relaunch-broadcast.functions";
import { sendNewRepsRolloutTestEmail } from "@/lib/admin/send-new-reps-rollout-test.functions";
import { getNewRepsRolloutStatus, previewNewRepsRolloutAudience, sendNewRepsRolloutBroadcast } from "@/lib/admin/send-new-reps-rollout-broadcast.functions";
import { TimeAgo } from "@/components/verification/TimeAgo";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/settings")({
  ssr: false,
  beforeLoad: requireRole(['admin']),
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }, 
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
      <div className="mb-6 rounded-[12px] border border-amber-400/40 bg-amber-500/10 p-4 text-[13px] text-amber-100">
        <strong>Read-only.</strong> Inline editing of platform settings is not available yet — the tabs and Edit buttons below are placeholders. Only the <em>Maintenance</em> action and the <em>Audit log</em> at the bottom are live.
      </div>
      <div className="mb-6 flex flex-wrap gap-1 rounded-[10px] border border-reps-border bg-reps-panel p-1 text-[12px] font-medium opacity-60">
        {TABS.map((t, i) => (
          <button
            key={t}
            disabled
            className={`rounded-[8px] px-3 py-2 ${i === 0 ? "bg-reps-orange-soft text-reps-orange" : "text-white/65"}`}
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
                ["Member CSV imports", false],
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
          <RelaunchTestCard />
          <RelaunchBroadcastCard />
          <NewRepsRolloutTestCard />
          <NewRepsRolloutBroadcastCard />
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

function RelaunchTestCard() {
  const run = useServerFn(sendRelaunchTestEmail);
  const [email, setEmail] = useState("cruz.pt@icloud.com");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      await run({ data: { recipientEmail: email } });
      toast.success(`Relaunch email queued to ${email}. Should land within a minute.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PCard>
      <h3 className="font-display text-[14px] font-semibold text-white">Relaunch email test</h3>
      <p className="mt-2 text-[12px] text-white/55">
        Send the relaunch announcement to a single address to QA in your inbox before the bulk run.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-3 w-full rounded-[8px] border border-reps-border bg-reps-ink px-3 py-2 text-[13px] text-white outline-none focus:border-reps-orange/60"
      />
      <Button size="sm" onClick={send} disabled={busy || !email} className="mt-3">
        {busy ? "Sending…" : "Send test"}
      </Button>
    </PCard>
  );
}

function RelaunchBroadcastCard() {
  const preview = useServerFn(previewRelaunchAudience);
  const broadcast = useServerFn(sendRelaunchBroadcast);
  const status = useServerFn(getRelaunchBroadcastStatus);
  const [audience, setAudience] = useState<{
    total: number;
    bySource: Record<string, number>;
    sample: string[];
  } | null>(null);
  const [snapshot, setSnapshot] = useState<{
    total: number;
    alreadySent: number;
    remaining: number;
    lastSentAt: string | null;
    broadcastTag: string;
  } | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    queued: number;
    sent?: number;
    alreadySent?: number;
    skipped: number;
    failed: number;
    remaining?: number;
    paused?: boolean;
    retryAt?: string | null;
    pauseReason?: string | null;
    firstErrors: Array<{ email: string; error: string }>;
  } | null>(null);

  // Auto-load the live status on mount so the operator can see progress
  // (sent / remaining / last sent at) without having to click anything.
  useEffect(() => {
    let cancelled = false;
    status()
      .then((s) => {
        if (!cancelled) setSnapshot(s);
      })
      .catch(() => { /* ignore — surfaces via "Refresh status" button */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshStatus() {
    setBusy(true);
    try {
      const s = await status();
      setSnapshot(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Status check failed");
    } finally {
      setBusy(false);
    }
  }

  async function runPreview() {
    setBusy(true);
    setResult(null);
    try {
      const r = await preview();
      setAudience(r);
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function runBroadcast() {
    if (!audience) return;
    setBusy(true);
    try {
      const r = await broadcast({ data: { confirmToken: confirm } });
      setResult(r);
      if (r.paused) {
        toast.info(`Sent ${r.sent ?? 0} new emails. ${r.remaining ?? 0} still remaining.`);
      } else {
        toast.success(`Sent ${r.queued} of ${r.total}.`);
      }
      // refresh snapshot after a send
      try { setSnapshot(await status()); } catch { /* ignore */ }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setBusy(false);
    }
  }

  const expectedToken = audience ? `SEND-${audience.total}` : "";
  const tokenOk = audience !== null && confirm === expectedToken;

  return (
    <PCard>
      <h3 className="font-display text-[14px] font-semibold text-white">Relaunch broadcast</h3>
      <p className="mt-2 text-[12px] text-white/55">
        Sends the relaunch announcement to every member (confirmed accounts + BD-seed members),
        excluding admins, demos and suppressed addresses. Per-recipient idempotency prevents duplicates.
      </p>

      {/* Live progress snapshot — auto-loads on mount */}
      {snapshot ? (
        <div className="mt-3 rounded-[10px] border border-reps-border bg-reps-ink p-3 text-[12px] text-white/85">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span><strong className="text-white">{snapshot.alreadySent.toLocaleString()}</strong> sent</span>
            <span className="text-white/55">·</span>
            <span><strong className={snapshot.remaining > 0 ? "text-amber-200" : "text-emerald-200"}>{snapshot.remaining.toLocaleString()}</strong> remaining</span>
            <span className="text-white/55">·</span>
            <span className="text-white/55">{snapshot.total.toLocaleString()} total audience</span>
          </div>
          {snapshot.lastSentAt ? (
            <div className="mt-1 text-white/55">
              Last send accepted by Mailgun: {new Date(snapshot.lastSentAt).toLocaleString("en-GB")}
            </div>
          ) : null}
          {snapshot.remaining === 0 ? (
            <div className="mt-2 text-emerald-200">All members have been sent the relaunch email.</div>
          ) : (
            <div className="mt-2 text-amber-100/90">
              You can resume sending — the next run will send up to 75 new emails and skip anyone already sent.
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={refreshStatus} disabled={busy} className="mt-2 px-0 text-reps-orange hover:text-reps-orange">
            Refresh status
          </Button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={runPreview} disabled={busy}>
          {busy && !audience ? "Resolving…" : audience ? "Re-count audience" : "Dry-run — count audience"}
        </Button>
        {snapshot && snapshot.remaining > 0 && audience ? (
          <span className="text-[11px] text-white/55 self-center">
            Type <code className="text-reps-orange">{expectedToken}</code> below to resume.
          </span>
        ) : null}
      </div>


      {audience ? (
        <div className="mt-4 space-y-3 rounded-[10px] border border-reps-border bg-reps-ink p-3 text-[12px] text-white/80">
          <div>
            <span className="font-semibold text-white">{audience.total.toLocaleString()}</span> recipients
            <span className="text-white/55">
              {" "}· {Object.entries(audience.bySource)
                .map(([k, v]) => `${v} ${k.replace("_", " ")}`)
                .join(" · ")}
            </span>
          </div>
          <div className="text-white/55">
            Sample: {audience.sample.map((e) => maskEmail(e)).join(", ") || "—"}
          </div>

          <div className="border-t border-reps-border pt-3">
            <label className="block text-[11px] uppercase tracking-[0.06em] text-white/55">
              To send, type <code className="text-reps-orange">{expectedToken}</code>
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={expectedToken}
              className="mt-2 w-full rounded-[8px] border border-reps-border bg-reps-panel px-3 py-2 text-[13px] text-white outline-none focus:border-reps-orange/60"
            />
            <Button
              size="sm"
              onClick={runBroadcast}
              disabled={busy || !tokenOk}
              className="mt-3"
            >
              {busy ? "Enqueuing…" : `Send to ${audience.total.toLocaleString()} members`}
            </Button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={`mt-3 rounded-[10px] border p-3 text-[12px] ${result.paused ? "border-amber-400/30 bg-amber-500/10 text-amber-100" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"}`}>
          Sent <strong>{result.queued}</strong> of {result.total}
          {typeof result.sent === "number" ? <> · new this run {result.sent}</> : null}
          {typeof result.alreadySent === "number" ? <> · already sent {result.alreadySent}</> : null}
          {typeof result.remaining === "number" ? <> · remaining {result.remaining}</> : null}
          <> · skipped {result.skipped} · failed {result.failed}.</>
          {result.pauseReason ? <p className="mt-2">{result.pauseReason}</p> : null}
          {result.failed > 0 || result.paused ? (
            <ul className={`mt-2 list-disc pl-4 ${result.paused ? "text-amber-100/80" : "text-emerald-200/80"}`}>
              {result.firstErrors.map((e) => (
                <li key={e.email}>
                  {maskEmail(e.email)} — {e.error}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </PCard>
  );
}

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  if (!u || !d) return e;
  const head = u.length <= 2 ? u : `${u.slice(0, 2)}…`;
  return `${head}@${d}`;
}

function NewRepsRolloutTestCard() {
  const run = useServerFn(sendNewRepsRolloutTestEmail);
  const [email, setEmail] = useState("cruz.pt@icloud.com");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      await run({ data: { recipientEmail: email } });
      toast.success(`New REPS rollout email queued to ${email}. Should land within a minute.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PCard>
      <h3 className="font-display text-[14px] font-semibold text-white">New REPS rollout — test</h3>
      <p className="mt-2 text-[12px] text-white/55">
        Send the "log in &amp; unlock your trainer website" email to a single address to QA before the bulk run.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-3 w-full rounded-[8px] border border-reps-border bg-reps-ink px-3 py-2 text-[13px] text-white outline-none focus:border-reps-orange/60"
      />
      <Button size="sm" onClick={send} disabled={busy || !email} className="mt-3">
        {busy ? "Sending…" : "Send test"}
      </Button>
    </PCard>
  );
}

function NewRepsRolloutBroadcastCard() {
  const preview = useServerFn(previewNewRepsRolloutAudience);
  const broadcast = useServerFn(sendNewRepsRolloutBroadcast);
  const status = useServerFn(getNewRepsRolloutStatus);
  const [audience, setAudience] = useState<{
    total: number;
    bySource: Record<string, number>;
    sample: string[];
  } | null>(null);
  const [snapshot, setSnapshot] = useState<{
    total: number;
    alreadySent: number;
    remaining: number;
    lastSentAt: string | null;
    broadcastTag: string;
  } | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    queued: number;
    sent?: number;
    alreadySent?: number;
    skipped: number;
    failed: number;
    remaining?: number;
    paused?: boolean;
    retryAt?: string | null;
    pauseReason?: string | null;
    firstErrors: Array<{ email: string; error: string }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    status()
      .then((s) => { if (!cancelled) setSnapshot(s); })
      .catch(() => { /* surfaces via refresh button */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshStatus() {
    setBusy(true);
    try { setSnapshot(await status()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Status check failed"); }
    finally { setBusy(false); }
  }

  async function runPreview() {
    setBusy(true);
    setResult(null);
    try {
      const r = await preview();
      setAudience(r);
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function runBroadcast() {
    if (!audience) return;
    setBusy(true);
    try {
      const r = await broadcast({ data: { confirmToken: confirm } });
      setResult(r);
      if (r.paused) {
        toast.info(`Sent ${r.sent ?? 0} new emails. ${r.remaining ?? 0} still remaining.`);
      } else {
        toast.success(`Sent ${r.queued} of ${r.total}.`);
      }
      try { setSnapshot(await status()); } catch { /* ignore */ }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setBusy(false);
    }
  }

  const expectedToken = audience ? `SEND-${audience.total}` : "";
  const tokenOk = audience !== null && confirm === expectedToken;

  return (
    <PCard>
      <h3 className="font-display text-[14px] font-semibold text-white">New REPS rollout — broadcast</h3>
      <p className="mt-2 text-[12px] text-white/55">
        Sends the "log in &amp; unlock your trainer website" email to every member (same audience as relaunch:
        confirmed accounts + BD-seed members, minus admins, demo and suppressed). Per-recipient idempotency
        prevents duplicates. Uses its own broadcast tag so it can't collide with the relaunch send.
      </p>

      {snapshot ? (
        <div className="mt-3 rounded-[10px] border border-reps-border bg-reps-ink p-3 text-[12px] text-white/85">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span><strong className="text-white">{snapshot.alreadySent.toLocaleString()}</strong> sent</span>
            <span className="text-white/55">·</span>
            <span><strong className={snapshot.remaining > 0 ? "text-amber-200" : "text-emerald-200"}>{snapshot.remaining.toLocaleString()}</strong> remaining</span>
            <span className="text-white/55">·</span>
            <span className="text-white/55">{snapshot.total.toLocaleString()} total audience</span>
          </div>
          {snapshot.lastSentAt ? (
            <div className="mt-1 text-white/55">
              Last send accepted by Mailgun: {new Date(snapshot.lastSentAt).toLocaleString("en-GB")}
            </div>
          ) : null}
          {snapshot.remaining === 0 ? (
            <div className="mt-2 text-emerald-200">All members have been sent the rollout email.</div>
          ) : (
            <div className="mt-2 text-amber-100/90">
              You can resume sending — the next run will send up to 75 new emails and skip anyone already sent.
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={refreshStatus} disabled={busy} className="mt-2 px-0 text-reps-orange hover:text-reps-orange">
            Refresh status
          </Button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={runPreview} disabled={busy}>
          {busy && !audience ? "Resolving…" : audience ? "Re-count audience" : "Dry-run — count audience"}
        </Button>
        {snapshot && snapshot.remaining > 0 && audience ? (
          <span className="text-[11px] text-white/55 self-center">
            Type <code className="text-reps-orange">{expectedToken}</code> below to resume.
          </span>
        ) : null}
      </div>

      {audience ? (
        <div className="mt-4 space-y-3 rounded-[10px] border border-reps-border bg-reps-ink p-3 text-[12px] text-white/80">
          <div>
            <span className="font-semibold text-white">{audience.total.toLocaleString()}</span> recipients
            <span className="text-white/55">
              {" "}· {Object.entries(audience.bySource)
                .map(([k, v]) => `${v} ${k.replace("_", " ")}`)
                .join(" · ")}
            </span>
          </div>
          <div className="text-white/55">
            Sample: {audience.sample.map((e) => maskEmail(e)).join(", ") || "—"}
          </div>

          <div className="border-t border-reps-border pt-3">
            <label className="block text-[11px] uppercase tracking-[0.06em] text-white/55">
              To send, type <code className="text-reps-orange">{expectedToken}</code>
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={expectedToken}
              className="mt-2 w-full rounded-[8px] border border-reps-border bg-reps-panel px-3 py-2 text-[13px] text-white outline-none focus:border-reps-orange/60"
            />
            <Button
              size="sm"
              onClick={runBroadcast}
              disabled={busy || !tokenOk}
              className="mt-3"
            >
              {busy ? "Enqueuing…" : `Send to ${audience.total.toLocaleString()} members`}
            </Button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={`mt-3 rounded-[10px] border p-3 text-[12px] ${result.paused ? "border-amber-400/30 bg-amber-500/10 text-amber-100" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"}`}>
          Sent <strong>{result.queued}</strong> of {result.total}
          {typeof result.sent === "number" ? <> · new this run {result.sent}</> : null}
          {typeof result.alreadySent === "number" ? <> · already sent {result.alreadySent}</> : null}
          {typeof result.remaining === "number" ? <> · remaining {result.remaining}</> : null}
          <> · skipped {result.skipped} · failed {result.failed}.</>
          {result.pauseReason ? <p className="mt-2">{result.pauseReason}</p> : null}
          {result.failed > 0 || result.paused ? (
            <ul className={`mt-2 list-disc pl-4 ${result.paused ? "text-amber-100/80" : "text-emerald-200/80"}`}>
              {result.firstErrors.map((e) => (
                <li key={e.email}>
                  {maskEmail(e.email)} — {e.error}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </PCard>
  );
}



