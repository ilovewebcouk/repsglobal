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
  DashboardEmptyIcon as EmptyIcon,
} from "@/components/dashboard/ui/empty";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CertDrawer } from "@/components/verification/CertDrawer";

import {
  claimVerification,
  getQueueStats,
  getReviewWorkspace,
  listPendingVerifications,
  listVerifications,
  releaseVerification,
  reviewVerification,
  revokeQualification,
  sendVerificationReminder,
} from "@/lib/verification/verification.functions";
import {
  listIdentityChecks,
  adminOverrideIdentity,
} from "@/lib/verification/identity.functions";
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

type StatusFilter = "submitted" | "approved" | "rejected" | "changes_requested";
type TopTab = "qualifications" | "identity";

const STATUS_LABEL: Record<StatusFilter, string> = {
  submitted: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes",
};

function AdminVerificationPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listVerifications);
  const fetchPending = useServerFn(listPendingVerifications);
  const fetchStats = useServerFn(getQueueStats);
  const fetchCase = useServerFn(getReviewWorkspace);
  const claim = useServerFn(claimVerification);
  const release = useServerFn(releaseVerification);
  const decide = useServerFn(reviewVerification);
  const revoke = useServerFn(revokeQualification);
  const remind = useServerFn(sendVerificationReminder);
  const signUrl = useServerFn(getDocSignedUrl);

  const [topTab, setTopTab] = useState<TopTab>("qualifications");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  const listing = useQuery({
    queryKey: ["admin-verifications", statusFilter],
    queryFn: () =>
      statusFilter === "submitted"
        ? fetchPending()
        : fetchList({ data: { statuses: [statusFilter] } }),
    refetchInterval: statusFilter === "submitted" ? 30_000 : false,
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

  const siblingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of listing.data ?? []) counts[r.professional_id] = (counts[r.professional_id] ?? 0) + 1;
    return counts;
  }, [listing.data]);

  const rows = useMemo(() => {
    let list = listing.data ?? [];
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
  }, [listing.data, search]);


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
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
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

      {/* Top-level tab toggle */}
      <div className="mt-6 inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
        {(["qualifications", "identity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTopTab(t); setSelectedId(null); }}
            className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
              topTab === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t === "qualifications" ? "Qualifications" : "Identity checks"}
          </button>
        ))}
      </div>

      {topTab === "identity" ? (
        <div className="mt-4">
          <AdminIdentityTab signUrl={signUrl} adminOverride={adminOverrideIdentity} />
        </div>
      ) : (
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
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
            <div className="mt-2 grid grid-cols-4 gap-1">
              {(["submitted", "approved", "changes_requested", "rejected"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => { setStatusFilter(f); setSelectedId(null); }}
                  className={`rounded-[8px] px-1.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide ${
                    statusFilter === f ? "bg-reps-orange text-white" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          </div>
          <ul className="flex-1 divide-y divide-reps-border overflow-y-auto">
            {listing.isLoading && (
              <li className="p-6 text-center text-[12px] text-white/55">Loading…</li>
            )}
            {!listing.isLoading && rows.length === 0 && (
              <li className="p-6 text-center text-[12px] text-white/55">No {STATUS_LABEL[statusFilter].toLowerCase()} cases.</li>
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
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="truncate text-[11px] text-white/55">{r.qualification}</span>
                      {siblingCounts[r.professional_id] > 1 && (
                        <span className="shrink-0 rounded-[6px] border border-reps-orange/30 bg-reps-orange-soft px-1.5 py-0.5 text-[10px] font-semibold text-reps-orange">
                          +{siblingCounts[r.professional_id] - 1} more
                        </span>
                      )}
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
                <EmptyIcon>
                  <Shield />
                </EmptyIcon>
                <EmptyTitle>Select a case to review</EmptyTitle>
                <EmptyDescription>
                  Pick a submission from the queue. Claiming a case locks it for 15 minutes so two reviewers don&rsquo;t collide.
                </EmptyDescription>
              </Empty>
            </PPanel>
          )}

          {selectedId && workspace.isLoading && (
            <PPanel className="p-10 text-center text-[13px] text-white/55">Loading case…</PPanel>
          )}

          {selectedId && workspace.data && (() => {
            const w = workspace.data;
            const sub = w.submission as Record<string, unknown> & { id: string; qualification?: string; awarding_body?: string; doc_paths?: string[]; created_at: string; reviewed_at?: string | null; derived_title_slug?: string | null; regulator_verified?: boolean | null; holder_name?: string | null };
            const id = w.identity as Record<string, unknown> & { name_on_doc?: string; dob_on_doc?: string; doc_type?: string; doc_path_front?: string; doc_path_back?: string; selfie_path?: string; doc_expiry?: string; doc_country?: string; status?: string; vendor?: string; veriff_session_id?: string; veriff_session_url?: string; veriff_status?: string; veriff_reason?: string | null; stripe_vs_id?: string; stripe_status?: string; stripe_reason?: string | null } | null;
            const ins = w.insurance as Record<string, unknown> & { provider?: string; policy_number?: string; cover_amount_gbp?: number; expiry_date?: string; doc_path?: string; status?: string } | null;
            const prof = w.profile as { full_name?: string | null } | null;
            const pro = w.professional as { id: string; city?: string | null; slug?: string | null } | null;

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
            const isApproved = (sub as { status?: string }).status === "approved";

            const handleRevoke = async () => {
              const reason = window.prompt(
                "Reason for revoking this approved qualification (required, min 8 chars). This will delete any titles granted from this certificate.",
              );
              if (!reason || reason.trim().length < 8) return;
              if (!window.confirm(`Revoke "${sub.qualification}" for ${prof?.full_name || "this pro"}?`)) return;
              setBusy(true);
              try {
                await revoke({ data: { submission_id: sub.id, reason: reason.trim() } });
                setSelectedId(null);
                qc.invalidateQueries({ queryKey: ["admin-verifications"] });
                qc.invalidateQueries({ queryKey: ["admin-queue-stats"] });
              } catch (e) {
                alert(e instanceof Error ? e.message : "Revoke failed");
              } finally {
                setBusy(false);
              }
            };

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
                    <div className="flex items-center gap-2">
                      {isApproved && (
                        <Button
                          variant="subtle"
                          size="sm"
                          disabled={busy}
                          onClick={handleRevoke}
                          className="border-red-400/40 text-red-300 hover:border-red-300 hover:text-red-200"
                        >
                          Revoke
                        </Button>
                      )}
                      <Button variant="subtle" size="sm" onClick={closeCase}>Close</Button>
                    </div>
                  </div>
                  {isApproved && (
                    <div className="mt-3 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[11.5px] text-emerald-200">
                      Approved {sub.reviewed_at ? `${relativeTime(sub.reviewed_at)} ago` : ""}
                      {titleLabel ? ` · Granted title: ${titleLabel}` : ""}
                      {pro?.slug && (
                        <>
                          {" · "}
                          <a
                            href={`/pro/${pro.slug}`}
                            target="_blank"
                            rel="noopener"
                            className="underline hover:no-underline"
                          >
                            View public profile
                          </a>
                        </>
                      )}
                    </div>
                  )}
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
                    ) : id.vendor === "stripe" ? (
                      <div className="space-y-1.5 text-[12px] text-white/75">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                          <span className="font-semibold text-white">Stripe Identity</span>
                          {id.stripe_status && (
                            <span className="rounded-[6px] bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                              {id.stripe_status}
                            </span>
                          )}
                        </div>
                        <div><span className="text-white/45">Name</span> · {id.name_on_doc || "—"}</div>
                        <div><span className="text-white/45">DOB</span> · {id.dob_on_doc || "—"}</div>
                        <div><span className="text-white/45">Doc</span> · {id.doc_type || "—"} {id.doc_country ? `(${id.doc_country})` : ""}</div>
                        {id.stripe_reason && (
                          <div className="mt-1 rounded-[8px] border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                            {id.stripe_reason}
                          </div>
                        )}
                        {id.stripe_vs_id && (
                          <a
                            href={`https://dashboard.stripe.com/identity/verification-sessions/${id.stripe_vs_id}`}
                            target="_blank"
                            rel="noopener"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white"
                          >
                            Open in Stripe Dashboard <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ) : id.vendor === "veriff" ? (
                      <div className="space-y-1.5 text-[12px] text-white/75">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                          <span className="font-semibold text-white">Veriff (legacy)</span>
                          {id.veriff_status && (
                            <span className="rounded-[6px] bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                              {id.veriff_status}
                            </span>
                          )}
                        </div>
                        <div><span className="text-white/45">Name</span> · {id.name_on_doc || "—"}</div>
                        <div><span className="text-white/45">DOB</span> · {id.dob_on_doc || "—"}</div>
                        <div><span className="text-white/45">Doc</span> · {id.doc_type || "—"} {id.doc_country ? `(${id.doc_country})` : ""}</div>
                        <div><span className="text-white/45">Expiry</span> · {id.doc_expiry || "—"}</div>
                        {id.veriff_reason && (
                          <div className="mt-1 rounded-[8px] border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                            {id.veriff_reason}
                          </div>
                        )}
                      </div>
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
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => setCertOpen(true)}
                          className="w-full"
                        >
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          Review certificate ({(sub.doc_paths ?? []).length})
                        </Button>
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
                      variant="subtle"
                      size="sm"
                      disabled={busy || missing.length === 0}
                      onClick={() => remind({ data: { professional_id: pro!.id, missing } }).then(() => alert("Reminder sent")).catch((e: Error) => alert(e.message))}
                    >
                      <Mail className="mr-1 h-3.5 w-3.5" /> Send reminder
                    </Button>
                    <div className="flex-1" />
                    <Button variant="subtle" size="sm" disabled={busy} onClick={() => decideMutation.mutate("changes_requested")}>
                      Request changes
                    </Button>
                    <Button variant="subtle" size="sm" disabled={busy} onClick={() => decideMutation.mutate("rejected")}>
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

                <CertDrawer
                  open={certOpen}
                  onOpenChange={setCertOpen}
                  cert={{
                    id: sub.id,
                    qualification: sub.qualification ?? "Qualification",
                    awarding_body: sub.awarding_body ?? "",
                    year: typeof (sub as { year?: number | null }).year === "number" ? (sub as { year?: number | null }).year : null,
                    expiry_date: (sub as { expiry_date?: string | null }).expiry_date ?? null,
                    doc_paths: sub.doc_paths ?? [],
                    regulator_verified: sub.regulator_verified ?? null,
                    derived_title_label: titleLabel,
                    status: (sub as { status?: string }).status ?? "submitted",
                    holder_name: sub.holder_name ?? null,
                    professional_name: prof?.full_name ?? null,
                  }}
                  crossChecks={crossChecks}
                  resolveDocUrl={async (path) => {
                    const { url } = await signUrl({ data: { bucket: "verification-docs", path } });
                    return url;
                  }}
                  busy={busy}
                  onApprove={() => { setCertOpen(false); decideMutation.mutate("approved"); }}
                  onReject={() => { setCertOpen(false); decideMutation.mutate("rejected"); }}
                  onRequestChanges={() => { setCertOpen(false); decideMutation.mutate("changes_requested"); }}
                />
              </>
            );
          })()}
        </div>
      </div>
      )}
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

