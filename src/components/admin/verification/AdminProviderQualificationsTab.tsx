/**
 * Admin queue for provider regulated qualifications & CPD accreditation.
 *
 * A separate component from AdminProviderQueueTab (which handles name/domain
 * change requests). This one has two sub-tabs: Regulated | CPD.
 */

import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock, ExternalLink, FileText, Loader2, Sparkles, XCircle } from "lucide-react";

import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import { awardingBodyName, awardingBodyLogo } from "@/lib/cpd/awarding-bodies";
import {
  adminDecideCpd,
  adminDecideRegulated,
  adminListCpdQueue,
  adminListRegulatedQueue,
  getQualificationDocSignedUrl,
} from "@/lib/qualifications/qualifications.functions";

type Status = "submitted" | "approved" | "rejected" | "changes_requested";

const STATUS_TABS: readonly Status[] = ["submitted", "changes_requested", "approved", "rejected"];
const STATUS_LABEL: Record<Status, string> = {
  submitted: "Pending",
  changes_requested: "Changes",
  approved: "Approved",
  rejected: "Rejected",
};

export function AdminProviderQualificationsTab() {
  const [tab, setTab] = React.useState<"regulated" | "cpd">("regulated");
  const [status, setStatus] = React.useState<Status>("submitted");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
          {(["regulated", "cpd"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition ${
                tab === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t === "regulated" ? "Regulated qualifications" : "CPD accreditation"}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-[8px] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                status === s ? "bg-reps-orange text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {tab === "regulated" ? <RegulatedList status={status} /> : <CpdList status={status} />}
    </div>
  );
}

/* ─── Regulated ─────────────────────────────────────────────────────────── */

type RegRow = {
  id: string;
  provider_id: string;
  qualification_id: string;
  evidence_type: "eqa_report" | "centre_certificate" | "approval_letter";
  evidence_doc_paths: string[];
  awarding_body_reference: string | null;
  ai_extraction: Record<string, unknown> | null;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  status: Status;
  admin_note: string | null;
  created_at: string;
  qualification: {
    id: string;
    title: string;
    level: number | null;
    awarding_body_slug: string;
    ofqual_ref: string | null;
  } | null;
  provider: {
    id: string;
    slug: string | null;
    legal_entity_name: string | null;
    identity_verified_name: string | null;
    contact_email: string | null;
  } | null;
};

function RegulatedList({ status }: { status: Status }) {
  const fetchList = useServerFn(adminListRegulatedQueue);
  const q = useQuery({
    queryKey: ["admin-regulated-queue", status],
    queryFn: () => fetchList({ data: { status } }),
    refetchInterval: status === "submitted" ? 30_000 : false,
  });
  if (q.isLoading) return <SpinnerRow />;
  const rows = (q.data ?? []) as unknown as RegRow[];
  if (rows.length === 0) return <EmptyRow status={status} />;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <RegulatedCard key={r.id} row={r} />
      ))}
    </ul>
  );
}

