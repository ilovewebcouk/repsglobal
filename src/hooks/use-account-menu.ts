import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser, type SessionUser } from "@/hooks/use-session-user";

export type AccountRole = "admin" | "pro" | "studio" | "verified" | "client" | "guest";
export type AccountTier = "verified" | "pro" | "studio" | null;

export type AccountContext = {
  user: SessionUser | null;
  isLoading: boolean;
  role: AccountRole;
  tier: AccountTier;
  isAdmin: boolean;
  isProfessional: boolean;
  isClient: boolean;
  /** Primary user-facing label, e.g. "Pro", "Verified", "Admin". */
  roleLabel: string;
  avatarUrl: string | null;
  signOut: () => Promise<void>;
};

function labelForRole(role: AccountRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "studio":
      return "Studio";
    case "pro":
      return "Pro";
    case "verified":
      return "Verified";
    case "client":
      return "Client";
    default:
      return "Account";
  }
}

export function useAccountMenu(): AccountContext {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useSessionUser();

  // profiles.avatar_url + full_name
  const profileQuery = useQuery({
    queryKey: ["account-profile", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .maybeSingle();
      return data ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // user_roles → roles[]
  const rolesQuery = useQuery({
    queryKey: ["account-roles", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data ?? []).map((r: { role: string }) => r.role);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // subscriptions.tier (only relevant for professionals)
  const subQuery = useQuery({
    queryKey: ["account-subscription", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("tier,status")
        .eq("user_id", user.id)
        .maybeSingle();
      return data ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const roles = rolesQuery.data ?? [];
  const isAdmin = roles.includes("admin");
  const isProfessional = roles.includes("professional");
  const isClient = roles.includes("client");

  const LIVE = ["active", "trialing", "past_due", "unpaid"];
  const sub = subQuery.data;
  const tier: AccountTier =
    sub && LIVE.includes(sub.status) && ["verified", "pro", "studio"].includes(sub.tier)
      ? (sub.tier as AccountTier)
      : null;

  // Resolved role: admin wins for label/menu fallback, but the menu component
  // is allowed to surface a "Switch view" block when a user has multiple roles.
  let role: AccountRole = "guest";
  if (user) {
    if (isAdmin) role = "admin";
    else if (isProfessional && tier) role = tier;
    else if (isProfessional) role = "verified";
    else if (isClient) role = "client";
    else role = "client";
  }

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }, [queryClient, navigate]);

  const profile = profileQuery.data;
  const resolvedName =
    (profile?.full_name && profile.full_name.trim()) ||
    user?.name ||
    user?.email ||
    "Account";

  const enrichedUser: SessionUser | null = user
    ? {
        ...user,
        name: resolvedName,
        avatarUrl: profile?.avatar_url ?? user.avatarUrl ?? null,
      }
    : null;

  return {
    user: enrichedUser,
    isLoading:
      userLoading ||
      (!!user &&
        (profileQuery.isLoading || rolesQuery.isLoading || subQuery.isLoading)),
    role,
    tier,
    isAdmin,
    isProfessional,
    isClient,
    roleLabel: labelForRole(role),
    avatarUrl: enrichedUser?.avatarUrl ?? null,
    signOut,
  };
}
