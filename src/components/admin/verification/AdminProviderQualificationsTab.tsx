/**
 * Admin queue for provider regulated qualifications & REPS-accredited courses.
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
const COURSE_STATUS_TABS: readonly CourseStatus[] = ["submitted", "ai_drafted", "approved", "rejected", "withdrawn"];
const STATUS_LABEL: Record<CourseStatus, string> = {
  submitted: "New",
  ai_drafted: "In review",
  changes_requested: "Changes",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function AdminProviderQualificationsTab() {
  const [tab, setTab] = React.useState<"regulated" | "cpd">("regulated");
  const [status, setStatus] = React.useState<CourseStatus>("submitted");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
          {(["regulated", "cpd"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
              }}
              className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition ${
                tab === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t === "regulated" ? "Regulated qualifications" : "REPS-accredited courses"}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
          {(tab === "regulated" ? REGULATED_STATUS_TABS : STATUS_TABS).map((s) => (
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

      {tab === "regulated" ? <RegulatedQueue status={status} /> : <CpdQueue status={status} />}
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

function CpdQueue({ status }: { status: Status }) {
  const qc = useQueryClient();
  const fetchList = useServerFn(adminListCpdQueue);
  const listQ = useQuery({
    queryKey: ["admin-cpd-queue", status],
    queryFn: () => fetchList({ data: { status } }),
    refetchInterval: status === "submitted" ? 30_000 : false,
  });

  const rows = (listQ.data ?? []) as unknown as CpdRow[];
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
            Providers submitting their own courses for REPS accreditation.
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
            <CpdListItem
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
                Approve to assign a REPS accreditation number, or reject with a note.
              </EmptyDescription>
            </Empty>
          </PPanel>
        ) : (
          <CpdDetail
            row={selected}
            onDecided={() => qc.invalidateQueries({ queryKey: ["admin-cpd-queue"] })}
          />
        )}
      </div>
    </div>
  );
}

function CpdListItem({
  row,
  selected,
  onSelect,
}: {
  row: CpdRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const providerName =
    row.provider?.legal_entity_name || row.provider?.identity_verified_name || "Unnamed provider";
  return (
    <li>
      <button
        onClick={onSelect}
        className={`block w-full px-3 py-3 text-left transition ${
          selected ? "bg-reps-orange-soft" : "hover:bg-white/[0.03]"
        }`}
      >
        <div className="truncate text-[13px] font-semibold text-white">{providerName}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-white/70">{row.title}</div>
        <div className="mt-0.5 text-[11px] text-white/55">
          {row.level != null ? `L${row.level}` : "—"}
          {row.hours != null ? ` · ${row.hours}h` : ""}
          {row.delivery_mode ? ` · ${row.delivery_mode.replace("_", " ")}` : ""}
        </div>
        <div className="mt-1 text-[10px] text-white/45">
          <TimeAgo iso={row.created_at} className="text-white/45" />
          {row.provider?.contact_email ? ` · ${row.provider.contact_email}` : null}
        </div>
      </button>
    </li>
  );
}

function CpdDetail({ row, onDecided }: { row: CpdRow; onDecided: () => void }) {
  const decide = useServerFn(adminDecideCpd);
  const [note, setNote] = React.useState("");
  React.useEffect(() => setNote(""), [row.id]);

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
  const [drawerDocs, setDrawerDocs] = React.useState<QualificationDoc[]>([]);
  const openDocs = (docs: QualificationDoc[]) => {
    setDrawerDocs(docs);
    setDrawerOpen(true);
  };

  const providerName =
    row.provider?.legal_entity_name || row.provider?.identity_verified_name || "Unnamed provider";

  const allDocs: QualificationDoc[] = [
    row.syllabus_doc_path ? { path: row.syllabus_doc_path, label: "Syllabus" } : null,
    row.assessment_criteria_doc_path
      ? { path: row.assessment_criteria_doc_path, label: "Assessment criteria" }
      : null,
    row.tutor_cv_doc_path ? { path: row.tutor_cv_doc_path, label: "Tutor CV" } : null,
  ].filter((d): d is QualificationDoc => !!d);

  return (
    <>
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-white/60">
            <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-300">
              REPS-accredited
            </span>
            {row.reps_cpd_number ? (
              <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                {row.reps_cpd_number}
              </Badge>
            ) : null}
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

        <div className="space-y-4 px-5 py-4">
          <div>
            <div className="text-[14px] font-semibold text-white">{row.title}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-white/60">
              {row.level != null ? (
                <Badge className="border-white/15 bg-white/5 text-white/75">L{row.level}</Badge>
              ) : null}
              {row.hours != null ? <span>{row.hours}h</span> : null}
              {row.delivery_mode ? (
                <span className="capitalize">{row.delivery_mode.replace("_", " ")}</span>
              ) : null}
              <AiVerdictChip verdict={row.ai_verdict} flags={row.ai_red_flags} />
            </div>
            {row.summary ? (
              <p className="mt-2 text-[12.5px] text-white/70">{row.summary}</p>
            ) : null}
          </div>

          {allDocs.length > 0 ? (
            <div>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
                Evidence documents
              </div>
              <div className="flex flex-wrap gap-2">
                {allDocs.map((d) => (
                  <button
                    key={d.path}
                    onClick={() => openDocs([d])}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1 text-[11.5px] text-white/80 hover:bg-white/10"
                  >
                    <FileText className="h-3 w-3" /> {d.label}
                  </button>
                ))}
                {allDocs.length > 1 ? (
                  <button
                    onClick={() => openDocs(allDocs)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-orange/15 px-2.5 py-1 text-[11.5px] font-semibold text-reps-orange hover:bg-reps-orange/20"
                  >
                    Open all
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {row.ai_red_flags.length > 0 ? (
            <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-2 text-[11.5px] text-red-200">
              <span className="font-semibold">AI flags:</span> {row.ai_red_flags.join(" · ")}
            </div>
          ) : null}
        </div>

        {row.status === "submitted" || row.status === "changes_requested" ? (
          <div className="border-t border-reps-border px-5 py-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Admin note (required for reject or changes)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Assessment criteria don't map to the stated outcomes."
              rows={2}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => decideMut.mutate("approved")}
                disabled={decideMut.isPending}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <CheckCircle2 data-icon /> Approve & assign REPS number
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
        docs={drawerDocs}
        title={row.title}
        subtitle={providerName}
      />
    </>
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
