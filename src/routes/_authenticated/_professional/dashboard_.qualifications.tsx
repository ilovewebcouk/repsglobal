/**
 * /dashboard/qualifications — provider qualifications & REPS-endorsed courses.
 *
 * Two sub-flows behind a single unified list:
 *   A. Regulated qualifications we deliver (Ofqual) — pick from catalogue,
 *      upload EQA report / centre certificate / approval letter, admin approves.
 *   B. REPS-endorsed courses — provider uploads syllabus + assessment
 *      criteria + tutor CV; AI drafts the full spec; admin edits and
 *      publishes; row gets a global REPS-QUAL-NNNNNN number.
 */

import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ENDORSEMENT_TERMS_VERSION } from "@/routes/legal.endorsement-terms";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Paperclip,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import repsLogoWhite from "@/assets/brand/logo.svg";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
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
  DashboardSelect as Select,
  DashboardSelectContent as SelectContent,
  DashboardSelectItem as SelectItem,
  DashboardSelectTrigger as SelectTrigger,
  DashboardSelectValue as SelectValue,
} from "@/components/dashboard/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { awardingBodyName, awardingBodyLogo, awardingBodyLogoByName, OFQUAL_QUAL_NO_REGEX } from "@/lib/cpd/awarding-bodies";
import { uploadCertificateFile } from "@/lib/cpd/cpd.functions";
import {
  listMyRegulatedPermissions,
  listMyRepsCourses,
  resolveOfqualNumber,
  submitRegulatedPermissionBatch,
  submitRepsCourse,
  removeMyRegulatedPermission,
  removeMyRepsCourse,
  uploadRepsCourseEvidence,
  removeRepsCourseEvidence,
  listMyUnattachedEvidence,

} from "@/lib/qualifications/qualifications.functions";
import type {
  RepsCourseRow,
  RegulatedPermissionRow,
  RepsCourseEvidenceRow,
  RepsCourseEvidenceKind,
} from "@/lib/qualifications/qualifications.functions";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/qualifications")({
  head: () => ({
    meta: [
      { title: "Qualifications & Courses — REPS Provider" },
      {
        name: "description",
        content:
          "Prove you're approved to deliver regulated qualifications and get your courses REPS-endorsed.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProviderQualsPage,
});

type AddKind = "regulated" | "course";

const parseLevel = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  const m = String(v).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

function ProviderQualsPage() {
  const tier = useTrainerTier();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [regulatedOpen, setRegulatedOpen] = React.useState(false);
  const [cpdOpen, setCpdOpen] = React.useState(false);

  const fetchMyReg = useServerFn(listMyRegulatedPermissions);
  const fetchMyCourses = useServerFn(listMyRepsCourses);

  const regQuery = useQuery({ queryKey: ["my-regulated-permissions"], queryFn: () => fetchMyReg() });
  const courseQuery = useQuery({
    queryKey: ["my-reps-courses"],
    queryFn: () => fetchMyCourses(),
    // While a course is being AI-drafted we want the UI to catch up quickly.
    refetchInterval: (q) => {
      const rows = (q.state.data ?? []) as RepsCourseRow[];
      return rows.some((r) => r.status === "submitted") ? 4000 : false;
    },
  });

  const loading = regQuery.isLoading || courseQuery.isLoading;
  const regRows = regQuery.data ?? [];
  const courseRows = courseQuery.data ?? [];

  type Merged =
    | { kind: "regulated"; id: string; withdrawn: boolean; levelNum: number | null; title: string; row: RegulatedPermissionRow }
    | { kind: "course"; id: string; withdrawn: boolean; levelNum: number | null; title: string; row: RepsCourseRow };

  const merged: Merged[] = React.useMemo(() => {
    const items: Merged[] = [];
    for (const r of regRows) {
      const snap = r.ofqual_snapshot;
      const title = snap?.title ?? r.qualification?.title ?? "Awaiting Ofqual match";
      const levelSrc = snap?.level ?? (r.qualification?.level != null ? `L${r.qualification.level}` : null);
      items.push({
        kind: "regulated",
        id: r.id,
        withdrawn: r.status === "withdrawn",
        levelNum: parseLevel(levelSrc),
        title,
        row: r,
      });
    }
    for (const c of courseRows) {
      items.push({
        kind: "course",
        id: c.id,
        withdrawn: c.status === "withdrawn",
        levelNum: c.official_level ?? null,
        title: c.official_title ?? c.proposed_title,
        row: c,
      });
    }
    items.sort((a, b) => {
      if (a.withdrawn !== b.withdrawn) return a.withdrawn ? 1 : -1;
      const al = a.levelNum;
      const bl = b.levelNum;
      if (al == null && bl == null) return a.title.localeCompare(b.title);
      if (al == null) return 1;
      if (bl == null) return -1;
      if (bl !== al) return bl - al;
      return a.title.localeCompare(b.title);
    });
    return items;
  }, [regRows, courseRows]);

  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active="Qualifications & Courses"
      title="Qualifications & Courses"
      subtitle="One list for both regulated qualifications you're approved to deliver and courses you'd like REPS to endorse."
    >
      <PPanel className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] font-bold text-white">
              Your qualifications & courses
            </h2>
            <p className="mt-1 text-[13px] text-white/60">
              Sorted by level, highest first. Each row shows its awarding body and verifiable reference number.
            </p>
          </div>
          <Button onClick={() => setPickerOpen(true)} className="shrink-0">
            <Plus data-icon /> Add qualification or course
          </Button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-[13px] text-white/55">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : merged.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-reps-border p-8 text-center">
            <GraduationCap className="mx-auto mb-3 h-8 w-8 text-white/40" />
            <div className="text-[14px] font-semibold text-white">No qualifications or courses yet</div>
            <div className="mt-1 text-[12.5px] text-white/55">
              Add your first — we'll ask whether it's an Ofqual-regulated qualification you deliver, or a course you'd like REPS to endorse.
            </div>
            <Button onClick={() => setPickerOpen(true)} className="mt-4">
              <Plus data-icon /> Add qualification or course
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {merged.map((m) =>
              m.kind === "regulated" ? (
                <RegulatedRow key={`r-${m.id}`} row={m.row} />
              ) : (
                <CpdRow key={`c-${m.id}`} row={m.row} />
              ),
            )}
          </ul>
        )}
      </PPanel>

      {pickerOpen ? (
        <AddTypePickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(kind: AddKind) => {
            setPickerOpen(false);
            if (kind === "regulated") setRegulatedOpen(true);
            else setCpdOpen(true);
          }}
        />
      ) : null}
      {regulatedOpen ? (
        <AddRegulatedDialog open={regulatedOpen} onClose={() => setRegulatedOpen(false)} />
      ) : null}
      {cpdOpen ? <AddCpdDialog open={cpdOpen} onClose={() => setCpdOpen(false)} /> : null}
    </DashboardShell>
  );
}

