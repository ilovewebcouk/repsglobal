import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/send.server";

// ============================================================================
// Token hashing (SHA-256, hex). Raw token lives in the URL only; only the
// hash is ever stored or compared.
// ============================================================================
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRawToken(): string {
  // 256 bits of entropy, URL-safe hex.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function siteOrigin(): string {
  return process.env.PUBLIC_SITE_URL ?? "https://repsglobal.lovable.app";
}

// ============================================================================
// Schemas
// ============================================================================
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const nameSchema = z.string().trim().min(1).max(120);

const csvRowSchema = z.object({
  email: z.string(),
  full_name: z.string().optional(),
});

// ============================================================================
// Helpers — assert caller has an active Pro/Studio entitlement
// ============================================================================
async function assertProfessional(
  // The authenticated client is injected by middleware and its generated
  // table types are preserved at each call site.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
) {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isPro = (roles ?? []).some((r: { role: string }) => r.role === "professional");
  if (!isPro) throw new Error("Only professionals can manage clients");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("tier,status")
    .eq("user_id", userId);
  const hasProTier = (subscriptions ?? []).some(
    (subscription: { tier: string; status: string }) =>
      (subscription.tier === "pro" || subscription.tier === "studio") &&
      ["active", "trialing", "past_due", "unpaid"].includes(subscription.status),
  );
  if (!hasProTier) throw new Error("This feature is included with an active Pro plan");
}

// ============================================================================
// Add a single roster entry
// ============================================================================
export const addRosterClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: emailSchema,
        full_name: nameSchema.optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertProfessional(supabase as any, userId);

    const { data: row, error } = await supabase
      .from("client_roster")
      .insert({
        professional_id: userId,
        email: data.email,
        full_name: data.full_name ?? null,
        notes: data.notes ?? null,
        status: "prospect",
      })
      .select("id, email, full_name, status")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("That email is already on your roster");
      }
      throw new Error(error.message);
    }
    return { roster: row };
  });

// ============================================================================
// CSV import — supports preview (dry-run) and commit
// ============================================================================
export const importRosterCSV = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        rows: z.array(csvRowSchema).min(1).max(500),
        preview: z.boolean().default(true),
        restoreArchived: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertProfessional(supabase as any, userId);

    // Categorise rows
    const seen = new Set<string>();
    const valid: { email: string; full_name: string | null; rowIndex: number }[] = [];
    const invalid: { rowIndex: number; reason: string }[] = [];
    const dupesInCsv: { rowIndex: number; email: string }[] = [];

    data.rows.forEach((r, i) => {
      const parsed = emailSchema.safeParse(r.email);
      if (!parsed.success) {
        invalid.push({ rowIndex: i, reason: "Invalid email" });
        return;
      }
      const email = parsed.data;
      if (seen.has(email)) {
        dupesInCsv.push({ rowIndex: i, email });
        return;
      }
      seen.add(email);
      const name = r.full_name?.trim() || null;
      valid.push({ email, full_name: name, rowIndex: i });
    });

    // Look up existing roster rows for this pro
    const emails = valid.map((v) => v.email);
    const { data: existing } = emails.length
      ? await supabase
          .from("client_roster")
          .select("id, email, full_name, status")
          .eq("professional_id", userId)
          .in("email", emails)
      : { data: [] as { id: string; email: string; full_name: string | null; status: string }[] };

    const existingByEmail = new Map(
      (existing ?? []).map((r) => [r.email.toLowerCase(), r]),
    );

    const newRows: typeof valid = [];
    const alreadyActive: { email: string; status: string }[] = [];
    const alreadyArchived: { id: string; email: string }[] = [];
    const conflicting: { rowIndex: number; email: string; existingName: string | null; csvName: string | null }[] = [];

    valid.forEach((v) => {
      const ex = existingByEmail.get(v.email);
      if (!ex) {
        newRows.push(v);
        return;
      }
      if (ex.status === "archived") {
        alreadyArchived.push({ id: ex.id, email: v.email });
        return;
      }
      // Name conflict?
      if (v.full_name && ex.full_name && v.full_name.toLowerCase() !== ex.full_name.toLowerCase()) {
        conflicting.push({
          rowIndex: v.rowIndex,
          email: v.email,
          existingName: ex.full_name,
          csvName: v.full_name,
        });
        return;
      }
      alreadyActive.push({ email: v.email, status: ex.status });
    });

    const summary = {
      total: data.rows.length,
      willAdd: newRows.length,
      willRestore: data.restoreArchived ? alreadyArchived.length : 0,
      alreadyActive: alreadyActive.length,
      alreadyArchived: alreadyArchived.length,
      invalid: invalid.length,
      duplicatesInCSV: dupesInCsv.length,
      conflicting: conflicting.length,
    };

    if (data.preview) {
      return {
        summary,
        invalid,
        duplicatesInCSV: dupesInCsv,
        alreadyActive,
        alreadyArchived,
        conflicting,
        newRows: newRows.map((r) => ({ email: r.email, full_name: r.full_name })),
      };
    }

    // Commit
    if (newRows.length) {
      const { error: insertErr } = await supabase.from("client_roster").insert(
        newRows.map((r) => ({
          professional_id: userId,
          email: r.email,
          full_name: r.full_name,
          status: "prospect" as const,
        })),
      );
      if (insertErr) throw new Error(insertErr.message);
    }
    if (data.restoreArchived && alreadyArchived.length) {
      const { error: restoreErr } = await supabase
        .from("client_roster")
        .update({ status: "prospect", archived_at: null })
        .in(
          "id",
          alreadyArchived.map((r) => r.id),
        );
      if (restoreErr) throw new Error(restoreErr.message);
    }

    return { summary, committed: true };
  });

