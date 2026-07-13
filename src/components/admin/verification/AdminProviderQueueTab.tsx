/**
 * Admin — Providers verification queue.
 *
 * Merges every pending training-provider approval into one list:
 *   • Name changes           (provider_name_requests)
 *   • Domain confirmations   (provider_domain_verifications @ pending_admin_review)
 *   • Profile field changes  (provider_change_requests @ pending)
 *
 * Each row = one pending item. Admin selects a row, reviews the diff, and
 * approves or rejects with a note (note required on reject).
 */
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

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
  adminDecideProviderChange,
  adminListProviderQueue,
  type AdminProviderQueueItem,
} from "@/lib/verification/provider-changes.functions";

const SOURCE_LABEL: Record<AdminProviderQueueItem["source"], string> = {
  name: "Name change",
  domain: "Domain confirmation",
  change: "Profile change",
};

type StatusFilter = "pending" | "approved" | "rejected" | "withdrawn";
const STATUS_TABS: readonly StatusFilter[] = ["pending", "approved", "rejected", "withdrawn"];
const STATUS_LABEL: Record<StatusFilter, string> = {
  pending: "New",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
const STATUS_PILL: Record<StatusFilter, string> = {
  pending: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  approved: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  rejected: "border-rose-400/30 bg-rose-500/15 text-rose-300",
  withdrawn: "border-white/15 bg-white/10 text-white/60",
};

function readValue(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "object" && "value" in (v as Record<string, unknown>)) {
    const inner = (v as Record<string, unknown>).value;
    return inner == null ? null : String(inner);
  }
  return String(v);
}

export function AdminProviderQueueTab() {
  const qc = useQueryClient();
  const fetchQueue = useServerFn(adminListProviderQueue);
  const decide = useServerFn(adminDecideProviderChange);

  const [status, setStatus] = React.useState<StatusFilter>("pending");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  const listQ = useQuery({
    queryKey: ["admin-provider-queue", status],
    queryFn: () => fetchQueue({ data: { status } }),
    refetchInterval: status === "pending" ? 30_000 : false,
  });

  const rows = listQ.data ?? [];

  const selected = React.useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const decideMut = useMutation({
    mutationFn: async (decision: "approved" | "rejected") => {
      if (!selected) return;
      if (decision === "rejected" && !note.trim()) {
        throw new Error("A note is required when rejecting a change.");
      }
      await decide({
        data: {
          source: selected.source,
          id: selected.id,
          decision,
          admin_note: note.trim() || null,
        },
      });
    },
    onSuccess: () => {
      setNote("");
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["admin-provider-queue"] });
      qc.invalidateQueries({ queryKey: ["admin-provider-queue-count"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-name-count"] });
    },
    onError: (e: Error) => alert(e.message || "Decision failed"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex self-start rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setSelectedId(null);
              setNote("");
            }}
            className={`rounded-[8px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
              status === s ? "bg-reps-orange text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        {/* LIST */}
        <PPanel className="flex flex-col">
          <div className="border-b border-reps-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-white">
                {status === "pending"
                  ? "Pending profile changes"
                  : status === "approved"
                    ? "Approved profile changes"
                    : status === "rejected"
                      ? "Rejected profile changes"
                      : "Withdrawn profile changes"}
              </h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_PILL[status]}`}
              >
                {rows.length}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-white/55">
              {status === "pending"
                ? "Every provider profile edit lands here for review before going live."
                : `Recent ${STATUS_LABEL[status].toLowerCase()} provider profile edits.`}
            </p>
          </div>
          <ul className="flex-1 divide-y divide-reps-border overflow-y-auto">
            {listQ.isLoading && (
              <li className="p-6 text-center text-[12px] text-white/55">Loading…</li>
            )}
            {!listQ.isLoading && rows.length === 0 && (
              <li className="p-6 text-center text-[12px] text-white/55">
                No {STATUS_LABEL[status].toLowerCase()} profile changes.
              </li>
            )}
          {rows.map((r) => {
            const sel = r.id === selectedId;
            const proposed = readValue(r.proposed_value);
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-white">
                      {r.provider_name ?? "Unnamed provider"}
                    </span>
                    <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-amber-300">
                      {SOURCE_LABEL[r.source]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-white/60">
                    <span className="font-medium text-white/75">{r.field_label}</span>
                    {proposed ? (
                      <>
                        {" · "}
                        <span className="truncate">
                          {proposed.length > 60 ? `${proposed.slice(0, 60)}…` : proposed}
                        </span>
                      </>
                    ) : (
                      " · (empty)"
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-white/45">
                    <TimeAgo iso={r.created_at} className="text-white/45" />
                    {r.provider_email ? ` · ${r.provider_email}` : null}
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
              <EmptyTitle>Select a change to review</EmptyTitle>
              <EmptyDescription>
                Approve to publish the new value to the provider's public profile,
                or reject with a note.
              </EmptyDescription>
            </Empty>
          </PPanel>
        )}

        {selected && (
          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-300">
                  {SOURCE_LABEL[selected.source]}
                </span>
                <span className="text-[12px] text-white/55">
                  {selected.provider_name ?? "Unnamed provider"}
                  {selected.provider_slug ? ` · /t/${selected.provider_slug}` : ""}
                </span>
              </div>
              <h3 className="mt-2 text-[14px] font-semibold text-white">
                {selected.field_label}
              </h3>
              <p className="mt-0.5 text-[12px] text-white/55">
                Submitted <TimeAgo iso={selected.created_at} className="text-white/70" />
                {selected.provider_email ? ` · ${selected.provider_email}` : null}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-white/45">
                  Currently live
                </div>
                <div className="mt-1.5 whitespace-pre-wrap break-words text-[13px] text-white/80">
                  {readValue(selected.current_value) ?? (
                    <span className="italic text-white/40">— (empty)</span>
                  )}
                </div>
              </div>
              <div className="rounded-[12px] border border-amber-400/30 bg-amber-500/[0.06] p-3">
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-300">
                  Proposed
                </div>
                <div className="mt-1.5 whitespace-pre-wrap break-words text-[13px] text-white">
                  {readValue(selected.proposed_value) ?? (
                    <span className="italic text-white/40">— (empty)</span>
                  )}
                </div>
              </div>
            </div>

            {status === "pending" ? (
              <div className="flex flex-col gap-3 border-t border-reps-border px-5 py-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                    Admin note (required for rejection)
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Please rephrase — the current wording implies a guarantee."
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
              <div className="border-t border-reps-border px-5 py-3 text-[11.5px] text-white/55">
                Historical record — read-only.
              </div>
            )}
          </PPanel>
        )}
      </div>
      </div>
    </div>
  );
}
