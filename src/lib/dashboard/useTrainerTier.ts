import * as React from "react";
import { getRouteApi } from "@tanstack/react-router";

import type { Tier } from "@/components/dashboard/DashboardShell";

const professionalRouteApi = getRouteApi("/_authenticated/_professional");

const STORAGE_KEY = "repsTierOverride";
const EVENT = "reps:tier-override-changed";
const VALID: Tier[] = ["verified", "pro", "studio"];

/** Preview hosts where the dev-only tier switch is allowed. */
function isPreviewEnv(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".lovable.app") || host === "staging.repsuk.org";
}

export function isTierOverrideAllowed(): boolean {
  return isPreviewEnv();
}

export function readTierOverride(): Tier | null {
  if (!isPreviewEnv()) return null;
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(STORAGE_KEY);
    return v && (VALID as string[]).includes(v) ? (v as Tier) : null;
  } catch {
    return null;
  }
}

export function setTierOverride(tier: Tier | null) {
  if (typeof window === "undefined") return;
  try {
    if (tier == null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, tier);
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

/**
 * Returns the current trainer's tier. Real tier comes from the
 * `_professional` layout's beforeLoad. On preview/dev hosts, a
 * sessionStorage override (set by the dev-only TierPreviewSwitch) takes
 * precedence for client rendering only — server route gates still see the
 * real DB tier.
 */
export function useTrainerTier(): Tier {
  const ctx = professionalRouteApi.useRouteContext();
  const realTier = (ctx.trainerTier ?? "verified") as Tier;

  const subscribe = React.useCallback((cb: () => void) => {
    window.addEventListener(EVENT, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(EVENT, cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
  const getSnapshot = React.useCallback(() => readTierOverride(), []);
  const override = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null,
  );

  return override ?? realTier;
}

/** Real (DB-resolved) tier, ignoring any preview override. */
export function useRealTrainerTier(): Tier {
  const ctx = professionalRouteApi.useRouteContext();
  return (ctx.trainerTier ?? "verified") as Tier;
}
