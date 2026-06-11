import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Loader2, Mail, Plus, RefreshCw, Search, ShieldCheck, Upload, X, Zap } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import {
  addRosterClient,
  confirmRosterClient,
  importRosterCSV,
  listRoster,
  resendInvite,
} from "@/lib/roster.functions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/_professional/_pro/dashboard_/clients")({
  head: () => ({
    meta: [
      { title: "Clients — REPS Professional Dashboard" },
      { name: "description", content: "Manage your client roster, send portal invites, and track activation." },
      { property: "og:title", content: "Clients — REPS" },
      { property: "og:description", content: "Add clients, send portal invites, track activation status." },
    ],
  }),
  component: ClientsIndex,
});

type RosterStatus = "prospect" | "confirmed" | "active" | "archived";
type InviteStatus = "none" | "pending" | "accepted" | "expired" | "revoked";

const STATUS_STYLE: Record<RosterStatus, string> = {
  prospect: "bg-white/10 text-white/70",
  confirmed: "bg-reps-orange-soft text-reps-orange",
  active: "bg-reps-green/15 text-reps-green",
  archived: "bg-white/5 text-white/40",
};

const INVITE_STYLE: Record<InviteStatus, string> = {
  none: "bg-white/5 text-white/45",
  pending: "bg-amber-500/15 text-amber-300",
  accepted: "bg-reps-green/15 text-reps-green",
  expired: "bg-rose-500/15 text-rose-300",
  revoked: "bg-white/5 text-white/40",
};

