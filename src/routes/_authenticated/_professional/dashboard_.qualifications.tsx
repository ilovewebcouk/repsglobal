/**
 * /dashboard/qualifications — provider qualifications & CPD accreditation.
 *
 * Two sub-sections:
 *   A. Regulated qualifications we deliver (Ofqual)
 *      — Pick from catalogue, upload EQA report / centre certificate /
 *        approval letter, admin approves.
 *   B. REPS-accredited CPD courses
 *      — Provider defines their own course, uploads syllabus + assessment
 *        criteria + tutor CV, admin approves, REPS assigns a CPD number.
 */

import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { awardingBodyName, awardingBodyLogo, OFQUAL_QUAL_NO_REGEX } from "@/lib/cpd/awarding-bodies";
import { uploadCertificateFile } from "@/lib/cpd/cpd.functions";
import {
  listMyRegulatedPermissions,
  listMyCpdCourses,
  resolveOfqualNumber,
  submitRegulatedPermissionBatch,
  submitCpdCourse,
  deleteMyRegulatedPermission,
  deleteMyCpdCourse,
} from "@/lib/qualifications/qualifications.functions";
import type {
  CpdCourseRow,
  RegulatedPermissionRow,
} from "@/lib/qualifications/qualifications.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/qualifications")({
  head: () => ({
    meta: [
      { title: "Qualifications & Courses — REPS Provider" },
      {
        name: "description",
        content:
          "Prove you're approved to deliver regulated qualifications and get your CPD courses REPS-accredited.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProviderQualsPage,
});

type Tab = "regulated" | "cpd";

function ProviderQualsPage() {
  const [tab, setTab] = React.useState<Tab>("regulated");
  const [regulatedOpen, setRegulatedOpen] = React.useState(false);
  const [cpdOpen, setCpdOpen] = React.useState(false);

  const fetchMyReg = useServerFn(listMyRegulatedPermissions);
  const fetchMyCpd = useServerFn(listMyCpdCourses);

  const regQuery = useQuery({ queryKey: ["my-regulated-permissions"], queryFn: () => fetchMyReg() });
  const cpdQuery = useQuery({ queryKey: ["my-cpd-courses"], queryFn: () => fetchMyCpd() });

  return (
    <DashboardShell
      role="trainer"
      active="Qualifications & Courses"
      title="Qualifications & Courses"
      subtitle="Prove approval to deliver regulated qualifications, and get your CPD courses REPS-accredited."
    >
      <div className="mb-5 inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
        {(["regulated", "cpd"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition ${
              tab === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t === "regulated" ? "Regulated qualifications" : "REPS-accredited CPD"}
          </button>
        ))}
      </div>

      {tab === "regulated" ? (
        <RegulatedSection
          rows={regQuery.data ?? []}
          loading={regQuery.isLoading}
          onNew={() => setRegulatedOpen(true)}
        />
      ) : (
        <CpdSection
          rows={cpdQuery.data ?? []}
          loading={cpdQuery.isLoading}
          onNew={() => setCpdOpen(true)}
        />
      )}

      {regulatedOpen ? (
        <AddRegulatedDialog open={regulatedOpen} onClose={() => setRegulatedOpen(false)} />
      ) : null}
      {cpdOpen ? <AddCpdDialog open={cpdOpen} onClose={() => setCpdOpen(false)} /> : null}
    </DashboardShell>
  );
}

/* ─── Regulated ─────────────────────────────────────────────────────────── */

function RegulatedSection({
  rows,
  loading,
  onNew,
}: {
  rows: RegulatedPermissionRow[];
  loading: boolean;
  onNew: () => void;
}) {
  return (
    <PPanel className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[18px] font-bold text-white">
            Regulated qualifications we deliver
          </h2>
          <p className="mt-1 text-[13px] text-white/60">
            Prove you're an approved centre for a specific Ofqual-regulated qualification.
            We only accept an EQA report, centre approval certificate, or an approval letter
            from the awarding body on their letterhead.
          </p>
        </div>
        <Button onClick={onNew} className="shrink-0">
          <Plus data-icon /> Add qualification
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-[13px] text-white/55">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-reps-border p-8 text-center">
          <GraduationCap className="mx-auto mb-3 h-8 w-8 text-white/40" />
          <div className="text-[14px] font-semibold text-white">
            No regulated qualifications yet
          </div>
          <div className="mt-1 text-[12.5px] text-white/55">
            Add one to prove your centre is approved to deliver it.
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <RegulatedRow key={r.id} row={r} />
          ))}
        </ul>
      )}
    </PPanel>
  );
}

