import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

function deriveUser(raw: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): SessionUser {
  const meta = (raw.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    null;
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) || null;
  const email = raw.email ?? "";
  return {
    id: raw.id,
    email,
    name: fullName || email || "Account",
    avatarUrl,
  };
}

/**
 * Single source of truth for "who is signed in on the client right now,
 * and are they an admin". Header chrome consumes this; route gates do
 * their own server-side checks via _authenticated.
 */
export function useSessionUser() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const userQuery = useQuery({
    queryKey: ["session-user"],
    queryFn: async (): Promise<SessionUser | null> => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return deriveUser(data.user);
    },
    staleTime: 60_000,
    // The root onAuthStateChange listener calls
    // queryClient.invalidateQueries() so we don't need refetch-on-focus here.
    refetchOnWindowFocus: false,
  });

  const user = userQuery.data ?? null;

  const roleQuery = useQuery({
    queryKey: ["has-role", user?.id ?? "anon", "admin"],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data === true;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const signOut = useCallback(async () => {
    // Per sign-out hygiene: cancel → clear → signOut → replace-navigate.
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }, [queryClient, navigate]);

  return {
    user,
    isAdmin: !!user && roleQuery.data === true,
    isLoading: userQuery.isLoading,
    signOut,
  };
}
