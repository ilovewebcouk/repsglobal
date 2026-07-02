# E2E: journey ingest

`journey-ingest.py` runs a fresh headless Chromium against the live site,
accepts cookies, visits the public rail (`/`, `/find-a-professional`,
`/pro/jordon-gumbley`), then asserts:

1. A fresh `proxy_ingest_diagnostics` row landed with `journey_result='ok'`.
2. `visitor_journeys` row count increased.

## Run

```bash
BASE_URL=https://repsglobal.lovable.app python3 tests/e2e/journey-ingest.py
```

Defaults to the published URL. Override `BASE_URL` for preview builds.
Requires the sandbox's default `PG*` env vars for psql access.

Exit code `0` = pass, `1` = fail (see stdout for the diff and which
assertion tripped). Screenshots land in `/tmp/browser/journey-ingest/`.
