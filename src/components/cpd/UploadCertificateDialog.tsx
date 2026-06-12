import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Upload } from "lucide-react";

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

import { AWARDING_BODIES } from "@/lib/cpd/awarding-bodies";
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
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [sha256, setSha256] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<Record<string, unknown> | null>(null);

  // Confirm form fields
  const [awardingBodySlug, setAwardingBodySlug] = useState<string>("other");
  const [awardingBodyOther, setAwardingBodyOther] = useState("");
  const [qualification, setQualification] = useState("");
  const [issueYear, setIssueYear] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [holderName, setHolderName] = useState("");

  const extract = useServerFn(extractCertificateFields);
  const upload = useServerFn(uploadCertificateFile);
  const submit = useServerFn(submitCertificate);

  const reset = () => {
    setStep("pick");
    setFile(null);
    setUploadPath(null);
    setSha256(null);
    setAiRaw(null);
    setAwardingBodySlug("other");
    setAwardingBodyOther("");
    setQualification("");
    setIssueYear("");
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
    setStep("extracting");
    try {
      const dataUrl = await fileToDataUrl(f);

      // Run upload + AI extract in parallel
      const [uploaded, extracted] = await Promise.all([
        upload({ data: { file_data_url: dataUrl, filename: f.name } }),
        extract({ data: { file_data_url: dataUrl, filename: f.name } }),
      ]);

      setUploadPath(uploaded.path);
      setSha256(uploaded.sha256);
      setAiRaw(extracted as unknown as Record<string, unknown>);

      // Pre-fill form
      setAwardingBodySlug(extracted.awarding_body_slug ?? "other");
      setAwardingBodyOther(
        extracted.awarding_body_slug ? "" : extracted.awarding_body ?? "",
      );
      setQualification(extracted.qualification ?? "");
      setIssueYear(extracted.issue_date ? extracted.issue_date.slice(0, 4) : "");
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
      await submit({
        data: {
          awarding_body: bodyName,
          awarding_body_slug: slug === "other" ? null : slug,
          qualification: qualification.trim(),
          issue_year: issueYear ? Number(issueYear) : null,
          expiry_date: expiryDate || null,
          certificate_number: certNumber.trim() || null,
          holder_name: holderName.trim() || null,
          file_sha256: sha256,
          doc_paths: [uploadPath],
          ai_extraction: aiRaw,
        },
      });
      toast.success("Submitted for review — usually within 24h.");
      onSubmitted?.();
      handleClose(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
      setStep("confirm");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a certificate</DialogTitle>
          <DialogDescription>
            Upload your certificate (PDF or image). Our AI will read it, then you confirm before it goes to a REPs admin for verification.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" ? (
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
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePickFile(f);
              }}
            />
          </label>
        ) : null}

        {step === "extracting" ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel-soft p-8 text-center">
            <Loader2 className="size-6 animate-spin text-reps-orange" />
            <div className="text-[14px] font-semibold text-white">Reading your certificate…</div>
            <div className="text-[12px] text-white/55">
              <Sparkles className="mr-1 inline size-3" />
              AI extraction usually takes 3-6 seconds.
            </div>
          </div>
        ) : null}

        {step === "confirm" || step === "submitting" ? (
          <div className="space-y-3">
            <div className="rounded-[12px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
              <Sparkles className="mr-1 inline size-3" /> AI pre-filled the fields below. Please check and edit anything wrong before submitting.
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="y">Issue year</Label>
                <Input
                  id="y"
                  inputMode="numeric"
                  placeholder="2024"
                  value={issueYear}
                  onChange={(e) => setIssueYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
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
              <Label htmlFor="cn">Certificate number (optional)</Label>
              <Input
                id="cn"
                placeholder="e.g. AIQ123456"
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
