import { useState, useTransition } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { joinWaitlist } from "@/lib/waitlist.functions";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  id?: string;
  className?: string;
}

/**
 * Inline email capture for the coming-soon page.
 *
 * - Single input + button row (stacks on mobile).
 * - On success swaps in place to a confirmation panel — no toast.
 * - Trust line below: "No spam. One email when we go live."
 */
export function WaitlistForm({ id, className }: WaitlistFormProps) {
  const submit = useServerFn(joinWaitlist);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await submit({ data: { email: trimmed } });
        if (res.ok) {
          setDone(true);
        } else {
          setError(res.error ?? "Something went wrong. Please try again.");
        }
      } catch (err) {
        console.error("[WaitlistForm] submit failed", err);
        setError("Couldn't reach the server. Please try again.");
      }
    });
  }

  if (done) {
    return (
      <div
        id={id}
        className={cn(
          "flex items-center gap-3 rounded-[12px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3.5 text-[14px] text-emerald-200",
          className,
        )}
      >
        <CheckCircle2 className="h-5 w-5 flex-none text-emerald-300" aria-hidden />
        <span>
          You're on the list. We'll email you the moment REPS goes live.
        </span>
      </div>
    );
  }

  return (
    <div id={id} className={cn("w-full", className)}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full flex-col gap-2.5 sm:flex-row sm:gap-2"
      >
        <label htmlFor={`waitlist-email-${id ?? "default"}`} className="sr-only">
          Email address
        </label>
        <input
          id={`waitlist-email-${id ?? "default"}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          disabled={isPending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `waitlist-error-${id ?? "default"}` : undefined}
          style={{ height: 56 }}
          className="w-full flex-1 min-w-0 rounded-[12px] border border-white/20 bg-reps-ink/70 px-4 text-[16px] text-white placeholder:text-white/45 outline-none transition-colors focus:border-reps-orange focus:bg-reps-ink/90 disabled:opacity-60 sm:text-[15px]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[15px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-70 sm:w-auto"
        >
          {isPending ? "Saving…" : "Notify me"}
          {!isPending ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
        </button>
      </form>
      {error ? (
        <p
          id={`waitlist-error-${id ?? "default"}`}
          role="alert"
          className="mt-2 text-[13px] text-reps-orange"
        >
          {error}
        </p>
      ) : (
        <p className="mt-3 text-[12px] text-white/55">
          No spam. One email when we go live.
        </p>
      )}
    </div>
  );
}
