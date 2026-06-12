import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Mail,
  Search,
  Shield,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import {
  DashboardEmpty as Empty,
  DashboardEmptyTitle as EmptyTitle,
  DashboardEmptyDescription as EmptyDescription,
  DashboardEmptyIcon as EmptyHeader,
} from "@/components/dashboard/ui/empty";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
  claimVerification,
  getQueueStats,
  getReviewWorkspace,
  listPendingVerifications,
  releaseVerification,
  reviewVerification,
  sendVerificationReminder,
} from "@/lib/verification/verification.functions";
import { getDocSignedUrl } from "@/lib/verification/insurance.functions";
import { runCrossChecks, type CheckStatus } from "@/lib/verification/cross-checks";
import { getTitleLabel } from "@/lib/cpd/titles-catalog";

export const Route = createFileRoute("/admin_/verification")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminVerificationPage,
});

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function slaRemaining(iso: string): { label: string; tone: "ok" | "warn" | "breach" } {
  const ageMs = Date.now() - new Date(iso).getTime();
  const remainingMs = 24 * 3600 * 1000 - ageMs;
  if (remainingMs < 0) return { label: `Breach ${relativeTime(new Date(Date.now() + remainingMs).toISOString())}`, tone: "breach" };
  const mins = Math.floor(remainingMs / 60000);
  if (mins < 120) return { label: `${mins}m left`, tone: "warn" };
  const hrs = Math.floor(mins / 60);
  return { label: `${hrs}h left`, tone: "ok" };
}

const STATUS_DOT: Record<CheckStatus, string> = {
  pass: "bg-emerald-400",
  warn: "bg-amber-400",
  fail: "bg-red-500",
  pending: "bg-white/30",
  skip: "bg-white/15",
};

