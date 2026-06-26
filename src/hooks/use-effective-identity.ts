// Presentational identity hook. When an admin is impersonating a
// professional, the dashboard chrome (sidebar card, header avatar, greeting)
// should show the IMPERSONATED user, not the signed-in admin. Server-side
// data is already swapped by `requireSupabaseAuthWithImpersonation`; this
// hook fixes the client-side strings only.
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAccountMenu } from "@/hooks/use-account-menu";
import { getImpersonationStatus } from "@/lib/admin/impersonation.functions";

export type EffectiveIdentity = {
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
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (data?.active) {
    const tierLabel =
      data.tier === "pro" ? "Pro" : data.tier === "studio" ? "Studio" : "Verified";
    return {
      name: data.name,
      email: data.email ?? null,
      avatarUrl: data.avatarUrl,
      tierLabel,
      isImpersonating: true,
      isLoading: false,
    };
  }

  return {
    name: account.user?.name ?? "REPS Member",
    email: account.user?.email ?? null,
    avatarUrl: account.avatarUrl,
    tierLabel: account.user ? account.roleLabel : null,
    isImpersonating: false,
    isLoading: account.isLoading || isLoading,
  };
}
