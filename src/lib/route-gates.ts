import { redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import {
  getPrimaryRole,
  landingPathForRole,
  userHasRole,
  type AppRole,
} from "@/lib/auth-redirect";

/**
 * Client-side route gate. Use inside a route's `beforeLoad` together with
 * `ssr: false` (the Supabase session lives in localStorage and isn't
 * available during SSR).
 *
 * - Unauthenticated → /auth?redirect=...
 * - Authenticated with disallowed role → role's natural landing page
 */
export function requireRole(allowed: AppRole[]) {
  return async ({ location }: { location: { href: string } }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
    const checks = await Promise.all(
      allowed.map(async (allowedRole) => ({
        role: allowedRole,
        ok: await userHasRole(data.user.id, allowedRole),
      })),
    );
    const matched = checks.find((check) => check.ok)?.role ?? null;
    if (!matched) {
      const role = await getPrimaryRole(data.user.id);
      throw redirect({ to: landingPathForRole(role) });
    }
    return { user: data.user, role: matched };
  };
}
