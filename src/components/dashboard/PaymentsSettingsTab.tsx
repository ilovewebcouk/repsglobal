import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowUpRight, CheckCircle2, ExternalLink, Loader2, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import { PPanel, PCard } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import {
  getConnectStatus,
  startStripeConnect,
  refreshConnectStatus,
  type ConnectAccountStatus,
} from "@/lib/payments/connect.functions";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";

export function PaymentsSettingsTab() {
  const tier = useTrainerTier();
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getConnectStatus);
  const startConnect = useServerFn(startStripeConnect);
  const refresh = useServerFn(refreshConnectStatus);

  const eligible = tier === "pro" || tier === "studio";

  const { data: status, isLoading } = useQuery({
    queryKey: ["connect-status"],
    queryFn: () => fetchStatus(),
    enabled: eligible,
  });

  // Auto-refresh on return from Stripe onboarding
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "return" || params.get("connect") === "refresh") {
      refresh().then(() => queryClient.invalidateQueries({ queryKey: ["connect-status"] }));
    }
  }, [refresh, queryClient]);

  const startMutation = useMutation({
    mutationFn: () => startConnect({ data: { environment: getStripeEnvironment() } }),
    onSuccess: (res: { url: string }) => {
      if (res.url) window.location.assign(res.url);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const refreshMutation = useMutation({
    mutationFn: () => refresh(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connect-status"] });
      toast.success("Status refreshed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!eligible) {
    return (
      <PPanel>
        <div className="border-b border-reps-border px-5 py-4">
          <h2 className="text-[14px] font-semibold text-white">Payments</h2>
          <p className="mt-0.5 text-[12px] text-white/55">
            Connect your Stripe account to take bookings and payments through REPs.
          </p>
        </div>
        <div className="p-6">
          <div className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Zap className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-white">Upgrade to Pro to take payments</div>
                <p className="mt-1 text-[13px] leading-relaxed text-white/65">
                  Stripe payments are part of the Pro tier. Money lands directly in your Stripe account — REPs takes £0 booking fee. Upgrade to connect your account.
                </p>
                <div className="mt-3">
                  <a href="/pricing" className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover">
                    See plans <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PPanel>
    );
  }

  if (isLoading || !status) {
    return (
      <PPanel className="p-10">
        <div className="flex items-center gap-3 text-[13px] text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Stripe status…
        </div>
      </PPanel>
    );
  }

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4">
        <h2 className="text-[14px] font-semibold text-white">Payments</h2>
        <p className="mt-0.5 text-[12px] text-white/55">
          Connect your Stripe account. Money lands directly in your Stripe account — REPs takes £0.
        </p>
      </div>
      <div className="space-y-5 p-5">
        <StatusCard status={status} />

        {status.state === "not_connected" || status.state === "disconnected" ? (
          <div>
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="h-10 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Connect Stripe <ArrowUpRight className="ml-1.5 h-4 w-4" /></>}
            </Button>
            <p className="mt-3 text-[12px] text-white/55">
              You'll be redirected to Stripe to sign in or create an account. Takes 5–10 minutes. You can return at any time and pick up where you left off.
            </p>
          </div>
        ) : status.state === "onboarding_incomplete" || status.state === "restricted" ? (
          <div className="space-y-3">
            {status.requirementsDue.length > 0 ? (
              <div className="rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-amber-200">Action needed in Stripe</div>
                    <ul className="mt-2 space-y-1 text-[12px] text-amber-100/90">
                      {status.requirementsDue.slice(0, 6).map((r) => (
                        <li key={r}>• {humanizeReq(r)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="h-10 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue setup <ArrowUpRight className="ml-1.5 h-4 w-4" /></>}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://dashboard.stripe.com/${status.stripeAccountId}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3.5 text-[12.5px] font-semibold text-white/85 hover:text-white"
            >
              Open Stripe dashboard <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              variant="ghost"
              className="h-9 rounded-[10px] px-3.5 text-[12.5px] font-semibold text-white/65 hover:bg-reps-panel-soft hover:text-white"
            >
              {refreshMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh status"}
            </Button>
          </div>
        )}

        <div className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-4 text-[12px] leading-relaxed text-white/55">
          <strong className="font-semibold text-white/80">How it works.</strong> Clients book and pay on REPs via Stripe Checkout. The full amount lands in your Stripe account — REPs takes £0 booking commission. Refunds, payouts and tax are handled inside your own Stripe dashboard.
        </div>
      </div>
    </PPanel>
  );
}

function StatusCard({ status }: { status: ConnectAccountStatus }) {
  const pill =
    status.state === "active"
      ? { label: "Active", cls: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300", Icon: CheckCircle2 }
      : status.state === "restricted"
        ? { label: "Restricted", cls: "border-amber-400/30 bg-amber-500/15 text-amber-300", Icon: ShieldAlert }
        : status.state === "onboarding_incomplete"
          ? { label: "Onboarding incomplete", cls: "border-amber-400/30 bg-amber-500/15 text-amber-300", Icon: ShieldAlert }
          : status.state === "disconnected"
            ? { label: "Disconnected", cls: "border-white/20 bg-white/5 text-white/60", Icon: ShieldAlert }
            : { label: "Not connected", cls: "border-white/20 bg-white/5 text-white/60", Icon: ShieldAlert };

  return (
    <PCard className="!p-4">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] border ${pill.cls}`}>
          <pill.Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${pill.cls}`}>
              {pill.label}
            </span>
            {status.stripeAccountId ? (
              <span className="font-mono text-[11px] text-white/45 truncate">{status.stripeAccountId}</span>
            ) : null}
          </div>
          {status.state === "active" ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-white/70">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Charges enabled</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Payouts enabled</span>
              {status.defaultCurrency ? <span className="text-white/45">· {status.defaultCurrency.toUpperCase()}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </PCard>
  );
}

function humanizeReq(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\./g, " — ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
