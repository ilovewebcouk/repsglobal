/**
 * Public confirmation endpoint for training-provider domain email verification.
 *
 * Called from the "Confirm this email" link inside the provider-domain-confirm
 * email. On success we transition the row to `pending_admin_review` and
 * redirect the user to a branded confirmation page.
 */

import { createFileRoute } from "@tanstack/react-router";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function redirect(to: string): Response {
  return new Response(null, { status: 302, headers: { Location: to } });
}

export const Route = createFileRoute("/api/public/verify-provider-domain")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token")?.trim();
        const base = "/dashboard/verification";

        if (!token || token.length < 16) {
          return redirect(`${base}?domain_confirm=invalid`);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const tokenHash = await sha256Hex(token);

        const { data: row, error } = await supabaseAdmin
          .from("provider_domain_verifications")
          .select("id, status, confirmation_expires_at")
          .eq("confirmation_token_hash", tokenHash)
          .maybeSingle();

        if (error || !row) {
          return redirect(`${base}?domain_confirm=invalid`);
        }

        if (row.status === "approved") {
          return redirect(`${base}?domain_confirm=already`);
        }

        const expiresAt = row.confirmation_expires_at
          ? new Date(row.confirmation_expires_at).getTime()
          : 0;
        if (!expiresAt || Date.now() > expiresAt) {
          return redirect(`${base}?domain_confirm=expired`);
        }

        const nowIso = new Date().toISOString();
        const { error: updErr } = await supabaseAdmin
          .from("provider_domain_verifications")
          .update({
            status: "pending_admin_review",
            email_confirmed_at: nowIso,
            confirmation_token_hash: null,
            confirmation_expires_at: null,
          })
          .eq("id", row.id);

        if (updErr) {
          return redirect(`${base}?domain_confirm=error`);
        }

        return redirect(`${base}?domain_confirm=ok`);
      },
    },
  },
});
