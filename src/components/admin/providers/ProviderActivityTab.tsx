import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getProviderActivity } from "@/lib/admin/providers.functions";
import { Skeleton } from "@/components/ui/skeleton";

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40 p-5";

export function ProviderActivityTab({ userId }: { userId: string }) {
  const fetchActivity = useServerFn(getProviderActivity);
  const q = useQuery({
    queryKey: ["admin-provider-activity", userId],
    queryFn: () => fetchActivity({ data: { user_id: userId } }),
  });

  if (q.isLoading) return <Skeleton className="h-64 w-full bg-reps-panel/60" />;
  const rows = q.data?.rows ?? [];

  return (
    <div className={PANEL}>
      <h3 className="mb-3 text-[15px] font-semibold text-white">Admin actions on this provider</h3>
      {rows.length === 0 ? (
        <div className="text-[13px] text-white/55">No admin activity recorded yet.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r: Record<string, unknown>) => (
            <li
              key={String(r.id)}
              className="rounded-[12px] border border-reps-border/70 bg-reps-panel/30 p-3 text-[13px]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-white/90">{String(r.action)}</span>
                <span className="text-[11px] text-white/45">
                  {new Date(String(r.created_at)).toLocaleString("en-GB")}
                </span>
              </div>
              {r.reason ? (
                <div className="mt-1 text-[12px] text-white/60">Reason: {String(r.reason)}</div>
              ) : null}
              {(r.before_state || r.after_state) && (
                <details className="mt-2 text-[12px] text-white/50">
                  <summary className="cursor-pointer select-none text-white/60">before / after</summary>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-[8px] bg-black/30 p-2 font-mono text-[11px]">
{JSON.stringify(
  { before: r.before_state ?? null, after: r.after_state ?? null },
  null,
  2,
)}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
