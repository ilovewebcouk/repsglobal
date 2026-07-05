import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";

/**
 * Redirects Core-tier trainers off Pro-only dashboard routes.
 *
 * Core is intentionally minimal: badge + credentials + directory listing
 * + email-only enquiries. Pro-only editor pages (services, enquiries inbox,
 * reviews, etc.) call this hook at the top of their component to bounce
 * Core users back to /dashboard with an upgrade toast.

 *
 * Returns `true` while the redirect is in flight so the caller can render
 * `null` and avoid flashing the Pro UI for one frame.
 */
export function useProGuard(featureLabel: string): boolean {
  const tier = useTrainerTier();
  const navigate = useNavigate();
  const isVerified = tier === "verified";

  React.useEffect(() => {
    if (!isVerified) return;
    toast(`${featureLabel} is a Pro feature`, {
      description: "Pro is launching soon — join the Pro waitlist.",
    });
    void navigate({ to: "/dashboard" });
  }, [isVerified, featureLabel, navigate]);

  return isVerified;
}
