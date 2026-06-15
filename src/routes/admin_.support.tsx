import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clock, Mail, MessageSquare, Send, StickyNote, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/lib/support/tickets.functions";

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
type Priority = "urgent" | "high" | "normal" | "low";

const PRI: Record<Priority, string> = {
  urgent: "bg-rose-500/15 text-rose-300",
  high: "bg-reps-orange-soft text-reps-orange",
  normal: "bg-white/10 text-white/70",
  low: "bg-white/5 text-white/55",
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
  const [tab, setTab] = useState<StatusFilter>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();
  const listFn = useServerFn(listTickets);
  const channelName = useRef(
    `admin-support-queue-${Math.random().toString(36).slice(2)}`,
  );

  const ticketsQuery = useQuery({
    queryKey: ["admin", "support", "tickets", tab],
    queryFn: () => listFn({ data: { status: tab } }),
  });

  const allCountQuery = useQuery({
    queryKey: ["admin", "support", "counts"],
    queryFn: () => listFn({ data: { status: "all" } }),
  });

  const counts = useMemo(() => {
    const rows = allCountQuery.data ?? [];
    return {
      open: rows.filter((r: any) => r.status === "open").length,
      pending: rows.filter((r: any) => r.status === "pending").length,
      resolved: rows.filter((r: any) => r.status === "resolved").length,
      all: rows.length,
      urgent: rows.filter((r: any) => r.status === "open" && r.priority === "urgent")
        .length,
      resolvedToday: rows.filter(
        (r: any) =>
          r.resolved_at &&
          new Date(r.resolved_at).toDateString() === new Date().toDateString(),
      ).length,
    };
  }, [allCountQuery.data]);

  const tickets = ticketsQuery.data ?? [];

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
        <div className="flex items-center justify-between gap-3 border-b border-reps-border p-3">
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
          <div className="text-[11px] text-white/45">
            Inbound: <span className="text-white/70">support@repsuk.org</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                <th className="px-5 py-3 font-semibold">Ticket</th>
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
                  <td colSpan={7} className="px-5 py-8 text-center text-white/45 text-[12px]">
                    Loading tickets…
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/55">
                    <Mail className="mx-auto mb-2 h-5 w-5 text-white/35" />
                    <div className="text-[13px] font-medium text-white/75">
                      No {tab === "all" ? "" : tab} tickets
                    </div>
                    <div className="mt-1 text-[12px] text-white/45">
                      New emails to support@repsuk.org will land here.
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((t: any) => (
                  <tr
                    key={t.id}
                    className="border-t border-reps-border/60 text-white/85 hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => setOpenId(t.id)}
                  >
                    <td className="px-5 py-3">
                      <div className="text-[11px] font-mono text-white/50">
                        {t.ticket_number}
                      </div>
                      <div className="text-[13px] font-semibold text-white line-clamp-1">
                        {t.subject}
                      </div>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </PPanel>

      <TicketDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => {
          ticketsQuery.refetch();
          allCountQuery.refetch();
        }}
      />
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
      setDraft("");
      setCloseAfter(false);
      toast.success(mode === "reply" ? "Reply sent" : "Note added");
      qc.invalidateQueries({ queryKey: ["admin", "support", "ticket", ticketId] });
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send"),
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
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
            <button
              onClick={onClose}
              className="text-white/55 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
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
                {ticket.source}
              </Badge>
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

function MessageBubble({ m }: { m: any }) {
  const isOut = m.direction === "outbound";
  const isNote = m.direction === "internal_note";
  return (
    <div
      className={`rounded-[14px] border px-4 py-3 ${
        isNote
          ? "border-amber-500/20 bg-amber-500/[0.06]"
          : isOut
            ? "border-reps-orange/25 bg-reps-orange-soft/30"
            : "border-reps-border bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] text-white/55">
        <div className="inline-flex items-center gap-1.5 font-medium">
          {isNote ? (
            <StickyNote className="h-3 w-3 text-amber-300" />
          ) : isOut ? (
            <Send className="h-3 w-3 text-reps-orange" />
          ) : (
            <MessageSquare className="h-3 w-3 text-white/55" />
          )}
          <span className="text-white/75">
            {isNote
              ? "Internal note"
              : isOut
                ? `${m.from_name ?? "REPS Support"}`
                : `${m.from_name ?? m.from_email ?? "Customer"}`}
          </span>
          {!isNote && m.from_email ? (
            <span className="text-white/40">· {m.from_email}</span>
          ) : null}
        </div>
        <span>{new Date(m.created_at).toLocaleString()}</span>
      </div>
      <Separator className="my-2 bg-white/5" />
      <div className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
        {m.body_text || (m.body_html ? "(HTML message)" : "")}
      </div>
    </div>
  );
}
