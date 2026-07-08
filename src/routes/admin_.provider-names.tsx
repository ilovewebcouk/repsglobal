import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { CheckCircle2, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import {
  DashboardEmpty as Empty,
  DashboardEmptyTitle as EmptyTitle,
  DashboardEmptyDescription as EmptyDescription,
  DashboardEmptyIcon as EmptyIcon,
} from "@/components/dashboard/ui/empty";
import { TimeAgo } from "@/components/verification/TimeAgo";
import {
  listProviderNameRequests,
  reviewProviderNameRequest,
} from "@/lib/verification/provider-name.functions";

export const Route = createFileRoute("/admin_/provider-names")({
  head: () => ({
    meta: [
      { title: "Provider name approvals — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminProviderNamesPage,
});

type Tab = "pending" | "approved" | "rejected";

function AdminProviderNamesPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listProviderNameRequests);
  const review = useServerFn(reviewProviderNameRequest);

  const [tab, setTab] = React.useState<Tab>("pending");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  const listQ = useQuery({
    queryKey: ["admin-provider-name-requests", tab],
    queryFn: () => fetchList({ data: { status: tab } }),
    refetchInterval: tab === "pending" ? 30_000 : false,
  });

  const selected = React.useMemo(
    () => listQ.data?.find((r) => r.id === selectedId) ?? null,
    [listQ.data, selectedId],
  );

  const decideMut = useMutation({
    mutationFn: async (decision: "approved" | "rejected") => {
      if (!selectedId) return;
      if (decision === "rejected" && !note.trim()) {
        throw new Error("A note is required when rejecting a name change.");
      }
      await review({
        data: {
          id: selectedId,
          decision,
          admin_note: note.trim() || null,
        },
      });
    },
    onSuccess: () => {
      setNote("");
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["admin-provider-name-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-name-count"] });
    },
    onError: (e: Error) => alert(e.message || "Decision failed"),
  });

  const rows = listQ.data ?? [];

  return (
    <DashboardShell
      role="admin"
      active="Name approvals"
      title="Provider name approvals"
      subtitle="Approve or reject public name changes submitted by training providers."
    >
      <div className="mb-4 inline-flex rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
        {(["pending", "approved", "rejected"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedId(null);
              setNote("");
            }}
            className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
              tab === t ? "bg-reps-orange text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* LIST */}
        <PPanel className="flex flex-col">
          <ul className="flex-1 divide-y divide-reps-border overflow-y-auto">
            {listQ.isLoading && (
              <li className="p-6 text-center text-[12px] text-white/55">Loading…</li>
            )}
            {!listQ.isLoading && rows.length === 0 && (
              <li className="p-6 text-center text-[12px] text-white/55">
                No {tab} requests.
              </li>
            )}
            {rows.map((r) => {
              const sel = r.id === selectedId;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => {
                      setSelectedId(r.id);
                      setNote("");
                    }}
                    className={`block w-full px-3 py-3 text-left transition ${
                      sel ? "bg-reps-orange-soft" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="truncate text-[13px] font-semibold text-white">
                      {r.requested_name}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-white/55">
                      {r.current_approved_name
                        ? `Was: ${r.current_approved_name}`
                        : "First-time name"}
                    </div>
                    <div className="mt-1 text-[10px] text-white/45">
                      <TimeAgo iso={r.created_at} className="text-white/45" />
                      {r.contact_email ? ` · ${r.contact_email}` : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </PPanel>

        {/* DETAIL */}
        <div className="space-y-4">
          {!selected && (
            <PPanel className="p-10">
              <Empty>
                <EmptyIcon>
                  <ShieldCheck />
                </EmptyIcon>
                <EmptyTitle>Select a request to review</EmptyTitle>
                <EmptyDescription>
                  Only pending requests can be approved or rejected. Approving copies the new
                  name to the provider&rsquo;s public profile.
                </EmptyDescription>
              </Empty>
            </PPanel>
          )}

          {selected && (
            <PPanel>
              <div className="border-b border-reps-border px-5 py-4">
                <h3 className="text-[14px] font-semibold text-white">Requested name</h3>
                <p className="mt-1 font-display text-[22px] font-bold text-white">
                  {selected.requested_name}
                </p>
                <p className="mt-1 text-[12px] text-white/55">
                  Currently approved:{" "}
                  <span className="text-white/80">
                    {selected.current_approved_name ?? "— (never approved)"}
                  </span>
                </p>
                <p className="mt-1 text-[12px] text-white/55">
                  Submitted{" "}
                  <TimeAgo iso={selected.created_at} className="text-white/70" />
                  {selected.contact_email ? ` · ${selected.contact_email}` : null}
                </p>
              </div>

              {selected.status === "pending" ? (
                <div className="flex flex-col gap-3 px-5 py-4">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                      Admin note (required for rejection)
                    </label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="e.g. Trademark conflict — please contact support before resubmitting."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="destructive-ghost"
                      disabled={decideMut.isPending}
                      onClick={() => decideMut.mutate("rejected")}
                    >
                      {decideMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Reject
                    </Button>
                    <Button
                      disabled={decideMut.isPending}
                      onClick={() => decideMut.mutate("approved")}
                    >
                      {decideMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve &amp; publish
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-5 py-4 text-[12.5px] text-white/70">
                  <div className="inline-flex items-center gap-2">
                    {selected.status === "approved" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Approved</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span>Rejected</span>
                      </>
                    )}
                    {selected.reviewed_at ? (
                      <>
                        <Clock className="h-3.5 w-3.5 text-white/45" />
                        <TimeAgo iso={selected.reviewed_at} className="text-white/60" />
                      </>
                    ) : null}
                  </div>
                  {selected.admin_note ? (
                    <p className="whitespace-pre-wrap text-white/60">
                      Note: {selected.admin_note}
                    </p>
                  ) : null}
                </div>
              )}
            </PPanel>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
