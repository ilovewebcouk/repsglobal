import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Landmark, Loader2, Lock, Sparkles, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { AWARDING_BODIES, OFQUAL_QUAL_NO_REGEX } from "@/lib/cpd/awarding-bodies";
import {
  extractCertificateFields,
  submitCertificate,
  uploadCertificateFile,
} from "@/lib/cpd/cpd.functions";

type Step = "pick" | "extracting" | "confirm" | "submitting";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function confidenceLabel(c: number | null | undefined): { label: string; tone: string } {
  const v = c ?? 0;
  if (v >= 0.85) return { label: `High (${Math.round(v * 100)}%)`, tone: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" };
  if (v >= 0.6) return { label: `Medium (${Math.round(v * 100)}%)`, tone: "border-amber-400/30 bg-amber-500/15 text-amber-300" };
  return { label: `Low (${Math.round(v * 100)}%)`, tone: "border-red-400/30 bg-red-500/15 text-red-300" };
}

export function UploadCertificateDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: () => void;
}) {
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [sha256, setSha256] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<Record<string, unknown> | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [trustBadges, setTrustBadges] = useState<string[]>([]);

  // Confirm form fields
  const [awardingBodySlug, setAwardingBodySlug] = useState<string>("other");
  const [awardingBodyOther, setAwardingBodyOther] = useState("");
  const [qualification, setQualification] = useState("");
  const [qualificationNumber, setQualificationNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [holderName, setHolderName] = useState("");

  const extract = useServerFn(extractCertificateFields);
  const upload = useServerFn(uploadCertificateFile);
  const submit = useServerFn(submitCertificate);

  const isOfqualFormat = useMemo(
    () => qualificationNumber.trim() !== "" && OFQUAL_QUAL_NO_REGEX.test(qualificationNumber.trim()),
    [qualificationNumber],
  );

  const reset = () => {
    setStep("pick");
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadPath(null);
    setSha256(null);
    setAiRaw(null);
    setAiConfidence(null);
    setTrustBadges([]);
    setAwardingBodySlug("other");
    setAwardingBodyOther("");
    setQualification("");
    setQualificationNumber("");
    setIssueDate("");
    setExpiryDate("");
    setCertNumber("");
    setHolderName("");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handlePickFile = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB).");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    }
    setStep("extracting");
    try {
      const dataUrl = await fileToDataUrl(f);

      const [uploaded, extracted] = await Promise.all([
        upload({ data: { file_data_url: dataUrl, filename: f.name } }),
        extract({ data: { file_data_url: dataUrl, filename: f.name } }),
      ]);

      setUploadPath(uploaded.path);
      setSha256(uploaded.sha256);
      setAiRaw(extracted as unknown as Record<string, unknown>);
      setAiConfidence(extracted.confidence ?? null);
      setTrustBadges(extracted.trust_badges ?? []);

      setAwardingBodySlug(extracted.awarding_body_slug ?? "other");
      setAwardingBodyOther(
        extracted.awarding_body_slug ? "" : extracted.awarding_body ?? "",
      );
      setQualification(extracted.qualification ?? "");
      setQualificationNumber(extracted.qualification_number ?? "");
      setIssueDate(extracted.issue_date ?? "");
      setExpiryDate(extracted.expiry_date ?? "");
      setCertNumber(extracted.certificate_number ?? "");
      setHolderName(extracted.holder_name ?? "");
      setStep("confirm");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setStep("pick");
    }
  };

  const handleSubmit = async () => {
    if (!uploadPath || !sha256) return;
    const slug = awardingBodySlug;
    const bodyName =
      slug === "other"
        ? awardingBodyOther.trim()
        : AWARDING_BODIES.find((b) => b.slug === slug)?.name ?? "";
    if (!bodyName) {
      toast.error("Please enter the awarding body.");
      return;
    }
    if (!qualification.trim()) {
      toast.error("Please enter the qualification name.");
      return;
    }
    setStep("submitting");
    try {
      const res = await submit({
        data: {
          awarding_body: bodyName,
          awarding_body_slug: slug === "other" ? null : slug,
          qualification: qualification.trim(),
          qualification_number: qualificationNumber.trim() || null,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
          certificate_number: certNumber.trim() || null,
          holder_name: holderName.trim() || null,
          file_sha256: sha256,
          doc_paths: [uploadPath],
          ai_extraction: aiRaw,
          trust_badges: trustBadges,
        },
      });
      toast.success(
        (res as { regulator_verified?: boolean } | null)?.regulator_verified
          ? "Submitted — matched on the Ofqual register. Final review within 24h."
          : "Submitted for review — usually within 24h.",
      );
      onSubmitted?.();
      handleClose(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
      setStep("confirm");
    }
  };

  const conf = confidenceLabel(aiConfidence);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a certificate</DialogTitle>
          <DialogDescription>
            Upload your certificate (PDF or image). Our AI will read it, then you confirm before it goes to a REPs admin for verification.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" ? (
          <>
            <label
              htmlFor="cpd-cert-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-reps-border bg-reps-panel-soft p-8 text-center transition hover:border-reps-orange/60"
            >
              <Upload className="size-6 text-reps-orange" />
              <div className="text-[14px] font-semibold text-white">Choose a file</div>
              <div className="text-[12px] text-white/55">PDF, JPG or PNG · max 10MB</div>
              <input
                id="cpd-cert-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePickFile(f);
                }}
              />
            </label>
            <div className="mt-3 flex items-start gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[11.5px] text-white/65">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-white/55" />
              <span>
                Your certificate is stored privately — only visible to you and REPs admins. We keep it on file so the verification stands behind the original document.
              </span>
            </div>
          </>
        ) : null}

        {step === "extracting" ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel-soft p-8 text-center">
            <Loader2 className="size-6 animate-spin text-reps-orange" />
            <div className="text-[14px] font-semibold text-white">Reading your certificate…</div>
            <div className="text-[12px] text-white/55">
              <Sparkles className="mr-1 inline size-3" />
              AI extraction usually takes 3-8 seconds.
            </div>
          </div>
        ) : null}

        {step === "confirm" || step === "submitting" ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 rounded-[12px] border border-emerald-400/30 bg-reps-panel-soft px-3 py-2.5">
              <div className="flex items-start gap-2 text-[12.5px] text-white/85">
                <Sparkles className="mt-0.5 size-3.5 text-emerald-300" />
                <span>AI pre-filled the fields below. Please check and edit anything wrong before submitting.</span>
              </div>
              {aiConfidence !== null ? (
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${conf.tone}`}>
                  {conf.label}
                </span>
              ) : null}
            </div>

            {previewUrl || file ? (
              <div className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-2">
                {previewUrl ? (
                  <img src={previewUrl} alt="Uploaded certificate" className="h-14 w-14 rounded-[8px] object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
                    <FileText className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium text-white">{file?.name}</div>
                  <div className="text-[11px] text-white/55">Hash recorded · stored privately</div>
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="ab">Awarding body</Label>
              <Select value={awardingBodySlug} onValueChange={setAwardingBodySlug}>
                <SelectTrigger id="ab"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AWARDING_BODIES.map((b) => (
                    <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {awardingBodySlug === "other" ? (
                <Input
                  placeholder="Awarding body name"
                  value={awardingBodyOther}
                  onChange={(e) => setAwardingBodyOther(e.target.value)}
                />
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q">Qualification</Label>
              <Input
                id="q"
                placeholder="e.g. Level 3 Diploma in Personal Training"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qn" className="flex items-center justify-between">
                <span>Qualification number (Ofqual)</span>
                {isOfqualFormat ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    <Landmark className="size-3" /> Ofqual format
                  </span>
                ) : null}
              </Label>
              <Input
                id="qn"
                placeholder="e.g. 500/8513/X"
                value={qualificationNumber}
                onChange={(e) => setQualificationNumber(e.target.value.toUpperCase())}
              />
              <p className="text-[11px] text-black/55">
                Printed near the bottom of regulated UK certificates. We'll cross-check it against the Ofqual register.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="id">Issue date</Label>
                <Input
                  id="id"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e">Expiry date (optional)</Label>
                <Input
                  id="e"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cn">Certificate number (learner serial)</Label>
              <Input
                id="cn"
                placeholder="e.g. 50783547"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hn">Name on certificate</Label>
              <Input
                id="hn"
                placeholder="Your full name as printed"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
              />
            </div>

            {trustBadges.length > 0 ? (
              <div className="rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-white/55">Trust marks detected on the document</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {trustBadges.map((b) => (
                    <span key={b} className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-medium text-emerald-300">
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={step === "submitting"}>
            Cancel
          </Button>
          {step === "confirm" || step === "submitting" ? (
            <Button onClick={handleSubmit} disabled={step === "submitting"}>
              {step === "submitting" ? <Loader2 className="size-4 animate-spin" /> : "Submit for review"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
