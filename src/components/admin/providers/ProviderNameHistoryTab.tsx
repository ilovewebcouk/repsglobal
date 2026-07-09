import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getProviderNameHistory } from "@/lib/admin/providers.functions";
import { Skeleton } from "@/components/ui/skeleton";

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40 p-5";

export function ProviderNameHistoryTab({ userId }: { userId: string }) {
  const fetchHist = useServerFn(getProviderNameHistory);
  const q = useQuery({
    queryKey: ["admin-provider-names", userId],
    queryFn: () => fetchHist({ data: { user_id: userId } }),
  });

  if (q.isLoading) return <Skeleton className="h-64 w-full bg-reps-panel/60" />;

  const reqs = q.data?.name_requests ?? [];
  const renames = q.data?.rename_audits ?? [];
  const domains = q.data?.domains ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className={PANEL}>
        <h3 className="mb-3 text-[15px] font-semibold text-white">Admin renames</h3>
        {renames.length === 0 ? (
          <div className="text-[13px] text-white/55">No admin renames recorded.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {renames.map((r: Record<string, unknown>) => {
              const before = (r.before_state ?? {}) as Record<string, unknown>;
              const after = (r.after_state ?? {}) as Record<string, unknown>;
              return (
                <li
                  key={String(r.id)}
                  className="rounded-[12px] border border-reps-border/70 bg-reps-panel/30 p-3 text-[13px]"
                >
                  <div className="text-white/85">
                    <span className="text-white/55">{String(before.business_name ?? "—")}</span>
                    <span className="mx-2 text-white/40">→</span>
                    <span className="font-semibold text-white">{String(after.business_name ?? "—")}</span>
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-white/50">
                    /t/{String(before.slug ?? "—")} → /t/{String(after.slug ?? "—")}
                  </div>
                  {r.reason ? (
                    <div className="mt-1 text-[12px] text-white/60">Reason: {String(r.reason)}</div>
                  ) : null}
                  <div className="mt-1 text-[11px] text-white/40">
                    {new Date(String(r.created_at)).toLocaleString("en-GB")}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={PANEL}>
        <h3 className="mb-3 text-[15px] font-semibold text-white">
          Provider-submitted name requests
        </h3>
        {reqs.length === 0 ? (
          <div className="text-[13px] text-white/55">No requests submitted.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {reqs.map((r: Record<string, unknown>) => (
              <li
                key={String(r.id)}
                className="rounded-[12px] border border-reps-border/70 bg-reps-panel/30 p-3 text-[13px]"
              >
                <div className="text-white/85">
                  Requested: <span className="font-semibold text-white">{String(r.requested_name)}</span>
                </div>
                <div className="mt-1 text-[12px] text-white/55">
                  Status: {String(r.status)} · {new Date(String(r.created_at)).toLocaleString("en-GB")}
                </div>
                {r.admin_note ? (
                  <div className="mt-1 text-[12px] text-white/60">Note: {String(r.admin_note)}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={PANEL}>
        <h3 className="mb-3 text-[15px] font-semibold text-white">Domain verifications</h3>
        {domains.length === 0 ? (
          <div className="text-[13px] text-white/55">No domain verifications on record.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {domains.map((d: Record<string, unknown>) => (
              <li
                key={String(d.id)}
                className="rounded-[12px] border border-reps-border/70 bg-reps-panel/30 p-3 text-[13px]"
              >
                <div className="font-mono text-white/85">{String(d.domain ?? "—")}</div>
                <div className="mt-1 text-[12px] text-white/55">
                  Status: {String(d.status ?? "—")} ·{" "}
                  {d.created_at
                    ? new Date(String(d.created_at)).toLocaleString("en-GB")
                    : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
