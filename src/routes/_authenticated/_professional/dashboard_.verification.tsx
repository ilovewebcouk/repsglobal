import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Shield,
  ShieldCheck,
  Upload,
  UserCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { myIdentity, saveIdentity } from "@/lib/verification/identity.functions";
import { createVeriffSession } from "@/lib/verification/veriff.functions";
import {
  myInsurance,
  saveInsurance,
  uploadVerificationAsset,
} from "@/lib/verification/insurance.functions";
import { myVerificationSubmissions } from "@/lib/verification/verification.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/verification")({
  head: () => ({
    meta: [
      { title: "Verification — REPS Professional" },
      { name: "description", content: "Upload your ID, insurance and qualifications to verify your REPS profile." },
    ],
    links: [{ rel: "canonical", href: "/dashboard/verification" }],
  }),
  component: VerificationPage,
});

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

type Step = { key: string; label: string; done: boolean; pending?: boolean; required?: boolean };

function VerificationPage() {
  const qc = useQueryClient();
  const fetchIdentity = useServerFn(myIdentity);
  const fetchInsurance = useServerFn(myInsurance);
  const fetchCerts = useServerFn(myVerificationSubmissions);

  const identity = useQuery({ queryKey: ["my-identity"], queryFn: () => fetchIdentity() });
  const insurance = useQuery({ queryKey: ["my-insurance"], queryFn: () => fetchInsurance() });
  const certs = useQuery({ queryKey: ["my-verification-subs"], queryFn: () => fetchCerts() });

  const idDone = !!identity.data;
  const idApproved = identity.data?.status === "approved";
  const selfieDone = !!identity.data?.selfie_path;
  const insDone = !!insurance.data;
  const insApproved = insurance.data?.status === "active";
  const certDone = (certs.data ?? []).length > 0;
  const certApproved = (certs.data ?? []).some((c) => c.status === "approved");

  const steps: Step[] = [
    { key: "identity", label: "Photo ID", done: idApproved, pending: idDone && !idApproved, required: true },
    { key: "selfie", label: "Selfie", done: selfieDone, required: true },
    { key: "cert", label: "Qualification", done: certApproved, pending: certDone && !certApproved, required: true },
    { key: "insurance", label: "Insurance", done: insApproved, pending: insDone && !insApproved, required: false },
  ];
  const completed = steps.filter((s) => s.done).length;

  return (
    <DashboardShell
      role="trainer"
      active="Verification"
      title="Verification"
      subtitle="Upload your ID, qualification and insurance. We'll review within 24 hours."
    >
      {/* Progress strip */}
      <PCard>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-reps-orange-soft">
              <ShieldCheck className="h-6 w-6 text-reps-orange" />
            </span>
            <div>
              <div className="font-display text-[18px] font-bold text-white">
                {completed === steps.length ? "Fully verified" : `${completed} of ${steps.length} complete`}
              </div>
              <div className="text-[12px] text-white/55">
                {completed === steps.length
                  ? "All checks passed. You're on the public register."
                  : idApproved && certApproved
                    ? "Verified tier active. Add insurance to unlock Pro."
                    : "Complete each step to get verified."}
              </div>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {steps.map((s) => (
              <span
                key={s.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  s.done
                    ? "bg-emerald-500/15 text-emerald-300"
                    : s.pending
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-white/5 text-white/55"
                }`}
              >
                {s.done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </PCard>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <IdentityCard
          identity={identity.data}
          onSaved={() => qc.invalidateQueries({ queryKey: ["my-identity"] })}
        />
        <InsuranceCard
          insurance={insurance.data}
          onSaved={() => qc.invalidateQueries({ queryKey: ["my-insurance"] })}
        />
        <CertCard certs={certs.data ?? []} />
        <TierUnlockCard
          identityApproved={idApproved}
          certApproved={certApproved}
          insApproved={insApproved}
        />
      </div>
    </DashboardShell>
  );
}

/* -------------------------------------------------------------------------- */

type IdentityRow = {
  id: string;
  status: string;
  vendor?: string | null;
  doc_type?: string | null;
  doc_path_front?: string | null;
  selfie_path?: string | null;
  name_on_doc?: string | null;
  dob_on_doc?: string | null;
  admin_note?: string | null;
  veriff_session_url?: string | null;
  veriff_status?: string | null;
  veriff_reason?: string | null;
};

function IdentityCard({
  identity,
  onSaved,
}: {
  identity: IdentityRow | null | undefined;
  onSaved: () => void;
}) {
  const upload = useServerFn(uploadVerificationAsset);
  const save = useServerFn(saveIdentity);
  const startVeriff = useServerFn(createVeriffSession);
  const [docType, setDocType] = useState<"passport" | "driving_licence" | "national_id">("passport");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [frontPath, setFrontPath] = useState<string | null>(null);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const veriff = useMutation({
    mutationFn: async () => startVeriff({ data: {} }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't start ID check"),
  });

  const onPickFront = async (f: File) => {
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(f);
      const { path } = await upload({ data: { bucket: "identity-docs", file_data_url: dataUrl, filename: f.name } });
      setFrontPath(path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  const onPickSelfie = async (f: File) => {
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(f);
      const { path } = await upload({ data: { bucket: "identity-docs", file_data_url: dataUrl, filename: f.name } });
      setSelfiePath(path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!frontPath) throw new Error("Photo ID required");
      if (!selfiePath) throw new Error("Selfie required");
      if (!name.trim()) throw new Error("Name on document required");
      await save({
        data: {
          doc_type: docType,
          doc_path_front: frontPath,
          selfie_path: selfiePath,
          name_on_doc: name.trim(),
          dob_on_doc: dob || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Identity submitted");
      onSaved();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (identity) {
    const isVeriff = identity.vendor === "veriff";
    const inProgress = identity.status === "pending" && isVeriff && identity.veriff_status !== "submitted";
    return (
      <PPanel className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-bold text-white">Identity</h3>
            <p className="mt-1 text-[12px] text-white/55">
              {isVeriff ? "Veriff ID check" : identity.doc_type || "Document"} · {identity.name_on_doc || "—"}
            </p>
          </div>
          <Badge
            variant="neutral"
            className={
              identity.status === "approved"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                : identity.status === "rejected" || identity.status === "expired"
                  ? "border-red-400/30 bg-red-500/15 text-red-300"
                  : identity.status === "needs_more_info"
                    ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
                    : "border-amber-400/30 bg-amber-500/15 text-amber-300"
            }
          >
            {identity.status === "approved"
              ? "ID-checked"
              : identity.status === "rejected"
                ? "Rejected"
                : identity.status === "needs_more_info"
                  ? "More info needed"
                  : identity.status === "expired"
                    ? "Expired"
                    : "In review"}
          </Badge>
        </div>
        {(identity.admin_note || identity.veriff_reason) && (
          <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{identity.admin_note || identity.veriff_reason}</span>
          </div>
        )}
        {inProgress && identity.veriff_session_url && (
          <a
            href={identity.veriff_session_url}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white"
          >
            Continue ID check
          </a>
        )}
        {(identity.status === "rejected" || identity.status === "needs_more_info" || identity.status === "expired") && (
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            disabled={veriff.isPending}
            onClick={() => veriff.mutate()}
          >
            {veriff.isPending ? <Loader2 className="size-4 animate-spin" /> : "Restart ID check"}
          </Button>
        )}
      </PPanel>
    );
  }

  return (
    <PPanel className="p-5">
      <h3 className="font-display text-[16px] font-bold text-white">Identity</h3>
      <p className="mt-1 text-[12px] text-white/55">
        Upload a government-issued photo ID and a selfie. We never share these — they're used for verification only.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[12px] text-white/65">Document type</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {(
              [
                ["passport", "Passport"],
                ["driving_licence", "Driving licence"],
                ["national_id", "National ID"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setDocType(k)}
                className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold ${
                  docType === k ? "bg-reps-orange text-white" : "bg-white/5 text-white/65"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[12px] text-white/65">Full name on document</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="As shown on ID" />
          </div>
          <div>
            <label className="text-[12px] text-white/65">Date of birth</label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <FileSlot
            label="Photo of ID"
            icon={FileText}
            done={!!frontPath}
            onClick={() => frontRef.current?.click()}
          />
          <FileSlot
            label="Selfie"
            icon={UserCircle}
            done={!!selfiePath}
            onClick={() => selfieRef.current?.click()}
          />
          <input
            ref={frontRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPickFront(e.target.files[0])}
          />
          <input
            ref={selfieRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPickSelfie(e.target.files[0])}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={busy || submit.isPending}
          onClick={() => submit.mutate()}
          className="w-full"
        >
          {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit for verification"}
        </Button>
      </div>
    </PPanel>
  );
}

function FileSlot({
  label,
  icon: Icon,
  done,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-24 flex-col items-center justify-center gap-1.5 rounded-[12px] border-2 border-dashed text-[12px] transition ${
        done
          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
          : "border-white/15 bg-white/[0.02] text-white/65 hover:border-reps-orange hover:text-reps-orange"
      }`}
    >
      {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      <span className="font-semibold">{done ? `${label} uploaded` : label}</span>
      {!done && <span className="text-[10px] text-white/45">Click to upload</span>}
    </button>
  );
}

/* -------------------------------------------------------------------------- */

function InsuranceCard({
  insurance,
  onSaved,
}: {
  insurance: { id: string; status: string; provider: string; expiry_date: string; cover_amount_gbp?: number | null; admin_note?: string | null } | null | undefined;
  onSaved: () => void;
}) {
  const upload = useServerFn(uploadVerificationAsset);
  const save = useServerFn(saveInsurance);
  const [provider, setProvider] = useState("");
  const [policy, setPolicy] = useState("");
  const [cover, setCover] = useState<string>("");
  const [expiry, setExpiry] = useState("");
  const [docPath, setDocPath] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (f: File) => {
    try {
      const dataUrl = await fileToDataUrl(f);
      const { path } = await upload({ data: { bucket: "insurance-docs", file_data_url: dataUrl, filename: f.name } });
      setDocPath(path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!provider.trim()) throw new Error("Provider required");
      if (!expiry) throw new Error("Expiry date required");
      if (!docPath) throw new Error("Certificate upload required");
      await save({
        data: {
          provider: provider.trim(),
          policy_number: policy.trim() || null,
          cover_amount_gbp: cover ? Math.round(parseFloat(cover) * 1_000_000) : null,
          expiry_date: expiry,
          doc_path: docPath,
        },
      });
    },
    onSuccess: () => {
      toast.success("Insurance submitted");
      onSaved();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (insurance) {
    return (
      <PPanel className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-bold text-white">Insurance</h3>
            <p className="mt-1 text-[12px] text-white/55">
              {insurance.provider} · expires {insurance.expiry_date}
              {insurance.cover_amount_gbp ? ` · £${insurance.cover_amount_gbp.toLocaleString()} cover` : ""}
            </p>
          </div>
          <Badge
            variant="neutral"
            className={
              insurance.status === "active"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                : insurance.status === "rejected"
                  ? "border-red-400/30 bg-red-500/15 text-red-300"
                  : "border-amber-400/30 bg-amber-500/15 text-amber-300"
            }
          >
            {insurance.status}
          </Badge>
        </div>
        {insurance.admin_note && (
          <div className="mt-3 rounded-[10px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
            {insurance.admin_note}
          </div>
        )}
      </PPanel>
    );
  }

  return (
    <PPanel className="p-5">
      <h3 className="font-display text-[16px] font-bold text-white">Insurance</h3>
      <p className="mt-1 text-[12px] text-white/55">
        Public liability insurance — required for the Pro tier. £1m minimum cover recommended.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[12px] text-white/65">Provider</label>
          <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Insure4Sport" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[12px] text-white/65">Policy number</label>
            <Input value={policy} onChange={(e) => setPolicy(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="text-[12px] text-white/65">Cover (£m)</label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>
        <div>
          <label className="text-[12px] text-white/65">Expiry date</label>
          <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <FileSlot label="Insurance certificate" icon={Upload} done={!!docPath} onClick={() => fileRef.current?.click()} />
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
        />
        <Button
          variant="primary"
          size="md"
          disabled={submit.isPending}
          onClick={() => submit.mutate()}
          className="w-full"
        >
          {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit insurance"}
        </Button>
      </div>
    </PPanel>
  );
}

/* -------------------------------------------------------------------------- */

function CertCard({ certs }: { certs: ReadonlyArray<{ id: string; qualification: string; status: string }> }) {
  return (
    <PPanel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[16px] font-bold text-white">Qualifications</h3>
          <p className="mt-1 text-[12px] text-white/55">
            Upload your Level 2 / 3 / 4 certificates. Once verified your title is set automatically.
          </p>
        </div>
        <Button variant="subtle" size="sm" asChild>
          <Link to="/dashboard/cpd">Manage</Link>
        </Button>
      </div>
      {certs.length === 0 ? (
        <div className="mt-4 rounded-[12px] border-2 border-dashed border-white/15 px-4 py-6 text-center text-[12px] text-white/55">
          No certificates yet — head to Education & CPD to upload your first one.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {certs.slice(0, 3).map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-[10px] bg-white/[0.03] px-3 py-2 text-[12px]">
              <span className="truncate text-white/80">{c.qualification}</span>
              <Badge
                variant="neutral"
                className={
                  c.status === "approved"
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : c.status === "rejected"
                      ? "border-red-400/30 bg-red-500/15 text-red-300"
                      : "border-amber-400/30 bg-amber-500/15 text-amber-300"
                }
              >
                {c.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </PPanel>
  );
}

/* -------------------------------------------------------------------------- */

function TierUnlockCard({
  identityApproved,
  certApproved,
  insApproved,
}: {
  identityApproved: boolean;
  certApproved: boolean;
  insApproved: boolean;
}) {
  const verified = identityApproved && certApproved;
  const pro = verified && insApproved;
  return (
    <PPanel className="p-5">
      <h3 className="font-display text-[16px] font-bold text-white">What you unlock</h3>
      <div className="mt-3 space-y-3">
        <TierRow
          icon={ShieldCheck}
          label="Verified"
          price="£99/yr"
          unlocked={verified}
          requirements={[
            { label: "Photo ID + selfie", done: identityApproved },
            { label: "Qualification", done: certApproved },
          ]}
        />
        <TierRow
          icon={Shield}
          label="Pro (Founding)"
          price="£59/mo"
          unlocked={pro}
          requirements={[
            { label: "Verified status", done: verified },
            { label: "Public liability insurance", done: insApproved },
          ]}
        />
      </div>
    </PPanel>
  );
}

function TierRow({
  icon: Icon,
  label,
  price,
  unlocked,
  requirements,
}: {
  icon: React.ElementType;
  label: string;
  price: string;
  unlocked: boolean;
  requirements: { label: string; done: boolean }[];
}) {
  return (
    <div className={`rounded-[12px] border px-3 py-3 ${unlocked ? "border-emerald-400/30 bg-emerald-500/10" : "border-reps-border bg-white/[0.02]"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${unlocked ? "text-emerald-300" : "text-white/55"}`} />
          <span className="font-semibold text-white">{label}</span>
          <span className="text-[12px] text-white/55">· {price}</span>
        </div>
        {unlocked && (
          <Badge variant="neutral" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
            Unlocked
          </Badge>
        )}
      </div>
      <ul className="mt-2 space-y-1 text-[12px] text-white/70">
        {requirements.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5">
            {r.done ? <CheckCircle2 className="h-3 w-3 text-emerald-300" /> : <Circle className="h-3 w-3 text-white/35" />}
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