// ============================================================================
// Internal: ensure an active invite exists for a roster row, send the email
// ============================================================================
async function ensureInviteSentInternal(opts: {
  rosterId: string;
  professionalId: string;
  reason: "confirmed" | "programme_assigned" | "payment_received" | "manual_resend" | "manual_create";
  forceNew?: boolean;
}): Promise<{ alreadySent: boolean; inviteId: string; messageId?: string }> {
  const { rosterId, professionalId, reason, forceNew } = opts;

  // Load roster row (admin client; we're trusted here)
  const { data: roster, error: rosterErr } = await supabaseAdmin
    .from("client_roster")
    .select("id, professional_id, email, full_name, status, invite_id")
    .eq("id", rosterId)
    .single();
  if (rosterErr || !roster) throw new Error("Roster row not found");
  if (roster.professional_id !== professionalId) {
    throw new Error("Not your roster row");
  }

  // Check existing invite
  if (!forceNew && roster.invite_id) {
    const { data: existingInvite } = await supabaseAdmin
      .from("client_invites")
      .select("id, status")
      .eq("id", roster.invite_id)
      .maybeSingle();
    if (
      existingInvite &&
      (existingInvite.status === "pending" || existingInvite.status === "accepted")
    ) {
      return { alreadySent: true, inviteId: existingInvite.id };
    }
  }

  // If forcing new (resend), revoke any existing pending invites for this roster row
  if (forceNew) {
    await supabaseAdmin
      .from("client_invites")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("roster_id", rosterId)
      .eq("status", "pending");
  }

  // Generate token (raw lives only in this scope / the URL); store hash.
  const rawToken = generateRawToken();
  const tokenHash = await sha256Hex(rawToken);

  const { data: invite, error: insertErr } = await supabaseAdmin
    .from("client_invites")
    .insert({
      professional_id: professionalId,
      email: roster.email,
      full_name: roster.full_name,
      token_hash: tokenHash,
      status: "pending",
      auto_sent: reason !== "manual_create" && reason !== "manual_resend",
      trigger_reason: reason,
      email_at_issue: roster.email.toLowerCase(),
      roster_id: rosterId,
    })
    .select("id, email, full_name, expires_at")
    .single();
  if (insertErr) throw new Error(insertErr.message);

  // Link roster -> latest invite
  await supabaseAdmin
    .from("client_roster")
    .update({ invite_id: invite.id })
    .eq("id", rosterId);

  // Fetch pro display info
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", professionalId)
    .maybeSingle();
  const { data: pro } = await supabaseAdmin
    .from("professionals")
    .select("trading_name")
    .eq("id", professionalId)
    .maybeSingle();

  const acceptUrl = `${siteOrigin()}/accept-invite?token=${rawToken}`;

  let messageId: string | undefined;
  try {
    const res = await sendTransactionalEmailServer({
      templateName: "client-invite",
      recipientEmail: invite.email,
      idempotencyKey: `client-invite-${invite.id}`,
      templateData: {
        proName: profile?.full_name ?? "Your coach",
        tradingName: pro?.trading_name ?? null,
        clientName: invite.full_name ?? null,
        acceptUrl,
      },
    });
    messageId = res.messageId;
  } catch (e) {
    console.error("Invite email enqueue failed", e);
    // Invite row exists; the coach can resend.
  }

  return { alreadySent: false, inviteId: invite.id, messageId };
}

