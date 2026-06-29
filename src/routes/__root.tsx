import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LAUNCH_GATE_ENABLED, isAllowlistedPath, hasPreviewUnlock } from "@/lib/launch";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-[10px] border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Sitewide fallback only — per-route head() overrides title/description/og:* on every
      // shareable page. Title here is intentionally distinct from the homepage's title so the
      // two don't duplicate.
      { title: "REPS — The professional standard for fitness" },
      {
        name: "description",
        content:
          "REPS is the professional standard for fitness — a verified register of trainers, coaches and instructors, and the platform that powers their businesses.",
      },
      { property: "og:site_name", content: "REPS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      // Google Search Console META verification
      { name: "google-site-verification", content: "p-lx33rcSWVnBeZd4OwPJ-MW6wVU6Y2rg8AOoNUbiDU" },
      // NOTE: no og:image / twitter:image at the root — root-level images concatenate into every
      // match and override per-page share previews. Leaf routes own their own og:image.
      { property: "og:title", content: "REPS — The professional standard for fitness" },
      { name: "twitter:title", content: "REPS — The professional standard for fitness" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "REPS",
          alternateName: "Register of Exercise Professionals",
          url: "https://repsglobal.lovable.app",
          logo: "https://repsglobal.lovable.app/favicon.ico",
          sameAs: ["https://repsuk.org", "https://www.repsuk.org"],
        }),
      },
    ],
  }),

  beforeLoad: async ({ location }) => {
    // Never gate /lovable/* — these are webhook/cron/preview routes that self-authenticate.
    if (location.pathname.startsWith("/lovable/")) return;
    if (!LAUNCH_GATE_ENABLED) return;
    if (isAllowlistedPath(location.pathname)) return;

    // Server: no access to Supabase session (lives in localStorage). Treat every
    // SSR request as unauthenticated and serve /coming-soon. Authed users (and
    // preview-unlock holders) get forwarded back to their target by the client
    // effect on /coming-soon.
    if (typeof window === "undefined") {
      throw redirect({ to: "/coming-soon", search: { from: location.pathname } as never });
    }

    if (hasPreviewUnlock()) return;

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/coming-soon", search: { from: location.pathname } as never });
    }
  },

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:h-10 focus:items-center focus:rounded-[10px] focus:bg-reps-orange focus:px-4 focus:text-[14px] focus:font-semibold focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      // Fire-and-forget welcome email on confirmed sign-in. Idempotent server-side
      // via `welcome-signup:${userId}` key in email_send_log.
      if (event === "SIGNED_IN") {
        import("@/lib/email/welcome.functions")
          .then(({ sendWelcomeEmailServerFn }) => sendWelcomeEmailServerFn())
          .catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);


  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={120}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <div id="main-content" tabIndex={-1} className="outline-none">
          <Outlet />
        </div>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

