/**
 * /dashboard/qualifications — provider qualifications & REPS-accredited courses.
 *
 * Two sub-flows behind a single unified list:
 *   A. Regulated qualifications we deliver (Ofqual) — pick from catalogue,
 *      upload EQA report / centre certificate / approval letter, admin approves.
 *   B. REPS-accredited courses — provider uploads syllabus + assessment
 *      criteria + tutor CV; AI drafts the full spec; admin edits and
 *      publishes; row gets a global REPS-QUAL-NNNNNN number.
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
} from "@/lib/qualifications/qualifications.functions";
import type {
  RepsCourseRow,
  RegulatedPermissionRow,
} from "@/lib/qualifications/qualifications.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/qualifications")({
  head: () => ({
    meta: [
      { title: "Qualifications & Courses — REPS Provider" },
      {
        name: "description",
        content:
          "Prove you're approved to deliver regulated qualifications and get your courses REPS-accredited.",
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
      subtitle="One list for both regulated qualifications you're approved to deliver and courses you'd like REPS to accredit."
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
              Add your first — we'll ask whether it's an Ofqual-regulated qualification you deliver, or a course you'd like REPS to accredit.
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
                <span className="text-[14px] font-semibold text-white">REPS-accredited course</span>
              </div>
              <p className="mt-1 text-[12.5px] text-white/60">
                I've built my own course and want REPS to accredit it. You'll provide a syllabus, assessment criteria, and tutor CV.
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
          {row.admin_note && !isWithdrawn ? (
            <div className="mt-2 rounded-[10px] border border-amber-500/25 bg-amber-500/10 p-2.5 text-[12px] text-amber-200">
              <span className="font-semibold">Admin note:</span> {row.admin_note}
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

/* ─── CPD ───────────────────────────────────────────────────────────────── */


function CpdRow({ row }: { row: CpdCourseRow }) {
  const qc = useQueryClient();
  const remove = useServerFn(deleteMyCpdCourse);
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
      qc.invalidateQueries({ queryKey: ["my-cpd-courses"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Remove failed"),
  });

  return (
    <li>
      <PCard className={`flex items-start gap-4 ${isWithdrawn ? "opacity-60" : ""}`}>
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
          {row.admin_note && !isWithdrawn ? (
            <div className="mt-2 rounded-[10px] border border-amber-500/25 bg-amber-500/10 p-2.5 text-[12px] text-amber-200">
              <span className="font-semibold">Admin note:</span> {row.admin_note}
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
                ? `“${row.title}” will disappear from your public profile immediately. REPs keeps a record for audit purposes.`
                : "This cannot be undone. The uploaded evidence will also be deleted."}
            </DialogDescription>
          </DialogHeader>
          {isApproved ? (
            <div className="space-y-2">
              <Label htmlFor="withdraw-cpd-reason" className="text-[12px] text-white/70">
                Reason (optional)
              </Label>
              <Textarea
                id="withdraw-cpd-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Course no longer offered, content retired…"
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
  if (status === "withdrawn")
    return (
      <Badge className="border-white/15 bg-white/5 text-white/60">
        Withdrawn
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
          <DialogTitle>Request REPS accreditation</DialogTitle>
          <DialogDescription>
            Submit your course syllabus, assessment criteria and tutor CV. Approved courses receive
            a REPS accreditation number and the accredited badge.
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
