#!/usr/bin/env python3
"""
End-to-end assertion that the /api/public/_a/* PostHog proxy produces:
  1. A fresh proxy_ingest_diagnostics row with journey_result='ok'
  2. At least one new visitor_journeys row

Runs a fresh incognito Chromium session against BASE_URL (default: the
published Lovable URL), accepts cookies, visits three public pages, waits
for beacon traffic to flush, then diffs Supabase via psql.

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
                proxy_hits.append({"url": req.url, "method": req.method})

        page.on("request", on_request)

        # 1. Land on home and accept cookies.
        await page.goto(f"{BASE_URL}{PATHS[0]}", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        try:
            btn = page.get_by_role("button", name="Accept all")
            if await btn.count() == 0:
                btn = page.get_by_role("button", name="Accept")
            await btn.first.click(timeout=3000)
            print("[cookies] accepted")
        except Exception as e:
            print(f"[cookies] no banner click ({e.__class__.__name__})")
        await page.screenshot(path=str(SCREENSHOTS / "1_home.png"))

        # 2. Visit remaining paths.
        for i, path in enumerate(PATHS[1:], start=2):
            await page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            await page.screenshot(path=str(SCREENSHOTS / f"{i}_{path.strip('/').replace('/','_') or 'root'}.png"))
            print(f"[visit] {path}")

        # 3. Flush beacons.
        await page.wait_for_timeout(4000)
        await context.close()
        await browser.close()

    print(f"[proxy] {len(proxy_hits)} beacon hits captured")

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

    print("\n=== NEW DIAG ROWS ===")
    for r in new_diag or []:
        print(" | ".join(r))
    print(f"\n=== JOURNEYS: {baseline_jour} -> {new_jour} (Δ {new_jour - baseline_jour}) ===")

    failures = []
    if not new_diag:
        failures.append("no new proxy_ingest_diagnostics rows landed")
    if not ok_row:
        failures.append("no diagnostics row had journey_result='ok'")
    if new_jour <= baseline_jour:
        failures.append("visitor_journeys row count did not increase")

    if failures:
        print("\nFAIL:")
        for f in failures:
            print(f"  - {f}")
        return 1

    print("\nPASS: journey ingest verified end-to-end.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))
