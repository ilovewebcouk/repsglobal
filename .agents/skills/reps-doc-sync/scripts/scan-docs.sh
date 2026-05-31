#!/usr/bin/env bash
# REPs doc-sync scanner. Markdown-only.
# Reports violations of the locked source of truth in docs/, .lovable/, and root README.
# Exits 0 on clean, 1 on any violation.

set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

TARGETS=()
for p in docs .lovable README.md; do
  [ -e "$p" ] && TARGETS+=("$p")
done
[ ${#TARGETS[@]} -eq 0 ] && { echo "No docs found."; exit 0; }

fail=0
check() {
  local label="$1"; shift
  local hits
  hits=$(rg -n --no-heading -g '*.md' -g '*.mdx' "$@" "${TARGETS[@]}" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "✗ $label"
    echo "$hits" | sed 's/^/    /'
    fail=1
  else
    echo "✓ $label"
  fi
}

check "Legacy brand orange hex (#F28C38 / #D87322)" -i -e '#F28C38' -e '#D87322'
check "Banned radius px values (14/20/28/32px)" -e 'rounded-\[(14|20|28|32)px\]' -e '\b(14|20|28|32)px\b'
check "Banned Tailwind radius classes (rounded-xl/2xl/3xl)" -e '\brounded-(xl|2xl|3xl)\b'
check "Archived 16:9 mock-up filenames" -e '(^|[^_])\b(home|search|profile|dashboard|signup|admin)_v1\.png\b'
check "Rejected 6-screen collage references" -i -e 'collage|6-screen mock'
check "Gold / yellow rating stars" -i -e 'gold star' -e 'yellow star' -e 'star.*#FFD' -e 'star.*gold'
check "'REPs UK' outside legacy/migration context" -e 'REPs UK'

echo
if [ $fail -ne 0 ]; then
  echo "REPs doc sync: FAIL — apply replacements from references/replacements.md"
  exit 1
fi
echo "REPs doc sync: PASS"
