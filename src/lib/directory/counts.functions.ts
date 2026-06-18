import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { PROFESSION_SLUGS } from "@/lib/professions";

const inputSchema = z.object({
  profession: z.enum(PROFESSION_SLUGS as [string, ...string[]]),
});

export const getVerifiedProCount = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ count: number }> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
    const { count, error } = await supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("primary_profession", data.profession)
      .eq("verification", "verified")
      .eq("identity_status", "approved");
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });
