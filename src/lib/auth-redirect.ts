import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "professional" | "client";

export async function userHasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: role,
  });
  if (error) return false;
  return data === true;
}

export async function getPrimaryRole(userId: string): Promise<AppRole | null> {
  if (await userHasRole(userId, "admin")) return "admin";
  if (await userHasRole(userId, "professional")) return "professional";
  if (await userHasRole(userId, "client")) return "client";
  return null;
}

export function landingPathForRole(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "professional":
      return "/dashboard";
    case "client":
      return "/portal";
    default:
      return "/dashboard";
  }
}

export async function redirectAfterAuth(userId: string): Promise<string> {
  const role = await getPrimaryRole(userId);
  return landingPathForRole(role);
}
