import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { listSupportNotifications } from "@/lib/support/tickets.functions";

const STORAGE_KEY = "reps.support.lastSeenAt";

type NotificationItem = {
  key: string;
  kind: "ticket" | "message";
  ticketId: string;
  ticketNumber: string;
  title: string;
  preview: string;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function readLastSeen(): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v ? Number(v) || 0 : 0;
}

function writeLastSeen(ts: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(ts));
}

export function NotificationsBell() {
  const listFn = useServerFn(listSupportNotifications);
  const query = useQuery({
    queryKey: ["admin", "support", "notifications"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const [open, setOpen] = React.useState(false);
  const [lastSeen, setLastSeen] = React.useState<number>(() => readLastSeen());

  // Realtime: refetch on new ticket / new inbound message.
  React.useEffect(() => {
    const channel = supabase
      .channel("admin-support-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets" },
        () => query.refetch(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: "direction=eq.inbound" },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: NotificationItem[] = React.useMemo(() => {
    const data = query.data;
    if (!data) return [];
    const fromTickets: NotificationItem[] = data.tickets.map((t) => ({
      key: `t:${t.id}`,
      kind: "ticket",
      ticketId: t.id,
      ticketNumber: t.ticket_number,
      title: t.subject || "New support ticket",
      preview: t.requester_name
        ? `${t.requester_name} · ${t.requester_email}`
        : t.requester_email,
      createdAt: t.created_at,
    }));
    const fromMessages: NotificationItem[] = data.messages.map((m) => ({
      key: `m:${m.id}`,
      kind: "message",
      ticketId: m.ticket_id,
      ticketNumber: m.support_tickets?.ticket_number ?? "",
      title: `Reply on ${m.support_tickets?.ticket_number ?? "ticket"}`,
      preview:
        (m.body_text ?? "").slice(0, 120).trim() ||
        m.from_email ||
        m.from_name ||
        "New inbound message",
      createdAt: m.created_at,
    }));
    return [...fromTickets, ...fromMessages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  }, [query.data]);

  const unread = React.useMemo(
    () => items.filter((i) => new Date(i.createdAt).getTime() > lastSeen).length,
    [items, lastSeen],
  );

  const markAllRead = React.useCallback(() => {
    const ts = Date.now();
    setLastSeen(ts);
    writeLastSeen(ts);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && unread > 0) markAllRead();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={unread > 0 ? `Notifications (${unread} new)` : "Notifications"}
          className="relative border-reps-border bg-reps-panel text-white/80 transition-colors hover:bg-reps-panel-soft hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-reps-orange px-1 text-[10px] font-semibold leading-none text-reps-ink ring-2 ring-reps-ink"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] border-reps-border bg-reps-panel p-0 text-white"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-white">Notifications</p>
            <p className="text-[11px] text-white/55">Support tickets and inbound emails</p>
          </div>
          {items.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] text-white/70 hover:text-white"
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <Separator className="bg-reps-border" />
        <div className="max-h-[420px] overflow-y-auto">
          {query.isLoading ? (
            <div className="px-4 py-6 text-[12px] text-white/55">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-white/55">
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-reps-border">
              {items.map((item) => {
                const isUnread = new Date(item.createdAt).getTime() > lastSeen;
                const Icon = item.kind === "ticket" ? Mail : MessageSquare;
                return (
                  <li key={item.key}>
                    <Link
                      to="/admin/support"
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-reps-panel-soft"
                    >
                      <div
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] ${
                          isUnread
                            ? "bg-reps-orange/15 text-reps-orange"
                            : "bg-white/5 text-white/55"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[13px] font-medium text-white">
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-white/45">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] text-white/55">
                          {item.preview}
                        </p>
                        {item.ticketNumber ? (
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">
                            {item.ticketNumber}
                          </p>
                        ) : null}
                      </div>
                      {isUnread ? (
                        <span
                          aria-hidden
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-reps-orange"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Separator className="bg-reps-border" />
        <div className="px-4 py-2">
          <Link
            to="/admin/support"
            onClick={() => setOpen(false)}
            className="block rounded-[8px] py-1.5 text-center text-[12px] font-medium text-white/80 transition-colors hover:bg-reps-panel-soft hover:text-white"
          >
            Open support queue
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
