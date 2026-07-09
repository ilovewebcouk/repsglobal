import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAdminVerificationPending } from "@/lib/verification/admin-pending.functions";

/**
 * Admin-only: pending verification work (qualifications + insurance).
 * Powers the sidebar badge on /admin/verification and the admin slice of
 * the NotificationsBell.
 */
export function useAdminVerificationPending(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const fetchFn = useServerFn(getAdminVerificationPending);
  const channelName = React.useRef(
    `admin-verification-pending-${Math.random().toString(36).slice(2)}`,
  );

  const query = useQuery({
    queryKey: ["admin", "verification", "pending"],
    queryFn: () => fetchFn(),
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(channelName.current)
      .on("postgres_changes", { event: "*", schema: "public", table: "verification_submissions" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "insurance_policies" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "provider_name_requests" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "provider_domain_verifications" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "provider_regulated_permissions" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "cpd_courses" }, () => query.refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    total: query.data?.total ?? 0,
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
