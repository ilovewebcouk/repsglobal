import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type SettingsBundle = {
  account: {
    user_id: string;
    email: string | null;
    full_name: string | null;
    display_name: string | null;
    business_name: string | null;
    avatar_url: string | null;
    contact_phone: string | null;
    timezone: string;
    locale: string;
    legal_name_locked: boolean;
    identity_status:
      | "none"
      | "pending"
      | "approved"
      | "rejected"
      | "needs_more_info"
      | "expired";
  };
  notifications: {
    new_enquiry_email: boolean;
    weekly_enquiry_digest: boolean;
    marketing_opt_in: boolean;
  };
  privacy: {
    is_published: boolean;
  };
  subscription: {
    tier: "free" | "verified" | "pro" | "studio";
    status: string;
    billing_period: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    is_founding: boolean;
    display: string | null;
  };
};

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

export const getMySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SettingsBundle> => {
    const { supabase, userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;

    const [{ data: profile }, { data: pro }, { data: prefs }, { data: sub }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, display_name, business_name, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("professionals")
          .select(
            "contact_phone, timezone, locale, identity_status, is_published",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("notification_preferences")
          .select(
            "new_enquiry_email, weekly_enquiry_digest, marketing_opt_in",
          )
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select(
            "tier, status, billing_period, current_period_end, cancel_at_period_end, is_founding, stripe_price_id",
          )
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const profRow = (profile ?? {}) as Record<string, unknown>;
    const proRow = (pro ?? {}) as Record<string, unknown>;
    const prefsRow = (prefs ?? {}) as Record<string, unknown>;
    const subRow = (sub ?? {}) as Record<string, unknown>;

    const idStatusRaw = (proRow.identity_status as string | null) ?? "none";
    const idStatus = (
      ["none", "pending", "approved", "rejected", "needs_more_info", "expired"].includes(
        idStatusRaw,
      )
        ? idStatusRaw
        : "none"
    ) as SettingsBundle["account"]["identity_status"];

    return {
      account: {
        user_id: userId,
        email,
        full_name: (profRow.full_name as string | null) ?? null,
        display_name: (profRow.display_name as string | null) ?? null,
        business_name: (profRow.business_name as string | null) ?? null,
        avatar_url: (profRow.avatar_url as string | null) ?? null,
        contact_phone: (proRow.contact_phone as string | null) ?? null,
        timezone: (proRow.timezone as string | null) ?? "Europe/London",
        locale: (proRow.locale as string | null) ?? "en-GB",
        identity_status: idStatus,
        legal_name_locked: idStatus === "approved",
      },
      notifications: {
        new_enquiry_email: (prefsRow.new_enquiry_email as boolean | null) ?? true,
        weekly_enquiry_digest:
          (prefsRow.weekly_enquiry_digest as boolean | null) ?? false,
        marketing_opt_in: (prefsRow.marketing_opt_in as boolean | null) ?? false,
      },
      privacy: {
        is_published: (proRow.is_published as boolean | null) ?? false,
      },
      subscription: {
        tier: ((subRow.tier as string | null) ?? "free") as SettingsBundle["subscription"]["tier"],
        status: (subRow.status as string | null) ?? "none",
        billing_period: (subRow.billing_period as string | null) ?? null,
        current_period_end: (subRow.current_period_end as string | null) ?? null,
        cancel_at_period_end: (subRow.cancel_at_period_end as boolean | null) ?? false,
        is_founding: (subRow.is_founding as boolean | null) ?? false,
        display: null,
      },
    };
  });

/* -------------------------------------------------------------------------- */
/* Account                                                                     */
/* -------------------------------------------------------------------------- */

const AccountInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  display_name: z.string().trim().max(120).nullable().optional(),
  business_name: z.string().trim().max(120).nullable().optional(),
  contact_phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Enter a valid international phone number (e.g. +44 7911 123456).")
    .nullable()
    .or(z.literal(""))
    .optional(),
  timezone: z.string().trim().min(1).max(64),
  locale: z.string().trim().min(2).max(16),
});

export const updateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AccountInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: proCheck } = await supabase
      .from("professionals")
      .select("identity_status")
      .eq("id", userId)
      .maybeSingle();
    const idStatus = (proCheck as { identity_status?: string | null } | null)?.identity_status ?? null;
    const legalLocked = idStatus === "approved";

    const profilePatch: Record<string, unknown> = {
      display_name: data.display_name ?? null,
      business_name: data.business_name ?? null,
    };
    if (!legalLocked) {
      profilePatch.full_name = data.full_name;
    }
    const { error: pErr } = await supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(profilePatch as any)
      .eq("id", userId);
    if (pErr) throw pErr;

    const phone = data.contact_phone && data.contact_phone.trim() !== "" ? data.contact_phone : null;
    const { error: proErr } = await supabase
      .from("professionals")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        contact_phone: phone,
        timezone: data.timezone,
        locale: data.locale,
      } as any)
      .eq("id", userId);
    if (proErr) throw proErr;

    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

