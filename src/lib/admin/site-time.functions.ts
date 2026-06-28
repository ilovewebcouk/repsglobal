import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteTimeInfo = {
  utc_now: string;
  london_now: string;
  tz_abbrev: string;
  next_renewal_run: string;
  next_lifecycle_run: string;
  last_renewal_run: string | null;
  last_lifecycle_run: string | null;
};

export const getSiteTimeInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteTimeInfo> => {
    const { data, error } = await context.supabase.rpc("get_site_time_info");
    if (error) throw new Error(error.message);
    return data as SiteTimeInfo;
  });
