/**
 * Admin — Bulk import training providers with pre-existing Stripe customers.
 *
 * Takes a list of { email, stripe_customer_id, provider_name, website? } rows
 * and, for each:
 *   1. If the email is already an auth user  → link the Stripe customer to
 *      an active `training_provider` subscription, seed the provider row if
 *      missing, and send the "portal is live" announcement (no reset link).
 *   2. Otherwise → create the auth user via `generateLink({type:'invite'})`
 *      (this is the password-set link Supabase uses for invites), seed
 *      profiles / professionals rows, upsert the subscription with the
 *      provided stripe_customer_id, and send the announcement WITH the
 *      password-set CTA.
 *
 * Every imported provider is `account_type = "training_provider"`, tier
 * `training_provider`, subscription `active`. Full REPS provider
 * verification is still required before certificates can issue — that
 * gate is enforced elsewhere; this fn does not bypass it.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* -------------------------------- gates -------------------------------- */

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

/* -------------------------------- utils -------------------------------- */

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueProviderSlug(sa: any, name: string, excludeId?: string) {
  const base = slugify(name);
  if (!base) return null;
  let slug = base;
  for (let i = 2; i < 60; i++) {
    const query = sa.from("professionals").select("id").eq("slug", slug);
    if (excludeId) query.neq("id", excludeId);
    const { data: clash } = await query.maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }
  return slug;
}

function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  let out = u.toString();
  if (u.pathname === "/" && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

async function findAuthUserByEmail(sa: any, email: string): Promise<string | null> {
  // paginate up to a reasonable ceiling; expected list size is small.
  const perPage = 1000;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await sa.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = (data?.users || []) as Array<{ id: string; email: string | null }>;
    const hit = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (users.length < perPage) return null;
  }
  return null;
}

/* -------------------------------- input -------------------------------- */

const RowInput = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  stripe_customer_id: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^cus_[A-Za-z0-9]+$/, "stripe_customer_id must look like cus_..."),
  provider_name: z.string().trim().min(1).max(160),
  website: z.string().trim().max(300).optional().nullable(),
});

const Input = z.object({
  rows: z.array(RowInput).min(1).max(500),
  /** If true, actually run. If false, dry-run and just report what WOULD happen. */
  commit: z.boolean().default(false),
});

/* -------------------------------- output ------------------------------- */

export type ImportRowResult = {
  email: string;
  provider_name: string;
  stripe_customer_id: string;
  action:
    | "would_create"
    | "would_link_existing"
    | "created"
    | "linked_existing"
    | "skipped"
    | "error";
  user_id?: string;
  slug?: string;
  invite_url?: string;
  message_id?: string;
  detail: string;
};

export type ImportSummary = {
  total: number;
  created: number;
  linked_existing: number;
  errors: number;
  dry_run: boolean;
};

/* ------------------------------ server fn ------------------------------ */

