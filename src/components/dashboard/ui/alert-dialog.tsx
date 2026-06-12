"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { dashboardButtonVariants } from "./button";

const DashboardAlertDialog = AlertDialogPrimitive.Root;
const DashboardAlertDialogTrigger = AlertDialogPrimitive.Trigger;
const DashboardAlertDialogPortal = AlertDialogPrimitive.Portal;

const DashboardAlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DashboardAlertDialogOverlay.displayName = "DashboardAlertDialogOverlay";

const DashboardAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DashboardAlertDialogPortal>
    <DashboardAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[18px] border border-reps-border bg-reps-panel p-6 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    />
  </DashboardAlertDialogPortal>
));
DashboardAlertDialogContent.displayName = "DashboardAlertDialogContent";

function DashboardAlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 text-left", className)} {...props} />;
}

function DashboardAlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

const DashboardAlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-[16px] font-semibold leading-tight text-white", className)}
    {...props}
  />
));
DashboardAlertDialogTitle.displayName = "DashboardAlertDialogTitle";

const DashboardAlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-[13px] leading-relaxed text-white/70", className)}
    {...props}
  />
));
DashboardAlertDialogDescription.displayName = "DashboardAlertDialogDescription";

type ActionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
  destructive?: boolean;
};

const DashboardAlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  ActionProps
>(({ className, destructive, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      dashboardButtonVariants({ variant: destructive ? "destructive-ghost" : "primary" }),
      className,
    )}
    {...props}
  />
));
DashboardAlertDialogAction.displayName = "DashboardAlertDialogAction";

const DashboardAlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(dashboardButtonVariants({ variant: "ghost" }), "mt-0", className)}
    {...props}
  />
));
DashboardAlertDialogCancel.displayName = "DashboardAlertDialogCancel";

export {
  DashboardAlertDialog,
  DashboardAlertDialogTrigger,
  DashboardAlertDialogPortal,
  DashboardAlertDialogOverlay,
  DashboardAlertDialogContent,
  DashboardAlertDialogHeader,
  DashboardAlertDialogFooter,
  DashboardAlertDialogTitle,
  DashboardAlertDialogDescription,
  DashboardAlertDialogAction,
  DashboardAlertDialogCancel,
};
