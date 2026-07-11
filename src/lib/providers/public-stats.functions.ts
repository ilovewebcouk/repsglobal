import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const inputSchema = z.object({ providerId: z.string().uuid() });

export const getPublicProviderIssuedCertificateCount = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ count: number }> => {
    try {
      const supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
      );
      const { data: row, error } = await supabase.rpc(
        "count_provider_issued_certificates" as never,
        { _provider_id: data.providerId } as never,
      );
      if (error) return { count: 0 };
      const n = typeof row === "number" ? row : Number(row ?? 0);
      return { count: Number.isFinite(n) ? n : 0 };
    } catch {
      return { count: 0 };
    }
  });
