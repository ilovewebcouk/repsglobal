import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Dashboard section header. Use above PPanel/PCard groups inside the main area.
 * Matches the existing 15px semibold display heading + 12px muted description.
 */
export function SectionHeader({ title, description, icon: Icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-white/70" /> : null}
          <h2 className="font-display text-[15px] font-semibold text-white">{title}</h2>
        </div>
        {description ? (
          <p className="mt-1 text-[12px] text-white/55">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
