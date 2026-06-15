import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clock, Download, FileText, Inbox, Mail, Megaphone, MessageSquare, Paperclip, PencilLine, Send, Sparkles, StickyNote, Wand2, Zap } from "lucide-react";
import { ComposeDialog } from "@/components/admin/support/ComposeDialog";
import { DictateButton } from "@/components/admin/support/DictateButton";
import { BulkActionBar } from "@/components/admin/support/BulkActionBar";
import { CampaignsTab } from "@/components/admin/support/CampaignsTab";
import { supabase } from "@/integrations/supabase/client";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  listTickets,
  getTicket,
  replyToTicket,
  updateTicket,
  addInternalNote,
  getAttachmentUrl,
} from "@/lib/support/tickets.functions";
import { draftSupportReply, rephraseSupportReply } from "@/lib/support/ai-draft.functions";
import { bulkUpdateTickets, undoBulkUpdateTickets } from "@/lib/support/bulk-tickets.functions";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin_/support")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Support queue — REPS Admin" },
      {
        name: "description",
        content: "Triage and respond to support tickets across the REPS platform.",
      },
    ],
  }),
  component: AdminSupport,
});

type StatusFilter = "open" | "pending" | "resolved" | "all";
type InboxFilter = "all" | "support" | "pros" | "partners" | "press";
type Priority = "urgent" | "high" | "normal" | "low";

const PRI: Record<Priority, string> = {
  urgent: "bg-rose-500/15 text-rose-300",
  high: "bg-reps-orange-soft text-reps-orange",
  normal: "bg-white/10 text-white/70",
  low: "bg-white/5 text-white/55",
};

const INBOX_META: Record<Exclude<InboxFilter, "all">, { label: string; email: string; chip: string }> = {
  support: { label: "Support", email: "support@repsuk.org", chip: "bg-white/10 text-white/75" },
  pros: { label: "Pros", email: "pros@repsuk.org", chip: "bg-reps-orange-soft text-reps-orange" },
  partners: { label: "Partners", email: "partners@repsuk.org", chip: "bg-sky-500/15 text-sky-300" },
  press: { label: "Press", email: "press@repsuk.org", chip: "bg-violet-500/15 text-violet-300" },
};

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function labelFor(action: "resolve" | "reopen" | "pending"): string {
  if (action === "resolve") return "Resolved";
  if (action === "reopen") return "Reopened";
  return "Marked pending";
}


