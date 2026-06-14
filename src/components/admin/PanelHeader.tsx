import type { ReactNode } from "react";

export function PanelHeader({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-[15px] font-semibold text-white">{title}</h2>
      {right}
    </div>
  );
}
