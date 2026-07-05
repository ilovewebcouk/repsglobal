import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { subscribeToNewsletter } from "@/lib/newsletter/subscribers.functions";

interface Props {
  source?: "article" | "footer";
  className?: string;
}

export function NewsletterSignup({ source = "article", className }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const subscribe = useServerFn(subscribeToNewsletter);

  const mutation = useMutation({
    mutationFn: async () =>
      subscribe({
        data: {
          email: email.trim(),
          source,
          sourceUrl: typeof window !== "undefined" ? window.location.href : null,
        },
      }),
    onSuccess: () => setDone(true),
  });

  const canSubmit = email.trim().length > 4 && email.includes("@") && consent && !mutation.isPending;

  if (done) {
    return (
      <div className={`rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 p-6 text-center ${className ?? ""}`}>
        <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <Check className="size-4" />
        </div>
        <p className="font-display text-[16px] font-semibold text-white">Check your inbox</p>
        <p className="mt-1 text-[13px] text-white/60">
          We've sent a confirmation link to <span className="text-white/85">{email}</span>. Click it to finish subscribing.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) mutation.mutate();
      }}
      className={`rounded-[18px] border border-reps-border bg-reps-panel p-6 lg:p-7 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <Mail className="size-4 text-reps-orange" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">The REPS newsletter</span>
      </div>
      <h3 className="mt-3 font-display text-[20px] font-bold leading-snug text-white lg:text-[22px]">
        Get new articles &amp; product updates
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
        Occasional emails from the REPS team on register updates, standards and new tools for professionals. No spam, unsubscribe anytime.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 flex-1 bg-white/[0.04] border-reps-border text-white placeholder:text-white/35"
        />
        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-11 bg-reps-orange text-white hover:bg-reps-orange/90 sm:min-w-[130px]"
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
        </Button>
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-2 text-[12px] text-white/55">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          className="mt-0.5"
        />
        <span>
          I agree to receive occasional emails from REPS. I can unsubscribe from any email.
        </span>
      </label>

      {mutation.isError ? (
        <p className="mt-3 text-[12px] text-red-400">
          Something went wrong. Please try again.
        </p>
      ) : null}
    </form>
  );
}
