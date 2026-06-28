import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  getRenewalEngineStatus,
  type CronRun,
  type RenewalAttempt,
  type UpcomingDue,
} from "@/lib/ops/renewal-engine.functions";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function statusChip(status: string) {
  const s = status.toLowerCase();
  if (s === "renewed_to_verified")
    return (
      <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
        Renewed
      </Badge>
    );
  if (s === "awaiting_payment_method")
    return (
      <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-200">
        Awaiting card
      </Badge>
    );
  if (s === "error")
    return (
      <Badge className="border-rose-500/40 bg-rose-500/15 text-rose-200">
        Error
      </Badge>
    );
  if (s === "skipped")
    return (
      <Badge className="border-reps-border bg-reps-panel/60 text-reps-text/70">
        Skipped (parked)
      </Badge>
    );
  return <Badge variant="outline">{status}</Badge>;
}

function CronStatusRow({ label, run }: { label: string; run: CronRun | null }) {
  if (!run) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[12px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
        <div className="flex items-center gap-2 text-amber-200">
          <AlertTriangle className="size-4" />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-amber-200/80">No run recorded</span>
      </div>
    );
  }
  const ok = run.status === "succeeded";
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-sm ${
        ok
          ? "border-emerald-400/30 bg-emerald-500/10"
          : "border-rose-500/40 bg-rose-500/10"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${ok ? "text-emerald-300" : "text-rose-200"}`}
      >
        {ok ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <AlertTriangle className="size-4" />
        )}
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-right">
        <div className={ok ? "text-emerald-200" : "text-rose-200"}>
          {ok ? "Succeeded" : run.status}
        </div>
        <div className="text-xs text-reps-text/60">{fmtDate(run.start_time)}</div>
      </div>
    </div>
  );
}

export function RenewalEngineCard() {
  const fn = useServerFn(getRenewalEngineStatus);
  const q = useQuery({
    queryKey: ["ops-renewal-engine"],
    queryFn: () => fn(),
    refetchInterval: 5 * 60_000,
  });

  if (q.isLoading) {
    return (
      <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-4 text-sm text-reps-text/60">
        Loading renewal engine status…
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="rounded-[16px] border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
        Couldn't load renewal engine status.
      </div>
    );
  }

  const { cron, attempts_last_7d, upcoming_14d } = q.data;

  // Group attempts by day for the timeline.
  const byDay = new Map<string, RenewalAttempt[]>();
  for (const a of attempts_last_7d) {
    const day = a.last_attempt_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(a);
  }
  const days = Array.from(byDay.keys()).sort().reverse();

  return (
    <div className="rounded-[16px] border border-reps-border bg-reps-panel/40">
      <div className="border-b border-reps-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-reps-text">
              Renewal engine — last 7 nights
            </div>
            <div className="text-xs text-reps-text/60">
              Nightly cron that picks up BD members as their due dates arrive
              and creates their Core £99/yr subscription.
            </div>
          </div>
          <button
            type="button"
            onClick={() => q.refetch()}
            className="flex items-center gap-1 rounded-[8px] border border-reps-border bg-reps-ink/40 px-2 py-1 text-xs text-reps-text/70 hover:text-reps-text"
            aria-label="Refresh"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Last cron runs */}
        <div className="grid gap-2 sm:grid-cols-2">
          <CronStatusRow
            label="Renewal cron (03:00 UTC)"
            run={cron.legacy_last}
          />
          <CronStatusRow
            label="Lifecycle cron (03:30 UTC)"
            run={cron.lifecycle_last}
          />
        </div>

        {/* Recent attempts grouped by night */}
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-reps-text/60">
            Processed in the last 7 nights ({attempts_last_7d.length})
          </div>
          {days.length === 0 ? (
            <div className="rounded-[12px] border border-reps-border bg-reps-ink/30 p-3 text-sm text-reps-text/60">
              No members have been processed by the renewal engine in the last
              7 nights. This is expected if no BD due dates fell in that window.
            </div>
          ) : (
            <div className="space-y-3">
              {days.map((day) => {
                const items = byDay.get(day)!;
                return (
                  <div
                    key={day}
                    className="rounded-[12px] border border-reps-border bg-reps-ink/30"
                  >
                    <div className="flex items-center justify-between border-b border-reps-border px-3 py-2 text-xs text-reps-text/70">
                      <span className="font-medium text-reps-text">
                        {fmtDay(day)}
                      </span>
                      <span>{items.length} processed</span>
                    </div>
                    <ul className="divide-y divide-reps-border/50">
                      {items.slice(0, 8).map((a) => (
                        <li
                          key={a.bd_member_id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-reps-text">
                              {a.email}
                            </div>
                            {a.notes && (
                              <div className="truncate text-xs text-reps-text/55">
                                {a.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {statusChip(a.status)}
                            {a.stripe_subscription_id && (
                              <a
                                href={`https://dashboard.stripe.com/subscriptions/${a.stripe_subscription_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-reps-orange hover:underline"
                              >
                                Stripe
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                      {items.length > 8 && (
                        <li className="px-3 py-2 text-xs text-reps-text/55">
                          + {items.length - 8} more
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-reps-text/60">
            <Clock className="size-3.5" /> Upcoming next 14 days (
            {upcoming_14d.length})
          </div>
          {upcoming_14d.length === 0 ? (
            <div className="rounded-[12px] border border-reps-border bg-reps-ink/30 p-3 text-sm text-reps-text/60">
              No BD legacy renewals fall in the next 14 days.
            </div>
          ) : (
            <ul className="divide-y divide-reps-border/50 rounded-[12px] border border-reps-border bg-reps-ink/30">
              {upcoming_14d.slice(0, 12).map((u) => (
                <UpcomingRow key={u.bd_member_id} item={u} />
              ))}
            </ul>
          )}
          {upcoming_14d.length > 12 && (
            <div className="mt-2 text-right text-xs">
              <Link
                to="/admin/memberships"
                className="text-reps-orange hover:underline"
              >
                View full forecast →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function UpcomingRow({ item }: { item: UpcomingDue }) {
  const gbp = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(item.amount_pence / 100);
  const label = item.name?.trim() || item.email;
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
      <div className="min-w-0">
        <div className="truncate text-reps-text">{label}</div>
        <div className="truncate text-xs text-reps-text/55">{item.email}</div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-reps-text/70">{fmtDay(item.due_date)}</span>
        <span className="tabular-nums text-reps-text">{gbp}</span>
      </div>
    </li>
  );
}
