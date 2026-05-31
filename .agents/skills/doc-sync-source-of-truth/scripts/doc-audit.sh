#!/usr/bin/env bash
# Doc-sync audit for REPs.
# Scans documentation paths for deprecated values defined in the
# doc-sync-source-of-truth skill replacement matrix.
# Exits 0 when clean, 1 when any violation is found.

set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

PATHS=(docs .lovable/plan.md)
# Also include root-level markdown files (README, CHANGELOG, etc.)
for f in *.md; do [ -f "$f" ] && PATHS+=("$f"); done

# Filter to only existing paths
EXISTING=()
for p in "${PATHS[@]}"; do [ -e "$p" ] && EXISTING+=("$p"); done

if [ ${#EXISTING[@]} -eq 0 ]; then
  echo "No documentation paths found."
  exit 0
fi

fail=0
section() { echo; echo "── $1 ──"; }

# Lines describing the rules themselves are not violations.
# Skip any hit whose line contains one of these guidance markers.
GUIDANCE_RE='[Ff]orbidden|[Nn]ever use|[Mm]ust not|[Dd]o not use|[Rr]etired|[Dd]eprecated|[Aa]rchived|[Rr]eplace[ds]?\b|→|former|previously|rejected|legacy|migration'

check() {
  local label="$1"; shift
  local pattern="$1"; shift
  local hits
  hits=$(rg -n --no-heading -e "$pattern" "${EXISTING[@]}" "$@" 2>/dev/null \
         | rg -v -e "$GUIDANCE_RE" || true)
  if [ -n "$hits" ]; then
    section "$label"
    echo "$hits"
    fail=1
  fi
}

check "Legacy brand orange hex (#F28C38 / #D87322)"           '#F28C38|#D87322' -i
check "Banned radius px (14/20/28/32)"                         'rounded-\[(14|20|28|32)px\]|\b(14|20|28|32)px\s+radius|radius:\s*(14|20|28|32)px'
check "Banned Tailwind radius classes"                         '\brounded-(xl|2xl|3xl)\b'
check "Archived mock-up filenames"                             '\b(home|search|profile|dashboard|signup|admin)_v1\.png\b'
check "6-screen collage / 16:9 crop references"                'collage|16:9 crop|16x9 crop'
check "Stale product name 'REPs UK'"                           '\bREPs UK\b'
check "Gold/yellow rating stars (should be brand orange)"      'gold star|yellow star|stars?.*gold|stars?.*yellow' -i
check "Button shadow guidance (buttons must be flat)"          'button.*shadow|shadow.*button' -i

echo
if [ $fail -ne 0 ]; then
  echo "Doc-sync audit: FAIL — fix the items above, then re-run."
  exit 1
fi
echo "Doc-sync audit: PASS — docs match the source of truth."
