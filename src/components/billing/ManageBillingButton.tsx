import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/lib/billing/billing.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";

type Props = React.ComponentProps<typeof Button> & {
  label?: string;
  loadingLabel?: string;
};

/**
 * Opens the Stripe Customer Portal for the signed-in pro.
 * Used wherever a paid member needs to update card, cancel, or view invoices.
 */
export function ManageBillingButton({
  label = "Manage billing",
  loadingLabel = "Opening portal…",
  variant = "ghost",
  size,
  className,
  ...rest
}: Props) {
  const openPortal = useServerFn(createPortalSession);
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await openPortal({ data: { environment: getStripeEnvironment() } });
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      throw new Error("No portal URL returned");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not open billing portal");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={
        className ??
        "inline-flex h-9 shrink-0 items-center rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/80 hover:bg-reps-panel hover:text-white"
      }
      disabled={loading}
      onClick={handleClick}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 data-icon="inline-start" className="animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
