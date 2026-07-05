/**
 * Sitemap health + per-URL recheck server functions.
 *
 * Reads (and optionally resubmits) the project's sitemap via Google Search
 * Console, and re-inspects a single URL on demand so admins don't have to
 * wait for the next daily scan.
 *
 * All functions are admin-gated.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://repsuk.org/";
const SITEMAP_URL = "https://repsuk.org/sitemap.xml";
const GSC_GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = ctx.supabase as any;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

function gscHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gscKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!lovableKey || !gscKey) {
    throw new Error("GSC connector not configured");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": gscKey,
  };
}

export type SitemapHealth = {
  status: "healthy" | "warnings" | "errors" | "not_submitted" | "unavailable";
  lastDownloaded: string | null;
  lastSubmitted: string | null;
  isPending: boolean;
  isSitemapsIndex: boolean;
  type: string | null;
  warnings: number;
  errors: number;
  submitted: number;
  indexed: number;
  message?: string;
};

/** Fetch the current sitemap health from Google Search Console. */
export const getSitemapHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({}).default({}).parse(input ?? {}))
  .handler(async ({ context }): Promise<SitemapHealth> => {
    await assertAdmin(context);
    const path = `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
    let res: Response;
    try {
      res = await fetch(`${GSC_GATEWAY}${path}`, { headers: gscHeaders() });
    } catch (e) {
      return {
        status: "unavailable",
        lastDownloaded: null,
        lastSubmitted: null,
        isPending: false,
        isSitemapsIndex: false,
        type: null,
        warnings: 0,
        errors: 0,
        submitted: 0,
        indexed: 0,
        message: e instanceof Error ? e.message : String(e),
      };
    }

    if (res.status === 404) {
      return {
        status: "not_submitted",
        lastDownloaded: null,
        lastSubmitted: null,
        isPending: false,
        isSitemapsIndex: false,
        type: null,
        warnings: 0,
        errors: 0,
        submitted: 0,
        indexed: 0,
        message: "Google hasn't been told about this sitemap yet.",
      };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        status: "unavailable",
        lastDownloaded: null,
        lastSubmitted: null,
        isPending: false,
        isSitemapsIndex: false,
        type: null,
        warnings: 0,
        errors: 0,
        submitted: 0,
        indexed: 0,
        message: `GSC ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as {
      path?: string;
      lastSubmitted?: string;
      lastDownloaded?: string;
      isPending?: boolean;
      isSitemapsIndex?: boolean;
      type?: string;
      warnings?: string | number;
      errors?: string | number;
      contents?: Array<{
        type?: string;
        submitted?: string | number;
        indexed?: string | number;
      }>;
    };

    const num = (v: string | number | undefined) => {
      if (v == null) return 0;
      const n = typeof v === "number" ? v : parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    };

    const warnings = num(json.warnings);
    const errors = num(json.errors);
    const submitted = num(json.contents?.[0]?.submitted);
    const indexed = num(json.contents?.[0]?.indexed);

    const status: SitemapHealth["status"] =
      errors > 0 ? "errors" : warnings > 0 ? "warnings" : "healthy";

    return {
      status,
      lastDownloaded: json.lastDownloaded ?? null,
      lastSubmitted: json.lastSubmitted ?? null,
      isPending: Boolean(json.isPending),
      isSitemapsIndex: Boolean(json.isSitemapsIndex),
      type: json.type ?? null,
      warnings,
      errors,
      submitted,
      indexed,
    };
  });

/** (Re)submit the sitemap to Google Search Console. */
export const resubmitSitemap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({}).default({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const path = `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
    const res = await fetch(`${GSC_GATEWAY}${path}`, {
      method: "PUT",
      headers: gscHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      const body = await res.text().catch(() => "");
      throw new Error(`GSC ${res.status}: ${body.slice(0, 200)}`);
    }
    return { ok: true };
  });

/** Re-inspect a single URL now and update its stored status + emit an event on diff. */
export const recheckSeoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ url: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { recheckOneUrl } = await import("@/lib/seo/index-monitor.server");
    return recheckOneUrl(data.url);
  });
