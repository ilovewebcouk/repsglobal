// Draft + Publish server functions.
//
// The public /c/$slug page reads `websites.published_snapshot` when present.
// Editor mutations write straight to live content rows (via existing
// upsert server fns) and the dirty-tracking triggers on those tables flip
// `websites.has_unpublished_changes` to true. Clicking "Publish website"
// calls `publishMyWebsite`, which builds a snapshot of the current live
// content set and stores it on the websites row. From then on `/c/$slug`
// serves the snapshot until the trainer publishes again.
//
// Preview: the editor's iframe loads `/c/$slug?preview=1`. When that flag
// is set, `getWebsiteBySlug` returns live (draft) data instead of the
// snapshot, so trainers see their unpublished edits in the preview panel.
//
// NOTE (phase 1): `?preview=1` is currently un-signed — anyone who guesses
// the URL and knows the slug can peek at that trainer's draft content.
// Content is not privacy-sensitive (it's future public content) but a
// signed preview token is a follow-up hardening pass.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

/** Snapshot shape mirrors the return of getWebsiteBySlug — same JSON. */
type WebsiteSnapshot = Record<string, unknown>;

export const publishMyWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<{ published_at: string }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getWebsiteBySlug } = await import("./website.functions");

    // Look up my slug so we can reuse the public reader to build the
    // canonical shape.
    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("id, slug")
      .eq("id", userId)
      .maybeSingle();
    if (!pro?.slug) {
      throw new Error("Your public URL isn't ready yet — finish onboarding first.");
    }

    // Force the reader to return live data (bypass any existing snapshot).
    const live = await getWebsiteBySlug({
      data: { slug: pro.slug, preview: true },
    });
    if (!live) {
      throw new Error("Nothing to publish yet — add some content and try again.");
    }

    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("websites")
      .update({
        published_snapshot: JSON.parse(JSON.stringify(live)),
        published_at: now,
        has_unpublished_changes: false,
      })
      .eq("professional_id", userId);
    if (error) throw error;

    return { published_at: now };
  });

export type PublishState = {
  has_unpublished_changes: boolean;
  published_at: string | null;
  ever_published: boolean;
};

export const getMyPublishState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<PublishState> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data } = await supabaseAdmin
      .from("websites")
      .select("has_unpublished_changes, published_at, published_snapshot")
      .eq("professional_id", userId)
      .maybeSingle();

    return {
      has_unpublished_changes: !!(data?.has_unpublished_changes ?? true),
      published_at: (data?.published_at as string | null) ?? null,
      ever_published: !!data?.published_snapshot,
    };
  });