function RegulatedCard({ row }: { row: RegRow }) {
  const qc = useQueryClient();
  const decide = useServerFn(adminDecideRegulated);
  const signUrl = useServerFn(getQualificationDocSignedUrl);
  const [note, setNote] = React.useState("");

  const mut = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "changes_requested") =>
      decide({ data: { id: row.id, decision, admin_note: note.trim() || null } }),
    onSuccess: () => {
      toast.success("Decision saved");
      qc.invalidateQueries({ queryKey: ["admin-regulated-queue"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Decision failed"),
  });

  const openDoc = async (path: string) => {
    try {
      const { url } = await signUrl({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open");
    }
  };

  const logo = awardingBodyLogo(row.qualification?.awarding_body_slug ?? null);
  const bodyName = awardingBodyName(row.qualification?.awarding_body_slug ?? null);
  const providerName =
    row.provider?.legal_entity_name || row.provider?.identity_verified_name || "Provider";

  return (
    <li>
      <PCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-reps-border bg-white/5">
                {logo ? (
                  <img src={logo} alt={bodyName ?? ""} className="max-h-7 max-w-9 object-contain" />
                ) : (
                  <FileText className="h-4 w-4 text-white/60" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-white">
                  {row.qualification?.title ?? "Qualification removed"}
                </div>
                <div className="text-[12px] text-white/55">
                  {providerName} · {bodyName ?? row.qualification?.awarding_body_slug}
                  {row.qualification?.level != null ? ` · L${row.qualification.level}` : ""}
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-white/60">
              <Badge className="border-white/15 bg-white/5">
                {row.evidence_type.replace("_", " ")}
              </Badge>
              {row.awarding_body_reference ? <span>Ref {row.awarding_body_reference}</span> : null}
              <AiVerdictChip verdict={row.ai_verdict} flags={row.ai_red_flags} />
            </div>
            {row.evidence_doc_paths.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {row.evidence_doc_paths.map((p, i) => (
                  <button
                    key={p}
                    onClick={() => openDoc(p)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-reps-border bg-white/5 px-2 py-1 text-[11.5px] text-white/80 hover:bg-white/10"
                  >
                    <FileText className="h-3 w-3" /> Document {i + 1}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </button>
                ))}
              </div>
            ) : null}
            {row.ai_red_flags.length > 0 ? (
              <div className="mt-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-2 text-[11.5px] text-red-200">
                <span className="font-semibold">AI flags:</span> {row.ai_red_flags.join(" · ")}
              </div>
            ) : null}
          </div>
        </div>

        {row.status === "submitted" || row.status === "changes_requested" ? (
          <div className="mt-3 space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (required for reject / changes)…"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => mut.mutate("approved")}
                disabled={mut.isPending}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <CheckCircle2 data-icon /> Approve
              </Button>
              <Button
                onClick={() => note.trim() ? mut.mutate("changes_requested") : toast.error("Note required")}
                disabled={mut.isPending}
                variant="ghost"
              >
                <Clock data-icon /> Request changes
              </Button>
              <Button
                onClick={() => note.trim() ? mut.mutate("rejected") : toast.error("Note required")}
                disabled={mut.isPending}
                variant="ghost"
                className="text-red-300 hover:bg-red-500/10"
              >
                <XCircle data-icon /> Reject
              </Button>
            </div>
          </div>
        ) : null}
      </PCard>
    </li>
  );
}

/* ─── CPD ───────────────────────────────────────────────────────────────── */

type CpdRow = {
  id: string;
  provider_id: string;
  title: string;
  level: number | null;
  hours: number | null;
  delivery_mode: "in_person" | "online" | "blended" | null;
  summary: string | null;
  syllabus_doc_path: string | null;
  assessment_criteria_doc_path: string | null;
  tutor_cv_doc_path: string | null;
  ai_extraction: Record<string, unknown> | null;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  status: Status;
  reps_cpd_number: string | null;
  accredited_at: string | null;
  admin_note: string | null;
  created_at: string;
  provider: {
    id: string;
    slug: string | null;
    legal_entity_name: string | null;
    identity_verified_name: string | null;
    contact_email: string | null;
  } | null;
};

function CpdList({ status }: { status: Status }) {
  const fetchList = useServerFn(adminListCpdQueue);
  const q = useQuery({
    queryKey: ["admin-cpd-queue", status],
    queryFn: () => fetchList({ data: { status } }),
    refetchInterval: status === "submitted" ? 30_000 : false,
  });
  if (q.isLoading) return <SpinnerRow />;
  const rows = (q.data ?? []) as unknown as CpdRow[];
  if (rows.length === 0) return <EmptyRow status={status} />;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <CpdCard key={r.id} row={r} />
      ))}
    </ul>
  );
}

