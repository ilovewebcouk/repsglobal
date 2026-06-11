import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailX } from "lucide-react";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Unsubscribe — REPS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

type View =
  | { state: "loading" }
  | { state: "ready" }
  | { state: "already" }
  | { state: "invalid"; message: string }
  | { state: "submitting" }
  | { state: "done" };

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [view, setView] = useState<View>({ state: "loading" });

  useEffect(() => {
    if (!token) {
      setView({ state: "invalid", message: "Missing unsubscribe token." });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          setView({ state: "invalid", message: data?.error ?? "Invalid link" });
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setView({ state: "already" });
          return;
        }
        setView({ state: "ready" });
      } catch {
        setView({ state: "invalid", message: "Could not validate link." });
      }
    })();
  }, [token]);

  async function confirm() {
    setView({ state: "submitting" });
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success || data.reason === "already_unsubscribed") {
        setView({ state: "done" });
      } else {
        setView({ state: "invalid", message: data?.error ?? "Could not unsubscribe." });
      }
    } catch {
      setView({ state: "invalid", message: "Network error." });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-reps-ink px-4">
      <div className="w-full max-w-md rounded-[22px] border border-reps-border bg-reps-panel p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-reps-orange-soft text-reps-orange">
          <MailX className="h-5 w-5" />
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight text-white">Unsubscribe from REPS emails</h1>

        {view.state === "loading" && (
          <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-white/55">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating link…
          </p>
        )}

        {view.state === "ready" && (
          <>
            <p className="mt-3 text-[13.5px] text-white/65">
              You'll stop receiving non-essential emails from REPS. You can still
              receive important account messages.
            </p>
            <button
              onClick={confirm}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13.5px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Confirm unsubscribe
            </button>
          </>
        )}

        {view.state === "submitting" && (
          <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-white/55">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Unsubscribing…
          </p>
        )}

        {view.state === "done" && (
          <p className="mt-3 inline-flex items-center gap-2 text-[13.5px] text-reps-green">
            <CheckCircle2 className="h-4 w-4" /> You've been unsubscribed.
          </p>
        )}

        {view.state === "already" && (
          <p className="mt-3 text-[13.5px] text-white/65">
            This email address is already unsubscribed.
          </p>
        )}

        {view.state === "invalid" && (
          <p className="mt-3 text-[13.5px] text-rose-400">{view.message}</p>
        )}
      </div>
    </main>
  );
}
