import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyReviewNotifications,
  markAllReviewNotificationsRead,
} from "@/lib/reviews/reviews.functions";

/**
 * Mirrors useSupportUnread. Powers the sidebar Reviews badge and the bell-icon
 * feed entries for new pending-moderation reviews. The same hook serves admin
 * (badge on /admin/reviews) and pros (badge on /dashboard/reviews) — the
 * server fn filters by recipient_user_id.
 */
export function useReviewsUnread(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const listFn = useServerFn(listMyReviewNotifications);
  const markAllFn = useServerFn(markAllReviewNotificationsRead);
  const qc = useQueryClient();
  const channelName = React.useRef(
    `review-notifications-${Math.random().toString(36).slice(2)}`,
  );

  const query = useQuery({
    queryKey: ["reviews", "notifications"],
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
        { event: "*", schema: "public", table: "review_notifications" },
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
    qc.setQueryData(["reviews", "notifications"], { items: [] });
    try {
      await markAllFn();
    } finally {
      qc.invalidateQueries({ queryKey: ["admin", "reviews", "queue"] });
      query.refetch();
    }
  }, [markAllFn, qc, query]);

  return { items, unread, markAllRead, isLoading: query.isLoading };
}
