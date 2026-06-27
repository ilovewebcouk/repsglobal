import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { requireRole } from "@/lib/route-gates";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  diagnoseWebhookFailures,
  type DiagnosisRow,
  type LookupAttempt,
  type ResolverStep,
} from "@/lib/admin/webhook-recovery.functions";
import {
  dryRunReplayWebhookFailures,
  type ReplayRow,
} from "@/lib/admin/webhook-replay.functions";

export const Route = createFileRoute("/admin_/webhook-recovery")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Webhook recovery — REPS Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminWebhookRecoveryPage,
});

const STEP_LABEL: Record<Exclude<ResolverStep, null>, string> = {
  metadata_reps_user_id: "1. event.metadata.reps_user_id",
  subscriptions_stripe_customer_id: "2. subscriptions.stripe_customer_id",
  stripe_customer_metadata: "3. Stripe customer.metadata.reps_user_id",
  legacy_stripe_link: "4. legacy_stripe_link → bd_member_seed.claimed_user_id",
  auth_users_email: "5. customer.email → auth.users",
};

function StepBadge({ a }: { a: LookupAttempt }) {
  const tone = !a.consulted
    ? "bg-zinc-500/15 text-zinc-300 border-zinc-400/30"
    : a.resolved_user_id
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
      : "bg-red-500/15 text-red-300 border-red-400/30";
  const label = !a.consulted
    ? "skip"
    : a.resolved_user_id
      ? "hit"
      : "miss";
  return (
    <Badge className={`${tone} border text-[10px] uppercase tracking-wider`}>
      {label}
    </Badge>
  );
}

function LadderTable({ steps }: { steps: LookupAttempt[] }) {
  return (
    <div className="space-y-1">
      {steps.map((s) => (
        <div
          key={s.step}
          className="flex items-start gap-2 text-[12px] leading-snug"
        >
          <StepBadge a={s} />
          <div className="flex-1 min-w-0">
            <div className="text-white/80">{STEP_LABEL[s.step]}</div>
            {s.note && (
              <div className="text-white/45 text-[11px]">{s.note}</div>
            )}
            {s.resolved_user_id && (
              <div className="text-emerald-300/80 text-[11px] font-mono break-all">
                → {s.resolved_user_id}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ row }: { row: DiagnosisRow }) {
  return (
    <PCard>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className="bg-white/5 border border-white/15 text-white/80 text-[10px] uppercase tracking-wider">
              {row.event_type}
            </Badge>
            {row.would_resolve_via ? (
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[10px] uppercase tracking-wider">
                resolvable
              </Badge>
            ) : (
              <Badge className="bg-red-500/15 text-red-300 border border-red-400/30 text-[10px] uppercase tracking-wider">
                still unresolvable
              </Badge>
            )}
            {row.would_create_subscription && (
              <Badge className="bg-orange-500/15 text-orange-300 border border-orange-400/30 text-[10px] uppercase tracking-wider">
                would create sub
              </Badge>
            )}
          </div>
          <div className="text-[12px] text-white/55 font-mono">
            {row.stripe_event_id}
          </div>
        </div>
        <div className="text-right text-[11px] text-white/55">
          <div>{new Date(row.created_at).toLocaleString("en-GB")}</div>
        </div>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[12px] mb-4">
        <div>
          <dt className="text-white/45">Stripe customer</dt>
          <dd className="font-mono text-white/80 break-all">
            {row.stripe_customer_id ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-white/45">Customer email</dt>
          <dd className="text-white/80 break-all">
            {row.customer_email ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-white/45">BD member id</dt>
          <dd className="text-white/80">{row.bd_member_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-white/45">Resolved user_id</dt>
          <dd className="font-mono text-white/80 break-all">
            {row.resolved_user_id ?? "—"}
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-white/45">Processing error</dt>
          <dd className="text-red-300/90 text-[11px] font-mono break-words">
            {row.processing_error}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
            Existing ladder
          </div>
          <LadderTable steps={row.existing_ladder} />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
            Proposed additions
          </div>
          <LadderTable steps={row.proposed_ladder} />
        </div>
      </div>
    </PCard>
  );
}

function AdminWebhookRecoveryPage() {
  const fn = useServerFn(diagnoseWebhookFailures);
  const q = useQuery({
    queryKey: ["admin", "webhook-recovery", "diagnosis"],
    queryFn: () => fn({ data: {} }),
  });

  const data = q.data;

  return (
    <DashboardShell
      role="admin"
      active="Churn"
      title="Webhook recovery"
      subtitle="Diagnose payment_events rows the live webhook handler failed to process. Read-only — no replay runs from this page."
    >
      <div className="space-y-6">
        {q.isLoading && (
          <PCard>
            <div className="text-white/55 text-[13px]">Loading diagnosis…</div>
          </PCard>
        )}
        {q.error && (
          <PCard>
            <div className="text-red-300 text-[13px]">
              Diagnosis failed: {(q.error as Error).message}
            </div>
          </PCard>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <PCard>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                  Failed events (last 7d)
                </div>
                <div className="font-display text-[28px] leading-none">
                  {data.total_failed_events}
                </div>
              </PCard>
              <PCard>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                  Resolvable after fix
                </div>
                <div className="font-display text-[28px] leading-none text-emerald-300">
                  {data.resolvable_after_fix}
                </div>
              </PCard>
              <PCard>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                  Still unresolvable
                </div>
                <div className="font-display text-[28px] leading-none text-red-300">
                  {data.still_unresolvable}
                </div>
              </PCard>
              <PCard>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                  Same root cause
                </div>
                <div className="font-display text-[28px] leading-none">
                  {data.all_fail_for_same_reason ? "Yes" : "No"}
                </div>
              </PCard>
            </div>

            {data.dominant_failure_reason && (
              <PCard>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                  Dominant failure reason
                </div>
                <div className="text-red-300/90 text-[12px] font-mono break-words">
                  {data.dominant_failure_reason}
                </div>
              </PCard>
            )}

            <div className="space-y-3">
              <div className="text-[12px] text-white/55">
                Showing {data.rows.length} events since{" "}
                {new Date(data.since).toLocaleString("en-GB")}.
              </div>
              {data.rows.map((row) => (
                <EventCard key={row.payment_event_id} row={row} />
              ))}
            </div>

            <details className="text-[11px] text-white/45">
              <summary className="cursor-pointer">Raw JSON</summary>
              <pre className="mt-2 p-3 bg-black/40 rounded overflow-auto text-[10px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
