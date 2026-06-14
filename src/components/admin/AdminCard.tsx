import type { ReactNode } from "react";

export type AdminCardSize = "card" | "panel";

export function AdminCard({
  children,
  className = "",
  size = "card",
}: {
  children: ReactNode;
  className?: string;
  size?: AdminCardSize;
}) {
  const radius = size === "panel" ? "rounded-[22px]" : "rounded-[18px]";
  return (
    <div className={`${radius} border border-reps-border bg-reps-panel p-5 ${className}`}>
      {children}
    </div>
  );
}