const NotificationsInput = z.object({
  new_enquiry_email: z.boolean(),
  weekly_enquiry_digest: z.boolean(),
  marketing_opt_in: z.boolean(),
});

export const updateMyNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NotificationsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notification_preferences")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(
        {
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "user_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* Privacy — pause listing                                                     */
/* -------------------------------------------------------------------------- */

export const updateMyListingPaused = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ paused: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("professionals")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_published: !data.paused } as any)
      .eq("id", userId);
    if (error) throw error;
    return { ok: true, is_published: !data.paused };
  });

/* -------------------------------------------------------------------------- */
/* Data export                                                                 */
/* -------------------------------------------------------------------------- */

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;

    const [profile, pro, prefs, sub, enquiries, reviews, verifications] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("professionals").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId),
      supabase.from("enquiries").select("*").eq("professional_id", userId),
      supabase.from("reviews").select("*").eq("professional_id", userId),
      supabase
        .from("verification_submissions")
        .select("*")
        .eq("professional_id", userId),
    ]);

    return {
      exported_at: new Date().toISOString(),
      user: { id: userId, email: (claims.email as string | undefined) ?? null },
      profile: profile.data,
      professional: pro.data,
      notification_preferences: prefs.data,
      subscriptions: sub.data,
      enquiries: enquiries.data,
      reviews: reviews.data,
      verification_submissions: verifications.data,
    };
  });

/* -------------------------------------------------------------------------- */
/* Delete account — immediate hard delete                                      */
/* -------------------------------------------------------------------------- */

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ confirm_email: z.string().email(), confirm_phrase: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;

    if (!email || email.toLowerCase() !== data.confirm_email.toLowerCase()) {
      throw new Error("Email does not match your account.");
    }
    if (data.confirm_phrase !== "DELETE") {
      throw new Error("Type DELETE to confirm.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort: cancel any active Stripe subscription before deleting.
    try {
      const { data: subs } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_subscription_id, environment")
        .eq("user_id", userId);
      if (subs && subs.length > 0) {
        const { createStripeClient } = await import("@/lib/billing/stripe.server");
        for (const s of subs) {
          const subRow = s as { stripe_subscription_id: string | null; environment: string | null };
          if (!subRow.stripe_subscription_id) continue;
          const env = (subRow.environment === "live" ? "live" : "sandbox") as "live" | "sandbox";
          try {
            const stripe = createStripeClient(env);
            await stripe.subscriptions.cancel(subRow.stripe_subscription_id);
          } catch (e) {
            // Swallow — Stripe will be cleaned up by Stripe TTL eventually.
            console.warn("[deleteMyAccount] stripe cancel failed", e);
          }
        }
      }
    } catch (e) {
      console.warn("[deleteMyAccount] stripe lookup failed", e);
    }

    // Auth user delete cascades via FKs.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* Sessions                                                                    */
/* -------------------------------------------------------------------------- */

export type SessionRow = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  refreshed_at: string | null;
  not_after: string | null;
  user_agent: string | null;
  ip: string | null;
  aal: string | null;
};

export const listMySessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionRow[]> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Query auth.sessions directly via service-role SQL (admin API has no
    // typed listUserSessions helper across SDK versions).
    const { data, error } = await supabaseAdmin
      .schema("auth" as never)
      .from("sessions" as never)
      .select("id, created_at, updated_at, refreshed_at, not_after, user_agent, ip, aal")
      .eq("user_id", userId)
      .order("refreshed_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.warn("[listMySessions]", error);
      return [];
    }
    return (data ?? []) as unknown as SessionRow[];
  });

export const revokeMySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Confirm ownership, then delete.
    const { data: row, error: selErr } = await supabaseAdmin
      .schema("auth" as never)
      .from("sessions" as never)
      .select("id, user_id")
      .eq("id", data.session_id)
      .maybeSingle();
    if (selErr) throw selErr;
    const owned = (row as { user_id?: string } | null)?.user_id === userId;
    if (!owned) throw new Error("Session not found.");

    const { error } = await supabaseAdmin
      .schema("auth" as never)
      .from("sessions" as never)
      .delete()
      .eq("id", data.session_id);
    if (error) throw error;
    return { ok: true };
  });
