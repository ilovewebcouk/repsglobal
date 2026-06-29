// Admin Dispute Workbench — /admin/billing/disputes/$disputeId
// Gather context → AI-draft text evidence → save or one-click submit to Stripe.
// "Accept dispute" closes it in Stripe (concedes the chargeback).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Sparkles, Save, Send, ShieldOff, Loader2 } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  getDisputeWorkbench,
  saveDisputeEvidence,
  submitDisputeEvidence,
  acceptDispute,
  aiDraftDisputeEvidence,
  type DisputeWorkbench,
  type DisputeEvidenceText,
} from "@/lib/admin/billing-console/dispute-workbench.functions";

export const Route = createFileRoute("/admin_/billing/disputes/$disputeId")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Dispute workbench — REPS Admin" }] }),
  component: DisputeWorkbenchPage,
});

const FIELD_GROUPS: Array<{
  title: string;
  fields: Array<{ key: keyof DisputeEvidenceText; label: string; hint?: string; rows?: number }>;
}> = [
  {
    title: "Customer & product",
    fields: [
      { key: "customer_name", label: "Customer name", rows: 1 },
      { key: "customer_email_address", label: "Customer email", rows: 1 },
      { key: "product_description", label: "Product description", rows: 3 },
    ],
  },
  {
    title: "Rebuttal & disclosure",
    fields: [
      { key: "cancellation_policy_disclosure", label: "Cancellation policy disclosure", rows: 3 },
      { key: "cancellation_rebuttal", label: "Cancellation rebuttal", rows: 4 },
      { key: "refund_policy_disclosure", label: "Refund policy disclosure", rows: 3 },
      { key: "refund_refusal_explanation", label: "Refund refusal explanation", rows: 3 },
      { key: "duplicate_charge_explanation", label: "Duplicate charge explanation", rows: 3 },
    ],
  },
  {
    title: "Free-form",
    fields: [
      { key: "uncategorized_text", label: "Uncategorized text (narrative)", rows: 6 },
    ],
  },
];

