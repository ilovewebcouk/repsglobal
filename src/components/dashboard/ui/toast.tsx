"use client";

import { toast } from "sonner";

/**
 * Deprecated — the app-wide `<Toaster />` in `src/routes/__root.tsx`
 * (from `@/components/ui/sonner`) is now the single source of truth.
 * This component is kept as an inert no-op so any lingering imports
 * don't mount a second toaster (which caused every notification to
 * appear twice — once top-right, once bottom-right).
 */
export function DashboardToaster() {
  return null;
}

export { toast };
