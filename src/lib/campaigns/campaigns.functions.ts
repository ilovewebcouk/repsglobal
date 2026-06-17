import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const CAMPAIGN_COLS =
  "id, inbox, subject, total_recipients, sent_count, failed_count, tiers, created_at, sent_at, created_by, status, mode, format, scheduled_at, last_error";

const listSchema = z
  .object({
    status: z.array(z.enum(["draft", "scheduled", "sending", "sent", "failed"])).optional(),
  })
  .optional();

export const listCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("outbound_campaigns")
      .select(CAMPAIGN_COLS)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data?.status && data.status.length > 0) {
      q = q.in("status", data.status);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const [c, r] = await Promise.all([
      context.supabase
        .from("outbound_campaigns")
        .select("*")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("outbound_campaign_recipients")
        .select(
          "id, email, name, status, sent_at, replied_at, error_message, reply_ticket_id",
        )
        .eq("campaign_id", data.id)
        .order("status", { ascending: true })
        .order("email", { ascending: true })
        .limit(1000),
    ]);
    if (c.error) throw new Error(c.error.message);
    if (r.error) throw new Error(r.error.message);
    if (!c.data) throw new Error("Campaign not found");

    const replied = (r.data ?? []).filter((row: any) => row.status === "replied").length;
    return { campaign: c.data, recipients: r.data ?? [], repliedCount: replied };
  });
