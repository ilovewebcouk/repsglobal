#!/usr/bin/env python3
"""
Public Analytics / Admin Activity journey-ingest diagnostic.

Runs a fresh incognito Chromium session against BASE_URL (default: the
published Lovable URL), accepts cookies, visits public pages, captures
browser/runtime/network evidence, then diffs backend diagnostics via psql.

Failure reasons are intentionally specific:
  CONSENT_NOT_SET, GPC_DNT_BLOCKED, PUBLIC_SURFACE_BLOCKED,
  POSTHOG_ENV_MISSING, POSTHOG_INIT_NOT_CALLED, POSTHOG_LOADED_NOT_FIRED,
  QUEUE_NOT_FLUSHED, CAPTURE_NOT_CALLED, NETWORK_NOT_SENT, PROXY_NON_200,
  PROXY_OK_BUT_NO_DIAGNOSTIC, DIAGNOSTIC_OK_BUT_NO_JOURNEY

Env:
  BASE_URL   – target site (default https://repsglobal.lovable.app)
  PG*        – standard psql env vars (already set in the sandbox)
"""

import asyncio
import json
import os
import subprocess
import sys
import time
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "https://repsglobal.lovable.app").rstrip("/")
SCREENSHOTS = Path("/tmp/browser/journey-ingest")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

PATHS = ["/", "/find-a-professional", "/pro/jordon-gumbley"]
PROBE_PUBLIC_PATHS = ["/", "/find-a-professional", "/pro/jordon-gumbley", "/pro/jordon-gumbley/enquire"]


def section(title: str) -> None:
    print(f"\n=== {title} ===")


def dump(label: str, value) -> None:
    print(f"[{label}] {json.dumps(value, indent=2, sort_keys=True, default=str)}")


def psql(sql: str) -> str:
    r = subprocess.run(
        ["psql", "-At", "-F", "|", "-c", sql],
        capture_output=True, text=True, check=True,
    )
    return r.stdout.strip()


