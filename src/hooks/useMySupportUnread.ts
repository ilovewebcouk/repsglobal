import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyUnreadTickets,
  markAllMySupportRead,
} from "@/lib/support/my-tickets.functions";

export type MySupportNotification = {
  key: string;
  ticketId: string;
  ticketNumber: string;
  title: string;
  preview: string;
  createdAt: string;
};

/**
 * Trainer-side mirror of useSupportUnread. Powers the trainer sidebar's
 * Support badge and feeds the NotificationsBell when the signed-in user is
 * not an admin (or in addition to admin items when they are both).
 */
export function useMySupportUnread(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const listFn = useServerFn(listMyUnreadTickets);
  const markAllFn = useServerFn(markAllMySupportRead);
  const qc = useQueryClient();
  const channelName = React.useRef(
    `my-support-unread-${Math.random().toString(36).slice(2)}`,
  );

  const query = useQuery({
    queryKey: ["my-support", "unread"],
    queryFn: () => listFn(),
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const items: MySupportNotification[] = React.useMemo(() => {
    const tickets = query.data?.tickets ?? [];
    return tickets.map((t: { id: string; ticket_number: string; subject: string; last_message_at: string | null; created_at: string }) => ({
      key: `my-t:${t.id}`,
      ticketId: t.id,
      ticketNumber: t.ticket_number,
      title: t.subject || "Support reply",
      preview: "REPS Support replied to your ticket",
      createdAt: t.last_message_at ?? t.created_at,
    }));
  }, [query.data]);

  const unread = items.length;

  const markAllRead = React.useCallback(async () => {
    qc.setQueryData(["my-support", "unread"], { tickets: [] });
    try {
      await markAllFn();
    } finally {
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
      query.refetch();
    }
  }, [markAllFn, qc, query]);

  return { items, unread, markAllRead, isLoading: query.isLoading };
}
