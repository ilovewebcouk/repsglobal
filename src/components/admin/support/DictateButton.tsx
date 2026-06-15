import { useCallback, useRef, useState } from "react";
import { useScribe } from "@elevenlabs/react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getScribeToken } from "@/lib/support/scribe-token.functions";
import { cn } from "@/lib/utils";

type Props = {
  /** Called whenever new dictated text should be appended to the textarea. */
  onAppend: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Voice-to-text dictation button using ElevenLabs Scribe realtime.
 * Press to record (browser asks for mic). Press again to stop. Esc cancels.
 */
export function DictateButton({ onAppend, disabled, className }: Props) {
  const fetchToken = useServerFn(getScribeToken);
  const [connecting, setConnecting] = useState(false);
  // We use a ref so the latest onAppend is used inside the scribe callbacks
  // without needing to recreate the hook.
  const appendRef = useRef(onAppend);
  appendRef.current = onAppend;

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
    onCommittedTranscript: (data: any) => {
      const text = (data?.text ?? "").trim();
      if (text) appendRef.current(text + " ");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Dictation error");
    },
  });

  const start = useCallback(async () => {
    try {
      setConnecting(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { token } = await fetchToken();
      if (!token) throw new Error("No token received");
      await scribe.connect({
        token,
        microphone: { echoCancellation: true, noiseSuppression: true },
      });
      toast.success("Listening… speak now");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start dictation");
    } finally {
      setConnecting(false);
    }
  }, [fetchToken, scribe]);

  const stop = useCallback(() => {
    scribe.disconnect();
  }, [scribe]);

  const active = scribe.isConnected;

  // Esc to cancel while recording
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Escape" && active) stop();
    },
    [active, stop],
  );

  return (
    <button
      type="button"
      onClick={active ? stop : start}
      onKeyDown={onKeyDown}
      disabled={disabled || connecting}
      title={active ? "Stop dictation (Esc)" : "Dictate reply with your voice"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[12px] font-semibold transition",
        active
          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300 animate-pulse"
          : "border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
    >
      {connecting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : active ? (
        <Square className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Mic className="h-3.5 w-3.5 text-reps-orange" />
      )}
      {connecting ? "Connecting…" : active ? "Stop" : "Dictate"}
    </button>
  );
}
