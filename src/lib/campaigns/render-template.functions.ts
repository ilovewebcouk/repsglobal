import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Hard allowlist of email-template registry keys that are safe to send as a
 * bulk broadcast through the Campaigns composer.
 *
 * DO NOT add lifecycle / transactional / per-recipient templates here. Those
 * are dispatched automatically by cron jobs and event triggers:
 *   - verification-reminder      → recompute-verification-daily
 *   - insurance-renewal-due      → insurance-check-renewals-daily
 *   - insurance-blocked          → verification/notifications event
 *   - renewal-card-needed        → churn-lifecycle-daily
 *   - renewal-payment-failed     → payments webhook
 *   - winback-lapsed             → churn-lifecycle-daily
 * They require per-recipient tokens/state and MUST NOT be blasted manually.
 *
 * Only add a key here if the same body is safe for every recipient in a tier
 * and it's a one-off announcement, not a recurring lifecycle nudge.
 */
export const BROADCAST_TEMPLATE_KEYS = [
  "relaunch-announcement",
  "new-reps-rollout",
] as const;

export type BroadcastTemplateKey = (typeof BROADCAST_TEMPLATE_KEYS)[number];

export const renderRegistryTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        templateKey: z.enum(BROADCAST_TEMPLATE_KEYS),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tmpl = TEMPLATES[data.templateKey];
    if (!tmpl) throw new Error(`Template ${data.templateKey} not found`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(tmpl.component as any, {});
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof tmpl.subject === "function" ? tmpl.subject({}) : tmpl.subject;

    return {
      templateKey: data.templateKey,
      displayName: tmpl.displayName ?? data.templateKey,
      subject,
      html,
      text,
    };
  });

/**
 * Client-safe descriptor list for the composer picker. Keeps display labels
 * out of the server render call so the dropdown renders without a round-trip.
 */
export const BROADCAST_TEMPLATE_CHOICES: Array<{
  key: BroadcastTemplateKey;
  label: string;
  description: string;
}> = [
  {
    key: "relaunch-announcement",
    label: "Relaunch announcement",
    description: "The new REPS is here — introductory relaunch email.",
  },
  {
    key: "new-reps-rollout",
    label: "New REPS rollout — log in & unlock website",
    description:
      "Prompts members to log in (via forgot-password) and unlock their trainer website.",
  },
];
