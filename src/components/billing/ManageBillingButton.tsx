import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/lib/billing/billing.functions";

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
  variant = "outline",
  size,
  className,
  ...rest
}: Props) {
  const openPortal = useServerFn(createPortalSession);
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await openPortal();
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
      className={className}
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