export const importTrainingProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const results: ImportRowResult[] = [];
    let created = 0;
    let linked = 0;
    let errors = 0;

    for (const row of data.rows) {
      const rec: ImportRowResult = {
        email: row.email,
        provider_name: row.provider_name,
        stripe_customer_id: row.stripe_customer_id,
        action: "error",
        detail: "",
      };

      try {
        const website = normaliseUrl(row.website ?? null);
        const existingId = await findAuthUserByEmail(sa, row.email);

        // ------ Dry-run branch ------
        if (!data.commit) {
          rec.action = existingId ? "would_link_existing" : "would_create";
          rec.user_id = existingId ?? undefined;
          rec.detail = existingId
            ? "Email already registered — Stripe customer would be linked."
            : "New auth user would be invited with a password-set link.";
          results.push(rec);
          continue;
        }

        // ------ Commit branch ------
        let userId = existingId;
        let inviteUrl: string | null = null;

        if (!userId) {
          const redirectTo = `https://repsuk.org/dashboard`;
          const { data: linkData, error: linkErr } = await sa.auth.admin.generateLink({
            type: "invite",
            email: row.email,
            options: {
              redirectTo,
              data: {
                signup_kind: "professional",
                account_type: "training_provider",
                full_name: row.provider_name,
              },
            },
          });
          if (linkErr) throw new Error(linkErr.message);
          inviteUrl = linkData.properties?.action_link ?? null;
          userId = linkData.user?.id ?? null;
          if (!userId) throw new Error("Invite created but no user id was returned.");
        }

        // Seed profiles.full_name
        await sa
          .from("profiles")
          .upsert(
            { id: userId, full_name: row.provider_name } as never,
            { onConflict: "id" },
          );

        // Seed / upgrade professionals row
        const { data: existingPro } = await sa
          .from("professionals")
          .select("id, slug, account_type, website_url")
          .eq("id", userId)
          .maybeSingle();

        let slug: string | null = existingPro?.slug ?? null;
        if (!slug) {
          slug = await uniqueProviderSlug(sa, row.provider_name, userId);
        }

        const proRow: Record<string, unknown> = {
          id: userId,
          account_type: "training_provider",
          slug,
        };
        if (!existingPro) proRow.is_published = false;
        if (website && !existingPro?.website_url) proRow.website_url = website;

        const { error: proErr } = await sa
          .from("professionals")
          .upsert(proRow as never, { onConflict: "id" });
        if (proErr) throw new Error(proErr.message);

        // Upsert subscription: latest row wins, stripe_customer_id linked
        const now = new Date().toISOString();
        const { data: existingSub } = await sa
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSub?.id) {
          const { error: subErr } = await sa
            .from("subscriptions")
            .update({
              tier: "training_provider" as any,
              status: "active" as any,
              stripe_customer_id: row.stripe_customer_id,
              canceled_at: null,
              updated_at: now,
            } as never)
            .eq("id", existingSub.id);
          if (subErr) throw new Error(subErr.message);
        } else {
          const { error: subErr } = await sa.from("subscriptions").insert({
            user_id: userId,
            tier: "training_provider",
            status: "active",
            billing_period: "annual",
            stripe_customer_id: row.stripe_customer_id,
            created_at: now,
            updated_at: now,
          } as never);
          if (subErr) throw new Error(subErr.message);
        }

        // Send announcement email
        let messageId: string | undefined;
        try {
          const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
          const sendRes = await sendTransactionalEmailServer({
            templateName: "provider-portal-is-live",
            recipientEmail: row.email,
            idempotencyKey: `provider-portal-live-${userId}`,
            templateData: {
              providerName: row.provider_name,
              passwordSetUrl: inviteUrl ?? undefined,
              alreadyRegistered: !!existingId,
              emailAddress: row.email,
            },
          });
          messageId = (sendRes as { messageId?: string }).messageId;
        } catch (e) {
          // Non-fatal — record it so we can retry manually.
          console.error("[importTrainingProviders] email send failed", row.email, e);
        }

        // Audit log
        await sa.rpc("log_admin_action", {
          _actor_id: context.userId,
          _action: "provider.bulk_import",
          _target_table: "professionals",
          _target_id: userId,
          _before_state: null,
          _after_state: {
            email: row.email,
            provider_name: row.provider_name,
            stripe_customer_id: row.stripe_customer_id,
            slug,
            already_registered: !!existingId,
          },
        });

        if (existingId) {
          linked += 1;
          rec.action = "linked_existing";
          rec.detail = "Existing REPs account linked to Stripe customer & announcement sent.";
        } else {
          created += 1;
          rec.action = "created";
          rec.detail = "Auth user invited, portal seeded, announcement + password-set link sent.";
        }
        rec.user_id = userId ?? undefined;
        rec.slug = slug ?? undefined;
        rec.invite_url = inviteUrl ?? undefined;
        rec.message_id = messageId;
      } catch (e) {
        errors += 1;
        rec.action = "error";
        rec.detail = e instanceof Error ? e.message : String(e);
      }

      results.push(rec);
    }

    const summary: ImportSummary = {
      total: data.rows.length,
      created,
      linked_existing: linked,
      errors,
      dry_run: !data.commit,
    };

    return { summary, results };
  });
