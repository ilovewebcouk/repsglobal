import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  lookupInsuranceUploadSession,
  submitInsuranceFromMobile,
} from "@/lib/verification/insurance.functions";

export const Route = createFileRoute("/u/insurance/$sessionId")({
  head: () => ({
    meta: [
      { title: "Upload insurance — REPS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MobileInsuranceUploadPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function MobileInsuranceUploadPage() {
  const { sessionId } = Route.useParams();
  const lookup = useServerFn(lookupInsuranceUploadSession);
  const submit = useServerFn(submitInsuranceFromMobile);

  const sessionQ = useQuery({
    queryKey: ["mobile-ins-session", sessionId],
    queryFn: () => lookup({ data: { session_id: sessionId } }),
  });

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handlePick = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB).");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(f);
      await submit({
        data: { session_id: sessionId, file_data_url: dataUrl, filename: f.name },
      });
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    document.documentElement.style.background = "#0b0b0c";
  }, []);

  const data = sessionQ.data;
  const invalid = data && data.ok === false;

  return (
    <div className="min-h-dvh bg-reps-ink px-5 pb-10 pt-8 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-white/65">
          <ShieldCheck className="size-4 text-reps-orange" />
          REPS Insurance upload
        </div>

        {sessionQ.isLoading ? (
          <div className="flex items-center gap-2 text-[13px] text-white/65">
            <Loader2 className="size-4 animate-spin" /> Checking link…
          </div>
        ) : null}

        {invalid ? (
          <div className="rounded-[14px] border border-red-400/30 bg-red-500/10 p-4 text-[13px] text-red-200">
            This upload link is no longer valid
            {data && data.ok === false ? ` (${data.reason})` : ""}. Go back to the dashboard on
            your computer and start a new scan session.
          </div>
        ) : null}

        {data && data.ok && !done ? (
          <>
            <h1 className="font-display text-[22px] font-semibold leading-tight text-white">
              Snap a photo of your insurance certificate
            </h1>
            <p className="text-[13px] text-white/65">
              Or pick a saved PDF / image. We'll send it straight back to your dashboard.
            </p>

            <label
              htmlFor="ins-mobile-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-reps-border bg-reps-panel-soft p-8 text-center"
            >
              {busy ? (
                <>
                  <Loader2 className="size-6 animate-spin text-reps-orange" />
                  <span className="text-[14px] font-semibold text-white">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="size-6 text-reps-orange" />
                  <span className="text-[14px] font-semibold text-white">Take photo or choose file</span>
                  <span className="text-[12px] text-white/55">PDF, JPG or PNG · max 10MB</span>
                </>
              )}
              <input
                id="ins-mobile-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                capture="environment"
                disabled={busy}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePick(f);
                }}
              />
            </label>
            <p className="text-center text-[11px] text-white/45">
              Link expires {new Date(data.expires_at).toLocaleTimeString()}
            </p>
          </>
        ) : null}

        {done ? (
          <div className="rounded-[14px] border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
            <CheckCircle2 className="mx-auto size-7 text-emerald-300" />
            <div className="mt-2 font-display text-[16px] font-semibold text-white">Sent</div>
            <p className="mt-1 text-[13px] text-white/65">
              You can close this tab. Finish on your computer.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
