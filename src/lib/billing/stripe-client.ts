import type { StripeEnv } from "./stripe.server";

// Publishable keys are safe to embed in client code.
const PK_TEST =
  "pk_test_51KIBgpAP31Yc4cJjY6sFpxXnPx65ZJTLnFcnf3shOLBGBSy1V185x0bBoHSPL9t6Q4Jsc8VBgUYXaent3cKOCBnr00JY1oFEeD";
const PK_LIVE =
  "pk_live_51KIBgpAP31Yc4cJjJTJicYvW2hcAFbiDXVYMOX7LirGGgve39MCOLUmmOkfvxhw4gNZq512NITcVXgaUjdKESW7a00h3DxXWpl";

// Live key only on the production host(s). Everywhere else (preview, staging, localhost) uses test.
const LIVE_HOSTS = new Set<string>(["repsuk.org", "www.repsuk.org"]);

function isLiveHost(): boolean {
  if (typeof window === "undefined") return false;
  return LIVE_HOSTS.has(window.location.hostname);
}

export function getStripePublishableKey(): string {
  return isLiveHost() ? PK_LIVE : PK_TEST;
}

export function hasStripeClientToken(): boolean {
  return true;
}

export function getStripeEnvironment(): StripeEnv {
  return isLiveHost() ? "live" : "sandbox";
}
