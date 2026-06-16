import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { requireRole } from "@/lib/route-gates";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  FileCheck,
  Image as ImageIcon,
  Link2,
  PlayCircle,
  RefreshCw,
  Users,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { getBdMigrationStats, type BdMigrationStats } from "@/lib/admin/bd-migration.functions";
import {
  getLegacyLinkingStats,
  linkLegacyFromStripeCsv,
  linkLegacyStripeCustomers,
  resetLegacyLinking,
  runLegacyRenewalBatch,
  type LegacyLinkingStats,
} from "@/lib/admin/stripe-linking.functions";
import {
  getBdSeedStats,
  seedBdDirectory,
  type BdSeedBatchResult,
} from "@/lib/admin/bd-seed.functions";
import Papa from "papaparse";


export const Route = createFileRoute("/admin_/migration")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminMigrationPage,
});

const REJECT_LABELS: Record<string, string> = {
  logo: "Logo / brand mark",
  illustration: "Illustration",
  group: "Group photo",
  full_body: "Full-body shot",
  face_obscured: "Face obscured",
  low_quality: "Low quality",
  not_a_person: "Not a person",
  other: "Other",
};

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function downloadRejectsCsv(rows: BdMigrationStats["recentRejects"]) {
  const header = ["bd_member_id", "email", "first_name", "last_name", "category", "reason"];
  const lines = [header.join(",")].concat(
    rows.map((r) =>
      [
        r.bd_member_id,
        r.email,
        r.first_name ?? "",
        r.last_name ?? "",
        r.profile_photo_reject_category ?? "",
        (r.profile_photo_reject_reason ?? "").replace(/[\r\n,]+/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bd-photo-rejects-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminMigrationPage() {
  const fetchStats = useServerFn(getBdMigrationStats);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "bd-migration", "stats"],
    queryFn: () => fetchStats(),
  });

  const s = data;
  const total = s?.total ?? 0;
  const activated = s ? s.claim.claimed : 0;
  const invited = s ? s.claim.invited + s.claim.claimed : 0;
  const photoReady = s ? s.photo.ok : 0;
  const issues = s ? s.photo.fetch_error : 0;

  const steps = s
    ? [
        {
          label: "Import legacy CSV → bd_member_seed",
          state: total > 0 ? "done" : "pending",
          count: `${total.toLocaleString()} records`,
        },
        {
          label: "Validate profile photos (Gemini)",
          state: s.photo.pending === 0 && total > 0 ? "done" : s.photo.pending > 0 ? "running" : "pending",
          count: `${s.photo.ok + s.photo.rejected + s.photo.missing + s.photo.fetch_error} / ${total} processed`,
        },
        {
          label: "Activate as unverified professionals",
          state: activated > 0 ? (activated >= total ? "done" : "running") : "pending",
          count: `${activated.toLocaleString()} / ${total.toLocaleString()} activated`,
        },
        {
          label: "Send claim emails",
          state: invited > 0 ? "running" : "pending",
          count: `${invited.toLocaleString()} / ${total.toLocaleString()} invited`,
        },
        {
          label: "Members claim & verify",
          state: s.claim.claimed > 0 ? "running" : "pending",
          count: `${s.claim.claimed.toLocaleString()} claimed`,
        },
      ]
    : [];

  return (
    <DashboardShell
      role="admin"
      active="Migration"
      title="Legacy member migration"
      subtitle="Stage, validate and activate legacy members as unverified REPs professionals."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            disabled
            title="Coming next: activates the next batch as unverified pros"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white opacity-60"
          >
            <PlayCircle className="h-4 w-4" /> Activate next batch
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="rounded-[16px] border border-reps-border bg-reps-panel p-6 text-[13px] text-white/55">
          Loading migration stats…
        </div>
      ) : !s ? (
        <div className="rounded-[16px] border border-reps-border bg-reps-panel p-6 text-[13px] text-red-300">
          Failed to load stats.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <PCard>
              <div className="flex items-center gap-2 text-[12px] text-white/55">
                <Database className="h-3.5 w-3.5" /> Staged in seed
              </div>
              <div className="mt-1 font-display text-[26px] font-bold text-white">
                {total.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-white/55">
                Active legacy members from CSV
              </div>
            </PCard>
            <PCard>
              <div className="flex items-center gap-2 text-[12px] text-white/55">
                <ImageIcon className="h-3.5 w-3.5" /> Photos approved
              </div>
              <div className="mt-1 font-display text-[26px] font-bold text-white">
                {photoReady.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-reps-green">
                {pct(photoReady, total)}% pass rate
              </div>
            </PCard>
            <PCard>
              <div className="flex items-center gap-2 text-[12px] text-white/55">
                <Users className="h-3.5 w-3.5" /> Activated on REPs
              </div>
              <div className="mt-1 font-display text-[26px] font-bold text-white">
                {activated.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-white/55">Unverified professionals live</div>
            </PCard>
            <PCard>
              <div className="flex items-center gap-2 text-[12px] text-white/55">
                <AlertCircle className="h-3.5 w-3.5" /> Fetch errors
              </div>
              <div className="mt-1 font-display text-[26px] font-bold text-white">
                {issues.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-reps-orange">Needs admin review</div>
            </PCard>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <PPanel className="lg:col-span-2">
              <div className="border-b border-reps-border px-5 py-4">
                <h2 className="font-display text-[16px] font-bold text-white">Migration pipeline</h2>
                <p className="text-[12px] text-white/55">
                  Stage → validate photos → activate as unverified → invite to claim → verify
                </p>
              </div>
              <ol className="space-y-3 p-5">
                {steps.map((st, i) => (
                  <li
                    key={st.label}
                    className="flex items-center gap-4 rounded-[12px] border border-reps-border bg-reps-ink p-4"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                        st.state === "done"
                          ? "bg-reps-green/20 text-reps-green"
                          : st.state === "running"
                            ? "bg-reps-orange text-white"
                            : "bg-white/10 text-white/55"
                      }`}
                    >
                      {st.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-white">{st.label}</div>
                      <div className="text-[11px] text-white/55">{st.count}</div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        st.state === "done"
                          ? "bg-reps-green/15 text-reps-green"
                          : st.state === "running"
                            ? "bg-reps-orange-soft text-reps-orange"
                            : "bg-white/10 text-white/55"
                      }`}
                    >
                      {st.state}
                    </span>
                  </li>
                ))}
              </ol>
            </PPanel>

            <PPanel>
              <div className="border-b border-reps-border px-5 py-4">
                <h2 className="font-display text-[16px] font-bold text-white">Photo status</h2>
                <p className="text-[12px] text-white/55">From Gemini gatekeeper</p>
              </div>
              <ul className="divide-y divide-reps-border">
                {[
                  { label: "Approved", count: s.photo.ok, tone: "green" },
                  { label: "Rejected", count: s.photo.rejected, tone: "red" },
                  { label: "Missing on legacy", count: s.photo.missing, tone: "muted" },
                  { label: "Pending", count: s.photo.pending, tone: "orange" },
                  { label: "Fetch errors", count: s.photo.fetch_error, tone: "red" },
                ].map((p) => (
                  <li key={p.label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-[13px] text-white/80">{p.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.tone === "green"
                          ? "bg-reps-green/15 text-reps-green"
                          : p.tone === "red"
                            ? "bg-red-500/15 text-red-400"
                            : p.tone === "orange"
                              ? "bg-reps-orange-soft text-reps-orange"
                              : "bg-white/10 text-white/70"
                      }`}
                    >
                      {p.count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </PPanel>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PPanel>
              <div className="border-b border-reps-border px-5 py-4">
                <h2 className="font-display text-[16px] font-bold text-white">Reject reasons</h2>
                <p className="text-[12px] text-white/55">
                  Why photos didn't pass — these members activate with initials fallback
                </p>
              </div>
              <ul className="divide-y divide-reps-border">
                {s.rejectReasons.length === 0 ? (
                  <li className="px-5 py-6 text-center text-[12px] text-white/55">
                    No rejected photos.
                  </li>
                ) : (
                  s.rejectReasons.map((r) => (
                    <li
                      key={r.category}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <span className="text-[13px] text-white/80">
                        {REJECT_LABELS[r.category] ?? r.category}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-reps-ink">
                          <div
                            className="h-full bg-red-400/70"
                            style={{ width: `${pct(r.count, s.photo.rejected)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[11px] font-semibold text-white/70">
                          {r.count}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </PPanel>

            <PPanel>
              <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
                <div>
                  <h2 className="font-display text-[16px] font-bold text-white">
                    Recent rejects to review
                  </h2>
                  <p className="text-[12px] text-white/55">
                    Latest 20 — export full list as CSV
                  </p>
                </div>
                <button
                  onClick={() => downloadRejectsCsv(s.recentRejects)}
                  disabled={s.recentRejects.length === 0}
                  className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border px-3 text-[12px] font-medium text-white/75 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
              </div>
              <ul className="divide-y divide-reps-border">
                {s.recentRejects.length === 0 ? (
                  <li className="px-5 py-6 text-center text-[12px] text-white/55">
                    Nothing to review.
                  </li>
                ) : (
                  s.recentRejects.slice(0, 8).map((r) => (
                    <li key={r.bd_member_id} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-white">
                            {(r.first_name ?? "") + " " + (r.last_name ?? "")}
                          </div>
                          <div className="truncate text-[11px] text-white/55">{r.email}</div>
                        </div>
                        <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                          {REJECT_LABELS[r.profile_photo_reject_category ?? ""] ??
                            r.profile_photo_reject_category ??
                            "other"}
                        </span>
                      </div>
                      {r.profile_photo_reject_reason ? (
                        <p className="mt-1 line-clamp-1 text-[11px] text-white/55">
                          {r.profile_photo_reject_reason}
                        </p>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </PPanel>
          </div>

          <PPanel className="mt-6">
            <div className="border-b border-reps-border px-5 py-4">
              <h2 className="font-display text-[16px] font-bold text-white">Geography & plan mix</h2>
              <p className="text-[12px] text-white/55">
                Where staged members are based and what they paid on the legacy platform
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                  Top countries
                </div>
                <ul className="space-y-2">
                  {s.countries.map((c) => (
                    <li key={c.country} className="flex items-center justify-between">
                      <span className="text-[13px] text-white/80">
                        {c.country || "Unknown"}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-reps-ink">
                          <div
                            className="h-full bg-reps-orange"
                            style={{ width: `${pct(c.count, total)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[11px] text-white/55">
                          {c.count}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                  Legacy plan
                </div>
                <ul className="space-y-2">
                  {s.plans.map((p) => (
                    <li key={p.plan} className="flex items-center justify-between">
                      <span className="text-[13px] capitalize text-white/80">
                        {p.plan || "Unknown"}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-reps-ink">
                          <div
                            className="h-full bg-reps-orange"
                            style={{ width: `${pct(p.count, total)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[11px] text-white/55">
                          {p.count}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink p-3 text-[11px] text-white/55">
                  <FileCheck className="h-3.5 w-3.5 text-white/70" />
                  Legacy plan info is historical — every claim starts as unverified and unlocks
                  Verified by completing ID + insurance + £99/yr.
                </div>
              </div>
            </div>
          </PPanel>
          <StripeLinkingPanel />
        </>
      )}
    </DashboardShell>
  );
}

function StripeLinkingPanel() {
  const qc = useQueryClient();
  const fetchStats = useServerFn(getLegacyLinkingStats);
  const linkFn = useServerFn(linkLegacyStripeCustomers);
  const renewFn = useServerFn(runLegacyRenewalBatch);
  const resetFn = useServerFn(resetLegacyLinking);
  const csvFn = useServerFn(linkLegacyFromStripeCsv);
  const [env, setEnv] = useState<"sandbox" | "live">("live");
  const [log, setLog] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<LegacyLinkingStats>({
    queryKey: ["admin", "legacy-stripe-link", "stats"],
    queryFn: () => fetchStats(),
  });

  const linkPass = useMutation({
    mutationFn: () => linkFn({ data: { environment: env } }),
    onSuccess: (res) => {
      setLog(
        `Link pass (${env}): processed ${res.processed}, recurring ${res.linked_recurring}, one-time ${res.linked_onetime}, no customer ${res.no_customer}, errors ${res.errors}`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "legacy-stripe-link"] });
    },
    onError: (e) => setLog(`Link pass failed: ${(e as Error).message}`),
  });

  const renewPass = useMutation({
    mutationFn: () => renewFn({ data: { environment: env, limit: 50 } }),
    onSuccess: (res) => {
      setLog(
        `Renewal pass (${env}): processed ${res.processed}, charged ${res.charged}, awaiting payment method ${res.awaiting_payment_method}, errors ${res.errors}`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "legacy-stripe-link"] });
    },
    onError: (e) => setLog(`Renewal pass failed: ${(e as Error).message}`),
  });

  const resetPass = useMutation({
    mutationFn: () => resetFn(),
    onSuccess: (res) => {
      setLog(`Reset: deleted ${res.deleted} link rows. Safe to re-run link pass.`);
      qc.invalidateQueries({ queryKey: ["admin", "legacy-stripe-link"] });
    },
    onError: (e) => setLog(`Reset failed: ${(e as Error).message}`),
  });

  const csvImport = useMutation({
    mutationFn: (rows: { email: string; customer_id: string }[]) =>
      csvFn({ data: { environment: env, rows } }),
    onSuccess: (res) => {
      setLog(
        `CSV import (${env}): csv rows ${res.csv_rows}, matched seed ${res.matched_seed}, recurring ${res.linked_recurring}, one-time ${res.linked_onetime}, no-seed-match ${res.no_seed_match}, already-linked ${res.already_linked}, errors ${res.errors}`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "legacy-stripe-link"] });
    },
    onError: (e) => setLog(`CSV import failed: ${(e as Error).message}`),
  });

  function handleCsvFile(file: File) {
    setLog(`Parsing ${file.name}…`);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows: { email: string; customer_id: string }[] = [];
        for (const r of result.data) {
          const customer_id = (r["id"] || r["Customer ID"] || r["customer_id"] || "").trim();
          const email = (r["Email"] || r["email"] || r["email (metadata)"] || "").trim();
          if (customer_id.startsWith("cus_") && email.includes("@")) {
            rows.push({ email, customer_id });
          }
        }
        if (!rows.length) {
          setLog("CSV parsed but no valid rows (expected columns: id, Email).");
          return;
        }
        csvImport.mutate(rows);
      },
      error: (err) => setLog(`CSV parse failed: ${err.message}`),
    });
  }

  const busy =
    linkPass.isPending ||
    renewPass.isPending ||
    resetPass.isPending ||
    csvImport.isPending ||
    isFetching;


  return (
    <PPanel className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border px-5 py-4">
        <div>
          <h2 className="font-display text-[16px] font-bold text-white">
            Legacy → Stripe linking
          </h2>
          <p className="text-[12px] text-white/55">
            Match seed rows to existing Stripe customers, then renew them to Verified £99/yr as
            their current access expires. No emails sent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value as "sandbox" | "live")}
            disabled={busy}
            className="h-9 rounded-[8px] border border-reps-border bg-reps-ink px-2 text-[12px] text-white/85"
          >
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/85 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete ALL ${data?.linked ?? 0} link rows? This is destructive and only needed when switching env (e.g. sandbox → live).`))
                resetPass.mutate();
            }}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-[10px] border border-red-400/40 bg-red-500/10 px-3 text-[12px] font-semibold text-red-200 disabled:opacity-50"
          >
            {resetPass.isPending ? "Resetting…" : "Reset linking"}
          </button>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/85 disabled:opacity-50">
            <Download className="h-3.5 w-3.5" />
            {csvImport.isPending ? "Importing…" : "Import Stripe CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCsvFile(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => linkPass.mutate()}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            <Link2 className="h-3.5 w-3.5" />
            {linkPass.isPending ? "Linking…" : "Run link pass"}
          </button>
          <button
            onClick={() => renewPass.mutate()}
            disabled={busy || !data || data.due_now === 0}
            className="flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            <CreditCard className="h-3.5 w-3.5" />
            {renewPass.isPending ? "Renewing…" : `Renew due (${data?.due_now ?? 0})`}
          </button>

        </div>
      </div>
      {isLoading || !data ? (
        <div className="p-5 text-[12px] text-white/55">Loading linking stats…</div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-reps-border sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "Seed total", value: data.total_seed },
            { label: "Linked to Stripe", value: data.linked },
            { label: "Pending renewal", value: data.pending },
            { label: "Due now", value: data.due_now, tone: data.due_now > 0 ? "orange" : undefined },
            { label: "Renewed → Verified", value: data.renewed, tone: "green" },
            { label: "Awaiting card", value: data.awaiting_payment_method, tone: "orange" },
            { label: "Errors", value: data.error, tone: data.error > 0 ? "red" : undefined },
          ].map((cell) => (
            <div key={cell.label} className="bg-reps-panel p-4">
              <div className="text-[11px] uppercase tracking-[0.06em] text-white/55">
                {cell.label}
              </div>
              <div
                className={`mt-1 font-display text-[20px] font-bold ${
                  cell.tone === "green"
                    ? "text-reps-green"
                    : cell.tone === "orange"
                      ? "text-reps-orange"
                      : cell.tone === "red"
                        ? "text-red-400"
                        : "text-white"
                }`}
              >
                {cell.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-reps-border p-5 text-[11px] text-white/55">
        {data?.next_due_at ? (
          <>Next renewal due: {new Date(data.next_due_at).toLocaleString()}. </>
        ) : null}
        Daily cron auto-runs the renewal pass at 03:00 UTC. {log ? <span className="ml-2 text-white/80">{log}</span> : null}
      </div>
    </PPanel>
  );
}
