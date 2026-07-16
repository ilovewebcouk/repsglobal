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
import { useActivityBeacon } from "@/hooks/useActivityBeacon";
import { usePublicAnalyticsBeacon } from "@/hooks/usePublicAnalyticsBeacon";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { CookieBanner } from "@/components/consent/CookieBanner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const GA_MEASUREMENT_ID = "G-JNSVN6QD87";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-reps-ink px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-white">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-white">Page not found</h2>
        <p className="mt-2 text-sm text-white/70">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-reps-orange-hover"
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
    <div className="flex min-h-screen items-center justify-center bg-reps-ink px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-reps-orange-hover"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:text-white"
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
      { name: "google-site-verification", content: "rqmYYMqMbSi3mFFqyF3RkDISQmBBeaWycJ-vdq4atdg" },
      // NOTE: no og:image / twitter:image at the root — root-level images concatenate into every
      // match and override per-page share previews. Leaf routes own their own og:image.
      { property: "og:title", content: "REPS — The professional standard for fitness" },
      { name: "twitter:title", content: "REPS — The professional standard for fitness" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
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
          alternateName: [
            "REPs",
            "REPS UK",
            "REPs UK",
            "REPs Register",
            "The Register of Exercise Professionals",
            "Register of Exercise Professionals",
            "repsuk",
            "repsuk.org",
          ],
          url: "https://repsuk.org",
          logo: "https://repsuk.org/favicon.svg",
          sameAs: ["https://repsuk.org", "https://www.repsuk.org"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "REPS",
          alternateName: "The Register of Exercise Professionals",
          url: "https://repsuk.org",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://repsuk.org/find-a-professional?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
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
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            // Consent Mode v2 — deny everything by default, then read the
            // first-party consent cookie set by our banner and upgrade
            // analytics_storage synchronously before the first hit fires.
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});try{var m=document.cookie.split('; ').find(function(r){return r.indexOf('reps.consent.v1=')===0});if(m){var v=JSON.parse(decodeURIComponent(m.split('=')[1]));if(v&&v.analytics===true){gtag('consent','update',{analytics_storage:'granted'});}}}catch(e){}gtag('config','${GA_MEASUREMENT_ID}',{send_page_view:false,anonymize_ip:true});`,
          }}
        />
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Drop all cached React Query data on any identity transition so the
      // next signed-in user (e.g. admin after a pro logs out) never sees the
      // previous user's rows from disabled hooks (notifications bell, etc.).
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        queryClient.cancelQueries();
        queryClient.clear();
      }
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      // GA4 — bind user_id + logged_in user_property on every auth transition.
      import("@/hooks/useGoogleAnalytics").then(({ setGaUser, trackGaEvent }) => {
        setGaUser(session?.user?.id ?? null);
        if (event === "SIGNED_IN") trackGaEvent("login", { method: "supabase" });
      });
      // Fire-and-forget welcome email on confirmed sign-in. Idempotent server-side
      // via `welcome-signup:${userId}` key in email_send_log.
      if (event === "SIGNED_IN") {
        import("@/lib/email/welcome.functions")
          .then(({ sendWelcomeEmailServerFn }) => sendWelcomeEmailServerFn())
          .catch(() => {});
      }
    });
    // GA4 Consent Mode v2 — react to banner decisions in real time.
    const onConsent = (e: Event) => {
      const analytics = (e as CustomEvent<{ analytics: boolean }>).detail?.analytics === true;
      import("@/hooks/useGoogleAnalytics").then(({ setGaConsent }) => setGaConsent(analytics));
    };
    window.addEventListener("reps:consent-changed", onConsent);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("reps:consent-changed", onConsent);
    };
  }, [router, queryClient]);

  // Admin Activity v1 — privacy-safe operational beacon (logged-in only).
  useActivityBeacon();
  // Public Analytics v1 — anonymous public visitor beacon (consent-gated).
  usePublicAnalyticsBeacon();
  // Google Analytics 4 — pageviews on every route change.
  useGoogleAnalytics();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={120}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <div id="main-content" tabIndex={-1} className="outline-none">
          <Outlet />
        </div>
        <CookieBanner />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