function AdminVerificationPage() {
  const qc = useQueryClient();
  const fetchPending = useServerFn(listPendingVerifications);
  const fetchStats = useServerFn(getQueueStats);
  const fetchCase = useServerFn(getReviewWorkspace);
  const claim = useServerFn(claimVerification);
  const release = useServerFn(releaseVerification);
  const decide = useServerFn(reviewVerification);
  const remind = useServerFn(sendVerificationReminder);
  const signUrl = useServerFn(getDocSignedUrl);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mine" | "sla">("all");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const pending = useQuery({
    queryKey: ["admin-pending-verifications"],
    queryFn: () => fetchPending(),
    refetchInterval: 30_000,
  });
  const stats = useQuery({
    queryKey: ["admin-queue-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 60_000,
  });
  const workspace = useQuery({
    queryKey: ["admin-workspace", selectedId],
    queryFn: () => (selectedId ? fetchCase({ data: { id: selectedId } }) : null),
    enabled: !!selectedId,
  });

  const rows = useMemo(() => {
    let list = pending.data ?? [];
    if (filter === "mine") {
      // best-effort client filter using claimed_by — server returns it via raw select; safe fallback to []
      list = list.filter((r) => (r as { claimed_by?: string | null }).claimed_by != null);
    } else if (filter === "sla") {
      list = list.filter((r) => Date.now() - new Date(r.created_at).getTime() > 22 * 3600 * 1000);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.professional?.full_name ?? "").toLowerCase().includes(q) ||
          (r.qualification ?? "").toLowerCase().includes(q) ||
          (r.awarding_body ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [pending.data, filter, search]);

  const selectCase = async (id: string) => {
    setSelectedId(id);
    setNote("");
    setChecks({});
    try {
      await claim({ data: { id } });
    } catch {
      /* claim already held — read-only view, still allow review */
    }
  };

  const openDoc = async (bucket: "identity-docs" | "insurance-docs" | "verification-docs", path: string) => {
    try {
      const { url } = await signUrl({ data: { bucket, path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open document");
    }
  };

  const decideMutation = useMutation({
    mutationFn: async (decision: "approved" | "rejected" | "changes_requested") => {
      if (!selectedId) return;
      if (decision !== "approved" && !note.trim()) throw new Error("Note required for rejection / changes");
      setBusy(true);
      await decide({
        data: { id: selectedId, decision, admin_note: note.trim() || null, checklist: checks },
      });
    },
    onSettled: () => {
      setBusy(false);
      setSelectedId(null);
      setNote("");
      setChecks({});
      qc.invalidateQueries({ queryKey: ["admin-pending-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-queue-stats"] });
    },
    onError: (e) => alert(e instanceof Error ? e.message : "Decision failed"),
  });

  const closeCase = async () => {
    if (selectedId) {
      try { await release({ data: { id: selectedId } }); } catch { /* ignore */ }
    }
    setSelectedId(null);
  };

  const s = stats.data;
  const topStrip = [
    { label: "In queue", value: s?.pending ?? "—", icon: Clock },
    { label: "Approved (24h)", value: s?.approved24h ?? "—", icon: CheckCircle2 },
    { label: "Rejected (7d)", value: s?.rejected7d ?? "—", icon: XCircle },
    { label: "You today", value: s?.mineToday ?? "—", icon: User },
    { label: "Avg review", value: s?.avgMinutes != null ? `${s.avgMinutes}m` : "—", icon: ShieldCheck },
  ];

  return (
    <DashboardShell
      role="admin"
      active="Verification"
      title="Verification queue"
      subtitle="Review identity, insurance and credentials before activating professionals."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {topStrip.map((t) => (
          <PCard key={t.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-white/55">{t.label}</div>
                <div className="mt-1 font-display text-[22px] font-bold text-white">{t.value}</div>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/5 text-white/70">
                <t.icon className="h-4 w-4" />
              </span>
            </div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* QUEUE */}
        <PPanel className="flex flex-col">
          <div className="border-b border-reps-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search name, cert…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="mt-2 flex gap-1">
              {(["all", "mine", "sla"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 rounded-[8px] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    filter === f ? "bg-reps-orange text-white" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {f === "sla" ? "SLA risk" : f}
                </button>
              ))}
            </div>
          </div>
          <ul className="flex-1 divide-y divide-reps-border overflow-y-auto">
            {pending.isLoading && (
              <li className="p-6 text-center text-[12px] text-white/55">Loading queue…</li>
            )}
            {!pending.isLoading && rows.length === 0 && (
              <li className="p-6 text-center text-[12px] text-white/55">Queue clear.</li>
            )}
            {rows.map((r) => {
              const sel = r.id === selectedId;
              const sla = slaRemaining(r.created_at);
              const name = r.professional?.full_name || r.professional?.trading_name || "Unnamed";
              const claimed = (r as { claimed_by?: string | null }).claimed_by;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => selectCase(r.id)}
                    className={`block w-full px-3 py-3 text-left transition ${sel ? "bg-reps-orange-soft" : "hover:bg-white/[0.03]"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-white">{name}</span>
                      {claimed ? <Lock className="h-3 w-3 text-amber-400" /> : null}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-white/55">
                      {r.qualification}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-white/45">{relativeTime(r.created_at)} ago</span>
                      <span
                        className={`rounded-[6px] px-1.5 py-0.5 font-semibold ${
                          sla.tone === "breach"
                            ? "bg-red-500/15 text-red-300"
                            : sla.tone === "warn"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {sla.label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </PPanel>

        {/* WORKSPACE */}
        <div className="space-y-4">
          {!selectedId && (
            <PPanel className="p-10">
              <Empty>
                <EmptyHeader>
                  <Shield className="mx-auto h-10 w-10 text-white/30" />
                  <EmptyTitle>Select a case to review</EmptyTitle>
                  <EmptyDescription>
                    Pick a submission from the queue. Claiming a case locks it for 15 minutes so two reviewers don't collide.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </PPanel>
          )}

          {selectedId && workspace.isLoading && (
            <PPanel className="p-10 text-center text-[13px] text-white/55">Loading case…</PPanel>
          )}

          {selectedId && workspace.data && (() => {
            const w = workspace.data;
            const sub = w.submission as Record<string, unknown> & { id: string; qualification?: string; awarding_body?: string; doc_paths?: string[]; created_at: string; derived_title_slug?: string | null; regulator_verified?: boolean | null; holder_name?: string | null };
            const id = w.identity as Record<string, unknown> & { name_on_doc?: string; dob_on_doc?: string; doc_type?: string; doc_path_front?: string; doc_path_back?: string; selfie_path?: string; doc_expiry?: string; status?: string } | null;
            const ins = w.insurance as Record<string, unknown> & { provider?: string; policy_number?: string; cover_amount_gbp?: number; expiry_date?: string; doc_path?: string; status?: string } | null;
            const prof = w.profile as { full_name?: string | null } | null;
            const pro = w.professional as { id: string; city?: string | null } | null;

            const crossChecks = runCrossChecks({
              profileName: prof?.full_name ?? null,
              certHolderName: sub.holder_name ?? null,
              idDocName: id?.name_on_doc ?? null,
              dobOnDoc: id?.dob_on_doc ?? null,
              regulatorVerified: sub.regulator_verified ?? null,
              insuranceExpiry: ins?.expiry_date ?? null,
              insuranceCover: ins?.cover_amount_gbp ?? null,
            });

            const sla = slaRemaining(sub.created_at);
            const titleLabel = getTitleLabel(sub.derived_title_slug ?? null);
            const missing: ("identity" | "selfie" | "insurance" | "cert")[] = [];
            if (!id) missing.push("identity");
            else if (!id.selfie_path) missing.push("selfie");
            if (!ins) missing.push("insurance");

            const canApprovePro = !!id && !!ins;

            return (
              <>
                {/* Header */}
                <PCard>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-[18px] font-bold text-white">
                          {prof?.full_name || "Unnamed"}
                        </h3>
                        {pro?.city && <span className="text-[12px] text-white/55">· {pro.city}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/55">
                        <span>Submitted {relativeTime(sub.created_at)} ago</span>
                        <span>·</span>
                        <span className={
                          sla.tone === "breach" ? "text-red-300" : sla.tone === "warn" ? "text-amber-300" : "text-emerald-300"
                        }>SLA {sla.label}</span>
                      </div>
                    </div>
                    <Button variant="subtle" size="sm" onClick={closeCase}>Close</Button>
                  </div>
                </PCard>

                {/* Artefacts grid */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Identity */}
                  <PCard>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-display text-[14px] font-bold text-white">Identity</h4>
                      {id ? (
                        <Badge variant="neutral" className={id.status === "approved" ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" : "border-amber-400/30 bg-amber-500/15 text-amber-300"}>{id.status}</Badge>
                      ) : (
                        <Badge variant="neutral" className="border-white/15 bg-white/5 text-white/55">Missing</Badge>
                      )}
                    </div>
                    {!id ? (
                      <p className="text-[12px] text-white/55">No ID submitted. Send a reminder to request one.</p>
                    ) : (
                      <div className="space-y-1.5 text-[12px] text-white/75">
                        <div><span className="text-white/45">Type</span> · {id.doc_type}</div>
                        <div><span className="text-white/45">Name</span> · {id.name_on_doc || "—"}</div>
                        <div><span className="text-white/45">DOB</span> · {id.dob_on_doc || "—"}</div>
                        <div><span className="text-white/45">Expiry</span> · {id.doc_expiry || "—"}</div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {id.doc_path_front && <DocChip onClick={() => openDoc("identity-docs", id.doc_path_front!)}>Front</DocChip>}
                          {id.doc_path_back && <DocChip onClick={() => openDoc("identity-docs", id.doc_path_back!)}>Back</DocChip>}
                          {id.selfie_path && <DocChip onClick={() => openDoc("identity-docs", id.selfie_path!)}>Selfie</DocChip>}
                        </div>
                      </div>
                    )}
                  </PCard>

                  {/* Insurance */}
                  <PCard>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-display text-[14px] font-bold text-white">Insurance</h4>
                      {ins ? (
                        <Badge variant="neutral" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">{ins.status}</Badge>
                      ) : (
                        <Badge variant="neutral" className="border-white/15 bg-white/5 text-white/55">Missing</Badge>
                      )}
                    </div>
                    {!ins ? (
                      <p className="text-[12px] text-white/55">No insurance on file. Required for Pro tier.</p>
                    ) : (
                      <div className="space-y-1.5 text-[12px] text-white/75">
                        <div><span className="text-white/45">Provider</span> · {ins.provider}</div>
                        <div><span className="text-white/45">Cover</span> · £{(ins.cover_amount_gbp ?? 0).toLocaleString()}</div>
                        <div><span className="text-white/45">Policy</span> · {ins.policy_number || "—"}</div>
                        <div><span className="text-white/45">Expires</span> · {ins.expiry_date}</div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ins.doc_path && <DocChip onClick={() => openDoc("insurance-docs", ins.doc_path!)}>Certificate</DocChip>}
                        </div>
                      </div>
                    )}
                  </PCard>

                  {/* Qualification */}
                  <PCard>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-display text-[14px] font-bold text-white">Qualification</h4>
                      {sub.regulator_verified ? (
                        <Badge variant="neutral" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">Ofqual</Badge>
                      ) : (
                        <Badge variant="neutral" className="border-amber-400/30 bg-amber-500/15 text-amber-300">Manual</Badge>
                      )}
                    </div>
                    <div className="space-y-1.5 text-[12px] text-white/75">
                      <div>{sub.qualification}</div>
                      <div className="text-white/55">{sub.awarding_body}</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(sub.doc_paths ?? []).map((p) => (
                          <DocChip key={p} onClick={() => openDoc("verification-docs", p)}>
                            {p.split("/").pop()?.slice(0, 22) ?? "doc"}
                          </DocChip>
                        ))}
                      </div>
                    </div>
                  </PCard>
                </div>

                {/* Cross-checks */}
                <PCard>
                  <h4 className="mb-3 font-display text-[14px] font-bold text-white">Cross-checks</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {crossChecks.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 rounded-[8px] bg-white/[0.03] px-2.5 py-2 text-[12px]">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[c.status]}`} />
                        <span className="flex-1 text-white/80">{c.label}</span>
                        <span className="text-white/45">{c.detail ?? c.status}</span>
                      </div>
                    ))}
                  </div>
                </PCard>

                {/* Unlock preview */}
                <PCard>
                  <h4 className="mb-2 font-display text-[14px] font-bold text-white">If you approve</h4>
                  <div className="grid grid-cols-1 gap-2 text-[12px] text-white/75 sm:grid-cols-3">
                    <div><span className="text-white/45">Tier</span> · <span className="text-emerald-300 font-semibold">{canApprovePro ? "Pro-eligible" : "Verified only"}</span></div>
                    <div><span className="text-white/45">Title</span> · {titleLabel || "—"}</div>
                    <div><span className="text-white/45">ID checked</span> · {id ? "Yes" : "No"}</div>
                  </div>
                  {!canApprovePro && (
                    <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Pro tier needs identity + insurance. You can still approve as Verified.</span>
                    </div>
                  )}
                </PCard>

                {/* Decision */}
                <PCard>
                  <h4 className="mb-3 font-display text-[14px] font-bold text-white">Decision</h4>
                  <div className="space-y-2 text-[12px] text-white/80">
                    {[
                      { key: "identity", label: "Identity matches qualification" },
                      { key: "insurance", label: "Insurance current and adequate" },
                      { key: "qualification", label: "Qualification verified" },
                    ].map((c) => (
                      <label key={c.key} className="flex items-center gap-2">
                        <Checkbox
                          checked={!!checks[c.key]}
                          onCheckedChange={(v) => setChecks((p) => ({ ...p, [c.key]: !!v }))}
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                  <Textarea
                    className="mt-3"
                    placeholder="Reviewer notes (required for reject / changes)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="neutral"
                      size="sm"
                      disabled={busy || missing.length === 0}
                      onClick={() => remind({ data: { professional_id: pro!.id, missing } }).then(() => alert("Reminder sent")).catch((e: Error) => alert(e.message))}
                    >
                      <Mail className="mr-1 h-3.5 w-3.5" /> Send reminder
                    </Button>
                    <div className="flex-1" />
                    <Button variant="neutral" size="sm" disabled={busy} onClick={() => decideMutation.mutate("changes_requested")}>
                      Request changes
                    </Button>
                    <Button variant="neutral" size="sm" disabled={busy} onClick={() => decideMutation.mutate("rejected")}>
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => decideMutation.mutate("approved")}
                      className="bg-reps-orange text-white hover:bg-reps-orange-hover"
                    >
                      {busy ? <Loader2 className="size-3.5 animate-spin" /> : `Approve → ${canApprovePro ? "Pro-eligible" : "Verified"}`}
                    </Button>
                  </div>
                </PCard>

                {/* History */}
                {w.history.length > 0 && (
                  <PCard>
                    <h4 className="mb-2 font-display text-[14px] font-bold text-white">Decision history</h4>
                    <ul className="space-y-1.5 text-[12px] text-white/65">
                      {w.history.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={`mt-1 h-1.5 w-1.5 rounded-full ${h.decision === "approved" ? "bg-emerald-400" : h.decision === "rejected" ? "bg-red-400" : "bg-amber-400"}`} />
                          <div className="flex-1">
                            <span className="font-semibold text-white">{h.decision}</span>
                            <span className="ml-2 text-white/45">{relativeTime(h.created_at)} ago</span>
                            {h.notes && <div className="text-white/55">{h.notes}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </PCard>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </DashboardShell>
  );
}

function DocChip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-[6px] bg-reps-ink px-2 py-1 text-[11px] text-white/75 hover:text-reps-orange"
    >
      <FileText className="h-3 w-3" />
      {children}
      <ExternalLink className="h-3 w-3" />
    </button>
  );
}
