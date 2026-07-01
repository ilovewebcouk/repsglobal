// Public-only cookie banner. Never shown on admin/dashboard/portal/auth.
// Renders nothing until the client has hydrated (SSR-safe).

import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  hasDecided,
  isDntOrGpc,
  isPublicSurface,
  setConsent,
} from "@/lib/consent/consent";

export function CookieBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isPublicSurface(pathname)) return;
    if (hasDecided()) return;
    if (isDntOrGpc()) {
      // Auto-record rejection, do not show banner.
      setConsent(false, "rejected");
      return;
    }
    setVisible(true);
  }, [pathname]);

  useEffect(() => {
    const listener = () => setVisible(true);
    window.addEventListener("reps:open-cookie-preferences", listener);
    return () => window.removeEventListener("reps:open-cookie-preferences", listener);
  }, []);

  if (!mounted || !visible || !isPublicSurface(pathname)) return null;

  const acceptAll = () => {
    setConsent(true, "accepted");
    setVisible(false);
  };
  const rejectAll = () => {
    setConsent(false, "rejected");
    setVisible(false);
  };
  const saveCustom = () => {
    setConsent(analyticsOn, "customised");
    setCustomiseOpen(false);
    setVisible(false);
  };

  return (
    <>
      {!customiseOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie preferences"
          className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 pt-3 sm:px-6 sm:pb-6"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-[18px] border border-white/10 bg-[#0B0B0F]/95 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <div className="flex-1 text-[13px] leading-relaxed text-white/80">
              <p className="font-semibold text-white">Cookies on REPS</p>
              <p className="mt-1">
                We use essential cookies to make REPS work, and — if you agree — anonymous analytics
                cookies to understand which pages help pros and clients most. No advertising cookies.{" "}
                <Link to="/cookies" className="underline underline-offset-2 hover:text-white">
                  Learn more
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomiseOpen(true)}
                className="inline-flex h-9 items-center rounded-[10px] px-3 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                Customise
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="inline-flex h-9 items-center rounded-[10px] border border-white/15 bg-transparent px-3 text-[13px] font-medium text-white transition-colors hover:border-white/25 hover:bg-white/10"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex h-9 items-center rounded-[10px] bg-reps-orange px-3 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange-hover"
              >
                Accept all
              </button>
            </div>

          </div>
        </div>
      )}

      <Sheet open={customiseOpen} onOpenChange={setCustomiseOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[22px] border-t border-white/10 bg-[#0B0B0F] text-white"
        >
          <SheetHeader>
            <SheetTitle className="text-white">Cookie preferences</SheetTitle>
            <SheetDescription className="text-white/70">
              Choose what you're happy for REPS to store on your device. You can change this any time
              from the footer.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-[14px] border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-semibold text-white">Essential</p>
                <p className="mt-1 text-xs text-white/70">
                  Sign-in, security, and preferences. Required for REPS to work.
                </p>
              </div>
              <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 text-[11px] font-medium text-emerald-300">
                Always on
              </span>
            </div>


            <div className="flex items-start justify-between gap-4 rounded-[14px] border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-semibold text-white">Analytics</p>
                <p className="mt-1 text-xs text-white/70">
                  Anonymous, aggregate usage via our first-party proxy to PostHog (EU). Never
                  shared with advertisers.
                </p>
              </div>
              <Switch
                checked={analyticsOn}
                onCheckedChange={setAnalyticsOn}
                aria-label="Analytics cookies"
              />
            </div>
          </div>

          <SheetFooter className="mt-6 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomiseOpen(false)}
              className="border-white/15 bg-transparent text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveCustom}
              className="bg-reps-orange text-white hover:bg-reps-orange-hover"
            >
              Save preferences
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}


/**
 * Fire from the footer link to reopen the banner.
 * Usage: <button onClick={openCookiePreferences}>Cookie preferences</button>
 */
export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("reps:open-cookie-preferences"));
}
