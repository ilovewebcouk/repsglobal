/**
 * Admin queue for provider regulated qualifications & REPS-endorsed courses.
 *
 * Master-detail layout mirroring AdminProviderQueueTab (name / domain
 * queue): a left-hand list groups submissions by provider (and by
 * submission batch for regulated), a right-hand pane shows the full
 * evidence panel plus Approve / Request changes / Reject controls.
 *
 * Evidence documents open in a right-side Sheet drawer via
 * QualificationDocDrawer — never a new browser tab.
 */

import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import { PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import {
  DashboardEmpty as Empty,
  DashboardEmptyTitle as EmptyTitle,
  DashboardEmptyDescription as EmptyDescription,
  DashboardEmptyIcon as EmptyIcon,
} from "@/components/dashboard/ui/empty";
import { TimeAgo } from "@/components/verification/TimeAgo";
import { absoluteDateTime } from "@/lib/verification/format-time";
import { awardingBodyName, awardingBodyLogo, awardingBodyLogoByName } from "@/lib/cpd/awarding-bodies";
import {
  adminDecideRepsCourse,
  adminDecideRegulated,
  adminListRepsCourseQueue,
  adminListRegulatedQueue,
  adminSaveRepsCourseSpec,
  adminRedraftRepsCourse,
} from "@/lib/qualifications/qualifications.functions";

import {
  QualificationDocDrawer,
  type QualificationDoc,
} from "./QualificationDocDrawer";

type Status = "submitted" | "approved" | "rejected" | "changes_requested" | "withdrawn";
type CourseStatus = Status | "ai_drafted";

const STATUS_TABS: readonly Status[] = ["submitted", "approved", "rejected", "withdrawn"];
const REGULATED_STATUS_TABS: readonly Status[] = STATUS_TABS;
const COURSE_STATUS_TABS: readonly CourseStatus[] = ["submitted", "approved", "rejected", "withdrawn"];
const STATUS_LABEL: Record<CourseStatus, string> = {
  submitted: "New",
  ai_drafted: "In review",
  changes_requested: "Changes",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function AdminProviderQualificationsTab() {
  const [tab, setTab] = React.useState<"regulated" | "courses">("regulated");
  const [status, setStatus] = React.useState<CourseStatus>("submitted");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
          {(["regulated", "courses"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
              }}
              className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition ${
                tab === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t === "regulated" ? "Regulated qualifications" : "REPS-endorsed courses"}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
          {(tab === "regulated" ? REGULATED_STATUS_TABS : COURSE_STATUS_TABS).map((s) => (
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

      {tab === "regulated" ? (
        <RegulatedQueue status={status === "ai_drafted" ? "submitted" : status} />
      ) : (
        <CpdQueue status={status} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REGULATED
   ═══════════════════════════════════════════════════════════════════════════ */

type OfqualSnapshot = {
  qualificationNumber: string;
  title: string | null;
  awardingOrganisation: string | null;
  level: string | null;
  status: string | null;
} | null;

type AiExtraction = {
  document_type?: string | null;
  awarding_body_detected?: string | null;
  centre_name_detected?: string | null;
  centre_number_detected?: string | null;
  approval_status?: string | null;
  qualifications_listed?: Array<{ title?: string | null; ofqual_ref_if_visible?: string | null }> | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  eqa_name?: string | null;
  signatory_name?: string | null;
  signatory_role?: string | null;
  confidence?: number | null;
  red_flags?: string[] | null;
} | null;

type AiCrossCheck = {
  ofqual_found: boolean;
  awarding_body_match: boolean;
  qualification_in_doc: "yes" | "no" | "inconclusive";
} | null;

type RegRow = {
  id: string;
  provider_id: string;
  ofqual_number: string | null;
  ofqual_snapshot: OfqualSnapshot;
  ofqual_found: boolean;
  reps_qualification_number: string | null;
  submission_group_id: string | null;
  qualification_id: string | null;
  evidence_type: "eqa_report" | "centre_certificate" | "approval_letter";
  evidence_doc_paths: string[];
  awarding_body_reference: string | null;
  ai_extraction: AiExtraction;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  ai_cross_check: AiCrossCheck;
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

type RegGroup = {
  key: string;
  provider: RegRow["provider"];
  rows: RegRow[];
  created_at: string;
};

function groupRegulated(rows: RegRow[]): RegGroup[] {
  const map = new Map<string, RegGroup>();
  for (const r of rows) {
    const key = r.submission_group_id ?? `single:${r.id}`;
    const existing = map.get(key);
    if (existing) {
      existing.rows.push(r);
      if (r.created_at < existing.created_at) existing.created_at = r.created_at;
    } else {
      map.set(key, {
        key,
        provider: r.provider,
        rows: [r],
        created_at: r.created_at,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

function RegulatedQueue({ status }: { status: Status }) {
  const qc = useQueryClient();
  const fetchList = useServerFn(adminListRegulatedQueue);
  const listQ = useQuery({
    queryKey: ["admin-regulated-queue", status],
    queryFn: () => fetchList({ data: { status } }),
    refetchInterval: status === "submitted" ? 30_000 : false,
  });

  const rows = (listQ.data ?? []) as unknown as RegRow[];
  const groups = React.useMemo(() => groupRegulated(rows), [rows]);

  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const selected = React.useMemo(
    () => groups.find((g) => g.key === selectedKey) ?? groups[0] ?? null,
    [groups, selectedKey],
  );

  // Keep selection on the same key when the list refetches, otherwise reset.
  React.useEffect(() => {
    if (selectedKey && !groups.some((g) => g.key === selectedKey)) {
      setSelectedKey(null);
    }
  }, [groups, selectedKey]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      {/* LIST */}
      <PPanel className="flex flex-col">
        <div className="border-b border-reps-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-white">
              {STATUS_LABEL[status]} regulated qualifications
            </h3>
            <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-300">
              {groups.length}
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            Each entry is one provider submission — a batch can cover several Ofqual numbers.
          </p>
        </div>
        <ul className="flex-1 divide-y divide-reps-border overflow-y-auto">
          {listQ.isLoading && (
            <li className="p-6 text-center text-[12px] text-white/55">Loading…</li>
          )}
          {!listQ.isLoading && groups.length === 0 && (
            <li className="p-6 text-center text-[12px] text-white/55">
              No {STATUS_LABEL[status].toLowerCase()} regulated submissions.
            </li>
          )}
          {groups.map((g) => (
            <RegulatedListItem
              key={g.key}
              group={g}
              selected={selected?.key === g.key}
              onSelect={() => setSelectedKey(g.key)}
            />
          ))}
        </ul>
      </PPanel>

      {/* DETAIL */}
      <div className="space-y-4">
        {!selected ? (
          <PPanel className="p-10">
            <Empty>
              <EmptyIcon>
                <ShieldCheck />
              </EmptyIcon>
              <EmptyTitle>Select a submission to review</EmptyTitle>
              <EmptyDescription>
                Approve to grant the provider permission to display the qualification, or reject
                with a note.
              </EmptyDescription>
            </Empty>
          </PPanel>
        ) : (
          <RegulatedDetail
            group={selected}
            onDecided={() => {
              qc.invalidateQueries({ queryKey: ["admin-regulated-queue"] });
            }}
          />
        )}
      </div>
    </div>
  );
}

function RegulatedListItem({
  group,
  selected,
  onSelect,
}: {
  group: RegGroup;
  selected: boolean;
  onSelect: () => void;
}) {
  const providerName =
    group.provider?.legal_entity_name || group.provider?.identity_verified_name || "Unnamed provider";
  const first = group.rows[0];
  const firstTitle = first.ofqual_snapshot?.title ?? first.qualification?.title ?? "Awaiting Ofqual match";
  const bodyLabel =
    first.ofqual_snapshot?.awardingOrganisation ??
    (first.qualification ? awardingBodyName(first.qualification.awarding_body_slug) : null);

  return (
    <li>
      <button
        onClick={onSelect}
        className={`block w-full px-3 py-3 text-left transition ${
          selected ? "bg-reps-orange-soft" : "hover:bg-white/[0.03]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-white">
            {providerName}
          </span>
          {group.rows.length > 1 ? (
            <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-white/80">
              {group.rows.length} quals
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-white/70">
          {firstTitle}
          {group.rows.length > 1 ? (
            <span className="text-white/45"> · +{group.rows.length - 1} more</span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-white/55">
          {bodyLabel ? `${bodyLabel} · ` : ""}
          {first.ofqual_number ?? "—"}
        </div>
        <div className="mt-1 text-[10px] text-white/45">
          <TimeAgo iso={group.created_at} className="text-white/45" />
          {group.provider?.contact_email ? ` · ${group.provider.contact_email}` : null}
        </div>
      </button>
    </li>
  );
}

function RegulatedDetail({
  group,
  onDecided,
}: {
  group: RegGroup;
  onDecided: () => void;
}) {
  const [activeRowIdx, setActiveRowIdx] = React.useState(0);
  React.useEffect(() => {
    setActiveRowIdx(0);
  }, [group.key]);
  const row = group.rows[Math.min(activeRowIdx, group.rows.length - 1)];

  const providerName =
    group.provider?.legal_entity_name || group.provider?.identity_verified_name || "Unnamed provider";

  const decide = useServerFn(adminDecideRegulated);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    setNote("");
  }, [row.id]);

  const decideMut = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "changes_requested") =>
      decide({ data: { id: row.id, decision, admin_note: note.trim() || null } }),
    onSuccess: () => {
      toast.success("Decision saved");
      setNote("");
      onDecided();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Decision failed"),
  });

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const docs: QualificationDoc[] = row.evidence_doc_paths.map((p, i) => ({
    path: p,
    label: `Document ${i + 1}`,
  }));

  const snap = row.ofqual_snapshot;
  const ai = row.ai_extraction;
  const cx = row.ai_cross_check;
  const legacySlug = row.qualification?.awarding_body_slug ?? null;
  const logo =
    (legacySlug ? awardingBodyLogo(legacySlug) : null) ??
    awardingBodyLogoByName(snap?.awardingOrganisation ?? null);
  const bodyLabel =
    snap?.awardingOrganisation ?? (legacySlug ? awardingBodyName(legacySlug) ?? legacySlug : null);
  const title = snap?.title ?? row.qualification?.title ?? "Awaiting Ofqual match";
  const level = snap?.level ?? (row.qualification?.level != null ? `L${row.qualification.level}` : null);
  const ofqualHref = row.ofqual_number
    ? `https://find-a-qualification.services.ofqual.gov.uk/qualifications/${row.ofqual_number.replace(/\//g, "")}`
    : null;

  return (
    <>
      <PPanel>
        {/* Header — provider identity */}
        <div className="border-b border-reps-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-white/60">
            <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-300">
              Regulated qualification
            </span>
            {group.rows.length > 1 ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/80">
                Batch · {group.rows.length} quals
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-[15px] font-semibold text-white">{providerName}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/60">
            {group.provider?.slug ? (
              <a
                href={`/t/${group.provider.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-white"
              >
                /t/{group.provider.slug} <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {group.provider?.contact_email ? (
              <a
                href={`mailto:${group.provider.contact_email}`}
                className="hover:text-white"
              >
                {group.provider.contact_email}
              </a>
            ) : null}
            <span>
              Submitted <TimeAgo iso={row.created_at} className="text-white/70" /> ·{" "}
              <span title={absoluteDateTime(row.created_at)}>
                {absoluteDateTime(row.created_at)}
              </span>
            </span>
          </div>
        </div>

        {/* Batch tabs (when >1) */}
        {group.rows.length > 1 ? (
          <div className="flex flex-wrap gap-1 border-b border-reps-border bg-reps-panel/30 px-3 py-2">
            {group.rows.map((r, i) => {
              const t = r.ofqual_snapshot?.title ?? r.qualification?.title ?? r.ofqual_number ?? `Row ${i + 1}`;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRowIdx(i)}
                  className={`inline-flex max-w-[240px] items-center gap-1.5 truncate rounded-[8px] px-2.5 py-1 text-[11.5px] font-semibold transition ${
                    i === activeRowIdx
                      ? "bg-reps-orange text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                  title={t}
                >
                  <StatusDot status={r.status} />
                  <span className="truncate">
                    {r.ofqual_number ?? "—"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-reps-border bg-white/5">
              {logo ? (
                <img src={logo} alt={bodyLabel ?? ""} className="max-h-7 max-w-9 object-contain" />
              ) : (
                <FileText className="h-4 w-4 text-white/60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-white">{title}</div>
              <div className="text-[12px] text-white/55">
                {bodyLabel ?? "—"}
                {level ? ` · ${level}` : ""}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
                {row.reps_qualification_number ? (
                  <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300 font-mono">
                    {row.reps_qualification_number}
                  </Badge>
                ) : null}
                {row.ofqual_number ? (
                  <Badge className="border-white/15 bg-white/5 font-mono">
                    {row.ofqual_number}
                  </Badge>
                ) : null}
                <Badge className="border-white/15 bg-white/5">
                  {row.evidence_type.replace(/_/g, " ")}
                </Badge>
                <Badge
                  className={
                    row.ofqual_found
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/15 text-amber-300"
                  }
                >
                  {row.ofqual_found ? "Ofqual regulated · found" : "Not on Ofqual register"}
                </Badge>
                {row.awarding_body_reference ? (
                  <span className="text-white/60">Centre {row.awarding_body_reference}</span>
                ) : null}
                <AiVerdictChip verdict={row.ai_verdict} flags={row.ai_red_flags} />
              </div>
            </div>
          </div>

          {/* Cross-check chips */}
          {cx || row.ofqual_number ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <CrossCheckChip
                ok={row.ofqual_found}
                labelOk="Ofqual register: found"
                labelBad="Ofqual register: not found"
              />
              {cx ? (
                <>
                  <CrossCheckChip
                    ok={cx.awarding_body_match}
                    labelOk="Awarding body matches"
                    labelBad="Awarding body mismatch"
                  />
                  <CrossCheckChip
                    ok={cx.qualification_in_doc === "yes"}
                    inconclusive={cx.qualification_in_doc === "inconclusive"}
                    labelOk="Qualification listed in doc"
                    labelBad="Qualification NOT in doc"
                    labelInconclusive="Qualification listing inconclusive"
                  />
                </>
              ) : null}
            </div>
          ) : null}

          {/* Two-column register vs AI */}
          <div className="grid gap-3 md:grid-cols-2">
            <EvidencePanel title="Ofqual register" tone={row.ofqual_found ? "ok" : "warn"}>
              {snap ? (
                <dl className="space-y-1 text-[12px]">
                  <PanelRow k="Title" v={snap.title} />
                  <PanelRow k="Awarding body" v={snap.awardingOrganisation} />
                  <PanelRow k="Level" v={snap.level} />
                  <PanelRow k="Status" v={snap.status} />
                  {ofqualHref ? (
                    <a
                      href={ofqualHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 pt-1 text-[11.5px] text-white/60 hover:text-white"
                    >
                      View on Ofqual <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </dl>
              ) : (
                <div className="text-[12px] text-amber-200/80">
                  This Ofqual number wasn't found on the public register. Verify manually.
                </div>
              )}
            </EvidencePanel>

            <EvidencePanel title="AI-extracted from evidence" tone="neutral">
              {ai ? (
                <dl className="space-y-1 text-[12px]">
                  <PanelRow k="Document type" v={ai.document_type} />
                  <PanelRow k="Approval status" v={ai.approval_status} />
                  <PanelRow k="Centre name" v={ai.centre_name_detected} />
                  <PanelRow k="Centre number" v={ai.centre_number_detected} />
                  <PanelRow k="Awarding body (in doc)" v={ai.awarding_body_detected} />
                  <PanelRow k="Issued" v={ai.issue_date} />
                  <PanelRow k="Expires / next EQA" v={ai.expiry_date} />
                  <PanelRow k="EQA name" v={ai.eqa_name} />
                  {Array.isArray(ai.qualifications_listed) && ai.qualifications_listed.length > 0 ? (
                    <div className="pt-1">
                      <div className="text-white/50">Qualifications listed in doc</div>
                      <ul className="mt-0.5 space-y-0.5">
                        {ai.qualifications_listed.slice(0, 8).map((q, i) => (
                          <li key={i} className="text-white/80">
                            • {q?.title ?? "—"}
                            {q?.ofqual_ref_if_visible ? (
                              <span className="ml-1 font-mono text-white/50">
                                ({q.ofqual_ref_if_visible})
                              </span>
                            ) : null}
                          </li>
                        ))}
                        {ai.qualifications_listed.length > 8 ? (
                          <li className="text-white/40">
                            …and {ai.qualifications_listed.length - 8} more
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <div className="text-[12px] text-white/50">
                  AI extraction pending or unavailable.
                </div>
              )}
            </EvidencePanel>
          </div>

          {/* Docs — open in drawer */}
          {row.evidence_doc_paths.length > 0 ? (
            <div>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
                Evidence documents
                {group.rows.length > 1 ? " · shared across the batch" : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                {row.evidence_doc_paths.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1 text-[11.5px] text-white/80 hover:bg-white/10"
                  >
                    <FileText className="h-3 w-3" /> Document {i + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {row.ai_red_flags.length > 0 ? (
            <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-2 text-[11.5px] text-red-200">
              <span className="font-semibold">AI flags:</span> {row.ai_red_flags.join(" · ")}
            </div>
          ) : null}
        </div>

        {/* Decision */}
        {row.status === "submitted" || row.status === "changes_requested" ? (
          <div className="border-t border-reps-border px-5 py-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Admin note (required for reject or changes)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Centre name in the certificate doesn't match the provider profile."
              rows={2}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => decideMut.mutate("approved")}
                disabled={decideMut.isPending}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <CheckCircle2 data-icon /> Approve
              </Button>
              <Button
                onClick={() =>
                  note.trim() ? decideMut.mutate("changes_requested") : toast.error("Note required")
                }
                disabled={decideMut.isPending}
                variant="ghost"
              >
                <Clock data-icon /> Request changes
              </Button>
              <Button
                onClick={() =>
                  note.trim() ? decideMut.mutate("rejected") : toast.error("Note required")
                }
                disabled={decideMut.isPending}
                variant="ghost"
                className="text-red-300 hover:bg-red-500/10"
              >
                <XCircle data-icon /> Reject
              </Button>
            </div>
          </div>
        ) : row.admin_note ? (
          <div className="border-t border-reps-border px-5 py-4 text-[12px] text-white/70">
            <span className="font-semibold text-white/85">Admin note:</span> {row.admin_note}
          </div>
        ) : null}
      </PPanel>

      <QualificationDocDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        docs={docs}
        title={title}
        subtitle={`${providerName} · ${row.ofqual_number ?? ""}`}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CPD
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   REPS-ACCREDITED COURSES
   ═══════════════════════════════════════════════════════════════════════════ */

type DeliveryMode = "in_person" | "online_live" | "online_self_paced" | "online" | "blended";

type CourseRow = {
  id: string;
  provider_id: string;
  proposed_title: string;
  proposed_who_for: string | null;
  proposed_what_covered: string | null;
  proposed_learner_outcomes: string | null;
  proposed_delivery_mode: "in_person" | "online_live" | "online_self_paced" | "blended" | null;
  proposed_total_hours: number | null;
  proposed_how_assessed: string | null;
  proposed_prerequisites: string | null;
  proposed_tutor_credentials: string | null;
  proposed_extra_notes: string | null;
  ai_draft: Record<string, unknown> | null;
  ai_verdict: "recommend_approve" | "flagged" | "inconclusive" | null;
  ai_red_flags: string[];
  ai_drafted_at: string | null;
  official_title: string | null;
  official_level: number | null;
  official_level_rationale: string | null;
  official_level_confidence: "high" | "medium" | "low" | null;
  reviewer_notes: string | null;
  ai_deterministic_flags: string[] | null;
  reps_qual_number: string | null;
  spec_who_for: string | null;
  spec_learning_outcomes: string[] | null;
  spec_how_youll_study: string | null;
  spec_how_youre_assessed: string | null;
  spec_prerequisites: string | null;
  spec_guided_learning_hours: number | null;
  spec_total_qualification_time: number | null;
  spec_delivery_mode: DeliveryMode | null;
  spec_published_at: string | null;
  status: CourseStatus;
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

function CpdQueue({ status }: { status: CourseStatus }) {
  const qc = useQueryClient();
  const fetchList = useServerFn(adminListRepsCourseQueue);
  const listQ = useQuery({
    queryKey: ["admin-course-queue", status],
    queryFn: () => fetchList({ data: { status } }),
    refetchInterval: status === "submitted" || status === "ai_drafted" ? 15_000 : false,
  });

  const rows = (listQ.data ?? []) as unknown as CourseRow[];
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = React.useMemo(
    () => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  React.useEffect(() => {
    if (selectedId && !rows.some((r) => r.id === selectedId)) setSelectedId(null);
  }, [rows, selectedId]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      <PPanel className="flex flex-col">
        <div className="border-b border-reps-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-white">
              {STATUS_LABEL[status]} courses
            </h3>
            <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-300">
              {rows.length}
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            Provider-submitted courses. AI drafts the spec; you review and publish.
          </p>
        </div>
        <ul className="flex-1 divide-y divide-reps-border overflow-y-auto">
          {listQ.isLoading && (
            <li className="p-6 text-center text-[12px] text-white/55">Loading…</li>
          )}
          {!listQ.isLoading && rows.length === 0 && (
            <li className="p-6 text-center text-[12px] text-white/55">
              No {STATUS_LABEL[status].toLowerCase()} course submissions.
            </li>
          )}
          {rows.map((r) => (
            <CourseListItem
              key={r.id}
              row={r}
              selected={selected?.id === r.id}
              onSelect={() => setSelectedId(r.id)}
            />
          ))}
        </ul>
      </PPanel>

      <div className="space-y-4">
        {!selected ? (
          <PPanel className="p-10">
            <Empty>
              <EmptyIcon>
                <Sparkles />
              </EmptyIcon>
              <EmptyTitle>Select a course submission</EmptyTitle>
              <EmptyDescription>
                Review the AI-drafted spec, edit anything that's wrong, then approve to assign a REPS number.
              </EmptyDescription>
            </Empty>
          </PPanel>
        ) : (
          <CourseDetail
            row={selected}
            onDecided={() => qc.invalidateQueries({ queryKey: ["admin-course-queue"] })}
          />
        )}
      </div>
    </div>
  );
}

function CourseListItem({
  row,
  selected,
  onSelect,
}: {
  row: CourseRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const providerName =
    row.provider?.legal_entity_name || row.provider?.identity_verified_name || "Unnamed provider";
  const title = row.official_title || row.proposed_title;
  return (
    <li>
      <button
        onClick={onSelect}
        className={`block w-full px-3 py-3 text-left transition ${
          selected ? "bg-reps-orange-soft" : "hover:bg-white/[0.03]"
        }`}
      >
        <div className="truncate text-[13px] font-semibold text-white">{providerName}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-white/70">{title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-white/55">
          {row.official_level != null ? <span>L{row.official_level}</span> : null}
          {row.reps_qual_number ? (
            <span className="text-emerald-300">{row.reps_qual_number}</span>
          ) : row.status === "ai_drafted" ? (
            <span className="text-amber-300">AI drafted</span>
          ) : row.status === "submitted" ? (
            <span className="text-white/45">AI drafting…</span>
          ) : null}
        </div>
        <div className="mt-1 text-[10px] text-white/45">
          <TimeAgo iso={row.created_at} className="text-white/45" />
          {row.provider?.contact_email ? ` · ${row.provider.contact_email}` : null}
        </div>
      </button>
    </li>
  );
}

function CourseDetail({ row, onDecided }: { row: CourseRow; onDecided: () => void }) {
  const decide = useServerFn(adminDecideRepsCourse);
  const saveSpec = useServerFn(adminSaveRepsCourseSpec);
  const redraft = useServerFn(adminRedraftRepsCourse);

  // Editable spec state — seeded from row, reset when a different row is selected.
  const [officialTitle, setOfficialTitle] = React.useState(row.official_title ?? row.proposed_title);
  const [officialLevel, setOfficialLevel] = React.useState<number | null>(row.official_level);
  const [whoFor, setWhoFor] = React.useState(row.spec_who_for ?? "");
  const [outcomes, setOutcomes] = React.useState((row.spec_learning_outcomes ?? []).join("\n"));
  const [howStudy, setHowStudy] = React.useState(row.spec_how_youll_study ?? "");
  const [howAssessed, setHowAssessed] = React.useState(row.spec_how_youre_assessed ?? "");
  const [prereq, setPrereq] = React.useState(row.spec_prerequisites ?? "");
  const [glh, setGlh] = React.useState<number | null>(row.spec_guided_learning_hours);
  const [tqt, setTqt] = React.useState<number | null>(row.spec_total_qualification_time);
  const [delivery, setDelivery] = React.useState<DeliveryMode | null>(row.spec_delivery_mode);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setOfficialTitle(row.official_title ?? row.proposed_title);
    setOfficialLevel(row.official_level);
    setWhoFor(row.spec_who_for ?? "");
    setOutcomes((row.spec_learning_outcomes ?? []).join("\n"));
    setHowStudy(row.spec_how_youll_study ?? "");
    setHowAssessed(row.spec_how_youre_assessed ?? "");
    setPrereq(row.spec_prerequisites ?? "");
    setGlh(row.spec_guided_learning_hours);
    setTqt(row.spec_total_qualification_time);
    setDelivery(row.spec_delivery_mode);
    setNote("");
  }, [row.id]);

  const buildSpecPayload = () => ({
    id: row.id,
    official_title: officialTitle.trim() || null,
    official_level: officialLevel,
    spec_who_for: whoFor.trim() || null,
    spec_learning_outcomes:
      outcomes
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean).length > 0
        ? outcomes
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
    spec_how_youll_study: howStudy.trim() || null,
    spec_how_youre_assessed: howAssessed.trim() || null,
    spec_prerequisites: prereq.trim() || null,
    spec_guided_learning_hours: glh,
    spec_total_qualification_time: tqt,
    spec_delivery_mode: delivery,
  });

  const saveMut = useMutation({
    mutationFn: () => saveSpec({ data: buildSpecPayload() }),
    onSuccess: () => toast.success("Draft saved"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const decideMut = useMutation({
    mutationFn: async (decision: "approved" | "rejected" | "changes_requested") => {
      if (decision === "approved") {
        await saveSpec({ data: buildSpecPayload() });
      }
      return decide({ data: { id: row.id, decision, admin_note: note.trim() || null } });
    },
    onSuccess: () => {
      toast.success("Decision saved");
      onDecided();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Decision failed"),
  });

  const redraftMut = useMutation({
    mutationFn: () => redraft({ data: { id: row.id } }),
    onSuccess: () => {
      toast.success("Redrafting with AI…");
      onDecided();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Redraft failed"),
  });

  const providerName =
    row.provider?.legal_entity_name || row.provider?.identity_verified_name || "Unnamed provider";

  const deliveryLabel = (v: string | null): string => {
    if (!v) return "—";
    if (v === "in_person") return "In-person";
    if (v === "online_live") return "Online — live";
    if (v === "online_self_paced") return "Online — self-paced";
    if (v === "blended") return "Blended";
    if (v === "online") return "Online";
    return v;
  };

  const specComplete =
    Boolean(officialTitle.trim()) &&
    officialLevel != null &&
    Boolean(whoFor.trim()) &&
    outcomes.split("\n").map((s) => s.trim()).filter(Boolean).length >= 1 &&
    Boolean(howStudy.trim()) &&
    Boolean(howAssessed.trim()) &&
    glh != null &&
    tqt != null &&
    delivery != null;

  const editable = row.status === "submitted" || row.status === "ai_drafted" || row.status === "changes_requested";

  return (
    <>
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-white/60">
            <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-300">
              REPS-endorsed
            </span>
            {row.reps_qual_number ? (
              <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                {row.reps_qual_number}
              </Badge>
            ) : null}
            <AiVerdictChip verdict={row.ai_verdict} flags={row.ai_red_flags} />
          </div>
          <h3 className="mt-2 text-[15px] font-semibold text-white">{providerName}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/60">
            {row.provider?.slug ? (
              <a
                href={`/t/${row.provider.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-white"
              >
                /t/{row.provider.slug} <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {row.provider?.contact_email ? (
              <a href={`mailto:${row.provider.contact_email}`} className="hover:text-white">
                {row.provider.contact_email}
              </a>
            ) : null}
            <span>
              Submitted <TimeAgo iso={row.created_at} className="text-white/70" />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT — provider's answers + AI signal */}
          <div className="space-y-4 border-b border-reps-border px-5 py-4 lg:border-b-0 lg:border-r">
            <div>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
                Provider's working title
              </div>
              <div className="text-[13.5px] text-white/90">{row.proposed_title}</div>
            </div>

            <div>
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
                Provider's answers
              </div>
              <dl className="space-y-2.5">
                <AnswerBlock label="Who this course is for" value={row.proposed_who_for} />
                <AnswerBlock label="What the course covers" value={row.proposed_what_covered} />
                <AnswerBlock label="Rough learner outcomes" value={row.proposed_learner_outcomes} />
                <div className="grid grid-cols-2 gap-3">
                  <AnswerInline label="Delivery" value={deliveryLabel(row.proposed_delivery_mode)} />
                  <AnswerInline
                    label="Total hours"
                    value={row.proposed_total_hours != null ? `${row.proposed_total_hours}h` : "—"}
                  />
                </div>
                <AnswerBlock label="How learners are assessed" value={row.proposed_how_assessed} />
                <AnswerBlock label="Prerequisites" value={row.proposed_prerequisites} />
                <AnswerBlock label="Tutor name & credentials" value={row.proposed_tutor_credentials} />
                {row.proposed_extra_notes ? (
                  <AnswerBlock label="Extra notes" value={row.proposed_extra_notes} />
                ) : null}
              </dl>
            </div>

            {row.reviewer_notes ? (
              <div className="rounded-[10px] border border-blue-400/25 bg-blue-500/10 p-2.5 text-[11.5px] text-blue-100">
                <div className="mb-1 flex items-center gap-1.5 font-semibold">
                  <Sparkles className="h-3 w-3" /> Reviewer summary (AI)
                </div>
                <p className="text-blue-100/90">{row.reviewer_notes}</p>
              </div>
            ) : null}

            {row.ai_red_flags.length > 0 ? (
              <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-2.5 text-[11.5px] text-red-200">
                <div className="mb-1 font-semibold">AI red flags</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {row.ai_red_flags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {row.ai_deterministic_flags && row.ai_deterministic_flags.length > 0 ? (
              <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11.5px] text-amber-100">
                <div className="mb-1 font-semibold">Deterministic checks</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {row.ai_deterministic_flags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {row.status === "submitted" && !row.ai_drafted_at ? (
              <div className="rounded-[10px] border border-white/10 bg-white/[0.02] p-3 text-[12px] text-white/60">
                <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                AI is drafting the spec from the provider's answers. This usually takes 15–30 seconds.
              </div>
            ) : null}

            {editable ? (
              <Button
                variant="ghost"
                onClick={() => redraftMut.mutate()}
                disabled={redraftMut.isPending}
              >
                <Sparkles data-icon />
                {redraftMut.isPending ? "Redrafting…" : "Redraft with AI"}
              </Button>
            ) : null}
          </div>

          {/* RIGHT — publish spec form */}
          <div className="space-y-3 px-5 py-4">
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
              Official endorsement spec
            </div>

            <SpecField label="Official title">
              <input
                value={officialTitle}
                onChange={(e) => setOfficialTitle(e.target.value)}
                disabled={!editable}
                className="w-full rounded-[10px] border border-reps-border bg-white/5 px-3 py-2 text-[12.5px] text-white placeholder:text-white/35"
              />
            </SpecField>

            {/* Level ladder — AI suggestion highlighted with rationale */}
            <LevelLadderField
              value={officialLevel}
              aiSuggested={row.official_level}
              rationale={row.official_level_rationale}
              confidence={row.official_level_confidence}
              disabled={!editable}
              onChange={setOfficialLevel}
            />

            <SpecField label="Delivery mode">
              <select
                value={delivery ?? ""}
                onChange={(e) => setDelivery((e.target.value || null) as DeliveryMode | null)}
                disabled={!editable}
                className="w-full rounded-[10px] border border-reps-border bg-white/5 px-3 py-2 text-[12.5px] text-white"
              >
                <option value="">—</option>
                <option value="in_person">In person</option>
                <option value="online_live">Online — live</option>
                <option value="online_self_paced">Online — self-paced</option>
                <option value="blended">Blended</option>
                <option value="online">Online (legacy)</option>
              </select>
            </SpecField>

            <SpecField label="Who this course is for">
              <Textarea
                value={whoFor}
                onChange={(e) => setWhoFor(e.target.value)}
                disabled={!editable}
                rows={2}
              />
            </SpecField>

            <SpecField label="Learning outcomes (one per line)">
              <Textarea
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                disabled={!editable}
                rows={5}
                placeholder="On completion, learners will…"
              />
            </SpecField>

            <SpecField label="How you'll study">
              <Textarea
                value={howStudy}
                onChange={(e) => setHowStudy(e.target.value)}
                disabled={!editable}
                rows={2}
              />
            </SpecField>

            <SpecField label="How you're assessed">
              <Textarea
                value={howAssessed}
                onChange={(e) => setHowAssessed(e.target.value)}
                disabled={!editable}
                rows={2}
              />
            </SpecField>

            <SpecField label="Prerequisites">
              <Textarea
                value={prereq}
                onChange={(e) => setPrereq(e.target.value)}
                disabled={!editable}
                rows={2}
              />
            </SpecField>

            <div className="grid grid-cols-2 gap-2">
              <SpecField label="Guided learning hours">
                <input
                  type="number"
                  min={0}
                  value={glh ?? ""}
                  onChange={(e) => setGlh(e.target.value === "" ? null : Number(e.target.value))}
                  disabled={!editable}
                  className="w-full rounded-[10px] border border-reps-border bg-white/5 px-3 py-2 text-[12.5px] text-white"
                />
              </SpecField>
              <SpecField label="Total qualification time">
                <input
                  type="number"
                  min={0}
                  value={tqt ?? ""}
                  onChange={(e) => setTqt(e.target.value === "" ? null : Number(e.target.value))}
                  disabled={!editable}
                  className="w-full rounded-[10px] border border-reps-border bg-white/5 px-3 py-2 text-[12.5px] text-white"
                />
              </SpecField>
            </div>

            {editable ? (
              <>
                <label className="mt-2 block text-[12px] font-semibold text-white/80">
                  Admin note (required for reject or changes)
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Assessment criteria don't map to the stated outcomes."
                  rows={2}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={() => decideMut.mutate("approved")}
                    disabled={decideMut.isPending || !specComplete}
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <CheckCircle2 data-icon />
                    {decideMut.isPending ? "Publishing…" : "Approve & publish"}
                  </Button>
                  <Button
                    onClick={() => saveMut.mutate()}
                    disabled={saveMut.isPending}
                    variant="ghost"
                  >
                    {saveMut.isPending ? "Saving…" : "Save draft"}
                  </Button>
                  <Button
                    onClick={() =>
                      note.trim() ? decideMut.mutate("changes_requested") : toast.error("Note required")
                    }
                    disabled={decideMut.isPending}
                    variant="ghost"
                  >
                    <Clock data-icon /> Request changes
                  </Button>
                  <Button
                    onClick={() =>
                      note.trim() ? decideMut.mutate("rejected") : toast.error("Note required")
                    }
                    disabled={decideMut.isPending}
                    variant="ghost"
                    className="text-red-300 hover:bg-red-500/10"
                  >
                    <XCircle data-icon /> Reject
                  </Button>
                </div>
                {!specComplete ? (
                  <p className="pt-1 text-[11px] text-white/45">
                    Fill every field to enable Approve. Level, GLH, TQT, delivery mode and at least one learning outcome are required.
                  </p>
                ) : null}
              </>
            ) : row.admin_note ? (
              <div className="mt-2 rounded-[10px] border border-reps-border bg-white/[0.02] p-3 text-[12px] text-white/70">
                <span className="font-semibold text-white/85">Admin note:</span> {row.admin_note}
              </div>
            ) : null}
          </div>
        </div>
      </PPanel>

    </>
  );
}

function SpecField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
        {label}
      </div>
      {children}
    </div>
  );
}

function AnswerBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-white/45">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-snug text-white/85">
        {value?.trim() ? value : <span className="text-white/40">—</span>}
      </dd>
    </div>
  );
}

function AnswerInline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-white/45">{label}</dt>
      <dd className="mt-0.5 text-[12.5px] text-white/85">{value}</dd>
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════════════════
   Shared bits
   ═══════════════════════════════════════════════════════════════════════════ */

function StatusDot({ status }: { status: Status }) {
  const cls =
    status === "approved"
      ? "bg-emerald-400"
      : status === "rejected"
        ? "bg-red-400"
        : status === "changes_requested"
          ? "bg-amber-400"
          : "bg-white/50";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} aria-hidden />;
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
    return <Badge className="border-red-500/30 bg-red-500/15 text-red-300">AI: flagged</Badge>;
  return (
    <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">AI: inconclusive</Badge>
  );
}

function EvidencePanel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "ok" | "warn" | "neutral";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-400/25 bg-emerald-500/[0.04]"
      : tone === "warn"
        ? "border-amber-500/25 bg-amber-500/[0.05]"
        : "border-reps-border bg-white/[0.02]";
  return (
    <div className={`rounded-[12px] border p-3 ${toneClass}`}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
        {title}
      </div>
      {children}
    </div>
  );
}

function PanelRow({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="text-white/45">{k}</dt>
      <dd className="text-white/85">{v ?? "—"}</dd>
    </div>
  );
}

function CrossCheckChip({
  ok,
  inconclusive,
  labelOk,
  labelBad,
  labelInconclusive,
}: {
  ok: boolean;
  inconclusive?: boolean;
  labelOk: string;
  labelBad: string;
  labelInconclusive?: string;
}) {
  if (inconclusive) {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">
        <AlertTriangle className="mr-1 h-3 w-3" /> {labelInconclusive ?? labelBad}
      </Badge>
    );
  }
  if (ok) {
    return (
      <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
        <CheckCircle2 className="mr-1 h-3 w-3" /> {labelOk}
      </Badge>
    );
  }
  return (
    <Badge className="border-red-500/30 bg-red-500/15 text-red-300">
      <XCircle className="mr-1 h-3 w-3" /> {labelBad}
    </Badge>
  );
}

/* ─── Level ladder + report button ──────────────────────────────────────── */

const LEVEL_LABELS: Record<number, string> = {
  1: "Awareness",
  2: "Supporting",
  3: "Independent instructor",
  4: "Specialist",
  5: "Advanced specialist",
  6: "Degree-equivalent",
  7: "Postgraduate-equivalent",
};

function LevelLadderField({
  value,
  aiSuggested,
  rationale,
  confidence,
  disabled,
  onChange,
}: {
  value: number | null;
  aiSuggested: number | null;
  rationale: string | null;
  confidence: "high" | "medium" | "low" | null;
  disabled: boolean;
  onChange: (n: number | null) => void;
}) {
  const confidenceTone =
    confidence === "high"
      ? "text-emerald-300"
      : confidence === "medium"
        ? "text-amber-300"
        : confidence === "low"
          ? "text-red-300"
          : "text-white/50";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
          Level (1–7)
        </div>
        {aiSuggested != null ? (
          <div className="text-[10.5px] text-white/55">
            <Sparkles className="mr-1 inline h-3 w-3 text-white/60" />
            AI suggests <span className="font-semibold text-white">L{aiSuggested}</span>
            {confidence ? (
              <>
                {" · "}
                <span className={`font-semibold ${confidenceTone}`}>{confidence} confidence</span>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const selected = value === n;
          const suggested = aiSuggested === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => !disabled && onChange(selected ? null : n)}
              disabled={disabled}
              className={`relative rounded-[8px] border px-2 py-1.5 text-[11.5px] font-semibold transition ${
                selected
                  ? "border-reps-orange bg-reps-orange text-white"
                  : suggested
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                    : "border-reps-border bg-white/[0.03] text-white/60 hover:bg-white/10"
              } disabled:cursor-not-allowed disabled:opacity-60`}
              title={LEVEL_LABELS[n]}
            >
              L{n}
              {suggested && !selected ? (
                <Sparkles className="absolute -right-1 -top-1 h-2.5 w-2.5 text-emerald-300" />
              ) : null}
            </button>
          );
        })}
      </div>
      {value != null ? (
        <div className="mt-1 text-[11px] text-white/60">
          <span className="font-semibold text-white/85">L{value}</span> · {LEVEL_LABELS[value]}
        </div>
      ) : null}
      {rationale ? (
        <div className="mt-2 rounded-[10px] border border-white/10 bg-white/[0.03] p-2.5 text-[11.5px] leading-snug text-white/75">
          <span className="font-semibold text-white/85">AI rationale — </span>
          {rationale}
        </div>
      ) : null}
    </div>
  );
}
