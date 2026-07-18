import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRIVATE_BUCKETS = [
  "certificate-templates",
  "certificates",
  "course-accreditations",
  "identity-docs",
  "insurance-docs",
  "provider-review-evidence",
  "support-attachments",
  "verification-docs",
];

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type ExportItem = {
  bucket: string;
  path: string;
  size: number | null;
  mime: string | null;
  updated_at: string | null;
  signed_url: string;
};

/**
 * Admin-only. Enumerates every object in the private storage buckets and
 * returns 7-day signed URLs so the data can be copied to another environment
 * (e.g. a duplicated Replit project) without sharing service credentials.
 */
export const exportPrivateStorage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const items: ExportItem[] = [];
    const errors: { bucket: string; error: string }[] = [];

    async function walk(bucket: string, prefix: string): Promise<void> {
      let offset = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
        if (error) {
          errors.push({ bucket, error: `${prefix}: ${error.message}` });
          return;
        }
        if (!data || data.length === 0) break;

        for (const entry of data) {
          const isFolder = entry.id === null;
          const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (isFolder) {
            await walk(bucket, fullPath);
          } else {
            const { data: signed, error: signErr } = await supabaseAdmin.storage
              .from(bucket)
              .createSignedUrl(fullPath, SIGNED_URL_TTL_SECONDS);
            if (signErr || !signed) {
              errors.push({ bucket, error: `sign ${fullPath}: ${signErr?.message ?? "unknown"}` });
              continue;
            }
            items.push({
              bucket,
              path: fullPath,
              size: (entry.metadata as { size?: number } | null)?.size ?? null,
              mime: (entry.metadata as { mimetype?: string } | null)?.mimetype ?? null,
              updated_at: entry.updated_at ?? null,
              signed_url: signed.signedUrl,
            });
          }
        }

        if (data.length < pageSize) break;
        offset += pageSize;
      }
    }

    for (const bucket of PRIVATE_BUCKETS) {
      await walk(bucket, "");
    }

    return {
      generated_at: new Date().toISOString(),
      ttl_seconds: SIGNED_URL_TTL_SECONDS,
      buckets: PRIVATE_BUCKETS,
      count: items.length,
      errors,
      items,
    };
  });