function CpdCard({ row }: { row: CpdRow }) {
  const qc = useQueryClient();
  const decide = useServerFn(adminDecideCpd);
  const signUrl = useServerFn(getQualificationDocSignedUrl);
  const [note, setNote] = React.useState("");

  const mut = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "changes_requested") =>
      decide({ data: { id: row.id, decision, admin_note: note.trim() || null } }),
    onSuccess: () => {
      toast.success("Decision saved");
      qc.invalidateQueries({ queryKey: ["admin-cpd-queue"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Decision failed"),
  });

  const openDoc = async (path: string | null, kind: string) => {
    if (!path) return;
    try {
      const { url } = await signUrl({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(`${kind}: ${e instanceof Error ? e.message : "Could not open"}`);
    }
  };

  const providerName =
    row.provider?.legal_entity_name || row.provider?.identity_verified_name || "Provider";

  return (
    <li>
      <PCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-white">{row.title}</div>
                <div className="text-[12px] text-white/55">
                  {providerName}
                  {row.level != null ? ` · L${row.level}` : ""}
                  {row.hours != null ? ` · ${row.hours}h` : ""}
                  {row.delivery_mode ? ` · ${row.delivery_mode.replace("_", " ")}` : ""}
                  {row.reps_cpd_number ? ` · ${row.reps_cpd_number}` : ""}
                </div>
              </div>
            </div>
            {row.summary ? (
              <p className="mt-2 text-[12.5px] text-white/70">{row.summary}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AiVerdictChip verdict={row.ai_verdict} flags={row.ai_red_flags} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <DocPill label="Syllabus" onClick={() => openDoc(row.syllabus_doc_path, "Syllabus")} />
              <DocPill
                label="Assessment criteria"
                onClick={() => openDoc(row.assessment_criteria_doc_path, "Assessment")}
              />
              <DocPill label="Tutor CV" onClick={() => openDoc(row.tutor_cv_doc_path, "Tutor CV")} />
            </div>
            {row.ai_red_flags.length > 0 ? (
              <div className="mt-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-2 text-[11.5px] text-red-200">
                <span className="font-semibold">AI flags:</span> {row.ai_red_flags.join(" · ")}
              </div>
            ) : null}
          </div>
        </div>

        {row.status === "submitted" || row.status === "changes_requested" ? (
          <div className="mt-3 space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (required for reject / changes)…"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => mut.mutate("approved")}
                disabled={mut.isPending}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <CheckCircle2 data-icon /> Approve & assign CPD number
              </Button>
              <Button
                onClick={() => note.trim() ? mut.mutate("changes_requested") : toast.error("Note required")}
                disabled={mut.isPending}
                variant="ghost"
              >
                <Clock data-icon /> Request changes
              </Button>
              <Button
                onClick={() => note.trim() ? mut.mutate("rejected") : toast.error("Note required")}
                disabled={mut.isPending}
                variant="ghost"
                className="text-red-300 hover:bg-red-500/10"
              >
                <XCircle data-icon /> Reject
              </Button>
            </div>
          </div>
        ) : null}
      </PCard>
    </li>
  );
}

function DocPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[8px] border border-reps-border bg-white/5 px-2 py-1 text-[11.5px] text-white/80 hover:bg-white/10"
    >
      <FileText className="h-3 w-3" /> {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </button>
  );
}

function AiVerdictChip({
  verdict,
  flags,
}: {
  verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  flags: string[];
}) {
  if (!verdict) return null;
  if (verdict === "recommend_approve")
    return (
      <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
        AI: recommend approve
      </Badge>
    );
  if (verdict === "flagged" || flags.length > 0)
    return (
      <Badge className="border-red-500/30 bg-red-500/15 text-red-300">AI: flagged</Badge>
    );
  return (
    <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">AI: inconclusive</Badge>
  );
}

function SpinnerRow() {
  return (
    <div className="py-10 text-center text-[13px] text-white/55">
      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading…
    </div>
  );
}

function EmptyRow({ status }: { status: Status }) {
  return (
    <PPanel className="p-10 text-center">
      <div className="text-[13px] text-white/55">No {STATUS_LABEL[status].toLowerCase()} submissions.</div>
    </PPanel>
  );
}
