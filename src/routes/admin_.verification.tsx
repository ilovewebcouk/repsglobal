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
  UserRound,
  XCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMemo, useRef, useState } from "react";

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

import { CertDrawer } from "@/components/verification/CertDrawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  claimVerification,
  getQueueStats,
  getReviewWorkspace,
  listPendingVerifications,
  listVerifications,
  recheckOfqualForSubmission,
  releaseVerification,
  reviewVerification,
  revokeQualification,
  sendVerificationReminder,
} from "@/lib/verification/verification.functions";
import { listIdentityChecks } from "@/lib/verification/identity.functions";

import {
  getDocSignedUrl,
  listInsurancePolicies,
  reviewInsurance,
  recheckInsuranceAi,
} from "@/lib/verification/insurance.functions";
import { adminNudgeInsuranceRenewal } from "@/lib/verification/notifications.functions";
import { runCrossChecks, evaluateGates, type CheckStatus } from "@/lib/verification/cross-checks";
import { buildAwardingBodyVerifyLinks } from "@/lib/verification/awarding-body-verify";
import { getTitleLabel } from "@/lib/cpd/titles-catalog";
import { TimeAgo } from "@/components/verification/TimeAgo";
import { absoluteDateTime, relativeTime } from "@/lib/verification/format-time";
import { AdminProviderQueueTab } from "@/components/admin/verification/AdminProviderQueueTab";
import { AdminProviderQualificationsTab } from "@/components/admin/verification/AdminProviderQualificationsTab";

