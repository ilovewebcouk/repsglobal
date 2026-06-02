import * as React from "react";
import { cn } from "@/lib/utils";

type Aspect = "video" | "wide" | "square";

const ASPECT: Record<Aspect, string> = {
  video: "aspect-video",
  wide: "aspect-[21/9]",
  square: "aspect-square",
};

export interface MockupPlaceholderProps {
  label: string;
  aspect?: Aspect;
  className?: string;
}

export function MockupPlaceholder({
  label,
  aspect = "video",
  className,
}: MockupPlaceholderProps) {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-center bg-muted border border-border/60 rounded-[18px]",
        ASPECT[aspect],
        className,
      )}
      role="img"
      aria-label={`${label} preview placeholder`}
    >
      <div className="text-center px-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
          Preview
        </div>
        <div className="mt-2 text-sm font-medium text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}
