import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Check, X, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { transcribeAudio } from "@/lib/ai/transcribe.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  /** Called with the transcribed text when the user confirms. */
  onTranscript: (text: string) => void;
  /** Visual size of the floating button. */
  size?: "sm" | "md";
  /** Tailwind class for positioning the trigger (default: bottom-right inside relative parent). */
  className?: string;
  disabled?: boolean;
};

type Phase = "idle" | "recording" | "transcribing";

/**
 * Dictate button. Click → records via MediaRecorder, shows a live waveform overlay
 * at the bottom of the viewport. Click ✓ to stop & transcribe, ✕ to cancel.
 * Append-mode: transcript is passed to onTranscript (parent decides how to merge).
 */
export function DictateButton({ onTranscript, size = "md", className, disabled }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const formatRef = useRef<"webm" | "mp4">("webm");
  const cancelledRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transcribe = useServerFn(transcribeAudio);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    if (disabled || phase !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the best supported mime
      const candidates: Array<{ mime: string; fmt: "webm" | "mp4" }> = [
        { mime: "audio/webm;codecs=opus", fmt: "webm" },
        { mime: "audio/webm", fmt: "webm" },
        { mime: "audio/mp4", fmt: "mp4" },
      ];
      const picked =
        candidates.find((c) => (window as any).MediaRecorder?.isTypeSupported?.(c.mime)) ??
        candidates[0];
      formatRef.current = picked.fmt;

      const rec = new MediaRecorder(stream, { mimeType: picked.mime });
      mediaRef.current = rec;
      chunksRef.current = [];
      cancelledRef.current = false;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: picked.mime });
        cleanup();
        if (cancelledRef.current || blob.size === 0) {
          setPhase("idle");
          setElapsed(0);
          return;
        }
        setPhase("transcribing");
        try {
          const buf = await blob.arrayBuffer();
          // Convert to base64 in chunks (avoid stack overflow on large arrays)
          const bytes = new Uint8Array(buf);
          let binary = "";
          const CHUNK = 0x8000;
          for (let i = 0; i < bytes.length; i += CHUNK) {
            binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
          }
          const base64 = btoa(binary);
          const { text } = await transcribe({
            data: { audioBase64: base64, format: formatRef.current },
          });
          if (text) onTranscript(text);
          else toast.info("Nothing transcribed — try again a little louder.");
        } catch (err: any) {
          toast.error(err?.message ?? "Transcription failed");
        } finally {
          setPhase("idle");
          setElapsed(0);
        }
      };

      // Set up analyser for waveform
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      rec.start();
      setPhase("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      drawWaveform();
    } catch (err: any) {
      toast.error(err?.name === "NotAllowedError" ? "Microphone access denied" : "Cannot access microphone");
      cleanup();
      setPhase("idle");
    }
  }, [disabled, phase, cleanup, onTranscript, transcribe]);

  const drawWaveform = useCallback(() => {
    const tick = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const buf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);

      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#FF6A1A"; // reps-orange
      ctx.beginPath();
      const slice = w / buf.length;
      let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i] / 128.0; // 0..2
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAndTranscribe = useCallback(() => {
    if (phase !== "recording") return;
    cancelledRef.current = false;
    mediaRef.current?.stop();
  }, [phase]);

  const cancel = useCallback(() => {
    if (phase !== "recording") return;
    cancelledRef.current = true;
    mediaRef.current?.stop();
  }, [phase]);

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={disabled || phase !== "idle"}
        title="Dictate"
        aria-label="Dictate"
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 shadow-sm transition hover:bg-white/[0.12] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed",
          dim,
          className,
        )}
      >
        {phase === "transcribing" ? (
          <Loader2 className="h-4 w-4 animate-spin text-reps-orange" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>

      {phase === "recording" && (
        <div
          className="fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4 pointer-events-none"
          aria-live="polite"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-[#0B0F14]/95 backdrop-blur px-3 py-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2 pl-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-reps-orange/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-reps-orange" />
              </span>
              <span className="text-[12px] tabular-nums font-semibold text-white/85">
                {fmtTime(elapsed)}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              className="h-9 w-[220px] sm:w-[320px] rounded-md bg-white/[0.03]"
            />
            <button
              type="button"
              onClick={cancel}
              title="Cancel"
              aria-label="Cancel"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={stopAndTranscribe}
              title="Transcribe"
              aria-label="Transcribe"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange text-white hover:bg-reps-orange/90 shadow"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