function formatGbp(pence: number | null, currency = "gbp") {
  if (pence == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(pence / 100);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "won"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "lost"
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : status.includes("warning")
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : status === "under_review"
      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
      : status === "needs_response"
      ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
      : "bg-white/10 text-white/70 border-white/15";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function DisputeWorkbenchPage() {
  const { disputeId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getDisputeWorkbench);
  const saveFn = useServerFn(saveDisputeEvidence);
  const submitFn = useServerFn(submitDisputeEvidence);
  const acceptFn = useServerFn(acceptDispute);
  const draftFn = useServerFn(aiDraftDisputeEvidence);

  const query = useQuery<DisputeWorkbench>({
    queryKey: ["admin", "disputes", "workbench", disputeId],
    queryFn: () => getFn({ data: { disputeId } }),
    staleTime: 30_000,
  });

  const [evidence, setEvidence] = useState<DisputeEvidenceText>({});
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (query.data?.evidence) setEvidence(query.data.evidence);
  }, [query.data?.evidence]);

  const wb = query.data;

  function setField(k: keyof DisputeEvidenceText, v: string) {
    setEvidence((cur) => ({ ...cur, [k]: v }));
  }

  async function onDraft() {
    setDrafting(true);
    try {
      const result = await draftFn({ data: { disputeId } });
      setEvidence((cur) => ({ ...cur, ...result }));
      toast.success("AI draft populated — review every field before submitting.");
    } catch (e: any) {
      toast.error(e?.message ?? "AI draft failed");
    } finally {
      setDrafting(false);
    }
  }

  async function onSave() {
    setSaving(true);
    try {
      await saveFn({ data: { disputeId, evidence } });
      toast.success("Evidence saved to Stripe (not yet submitted)");
      qc.invalidateQueries({ queryKey: ["admin", "disputes", "workbench", disputeId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit() {
    setSubmitting(true);
    try {
      await submitFn({ data: { disputeId, evidence } });
      toast.success("Evidence submitted to Stripe. The bank will review.");
      qc.invalidateQueries({ queryKey: ["admin", "disputes", "workbench", disputeId] });
      qc.invalidateQueries({ queryKey: ["admin", "billing", "disputes"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onAccept() {
    setAccepting(true);
    try {
      await acceptFn({ data: { disputeId } });
      toast.success("Dispute accepted — funds conceded to the cardholder.");
      qc.invalidateQueries({ queryKey: ["admin", "disputes", "workbench", disputeId] });
      qc.invalidateQueries({ queryKey: ["admin", "billing", "disputes"] });
      setAcceptOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Accept failed");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <DashboardShell currentPath="/admin/billing">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <button
              onClick={() => navigate({ to: "/admin/billing", search: { tab: "disputes" } })}
              className="inline-flex items-center gap-1 text-[12px] text-white/55 hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Back to disputes
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Dispute response workbench</h1>
            <p className="text-[13px] text-white/55">
              Stripe is the source of truth. Saves write directly to the dispute object; submit is one-click.
            </p>
          </div>
          {wb?.stripeDisputeId && (
            <a
              href={`https://dashboard.stripe.com/disputes/${wb.stripeDisputeId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-reps-border bg-panel/40 px-3 py-1.5 text-[12px] text-white/75 hover:text-reps-orange"
            >
              Open in Stripe <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {query.isLoading || !wb ? (
          <Skeleton className="h-64 w-full bg-white/5" />
        ) : (
          <>
            {/* Snapshot */}
            <div className="grid gap-3 md:grid-cols-4">
              <SnapshotCard label="Status">
                <div className="flex flex-col gap-1">
                  <StatusPill status={wb.status} />
                  <span className="text-[11px] text-white/45">stage: {wb.lifecycleStage}</span>
                </div>
              </SnapshotCard>
              <SnapshotCard label="Amount disputed">
                <div className="text-lg font-semibold text-white tabular-nums">{formatGbp(wb.amountPence, wb.currency)}</div>
                <div className="text-[11px] text-white/45">reason: {wb.reason ?? "—"}</div>
              </SnapshotCard>
              <SnapshotCard label="Evidence due">
                <div className="text-sm text-white">{formatDate(wb.evidenceDueBy)}</div>
                <div className="text-[11px] text-white/45">opened {formatDate(wb.openedAt)}</div>
              </SnapshotCard>
              <SnapshotCard label="Member">
                {wb.member.userId ? (
                  <Link
                    to="/admin/members/$userId"
                    params={{ userId: wb.member.userId }}
                    className="text-sm text-reps-orange hover:underline"
                  >
                    {wb.member.fullName ?? wb.member.email ?? "Member 360"}
                  </Link>
                ) : (
                  <div className="text-sm text-white">{wb.member.fullName ?? wb.member.email ?? "Unknown"}</div>
                )}
                <div className="text-[11px] text-white/45">
                  {wb.member.tier ?? "no plan"} · {wb.member.subscriptionStatus ?? "no sub"}
                </div>
              </SnapshotCard>
            </div>

            {/* Context: recent charges */}
            {wb.recentCharges.length > 0 && (
              <div className="rounded-lg border border-reps-border bg-panel/30">
                <div className="border-b border-reps-border px-4 py-2 text-[12px] uppercase tracking-wider text-white/55">
                  Customer charge history ({wb.recentCharges.length})
                </div>
                <table className="w-full text-[12px]">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-white/45">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wb.recentCharges.map((c) => (
                      <tr key={c.id} className="border-t border-reps-border/60">
                        <td className="px-4 py-2 text-white/75">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-2 tabular-nums text-white">{formatGbp(c.amountPence, wb.currency)}</td>
                        <td className="px-4 py-2 text-white/70">{c.status}</td>
                        <td className="px-4 py-2 text-white/55">{c.description ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action bar */}
            <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-reps-border bg-panel/70 px-3 py-2 backdrop-blur">
              <Button
                onClick={onDraft}
                disabled={drafting}
                variant="secondary"
                className="gap-2 bg-white/5 text-white hover:bg-white/10"
              >
                {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI draft evidence
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || !wb.isSubmittable}
                variant="secondary"
                className="gap-2 bg-white/5 text-white hover:bg-white/10"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save draft to Stripe
              </Button>
              <Button
                onClick={onSubmit}
                disabled={submitting || !wb.isSubmittable}
                className="gap-2 bg-reps-orange text-white hover:bg-reps-orange/90"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit to Stripe
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                onClick={() => setAcceptOpen(true)}
                className="gap-2 text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <ShieldOff className="h-4 w-4" /> Accept dispute (concede)
              </Button>
            </div>

            {!wb.isSubmittable && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
                Stripe status is <code className="font-mono">{wb.status}</code> — evidence cannot be saved or submitted in this state.
                The workbench is read-only until the dispute returns to <code className="font-mono">needs_response</code>.
              </div>
            )}

            {/* Evidence form */}
            <div className="space-y-5">
              {FIELD_GROUPS.map((group) => (
                <div key={group.title} className="rounded-lg border border-reps-border bg-panel/30 p-4">
                  <div className="mb-3 text-[12px] uppercase tracking-wider text-white/55">{group.title}</div>
                  <div className="space-y-3">
                    {group.fields.map((f) => (
                      <div key={f.key} className="space-y-1">
                        <Label htmlFor={f.key} className="text-[12px] text-white/75">
                          {f.label}
                        </Label>
                        {f.rows && f.rows > 1 ? (
                          <Textarea
                            id={f.key}
                            rows={f.rows}
                            value={(evidence[f.key] as string | undefined) ?? ""}
                            onChange={(e) => setField(f.key, e.target.value)}
                            disabled={!wb.isSubmittable}
                            className="border-reps-border bg-black/30 text-white"
                          />
                        ) : (
                          <Input
                            id={f.key}
                            value={(evidence[f.key] as string | undefined) ?? ""}
                            onChange={(e) => setField(f.key, e.target.value)}
                            disabled={!wb.isSubmittable}
                            className="border-reps-border bg-black/30 text-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-white/40">
              File evidence (receipts, screenshots, customer signatures) is not yet supported here — upload those directly via the
              Stripe dashboard until the file-upload flow is wired.
            </p>
          </>
        )}
      </div>

      <AlertDialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <AlertDialogContent className="border-reps-border bg-panel text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this dispute?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This concedes the chargeback in Stripe. The cardholder keeps the funds and we forfeit the £15 dispute fee. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-reps-border bg-transparent text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onAccept}
              disabled={accepting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, accept dispute"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

function SnapshotCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-reps-border bg-panel/30 p-3">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      {children}
    </div>
  );
}