/* ─── Type-picker (step 1 of Add flow) ──────────────────────────────────── */

function AddTypePickerDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (kind: AddKind) => void;
}) {
  const [choice, setChoice] = React.useState<AddKind | null>(null);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle>Add qualification or course</DialogTitle>
          <DialogDescription>
            Which are you adding? Each has different evidence requirements.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={choice ?? ""}
          onValueChange={(v) => setChoice(v as AddKind)}
          className="space-y-3"
        >
          <label
            htmlFor="pick-regulated"
            className={`flex cursor-pointer items-start gap-3 rounded-[12px] border p-4 transition ${
              choice === "regulated"
                ? "border-reps-orange bg-reps-orange-soft/20"
                : "border-reps-border bg-white/5 hover:bg-white/[0.07]"
            }`}
          >
            <RadioGroupItem id="pick-regulated" value="regulated" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-white/80" />
                <span className="text-[14px] font-semibold text-white">Ofqual-regulated qualification</span>
              </div>
              <p className="mt-1 text-[12.5px] text-white/60">
                I'm an approved centre for a qualification on the Ofqual register (e.g. Active IQ Level 2 in Instructing Circuit Training). You'll need an EQA report, centre certificate, or approval letter.
              </p>
            </div>
          </label>

          <label
            htmlFor="pick-course"
            className={`flex cursor-pointer items-start gap-3 rounded-[12px] border p-4 transition ${
              choice === "course"
                ? "border-reps-orange bg-reps-orange-soft/20"
                : "border-reps-border bg-white/5 hover:bg-white/[0.07]"
            }`}
          >
            <RadioGroupItem id="pick-course" value="course" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/80" />
                <span className="text-[14px] font-semibold text-white">REPS-endorsed course</span>
              </div>
              <p className="mt-1 text-[12.5px] text-white/60">
                I've built my own course and want REPS to endorse it. Upload a syllabus — everything else is optional.
              </p>
            </div>
          </label>
        </RadioGroup>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => choice && onPick(choice)} disabled={!choice}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* ─── Regulated ─────────────────────────────────────────────────────────── */