export const Route = createFileRoute("/admin_/verification")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminVerificationPage,
});

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
type TopTab = "qualifications" | "identity" | "insurance";

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
  const recheckOfqual = useServerFn(recheckOfqualForSubmission);
  const nudgeRenewal = useServerFn(adminNudgeInsuranceRenewal);
  const nudgeRenewalMutation = useMutation({
    mutationFn: (professional_id: string) => nudgeRenewal({ data: { professional_id } }),
  });

  const [audience, setAudience] = useState<"trainers" | "providers">("trainers");
  const [topTab, setTopTab] = useState<TopTab>("qualifications");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [manualQualConfirmed, setManualQualConfirmed] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [personDrawerOpen, setPersonDrawerOpen] = useState(false);
  /** Reviewer-notes textarea is hidden by default; revealed when reviewer picks Request changes / Reject or explicitly opens it. */
  const [notesOpen, setNotesOpen] = useState(false);
  /** When true, after the next decision lands we jump to the next pending case instead of clearing. */
  const advanceAfterDecideRef = useRef(false);

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
    setOverrideReason("");
    setChecks({});
    setManualQualConfirmed(false);
    setRevokeOpen(false);
    setRevokeReason("");
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
    mutationFn: async (args: {
      decision: "approved" | "rejected" | "changes_requested";
      unlocked_tier?: "verified" | "pro" | "studio" | null;
      gates_snapshot?: Record<string, unknown> | null;
      override_reason?: string | null;
    }) => {
      if (!selectedId) return;
      if (args.decision !== "approved" && !note.trim()) throw new Error("Note required for rejection / changes");
      setBusy(true);
      await decide({
        data: {
          id: selectedId,
          decision: args.decision,
          admin_note: note.trim() || null,
          checklist: checks,
          unlocked_tier: args.unlocked_tier ?? null,
          gates_snapshot: args.gates_snapshot ?? null,
          override_reason: args.override_reason ?? null,
        },
      });
    },
    onSettled: () => {
      setBusy(false);
      // Compute the next pending case (in current queue order) before we mutate selectedId.
      const advance = advanceAfterDecideRef.current;
      advanceAfterDecideRef.current = false;
      let nextId: string | null = null;
      if (advance) {
        const list = listing.data ?? [];
        const pending = list.filter((r) => r.status === "submitted" || r.status === "changes_requested" || r.id === selectedId);
        const idx = pending.findIndex((r) => r.id === selectedId);
        const next = idx >= 0 ? pending.slice(idx + 1).find((r) => r.id !== selectedId) : pending[0];
        nextId = next?.id ?? null;
      }
      setNote("");
      setOverrideReason("");
      setChecks({});
      setManualQualConfirmed(false);
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-queue-stats"] });
      if (nextId) {
        void selectCase(nextId);
      } else {
        setSelectedId(null);
      }
    },
    onError: (e) => alert(e instanceof Error ? e.message : "Decision failed"),
  });

  const recheckMutation = useMutation({
    mutationFn: async (submission_id: string) => recheckOfqual({ data: { submission_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-workspace", selectedId] });
    },
    onError: (e) => alert(e instanceof Error ? e.message : "Ofqual re-check failed"),
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
      {/* Audience toggle — Trainers (identity/insurance/qualifications) vs
          Providers (name/domain/profile change requests). */}
      <div className="mb-4 inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
        {(["trainers", "providers"] as const).map((a) => (
          <button
            key={a}
            onClick={() => { setAudience(a); setSelectedId(null); }}
            className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
              audience === a ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {a === "trainers" ? "Trainers" : "Training providers"}
          </button>
        ))}
      </div>

      {audience === "providers" ? (
        <ProvidersAudience />
      ) : (
      <>
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
        {(["qualifications", "identity", "insurance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTopTab(t); setSelectedId(null); }}
            className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
              topTab === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t === "qualifications" ? "Qualifications" : t === "identity" ? "Identity checks" : "Insurance"}
          </button>
        ))}
      </div>

      {topTab === "identity" ? (
        <div className="mt-4">
          <AdminIdentityTab signUrl={signUrl} />

        </div>
      ) : topTab === "insurance" ? (
        <div className="mt-4">
          <AdminInsuranceTab />
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
              const isPending = r.status === "submitted" || r.status === "changes_requested";
              const sla = isPending ? slaRemaining(r.created_at) : null;
              const name = r.professional?.full_name || "Unnamed";
              const claimed = (r as { claimed_by?: string | null }).claimed_by;
              const reviewedAt = (r as { reviewed_at?: string | null }).reviewed_at;
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
                      <span className="text-white/45" title={absoluteDateTime(reviewedAt ?? r.created_at)}>
                        {isPending
                          ? <>Submitted <TimeAgo iso={r.created_at} className="text-white/45" /></>
                          : reviewedAt
                            ? <>{STATUS_LABEL[r.status as StatusFilter] ?? r.status} <TimeAgo iso={reviewedAt} className="text-white/45" /></>
                            : <TimeAgo iso={r.created_at} className="text-white/45" />}
                      </span>
                      {sla && (
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
                      )}
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
              duplicateFileSha: (sub as { duplicate_of?: string | null }).duplicate_of ? true : null,
            });

            const gates = evaluateGates({
              profileName: prof?.full_name ?? null,
              certHolderName: sub.holder_name ?? null,
              idDocName: id?.name_on_doc ?? null,
              regulatorVerified: sub.regulator_verified ?? null,
              insuranceExpiry: ins?.expiry_date ?? null,
              insuranceCover: ins?.cover_amount_gbp ?? null,
              certNumberPresent: !!((sub as { certificate_number?: string | null }).certificate_number || (sub as { qualification_number?: string | null }).qualification_number),
              expiryDate: (sub as { expiry_date?: string | null }).expiry_date ?? null,
              issueYear: (sub as { year?: number | null }).year ?? null,
              duplicateFileSha: (sub as { duplicate_of?: string | null }).duplicate_of ? true : null,
            });

            const subStatus = (sub as { status?: string }).status;
            const isPending = subStatus === "submitted" || subStatus === "changes_requested";
            const sla = isPending ? slaRemaining(sub.created_at) : null;
            const titleLabel = getTitleLabel(sub.derived_title_slug ?? null);
            const missing: ("identity" | "selfie" | "insurance" | "cert")[] = [];
            if (!id) missing.push("identity");
            // Stripe Identity captures doc + selfie in the same session — no separate selfie_path is stored.
            else if (!id.selfie_path && (id as { vendor?: string | null }).vendor !== "stripe") missing.push("selfie");
            if (!ins) missing.push("insurance");

            // (canApprovePro removed — verification is now decoupled from subscription tier.)
            const isApproved = subStatus === "approved";
            const isFinal = subStatus === "approved" || subStatus === "rejected";
            const overrideOk = overrideReason.trim().length >= 8;
            const approveAllowed = gates.hardPassed || overrideOk;
            const gatesSnap = { hardPassed: gates.hardPassed, blockingReasons: gates.blockingReasons, hardGates: gates.hardGates, softGates: gates.softGates };

            const handleRevoke = async () => {
              if (revokeReason.trim().length < 8) return;
              setBusy(true);
              try {
                await revoke({ data: { submission_id: sub.id, reason: revokeReason.trim() } });
                setRevokeOpen(false);
                setRevokeReason("");
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
                        <span>Submitted <TimeAgo iso={sub.created_at} /></span>
                        {sla && (
                          <>
                            <span>·</span>
                            <span className={
                              sla.tone === "breach" ? "text-red-300" : sla.tone === "warn" ? "text-amber-300" : "text-emerald-300"
                            }>SLA {sla.label}</span>
                          </>
                        )}
                        {isFinal && sub.reviewed_at && (
                          <>
                            <span>·</span>
                            <span className={isApproved ? "text-emerald-300" : "text-red-300"}>
                              {isApproved ? "Approved" : "Rejected"} <TimeAgo iso={sub.reviewed_at} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isApproved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => { setRevokeReason(""); setRevokeOpen(true); }}
                          className="border-red-400/40 text-red-300 hover:border-red-300 hover:text-red-200"
                        >
                          Revoke
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={closeCase}>Close</Button>
                    </div>
                  </div>
                  {isApproved && (
                    <div className="mt-3 rounded-[8px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[11.5px] text-emerald-200">
                      Approved {sub.reviewed_at ? <TimeAgo iso={sub.reviewed_at} /> : ""}
                      {titleLabel ? ` · Granted title: ${titleLabel}` : ""}
                      {pro?.slug && (
                        <>
                          {" · "}
                          <a
                            href={`/c/${pro.slug}`}
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


                {/* ── STEP 1 · IDENTITY ──────────────────────────────── */}
                <PCard>
                  <StepHeader
                    num={1}
                    title="Identity"
                    pill={
                      id?.status === "approved"
                        ? { tone: "ok", label: `Verified${id.vendor === "stripe" ? " · Stripe" : id?.vendor === "veriff" ? " · Veriff" : ""}` }
                        : id
                          ? { tone: "warn", label: `Pending${id.stripe_status ? ` · ${id.stripe_status}` : ""}` }
                          : { tone: "miss", label: "Not submitted" }
                    }
                  />
                  {!id ? (
                    <p className="text-[12px] text-white/55">
                      No ID submitted. Use the reminder button at the bottom to request one.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[12px] text-white/75 sm:grid-cols-2">
                      <div><span className="text-white/45">Name on doc</span> · {id.name_on_doc || "—"}</div>
                      <div><span className="text-white/45">DOB</span> · {id.dob_on_doc || "—"}</div>
                      <div><span className="text-white/45">Doc</span> · {id.doc_type || "—"}{id.doc_country ? ` (${id.doc_country})` : ""}</div>
                      <div><span className="text-white/45">Expiry</span> · {id.doc_expiry || "—"}</div>
                      {id.vendor === "stripe" && id.stripe_reason && (
                        <div className="sm:col-span-2 mt-1 rounded-[8px] border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                          {id.stripe_reason}
                        </div>
                      )}
                      {id.vendor === "veriff" && id.veriff_reason && (
                        <div className="sm:col-span-2 mt-1 rounded-[8px] border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                          {id.veriff_reason}
                        </div>
                      )}
                      <div className="sm:col-span-2 flex flex-wrap gap-1.5 pt-2">
                        {id.vendor === "stripe" && id.stripe_vs_id && (
                          <a
                            href={`https://dashboard.stripe.com/identity/verification-sessions/${id.stripe_vs_id}`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 rounded-[8px] border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] text-white/85 hover:bg-white/[0.08]"
                          >
                            Open in Stripe <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {id.doc_path_front && <DocChip onClick={() => openDoc("identity-docs", id.doc_path_front!)}>Front</DocChip>}
                        {id.doc_path_back && <DocChip onClick={() => openDoc("identity-docs", id.doc_path_back!)}>Back</DocChip>}
                        {id.selfie_path && <DocChip onClick={() => openDoc("identity-docs", id.selfie_path!)}>Selfie</DocChip>}
                      </div>
                    </div>
                  )}
                </PCard>

                {/* ── STEP 2 · INSURANCE ─────────────────────────────── */}
                <PCard>
                  {(() => {
                    const insExpired = ins?.expiry_date ? new Date(ins.expiry_date).getTime() < Date.now() : false;
                    const lowCover = ins ? (ins.cover_amount_gbp ?? 0) < 1_000_000 : false;
                    const insPill = !ins
                      ? { tone: "miss" as const, label: "Not submitted" }
                      : insExpired
                        ? { tone: "fail" as const, label: `Expired ${ins.expiry_date}` }
                        : lowCover
                          ? { tone: "warn" as const, label: `Low cover · £${(ins.cover_amount_gbp ?? 0).toLocaleString()}` }
                          : { tone: "ok" as const, label: `In date · expires ${ins.expiry_date}` };
                    return (
                      <>
                        <StepHeader num={2} title="Insurance" pill={insPill} />
                        {!ins ? (
                          <p className="text-[12px] text-white/55">
                            No insurance on file. You can still approve — insurance is tracked separately and the pro will be nudged to upload.
                          </p>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[12px] text-white/75 sm:grid-cols-2">
                              <div><span className="text-white/45">Provider</span> · {ins.provider}</div>
                              <div><span className="text-white/45">Cover</span> · £{(ins.cover_amount_gbp ?? 0).toLocaleString()}</div>
                              <div><span className="text-white/45">Policy</span> · {ins.policy_number || "—"}</div>
                              <div><span className="text-white/45">Expires</span> · {ins.expiry_date}</div>
                            </div>
                            {(() => {
                              const insured = (ins as { insured_name?: string | null }).insured_name ?? null;
                              const nameMatchVal = (ins as { name_match?: boolean | null }).name_match ?? null;
                              const idName = (pro as { identity_verified_name?: string | null } | null)?.identity_verified_name ?? null;
                              const refName = idName ?? prof?.full_name ?? null;
                              const tone: "ok" | "warn" | "fail" =
                                nameMatchVal === true ? "ok" : nameMatchVal === false ? "fail" : "warn";
                              const toneCls =
                                tone === "ok"
                                  ? "border-emerald-400/30 bg-emerald-500/5 text-emerald-100/85"
                                  : tone === "fail"
                                    ? "border-red-400/30 bg-red-500/10 text-red-200"
                                    : "border-amber-400/30 bg-amber-500/5 text-amber-100/85";
                              return (
                                <div className={`mt-2 rounded-[8px] border px-2.5 py-2 text-[11.5px] ${toneCls}`}>
                                  <div className="font-semibold">
                                    {insured
                                      ? `Insured name: ${insured}`
                                      : "Insured name: not extracted — verify manually on certificate"}
                                  </div>
                                  {refName && (
                                    <div className="opacity-70">
                                      {idName ? "ID-verified name" : "Profile name"}: {refName}
                                      {nameMatchVal === true ? " — matches" : nameMatchVal === false ? " — MISMATCH, review carefully" : ""}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {ins.doc_path && <DocChip onClick={() => openDoc("insurance-docs", ins.doc_path!)}>View certificate</DocChip>}
                            </div>
                            {(() => {
                              const ts = (ins as { trust_signals?: { ai?: string; ai_confidence?: number | null; name_match?: boolean | null; name_score?: number | null; expiry_mismatch?: boolean; low_cover?: boolean; ai_extracted?: { expiry_date?: string | null; cover_amount_gbp?: number | null; insured_name?: string | null } } | null }).trust_signals ?? null;
                              if (!ts) return null;
                              const chips: Array<{ tone: "ok" | "warn" | "fail" | "info"; label: string }> = [];
                              if (ts.ai === "ok") {
                                chips.push({ tone: "info", label: `AI checked${typeof ts.ai_confidence === "number" ? ` · ${(ts.ai_confidence * 100).toFixed(0)}%` : ""}` });
                              } else if (ts.ai === "skipped") {
                                chips.push({ tone: "warn", label: "AI check skipped" });
                              }
                              if (ts.name_match === true) chips.push({ tone: "ok", label: "Name matches ID" });
                              else if (ts.name_match === false) chips.push({ tone: "fail", label: `Name mismatch${ts.ai_extracted?.insured_name ? ` · "${ts.ai_extracted.insured_name}"` : ""}` });
                              if (ts.expiry_mismatch) chips.push({ tone: "warn", label: `AI saw expiry ${ts.ai_extracted?.expiry_date ?? "?"}` });
                              if (ts.low_cover) chips.push({ tone: "warn", label: "Cover < £1m" });
                              if (chips.length === 0) return null;
                              return (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {chips.map((c, i) => (
                                    <span
                                      key={i}
                                      className={`rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-medium ${
                                        c.tone === "ok"
                                          ? "bg-emerald-500/15 text-emerald-300"
                                          : c.tone === "warn"
                                            ? "bg-amber-500/15 text-amber-300"
                                            : c.tone === "fail"
                                              ? "bg-red-500/15 text-red-300"
                                              : "bg-white/10 text-white/75"
                                      }`}
                                    >
                                      {c.label}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                            {insExpired && (
                              <div className="mt-3 rounded-[8px] border border-red-400/30 bg-red-500/10 px-2.5 py-2 text-[11.5px] text-red-200">
                                <div>Policy expired on {ins.expiry_date}. Cannot verify until a current certificate is on file.</div>
                                {pro?.id && (
                                  <div className="mt-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => nudgeRenewalMutation.mutate(pro.id)}
                                      disabled={nudgeRenewalMutation.isPending || nudgeRenewalMutation.isSuccess}
                                    >
                                      {nudgeRenewalMutation.isSuccess
                                        ? "Reminder sent ✓"
                                        : nudgeRenewalMutation.isPending
                                          ? "Sending…"
                                          : "Nudge trainer to renew"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                </PCard>


                {/* ── STEP 3 · QUALIFICATION ─────────────────────────── */}
                <PCard>
                  {(() => {
                    const certNo = (sub as { certificate_number?: string | null }).certificate_number ?? null;
                    const qualNo = (sub as { qualification_number?: string | null }).qualification_number ?? null;
                    const learnerNo = (sub as { learner_number?: string | null }).learner_number ?? null;
                    const slug = (sub as { awarding_body_slug?: string | null }).awarding_body_slug ?? null;
                    const ocrHolder = (sub as { ai_extraction?: { holder_name?: string | null } | null }).ai_extraction?.holder_name
                      ?? sub.holder_name ?? null;
                    const links = buildAwardingBodyVerifyLinks({ slug, qualNumber: qualNo, certNumber: certNo, learnerNumber: learnerNo });
                    // Prefer the Stripe-verified legal name (locked after ID approval) over the editable profile name.
                    const identityName = (pro as { identity_verified_name?: string | null } | null)?.identity_verified_name ?? null;
                    const refName = identityName ?? prof?.full_name ?? null;
                    const nameMismatch = !!(ocrHolder && refName && ocrHolder.trim().toLowerCase() !== refName.trim().toLowerCase());
                    const certExpired = (sub as { expiry_date?: string | null }).expiry_date
                      ? new Date((sub as { expiry_date?: string | null }).expiry_date!).getTime() < Date.now()
                      : false;
                    const regRecord = (sub as { regulator_record?: { title?: string | null; awardingOrganisation?: string | null; level?: string | null; status?: string | null } | null }).regulator_record ?? null;
                    const trustOfqual = (sub as { trust_signals?: { ofqual?: { awarding_body_match?: boolean; title_match?: boolean; is_live?: boolean; found?: boolean; rechecked_at?: string } } | null }).trust_signals?.ofqual ?? null;
                    const hasOfqualQual = !!qualNo && /^\d{3}\/\d{4}\/[A-Z0-9]$/i.test(qualNo);
                    const ofqualDetailsUrl = qualNo
                      ? `https://find-a-qualification.services.ofqual.gov.uk/qualifications/${encodeURIComponent(qualNo.replace(/\//g, ""))}`
                      : null;

                    const qualPill = certExpired
                      ? { tone: "fail" as const, label: "Certificate expired" }
                      : nameMismatch
                        ? { tone: "warn" as const, label: "Name doesn't match" }
                        : sub.regulator_verified
                          ? { tone: "ok" as const, label: "Ofqual-listed" }
                          : { tone: "warn" as const, label: "Manual check required" };
                    return (
                      <>
                        <StepHeader num={3} title="Qualification" pill={qualPill} />
                        <div className="space-y-1.5 text-[12px] text-white/75">
                          <div className="font-semibold text-white">{sub.qualification}</div>
                          <div className="text-white/55">{sub.awarding_body}</div>
                          <div className="grid grid-cols-1 gap-x-6 gap-y-1 pt-1 sm:grid-cols-2">
                            {qualNo && <div><span className="text-white/45">Qual no.</span> · <span className="font-mono">{qualNo}</span></div>}
                            {certNo && <div><span className="text-white/45">Cert no.</span> · <span className="font-mono">{certNo}</span></div>}
                            {titleLabel && <div className="sm:col-span-2"><span className="text-white/45">If approved → unlocks title</span> · {titleLabel}</div>}
                          </div>

                          {/* Ofqual record panel — only when we have a qual number in the right format */}
                          {hasOfqualQual && (
                            <div className="mt-3 rounded-[10px] border border-white/10 bg-white/[0.03] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-[10.5px] uppercase tracking-wide text-white/55">
                                  Ofqual register · <span className="font-mono text-white/75">{qualNo}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {ofqualDetailsUrl && (
                                    <a
                                      href={ofqualDetailsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-[6px] border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] text-white/80 hover:bg-white/[0.08]"
                                    >
                                      <ExternalLink className="h-3 w-3" /> Open
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => recheckMutation.mutate(sub.id)}
                                    disabled={recheckMutation.isPending}
                                    className="inline-flex items-center gap-1 rounded-[6px] border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] text-white/80 hover:bg-white/[0.08] disabled:opacity-50"
                                  >
                                    {recheckMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                    Re-check
                                  </button>
                                </div>
                              </div>
                              {regRecord ? (
                                <>
                                  <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                                    {regRecord.title && (
                                      <div><dt className="inline text-white/45">Title</dt> · <dd className="inline text-white/85">{regRecord.title}</dd></div>
                                    )}
                                    {regRecord.awardingOrganisation && (
                                      <div><dt className="inline text-white/45">Awarding org</dt> · <dd className="inline text-white/85">{regRecord.awardingOrganisation}</dd></div>
                                    )}
                                    {regRecord.level && (
                                      <div><dt className="inline text-white/45">Level</dt> · <dd className="inline text-white/85">{regRecord.level}</dd></div>
                                    )}
                                    {regRecord.status && (
                                      <div><dt className="inline text-white/45">Status</dt> · <dd className="inline text-white/85">{regRecord.status}</dd></div>
                                    )}
                                  </dl>
                                  {trustOfqual && (
                                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]">
                                      <SubCheckChip ok={!!trustOfqual.awarding_body_match} label="Body match" />
                                      <SubCheckChip ok={!!trustOfqual.title_match} label="Title match" />
                                      <SubCheckChip ok={!!trustOfqual.is_live} label="Status live" />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="mt-2 text-[11.5px] text-white/55">
                                  Not yet fetched, or qualification number not found on the Ofqual register. Use Re-check to retry.
                                </div>
                              )}
                            </div>
                          )}

                          {ocrHolder && (
                            <div className={`mt-2 rounded-[8px] border px-2.5 py-2 text-[11.5px] ${nameMismatch ? "border-amber-400/30 bg-amber-500/5 text-amber-100/85" : "border-emerald-400/20 bg-emerald-500/5 text-emerald-100/85"}`}>
                              <div className="flex items-center gap-1.5 font-semibold">
                                {nameMismatch ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Holder on cert: {ocrHolder}
                              </div>
                              {refName && (
                                <div className="opacity-70">
                                  {identityName ? "ID-verified name" : "Profile name"}: {refName}{nameMismatch ? " — review carefully" : " — matches"}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="pt-2 text-[11px] text-white/45">
                            Ofqual confirms the qualification exists. The awarding body confirms this learner holds it — use the link below.
                          </div>
                          {(links.length > 0 || !sub.regulator_verified) && (
                            <div className="pt-1">
                              <div className="text-[10.5px] uppercase tracking-wide text-white/45">Verify on</div>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {links.map((l) => (
                                  <a
                                    key={l.url}
                                    href={l.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-[8px] border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] text-white/85 hover:bg-white/[0.08]"
                                  >
                                    <ExternalLink className="h-3 w-3" /> {l.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCertOpen(true)}
                              className="w-full sm:w-auto"
                            >
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              Open certificate ({(sub.doc_paths ?? []).length})
                            </Button>
                          </div>
                          {!sub.regulator_verified && !isFinal && (
                            <label className="mt-3 flex items-start gap-2 rounded-[8px] border border-amber-400/30 bg-amber-500/[0.06] px-3 py-2 text-[12px] text-amber-100/90 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-3.5 w-3.5 accent-reps-orange"
                                checked={manualQualConfirmed}
                                onChange={(e) => {
                                  const next = e.target.checked;
                                  setManualQualConfirmed(next);
                                  if (next && !overrideReason.trim()) {
                                    const ref = certNo || qualNo || "certificate";
                                    setOverrideReason(`Confirmed on ${sub.awarding_body ?? "awarding body"} site — ${ref}`);
                                  }
                                }}
                              />
                              <span>
                                I&rsquo;ve confirmed this certificate on the awarding body site. Required because this awarding body isn&rsquo;t on the Ofqual register.
                              </span>
                            </label>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </PCard>


                {/* ── DECISION ───────────────────────────────────────── */}
                {isFinal ? (
                  <PCard>
                    <div className="text-[12.5px] text-white/65">
                      This case is {isApproved ? "approved" : "rejected"}. {isApproved ? "Use Revoke above to reverse." : "The pro can re-submit."}
                    </div>
                  </PCard>
                ) : (
                  <PCard>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-display text-[14px] font-bold text-white">Decision</h4>
                      <span className="text-[11px] text-white/55">
                        Will approve: <span className="font-semibold text-white">this qualification</span>
                      </span>
                    </div>

                    {!gates.hardPassed && (
                      <div className="mb-3 rounded-[8px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
                        <div className="mb-1 flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Blocking issues — override required
                        </div>
                        <ul className="list-disc space-y-0.5 pl-5 text-red-100/85">
                          {gates.blockingReasons.map((r) => <li key={r}>{r}</li>)}
                        </ul>
                      </div>
                    )}

                    <Textarea
                      placeholder="Reviewer notes (required for reject / changes)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />

                    {!gates.hardPassed && (
                      <div className="mt-3">
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                          Override reason <span className="text-white/40">(≥8 chars, recorded permanently)</span>
                        </label>
                        <Input
                          placeholder="e.g. Confirmed cert on Innovate Awarding site, holder name matches"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {missing.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => remind({ data: { professional_id: pro!.id, missing } }).then(() => alert("Reminder sent")).catch((e: Error) => alert(e.message))}
                        >
                          <Mail className="mr-1 h-3.5 w-3.5" /> Request {missing.join(" + ")}
                        </Button>
                      )}
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => decideMutation.mutate({ decision: "changes_requested", gates_snapshot: gatesSnap })}>
                        Request changes
                      </Button>
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => decideMutation.mutate({ decision: "rejected", gates_snapshot: gatesSnap })}>
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy || !approveAllowed}
                        onClick={() => decideMutation.mutate({
                          decision: "approved",
                          unlocked_tier: "verified",
                          gates_snapshot: gatesSnap,
                          override_reason: overrideReason.trim() || null,
                        })}
                        className="bg-reps-orange text-white hover:bg-reps-orange-hover disabled:opacity-50"
                        title={approveAllowed ? "Approve qualification" : `Failing: ${gates.blockingReasons.join(", ")}`}
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Approve qualification"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy || !approveAllowed}
                        onClick={() => {
                          advanceAfterDecideRef.current = true;
                          decideMutation.mutate({
                            decision: "approved",
                            unlocked_tier: "verified",
                            gates_snapshot: gatesSnap,
                            override_reason: overrideReason.trim() || null,
                          });
                        }}
                        className="bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                        title={approveAllowed ? "Approve and jump to the next pending case" : `Failing: ${gates.blockingReasons.join(", ")}`}
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Approve & next"}
                      </Button>
                    </div>
                  </PCard>
                )}

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
                            <span className="ml-2 text-white/45"><TimeAgo iso={h.created_at} /></span>
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
                  onApprove={() => { setCertOpen(false); decideMutation.mutate({ decision: "approved", unlocked_tier: "verified", gates_snapshot: gatesSnap, override_reason: overrideReason.trim() || null }); }}
                  onReject={() => { setCertOpen(false); decideMutation.mutate({ decision: "rejected", gates_snapshot: gatesSnap }); }}
                  onRequestChanges={() => { setCertOpen(false); decideMutation.mutate({ decision: "changes_requested", gates_snapshot: gatesSnap }); }}
                />

                <Dialog open={revokeOpen} onOpenChange={(o) => { setRevokeOpen(o); if (!o) setRevokeReason(""); }}>
                  <DialogContent className="border-reps-border bg-reps-ink text-white">
                    <DialogHeader>
                      <DialogTitle>Revoke approved qualification?</DialogTitle>
                      <DialogDescription className="text-white/65">
                        This deletes any titles granted from &ldquo;{sub.qualification}&rdquo; for{""}
                        {prof?.full_name || "this pro"}. Reason is recorded permanently and shown to the pro.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Reason for revoking (min 8 chars)"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      rows={3}
                    />
                    <DialogFooter>
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRevokeOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy || revokeReason.trim().length < 8}
                        onClick={handleRevoke}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Revoke"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            );
          })()}
        </div>
      </div>
      )}
      </>
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

type StepPill = { tone: "ok" | "warn" | "fail" | "miss"; label: string };

function StepHeader({ num, title, pill }: { num: number; title: string; pill: StepPill }) {
  const tone =
    pill.tone === "ok" ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
    : pill.tone === "warn" ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
    : pill.tone === "fail" ? "border-red-400/30 bg-red-500/15 text-red-300"
    : "border-white/15 bg-white/5 text-white/55";
  const icon =
    pill.tone === "ok" ? <CheckCircle2 className="h-3.5 w-3.5" />
    : pill.tone === "fail" ? <XCircle className="h-3.5 w-3.5" />
    : pill.tone === "warn" ? <AlertTriangle className="h-3.5 w-3.5" />
    : <Clock className="h-3.5 w-3.5" />;
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-white/70">
          {num}
        </span>
        <h4 className="font-display text-[15px] font-bold text-white">{title}</h4>
      </div>
      <span className={`inline-flex items-center gap-1 rounded-[8px] border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
        {icon} {pill.label}
      </span>
    </div>
  );
}

function SubCheckChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 ${
        ok
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          : "border-amber-400/30 bg-amber-500/10 text-amber-200"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}



/* -------------------------------------------------------------------------- */
/* Identity tab — admin index of all identity_documents                       */
/* -------------------------------------------------------------------------- */

type IdentityStatus = "pending" | "approved" | "rejected";

const IDENTITY_STATUS_LABEL: Record<IdentityStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function AdminIdentityTab({ signUrl }: { signUrl: unknown }) {
  const fetchIdentities = useServerFn(listIdentityChecks);
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
      stripe_vs_id?: string | null;
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

  return (
    <PPanel className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {(["pending", "approved", "rejected"] as IdentityStatus[]).map((s) => (
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




      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="text-[10.5px] uppercase tracking-wide text-white/45">
            <tr>
              <th className="pb-2 pr-3">Person</th>
              <th className="pb-2 pr-3">Name on doc</th>
              <th className="pb-2 pr-3">Stripe status</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Submitted</th>
              <th className="pb-2">Stripe</th>
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
                <td className="py-2 pr-3 text-white/60">{r.stripe_status ?? (r.vendor ?? "—")}</td>
                <td className="py-2 pr-3">
                  <Badge
                    variant="neutral"
                    className={
                      r.status === "approved"
                        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                        : r.status === "rejected"
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
                <td className="py-2 pr-3 text-white/55" title={absoluteDateTime(r.created_at)}>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="py-2">
                  {r.stripe_vs_id ? (
                    <a
                      href={`https://dashboard.stripe.com/identity/verification-sessions/${r.stripe_vs_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-reps-orange hover:underline"
                    >
                      Open ↗
                    </a>
                  ) : (
                    <span className="text-[11px] text-white/40">—</span>
                  )}
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


/* -------------------------------------------------------------------------- */
/* Admin · Insurance review tab                                               */
/* -------------------------------------------------------------------------- */

type InsuranceStatusFilter = "pending" | "active" | "rejected" | "expired";
const INSURANCE_LABEL: Record<InsuranceStatusFilter, string> = {
  pending: "Pending",
  active: "Active",
  rejected: "Rejected",
  expired: "Expired",
};

type InsuranceRow = {
  id: string;
  professional_id: string;
  provider: string | null;
  policy_number: string | null;
  cover_amount_gbp: number | null;
  start_date: string | null;
  expiry_date: string;
  doc_path: string;
  status: string;
  insured_name: string | null;
  name_match: boolean | null;
  ai_checked_at: string | null;
  ai_extraction: Record<string, unknown> | null;
  trust_signals: Record<string, unknown> | null;
  admin_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  professional: { full_name: string | null} | null;
};

function AdminInsuranceTab() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listInsurancePolicies);
  const decide = useServerFn(reviewInsurance);
  const recheck = useServerFn(recheckInsuranceAi);
  const signUrl = useServerFn(getDocSignedUrl);

  const [status, setStatus] = useState<InsuranceStatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<{ id: string; decision: "approved" | "rejected" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-insurance", status],
    queryFn: () => fetchList({ data: { statuses: [status] } }),
    refetchInterval: status === "pending" ? 30_000 : false,
  });

  const rows = useMemo(() => {
    const list = (query.data ?? []) as InsuranceRow[];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        (r.professional?.full_name ?? r.professional?.full_name ?? "").toLowerCase().includes(q) ||
        (r.provider ?? "").toLowerCase().includes(q) ||
        (r.insured_name ?? "").toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const openDoc = async (path: string) => {
    try {
      const { url } = await signUrl({ data: { bucket: "insurance-docs", path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open document");
    }
  };

  const doRecheck = async (id: string) => {
    setBusy(id);
    try {
      await recheck({ data: { id } });
      qc.invalidateQueries({ queryKey: ["admin-insurance"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Re-check failed");
    } finally {
      setBusy(null);
    }
  };

  const submitDecision = async () => {
    if (!target) return;
    if (target.decision === "rejected" && note.trim().length < 4) return;
    setBusy(target.id);
    try {
      await decide({ data: { id: target.id, decision: target.decision, admin_note: note.trim() || null } });
      qc.invalidateQueries({ queryKey: ["admin-insurance"] });
      setTarget(null);
      setNote("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <PPanel className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(INSURANCE_LABEL) as InsuranceStatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-[8px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                status === s ? "bg-reps-orange text-white" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {INSURANCE_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search name, insurer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <p className="mt-3 rounded-[8px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
        AI pre-checks every policy on upload. Items below either failed an auto-approval gate
        (name match, insurer allow-list, cover amount, confidence) or the AI was skipped.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="text-[10.5px] uppercase tracking-wide text-white/45">
            <tr>
              <th className="pb-2 pr-3">Professional</th>
              <th className="pb-2 pr-3">Insurer</th>
              <th className="pb-2 pr-3">Cover</th>
              <th className="pb-2 pr-3">Expiry</th>
              <th className="pb-2 pr-3">AI signals</th>
              <th className="pb-2 pr-3">Uploaded</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-reps-border text-white/80">
            {query.isLoading && (
              <tr><td colSpan={7} className="py-6 text-center text-white/55">Loading…</td></tr>
            )}
            {!query.isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-white/55">No {INSURANCE_LABEL[status].toLowerCase()} policies.</td></tr>
            )}
            {rows.map((r) => {
              const ts = (r.trust_signals ?? {}) as Record<string, unknown>;
              const conf = typeof ts.ai_confidence === "number" ? ts.ai_confidence : null;
              const nameScore = typeof ts.name_score === "number" ? ts.name_score : null;
              const aiSkipped = ts.ai === "skipped";
              const cover = r.cover_amount_gbp ? `£${r.cover_amount_gbp.toLocaleString()}` : "—";
              const name = r.professional?.full_name || r.professional?.full_name || "Unnamed";
              return (
                <tr key={r.id}>
                  <td className="py-2 pr-3">
                    <div className="font-semibold text-white">{name}</div>
                    {r.insured_name && (
                      <div className="text-[10.5px] text-white/50">
                        Insured: {r.insured_name}
                        {r.name_match === false && <span className="ml-1 text-amber-300">· name mismatch</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3">{r.provider ?? "—"}</td>
                  <td className="py-2 pr-3">{cover}</td>
                  <td className="py-2 pr-3" title={absoluteDateTime(r.expiry_date)}>{r.expiry_date}</td>
                  <td className="py-2 pr-3 text-[10.5px] text-white/60">
                    {aiSkipped ? (
                      <span className="text-amber-300">AI skipped</span>
                    ) : (
                      <span>
                        {conf != null && <>conf {(conf * 100).toFixed(0)}%</>}
                        {nameScore != null && <> · name {(nameScore * 100).toFixed(0)}%</>}
                        {ts.low_cover === true && <span className="ml-1 text-amber-300">· low cover</span>}
                        {ts.provider_known === false && <span className="ml-1 text-amber-300">· unknown insurer</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-white/55" title={absoluteDateTime(r.created_at)}>
                    {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openDoc(r.doc_path)}>
                        <FileText className="mr-1 size-3.5" /> View
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => doRecheck(r.id)}>
                        {busy === r.id ? <Loader2 className="size-3.5 animate-spin" /> : "Re-check AI"}
                      </Button>
                      {r.status !== "active" && (
                        <Button size="sm" variant="ghost" onClick={() => { setTarget({ id: r.id, decision: "approved" }); setNote(""); }}>
                          Approve
                        </Button>
                      )}
                      {r.status !== "rejected" && (
                        <Button size="sm" variant="ghost" onClick={() => { setTarget({ id: r.id, decision: "rejected" }); setNote(""); }}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setTarget(null); setNote(""); } }}>
        <DialogContent className="border-reps-border bg-reps-ink text-white">
          <DialogHeader>
            <DialogTitle>
              {target?.decision === "approved" ? "Approve insurance policy" : "Reject insurance policy"}
            </DialogTitle>
            <DialogDescription className="text-white/65">
              {target?.decision === "approved"
                ? "Marks the policy as active. The professional will be notified and verification will be recomputed."
                : "Sends a rejection notice. Provide a clear reason — the trainer will see this."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={target?.decision === "approved" ? "Optional note (audit log)" : "Reason (required, min 4 chars)"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy !== null || (target?.decision === "rejected" && note.trim().length < 4)}
              onClick={submitDecision}
              className="bg-reps-orange text-white hover:bg-reps-orange-hover"
            >
              {busy !== null ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PPanel>
  );
}

function ProvidersAudience() {
  const [sub, setSub] = useState<"change_requests" | "qualifications">("change_requests");
  return (
    <div>
      <div className="mb-4 inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
        {(["change_requests", "qualifications"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition ${
              sub === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t === "change_requests" ? "Profile changes" : "Qualifications & courses"}
          </button>
        ))}
      </div>
      {sub === "change_requests" ? <AdminProviderQueueTab /> : <AdminProviderQualificationsTab />}
    </div>
  );
}

