import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  articleSlug: z.string().min(1).max(200),
  vote: z.union([z.literal(1), z.literal(-1)]),
  anonId: z.string().max(64).optional(),
});

export const recordHelpfulVote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("help_article_feedback").insert({
      article_slug: data.articleSlug,
      vote: data.vote,
      anon_id: data.anonId ?? null,
    });
    if (error) {
      console.error("[help] feedback insert failed:", error.message);
    }
    return { ok: true };
  });
