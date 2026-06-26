import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyVerificationNotifications,
  markAllVerificationNotificationsRead,
} from "@/lib/verification/notifications.functions";

/**
 * Mirrors useReviewsUnread. Surfaces bell entries for the signed-in user's
 * verification rail (insurance / qualification gating, renewal nudges).
 */
export function useVerificationUnread(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const listFn = useServerFn(listMyVerificationNotifications);
  const markAllFn = useServerFn(markAllVerificationNotificationsRead);
  const qc = useQueryClient();
  const channelName = React.useRef(
    `verification-notifications-${Math.random().toString(36).slice(2)}`,
  );

  const query = useQuery({
    queryKey: ["verification", "notifications"],
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
        { event: "*", schema: "public", table: "verification_notifications" },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const items = query.data?.items ?? [];
  const unread = items.length;

  const markAllRead = React.useCallback(async () => {
    qc.setQueryData(["verification", "notifications"], { items: [] });
    try {
      await markAllFn();
    } finally {
      query.refetch();
    }
  }, [markAllFn, qc, query]);

  return { items, unread, markAllRead, isLoading: query.isLoading };
}
