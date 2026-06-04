import * as React from "react";

export interface MockupStageProps {
  children: React.ReactNode;
  variant?: "laptop" | "phone";
  className?: string;
}

/**
 * Presentational wrapper that frames a device mock-up as a premium product
 * preview: soft orange radial glow, subtle ring, deep drop shadow. Does NOT
 * affect the iframe scaling inside DeviceMockup.
 */
export function MockupStage({ children, variant = "laptop", className }: MockupStageProps) {
  return (
    <div
      className={`relative isolate ${
        variant === "phone" ? "mx-auto w-full max-w-[240px]" : "w-full"
      } ${className ?? ""}`}
    >
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[22px] bg-[radial-gradient(60%_55%_at_50%_35%,rgba(255,122,0,0.16),transparent_70%)] blur-2xl lg:-inset-10"
      />
      <div
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-[22px] bg-reps-panel/40 ring-1 ring-reps-border/70 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)] lg:-inset-4"
      />
      {children}
    </div>
  );
}
