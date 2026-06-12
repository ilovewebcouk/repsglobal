import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar as CalendarIcon,
  ExternalLink,
  GraduationCap,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { CertificateCard, type CertRow } from "@/components/cpd/CertificateCard";
import { UploadCertificateDialog } from "@/components/cpd/UploadCertificateDialog";
import { myCertificates, deletePendingCertificate } from "@/lib/cpd/cpd.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/cpd")({
  head: () => ({
    meta: [
      { title: "Education & CPD — REPS Professional" },
      { name: "description", content: "Upload certificates and track your verified qualifications." },
    ],
    links: [{ rel: "canonical", href: "/dashboard/cpd" }],
  }),
  component: CpdPage,
});

const COURSES = [
  { name: "Behaviour Change for Coaches", provider: "Mac-Nutrition Uni", date: "12 Jun 2026", points: 8, format: "Online · live" },
  { name: "Lower-back Pain Programming", provider: "REPS Academy", date: "24 Jun 2026", points: 6, format: "In-person · Manchester" },
  { name: "Strength Coaching Symposium", provider: "UKSCA", date: "10 Jul 2026", points: 14, format: "In-person · Loughborough" },
  { name: "Menopause & Strength Training", provider: "Girls Gone Strong", date: "22 Jul 2026", points: 5, format: "Online · self-paced" },
];

const LOG = [
  { title: "Read: ACSM update on Z2 cardio", points: 1, date: "29 May" },
  { title: "Webinar: Velocity-based training intro", points: 2, date: "24 May" },
  { title: "Course: Behaviour change foundations", points: 4, date: "18 May" },
  { title: "Podcast: Strength & ageing roundtable", points: 1, date: "12 May" },
  { title: "Workshop: Coaching cues for the squat", points: 3, date: "04 May" },
];

function Ring({ pct, value, label }: { pct: number; value: string; label: string }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--reps-border)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--reps-orange)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-[28px] font-bold text-white">{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/55">{label}</div>
      </div>
    </div>
  );
}

function CpdPage() {
  const tier = useTrainerTier();
  const [uploadOpen, setUploadOpen] = useState(false);
  const qc = useQueryClient();

  const fetchCerts = useServerFn(myCertificates);
  const deleteCert = useServerFn(deletePendingCertificate);

  const { data: certs = [] } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: () => fetchCerts(),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCert({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed.");
      void qc.invalidateQueries({ queryKey: ["my-certificates"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const certRows = certs as unknown as CertRow[];
  const approvedCount = certRows.filter((c) => c.status === "approved").length;
  const pendingCount = certRows.filter(
    (c) => c.status === "submitted" || c.status === "changes_requested",
  ).length;

  return (
    <DashboardShell
      role="trainer"
      tier={tier === "verified" ? "verified" : "pro"}
      active="Education & CPD"
      title="Education & CPD"
      subtitle="Upload certificates to get verified — then keep them current."
      actions={
        <>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            <Upload className="h-4 w-4" />
            Upload certificate
          </button>
        </>
      }
    >
      <UploadCertificateDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmitted={() => void qc.invalidateQueries({ queryKey: ["my-certificates"] })}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel className="p-5">
            <div className="flex flex-wrap items-center gap-6">
              <Ring
                pct={Math.min(100, approvedCount * 25)}
                value={String(approvedCount)}
                label="verified"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-white">Verification status</h3>
                  {approvedCount > 0 ? (
                    <span className="flex h-5 items-center gap-1 rounded-full bg-emerald-500/12 px-2 text-[10px] font-semibold text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="flex h-5 items-center rounded-full bg-amber-500/12 px-2 text-[10px] font-semibold text-amber-300">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-white/65">
                  {approvedCount === 0
                    ? "Upload your first certificate to start the verification process."
                    : `You have ${approvedCount} verified qualification${approvedCount === 1 ? "" : "s"} on your public profile.`}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { label: "Verified", value: String(approvedCount) },
                    { label: "Pending review", value: String(pendingCount) },
                    { label: "Total uploads", value: String(certRows.length) },
                  ].map((s) => (
                    <div key={s.label} className="rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{s.label}</div>
                      <div className="mt-0.5 text-[14px] font-bold text-white">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PPanel>

          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Certificates & qualifications</h3>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {certRows.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="text-[14px] font-semibold text-white">No certificates yet</div>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-white/55">
                  Drop a PDF or photo of your certificate. Our AI reads it, you confirm, and a REPs admin verifies it — usually within 24h.
                </p>
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="mx-auto mt-4 flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  <Upload className="size-4" />
                  Upload your first certificate
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
                {certRows.map((c) => (
                  <CertificateCard key={c.id} cert={c} onDelete={(id) => del.mutate(id)} />
                ))}
              </ul>
            )}
          </PPanel>

          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Upcoming courses</h3>
              <button type="button" className="flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white">
                Browse REPS Academy <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="divide-y divide-reps-border/60">
              {COURSES.map((c) => (
                <li key={c.name} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-reps-orange-soft text-reps-orange">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white">{c.name}</div>
                    <div className="text-[12px] text-white/55">{c.provider} · {c.format}</div>
                  </div>
                  <div className="text-right text-[12px]">
                    <div className="font-semibold text-white">{c.date}</div>
                    <div className="text-reps-orange">{c.points} pts</div>
                  </div>
                  <button type="button" className="flex h-8 items-center rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                    Enrol
                  </button>
                </li>
              ))}
            </ul>
          </PPanel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-4">
          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Activity log</h3>
              <span className="text-[12px] text-white/55">11 entries</span>
            </div>
            <ul className="divide-y divide-reps-border/60">
              {LOG.map((l) => (
                <li key={l.title} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-reps-panel-soft text-reps-orange">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white">{l.title}</div>
                    <div className="flex items-center gap-2 text-[11px] text-white/55">
                      <CalendarIcon className="h-3 w-3" /> {l.date}
                    </div>
                  </div>
                  <span className="text-[12px] font-semibold text-reps-orange">+{l.points} pts</span>
                </li>
              ))}
            </ul>
          </PPanel>

          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">AI learning plan</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                  Based on your client mix (60% strength, 25% performance, 15% rehab), prioritise the Lower-back Programming course and a behaviour-change module to close out your cycle.
                </p>
                <button type="button" className="mt-3 flex h-8 items-center rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                  Build my plan
                </button>
              </div>
            </div>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">REPS membership</h3>
            <p className="mt-1 text-[12px] text-white/55">
              {approvedCount > 0 ? "Verified Professional" : "Unverified — upload a certificate"}
            </p>
            <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3 text-[12px]">
              <div className="flex justify-between text-white/65"><span>Insurance</span><span className="text-white/45">Not yet provided</span></div>
              <div className="mt-1 flex justify-between text-white/65"><span>DBS check</span><span className="text-white/45">Not yet provided</span></div>
              <div className="mt-1 flex justify-between text-white/65"><span>First-aid</span><span className="text-white/45">Not yet provided</span></div>
            </div>
          </PCard>
        </div>
      </div>
    </DashboardShell>
  );
}
