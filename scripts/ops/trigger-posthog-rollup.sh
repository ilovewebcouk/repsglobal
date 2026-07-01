#!/usr/bin/env bash
# Manual PostHog → Supabase rollup for today (or a specific date).
# Usage:  ./trigger-rollup.sh                     # today (UTC)
#         ./trigger-rollup.sh 2026-07-01          # specific date
#
# Requires env:
#   PUBLIC_URL              e.g. https://repsuk.org  (or https://project--<id>.lovable.app)
#   SUPABASE_PUBLISHABLE_KEY (the same key already in the app)
set -euo pipefail
DATE="${1:-$(date -u +%F)}"
: "${PUBLIC_URL:?PUBLIC_URL not set}"
: "${SUPABASE_PUBLISHABLE_KEY:?SUPABASE_PUBLISHABLE_KEY not set}"
echo "Triggering rollup for $DATE …"
curl -sS -X POST "$PUBLIC_URL/api/public/cron/pull-posthog-daily" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "content-type: application/json" \
  -d "{\"date\":\"$DATE\"}" | jq .
