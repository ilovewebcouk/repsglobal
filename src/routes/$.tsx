/**
 * Legacy URL catch-all.
 *
 * Splat route. Catches any URL not matched by another route.
 * Calls `resolveLegacyPath` server fn which checks the `legacy_redirects`
 * table (BD CSV import) first, then falls back to slug-fuzzy matching.
 *
 *   matched     → 301 redirect to /c/{slug}
 *   gone        → 410 (Google deindexes cleanly)
 *   miss        → normal 404
 *
 * 410 is intentional for migrated content with no 1:1 destination — far
 * cleaner than soft-404.
 */
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { setResponseStatus, setResponseHeader } from "@tanstack/react-start/server";
import { resolveLegacyPath } from "@/lib/seo/legacy-redirects.functions";

export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const splat = (params as { _splat?: string })._splat ?? "";
    if (!splat) throw notFound();

    const path = "/" + splat.replace(/^\/+/, "");
    const result = await resolveLegacyPath({ data: { path } });

    if (result.action === "redirect") {
      throw redirect({
        to: "/c/$slug",
        params: { slug: result.toSlug },
        statusCode: 301,
      });
    }

    if (result.action === "gone") {
      setResponseStatus(410);
      setResponseHeader("Cache-Control", "public, max-age=86400");
      return { reason: result.reason };
    }

    throw notFound();
  },

  head: () => ({
    meta: [
      { title: "Page no longer available — REPS" },
      { name: "robots", content: "noindex,follow" },
    ],
  }),

  component: GonePage,
  notFoundComponent: () => {
    throw notFound();
  },
});

function GonePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center text-white">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
        410 · Permanently moved
      </p>
      <h1 className="mt-4 font-display text-[32px] leading-[1.1] lg:text-[44px]">
        This page is no longer available
      </h1>
      <p className="mt-4 max-w-md text-[15px] text-white/70">
        The REPS register has been rebuilt. The original page either wasn't migrated
        or the professional chose not to re-list.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/find-a-professional"
          className="inline-flex h-11 items-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
        >
          Find a professional
        </a>
        <a
          href="/"
          className="inline-flex h-11 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-5 text-[14px] font-semibold text-white/85 hover:text-white"
        >
          Home
        </a>
      </div>
    </main>
  );
}
