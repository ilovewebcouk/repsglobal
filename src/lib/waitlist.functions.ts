import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().trim().max(40).optional(),
});

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { error } = await supabaseAdmin
      .from("launch_waitlist")
      .upsert(
        { email: data.email, source: data.source ?? "coming_soon" },
        { onConflict: "email", ignoreDuplicates: true },
      );

    if (error) {
      console.error("[joinWaitlist] insert failed", error);
      return { ok: false as const, error: "Could not save your email. Please try again." };
    }

    return { ok: true as const };
  });
