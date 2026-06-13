import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { FileText, Loader2, Lock, Smartphone, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createInsuranceUploadSession,
  extractInsuranceFromDoc,
  extractInsuranceFromPath,
  getInsuranceUploadSession,
  markInsuranceUploadSessionConsumed,
  saveInsurance,
  uploadVerificationAsset,
} from "@/lib/verification/insurance.functions";

type Step = "pick" | "extracting" | "confirm" | "submitting";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function confidenceLabel(c: number | null | undefined) {
  const v = c ?? 0;
  if (v >= 0.85)
    return { label: `High (${Math.round(v * 100)}%)`, tone: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" };
  if (v >= 0.6)
    return { label: `Medium (${Math.round(v * 100)}%)`, tone: "border-amber-400/30 bg-amber-500/15 text-amber-300" };
  return { label: `Low (${Math.round(v * 100)}%)`, tone: "border-red-400/30 bg-red-500/15 text-red-300" };
}

export function InsuranceUploadDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: () => void;
}) {
  const [step, setStep] = useState<Step>("pick");
  const [tab, setTab] = useState<"upload" | "qr">("upload");
  const [docPath, setDocPath] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const [provider, setProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverGbp, setCoverGbp] = useState<string>(""); // in £ (full pounds)
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const upload = useServerFn(uploadVerificationAsset);
  const extractDoc = useServerFn(extractInsuranceFromDoc);
  const extractPath = useServerFn(extractInsuranceFromPath);
  const save = useServerFn(saveInsurance);
  const createSession = useServerFn(createInsuranceUploadSession);
  const getSession = useServerFn(getInsuranceUploadSession);
  const markConsumed = useServerFn(markInsuranceUploadSessionConsumed);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  const reset = () => {
    setStep("pick");
    setTab("upload");
    setDocPath(null);
    setFilename(null);
    setAiConfidence(null);
    setProvider("");
    setPolicyNumber("");
    setCoverGbp("");
    setStartDate("");
    setExpiryDate("");
    setSessionId(null);
    setSessionExpiresAt(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  /* --- Tab 1: upload from this device --- */
  const handlePickFile = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB).");
      return;
    }
    setFilename(f.name);
    setStep("extracting");
    try {
      const dataUrl = await fileToDataUrl(f);
      const [uploaded, extracted] = await Promise.all([
        upload({ data: { bucket: "insurance-docs", file_data_url: dataUrl, filename: f.name } }),
        extractDoc({ data: { file_data_url: dataUrl, filename: f.name } }),
      ]);
      setDocPath(uploaded.path);
      applyExtracted(extracted);
      setStep("confirm");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setStep("pick");
    }
  };

  function applyExtracted(e: {
    provider: string | null;
    policy_number: string | null;
    cover_amount_gbp: number | null;
    start_date: string | null;
    expiry_date: string | null;
    confidence: number | null;
  }) {
    setProvider(e.provider ?? "");
    setPolicyNumber(e.policy_number ?? "");
    setCoverGbp(e.cover_amount_gbp != null ? String(e.cover_amount_gbp) : "");
    setStartDate(e.start_date ?? "");
    setExpiryDate(e.expiry_date ?? "");
    setAiConfidence(e.confidence);
  }

  /* --- Tab 2: QR / scan with phone --- */
  useEffect(() => {
    if (!open || tab !== "qr" || sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const sess = await createSession();
        if (cancelled) return;
        setSessionId(sess.id);
        setSessionExpiresAt(sess.expires_at);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't start scan session");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, sessionId, createSession]);

  // Poll the session while the phone uploads
  const pollEnabled = !!sessionId && step === "pick" && tab === "qr";
  useQuery({
    queryKey: ["ins-upload-session", sessionId],
    enabled: pollEnabled,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!sessionId) return null;
      const row = await getSession({ data: { id: sessionId } });
      if (row && (row as { status: string }).status === "uploaded") {
        const r = row as { doc_path: string; filename: string };
        setStep("extracting");
        setDocPath(r.doc_path);
        setFilename(r.filename);
        try {
          const extracted = await extractPath({ data: { doc_path: r.doc_path } });
          applyExtracted(extracted);
          await markConsumed({ data: { id: sessionId } });
          setStep("confirm");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "AI extract failed");
          setStep("pick");
        }
      }
      return row;
    },
  });

  const qrUrl = useMemo(() => {
    if (!sessionId || typeof window === "undefined") return "";
    return `${window.location.origin}/u/insurance/${sessionId}`;
  }, [sessionId]);

  /* --- Submit --- */
  const handleSubmit = async () => {
    if (!docPath) return;
    if (!provider.trim()) {
      toast.error("Provider is required");
      return;
    }
    if (!expiryDate) {
      toast.error("Expiry date is required");
      return;
    }
    setStep("submitting");
    try {
      await save({
        data: {
          provider: provider.trim(),
          policy_number: policyNumber.trim() || null,
          cover_amount_gbp: coverGbp ? Math.max(0, Math.round(parseFloat(coverGbp))) : null,
          start_date: startDate || null,
          expiry_date: expiryDate,
          doc_path: docPath,
        },
      });
      toast.success("Insurance submitted — usually reviewed within 24h.");
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
          <DialogTitle>Add your insurance</DialogTitle>
          <DialogDescription>
            Public liability certificate (PDF or image). Our AI reads it, you confirm, a REPs admin verifies.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "qr")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="size-4" /> Upload file
              </TabsTrigger>
              <TabsTrigger value="qr">
                <Smartphone className="size-4" /> Scan with phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-3">
              <label
                htmlFor="ins-doc-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-reps-border bg-reps-panel-soft p-8 text-center transition hover:border-reps-orange/60"
              >
                <Upload className="size-6 text-reps-orange" />
                <div className="text-[14px] font-semibold text-white">Choose a file</div>
                <div className="text-[12px] text-white/55">PDF, JPG or PNG · max 10MB</div>
                <input
                  id="ins-doc-file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handlePickFile(f);
                  }}
                />
              </label>
              <div className="mt-3 flex items-start gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[11.5px] text-white/65">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-white/55" />
                <span>Stored privately — only visible to you and REPs admins.</span>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="mt-3">
              <div className="flex flex-col items-center gap-3 rounded-[16px] border border-reps-border bg-white p-6 text-center">
                {qrUrl ? (
                  <>
                    <QRCodeSVG value={qrUrl} size={180} level="M" includeMargin={false} />
                    <div className="text-[12.5px] font-semibold text-reps-ink">
                      Scan with your phone camera
                    </div>
                    <div className="text-[11px] text-reps-ink/65">
                      Opens an upload page. We'll bring the photo back here automatically.
                    </div>
                  </>
                ) : (
                  <Loader2 className="size-5 animate-spin text-reps-orange" />
                )}
              </div>
              {sessionExpiresAt ? (
                <p className="mt-2 text-center text-[11px] text-white/45">
                  Link expires {new Date(sessionExpiresAt).toLocaleTimeString()}
                </p>
              ) : null}
            </TabsContent>
          </Tabs>
        ) : null}

        {step === "extracting" ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-reps-border bg-reps-panel-soft p-8 text-center">
            <Loader2 className="size-6 animate-spin text-reps-orange" />
            <div className="text-[14px] font-semibold text-white">Reading your certificate…</div>
            <div className="text-[12px] text-white/55">
              <Sparkles className="mr-1 inline size-3" />
              AI extraction usually takes 3–8 seconds.
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

            {filename ? (
              <div className="flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium text-white">{filename}</div>
                  <div className="text-[11px] text-white/55">Stored privately</div>
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="ins-provider">Insurer / provider</Label>
              <Input
                id="ins-provider"
                placeholder="e.g. Insure4Sport"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ins-policy">Policy number</Label>
              <Input
                id="ins-policy"
                placeholder="Optional"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ins-cover">Cover amount (£)</Label>
              <Input
                id="ins-cover"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="e.g. 5000000"
                value={coverGbp}
                onChange={(e) => setCoverGbp(e.target.value)}
              />
              <p className="text-[11px] text-white/45">Public liability limit in pounds (e.g. 5,000,000 for £5m).</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ins-start">Cover starts</Label>
                <Input
                  id="ins-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ins-expiry">Renews / expires</Label>
                <Input
                  id="ins-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
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

// Reference to silence the unused import warning if Smartphone isn't used elsewhere
const _smartphoneRef: unknown = Smartphone;
void _smartphoneRef;
