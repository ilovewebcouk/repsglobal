// Phase 2.2 stub: capture wait-list interest for the Programme Generator.
// Public insert allowed via RLS; pros can read their own rows.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const JoinSchema = z.object({
  email: z.string().trim().email().max(200),
  note: z.string().trim().max(500).nullable().optional(),
});

export const joinProgrammeWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => JoinSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("programmes_waitlist").insert({
      professional_id: context.userId,
      email: data.email,
      note: data.note || null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const isOnProgrammeWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ joined: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("programmes_waitlist")
      .select("id")
      .eq("professional_id", context.userId)
      .limit(1)
      .maybeSingle();
    return { joined: !!data };
  });
