// Small reusable badge to explain why per-page session detail is missing when
// the visitor's browser sent a Do-Not-Track / Global Privacy Control header.
// v1.2 still records a session heartbeat for those users (so "Online now"
// works), but skips per-path member_session_events. Surface this on any
// Sessions-style panel so admins understand the intentional gap.

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function DntGpcBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70",
        className,
      )}
      title="This member's browser sent a privacy preference (DNT or GPC). We still show presence, but skip per-page detail by design."
    >
      <ShieldCheck className="h-3 w-3 text-emerald-300" />
      Limited activity detail — privacy preference respected
    </span>
  );
}