function slaLabel(due?: string | null, status?: string) {
  if (status === "resolved" || status === "closed") return "Resolved";
  if (!due) return "—";
  const ms = new Date(due).getTime() - Date.now();
  if (ms < 0) return `Overdue ${Math.round(-ms / 60000)}m`;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${String(rem).padStart(2, "0")}m`;
}

function AdminSupport() {
  const [view, setView] = useState<"tickets" | "campaigns">("tickets");
  const [tab, setTab] = useState<StatusFilter>("open");
  const [inbox, setInbox] = useState<InboxFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const bulkFn = useServerFn(bulkUpdateTickets);
  const undoFn = useServerFn(undoBulkUpdateTickets);
  const [bulkPending, setBulkPending] = useState(false);
  const qc = useQueryClient();
  const listFn = useServerFn(listTickets);
  const channelName = useRef(
    `admin-support-queue-${Math.random().toString(36).slice(2)}`,
  );

  const ticketsQuery = useQuery({
    queryKey: ["admin", "support", "tickets", tab, inbox],
    queryFn: () => listFn({ data: { status: tab, inbox } }),
  });

  const allCountQuery = useQuery({
    queryKey: ["admin", "support", "counts"],
    queryFn: () => listFn({ data: { status: "all" } }),
  });

  const counts = useMemo(() => {
    const rows = allCountQuery.data ?? [];
    const openRows = rows.filter((r: any) => r.status === "open");
    return {
      open: openRows.length,
      pending: rows.filter((r: any) => r.status === "pending").length,
      resolved: rows.filter((r: any) => r.status === "resolved").length,
      all: rows.length,
      urgent: openRows.filter((r: any) => r.priority === "urgent").length,
      resolvedToday: rows.filter(
        (r: any) =>
          r.resolved_at &&
          new Date(r.resolved_at).toDateString() === new Date().toDateString(),
      ).length,
      byInbox: {
        all: openRows.length,
        support: openRows.filter((r: any) => (r.inbox ?? "support") === "support").length,
        pros: openRows.filter((r: any) => r.inbox === "pros").length,
        partners: openRows.filter((r: any) => r.inbox === "partners").length,
        press: openRows.filter((r: any) => r.inbox === "press").length,
      } as Record<InboxFilter, number>,
    };
  }, [allCountQuery.data]);

  const tickets = ticketsQuery.data ?? [];

  // Clear selection when filters change (selections refer to the visible page)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab, inbox, view]);

  function toggleOne(id: string, ev?: React.MouseEvent) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      // Shift-click range select
      if (ev?.shiftKey && lastClickedId) {
        const ids = tickets.map((t: any) => t.id);
        const a = ids.indexOf(lastClickedId);
        const b = ids.indexOf(id);
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          const shouldSelect = !prev.has(id);
          for (let i = lo; i <= hi; i++) {
            if (shouldSelect) next.add(ids[i]);
            else next.delete(ids[i]);
          }
          setLastClickedId(id);
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setLastClickedId(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      const visibleIds = tickets.map((t: any) => t.id);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id: string) => prev.has(id));
      if (allSelected) return new Set();
      return new Set([...prev, ...visibleIds]);
    });
  }

  async function runBulk(
    action: "resolve" | "reopen" | "pending" | "delete",
    extraPayload?: Record<string, unknown>,
  ) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action !== "delete" && ids.length > 25) {
      const ok = window.confirm(`Apply "${action}" to ${ids.length} tickets?`);
      if (!ok) return;
    }
    setBulkPending(true);
    try {
      const res = await bulkFn({
        data: { ids, action, payload: extraPayload as never },
      });
      setSelectedIds(new Set());
      void qc.invalidateQueries({ queryKey: ["admin", "support"] });
      if (action === "delete") {
        toast.success(`Deleted ${res.updated} ticket${res.updated === 1 ? "" : "s"}`);
      } else {
        const previousStates = res.previousStates;
        toast.success(
          `${labelFor(action)} ${res.updated} ticket${res.updated === 1 ? "" : "s"}`,
          {
            action: {
              label: "Undo",
              onClick: async () => {
                try {
                  await undoFn({ data: { previousStates } });
                  void qc.invalidateQueries({ queryKey: ["admin", "support"] });
                  toast.success("Undone");
                } catch (e: any) {
                  toast.error(e?.message ?? "Undo failed");
                }
              },
            },
            duration: 8000,
          },
        );
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk action failed");
    } finally {
      setBulkPending(false);
    }
  }


  useEffect(() => {
    const refreshSupport = () => {
      void qc.invalidateQueries({ queryKey: ["admin", "support"] });
    };
    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        refreshSupport,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        refreshSupport,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <DashboardShell
      role="admin"
      active="Support"
      title="Support queue"
      subtitle={`${counts.open} open · ${counts.pending} pending · ${counts.resolvedToday} resolved today`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          label="Open"
          value={counts.open}
          detail={`${counts.urgent} urgent`}
          warn={counts.urgent > 0}
        />
        <Kpi label="Pending reply" value={counts.pending} detail="Waiting on customer" />
        <Kpi label="Resolved today" value={counts.resolvedToday} detail="Across all agents" />
        <Kpi label="Total tickets" value={counts.all} detail="All time" />
      </div>

      <PPanel className="mt-6 p-0">
        <div className="flex items-center gap-1 border-b border-reps-border px-3 pt-3">
          <button
            type="button"
            onClick={() => setView("tickets")}
            className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              view === "tickets"
                ? "bg-white/10 text-white"
                : "text-white/55 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Mail className="size-3.5" /> Tickets
          </button>
          <button
            type="button"
            onClick={() => setView("campaigns")}
            className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              view === "campaigns"
                ? "bg-white/10 text-white"
                : "text-white/55 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Megaphone className="size-3.5" /> Campaigns
          </button>
        </div>

        {view === "campaigns" ? (
          <CampaignsTab />
        ) : (
        <>
        <div className="flex flex-col gap-3 border-b border-reps-border p-3">

          <div className="flex items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as StatusFilter)}>
              <TabsList className="bg-transparent p-0 h-auto gap-1">
                {(
                  [
                    ["open", "Open", counts.open],
                    ["pending", "Pending", counts.pending],
                    ["resolved", "Resolved", counts.resolved],
                    ["all", "All", counts.all],
                  ] as const
                ).map(([v, label, count]) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-white/65 data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange data-[state=active]:shadow-none"
                  >
                    {label} <span className="ml-1 text-[11px] opacity-70">{count}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-white/45">
                <Inbox className="h-3 w-3" />
                support@ · pros@ · partners@ · press@
              </div>
              <Button
                size="sm"
                onClick={() => setComposeOpen(true)}
                className="bg-reps-orange text-black hover:bg-reps-orange/90 h-8"
              >
                <PencilLine className="size-3.5" />
                Compose
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["all", "All inboxes"],
                ["support", "Support"],
                ["pros", "Pros"],
                ["partners", "Partners"],
                ["press", "Press"],
              ] as const
            ).map(([v, label]) => {
              const active = inbox === v;
              const c = counts.byInbox[v] ?? 0;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setInbox(v)}
                  className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {label}
                  <span className={`text-[10.5px] ${active ? "text-white/75" : "text-white/35"}`}>
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                <th className="w-9 px-3 py-3">
                  <Checkbox
                    aria-label="Select all on page"
                    checked={
                      tickets.length > 0 &&
                      tickets.every((t: any) => selectedIds.has(t.id))
                    }
                    onCheckedChange={() => toggleAllVisible()}
                  />
                </th>
                <th className="px-5 py-3 font-semibold">Ticket</th>
                <th className="px-3 py-3 font-semibold">Inbox</th>
                <th className="px-3 py-3 font-semibold">From</th>
                <th className="px-3 py-3 font-semibold">Priority</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">SLA</th>
                <th className="px-3 py-3 font-semibold">Last activity</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {ticketsQuery.isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-white/45 text-[12px]">
                    Loading tickets…
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-white/55">

                    <Mail className="mx-auto mb-2 h-5 w-5 text-white/35" />
                    <div className="text-[13px] font-medium text-white/75">
                      No {tab === "all" ? "" : tab} tickets
                    </div>
                    <div className="mt-1 text-[12px] text-white/45">
                      New emails to support@ / pros@ / partners@ / press@ will land here.
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((t: any) => {
                  const ib = (t.inbox ?? "support") as Exclude<InboxFilter, "all">;
                  const meta = INBOX_META[ib] ?? INBOX_META.support;
                  const isSelected = selectedIds.has(t.id);
                  return (
                  <tr
                    key={t.id}
                    data-selected={isSelected || undefined}
                    className="border-t border-reps-border/60 text-white/85 hover:bg-white/[0.02] cursor-pointer data-[selected]:bg-reps-orange-soft/30"
                    onClick={() => setOpenId(t.id)}
                  >
                    <td
                      className="w-9 px-3 py-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(t.id, e);
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        aria-label={`Select ticket ${t.ticket_number}`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[11px] font-mono text-white/50">
                        {t.ticket_number}
                      </div>
                      <div className="text-[13px] font-semibold text-white line-clamp-1">
                        {t.subject}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex h-6 items-center rounded-[6px] px-2 text-[11px] font-semibold ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white/70">
                      <div className="text-[12.5px]">{t.requester_name ?? "—"}</div>
                      <div className="text-[11px] text-white/45">{t.requester_email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold capitalize ${
                          PRI[t.priority as Priority] ?? PRI.normal
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[12px] capitalize text-white/70">{t.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-[12px] text-white/65">
                        <Clock className="h-3.5 w-3.5" />
                        {slaLabel(t.sla_due_at, t.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-white/55">
                      {timeAgo(t.last_message_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-[12px] font-semibold text-reps-orange hover:underline">
                        Open
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </>
        )}
      </PPanel>


      <TicketDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => {
          ticketsQuery.refetch();
          allCountQuery.refetch();
        }}
      />

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSent={() => {
          ticketsQuery.refetch();
          allCountQuery.refetch();
        }}
      />

      <BulkActionBar
        count={selectedIds.size}
        isPending={bulkPending}
        onClear={() => setSelectedIds(new Set())}
        onResolve={() => runBulk("resolve")}
        onReopen={() => runBulk("reopen")}
        onPending={() => runBulk("pending")}
        onDelete={() => {
          setDeleteConfirm("");
          setDeleteOpen(true);
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-reps-bg border-reps-border text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete {selectedIds.size} ticket{selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/65">
              This permanently removes the tickets, messages, and attachments. This cannot
              be undone. Type{" "}
              <span className="font-mono font-semibold text-white">
                {selectedIds.size}
              </span>{" "}
              below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            autoFocus
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={`Type ${selectedIds.size}`}
            className="bg-white/[0.04] border-reps-border text-white"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] border-reps-border text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                bulkPending || Number(deleteConfirm) !== selectedIds.size
              }
              onClick={async () => {
                await runBulk("delete", { confirmCount: selectedIds.size });
                setDeleteOpen(false);
              }}
              className="bg-rose-500 text-white hover:bg-rose-500/90"
            >
              Delete {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>

  );
}

function Kpi({
  label,
  value,
  detail,
  warn,
}: {
  label: string;
  value: number;
  detail: string;
  warn?: boolean;
}) {
  return (
    <PCard>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
        {label}
      </div>
      <div className="mt-2 font-display text-[28px] font-bold text-white">{value}</div>
      <div className={`mt-1 text-[12px] ${warn ? "text-rose-400" : "text-reps-green"}`}>
        {detail}
      </div>
    </PCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail drawer
// ─────────────────────────────────────────────────────────────────────────────
function TicketDrawer({
  ticketId,
  onClose,
  onChanged,
}: {
  ticketId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getTicket);
  const replyFn = useServerFn(replyToTicket);
  const updateFn = useServerFn(updateTicket);
  const noteFn = useServerFn(addInternalNote);
  const draftFn = useServerFn(draftSupportReply);
  const rephraseFn = useServerFn(rephraseSupportReply);

  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [closeAfter, setCloseAfter] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "support", "ticket", ticketId],
    queryFn: () => getFn({ data: { id: ticketId! } }),
    enabled: !!ticketId,
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!ticketId) return;
      if (mode === "reply") {
        return replyFn({ data: { ticketId, body: draft, closeAfter } });
      }
      return noteFn({ data: { ticketId, body: draft } });
    },
    onSuccess: () => {
      const wasReply = mode === "reply";
      setDraft("");
      setCloseAfter(false);
      toast.success(wasReply ? "Reply sent" : "Note added");
      qc.invalidateQueries({ queryKey: ["admin", "support", "ticket", ticketId] });
      onChanged();
      if (wasReply) onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send"),
  });

  const aiDraft = useMutation({
    mutationFn: async () => {
      if (!ticketId) throw new Error("No ticket");
      return draftFn({ data: { ticketId } });
    },
    onSuccess: (res) => {
      if (res?.text) {
        setDraft((current) => (current.trim() ? `${current.trim()}\n\n${res.text}` : res.text));
        toast.success("AI draft ready — review before sending");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not draft reply"),
  });

  const aiRephrase = useMutation({
    mutationFn: async () => {
      const text = draft.trim();
      if (!text) throw new Error("Type something to rephrase first");
      return rephraseFn({ data: { draft: text, ticketId: ticketId ?? undefined } });
    },
    onSuccess: (res) => {
      if (res?.text) {
        setDraft(res.text);
        toast.success("Rephrased — review before sending");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not rephrase"),
  });

  const update = useMutation({
    mutationFn: (patch: any) => updateFn({ data: { id: ticketId!, ...patch } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "support", "ticket", ticketId] });
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const ticket = q.data?.ticket;
  const messages = q.data?.messages ?? [];

  return (
    <Sheet open={!!ticketId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] border-l border-reps-border bg-reps-panel/95 text-white p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-reps-border">
          <div>
            <div className="text-[11px] font-mono text-white/45">
              {ticket?.ticket_number ?? "…"}
            </div>
            <SheetTitle className="text-white text-[16px] font-semibold line-clamp-2 mt-0.5">
              {ticket?.subject ?? "Loading…"}
            </SheetTitle>
            {ticket ? (
              <div className="mt-1 text-[12px] text-white/55">
                {ticket.requester_name ? `${ticket.requester_name} · ` : ""}
                {ticket.requester_email}
              </div>
            ) : null}
          </div>

          {ticket ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                value={ticket.status}
                onValueChange={(v) => update.mutate({ status: v })}
              >
                <SelectTrigger className="h-8 w-[120px] bg-white/5 border-reps-border text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={ticket.priority}
                onValueChange={(v) => update.mutate({ priority: v })}
              >
                <SelectTrigger className="h-8 w-[120px] bg-white/5 border-reps-border text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Badge
                variant="outline"
                className="border-reps-border text-white/65 text-[11px] capitalize"
              >
                {ticket.source?.replace("_", " ")}
              </Badge>
              {ticket.inbox ? (
                <Badge
                  variant="outline"
                  className={`border-transparent text-[11px] capitalize ${
                    INBOX_META[ticket.inbox as Exclude<InboxFilter, "all">]?.chip ?? ""
                  }`}
                >
                  <Inbox className="h-3 w-3 mr-1" />
                  {INBOX_META[ticket.inbox as Exclude<InboxFilter, "all">]?.label ?? ticket.inbox}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {q.isLoading ? (
            <div className="text-white/45 text-[13px]">Loading conversation…</div>
          ) : messages.length === 0 ? (
            <div className="text-white/45 text-[13px]">No messages yet.</div>
          ) : (
            messages.map((m: any) => <MessageBubble key={m.id} m={m} />)
          )}
        </div>

        <div className="border-t border-reps-border bg-black/20 px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setMode("reply")}
              className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12px] font-semibold ${
                mode === "reply"
                  ? "bg-reps-orange text-white"
                  : "text-white/55 hover:text-white"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> Reply to customer
            </button>
            <button
              onClick={() => setMode("note")}
              className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12px] font-semibold ${
                mode === "note"
                  ? "bg-amber-500/30 text-amber-200"
                  : "text-white/55 hover:text-white"
              }`}
            >
              <StickyNote className="h-3.5 w-3.5" /> Internal note
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <DictateButton
                onAppend={(text) =>
                  setDraft((prev) => (prev.endsWith(" ") || prev === "" ? prev + text : prev + " " + text))
                }
              />

              <button
                type="button"
                onClick={() => aiRephrase.mutate()}
                disabled={aiRephrase.isPending || mode !== "reply" || !draft.trim()}
                title="Rewrite what you've typed in REPS support tone"
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Wand2 className="h-3.5 w-3.5 text-reps-orange" />
                {aiRephrase.isPending ? "Rephrasing…" : "Rephrase"}
              </button>
              <button
                type="button"
                onClick={() => aiDraft.mutate()}
                disabled={
                  aiDraft.isPending ||
                  mode !== "reply" ||
                  !messages.some((m: any) => m.direction === "inbound")
                }
                title="Draft a reply from scratch using the conversation"
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" />
                {aiDraft.isPending ? "Drafting…" : "AI draft"}
              </button>
            </div>
          </div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              mode === "reply"
                ? "Type your reply… (sent as support@repsuk.org)"
                : "Add an internal note — not sent to the customer."
            }
            rows={5}
            className="bg-white/[0.04] border-reps-border text-white text-[14px] resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            {mode === "reply" ? (
              <label className="inline-flex items-center gap-2 text-[12px] text-white/55">
                <input
                  type="checkbox"
                  checked={closeAfter}
                  onChange={(e) => setCloseAfter(e.target.checked)}
                  className="rounded border-white/20 bg-transparent"
                />
                Mark as resolved after sending
              </label>
            ) : (
              <div />
            )}
            <Button
              size="sm"
              onClick={() => send.mutate()}
              disabled={!draft.trim() || send.isPending}
              className="bg-reps-orange hover:bg-reps-orange/90 text-white"
            >
              {send.isPending ? (
                "Sending…"
              ) : mode === "reply" ? (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send reply
                </>
              ) : (
                <>
                  <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Save note
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatBytes(n?: number | null) {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentChip({ att }: { att: any }) {
  const getUrl = useServerFn(getAttachmentUrl);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const isImage = (att.mime_type ?? "").startsWith("image/");
  const isPdf = (att.mime_type ?? "").includes("pdf");

  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await getUrl({ data: { attachmentId: att.id } });
      if (res?.url) setUrl(res.url);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open attachment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="inline-flex max-w-full items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[12px] text-white/80 hover:bg-white/[0.1] hover:text-white disabled:opacity-50"
        title={att.filename}
      >
        <Paperclip className="h-3 w-3 text-white/55 shrink-0" />
        <span className="truncate max-w-[220px]">{att.filename}</span>
        {att.size_bytes ? (
          <span className="text-white/40">· {formatBytes(att.size_bytes)}</span>
        ) : null}
      </button>

      <Dialog open={!!url} onOpenChange={(o) => !o && setUrl(null)}>
        <DialogContent className="max-w-3xl bg-reps-panel border-reps-border text-white p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-reps-border">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-white text-[15px] font-semibold flex items-center gap-2 min-w-0">
                {isImage ? (
                  <FileText className="h-4 w-4 text-reps-orange shrink-0" />
                ) : (
                  <Paperclip className="h-4 w-4 text-reps-orange shrink-0" />
                )}
                <span className="truncate">{att.filename}</span>
              </DialogTitle>
              {url ? (
                <a
                  href={url}
                  download={att.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-reps-orange px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-reps-orange/90"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              ) : null}
            </div>
          </DialogHeader>
          <div className="p-5 flex items-center justify-center bg-black/40 min-h-[200px]">
            {url && isImage ? (
              <img
                src={url}
                alt={att.filename}
                className="max-h-[70vh] max-w-full object-contain rounded-[10px]"
              />
            ) : url && isPdf ? (
              <iframe
                src={url}
                title={att.filename}
                className="w-full h-[70vh] rounded-[10px] border border-white/10"
              />
            ) : url ? (
              <div className="text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-white/30" />
                <div className="text-[13px] text-white/70 mb-4">
                  This file type can’t be previewed.
                </div>
                <a
                  href={url}
                  download={att.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-reps-orange px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-reps-orange/90"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MessageBubble({ m }: { m: any }) {
  const isOut = m.direction === "outbound";
  const isNote = m.direction === "internal_note";
  const isAuto = !!m.is_auto;
  const attachments: any[] = Array.isArray(m.support_attachments) ? m.support_attachments : [];
  return (
    <div
      className={`rounded-[14px] border px-4 py-3 ${
        isNote
          ? "border-amber-500/20 bg-amber-500/[0.06]"
          : isAuto
            ? "border-sky-500/25 bg-sky-500/[0.06]"
            : isOut
              ? "border-reps-orange/25 bg-reps-orange-soft/30"
              : "border-reps-border bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] text-white/55">
        <div className="inline-flex items-center gap-1.5 font-medium">
          {isNote ? (
            <StickyNote className="h-3 w-3 text-amber-300" />
          ) : isAuto ? (
            <Zap className="h-3 w-3 text-sky-300" />
          ) : isOut ? (
            <Send className="h-3 w-3 text-reps-orange" />
          ) : (
            <MessageSquare className="h-3 w-3 text-white/55" />
          )}
          <span className="text-white/75">
            {isNote
              ? "Internal note"
              : isAuto
                ? "Auto-reply"
                : isOut
                  ? `${m.from_name ?? "REPS Support"}`
                  : `${m.from_name ?? m.from_email ?? "Customer"}`}
          </span>
          {isAuto ? (
            <Badge className="ml-1 h-4 rounded-[6px] border-sky-400/30 bg-sky-500/15 px-1.5 text-[10px] font-semibold text-sky-200">
              AUTO
            </Badge>
          ) : null}
          {!isNote && !isAuto && m.from_email ? (
            <span className="text-white/40">· {m.from_email}</span>
          ) : null}
        </div>
        <span>{new Date(m.created_at).toLocaleString()}</span>
      </div>
      <Separator className="my-2 bg-white/5" />
      <div className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
        {m.body_text || (m.body_html ? "(HTML message)" : "")}
      </div>
      {attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {attachments.map((att) => (
            <AttachmentChip key={att.id} att={att} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