async def run() -> int:
    # Baseline snapshot.
    baseline_diag = psql(
        "SELECT COALESCE(MAX(created_at)::text,'1970-01-01') FROM public.proxy_ingest_diagnostics"
    )
    baseline_jour = int(psql("SELECT COUNT(*) FROM public.visitor_journeys") or "0")
    print(f"[baseline] diag_max={baseline_diag} journeys={baseline_jour}")

    proxy_hits: list[dict] = []
    posthog_hits: list[dict] = []
    console_errors: list[str] = []
    console_warnings: list[str] = []
    request_failures: list[dict] = []
    banner_found = False
    accept_clicked = False
    debug_snapshots: dict[str, object] = {}

    async def browser_probe(page, label: str):
        value = await page.evaluate(
            """
            async () => {
              const cookie = document.cookie.split('; ').find((row) => row.startsWith('reps.consent.v1=')) || null;
              const consentRaw = cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
              let consentParsed = null;
              try { consentParsed = consentRaw ? JSON.parse(consentRaw) : null; } catch {}
              const nav = navigator;
              const dbg = typeof window.__repsAnalyticsDebug === 'function'
                ? window.__repsAnalyticsDebug()
                : null;
              let initPromiseResolved = null;
              if (window.__repsPhInitPromise) {
                try {
                  const result = await Promise.race([
                    window.__repsPhInitPromise.then((v) => ({ resolved: true, value: !!v })).catch((e) => ({ resolved: false, error: String(e && e.message || e) })),
                    new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 1500)),
                  ]);
                  initPromiseResolved = result;
                } catch (e) {
                  initPromiseResolved = { resolved: false, error: String(e && e.message || e) };
                }
              }
              return {
                url: location.href,
                pathname: location.pathname,
                consentCookie: consentRaw,
                consentParsed,
                doNotTrack: nav.doNotTrack ?? null,
                windowDoNotTrack: window.doNotTrack ?? null,
                globalPrivacyControl: nav.globalPrivacyControl === true,
                posthogObjectExists: !!window.posthog || !!window.__repsPh,
                posthogLoaded: window.__repsPhReady === true,
                repsPhExists: !!window.__repsPh,
                repsPhInitPromiseExists: !!window.__repsPhInitPromise,
                repsPhInitPromiseState: window.__repsPhInitPromiseState ?? null,
                repsPhInitPromiseResolved: initPromiseResolved,
                repsPhQueueLength: Array.isArray(window.__repsPhQueue) ? window.__repsPhQueue.length : null,
                lastCaptureAttempt: window.__repsAnalyticsLastCaptureAttempt ?? null,
                lastCaptureError: window.__repsAnalyticsLastCaptureError ?? null,
                analyticsDebug: dbg,
              };
            }
            """
        )
        debug_snapshots[label] = value
        dump(label, value)
        return value

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0 Safari/537.36 QA-journey-ingest"
            ),
        )
        page = await context.new_page()

        def on_request(req):
            if "/api/public/_a/" in req.url:
                body = req.post_data or ""
                proxy_hits.append({
                    "url": req.url,
                    "method": req.method,
                    "content_type": req.headers.get("content-type"),
                    "body_shape": {
                        "length": len(body),
                        "starts_with_data": body.startswith("data="),
                        "starts_with_json": body.startswith("{") or body.startswith("["),
                    },
                })
            if "posthog" in req.url.lower():
                posthog_hits.append({"phase": "request", "url": req.url, "method": req.method})

        page.on("request", on_request)
        page.on("response", lambda res: (
            proxy_hits.append({"phase": "response", "url": res.url, "status": res.status})
            if "/api/public/_a/" in res.url else None,
            posthog_hits.append({"phase": "response", "url": res.url, "status": res.status})
            if "posthog" in res.url.lower() else None,
        ))
        page.on("requestfailed", lambda req: request_failures.append({
            "url": req.url,
            "method": req.method,
            "failure": req.failure if req.failure else None,
        }))
        page.on("console", lambda msg: (
            console_errors.append(msg.text) if msg.type == "error" else
            console_warnings.append(msg.text) if msg.type == "warning" else None
        ))

        # 1. Land on home and accept cookies.
        await page.goto(f"{BASE_URL}{PATHS[0]}", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        await browser_probe(page, "before_accept")
        try:
            btn = page.get_by_role("button", name="Accept all")
            if await btn.count() == 0:
                btn = page.get_by_role("button", name="Accept")
            banner_found = await btn.count() > 0
            await btn.first.click(timeout=3000)
            accept_clicked = True
            print("[cookies] accepted")
        except Exception as e:
            print(f"[cookies] no banner click ({e.__class__.__name__})")
        await page.wait_for_timeout(1500)
        await browser_probe(page, "after_accept")
        await page.screenshot(path=str(SCREENSHOTS / "1_home.png"))

        # 2. Visit remaining paths.
        for i, path in enumerate(PATHS[1:], start=2):
            await page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            await browser_probe(page, f"after_visit_{path}")
            await page.screenshot(path=str(SCREENSHOTS / f"{i}_{path.strip('/').replace('/','_') or 'root'}.png"))
            print(f"[visit] {path}")

        # 3. Flush beacons.
        await page.wait_for_timeout(4000)
        await browser_probe(page, "final")
        await context.close()
        await browser.close()

    section("BROWSER DIAGNOSTICS")
    print(f"page URL: {debug_snapshots.get('final', {}).get('url') if isinstance(debug_snapshots.get('final'), dict) else 'unknown'}")
    print(f"banner_found={banner_found} accept_clicked={accept_clicked}")
    print(f"DNT={debug_snapshots.get('before_accept', {}).get('doNotTrack') if isinstance(debug_snapshots.get('before_accept'), dict) else None}")
    print(f"GPC={debug_snapshots.get('before_accept', {}).get('globalPrivacyControl') if isinstance(debug_snapshots.get('before_accept'), dict) else None}")
    print(f"[proxy] {len([h for h in proxy_hits if h.get('phase') != 'response'])} _a requests captured")
    dump("network._a", proxy_hits)
    dump("network.posthog", posthog_hits)
    dump("request_failures", request_failures)
    dump("console.errors", console_errors)
    dump("console.warnings", console_warnings)

    section("PUBLIC SURFACE PROBE")
    # Best effort source-independent check. The in-page debug object is the source
    # of truth once deployed; until then this mirrors the current guard contract.
    for probe_path in PROBE_PUBLIC_PATHS:
        blocked = any(probe_path.startswith(prefix) for prefix in ["/admin", "/dashboard", "/portal", "/auth", "/lovable/", "/api/"])
        print(f"{probe_path}: {'FAIL' if blocked else 'PASS'}")

    # 4. Poll for diagnostics/journey landing (up to ~20s).
    new_diag = None
    ok_row = None
    new_jour = baseline_jour
    for attempt in range(10):
        time.sleep(2)
        latest = psql(
            "SELECT created_at::text, result, journey_result, extracted_path, first_event "
            "FROM public.proxy_ingest_diagnostics "
            f"WHERE created_at > '{baseline_diag}' "
            "ORDER BY created_at DESC LIMIT 20"
        )
        new_diag = [l.split("|") for l in latest.splitlines() if l]
        ok_row = next((r for r in new_diag if len(r) >= 3 and r[2] == "ok"), None)
        new_jour = int(psql("SELECT COUNT(*) FROM public.visitor_journeys") or "0")
        print(f"[poll {attempt+1}] new_diag={len(new_diag)} ok_rows={sum(1 for r in new_diag if r[2]=='ok')} journeys_delta={new_jour - baseline_jour}")
        if ok_row and new_jour > baseline_jour:
            break

    section("NEW DIAG ROWS")
    for r in new_diag or []:
        print(" | ".join(r))
    section(f"JOURNEYS: {baseline_jour} -> {new_jour} (Δ {new_jour - baseline_jour})")

    after_accept = debug_snapshots.get("after_accept") if isinstance(debug_snapshots.get("after_accept"), dict) else {}
    final = debug_snapshots.get("final") if isinstance(debug_snapshots.get("final"), dict) else {}
    consent = after_accept.get("consentParsed") if isinstance(after_accept, dict) else None
    final_debug = final.get("analyticsDebug") if isinstance(final, dict) else None
    final_posthog = final_debug.get("posthog") if isinstance(final_debug, dict) else {}
    final_surface = final_debug.get("surface") if isinstance(final_debug, dict) else {}
    final_privacy = final_debug.get("privacy") if isinstance(final_debug, dict) else {}

    failures: list[str] = []
    if not isinstance(consent, dict) or consent.get("analytics") is not True:
        failures.append("CONSENT_NOT_SET")
    if after_accept.get("doNotTrack") == "1" or after_accept.get("windowDoNotTrack") == "1" or after_accept.get("globalPrivacyControl") is True:
        failures.append("GPC_DNT_BLOCKED")
    if isinstance(final_surface, dict) and final_surface.get("isPublicSurface") is False:
        failures.append("PUBLIC_SURFACE_BLOCKED")
    if isinstance(final_posthog, dict) and final_posthog.get("configured") is False:
        failures.append("POSTHOG_ENV_MISSING")
    if not final.get("repsPhInitPromiseExists") and not final.get("repsPhExists"):
        failures.append("POSTHOG_INIT_NOT_CALLED")
    if final.get("repsPhInitPromiseExists") and final.get("posthogLoaded") is not True:
        failures.append("POSTHOG_LOADED_NOT_FIRED")
    if final.get("repsPhQueueLength") not in (None, 0) and final.get("posthogLoaded") is True:
        failures.append("QUEUE_NOT_FLUSHED")
    if not final.get("lastCaptureAttempt"):
        failures.append("CAPTURE_NOT_CALLED")
    request_records = [h for h in proxy_hits if h.get("phase") != "response"]
    proxy_responses = [h for h in proxy_hits if h.get("phase") == "response"]
    if not request_records:
        failures.append("NETWORK_NOT_SENT")
    non_200 = [h for h in proxy_responses if int(h.get("status", 0)) >= 300]
    if non_200:
        failures.append("PROXY_NON_200")
    if request_records and not new_diag:
        failures.append("PROXY_OK_BUT_NO_DIAGNOSTIC")
    if new_diag and not ok_row:
        failures.append("DIAGNOSTIC_OK_BUT_NO_JOURNEY")
    if ok_row and new_jour <= baseline_jour:
        failures.append("DIAGNOSTIC_OK_BUT_NO_JOURNEY")

    # Deduplicate while preserving order.
    failures = list(dict.fromkeys(failures))

    section("FINAL DIAGNOSTIC VERDICT")
    if failures:
        for f in failures:
            print(f"FAIL_REASON={f}")
    else:
        print("PASS: journey ingest verified end-to-end.")

    if failures:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))