/* -------------------------------------------------------------------------- */
/* Identity tab — admin index of all identity_documents                       */
/* -------------------------------------------------------------------------- */

type IdentityStatus = "pending" | "approved" | "rejected" | "needs_more_info" | "expired";

const IDENTITY_STATUS_LABEL: Record<IdentityStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_info: "More info",
  expired: "Expired",
};

function AdminIdentityTab({
  signUrl,
  adminOverride,
}: {
  signUrl: ReturnType<typeof useServerFn<typeof getDocSignedUrl>>;
  adminOverride: typeof adminOverrideIdentity;
}) {
  const qc = useQueryClient();
  const fetchIdentities = useServerFn(listIdentityChecks);
  const override = useServerFn(adminOverride);
  const [status, setStatus] = useState<IdentityStatus>("pending");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["admin-identity-checks", status],
    queryFn: () => fetchIdentities({ data: { statuses: [status] } }),
    refetchInterval: status === "pending" ? 30_000 : false,
  });

  const rows = useMemo(() => {
    const list = (query.data ?? []) as Array<{
      id: string;
      profile_name: string | null;
      doc_type: string | null;
      name_on_doc: string | null;
      status: string;
      vendor: string | null;
      stripe_status: string | null;
      stripe_reason: string | null;
      admin_note: string | null;
      created_at: string;
      reviewed_at: string | null;
    }>;
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        (r.profile_name ?? "").toLowerCase().includes(q) ||
        (r.name_on_doc ?? "").toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const doOverride = async (id: string, decision: "approved" | "rejected" | "needs_more_info") => {
    const reason = window.prompt(
      `Reason for marking this identity check as "${decision}" (required, min 8 chars):`,
    );
    if (!reason || reason.trim().length < 8) return;
    try {
      await override({ data: { identity_id: id, decision, reason: reason.trim() } });
      qc.invalidateQueries({ queryKey: ["admin-identity-checks"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Override failed");
    }
  };

  return (
    <PPanel className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {(["pending", "approved", "needs_more_info", "rejected", "expired"] as IdentityStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-[8px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                status === s ? "bg-reps-orange text-white" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {IDENTITY_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <p className="mt-3 rounded-[8px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
        Identity checks confirm who the person is. They do <span className="text-white/80">not</span> grant
        professional titles — those come from approved qualifications.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="text-[10.5px] uppercase tracking-wide text-white/45">
            <tr>
              <th className="pb-2 pr-3">Person</th>
              <th className="pb-2 pr-3">Name on doc</th>
              <th className="pb-2 pr-3">Vendor</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Submitted</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-reps-border text-white/80">
            {query.isLoading && (
              <tr><td colSpan={6} className="py-6 text-center text-white/55">Loading…</td></tr>
            )}
            {!query.isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-white/55">No {IDENTITY_STATUS_LABEL[status].toLowerCase()} checks.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-2 pr-3 font-semibold text-white">{r.profile_name || "—"}</td>
                <td className="py-2 pr-3">{r.name_on_doc || "—"}</td>
                <td className="py-2 pr-3 text-white/60">{r.vendor ?? "manual"}{r.stripe_status ? ` · ${r.stripe_status}` : ""}</td>
                <td className="py-2 pr-3">
                  <Badge
                    variant="neutral"
                    className={
                      r.status === "approved"
                        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                        : r.status === "rejected" || r.status === "expired"
                          ? "border-red-400/30 bg-red-500/15 text-red-300"
                          : "border-amber-400/30 bg-amber-500/15 text-amber-300"
                    }
                  >
                    {r.status}
                  </Badge>
                  {r.stripe_reason && (
                    <div className="mt-1 max-w-xs text-[10.5px] text-amber-200/80">{r.stripe_reason}</div>
                  )}
                </td>
                <td className="py-2 pr-3 text-white/55">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.status !== "approved" && (
                      <Button size="sm" variant="subtle" onClick={() => doOverride(r.id, "approved")}>Approve</Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button size="sm" variant="subtle" onClick={() => doOverride(r.id, "rejected")}>Reject</Button>
                    )}
                    {r.status !== "needs_more_info" && (
                      <Button size="sm" variant="subtle" onClick={() => doOverride(r.id, "needs_more_info")}>Needs info</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* signUrl prop intentionally accepted for future per-row doc preview */}
      <span className="hidden">{typeof signUrl}</span>
    </PPanel>
  );
}

