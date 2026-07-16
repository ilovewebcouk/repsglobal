// Guards shared by verification / CPD writer functions.
//
// These sit at the top of write-capable server-fn handlers and refuse to
// let an admin-role userId (e.g. from a stale/expired impersonation
// fallback) get treated as a professional. They must run BEFORE any
// `professionals.upsert` — in fact we now avoid upserting a professionals
// row from userId entirely, since that pattern silently fabricates
// provider identities.

/** Reject admin-role callers and require a real professionals row to exist. */
export async function assertCallerHasProfessionalRow(
  supabase: any,
  userId: string,
): Promise<void> {
  const [{ data: pro }, { data: roleRow }] = await Promise.all([
    supabase
      .from("professionals")
      .select("id")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
  ]);
  if (roleRow) {
    throw new Error(
      "This action is only available to member accounts. If you meant to act as a member, reopen impersonation from the Members page.",
    );
  }
  if (!pro) {
    throw new Error(
      "No professional profile found for your account. Please contact support.",
    );
  }
}
