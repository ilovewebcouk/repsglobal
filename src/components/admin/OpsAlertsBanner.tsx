import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Alerts banner — surfaces open ops_alerts on the admin Overview.
 * Lifted from the retired /admin/ops hub so the alert evaluator's output
 * stays visible without a dedicated Operations surface.
 */
export function OpsAlertsBanner({
  alerts,
  onEvaluate,
}: {
  alerts: Array<{ id: string; kind: string; severity: string }>;
  onEvaluate?: () => void;
}) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-200">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="size-4" /> All systems normal
        </div>
        {onEvaluate && (
          <Button size="sm" variant="ghost" onClick={onEvaluate}>
            Re-evaluate now
          </Button>
        )}
      </div>
    );
  }
  const crit = alerts.filter((a) => a.severity === "crit").length;
  return (
    <div className="rounded-[16px] border border-rose-500/40 bg-rose-500/10 p-3 text-rose-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="size-4" />
          <span className="font-semibold">
            {alerts.length} open alert{alerts.length === 1 ? "" : "s"}
          </span>
          {crit > 0 && <Badge variant="destructive">{crit} critical</Badge>}
        </div>
        <div className="flex gap-2">
          {onEvaluate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEvaluate}
              className="border-rose-300/40 bg-transparent text-rose-50 hover:bg-rose-500/20 hover:text-rose-50"
            >
              Re-evaluate
            </Button>
          )}
          <Link to="/admin/billing">
            <Button size="sm" className="bg-rose-50 text-rose-900 hover:bg-white hover:text-rose-900">
              Open billing
            </Button>
          </Link>
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 text-xs">
        {alerts.slice(0, 6).map((a) => (
          <li
            key={a.id}
            className="rounded-full border border-rose-400/40 bg-rose-500/20 px-2 py-0.5"
          >
            {a.kind}
          </li>
        ))}
      </ul>
    </div>
  );
}
