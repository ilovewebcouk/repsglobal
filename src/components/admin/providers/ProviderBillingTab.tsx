import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getProviderBilling } from "@/lib/admin/providers.functions";
import { Skeleton } from "@/components/ui/skeleton";

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40 p-5";

export function ProviderBillingTab({ userId }: { userId: string }) {
  const fetchBilling = useServerFn(getProviderBilling);
  const q = useQuery({
    queryKey: ["admin-provider-billing", userId],
    queryFn: () => fetchBilling({ data: { user_id: userId } }),
  });

  if (q.isLoading) return <Skeleton className="h-64 w-full bg-reps-panel/60" />;
  const subs = q.data?.subscriptions ?? [];

  return (
    <div className={PANEL}>
      <h3 className="mb-3 text-[15px] font-semibold text-white">Subscriptions</h3>
      {subs.length === 0 ? (
        <div className="text-[13px] text-white/55">
          No Stripe subscriptions on file for this provider.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wide text-white/50">
              <tr>
                <th className="py-2 pr-3">Tier</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Env</th>
                <th className="py-2 pr-3">Renewal</th>
                <th className="py-2 pr-3">Cancel at end</th>
                <th className="py-2 pr-3">Stripe sub</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: Record<string, unknown>) => (
                <tr key={String(s.id)} className="border-t border-reps-border/70">
                  <td className="py-2 pr-3 text-white">{String(s.tier ?? "—")}</td>
                  <td className="py-2 pr-3 text-white/80">{String(s.status ?? "—")}</td>
                  <td className="py-2 pr-3 text-white/60">{String(s.environment ?? "—")}</td>
                  <td className="py-2 pr-3 text-white/70">
                    {s.current_period_end
                      ? new Date(String(s.current_period_end)).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 text-white/70">
                    {s.cancel_at_period_end ? "yes" : "no"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-white/50">
                    {String(s.stripe_subscription_id ?? "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[12px] text-white/45">
        Read-only view. Refunds and disputes are handled from{" "}
        <span className="font-mono">/admin/billing</span>.
      </p>
    </div>
  );
}