function RegulatedRow({ row }: { row: RegulatedPermissionRow }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteMyRegulatedPermission);
  const mut = useMutation({
    mutationFn: () => del({ data: { id: row.id } }),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["my-regulated-permissions"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  // Prefer live Ofqual snapshot over the historic catalogue link.
  const snap = row.ofqual_snapshot;
  const title = snap?.title ?? row.qualification?.title ?? "Awaiting Ofqual match";
  const awardingOrg = snap?.awardingOrganisation ?? null;
  const level = snap?.level ?? (row.qualification?.level != null ? `L${row.qualification.level}` : null);
  const legacySlug = row.qualification?.awarding_body_slug ?? null;
  const logo = legacySlug ? awardingBodyLogo(legacySlug) : null;
  const bodyLabel = awardingOrg ?? (legacySlug ? awardingBodyName(legacySlug) ?? legacySlug : null);

  return (
    <li>
      <PCard className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-reps-border bg-white/5">
          {logo ? (
            <img src={logo} alt={bodyLabel ?? ""} className="max-h-8 max-w-10 object-contain" />
          ) : (
            <GraduationCap className="h-5 w-5 text-white/60" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{title}</span>
            {level ? (
              <Badge className="border-reps-orange/30 bg-reps-orange-soft text-reps-orange">
                {level}
              </Badge>
            ) : null}
            <StatusBadge status={row.status} />
            {row.ofqual_number && !row.ofqual_found ? (
              <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">
                <AlertTriangle className="mr-1 h-3 w-3" /> Not on register
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-white/55">
            {bodyLabel ? <span>{bodyLabel}</span> : null}
            {bodyLabel && row.ofqual_number ? <span>·</span> : null}
            {row.ofqual_number ? (
              <span className="font-mono text-white/70">{row.ofqual_number}</span>
            ) : null}
            <span>·</span>
            <span>{EVIDENCE_LABEL[row.evidence_type]}</span>
            {row.awarding_body_reference ? (
              <>
                <span>·</span>
                <span>Centre {row.awarding_body_reference}</span>
              </>
            ) : null}
          </div>
          {row.admin_note ? (
            <div className="mt-2 rounded-[10px] border border-amber-500/25 bg-amber-500/10 p-2.5 text-[12px] text-amber-200">
              <span className="font-semibold">Admin note:</span> {row.admin_note}
            </div>
          ) : null}
        </div>
        {row.status === "submitted" ? (
          <button
            onClick={() => mut.mutate()}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/50 hover:bg-white/5 hover:text-white"
            title="Remove submission"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </PCard>
    </li>
  );
}

const EVIDENCE_LABEL: Record<RegulatedPermissionRow["evidence_type"], string> = {
  eqa_report: "EQA report",
  centre_certificate: "Centre certificate",
  approval_letter: "Approval letter",
};

/* ─── CPD ───────────────────────────────────────────────────────────────── */

function CpdSection({
  rows,
  loading,
  onNew,
}: {
  rows: CpdCourseRow[];
  loading: boolean;
  onNew: () => void;
}) {
  return (
    <PPanel className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[18px] font-bold text-white">
            REPS-accredited CPD courses
          </h2>
          <p className="mt-1 text-[13px] text-white/60">
            REPS accredits your own CPD. Submit a syllabus, assessment criteria and tutor CV.
            Approved courses receive a REPS CPD number and the accredited badge.
          </p>
        </div>
        <Button onClick={onNew} className="shrink-0">
          <Plus data-icon /> Request accreditation
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-[13px] text-white/55">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-reps-border p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/40" />
          <div className="text-[14px] font-semibold text-white">No CPD courses yet</div>
          <div className="mt-1 text-[12.5px] text-white/55">
            Submit your first course for REPS accreditation.
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <CpdRow key={r.id} row={r} />
          ))}
        </ul>
      )}
    </PPanel>
  );
}

function CpdRow({ row }: { row: CpdCourseRow }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteMyCpdCourse);
  const mut = useMutation({
    mutationFn: () => del({ data: { id: row.id } }),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["my-cpd-courses"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <li>
      <PCard className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-emerald-500/30 bg-emerald-500/10">
          <BadgeCheck className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{row.title}</span>
            {row.level != null ? (
              <Badge className="border-white/15 bg-white/5 text-white/70">L{row.level}</Badge>
            ) : null}
            <StatusBadge status={row.status} />
            {row.reps_cpd_number ? (
              <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                {row.reps_cpd_number}
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-white/55">
            {row.hours != null ? <span>{row.hours}h</span> : null}
            {row.delivery_mode ? (
              <>
                <span>·</span>
                <span className="capitalize">{row.delivery_mode.replace("_", " ")}</span>
              </>
            ) : null}
          </div>
          {row.summary ? (
            <p className="mt-1.5 line-clamp-2 text-[12.5px] text-white/70">{row.summary}</p>
          ) : null}
          {row.admin_note ? (
            <div className="mt-2 rounded-[10px] border border-amber-500/25 bg-amber-500/10 p-2.5 text-[12px] text-amber-200">
              <span className="font-semibold">Admin note:</span> {row.admin_note}
            </div>
          ) : null}
        </div>
        {row.status === "submitted" ? (
          <button
            onClick={() => mut.mutate()}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/50 hover:bg-white/5 hover:text-white"
            title="Remove submission"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </PCard>
    </li>
  );
}

/* ─── Status badge ──────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: RegulatedPermissionRow["status"] }) {
  if (status === "approved")
    return (
      <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
      </Badge>
    );
  if (status === "submitted")
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">
        <Clock className="mr-1 h-3 w-3" /> In review
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge className="border-red-500/30 bg-red-500/15 text-red-300">
        <XCircle className="mr-1 h-3 w-3" /> Rejected
      </Badge>
    );
  return (
    <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">
      <Clock className="mr-1 h-3 w-3" /> Changes requested
    </Badge>
  );
}

/* ─── Add regulated dialog ──────────────────────────────────────────────── */

type OfqualChip = {
  id: string;
  number: string;
  state:
    | { kind: "loading" }
    | { kind: "invalid" }
    | { kind: "resolved"; found: boolean; title: string | null; awardingOrg: string | null; level: string | null };
};

function AddRegulatedDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const resolve = useServerFn(resolveOfqualNumber);
  const upload = useServerFn(uploadCertificateFile);
  const submit = useServerFn(submitRegulatedPermissionBatch);

  const [draftNumber, setDraftNumber] = React.useState("");
  const [chips, setChips] = React.useState<OfqualChip[]>([]);
  const [evidenceType, setEvidenceType] =
    React.useState<RegulatedPermissionRow["evidence_type"]>("eqa_report");
  const [reference, setReference] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const draftUpper = draftNumber.trim().toUpperCase();
  const draftFormatValid = OFQUAL_QUAL_NO_REGEX.test(draftUpper);
  const draftDuplicate = chips.some((c) => c.number === draftUpper);

  const addChip = React.useCallback(async () => {
    if (!draftFormatValid) {
      toast.error("Ofqual number must look like 601/3866/X");
      return;
    }
    if (draftDuplicate) {
      toast.error("Already added");
      return;
    }
    if (chips.length >= 10) {
      toast.error("You can add up to 10 qualifications per submission");
      return;
    }
    const id = `${draftUpper}-${Date.now()}`;
    setChips((prev) => [...prev, { id, number: draftUpper, state: { kind: "loading" } }]);
    setDraftNumber("");
    try {
      const res = await resolve({ data: { ofqual_number: draftUpper } });
      setChips((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                state: !res.valid
                  ? { kind: "invalid" }
                  : {
                      kind: "resolved",
                      found: res.found,
                      title: res.snapshot?.title ?? null,
                      awardingOrg: res.snapshot?.awardingOrganisation ?? null,
                      level: res.snapshot?.level ?? null,
                    },
              }
            : c,
        ),
      );
    } catch {
      setChips((prev) =>
        prev.map((c) => (c.id === id ? { ...c, state: { kind: "invalid" } } : c)),
      );
    }
  }, [chips, draftDuplicate, draftFormatValid, draftUpper, resolve]);

  const removeChip = (id: string) => setChips((prev) => prev.filter((c) => c.id !== id));

  const onFilesChange = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list).slice(0, 5));
  };

  const canSubmit = chips.length > 0 && files.length > 0 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const paths: string[] = [];
      for (const f of files) {
        const dataUrl = await fileToDataUrl(f);
        const { path } = await upload({ data: { file_data_url: dataUrl, filename: f.name } });
        paths.push(path);
      }
      await submit({
        data: {
          ofqual_numbers: chips.map((c) => c.number),
          evidence_type: evidenceType,
          evidence_doc_paths: paths,
          awarding_body_reference: reference.trim() || null,
        },
      });
      toast.success(
        chips.length === 1
          ? "Submitted for review"
          : `${chips.length} qualifications submitted for review`,
      );
      qc.invalidateQueries({ queryKey: ["my-regulated-permissions"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle>Add regulated qualifications</DialogTitle>
          <DialogDescription>
            Add every Ofqual number your evidence document covers — one EQA report or approval letter
            often lists several qualifications. Upload the evidence once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Ofqual qualification numbers <span className="text-red-300">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={draftNumber}
                onChange={(e) => setDraftNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (draftFormatValid && !draftDuplicate) void addChip();
                  }
                }}
                placeholder="e.g. 601/3866/X"
                className="font-mono uppercase"
                autoCapitalize="characters"
              />
              <Button
                type="button"
                onClick={() => void addChip()}
                disabled={!draftFormatValid || draftDuplicate}
                variant="ghost"
                className="shrink-0"
              >
                <Plus data-icon /> Add
              </Button>
            </div>
            <p className="mt-1 text-[11.5px] text-white/45">
              Format: three digits / four digits / one letter or digit (e.g. 601/3866/X).
              {draftNumber && !draftFormatValid ? (
                <span className="ml-1 text-red-300">Format invalid.</span>
              ) : null}
              {draftDuplicate ? <span className="ml-1 text-amber-300">Already added.</span> : null}
            </p>

            {chips.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {chips.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 rounded-[10px] border border-reps-border bg-white/[0.03] p-2.5"
                  >
                    <div className="mt-0.5">
                      {c.state.kind === "loading" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />
                      ) : c.state.kind === "invalid" ? (
                        <XCircle className="h-3.5 w-3.5 text-red-300" />
                      ) : c.state.found ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12.5px] font-semibold text-white">
                          {c.number}
                        </span>
                        {c.state.kind === "resolved" && c.state.found ? (
                          <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                            On register
                          </Badge>
                        ) : c.state.kind === "resolved" && !c.state.found ? (
                          <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">
                            Not on register
                          </Badge>
                        ) : null}
                      </div>
                      {c.state.kind === "resolved" && c.state.found ? (
                        <div className="mt-0.5 text-[11.5px] text-white/70">
                          {c.state.title ?? "—"}
                          <span className="text-white/45">
                            {c.state.awardingOrg ? ` · ${c.state.awardingOrg}` : ""}
                            {c.state.level ? ` · ${c.state.level}` : ""}
                          </span>
                        </div>
                      ) : c.state.kind === "resolved" && !c.state.found ? (
                        <div className="mt-0.5 text-[11.5px] text-amber-200/80">
                          Not found on the public Ofqual register — you can still submit; we'll review manually.
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChip(c.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-white/50 hover:bg-white/5 hover:text-white"
                      aria-label={`Remove ${c.number}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <Label className="mb-2 block text-[12px] font-semibold text-white/80">
              Evidence type
            </Label>
            <RadioGroup
              value={evidenceType}
              onValueChange={(v) => setEvidenceType(v as typeof evidenceType)}
              className="space-y-1.5"
            >
              {(
                [
                  ["eqa_report", "EQA report — from awarding body's External Quality Assurer"],
                  ["centre_certificate", "Centre approval certificate — issued by awarding body"],
                  ["approval_letter", "Approval letter — awarding body letterhead, names your centre"],
                ] as const
              ).map(([val, label]) => (
                <label
                  key={val}
                  className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-reps-border p-2.5 hover:bg-white/[0.02]"
                >
                  <RadioGroupItem value={val} id={`ev-${val}`} className="mt-0.5" />
                  <span className="text-[12.5px] text-white/80">{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Centre number <span className="text-white/40">(optional)</span>
            </Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 123456"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Evidence documents <span className="text-red-300">*</span>
            </Label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[12px] border border-dashed border-reps-border p-4 hover:bg-white/[0.02]">
              <Upload className="h-5 w-5 text-white/50" />
              <span className="text-[12.5px] text-white/70">
                {files.length === 0
                  ? "Click to upload (PDF, JPG, PNG) — up to 5 files"
                  : `${files.length} file${files.length === 1 ? "" : "s"} selected`}
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => onFilesChange(e.target.files)}
              />
            </label>
            {files.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-white/60">
                    <FileText className="h-3.5 w-3.5" />
                    {f.name}
                  </li>
                ))}
              </ul>
            ) : null}
            {chips.length > 1 ? (
              <p className="mt-1.5 text-[11.5px] text-white/50">
                These files will be attached to all {chips.length} qualifications in this submission.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : chips.length > 1 ? (
              `Submit ${chips.length} qualifications`
            ) : (
              "Submit for review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Add CPD dialog ────────────────────────────────────────────────────── */

function AddCpdDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const upload = useServerFn(uploadCertificateFile);
  const submit = useServerFn(submitCpdCourse);

  const [title, setTitle] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [hours, setHours] = React.useState("");
  const [deliveryMode, setDeliveryMode] =
    React.useState<CpdCourseRow["delivery_mode"] | "">("");
  const [summary, setSummary] = React.useState("");
  const [syllabusFile, setSyllabusFile] = React.useState<File | null>(null);
  const [assessmentFile, setAssessmentFile] = React.useState<File | null>(null);
  const [tutorCvFile, setTutorCvFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit =
    title.trim().length >= 3 &&
    syllabusFile &&
    assessmentFile &&
    tutorCvFile &&
    !submitting;

  const uploadOne = async (f: File): Promise<string> => {
    const dataUrl = await fileToDataUrl(f);
    const { path } = await upload({ data: { file_data_url: dataUrl, filename: f.name } });
    return path;
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const [syllabus_doc_path, assessment_criteria_doc_path, tutor_cv_doc_path] = await Promise.all(
        [uploadOne(syllabusFile!), uploadOne(assessmentFile!), uploadOne(tutorCvFile!)],
      );
      await submit({
        data: {
          title: title.trim(),
          level: level ? Number(level) : null,
          hours: hours ? Number(hours) : null,
          delivery_mode: (deliveryMode || null) as CpdCourseRow["delivery_mode"],
          summary: summary.trim() || null,
          syllabus_doc_path,
          assessment_criteria_doc_path,
          tutor_cv_doc_path,
        },
      });
      toast.success("Submitted for accreditation review");
      qc.invalidateQueries({ queryKey: ["my-cpd-courses"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle>Request REPS CPD accreditation</DialogTitle>
          <DialogDescription>
            Submit your course syllabus, assessment criteria and tutor CV. Approved courses receive
            a REPS CPD number and the accredited badge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Course title <span className="text-red-300">*</span>
            </Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kettlebell Coach Level 1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                Level <span className="text-white/40">(optional)</span>
              </Label>
              <Input
                value={level}
                onChange={(e) => setLevel(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="2, 3, 4…"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                Total hours <span className="text-white/40">(optional)</span>
              </Label>
              <Input
                value={hours}
                onChange={(e) => setHours(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="12"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">Delivery</Label>
            <Select
              value={deliveryMode ?? ""}
              onValueChange={(v) => setDeliveryMode(v as CpdCourseRow["delivery_mode"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery mode…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">In person</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="blended">Blended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
              Short summary <span className="text-white/40">(optional)</span>
            </Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Who's it for and what will they be able to do afterwards?"
              rows={3}
            />
          </div>

          <FilePicker
            label="Course syllabus"
            required
            file={syllabusFile}
            onFile={setSyllabusFile}
          />
          <FilePicker
            label="Assessment criteria"
            required
            file={assessmentFile}
            onFile={setAssessmentFile}
          />
          <FilePicker
            label="Tutor CV"
            required
            file={tutorCvFile}
            onFile={setTutorCvFile}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for accreditation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilePicker({
  label,
  required,
  file,
  onFile,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
        {label} {required ? <span className="text-red-300">*</span> : null}
      </Label>
      <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-dashed border-reps-border p-3 hover:bg-white/[0.02]">
        <Upload className="h-4 w-4 text-white/50" />
        <span className="flex-1 truncate text-[12.5px] text-white/70">
          {file ? file.name : "Click to upload PDF / DOC / image"}
        </span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
