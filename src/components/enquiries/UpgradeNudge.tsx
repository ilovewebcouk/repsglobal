import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "reps.enquiries.upgrade-nudge.dismissed.v1";

export function UpgradeNudge() {
  const [dismissed, setDismissed] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    if (typeof window !== "undefined") window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-reps-orange-border/40 bg-gradient-to-br from-reps-orange-soft/25 via-reps-panel to-reps-panel px-5 py-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 grid size-7 place-items-center rounded-full text-white/55 hover:bg-reps-panel-soft hover:text-white"
      >
        <X className="size-3.5" />
      </button>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-reps-orange-soft">
          <Sparkles className="size-4 text-reps-orange" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[14.5px] font-bold text-white">Convert more of these</div>
          <p className="mt-0.5 text-[12.5px] text-white/70">
            Top pros reply in under 5 minutes on autopilot. Upgrade to Pro for the full lead pipeline,
            AI scoring and automated follow-ups.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="h-10 shrink-0 rounded-[10px] bg-reps-orange px-4 text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
        >
          <Link to="/features/growth">
            See Pro <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
