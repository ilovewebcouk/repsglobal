import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listSupportNotifications } from "@/lib/support/tickets.functions";

export const SUPPORT_LAST_SEEN_KEY = "reps.support.lastSeenAt";

export type SupportNotification = {
  key: string;
  kind: "ticket" | "message";
  ticketId: string;
  ticketNumber: string;
  title: string;
  preview: string;
  createdAt: string;
};

function readLastSeen(): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(SUPPORT_LAST_SEEN_KEY);
  return v ? Number(v) || 0 : 0;
}

function writeLastSeen(ts: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUPPORT_LAST_SEEN_KEY, String(ts));
  // Fire a synthetic event so same-tab listeners (sidebar badge) update too.
  window.dispatchEvent(new Event("reps:support-last-seen"));
}

/**
 * Shared support-activity hook. Powers both the admin notifications bell and
 * the sidebar Support badge. Reuses one query cache key + one realtime channel.
 */
export function useSupportUnread(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const listFn = useServerFn(listSupportNotifications);

  const query = useQuery({
    queryKey: ["admin", "support", "notifications"],
    queryFn: () => listFn(),
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const [lastSeen, setLastSeen] = React.useState<number>(() => readLastSeen());

  // Cross-tab + same-tab sync of lastSeen.
  React.useEffect(() => {
    const sync = () => setLastSeen(readLastSeen());
    window.addEventListener("storage", sync);
    window.addEventListener("reps:support-last-seen", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("reps:support-last-seen", sync);
    };
  }, []);

  // Realtime: refetch on new ticket / new inbound message.
  React.useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-support-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets" },
        () => query.refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: "direction=eq.inbound",
        },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const items: SupportNotification[] = React.useMemo(() => {
    const data = query.data;
    if (!data) return [];
    const fromTickets: SupportNotification[] = data.tickets.map((t) => ({
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
    const fromMessages: SupportNotification[] = data.messages.map((m) => ({
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
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
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

  return { items, unread, lastSeen, markAllRead, isLoading: query.isLoading };
}
