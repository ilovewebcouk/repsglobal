import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_professionals",
  title: "Search the REPS directory",
  description:
    "Search published professionals in the REPS global register by city, profession keyword, or name. Returns up to 20 matches with slug, name, city, headline and profession. Read-only.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Free-text query — name, city, or profession keyword."),
    city: z.string().trim().optional().describe("Optional exact-city filter (e.g. 'London')."),
    limit: z.number().int().optional().describe("Max results (default 10, cap 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, city, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const cap = Math.min(Math.max(limit ?? 10, 1), 20);
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("professionals")
      .select("slug, headline, city, country, primary_profession, specialisms")
      .eq("is_published", true)
      .is("suspended_at", null)
      .limit(cap);

    if (city) q = q.ilike("city", city);
    if (query) {
      const like = `%${query}%`;
      q = q.or(
        `headline.ilike.${like},city.ilike.${like},primary_profession.ilike.${like},slug.ilike.${like}`,
      );
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [
        {
          type: "text",
          text:
            data && data.length
              ? JSON.stringify(data, null, 2)
              : "No matching professionals found.",
        },
      ],
      structuredContent: { results: data ?? [] },
    };
  },
});
