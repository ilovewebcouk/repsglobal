import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { CertificateCard, type CertRow } from "@/components/cpd/CertificateCard";
import { UploadCertificateDialog } from "@/components/cpd/UploadCertificateDialog";
import { EarnedTitlesPanel } from "@/components/cpd/EarnedTitlesPanel";
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
      subtitle="Upload certificates, earn titles, keep them current."
      actions={
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
        >
          <Upload className="h-4 w-4" />
          Upload certificate
        </button>
      }
    >
      <UploadCertificateDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmitted={() => void qc.invalidateQueries({ queryKey: ["my-certificates"] })}
      />

      <div className="space-y-6">
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

        <EarnedTitlesPanel />

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
      </div>
    </DashboardShell>
  );
}
