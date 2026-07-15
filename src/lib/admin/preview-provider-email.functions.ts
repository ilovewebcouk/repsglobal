/**
 * Admin — render the `provider-portal-is-live` email for a single row so
 * admins can preview the exact HTML before running the importer.
 *
 * Returns `{ subject, html }` only. Does NOT send, does NOT log, does NOT
 * consume an unsubscribe token. Safe to call arbitrarily.
 */
import * as React from "react";
import { render } from "@react-email/components";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEMPLATES } from "@/lib/email-templates/registry";

const Input = z.object({
  provider_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  already_registered: z.boolean().default(false),
});

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = ctx.supabase as any;
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

export const previewProviderPortalEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const template = TEMPLATES["provider-portal-is-live"];
    if (!template) throw new Error("Template not found");

    const props = {
      providerName: data.provider_name,
      emailAddress: data.email,
      alreadyRegistered: data.already_registered,
      // Placeholder password-set URL — real invite token is generated at commit.
      passwordSetUrl: data.already_registered
        ? undefined
        : "https://repsuk.org/auth?token=PREVIEW_ONLY",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(template.component, props as any);
    const html = await render(element);
    const subject =
      typeof template.subject === "function" ? template.subject(props) : template.subject;

    return { subject, html };
  });
