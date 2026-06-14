import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowDown, ArrowUp } from "lucide-react";

import { PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS, type CreditPackKey } from "@/lib/billing";
import {
  getMyWallet,
  listMyCreditTransactions,
  type CreditTransactionDTO,
} from "@/lib/credits/credits.functions";

const ACTION_LABEL: Record<string, string> = {
  signup_grant: "Plan welcome credits",
  monthly_refill: "Monthly refill",
  topup: "Top-up purchase",
  lead_score: "AI lead score",
  lead_score_backfill: "AI lead score (backfill)",
  ai_reply_draft: "AI reply draft",
  ai_bio: "AI bio",
  ai_tagline: "AI tagline",
  ai_portrait: "AI portrait",
};

function formatAction(a: string) {
  return ACTION_LABEL[a] ?? a.replace(/_/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CreditsPanel() {
  const fetchWallet = useServerFn(getMyWallet);
  const fetchTx = useServerFn(listMyCreditTransactions);

  const { data: wallet, isLoading: wLoading } = useQuery({
    queryKey: ["credits", "wallet"],
    queryFn: () => fetchWallet(),
    staleTime: 30_000,
  });
  const { data: txData, isLoading: tLoading } = useQuery({
    queryKey: ["credits", "transactions"],
    queryFn: () => fetchTx(),
    staleTime: 30_000,
  });
  const tx: CreditTransactionDTO[] = (txData ?? []) as CreditTransactionDTO[];

  const balance = wallet?.balance ?? 0;
  const refill = wallet?.monthly_refill ?? 0;
  const ceiling = wallet?.refill_ceiling ?? 0;
  const pct = ceiling > 0 ? Math.min(100, Math.round((balance / ceiling) * 100)) : 0;

  const navigate = useNavigate();

  return (
    <PPanel>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-reps-border px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-white">
            <Sparkles className="h-4 w-4 text-reps-orange" />
            AI credits
          </h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            Powers AI scoring, drafts, bios, taglines and portraits. Top up any time from your saved card.
          </p>
        </div>
      </div>

      {/* Balance + Refill */}
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <div className="rounded-[16px] border border-reps-border bg-reps-panel-soft p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            Current balance
          </div>
          <div className="mt-1 font-display text-[28px] font-bold text-white">
            {wLoading ? "—" : balance.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-white/55">credits</div>
          {ceiling > 0 ? (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-reps-orange transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 text-[11px] text-white/45">
                {balance.toLocaleString()} / {ceiling.toLocaleString()} refill ceiling (top-ups stack on top)
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[16px] border border-reps-border bg-reps-panel-soft p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            Monthly refill
          </div>
          <div className="mt-1 font-display text-[28px] font-bold text-white">
            {wLoading ? "—" : refill.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-white/55">credits / month, included in your plan</div>
          {wallet?.last_refilled_at ? (
            <div className="mt-3 text-[11px] text-white/45">
              Last refilled {formatDate(wallet.last_refilled_at)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Top-up packs */}
      <div className="border-t border-reps-border px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[13px] font-semibold text-white">Buy more credits</h4>
          <span className="text-[11px] text-white/45">Charged to your saved card</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(Object.values(CREDIT_PACKS)).map((p) => (
            <div
              key={p.key}
              className="flex flex-col rounded-[16px] border border-reps-border bg-reps-panel-soft p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-white">{p.label}</div>
                {p.badge ? (
                  <span className="rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold text-reps-orange">
                    {p.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 font-display text-[24px] font-bold text-white">
                £{p.amountGbp}
              </div>
              <div className="text-[12px] text-white/55">
                {p.credits.toLocaleString()} credits
              </div>
              <Button
                size="sm"
                className="mt-4 w-full"
                onClick={() =>
                  navigate({
                    to: "/checkout/credits",
                    search: { pack: p.key as CreditPackKey },
                  } as never)
                }
              >
                Buy {p.label.toLowerCase()}
              </Button>
            </div>
          ))}
        </div>
      </div>


      {/* Recent transactions */}
      <div className="border-t border-reps-border px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[13px] font-semibold text-white">Recent activity</h4>
          <span className="text-[11px] text-white/45">Last 20</span>
        </div>
        {tLoading ? (
          <div className="py-6 text-center text-[12.5px] text-white/55">Loading…</div>
        ) : tx.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-reps-border px-4 py-6 text-center text-[12.5px] text-white/55">
            No credit activity yet. Your plan refills automatically each month.
          </div>
        ) : (
          <ul className="divide-y divide-reps-border/60">
            {tx.map((t) => {
              const positive = t.delta > 0;
              return (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${positive ? "bg-emerald-500/12 text-emerald-300" : "bg-reps-panel text-white/70"}`}
                    >
                      {positive ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <div className="text-[12.5px] font-medium text-white">{formatAction(t.action)}</div>
                      <div className="text-[11px] text-white/45">{formatDate(t.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[13px] font-semibold ${positive ? "text-emerald-300" : "text-white"}`}>
                      {positive ? "+" : ""}{t.delta}
                    </div>
                    <div className="text-[11px] text-white/45">balance {t.balance_after}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PPanel>
  );
}
