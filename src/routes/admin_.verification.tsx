import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { ACard, AdminShell, APanel } from "@/components/dashboard/AdminShell";
import { Button } from "@/components/ui/button";
import {
  getVerificationDocUrl,
  listPendingVerifications,
  reviewVerification,
} from "@/lib/verification/verification.functions";

export const Route = createFileRoute("/admin_/verification")({
  ssr: false,
  beforeLoad: requireRole(['admin']),
  component: AdminVerificationPage,
});

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function AdminVerificationPage() {
  const qc = useQueryClient();
  const fetchPending = useServerFn(listPendingVerifications);
  const decide = useServerFn(reviewVerification);
  const getDocUrl = useServerFn(getVerificationDocUrl);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useQuery({
    queryKey: ["admin-pending-verifications"],
    queryFn: () => fetchPending(),
  });

  const reviewMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      decision: "approved" | "rejected" | "changes_requested";
    }) => decide({ data: input }),
    onSettled: () => {
      setBusyId(null);
      qc.invalidateQueries({ queryKey: ["admin-pending-verifications"] });
    },
  });

  const openDoc = async (path: string) => {
    try {
      const { url } = await getDocUrl({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open document");
    }
  };

  const handleDecision = (id: string, decision: "approved" | "rejected") => {
    setBusyId(id);
    reviewMutation.mutate({ id, decision });
  };

  const rows = pending.data ?? [];
  const stats = [
    { label: "In queue", value: String(rows.length), icon: Clock, tint: "bg-reps-orange-soft text-reps-orange" },
    { label: "Approved today", value: "—", icon: CheckCircle2, tint: "bg-reps-green/15 text-reps-green" },
    { label: "Rejected (7d)", value: "—", icon: XCircle, tint: "bg-red-500/15 text-red-400" },
    { label: "Avg. review time", value: "—", icon: ShieldCheck, tint: "bg-white/10 text-white/80" },
  ];

  return (
    <AdminShell
      active="Verification"
      title="Verification queue"
      subtitle="Review credentials and insurance before activating professionals."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <ACard key={s.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white/55">{s.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">{s.value}</div>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </span>
            </div>
          </ACard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <APanel className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
            <div>
              <h2 className="font-display text-[16px] font-bold text-white">Pending review</h2>
              <p className="text-[12px] text-white/55">
                {pending.isLoading ? "Loading…" : `${rows.length} awaiting verification`}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-reps-border">
            {!pending.isLoading && rows.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-white/55">
                Queue is clear — no submissions awaiting review.
              </li>
            )}
            {rows.map((r) => {
              const name =
                r.professional?.full_name ||
                r.professional?.trading_name ||
                "Unnamed professional";
              const busy = busyId === r.id;
              return (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-reps-panel/40 font-semibold text-white/70">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{name}</span>
                        {r.professional?.city && (
                          <span className="text-[11px] text-white/45">{r.professional.city}</span>
                        )}
                        <span className="text-[11px] text-white/45">
                          Submitted {relativeTime(r.created_at)}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-white/65">
                        {r.qualification} · {r.awarding_body}
                        {r.year ? ` · ${r.year}` : ""}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(r.doc_paths ?? []).map((p) => (
                          <button
                            key={p}
                            onClick={() => openDoc(p)}
                            className="inline-flex items-center gap-1 rounded-[6px] bg-reps-ink px-2 py-1 text-[11px] text-white/75 hover:text-reps-orange"
                          >
                            <FileText className="h-3 w-3" />
                            {p.split("/").pop()?.slice(0, 28) ?? "doc"}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleDecision(r.id, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleDecision(r.id, "approved")}
                        className="bg-reps-orange text-white hover:bg-reps-orange-hover"
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Approve"}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </APanel>

        <div className="space-y-6">
          <ACard>
            <h3 className="font-display text-[15px] font-bold text-white">SLA & policy</h3>
            <ul className="mt-3 space-y-2 text-[12px] text-white/70">
              <li className="flex justify-between">
                <span>Review target</span>
                <span className="font-semibold text-white">24h</span>
              </li>
              <li className="flex justify-between">
                <span>Approved → tier</span>
                <span className="font-semibold text-emerald-300">Verified</span>
              </li>
            </ul>
            <button className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-reps-orange">
              Open policy <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </ACard>
        </div>
      </div>
    </AdminShell>
  );
}
