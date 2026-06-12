"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * DashboardToaster — pre-themed Sonner instance for the authenticated
 * surface. Mount once inside `_authenticated/route.tsx`. Callers continue
 * to import `toast` from `sonner` (re-exported here for convenience).
 */
export function DashboardToaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-reps-panel !border !border-reps-border !text-white !rounded-[14px] !shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]",
          title: "!text-white !text-[13.5px] !font-semibold",
          description: "!text-white/70 !text-[12.5px]",
          actionButton:
            "!bg-reps-orange !text-white !rounded-[10px] !h-8 !px-3 hover:!bg-reps-orange-hover",
          cancelButton:
            "!bg-white/[0.04] !border !border-white/12 !text-white !rounded-[10px] !h-8 !px-3 hover:!bg-white/[0.08]",
          closeButton:
            "!bg-reps-panel !border !border-reps-border !text-white/70 hover:!text-white",
          success: "!text-emerald-300",
          error: "!text-red-300",
          warning: "!text-amber-300",
          info: "!text-white/80",
        },
      }}
    />
  );
}

export { toast };
