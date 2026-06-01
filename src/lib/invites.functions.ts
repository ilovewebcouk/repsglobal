import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Professional creates a new client invite (returns shareable link).
export const createClientInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(254),
        full_name: z.string().min(1).max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify caller is a professional
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isPro = (roles ?? []).some((r) => r.role === "professional");
    if (!isPro) throw new Error("Only professionals can invite clients");

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const { data: invite, error } = await supabase
      .from("client_invites")
      .insert({
        professional_id: userId,
        email: data.email,
        full_name: data.full_name ?? null,
        token_hash: token,
        status: "pending",
      })
      .select("id, token_hash, email, full_name, expires_at")
      .single();

    if (error) throw new Error(error.message);

    // Fetch pro display name + optional trading name for the email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const { data: pro } = await supabase
      .from("professionals")
      .select("trading_name")
      .eq("id", userId)
      .maybeSingle();

    const origin =
      process.env.PUBLIC_SITE_URL ?? "https://repsglobal.lovable.app";
    const acceptUrl = `${origin}/accept-invite?token=${token}`;

    return {
      invite: { id: invite.id, email: invite.email, expires_at: invite.expires_at },
      acceptUrl,
      professional_name: (profile?.full_name as string | null) ?? "Your coach",
      trading_name: (pro?.trading_name as string | null) ?? null,
      client_name: (invite.full_name as string | null) ?? null,
    };
  });

// Public lookup — used by /accept-invite to render landing page.
export const lookupInvite = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ token: z.string().min(8).max(128) }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .rpc("get_invite_by_token", { _token_hash: data.token });
    if (error) throw new Error(error.message);
    const invite = Array.isArray(rows) ? rows[0] : rows;
    if (!invite) return { invite: null as null };

    // Fetch professional display name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", invite.professional_id)
      .maybeSingle();

    const expired = new Date(invite.expires_at).getTime() < Date.now();

    return {
      invite: {
        email: invite.email as string,
        full_name: invite.full_name as string | null,
        status: invite.status as string,
        expired,
        professional_name: profile?.full_name ?? "Your coach",
      },
    };
  });

// Authenticated: link the signed-in user to the invite.
export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ token: z.string().min(8).max(128) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("accept_client_invite", { _token_hash: data.token });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