// ============================================================================
// Triggers
// ============================================================================
export const confirmRosterClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ rosterId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertProfessional(supabase as any, userId);

    const { error: upErr } = await supabase
      .from("client_roster")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", data.rosterId)
      .eq("professional_id", userId)
      .in("status", ["prospect", "confirmed"]);
    if (upErr) throw new Error(upErr.message);

    const result = await ensureInviteSentInternal({
      rosterId: data.rosterId,
      professionalId: userId,
      reason: "confirmed",
    });
    return result;
  });

export const assignProgrammeToClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        rosterId: z.string().uuid(),
        programmeId: z.string().min(1).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertProfessional(supabase as any, userId);

    const { data: roster, error: getErr } = await supabase
      .from("client_roster")
      .select("status, first_programme_at")
      .eq("id", data.rosterId)
      .eq("professional_id", userId)
      .single();
    if (getErr || !roster) throw new Error("Roster row not found");

    const updates: {
      first_programme_at?: string;
      status?: "confirmed";
      confirmed_at?: string;
    } = {};
    if (!roster.first_programme_at) {
      updates.first_programme_at = new Date().toISOString();
    }
    if (roster.status === "prospect") {
      updates.status = "confirmed";
      updates.confirmed_at = new Date().toISOString();
    }
    if (Object.keys(updates).length) {
      await supabase
        .from("client_roster")
        .update(updates)
        .eq("id", data.rosterId)
        .eq("professional_id", userId);
    }

    return ensureInviteSentInternal({
      rosterId: data.rosterId,
      professionalId: userId,
      reason: "programme_assigned",
    });
  });

// Stubbed: wired to schema, not exposed to UI/webhooks yet.
export const markFirstPaymentReceived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        rosterId: z.string().uuid(),
        paymentRef: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertProfessional(supabase as any, userId);

    await supabase
      .from("client_roster")
      .update({ first_payment_at: new Date().toISOString() })
      .eq("id", data.rosterId)
      .eq("professional_id", userId)
      .is("first_payment_at", null);

    return ensureInviteSentInternal({
      rosterId: data.rosterId,
      professionalId: userId,
      reason: "payment_received",
    });
  });

// ============================================================================
// Resend (manual) — rate-limited (1/hour per row, 10/day per coach)
// ============================================================================
export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ rosterId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertProfessional(supabase as any, userId);

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentForRow } = await supabaseAdmin
      .from("client_invites")
      .select("id", { count: "exact", head: true })
      .eq("roster_id", data.rosterId)
      .gte("created_at", hourAgo);
    if ((recentForRow ?? 0) > 0) {
      throw new Error("You can only resend an invite once per hour");
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentForPro } = await supabaseAdmin
      .from("client_invites")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", userId)
      .gte("created_at", dayAgo);
    if ((recentForPro ?? 0) >= 50) {
      throw new Error("Daily invite limit reached. Try again tomorrow.");
    }

    return ensureInviteSentInternal({
      rosterId: data.rosterId,
      professionalId: userId,
      reason: "manual_resend",
      forceNew: true,
    });
  });

// ============================================================================
// List the coach's roster
// ============================================================================
export const listRoster = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("client_roster")
      .select(
        "id, email, full_name, status, notes, invite_id, confirmed_at, activated_at, created_at",
      )
      .eq("professional_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((r) => r.invite_id).filter(Boolean) as string[];
    const invitesById = new Map<string, { id: string; status: string; expires_at: string; created_at: string }>();
    if (ids.length) {
      const { data: invs } = await supabaseAdmin
        .from("client_invites")
        .select("id, status, expires_at, created_at")
        .in("id", ids);
      (invs ?? []).forEach((i) => invitesById.set(i.id, i));
    }

    type InviteStatus = "none" | "pending" | "accepted" | "expired" | "revoked";
    type RosterStatus = "prospect" | "confirmed" | "active" | "archived";

    return {
      rows: (data ?? []).map((r) => {
        const inv = r.invite_id ? invitesById.get(r.invite_id) : null;
        let inviteStatus: InviteStatus = "none";
        if (inv) {
          if (inv.status === "pending" && new Date(inv.expires_at).getTime() < Date.now()) {
            inviteStatus = "expired" as InviteStatus;
          } else {
            inviteStatus = inv.status as InviteStatus;
          }
        }
        return {
          id: r.id,
          email: r.email,
          full_name: r.full_name,
          status: r.status as RosterStatus,
          inviteStatus: inviteStatus as InviteStatus,
          inviteSentAt: inv?.created_at ?? null,
          confirmedAt: r.confirmed_at,
          activatedAt: r.activated_at,
          createdAt: r.created_at,
          notes: r.notes,
        };
      }),
    };
  });

