import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listSupportNotifications,
  markAllSupportRead,
} from "@/lib/support/tickets.functions";

export type SupportNotification = {
  key: string;
  ticketId: string;
  ticketNumber: string;
  title: string;
  preview: string;
  createdAt: string;
};

/**
 * Shared support-activity hook. Powers both the admin notifications bell and
 * the sidebar Support badge. Single source of truth = `support_tickets.is_unread`,
 * so the bell count, the orange dot in the queue, and the sidebar badge all
 * agree and stay in sync across tabs/devices.
 */
export function useSupportUnread(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const listFn = useServerFn(listSupportNotifications);
  const markAllFn = useServerFn(markAllSupportRead);
  const queryClient = useQueryClient();
  const channelName = React.useRef(
    `admin-support-notifications-${Math.random().toString(36).slice(2)}`,
  );

  const query = useQuery({
    queryKey: ["admin", "support", "notifications"],
    queryFn: () => listFn(),
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  // Realtime: refetch on any ticket / inbound message change (covers inserts
  // AND `is_unread` flips driven by openTicket / trigger).
  React.useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
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
    const tickets = query.data?.tickets ?? [];
    return tickets.map((t) => ({
      key: `t:${t.id}`,
      ticketId: t.id,
      ticketNumber: t.ticket_number,
      title: t.subject || "New support ticket",
      preview: t.requester_name
        ? `${t.requester_name} · ${t.requester_email}`
        : t.requester_email,
      createdAt: t.last_message_at ?? t.created_at,
    }));
  }, [query.data]);

  const unread = items.length;

  const markAllRead = React.useCallback(async () => {
    // Optimistic: clear locally so the badge drops immediately.
    queryClient.setQueryData(
      ["admin", "support", "notifications"],
      { tickets: [] },
    );
    try {
      await markAllFn();
    } finally {
      // Also nudge the queue list so its orange dots disappear.
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
      query.refetch();
    }
  }, [markAllFn, queryClient, query]);

  return { items, unread, markAllRead, isLoading: query.isLoading };
}
