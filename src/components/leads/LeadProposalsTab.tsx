import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Send, Check, X as XIcon, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProposalForm } from "./ProposalForm";
import {
  createProposal,
  listProposals,
  updateProposal,
  PROPOSAL_CADENCE_LABEL,
  PROPOSAL_STATUS_LABEL,
  type ProposalBody,
  type ProposalDTO,
  type ProposalStatus,
} from "@/lib/leads/proposals.functions";
import { timeAgo } from "@/lib/format/relative-time";

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    pence / 100,
  );
}

function statusClasses(status: ProposalStatus): string {
  switch (status) {
    case "accepted":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
    case "sent":
      return "border-reps-orange/30 bg-reps-orange/15 text-reps-orange";
    case "declined":
    case "withdrawn":
      return "border-white/10 bg-white/5 text-white/50";
    default:
      return "border-white/15 bg-white/5 text-white/70";
  }
}

export function LeadProposalsTab({ enquiryId }: { enquiryId: string }) {
  const list = useServerFn(listProposals);
  const create = useServerFn(createProposal);
  const update = useServerFn(updateProposal);
  const qc = useQueryClient();

  const [editing, setEditing] = React.useState<{ kind: "new" } | { kind: "edit"; proposal: ProposalDTO } | null>(null);

  const queryKey = ["lead-proposals", enquiryId] as const;
  const activityKey = ["lead-activity", enquiryId] as const;

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => list({ data: { enquiryId } }),
    staleTime: 15_000,
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: activityKey });
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  const createMut = useMutation({
    mutationFn: (vars: { values: ProposalBody; status: "draft" | "sent" }) =>
      create({ data: { enquiryId, body: vars.values, status: vars.status } }),
    onSuccess: (_d, vars) => {
      setEditing(null);
      invalidateAll();
      toast.success(vars.status === "sent" ? "Proposal sent" : "Draft saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save proposal"),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; body?: ProposalBody; status?: ProposalStatus }) =>
      update({ data: vars }),
    onSuccess: (_d, vars) => {
      setEditing(null);
      invalidateAll();
      if (vars.status) toast.success(`Marked ${PROPOSAL_STATUS_LABEL[vars.status].toLowerCase()}`);
      else toast.success("Proposal updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update proposal"),
  });

  return (
    <div className="flex flex-col gap-4">
      {editing?.kind === "new" ? (
        <ProposalForm
          onCancel={() => setEditing(null)}
          saving={createMut.isPending}
          submitLabel="Save draft"
          secondaryLabel="Save & mark sent"
          onSubmit={(values) => createMut.mutate({ values, status: "draft" })}
          onSecondary={(values) => createMut.mutate({ values, status: "sent" })}
        />
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-white/55">
            {data.length === 0
              ? "No proposals yet."
              : `${data.length} proposal${data.length === 1 ? "" : "s"}`}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setEditing({ kind: "new" })}
            className="h-8 rounded-[8px] bg-reps-orange px-3 text-[12px] font-medium text-white hover:bg-reps-orange/90"
            data-icon
          >
            <Plus className="size-3.5" /> New proposal
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {isLoading && data.length === 0 ? (
          <p className="text-[12px] text-white/45">Loading proposals…</p>
        ) : (
          data.map((p) => {
            const isEditing = editing?.kind === "edit" && editing.proposal.id === p.id;
            if (isEditing) {
              return (
                <ProposalForm
                  key={p.id}
                  initial={p.body}
                  onCancel={() => setEditing(null)}
                  saving={updateMut.isPending}
                  submitLabel="Save changes"
                  onSubmit={(values) => updateMut.mutate({ id: p.id, body: values })}
                />
              );
            }
            const terminal = p.status === "accepted" || p.status === "declined" || p.status === "withdrawn";
            return (
              <div
                key={p.id}
                className="rounded-[14px] border border-reps-border bg-reps-panel-soft/40 px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-[13.5px] font-semibold text-white">{p.body.title}</h4>
                      <Badge
                        variant="outline"
                        className={`shrink-0 rounded-[6px] border px-1.5 py-0 text-[10.5px] font-medium uppercase tracking-wide ${statusClasses(p.status)}`}
                      >
                        {PROPOSAL_STATUS_LABEL[p.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-white/65">
                      {formatGbp(p.body.price_pence)} · {PROPOSAL_CADENCE_LABEL[p.body.cadence]}
                      {p.body.sessions ? ` · ${p.body.sessions} sessions` : ""}
                    </p>
                    {p.body.summary ? (
                      <p className="mt-1.5 text-[12.5px] text-white/75">{p.body.summary}</p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] text-white/45">
                      {p.status === "sent" && p.sent_at ? `Sent ${timeAgo(p.sent_at)}` : `Created ${timeAgo(p.created_at)}`}
                    </p>
                  </div>
                </div>

                {!terminal && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-reps-border/60 pt-2.5">
                    {p.status === "draft" && (
                      <>
                        <ActionBtn
                          icon={<Send className="size-3" />}
                          label="Send"
                          onClick={() => updateMut.mutate({ id: p.id, status: "sent" })}
                          disabled={updateMut.isPending}
                        />
                        <ActionBtn
                          icon={<Pencil className="size-3" />}
                          label="Edit"
                          onClick={() => setEditing({ kind: "edit", proposal: p })}
                        />
                        <ActionBtn
                          icon={<XIcon className="size-3" />}
                          label="Discard"
                          onClick={() => updateMut.mutate({ id: p.id, status: "withdrawn" })}
                          disabled={updateMut.isPending}
                        />
                      </>
                    )}
                    {p.status === "sent" && (
                      <>
                        <ActionBtn
                          icon={<Check className="size-3" />}
                          label="Accepted"
                          tone="emerald"
                          onClick={() => updateMut.mutate({ id: p.id, status: "accepted" })}
                          disabled={updateMut.isPending}
                        />
                        <ActionBtn
                          icon={<XIcon className="size-3" />}
                          label="Declined"
                          onClick={() => updateMut.mutate({ id: p.id, status: "declined" })}
                          disabled={updateMut.isPending}
                        />
                        <ActionBtn
                          icon={<Undo2 className="size-3" />}
                          label="Withdraw"
                          onClick={() => updateMut.mutate({ id: p.id, status: "withdrawn" })}
                          disabled={updateMut.isPending}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "emerald";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      : "border-reps-border bg-reps-ink/40 text-white/75 hover:bg-reps-panel-soft hover:text-white";
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      data-icon
      className={`h-7 rounded-[8px] border px-2 text-[11.5px] font-medium ${cls}`}
    >
      {icon}
      {label}
    </Button>
  );
}