function ClientsIndex() {
  const list = useServerFn(listRoster);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["roster"],
    queryFn: () => list({}),
  });

  const [quickOpen, setQuickOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | RosterStatus>("all");

  const rows = data?.rows ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.email.toLowerCase().includes(q) ||
        (r.full_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  const total = rows.length;
  const prospects = rows.filter((r) => r.status === "prospect").length;
  const active = rows.filter((r) => r.status === "active").length;
  const pendingInvites = rows.filter((r) => r.inviteStatus === "pending").length;

  return (
    <DashboardShell role="trainer" tier="pro"
      active="Clients"
      title="Clients"
      subtitle={`${total} on roster · ${active} active · ${pendingInvites} pending invite`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-3 text-[13px] font-medium text-white/85 hover:text-white"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button
            onClick={() => setQuickOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
          >
            <Plus className="h-4 w-4" /> Add client
          </button>
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="On roster" value={total.toString()} delta="All time" />
        <Kpi label="Active" value={active.toString()} delta="Portal activated" />
        <Kpi label="Prospects" value={prospects.toString()} delta="Not yet confirmed" />
        <Kpi label="Pending invites" value={pendingInvites.toString()} delta="Awaiting setup" tone={pendingInvites > 0 ? "warn" : "ok"} />
      </div>

      <PCard className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-reps-border p-4">
          <div className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white/55">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 bg-transparent text-white placeholder:text-white/35 focus:outline-none"
            />
          </div>
          <div className="flex gap-1 rounded-[10px] border border-reps-border bg-reps-ink p-1 text-[12px] font-medium">
            {(["all", "prospect", "confirmed", "active", "archived"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-[8px] px-3 py-1.5 capitalize ${
                  filter === t ? "bg-reps-orange-soft text-reps-orange" : "text-white/65 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setQuickOpen(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Portal invite</th>
                  <th className="px-3 py-3 font-semibold">Added</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <RosterRow key={r.id} row={r} onChange={() => qc.invalidateQueries({ queryKey: ["roster"] })} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PCard>

      {quickOpen && (
        <QuickAddDialog
          onClose={() => setQuickOpen(false)}
          onAdded={() => qc.invalidateQueries({ queryKey: ["roster"] })}
        />
      )}
      {importOpen && (
        <ImportCsvDialog
          onClose={() => setImportOpen(false)}
          onImported={() => qc.invalidateQueries({ queryKey: ["roster"] })}
        />
      )}
    </DashboardShell>
  );
}

type Row = NonNullable<Awaited<ReturnType<typeof listRoster>>>["rows"][number];

function RosterRow({ row, onChange }: { row: Row; onChange: () => void }) {
  const confirm = useServerFn(confirmRosterClient);
  const resend = useServerFn(resendInvite);
  const [busy, setBusy] = useState<"confirm" | "resend" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const initials =
    (row.full_name ?? row.email)
      .split(/[\s@]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  async function handleConfirm() {
    setBusy("confirm");
    setErr(null);
    try {
      await confirm({ data: { rosterId: row.id } });
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }
  async function handleResend() {
    setBusy("resend");
    setErr(null);
    try {
      await resend({ data: { rosterId: row.id } });
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const canConfirm = row.status === "prospect";
  const canResend =
    row.inviteStatus === "pending" || row.inviteStatus === "expired" || row.inviteStatus === "revoked";

  return (
    <tr className="border-t border-reps-border/60 text-white/85">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-semibold text-reps-orange">
            {initials || "?"}
          </span>
          <div>
            <div className="font-semibold text-white">{row.full_name ?? row.email}</div>
            <div className="text-[12px] text-white/45">{row.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[row.status]}`}>
          {row.status}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold capitalize ${INVITE_STYLE[row.inviteStatus]}`}>
          {row.inviteStatus}
        </span>
        {err && <div className="mt-1 text-[11px] text-rose-400">{err}</div>}
      </td>
      <td className="px-3 py-3 text-[12px] text-white/55">
        {new Date(row.createdAt).toLocaleDateString()}
      </td>
      <td className="px-5 py-3 text-right">
        <div className="inline-flex items-center gap-1.5">
          {canConfirm && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleConfirm}
                  disabled={busy !== null}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-reps-orange px-2.5 text-[12px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
                >
                  {busy === "confirm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  Confirm
                </button>
              </TooltipTrigger>
              <TooltipContent>Confirm as client — sends portal invite</TooltipContent>
            </Tooltip>
          )}
          {canResend && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleResend}
                  disabled={busy !== null}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-ink px-2.5 text-[12px] font-medium text-white/80 hover:text-white disabled:opacity-60"
                >
                  {busy === "resend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Resend
                </button>
              </TooltipTrigger>
              <TooltipContent>Resend invite email</TooltipContent>
            </Tooltip>
          )}
          {row.status === "active" && (
            <Link
              to="/dashboard/clients/$slug"
              params={{ slug: row.id }}
              className="text-[12px] font-semibold text-reps-orange hover:underline"
            >
              View
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-reps-orange-soft text-reps-orange">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="text-[14px] font-semibold text-white">No one on your roster yet</div>
      <p className="max-w-sm text-[13px] text-white/55">
        Add prospects as you talk to them. They stay private until you confirm them, assign a programme, or take payment — then we'll automatically email them a portal invite to set their password.
      </p>
      <button
        onClick={onAdd}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
      >
        <Plus className="h-4 w-4" /> Add your first client
      </button>
    </div>
  );
}

function QuickAddDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const add = useServerFn(addRosterClient);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await add({ data: { email, full_name: fullName || undefined, notes: notes || undefined } });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Add a client" subtitle="They stay as a prospect — no email is sent until you confirm them.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Client email">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@example.com"
            className="h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
          />
        </Field>
        <Field label="Full name (optional)">
          <input
            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Johnson"
            className="h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
          />
        </Field>
        <Field label="Notes (private)">
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder="Where did they come from? Goals?"
            className="w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2 text-[14px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
          />
        </Field>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          type="submit" disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[13.5px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add to roster
        </button>
      </form>
    </Modal>
  );
}

type ImportPreview = Awaited<ReturnType<typeof importRosterCSV>> & {
  summary: { total: number; willAdd: number; willRestore: number; alreadyActive: number; alreadyArchived: number; invalid: number; duplicatesInCSV: number; conflicting: number };
};

function ImportCsvDialog({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const importFn = useServerFn(importRosterCSV);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [restoreArchived, setRestoreArchived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseRows() {
    const parsed = Papa.parse<{ email?: string; full_name?: string; name?: string }>(text.trim(), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    const rows = (parsed.data ?? [])
      .map((r) => ({ email: (r.email ?? "").trim(), full_name: (r.full_name ?? r.name ?? "").trim() }))
      .filter((r) => r.email);
    return rows;
  }

  async function handlePreview() {
    setBusy(true);
    setError(null);
    try {
      const rows = parseRows();
      if (!rows.length) throw new Error("No rows found. Include an 'email' column header.");
      if (rows.length > 500) throw new Error("Max 500 rows per import.");
      const res = await importFn({ data: { rows, preview: true, restoreArchived } });
      setPreview(res as ImportPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse CSV");
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    setBusy(true);
    setError(null);
    try {
      const rows = parseRows();
      await importFn({ data: { rows, preview: false, restoreArchived } });
      onImported();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Import clients from CSV" subtitle="Paste CSV with 'email' and optional 'full_name' columns. Max 500 rows." wide>
      {!preview ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={"email,full_name\nsarah@example.com,Sarah Johnson\namelia@example.com,Amelia Carter"}
            className="w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2 font-mono text-[12.5px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="inline-flex h-10 items-center rounded-[10px] border border-reps-border bg-reps-ink px-3 text-[13px] font-medium text-white/80 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handlePreview} disabled={busy || !text.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Will add" value={preview.summary.willAdd} tone="ok" />
            <Stat label="Will restore" value={preview.summary.willRestore} />
            <Stat label="Already active" value={preview.summary.alreadyActive} />
            <Stat label="Already archived" value={preview.summary.alreadyArchived} />
            <Stat label="Invalid email" value={preview.summary.invalid} tone={preview.summary.invalid > 0 ? "warn" : "ok"} />
            <Stat label="Conflicting name" value={preview.summary.conflicting} tone={preview.summary.conflicting > 0 ? "warn" : "ok"} />
          </div>
          {preview.summary.alreadyArchived > 0 && (
            <label className="flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-3 py-2 text-[13px] text-white/80">
              <input type="checkbox" checked={restoreArchived} onChange={(e) => setRestoreArchived(e.target.checked)} />
              Restore {preview.summary.alreadyArchived} archived clients back to prospect
            </label>
          )}
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex items-center justify-between">
            <button onClick={() => setPreview(null)} className="text-[12px] font-medium text-white/55 hover:text-white">
              ← Edit CSV
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="inline-flex h-10 items-center rounded-[10px] border border-reps-border bg-reps-ink px-3 text-[13px] font-medium text-white/80 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleCommit} disabled={busy || (preview.summary.willAdd === 0 && preview.summary.willRestore === 0)}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Import {preview.summary.willAdd + (restoreArchived ? preview.summary.willRestore : 0)} clients
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, tone = "ok" }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-[10px] border border-reps-border bg-reps-ink px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/45">{label}</div>
      <div className={`mt-1 text-[20px] font-bold ${tone === "warn" && value > 0 ? "text-amber-300" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/60">{label}</label>
      {children}
    </div>
  );
}

function Modal({ onClose, title, subtitle, children, wide }: { onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-[22px] border border-reps-border bg-reps-panel p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]`}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-[15px] font-semibold text-white">{title}</div>
            {subtitle && <div className="text-[12.5px] text-white/55">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-white/55 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, tone = "ok" }: { label: string; value: string; delta: string; tone?: "ok" | "warn" }) {
  return (
    <PCard>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">{label}</div>
      <div className="mt-2 font-display text-[28px] font-bold leading-none text-white">{value}</div>
      <div className={`mt-2 text-[12px] ${tone === "warn" ? "text-rose-400" : "text-reps-green"}`}>{delta}</div>
    </PCard>
  );
}
