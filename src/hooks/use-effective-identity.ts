// Presentational identity hook. When an admin is impersonating a
// professional, the dashboard chrome (sidebar card, header avatar, greeting)
// should show the IMPERSONATED user, not the signed-in admin. Server-side
// data is already swapped by `requireSupabaseAuthWithImpersonation`; this
// hook fixes the client-side strings only.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAccountMenu } from "@/hooks/use-account-menu";
import { getImpersonationStatus } from "@/lib/admin/impersonation.functions";

export type EffectiveIdentity = {
  id: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  tierLabel: string | null;
  isImpersonating: boolean;
  /** True while we're still resolving the impersonation status. */
  isLoading: boolean;
};

export function useEffectiveIdentity(): EffectiveIdentity {
  const account = useAccountMenu();
  const fetchStatus = useServerFn(getImpersonationStatus);

  // Only admins can ever be impersonating, so skip the round-trip for everyone
  // else. The server function itself short-circuits non-admins too.
  const { data, isLoading } = useQuery({
    queryKey: ["impersonation-status"],
    queryFn: () => fetchStatus(),
    enabled: account.isAdmin,
    // Tight windows so the UI can't show "Viewing as…" for long after the
    // server-side session has expired.
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  // Client-side clock guard: if endsAt is in the past, immediately behave
  // as non-impersonating even before the next refetch settles.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!data?.active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [data?.active]);

  const stillActive =
    !!data?.active && new Date(data.endsAt).getTime() > now;

  if (data?.active && stillActive) {
    const tierLabel =
      data.tier === "pro"
        ? "Pro"
        : data.tier === "studio"
          ? "Studio"
          : data.tier === "training_provider"
            ? "Training provider"
            : "Core";
    return {
      id: data.professional_id,
      name: data.name,
      email: data.email ?? null,
      avatarUrl: data.avatarUrl,
      tierLabel,
      isImpersonating: true,
      isLoading: false,
    };
  }

  return {
    id: account.user?.id ?? null,
    name: account.user?.name ?? "REPS Member",
    email: account.user?.email ?? null,
    avatarUrl: account.avatarUrl,
    tierLabel: account.user ? account.roleLabel : null,
    isImpersonating: false,
    isLoading: account.isLoading || isLoading,
  };
}
