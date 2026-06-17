import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ChevronDown,
  Clock,
  Download,
  FileText,
  Inbox,
  Mail,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
  StickyNote,
  
  X,
  Zap,
} from "lucide-react";
import { BulkActionBar } from "@/components/admin/support/BulkActionBar";
import { NewTicketDialog } from "@/components/admin/support/NewTicketDialog";
import { SnoozePopover } from "@/components/admin/support/SnoozePopover";
import { supabase } from "@/integrations/supabase/client";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DictateButton } from "@/components/ui/DictateButton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  markTicketRead,
  snoozeTicket,
  unsnoozeTicket,
  listRequesterTickets,
} from "@/lib/support/tickets.functions";
import { draftSupportReply } from "@/lib/support/ai-draft.functions";
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

type StatusFilter = "new" | "open" | "pending" | "solved" | "closed" | "spam" | "trash";
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

function snoozedLabel(iso?: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `Wakes in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Wakes in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return `Wakes in ${days}d`;
}

function labelFor(
  action: "resolve" | "reopen" | "pending" | "spam" | "not_spam" | "restore",
): string {
  if (action === "resolve") return "Solved";
  if (action === "reopen") return "Reopened";
  if (action === "pending") return "Marked pending";
  if (action === "spam") return "Marked as spam";
  if (action === "not_spam") return "Restored from spam";
  return "Restored from Trash";
}


function slaLabel(due?: string | null, status?: string) {
  if (status === "solved" || status === "closed") return "Solved";
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
  const [tab, setTab] = useState<StatusFilter>("new");
  const [inbox, setInbox] = useState<InboxFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const bulkFn = useServerFn(bulkUpdateTickets);
  const undoFn = useServerFn(undoBulkUpdateTickets);
  const [bulkPending, setBulkPending] = useState(false);
  const qc = useQueryClient();
  const listFn = useServerFn(listTickets);
  const channelName = useRef(
    `admin-support-queue-${Math.random().toString(36).slice(2)}`,
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 220);
    return () => clearTimeout(t);
  }, [search]);

  const ticketsQuery = useQuery({
    queryKey: ["admin", "support", "tickets", tab, inbox, debouncedSearch],
    queryFn: () => listFn({ data: { status: tab, inbox, q: debouncedSearch || undefined } }),
  });

  const allCountQuery = useQuery({
    queryKey: ["admin", "support", "counts"],
    queryFn: () => listFn({ data: { status: "all" } }),
  });


  const counts = useMemo(() => {
    const rows = allCountQuery.data ?? [];
    const nowMs = Date.now();
    const isActiveSnoozed = (r: any) =>
      r.snoozed_until && new Date(r.snoozed_until).getTime() > nowMs;
    const isSpam = (r: any) => r.status === "spam";
    const isClosed = (r: any) => r.status === "closed";
    const isTrash = (r: any) => !!r.deleted_at;
    const isNew = (r: any) => r.status === "new";
    const active = rows.filter((r: any) => !isSpam(r) && !isClosed(r) && !isTrash(r));
    const openRows = active.filter(
      (r: any) => r.status === "open" && !isActiveSnoozed(r),
    );
    const pendingRows = active.filter(
      (r: any) => r.status === "pending",
    );
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      new: active.filter(isNew).length,
      open: openRows.length,
      pending: pendingRows.length,
      solved: active.filter((r: any) => r.status === "solved").length,
      closed: rows.filter((r: any) => !isTrash(r) && isClosed(r)).length,
      spam: rows.filter((r: any) => !isTrash(r) && isSpam(r)).length,
      trash: rows.filter(isTrash).length,
      urgent: openRows.filter((r: any) => r.priority === "urgent").length,
      solvedLast7: rows.filter(
        (r: any) =>
          r.status === "solved" &&
          r.solved_at &&
          new Date(r.solved_at).getTime() >= sevenDaysAgo,
      ).length,
      byInbox: {
        all: openRows.length + active.filter(isNew).length,
        support: [...openRows, ...active.filter(isNew)].filter(
          (r: any) => (r.inbox ?? "support") === "support",
        ).length,
        pros: [...openRows, ...active.filter(isNew)].filter(
          (r: any) => r.inbox === "pros",
        ).length,
        partners: [...openRows, ...active.filter(isNew)].filter(
          (r: any) => r.inbox === "partners",
        ).length,
        press: [...openRows, ...active.filter(isNew)].filter(
          (r: any) => r.inbox === "press",
        ).length,
      } as Record<InboxFilter, number>,
    };
  }, [allCountQuery.data]);

  const tickets = ticketsQuery.data ?? [];

  // Clear selection when filters change (selections refer to the visible page)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab, inbox, debouncedSearch]);

  // Keyboard shortcuts: /, c, j, k, Enter, e, Esc
  const [cursorId, setCursorId] = useState<string | null>(null);
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const inField =
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape") {
        if (openId) return; // Sheet handles its own Esc
        setSelectedIds(new Set());
        setCursorId(null);
        return;
      }
      if (inField) {
        if (e.key === "Escape" && t === searchRef.current) {
          (t as HTMLInputElement).blur();
        }
        return;
      }
      if (openId) return; // drawer open — let it handle its own keys
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setComposeOpen(true);
        return;
      }
      const ids = tickets.map((x: any) => x.id);
      if (ids.length === 0) return;
      const idx = cursorId ? ids.indexOf(cursorId) : -1;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursorId(ids[Math.min(idx + 1, ids.length - 1)] ?? ids[0]);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursorId(ids[Math.max(idx - 1, 0)] ?? ids[0]);
      } else if (e.key === "Enter" && cursorId) {
        e.preventDefault();
        setOpenId(cursorId);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tickets, cursorId, openId]);



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
    action:
      | "resolve"
      | "reopen"
      | "pending"
      | "delete"
      | "restore"
      | "purge"
      | "spam"
      | "not_spam",
    extraPayload?: Record<string, unknown>,
  ) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action !== "delete" && action !== "purge" && ids.length > 25) {
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
      if (action === "purge") {
        toast.success(`Deleted forever: ${res.updated} ticket${res.updated === 1 ? "" : "s"}`);
      } else if (action === "delete") {
        const previousStates = res.previousStates;
        toast.success(
          `Moved ${res.updated} ticket${res.updated === 1 ? "" : "s"} to Trash`,
          {
            action: {
              label: "Undo",
              onClick: async () => {
                try {
                  await undoFn({ data: { previousStates } });
                  void qc.invalidateQueries({ queryKey: ["admin", "support"] });
                  toast.success("Restored");
                } catch (e: any) {
                  toast.error(e?.message ?? "Undo failed");
                }
              },
            },
            duration: 8000,
          },
        );
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
      subtitle={`${counts.new} new · ${counts.open} open · ${counts.pending} pending · ${counts.solvedLast7} solved this week`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          label="New"
          value={counts.new}
          detail={counts.new === 0 ? "Notifications clear" : "Untouched — needs first view"}
          warn={counts.new > 0}
        />
        <Kpi
          label="Open"
          value={counts.open}
          detail={
            counts.urgent > 0 ? `${counts.urgent} urgent` : "In progress"
          }
          warn={counts.urgent > 0}
        />
        <Kpi label="Pending" value={counts.pending} detail="Waiting on customer" />
        <Kpi label="Solved this week" value={counts.solvedLast7} detail="Last 7 days" />
      </div>

      <PPanel className="mt-6 p-0">
        <div className="flex flex-col gap-3 border-b border-reps-border p-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Saved views — single pill row */}
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as StatusFilter)}
            className="min-w-0 -mx-1 overflow-x-auto sm:mx-0 sm:overflow-visible"
          >
            <TabsList className="bg-transparent p-0 h-auto gap-1 flex-nowrap sm:flex-wrap">
              {(
                [
                  ["new", "New", counts.new],
                  ["open", "Open", counts.open],
                  ["pending", "Pending", counts.pending],
                  ["solved", "Solved", counts.solved],
                  ["closed", "Closed", counts.closed],
                  ["spam", "Spam", counts.spam],
                  ["trash", "Trash", counts.trash],
                ] as const
              ).map(([v, label, count]) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="shrink-0 rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-white/65 data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange data-[state=active]:shadow-none"
                >
                  {label} <span className="ml-1 text-[11px] opacity-70">{count}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {/* Inbox filter — compact select (replaces second pill row) */}
            <Select value={inbox} onValueChange={(v) => setInbox(v as InboxFilter)}>
              <SelectTrigger
                className="h-8 w-[160px] bg-white/[0.04] border-reps-border text-white text-[12.5px]"
                aria-label="Inbox"
              >
                <Inbox className="h-3.5 w-3.5 mr-1.5 text-white/50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All inboxes ({counts.byInbox.all})</SelectItem>
                <SelectItem value="support">Support ({counts.byInbox.support})</SelectItem>
                <SelectItem value="pros">Pros ({counts.byInbox.pros})</SelectItem>
                <SelectItem value="partners">Partners ({counts.byInbox.partners})</SelectItem>
                <SelectItem value="press">Press ({counts.byInbox.press})</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[160px] max-w-[320px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…   (/)"
                className="h-8 pl-8 pr-7 bg-white/[0.04] border-reps-border text-white text-[12.5px] placeholder:text-white/35"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <Button
              onClick={() => setComposeOpen(true)}
              size="sm"
              className="h-8 bg-reps-orange hover:bg-reps-orange/90 text-white text-[12px] font-semibold shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New ticket
            </Button>
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
                      No {tab} tickets
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
                  const isCursor = cursorId === t.id;
                  const isUnread = !!t.is_unread;
                  
                  return (
                  <tr
                    key={t.id}
                    data-selected={isSelected || undefined}
                    data-cursor={isCursor || undefined}
                    className="border-t border-reps-border/60 text-white/85 hover:bg-white/[0.02] cursor-pointer data-[selected]:bg-reps-orange-soft/30 data-[cursor]:bg-white/[0.03] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
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
                      <div className="flex items-center gap-2">
                        {isUnread ? (
                          <span
                            aria-label="Unread"
                            title="Unread — new customer message"
                            className="inline-block size-1.5 rounded-full bg-reps-orange shrink-0"
                          />
                        ) : null}
                        <div
                          className={`text-[13px] line-clamp-1 ${
                            isUnread ? "font-bold text-white" : "font-semibold text-white/90"
                          }`}
                        >
                          {t.subject}
                        </div>
                      </div>
                      {snoozeMsg ? (
                        <div className="mt-0.5 text-[11px] text-sky-300/80 inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {snoozeMsg}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex h-6 items-center rounded-[6px] px-2 text-[11px] font-semibold ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white/70 max-w-[200px]">
                      <div className="text-[12.5px] truncate" title={t.requester_name ?? undefined}>
                        {t.requester_name ?? "—"}
                      </div>
                      <div
                        className="text-[11px] text-white/45 truncate"
                        title={t.requester_email}
                      >
                        {t.requester_email}
                      </div>
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
                       <span
                         className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold capitalize ${
                           t.status === "solved" || t.status === "closed"
                             ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                             : t.status === "pending"
                             ? "border border-amber-400/30 bg-amber-500/15 text-amber-300"
                             : t.status === "new"
                             ? "border border-sky-400/30 bg-sky-500/15 text-sky-300"
                             : "border border-reps-orange/30 bg-reps-orange/15 text-reps-orange"
                         }`}
                       >
                         {t.status}
                       </span>
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
                         View
                       </button>
                     </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PPanel>


      <TicketDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onOpenTicket={(id) => setOpenId(id)}
        onChanged={() => {
          ticketsQuery.refetch();
          allCountQuery.refetch();
        }}
      />

      <NewTicketDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onCreated={(ticketId) => {
          ticketsQuery.refetch();
          allCountQuery.refetch();
          setOpenId(ticketId);
        }}
      />



      <BulkActionBar
        count={selectedIds.size}
        isPending={bulkPending}
        mode={
          tab === "trash"
            ? "trash"
            : tab === "spam"
              ? "spam"
              : tab === "closed"
                ? "closed"
                : "default"
        }
        onClear={() => setSelectedIds(new Set())}
        onResolve={() => runBulk("resolve")}
        onReopen={() => runBulk("reopen")}
        onPending={() => runBulk("pending")}
        onSpam={() => runBulk(tab === "spam" ? "not_spam" : "spam")}
        onRestore={() => runBulk("restore")}
        onPurge={() => {
          setPurgeConfirm("");
          setPurgeOpen(true);
        }}
        onDelete={() => runBulk("delete")}
      />

      <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <AlertDialogContent className="bg-reps-bg border-reps-border text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete {selectedIds.size} ticket{selectedIds.size === 1 ? "" : "s"} forever?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/65">
              This permanently removes the tickets, messages, and attachments.
              Anything left in Trash auto-purges after 30 days. This cannot be undone.
              Type{" "}
              <span className="font-mono font-semibold text-white">
                {selectedIds.size}
              </span>{" "}
              below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            autoFocus
            value={purgeConfirm}
            onChange={(e) => setPurgeConfirm(e.target.value)}
            placeholder={`Type ${selectedIds.size}`}
            className="bg-white/[0.04] border-reps-border text-white"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] border-reps-border text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                bulkPending || Number(purgeConfirm) !== selectedIds.size
              }
              onClick={async () => {
                await runBulk("purge", { confirmCount: selectedIds.size });
                setPurgeOpen(false);
              }}
              className="bg-rose-500 text-white hover:bg-rose-500/90"
            >
              Delete forever
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
  onOpenTicket,
}: {
  ticketId: string | null;
  onClose: () => void;
  onChanged: () => void;
  onOpenTicket?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getTicket);
  const replyFn = useServerFn(replyToTicket);
  const updateFn = useServerFn(updateTicket);
  const noteFn = useServerFn(addInternalNote);
  const draftFn = useServerFn(draftSupportReply);
  const priorFn = useServerFn(listRequesterTickets);
  const markReadFn = useServerFn(markTicketRead);
  const snoozeFn = useServerFn(snoozeTicket);
  const unsnoozeFn = useServerFn(unsnoozeTicket);

  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [afterSend, setAfterSend] = useState<"pending" | "solved" | "closed">("pending");

  // Mark ticket as read when drawer opens
  useEffect(() => {
    if (!ticketId) return;
    markReadFn({ data: { id: ticketId } })
      .then(() => onChanged())
      .catch(() => {
        /* non-blocking */
      });
  }, [ticketId, markReadFn, onChanged]);

  // 'E' to solve when the drawer is focused and not typing
  useEffect(() => {
    if (!ticketId) return;
    function handler(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const inField =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (inField) return;
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        update.mutate({ status: "solved" });
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const q = useQuery({
    queryKey: ["admin", "support", "ticket", ticketId],
    queryFn: () => getFn({ data: { id: ticketId! } }),
    enabled: !!ticketId,
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!ticketId) return;
      if (mode === "reply") {
        return replyFn({ data: { ticketId, body: draft, afterStatus: afterSend } });
      }
      return noteFn({ data: { ticketId, body: draft } });
    },
    onSuccess: () => {
      const wasReply = mode === "reply";
      const after = afterSend;
      setDraft("");
      setAfterSend("pending");
      toast.success(
        wasReply
          ? after === "solved"
            ? "Reply sent · ticket set to Solved"
            : after === "closed"
              ? "Reply sent · ticket set to Closed"
              : "Reply sent · ticket set to Pending"
          : "Note added",
      );
      qc.invalidateQueries({ queryKey: ["admin", "support", "ticket", ticketId] });
      onChanged();
      if (wasReply) onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send"),
  });

  const aiDraft = useMutation({
    mutationFn: async () => {
      if (!ticketId) throw new Error("No ticket");
      const brief = draft.trim();
      return draftFn({ data: { ticketId, brief: brief || undefined } });
    },
    onSuccess: (res) => {
      if (res?.text) {
        // Replace the brief with the polished draft
        setDraft(res.text);
        toast.success("Draft ready — review before sending");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not draft reply"),
  });

  const update = useMutation({
    mutationFn: (patch: any) => updateFn({ data: { id: ticketId!, ...patch } }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["admin", "support", "ticket", ticketId] });
      onChanged();
      if (variables.status && variables.status !== "open") {
        onClose();
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const ticket = q.data?.ticket;
  const messages = q.data?.messages ?? [];

  const priorQuery = useQuery({
    queryKey: ["admin", "support", "prior", ticket?.requester_email, ticketId],
    queryFn: () =>
      priorFn({
        data: {
          email: ticket!.requester_email,
          excludeId: ticketId!,
        },
      }),
    enabled: !!ticket?.requester_email && !!ticketId,
  });
  const priorTickets = priorQuery.data ?? [];
  const [priorOpen, setPriorOpen] = useState(false);

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
                  {/* Agent-set states only. `new` is system-set, auto-promoted
                      on first view. `closed` is system-set by the 28-day cron.
                      Both are shown as disabled items so the dropdown still
                      displays the correct current value. */}
                  <SelectItem value="new" disabled>New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="solved">Solved</SelectItem>
                  <SelectItem value="closed" disabled>Closed</SelectItem>
                  <SelectItem value="spam" disabled>Spam</SelectItem>
                </SelectContent>
              </Select>
              {ticket.status !== "spam" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => update.mutate({ status: "spam" })}
                  className="h-8 border-reps-border bg-white/5 text-white/75 hover:bg-amber-500/15 hover:text-amber-200 hover:border-amber-400/40 text-[12px]"
                >
                  Spam
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => update.mutate({ status: "open" })}
                  className="h-8 border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[12px]"
                >
                  Not spam
                </Button>
              )}
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
          {priorTickets.length > 0 ? (
            <div className="rounded-[12px] border border-reps-border bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setPriorOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] font-semibold text-white/75 hover:text-white"
                aria-expanded={priorOpen}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-white/45" />
                  Previous tickets from this requester
                  <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                    {priorTickets.length}
                  </span>
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/45 transition-transform ${priorOpen ? "rotate-180" : ""}`}
                />
              </button>
              {priorOpen ? (
                <ul className="divide-y divide-reps-border/60 border-t border-reps-border/60">
                  {priorTickets.map((p: any) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => onOpenTicket?.(p.id)}
                        className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-white/[0.03]"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-white/45">
                            {p.ticket_number}
                          </div>
                          <div className="truncate text-[12.5px] text-white/85">
                            {p.subject}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold capitalize ${
                              p.status === "solved" || p.status === "closed"
                                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                : p.status === "pending"
                                  ? "border border-amber-400/30 bg-amber-500/15 text-amber-300"
                                  : "border border-reps-orange/30 bg-reps-orange/15 text-reps-orange"
                            }`}
                          >
                            {p.status}
                          </span>
                          <div className="mt-0.5 text-[10.5px] text-white/45">
                            {timeAgo(p.last_message_at)}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

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
              <button
                type="button"
                onClick={() => aiDraft.mutate()}
                disabled={
                  aiDraft.isPending ||
                  mode !== "reply" ||
                  !messages.some((m: any) => m.direction === "inbound")
                }
                title={
                  draft.trim()
                    ? "Use your notes as a brief — AI writes the polished reply"
                    : "Draft a reply from the conversation"
                }
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" />
                {aiDraft.isPending
                  ? "Drafting…"
                  : draft.trim()
                    ? "Draft from notes"
                    : "AI draft"}
              </button>
            </div>
          </div>
          <div className="relative">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  (e.metaKey || e.ctrlKey) &&
                  e.key === "Enter" &&
                  draft.trim() &&
                  !send.isPending
                ) {
                  e.preventDefault();
                  send.mutate();
                }
              }}
              placeholder={
                mode === "reply"
                  ? "Type your reply… (⌘+Enter to send · sent as support@repsuk.org)"
                  : "Add an internal note — not sent to the customer."
              }
              rows={5}
              className="bg-white/[0.04] border-reps-border text-white text-[14px] resize-none pr-12"
            />
            <DictateButton
              className="absolute bottom-2 right-2"
              onTranscript={(t) =>
                setDraft((b) => (b.trim() ? `${b.trimEnd()} ${t}` : t))
              }
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-[11px] text-white/40">
              {mode === "reply" ? "⌘+Enter to send · E to solve" : "Internal — never emailed"}
            </div>
            {mode === "reply" ? (
              <div className="inline-flex rounded-[10px] overflow-hidden shadow-sm">
                <Button
                  size="sm"
                  onClick={() => {
                    setAfterSend("pending");
                    send.mutate();
                  }}
                  disabled={!draft.trim() || send.isPending}
                  className="rounded-r-none bg-reps-orange hover:bg-reps-orange/90 text-white"
                >
                  {send.isPending ? (
                    "Sending…"
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Send & pending
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      disabled={!draft.trim() || send.isPending}
                      className="rounded-l-none border-l border-white/15 bg-reps-orange hover:bg-reps-orange/90 text-white px-2"
                      aria-label="More send options"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-reps-panel border-reps-border text-white">
                    <DropdownMenuItem
                      onClick={() => {
                        setAfterSend("solved");
                        setTimeout(() => send.mutate(), 0);
                      }}
                      className="text-[13px] focus:bg-white/5"
                    >
                      <Send className="h-3.5 w-3.5 mr-2" /> Send & solved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setAfterSend("closed");
                        setTimeout(() => send.mutate(), 0);
                      }}
                      className="text-[13px] focus:bg-white/5"
                    >
                      <Send className="h-3.5 w-3.5 mr-2" /> Send & closed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => send.mutate()}
                disabled={!draft.trim() || send.isPending}
                className="bg-amber-500/30 hover:bg-amber-500/40 text-amber-100"
              >
                {send.isPending ? (
                  "Saving…"
                ) : (
                  <>
                    <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Save note
                  </>
                )}
              </Button>
            )}
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
