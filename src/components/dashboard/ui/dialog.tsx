"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * DashboardDialog — dark-first Radix Dialog wrapper for the authenticated
 * surface (trainer + admin dashboards). Locks all colour, radius, and
 * elevation tokens so dashboards never inherit shadcn's light-theme defaults.
 *
 * Tokens (no new ones — all defined in src/styles.css):
 *   surface  bg-reps-panel
 *   border   border-reps-border
 *   text     text-white / text-white/70
 *   radius   18px (dialog card)
 *   shadow   soft elevated drop
 *   overlay  bg-black/70 backdrop-blur-sm
 */

const DashboardDialog = DialogPrimitive.Root;
const DashboardDialogTrigger = DialogPrimitive.Trigger;
const DashboardDialogPortal = DialogPrimitive.Portal;
const DashboardDialogClose = DialogPrimitive.Close;

const DashboardDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DashboardDialogOverlay.displayName = "DashboardDialogOverlay";

const DashboardDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DashboardDialogPortal>
    <DashboardDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[18px] border border-reps-border bg-reps-panel p-6 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DashboardDialogPortal>
));
DashboardDialogContent.displayName = "DashboardDialogContent";

function DashboardDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

function DashboardDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

const DashboardDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "flex items-center gap-2 text-[16px] font-semibold leading-tight text-white",
      className,
    )}
    {...props}
  />
));
DashboardDialogTitle.displayName = "DashboardDialogTitle";

const DashboardDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[13px] leading-relaxed text-white/70", className)}
    {...props}
  />
));
DashboardDialogDescription.displayName = "DashboardDialogDescription";

/**
 * DashboardDialogNote — the inset "what we need" / helper block used inside
 * dashboard dialogs. Locks the dark surface so it never resolves to the
 * cream/muted shadcn defaults.
 */
function DashboardDialogNote({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-white/10 bg-white/[0.04] p-3 text-[12px] leading-relaxed text-white/75",
        className,
      )}
      {...props}
    />
  );
}

export {
  DashboardDialog,
  DashboardDialogTrigger,
  DashboardDialogPortal,
  DashboardDialogClose,
  DashboardDialogOverlay,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogFooter,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogNote,
};