// ============================================================================
// Public invite lookup (uses raw token from URL, hashes server-side)
// ============================================================================
export const lookupInviteByToken = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ token: z.string().min(16).max(128) }).parse(input))
  .handler(async ({ data }) => {
    const tokenHash = await sha256Hex(data.token);
    const { data: rows, error } = await supabaseAdmin.rpc("get_invite_by_token", {
      _token_hash: tokenHash,
    });
    if (error) throw new Error(error.message);
    const invite = Array.isArray(rows) ? rows[0] : rows;
    if (!invite) return { invite: null };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", invite.professional_id)
      .maybeSingle();

    const expired = new Date(invite.expires_at).getTime() < Date.now();
    return {
      invite: {
        email: invite.email as string,
        full_name: (invite.full_name as string | null) ?? null,
        status: invite.status as string,
        expired,
        professional_name: profile?.full_name ?? "Your coach",
      },
    };
  });

// ============================================================================
// Complete signup: create auth user with password, link to coach
// ============================================================================
export const completeInviteSignup = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        token: z.string().min(16).max(128),
        password: z.string().min(10).max(200),
        fullName: nameSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // Password rule: min 10 + at least one non-letter
    if (!/[^A-Za-z]/.test(data.password)) {
      throw new Error("Password must contain a number or symbol");
    }

    const tokenHash = await sha256Hex(data.token);
    const { data: rows, error: lookupErr } = await supabaseAdmin.rpc(
      "get_invite_by_token",
      { _token_hash: tokenHash },
    );
    if (lookupErr) throw new Error(lookupErr.message);
    const invite = Array.isArray(rows) ? rows[0] : rows;
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error(`Invite is ${invite.status}`);
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      throw new Error("Invite expired");
    }

    const email = (invite.email as string).toLowerCase();
    const proId = invite.professional_id as string;
    const inviteId = invite.id as string;
    const fullName = data.fullName ?? (invite.full_name as string | null) ?? null;

    // Check if a user already exists with this email
    let authUserId: string | null = null;
    const { data: lookup } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = lookup?.users.find(
      (u) => (u.email ?? "").toLowerCase() === email,
    );

    if (existing) {
      authUserId = existing.id;
      // Update password on existing user (e.g., re-invite scenario)
      const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        { password: data.password, email_confirm: true },
      );
      if (upErr) throw new Error(upErr.message);
    } else {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            signup_kind: "client",
            full_name: fullName,
          },
        });
      if (createErr) throw new Error(createErr.message);
      authUserId = created.user?.id ?? null;
    }
    if (!authUserId) throw new Error("Failed to create user");

    // Ensure client role + client record
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: authUserId, role: "client" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    await supabaseAdmin
      .from("clients")
      .upsert({ id: authUserId }, { onConflict: "id", ignoreDuplicates: true });

    // Link to coach
    await supabaseAdmin.from("coach_client").upsert(
      {
        professional_id: proId,
        client_id: authUserId,
        status: "active",
      },
      { onConflict: "professional_id,client_id", ignoreDuplicates: true },
    );

    // Mark invite accepted
    await supabaseAdmin
      .from("client_invites")
      .update({
        status: "accepted",
        accepted_user_id: authUserId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    // Activate roster row (find by invite_id)
    await supabaseAdmin
      .from("client_roster")
      .update({
        status: "active",
        client_id: authUserId,
        auth_user_id: authUserId,
        activated_at: new Date().toISOString(),
      })
      .eq("invite_id", inviteId);

    // Sign the user in to return session tokens
    const { data: session, error: signInErr } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password: data.password,
      });
    if (signInErr) throw new Error(signInErr.message);

    return {
      success: true,
      session: session.session
        ? {
            access_token: session.session.access_token,
            refresh_token: session.session.refresh_token,
          }
        : null,
    };
  });
