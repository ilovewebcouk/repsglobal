"use client";

import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * App-wide toaster. Single mount lives in `src/routes/__root.tsx`.
 * Dark, bottom-right, reps-branded — matches the dashboard look and is
 * used across public routes, auth and dashboard so notifications never
 * render twice.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      className="toaster group"
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
      {...props}
    />
  );
};

export { Toaster, toast };
