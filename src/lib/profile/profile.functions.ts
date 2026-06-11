import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileInput = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  trading_name: z.string().min(2).max(120),
  headline: z.string().max(160).optional().nullable(),
  bio: z.string().max(4000).optional().nullable(),
  specialisms: z.array(z.string()).max(20),
  city: z.string().max(80).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  online_available: z.boolean(),
  in_person_available: z.boolean(),
  hourly_rate_pence: z.number().int().min(0).max(1_000_00).optional().nullable(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("professionals")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // ensure slug uniqueness
    const { data: clash } = await supabase
      .from("professionals")
      .select("id")
      .eq("slug", data.slug)
      .neq("id", userId)
      .maybeSingle();
    if (clash) throw new Error("That handle is already taken — try another.");

    const { data: row, error } = await supabase
      .from("professionals")
      .upsert({ id: userId, ...data }, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const setPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ is_published: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("professionals")
      .update({ is_published: data.is_published })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
