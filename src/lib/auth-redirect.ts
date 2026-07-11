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

export async function getAccountLandingFallback(userId: string): Promise<string> {
  const [{ data: professional }, { data: subscription }] = await Promise.all([
    supabase
      .from("professionals")
      .select("id")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (professional || subscription?.tier === "training_provider") return "/dashboard";
  return "/portal";
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
  if (!role) return getAccountLandingFallback(userId);
  return landingPathForRole(role);
}
