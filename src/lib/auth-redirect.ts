import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "professional" | "client";

export async function getPrimaryRole(userId: string): Promise<AppRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!data || data.length === 0) return null;
  const roles = data.map((r) => r.role as AppRole);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("professional")) return "professional";
  if (roles.includes("client")) return "client";
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