function RegulatedRow({ row }: { row: RegulatedPermissionRow }) {
  const qc = useQueryClient();
  const remove = useServerFn(removeMyRegulatedPermission);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const isWithdrawn = row.status === "withdrawn";
  const isApproved = row.status === "approved";

  const mut = useMutation({
    mutationFn: () =>
      remove({ data: { id: row.id, reason: isApproved ? reason.trim() || null : null } }),
    onSuccess: (res) => {
      toast.success(res?.mode === "withdrawn" ? "Removed from profile" : "Deleted");
      setConfirmOpen(false);
      setReason("");
      qc.invalidateQueries({ queryKey: ["my-regulated-permissions"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Remove failed"),
  });

  const snap = row.ofqual_snapshot;
  const title = snap?.title ?? row.qualification?.title ?? "Awaiting Ofqual match";
  const awardingOrg = snap?.awardingOrganisation ?? null;
  const level = snap?.level ?? (row.qualification?.level != null ? `L${row.qualification.level}` : null);
  const legacySlug = row.qualification?.awarding_body_slug ?? null;
  const logo =
    (legacySlug ? awardingBodyLogo(legacySlug) : null) ??
    awardingBodyLogoByName(awardingOrg);
  const bodyLabel = awardingOrg ?? (legacySlug ? awardingBodyName(legacySlug) ?? legacySlug : null);

  return (
    <li>
      <PCard className={`flex items-start gap-4 ${isWithdrawn ? "opacity-60" : ""}`}>
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
            {row.reps_qualification_number ? (
              <>
                <span>·</span>
                <span className="font-mono text-emerald-300">
                  {row.reps_qualification_number}
                </span>
              </>
            ) : null}
            {row.awarding_body_reference ? (
              <>
                <span>·</span>
                <span>Centre {row.awarding_body_reference}</span>
              </>
            ) : null}
          </div>
          {row.admin_note && (row.status === "rejected" || row.status === "changes_requested") ? (
            <div className="mt-2 rounded-[10px] border border-amber-500/25 bg-amber-500/10 p-2.5 text-[12px] text-amber-200">
              <span className="font-semibold">Reviewer's note:</span> {row.admin_note}
            </div>
          ) : null}
        </div>
        {!isWithdrawn ? (
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/50 hover:bg-white/5 hover:text-white"
            title={isApproved ? "Remove from profile" : "Delete submission"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </PCard>

      <Dialog open={confirmOpen} onOpenChange={(v) => !mut.isPending && setConfirmOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isApproved ? "Remove from your profile?" : "Delete this submission?"}
            </DialogTitle>
            <DialogDescription>
              {isApproved
                ? `“${title}” will disappear from your public profile immediately. REPs keeps a record for audit purposes.`
                : "This cannot be undone. The uploaded evidence will also be deleted."}
            </DialogDescription>
          </DialogHeader>
          {isApproved ? (
            <div className="space-y-2">
              <Label htmlFor="withdraw-reason" className="text-[12px] text-white/70">
                Reason (optional)
              </Label>
              <Textarea
                id="withdraw-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Centre approval ended, no longer delivering this qualification…"
                maxLength={500}
                rows={3}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={mut.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="bg-red-500/20 text-red-200 hover:bg-red-500/30 border-red-500/30"
            >
              {mut.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  {isApproved ? "Removing…" : "Deleting…"}
                </>
              ) : isApproved ? (
                "Remove from profile"
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

const EVIDENCE_LABEL: Record<RegulatedPermissionRow["evidence_type"], string> = {
  eqa_report: "EQA report",
  centre_certificate: "Centre certificate",
  approval_letter: "Approval letter",
};

/* ─── REPS-endorsed course row ─────────────────────────────────────────── */

function CpdRow({ row }: { row: RepsCourseRow }) {
  const qc = useQueryClient();
  const remove = useServerFn(removeMyRepsCourse);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const isWithdrawn = row.status === "withdrawn";
  const isApproved = row.status === "approved";
  const isDrafting = row.status === "submitted";

  const title = row.official_title ?? row.proposed_title;
  const level = row.official_level;

  const mut = useMutation({
    mutationFn: () =>
      remove({ data: { id: row.id, reason: isApproved ? reason.trim() || null : null } }),
    onSuccess: (res) => {
      toast.success(res?.mode === "withdrawn" ? "Removed from profile" : "Deleted");
      setConfirmOpen(false);
      setReason("");
      qc.invalidateQueries({ queryKey: ["my-reps-courses"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Remove failed"),
  });

  return (
    <li>
      <PCard className={`flex items-start gap-4 ${isWithdrawn ? "opacity-60" : ""}`}>
        <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 px-2">
          <img src={repsLogoWhite} alt="REPS" className="max-h-5 w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{title}</span>
            {level != null ? (
              <Badge className="border-reps-orange/30 bg-reps-orange-soft text-reps-orange">
                Level {level}
              </Badge>
            ) : null}
            <StatusBadge status={row.status} />
          </div>
          {isDrafting ? (
            <p className="mt-1.5 text-[12.5px] text-white/60">
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
              AI is drafting the specification — usually under a minute.
            </p>
          ) : row.status === "ai_drafted" ? (
            <p className="mt-1.5 text-[12.5px] text-white/60">
              Draft ready — awaiting REPS review. You'll be notified once it's published.
            </p>
          ) : row.reps_qual_number ? (
            <p className="mt-1.5 text-[12.5px] text-white/60">
              <span>REPS</span>
              <span className="mx-1.5 text-white/30">·</span>
              <span className="font-mono text-emerald-300">{row.reps_qual_number}</span>
            </p>
          ) : null}
          {row.admin_note && (row.status === "rejected" || row.status === "changes_requested") ? (
            <div className="mt-2 rounded-[10px] border border-amber-500/25 bg-amber-500/10 p-2.5 text-[12px] text-amber-200">
              <span className="font-semibold">Reviewer's note:</span> {row.admin_note}
            </div>
          ) : null}
          {(row.status === "changes_requested" || row.status === "rejected") && row.reviewer_notes ? (
            <div className="mt-2 rounded-[10px] border border-blue-400/25 bg-blue-500/10 p-2.5 text-[12px] text-blue-100">
              <div className="mb-0.5 flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-3 w-3" /> Summary from REPS review
              </div>
              <p className="text-blue-100/90">{row.reviewer_notes}</p>
            </div>
          ) : null}
          {(row.status === "changes_requested" || row.status === "rejected") &&
          row.ai_deterministic_flags &&
          row.ai_deterministic_flags.length > 0 ? (
            <div className="mt-2 rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-2.5 text-[12px] text-amber-100">
              <div className="mb-1 font-semibold">What to fix</div>
              <ul className="list-disc space-y-0.5 pl-4">
                {row.ai_deterministic_flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {!isWithdrawn ? (
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/50 hover:bg-white/5 hover:text-white"
            title={isApproved ? "Remove from profile" : "Delete submission"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </PCard>

      <Dialog open={confirmOpen} onOpenChange={(v) => !mut.isPending && setConfirmOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isApproved ? "Remove from your profile?" : "Delete this submission?"}
            </DialogTitle>
            <DialogDescription>
              {isApproved
                ? `“${title}” will disappear from your public profile immediately. REPs keeps a record for audit purposes.`
                : "This cannot be undone. The uploaded evidence will also be deleted."}
            </DialogDescription>
          </DialogHeader>
          {isApproved ? (
            <div className="space-y-2">
              <Label htmlFor="withdraw-course-reason" className="text-[12px] text-white/70">
                Reason (optional)
              </Label>
              <Textarea
                id="withdraw-course-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Course no longer offered, content retired…"
                maxLength={500}
                rows={3}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={mut.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="bg-red-500/20 text-red-200 hover:bg-red-500/30 border-red-500/30"
            >
              {mut.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  {isApproved ? "Removing…" : "Deleting…"}
                </>
              ) : isApproved ? (
                "Remove from profile"
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

/* ─── Status badge ──────────────────────────────────────────────────────── */

function StatusBadge({
  status,
}: {
  status: RegulatedPermissionRow["status"] | RepsCourseRow["status"];
}) {
  if (status === "approved")
    return (
      <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
      </Badge>
    );
  if (status === "submitted")
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">
        <Sparkles className="mr-1 h-3 w-3" /> AI drafting
      </Badge>
    );
  if (status === "ai_drafted")
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
  if (status === "withdrawn")
    return <Badge className="border-white/15 bg-white/5 text-white/60">Withdrawn</Badge>;
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
  const [termsAgreed, setTermsAgreed] = React.useState(false);
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

  const canSubmit = chips.length > 0 && files.length > 0 && termsAgreed && !submitting;

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
          endorsement_terms_version: ENDORSEMENT_TERMS_VERSION,
          endorsement_terms_accepted: true,
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

          <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-reps-border bg-white/[0.02] p-3 text-[12.5px] text-white/80">
            <Checkbox
              checked={termsAgreed}
              onCheckedChange={(v) => setTermsAgreed(v === true)}
              className="mt-0.5"
            />
            <span>
              I have read and accept the{" "}
              <Link
                to="/legal/endorsement-terms"
                target="_blank"
                className="font-semibold text-reps-orange underline-offset-4 hover:underline"
              >
                REPS Endorsement Terms ({ENDORSEMENT_TERMS_VERSION})
              </Link>
              .
            </span>
          </label>
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

/* ─── Add REPS-endorsed course dialog ──────────────────────────────────── */

type DeliveryMode = "in_person" | "online_live" | "online_self_paced" | "blended";

const DELIVERY_OPTIONS: Array<{ value: DeliveryMode; label: string; help: string }> = [
  { value: "in_person", label: "In-person", help: "Everyone in the room together." },
  { value: "online_live", label: "Online — live", help: "Scheduled sessions on Zoom / Teams." },
  { value: "online_self_paced", label: "Online — self-paced", help: "Learners work through modules on their own schedule." },
  { value: "blended", label: "Blended", help: "Mix of in-person and online." },
];

type ModuleDraft = { title: string; summary: string; hours: string };

type OptionalEvidenceKind = Exclude<RepsCourseEvidenceKind, "specification">;

const OPTIONAL_EVIDENCE_OPTIONS: { value: OptionalEvidenceKind; label: string }[] = [
  { value: "sample_materials", label: "Sample learning materials" },
  { value: "assessment", label: "Assessment plan / sample assessment" },
  { value: "tutor_cv", label: "Lead tutor CV / bio" },
  { value: "insurance", label: "Insurance certificate" },
  { value: "awarding_body_cert", label: "Awarding-body certificate" },
  { value: "other", label: "Other" },
];

const EVIDENCE_KIND_LABEL: Record<RepsCourseEvidenceKind, string> = {
  specification: "Course specification / syllabus",
  sample_materials: "Sample learning materials",
  assessment: "Assessment plan / sample assessment",
  tutor_cv: "Lead tutor CV / bio",
  insurance: "Insurance certificate",
  awarding_body_cert: "Awarding-body certificate",
  other: "Other",
};

const EVIDENCE_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.zip,.jpg,.jpeg,.png";

const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024; // 25 MB per file

function AddCpdDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const submit = useServerFn(submitRepsCourse);
  const uploadEvidence = useServerFn(uploadRepsCourseEvidence);
  const removeEvidence = useServerFn(removeRepsCourseEvidence);
  const loadUnattached = useServerFn(listMyUnattachedEvidence);

  const [title, setTitle] = React.useState("");
  const [proposedLevel, setProposedLevel] = React.useState<string>("");
  const [credentialType, setCredentialType] = React.useState<
    "award" | "certificate" | "diploma" | "course" | "not_sure" | ""
  >("");
  const [whoFor, setWhoFor] = React.useState("");
  const [outcomes, setOutcomes] = React.useState("");
  const [delivery, setDelivery] = React.useState<DeliveryMode | "">("");
  const [totalHours, setTotalHours] = React.useState<string>("");
  const [howAssessed, setHowAssessed] = React.useState("");
  const [prerequisites, setPrerequisites] = React.useState("");
  const [tutor, setTutor] = React.useState("");
  const [extra, setExtra] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const [modules, setModules] = React.useState<ModuleDraft[]>([
    { title: "", summary: "", hours: "" },
  ]);

  const [evidenceByKind, setEvidenceByKind] = React.useState<
    Record<EvidenceSlotKind, RepsCourseEvidenceRow[]>
  >({
    specification: [],
    sample_materials: [],
    assessment: [],
    tutor_cv: [],
  });
  const [uploading, setUploading] = React.useState<EvidenceSlotKind | null>(null);

  // Hydrate: if the provider closed a previous "Request REPS endorsement"
  // dialog without submitting, their uploads are still on disk with
  // course_id = null. Fetch them once on open so nothing is silently lost.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadUnattached();
        if (cancelled || !rows || rows.length === 0) return;
        setEvidenceByKind((prev) => {
          const next = { ...prev };
          const known = new Set(
            EVIDENCE_SLOTS.flatMap((s) => next[s.kind].map((r) => r.id)),
          );
          for (const row of rows) {
            const kind = row.file_kind as EvidenceSlotKind;
            if (!next[kind] || known.has(row.id)) continue;
            next[kind] = [...next[kind], row];
          }
          return next;
        });
      } catch {
        // non-fatal — dialog still works for fresh uploads
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Endorsement statement — provider must display verbatim on their public
  // course page. Agreeing to the Endorsement Terms includes agreeing to display it.

  const totalHoursNum = Number(totalHours);
  const hoursValid = totalHours.trim() !== "" && Number.isFinite(totalHoursNum) && totalHoursNum >= 0.5 && totalHoursNum <= 2000;

  const validModules = modules.filter(
    (m) => m.title.trim().length >= 2 && m.summary.trim().length >= 2,
  );

  const allSlotsFilled = EVIDENCE_SLOTS.every((s) => evidenceByKind[s.kind].length > 0);

  const [termsAgreed, setTermsAgreed] = React.useState(false);

  const canSubmit =
    title.trim().length >= 3 &&
    whoFor.trim().length >= 10 &&
    outcomes.trim().length >= 10 &&
    delivery !== "" &&
    hoursValid &&
    howAssessed.trim().length >= 5 &&
    tutor.trim().length >= 10 &&
    validModules.length >= 1 &&
    allSlotsFilled &&
    termsAgreed &&
    !submitting;

  const resetAll = () => {
    setTitle("");
    setProposedLevel("");
    setCredentialType("");
    setWhoFor("");
    setOutcomes("");
    setDelivery("");
    setTotalHours("");
    setHowAssessed("");
    setPrerequisites("");
    setTutor("");
    setExtra("");
    setModules([{ title: "", summary: "", hours: "" }]);
    setEvidenceByKind({ specification: [], sample_materials: [], assessment: [], tutor_cv: [] });
    setTermsAgreed(false);
  };




  const handleUpload = async (kind: EvidenceSlotKind, file: File) => {
    if (file.size > MAX_EVIDENCE_BYTES) {
      toast.error(`${file.name} is over 25 MB — please compress or split.`);
      return;
    }
    setUploading(kind);
    try {
      const dataUrl = await fileToDataUrl(file);
      const row = await uploadEvidence({
        data: {
          file_kind: kind,
          file_data_url: dataUrl,
          filename: file.name,
          mime_type: file.type || null,
        },
      });
      setEvidenceByKind((prev) => ({ ...prev, [kind]: [...prev[kind], row] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveEvidence = async (kind: EvidenceSlotKind, id: string) => {
    try {
      await removeEvidence({ data: { id } });
      setEvidenceByKind((prev) => ({
        ...prev,
        [kind]: prev[kind].filter((r) => r.id !== id),
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  const addModule = () =>
    setModules((prev) => [...prev, { title: "", summary: "", hours: "" }]);
  const removeModule = (idx: number) =>
    setModules((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  const updateModule = (idx: number, patch: Partial<ModuleDraft>) =>
    setModules((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const evidenceIds = EVIDENCE_SLOTS.flatMap((s) =>
        evidenceByKind[s.kind].map((r) => r.id),
      );
      await submit({
        data: {
          proposed_title: title.trim(),
          proposed_level: proposedLevel ? Number(proposedLevel) : null,
          proposed_credential_type: credentialType || null,
          proposed_who_for: whoFor.trim(),
          proposed_learner_outcomes: outcomes.trim(),
          proposed_delivery_mode: delivery as DeliveryMode,
          proposed_total_hours: totalHoursNum,
          proposed_how_assessed: howAssessed.trim(),
          proposed_prerequisites: prerequisites.trim() || null,
          proposed_tutor_credentials: tutor.trim(),
          proposed_extra_notes: extra.trim() || null,
          spec_modules: validModules.map((m) => ({
            title: m.title.trim(),
            summary: m.summary.trim(),
            hours: m.hours.trim() ? Number(m.hours) : null,
          })),
          evidence_ids: evidenceIds,
          endorsement_terms_version: ENDORSEMENT_TERMS_VERSION,
          endorsement_terms_accepted: true,

        },
      });
      toast.success("Submitted for REPS admin review.");
      qc.invalidateQueries({ queryKey: ["my-reps-courses"] });
      resetAll();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle>Request REPS endorsement</DialogTitle>
          <DialogDescription>
            Submit your course for REPS endorsement. Answer in your own words and upload the
            supporting evidence below. A REPS admin will review your submission and confirm the
            level, official title and <span className="font-mono">REPS-QUAL-</span>number.
            We don't rewrite your course — we verify it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <FormField label="Working title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kettlebell Coach"
            />
            <FieldHelp>What you'd call it internally. REPS may refine the wording before publishing.</FieldHelp>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Proposed level">
              <Select value={proposedLevel} onValueChange={setProposedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Not sure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Level 2 — introductory</SelectItem>
                  <SelectItem value="3">Level 3 — practitioner (e.g. PT)</SelectItem>
                  <SelectItem value="4">Level 4 — advanced practitioner</SelectItem>
                  <SelectItem value="5">Level 5 — specialist</SelectItem>
                  <SelectItem value="6">Level 6 — degree-equivalent</SelectItem>
                  <SelectItem value="7">Level 7 — master's-equivalent</SelectItem>
                </SelectContent>
              </Select>
              <FieldHelp>What you think the course sits at. REPS admin confirms the final level.</FieldHelp>
            </FormField>

            <FormField label="Credential type">
              <Select
                value={credentialType}
                onValueChange={(v) => setCredentialType(v as typeof credentialType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not sure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="award">Award — short, single topic</SelectItem>
                  <SelectItem value="certificate">Certificate — full practitioner course</SelectItem>
                  <SelectItem value="diploma">Diploma — extended / multi-unit</SelectItem>
                  <SelectItem value="course">Course — CPD / short course</SelectItem>
                  <SelectItem value="not_sure">Not sure — REPS to advise</SelectItem>
                </SelectContent>
              </Select>
              <FieldHelp>How you'd like the endorsement titled (e.g. "Certificate in Kettlebell Coaching").</FieldHelp>
            </FormField>
          </div>


          <FormField label="Who this course is for" required>
            <Textarea
              value={whoFor}
              onChange={(e) => setWhoFor(e.target.value)}
              placeholder="e.g. New personal trainers who want to specialise in kettlebell coaching. No prior kettlebell experience assumed."
              rows={3}
              maxLength={4000}
            />
          </FormField>

          {/* ── Modules repeater ─────────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-end justify-between gap-2">
              <div>
                <Label className="block text-[12px] font-semibold text-white/80">
                  Modules <span className="text-red-300">*</span>
                </Label>
                <p className="mt-0.5 text-[11.5px] text-white/45">
                  List the modules or units that make up the course. Add as many as your course contains.
                </p>
              </div>
              <button
                type="button"
                onClick={addModule}
                className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-white/[0.04] px-2.5 py-1 text-[11.5px] font-semibold text-white/80 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add module
              </button>
            </div>
            <div className="space-y-2">
              {modules.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-[12px] border border-reps-border bg-white/[0.03] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                      Module {idx + 1}
                    </div>
                    {modules.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeModule(idx)}
                        className="text-white/40 hover:text-red-300"
                        aria-label={`Remove module ${idx + 1}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                    <Input
                      value={m.title}
                      onChange={(e) => updateModule(idx, { title: e.target.value })}
                      placeholder="Module title — e.g. Safe kettlebell handling"
                      maxLength={200}
                    />
                    <Input
                      value={m.hours}
                      onChange={(e) => updateModule(idx, { hours: e.target.value })}
                      placeholder="Hours (optional)"
                      inputMode="decimal"
                    />
                  </div>
                  <Textarea
                    value={m.summary}
                    onChange={(e) => updateModule(idx, { summary: e.target.value })}
                    placeholder="One-line summary of what this module covers."
                    rows={2}
                    maxLength={500}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <FormField label="What learners will be able to do afterwards" required>
            <Textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              placeholder="One outcome per line. e.g.\n- Coach a beginner through their first swing\n- Design a 6-week kettlebell programme"
              rows={5}
              maxLength={4000}
            />
          </FormField>

          <FormField label="How it's delivered" required>
            <RadioGroup
              value={delivery}
              onValueChange={(v) => setDelivery(v as DeliveryMode)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {DELIVERY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-[12px] border p-3 transition ${
                    delivery === opt.value
                      ? "border-reps-orange bg-reps-orange-soft/20"
                      : "border-reps-border bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white">{opt.label}</div>
                    <div className="text-[11.5px] text-white/55">{opt.help}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </FormField>

          <FormField label="Total learning hours" required>
            <Input
              type="number"
              min={0.5}
              max={2000}
              step={0.5}
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              placeholder="e.g. 40"
              className="max-w-[160px]"
            />
            <FieldHelp>Your estimate for a typical learner (tutor time + self-study).</FieldHelp>
          </FormField>

          <FormField label="How learners are assessed" required>
            <Textarea
              value={howAssessed}
              onChange={(e) => setHowAssessed(e.target.value)}
              placeholder="e.g. Written multiple-choice exam (30 questions, 70% pass) plus practical assessment observed by tutor."
              rows={3}
              maxLength={4000}
            />
          </FormField>

          <FormField label="Prerequisites" optional>
            <Textarea
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder="e.g. Level 2 Fitness Instructor qualification, aged 18+."
              rows={2}
              maxLength={2000}
            />
          </FormField>

          <FormField label="Tutor name & credentials" required>
            <Textarea
              value={tutor}
              onChange={(e) => setTutor(e.target.value)}
              placeholder="e.g. Sarah Jones — Level 4 Strength & Conditioning coach, 10 years' experience, StrongFirst SFG certified."
              rows={3}
              maxLength={4000}
            />
          </FormField>

          <FormField label="Anything else REPS should know" optional>
            <Textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="e.g. Insurance provider, awarding partners, unusual delivery arrangements."
              rows={3}
              maxLength={4000}
            />
          </FormField>

          {/* ── Evidence uploads ────────────────────────────────────── */}
          <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-white">
              <Paperclip className="h-3.5 w-3.5" />
              Supporting evidence
              <span className="ml-1 text-[11px] font-normal text-white/50">(all required)</span>
            </div>
            <p className="text-[11.5px] text-white/50">
              Four documents help us verify the course is real, taught at the level you're claiming
              and delivered by qualified people. Files are private to REPS admins.
            </p>
            <div className="mt-3 space-y-3">
              {EVIDENCE_SLOTS.map((slot) => {
                const files = evidenceByKind[slot.kind];
                const isUploadingThis = uploading === slot.kind;
                return (
                  <div key={slot.kind} className="rounded-[10px] border border-reps-border bg-white/[0.02] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                          {slot.label}
                          <span className="text-red-300">*</span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-white/50">{slot.help}</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-reps-border bg-white/[0.04] px-2.5 py-1 text-[11.5px] font-semibold text-white/85 hover:text-white">
                        {isUploadingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {isUploadingThis ? "Uploading…" : files.length > 0 ? "Add another" : "Upload"}
                        <input
                          type="file"
                          accept={slot.accept}
                          className="hidden"
                          disabled={isUploadingThis}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) void handleUpload(slot.kind, f);
                          }}
                        />
                      </label>
                    </div>
                    {files.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {files.map((f) => (
                          <li
                            key={f.id}
                            className="flex items-center justify-between gap-2 rounded-[8px] bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-white/80"
                          >
                            <div className="flex min-w-0 items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-white/50" />
                              <span className="truncate">{f.file_name}</span>
                              {f.file_size_bytes != null ? (
                                <span className="shrink-0 text-white/40">
                                  {(f.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvidence(slot.kind, f.id)}
                              className="text-white/40 hover:text-red-300"
                              aria-label={`Remove ${f.file_name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Terms acceptance ──────────────────────────────────────── */}
          <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-reps-border bg-white/[0.02] p-3 text-[12.5px] text-white/80">
            <Checkbox
              checked={termsAgreed}
              onCheckedChange={(v) => setTermsAgreed(v === true)}
              className="mt-0.5"
            />
            <span>
              I have read and accept the{" "}
              <Link
                to="/legal/endorsement-terms"
                target="_blank"
                className="font-semibold text-reps-orange underline-offset-4 hover:underline"
              >
                REPS Endorsement Terms ({ENDORSEMENT_TERMS_VERSION})
              </Link>
              .
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for endorsement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-[12px] font-semibold text-white/80">
        {label}{" "}
        {required ? <span className="text-red-300">*</span> : null}
        {optional ? <span className="text-white/40 font-normal">(optional)</span> : null}
      </Label>
      {children}
    </div>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11.5px] text-white/45">{children}</p>;
}


function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
