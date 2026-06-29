import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getOpenAlerts, runAlertEvaluator } from "@/lib/ops/operations.functions";
import { SystemStatusStrip } from "@/components/ops/SystemStatusStrip";
import { OpsAlertsBanner } from "./OpsAlertsBanner";

/**
 * Composite block rendered at the top of the admin Overview.
 * Surfaces open alerts + the 5-tile system status strip without a
 * dedicated /admin/ops surface.
 */
export function OverviewOpsHeader() {
  const getAlerts = useServerFn(getOpenAlerts);
  const runEval = useServerFn(runAlertEvaluator);
  const alertsQ = useQuery({
    queryKey: ["ops-alerts-open"],
    queryFn: () => getAlerts(),
    refetchInterval: 60_000,
  });
  return (
    <div className="space-y-4">
      <OpsAlertsBanner
        alerts={alertsQ.data ?? []}
        onEvaluate={async () => {
          const r = await runEval();
          toast.success(`Alert evaluator ran (${r.opened} opens)`);
          await alertsQ.refetch();
        }}
      />
      <SystemStatusStrip />
    </div>
  );
}
