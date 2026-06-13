/**
 * Trust block — the canonical "verification" surface for every paying member.
 *
 * Lives on `/dashboard/profile`. Tier-blind: identical UI and behaviour for
 * Verified and Pro members. Three ticks:
 *   1. Identity      — Stripe Identity approved
 *   2. Insurance     — active policy, not expired
 *   3. Qualifications — ≥1 approved cert (managed on /dashboard/cpd)
 *
 * `getTrustState` is the single read for the status strip. The Identity and
 * Insurance cards keep their own queries for the form state required to
 * submit; the read used for the badge in those cards is reconciled with
 * `getTrustState` on the parent.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { myIdentity, saveIdentity } from "@/lib/verification/identity.functions";
import { createStripeIdentitySession } from "@/lib/verification/stripe-identity.functions";
import {
  myInsurance,
  saveInsurance,
  uploadVerificationAsset,
} from "@/lib/verification/insurance.functions";
import { getTrustState } from "@/lib/verification/trust.functions";

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

/* -------------------------------------------------------------------------- */
/* Top-level block                                                            */
/* -------------------------------------------------------------------------- */

type StripeIdentitySearch = { stripe_identity?: string };

export function TrustBlock() {
  const qc = useQueryClient();
  const router = useRouter();
  const search = useSearch({ strict: false }) as StripeIdentitySearch;

  const fetchTrust = useServerFn(getTrustState);
  const fetchIdentity = useServerFn(myIdentity);
  const fetchInsurance = useServerFn(myInsurance);

  const trust = useQuery({ queryKey: ["my-trust-state"], queryFn: () => fetchTrust() });
  const identity = useQuery({ queryKey: ["my-identity"], queryFn: () => fetchIdentity() });
  const insurance = useQuery({ queryKey: ["my-insurance"], queryFn: () => fetchInsurance() });

  // Handle Stripe Identity redirect back to Public Profile.
  useEffect(() => {
    if (search.stripe_identity === "complete") {
      qc.invalidateQueries({ queryKey: ["my-identity"] });
      qc.invalidateQueries({ queryKey: ["my-trust-state"] });
      toast.success("ID check submitted — we'll confirm shortly.");
      router.navigate({
        to: "/dashboard/profile",
        search: {},
        hash: "identity",
        replace: true,
      });
      // Scroll to identity section
      setTimeout(() => {
        document.getElementById("identity")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.stripe_identity]);

  // Poll while Stripe Identity is pending.
  const pendingStripe =
    identity.data?.vendor === "stripe" && identity.data?.status === "pending";
  useQuery({
    queryKey: ["identity-poll", identity.data?.id],
    queryFn: async () => {
      await qc.invalidateQueries({ queryKey: ["my-identity"] });
      await qc.invalidateQueries({ queryKey: ["my-trust-state"] });
      return true;
    },
    enabled: !!pendingStripe,
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });

  const t = trust.data;
  const checks = [
    { key: "identity", label: "Identity", done: !!t?.ticks.identity, pending: t?.identity.status === "pending" },
    { key: "insurance", label: "Insurance", done: !!t?.ticks.insurance, pending: t?.insurance.status === "pending" },
    {
      key: "qualifications",
      label: "Qualifications",
      done: !!t?.ticks.qualifications,
      pending: false,
    },
  ];
  const completed = t?.completedCount ?? 0;
  const allDone = completed === 3;

  return (
    <div className="flex flex-col gap-4">
      {/* Status strip */}
      <PCard>
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                allDone ? "bg-emerald-500/15 text-emerald-300" : "bg-reps-orange-soft text-reps-orange"
              }`}
            >
              <ShieldCheck className="h-7 w-7" />
            </span>
            <div>
              <div className="font-display text-[20px] font-bold text-white">
                {allDone ? "Fully verified" : `${completed} of 3 complete`}
              </div>
              <div className="text-[12px] text-white/55">
                {allDone
                  ? "All three checks passed — your profile carries every trust mark."
                  : "Complete each check below to earn the full trust badge."}
              </div>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {checks.map((c) => (
              <a
                href={`#${c.key}`}
                key={c.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  c.done
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : c.pending
                      ? "border border-amber-400/30 bg-amber-500/15 text-amber-300"
                      : "border border-white/10 bg-white/5 text-white/55"
                }`}
              >
                {c.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </PCard>

      <section id="identity" className="scroll-mt-24">
        <IdentityCard
          identity={identity.data}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["my-identity"] });
            qc.invalidateQueries({ queryKey: ["my-trust-state"] });
          }}
        />
      </section>
      <section id="insurance" className="scroll-mt-24">
        <InsuranceCard
          insurance={insurance.data}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["my-insurance"] });
            qc.invalidateQueries({ queryKey: ["my-trust-state"] });
          }}
        />
      </section>
      <section id="qualifications" className="scroll-mt-24">
        <QualificationsSummaryCard
          count={t?.qualifications.count ?? 0}
          titles={t?.qualifications.titles ?? []}
        />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
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
  stripe_vs_id?: string | null;
  stripe_vs_url?: string | null;
  stripe_status?: string | null;
  stripe_reason?: string | null;
  created_at?: string | null;
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
  const startStripe = useServerFn(createStripeIdentitySession);
  const [docType, setDocType] = useState<"passport" | "driving_licence" | "national_id">("passport");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [frontPath, setFrontPath] = useState<string | null>(null);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const stripeId = useMutation({
    mutationFn: async () => startStripe({ data: { return_path: "/dashboard/profile" } }),
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
    const isStripe = identity.vendor === "stripe";
    const stripeInProgress =
      isStripe && identity.status === "pending" && !!identity.stripe_vs_url;

    const badgeLabel =
      identity.status === "approved"
        ? "ID-checked"
        : identity.status === "rejected"
          ? "Rejected"
          : identity.status === "needs_more_info"
            ? "More info needed"
            : identity.status === "expired"
              ? "Expired"
              : "In review";

    const badgeClass =
      identity.status === "approved"
        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
        : identity.status === "rejected" || identity.status === "expired"
          ? "border-red-400/30 bg-red-500/15 text-red-300"
          : "border-amber-400/30 bg-amber-500/15 text-amber-300";

    const reason = identity.admin_note || identity.stripe_reason;

    return (
      <PPanel className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-bold text-white">Identity</h3>
            <p className="mt-1 text-[12px] text-white/55">
              {isStripe ? "Stripe Identity check" : identity.doc_type || "Document"} · {identity.name_on_doc || "—"}
            </p>
          </div>
          <Badge variant="neutral" className={badgeClass}>{badgeLabel}</Badge>
        </div>
        {reason && (
          <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{reason}</span>
          </div>
        )}
        {identity.status === "pending" && !reason && (() => {
          const ageMs = identity.created_at ? Date.now() - new Date(identity.created_at).getTime() : 0;
          const overTenMin = ageMs > 10 * 60 * 1000;
          return (
            <div className="mt-3 rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/65">
              Usually takes 1–5 minutes — refresh or check back shortly.
              {overTenMin && (
                <>
                  {" "}
                  <a href="mailto:support@repsuk.org" className="text-reps-orange hover:underline">
                    Taking longer than expected? Contact support.
                  </a>
                </>
              )}
            </div>
          );
        })()}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {stripeInProgress && identity.stripe_vs_url && (
            <a
              href={identity.stripe_vs_url}
              className="inline-flex h-9 items-center justify-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white"
            >
              Continue ID check
            </a>
          )}
          {(identity.status === "rejected" ||
            identity.status === "needs_more_info" ||
            identity.status === "expired") && (
            <Button
              variant="primary"
              size="md"
              disabled={stripeId.isPending}
              onClick={() => stripeId.mutate()}
            >
              {stripeId.isPending ? <Loader2 className="size-4 animate-spin" /> : "Restart ID check"}
            </Button>
          )}
        </div>
      </PPanel>
    );
  }

  if (!useManual) {
    return (
      <PPanel className="p-5">
        <h3 className="font-display text-[16px] font-bold text-white">Identity</h3>
        <p className="mt-1 text-[12px] text-white/55">
          We use Stripe Identity to confirm your ID with a 60-second photo + selfie check. Encrypted, never shown on your profile.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="primary"
            size="md"
            disabled={stripeId.isPending}
            onClick={() => stripeId.mutate()}
          >
            {stripeId.isPending ? <Loader2 className="size-4 animate-spin" /> : "Start ID check"}
          </Button>
          <button
            type="button"
            onClick={() => setUseManual(true)}
            className="text-[12px] text-white/55 underline-offset-2 hover:text-white/80 hover:underline sm:ml-2"
          >
            Upload manually instead
          </button>
        </div>
      </PPanel>
    );
  }

  return (
    <PPanel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[16px] font-bold text-white">Identity (manual)</h3>
          <p className="mt-1 text-[12px] text-white/55">
            Upload a government-issued photo ID and a selfie. Reviewed within 24 hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUseManual(false)}
          className="text-[12px] text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
        >
          Use Stripe Identity instead
        </button>
      </div>
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
/* Insurance                                                                  */
/* -------------------------------------------------------------------------- */

function InsuranceCard({
  insurance,
  onSaved,
}: {
  insurance:
    | {
        id: string;
        status: string;
        provider: string;
        expiry_date: string;
        cover_amount_gbp?: number | null;
        admin_note?: string | null;
      }
    | null
    | undefined;
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
        Public liability insurance — £1m minimum cover recommended. Unlocks the Insured tick on your profile.
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
/* Qualifications — read-only summary; manage lives on /dashboard/cpd          */
/* -------------------------------------------------------------------------- */

function QualificationsSummaryCard({
  count,
  titles,
}: {
  count: number;
  titles: string[];
}) {
  return (
    <PPanel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[16px] font-bold text-white">Qualifications</h3>
          <p className="mt-1 text-[12px] text-white/55">
            {count === 0
              ? "No qualifications approved yet — upload your first certificate to set your public title."
              : `${count} approved · ${titles.length > 0 ? titles.join(" · ") : "Earned titles will appear here"}`}
          </p>
        </div>
        <Button variant="subtle" size="sm" asChild>
          <Link to="/dashboard/cpd">
            Manage on Education &amp; CPD
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      </div>
    </PPanel>
  );
}
