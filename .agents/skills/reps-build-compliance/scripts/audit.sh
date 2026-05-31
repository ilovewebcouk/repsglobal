#!/usr/bin/env bash
# REPs build compliance audit.
# Scans src/ for violations of the locked design system.
# Exits 0 on clean, 1 on any violation.

set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

fail=0
report() { echo "✗ $1"; fail=1; }
ok()     { echo "✓ $1"; }

SRC="src"
COMPONENTS_GLOB="$SRC --glob !src/styles.css --glob !src/mockups/**"

# 1. Banned legacy orange hex (anywhere in src)
if rg -n --no-heading -i '#F28C38|#D87322' $SRC 2>/dev/null; then
  report "Legacy brand orange hex (#F28C38 / #D87322) found — replace with --brand-orange token."
else
  ok "No legacy orange hex."
fi

# 2. Hardcoded orange hex in components (allowed only in styles.css)
if rg -n --no-heading -i '#FF7A00|#E96F00|#CC6200' $SRC --glob '!src/styles.css' 2>/dev/null; then
  report "Hardcoded brand orange hex in components — use semantic tokens (bg-brand-orange, etc.)."
else
  ok "No hardcoded brand orange in components."
fi

# 3. Banned radius px values (in components, not styles.css)
if rg -n --no-heading 'rounded-\[(14|20|28|32)px\]' $SRC --glob '!src/styles.css' 2>/dev/null; then
  report "Banned radius value (14/20/28/32px) — use 6/8/10/12/16/18/22/24/999 only."
else
  ok "No banned radius px values."
fi

# 4. Banned Tailwind radius classes
if rg -n --no-heading '\brounded-(xl|2xl|3xl)\b' $SRC --glob '!src/styles.css' 2>/dev/null; then
  report "Banned Tailwind radius class (rounded-xl/2xl/3xl) — use explicit rounded-[Npx] from the 9-step scale."
else
  ok "No banned Tailwind radius classes."
fi

# 5. Archived mock-up filenames referenced as live assets
if rg -n --no-heading -e 'home_v1\.png' -e 'search_v1\.png' -e 'profile_v1\.png' -e 'dashboard_v1\.png' -e 'signup_v1\.png' -e 'admin_v1\.png' -e 'collage' $SRC 2>/dev/null | rg -v 'reps_fullpage_'; then
  report "Archived mock-up filename referenced — only reps_fullpage_*_v1.png are allowed."
else
  ok "No archived mock-up references."
fi

# 6. Button shadows — Button component files containing shadow-* (excluding shadow-none)
btn_hits=$(rg -n --no-heading -g 'src/components/ui/button*' -g 'src/components/**/Button*' -g 'src/components/**/*[Bb]utton*.tsx' 'shadow-(?!none\b)[a-z0-9-]+' $SRC 2>/dev/null || true)
if [ -n "$btn_hits" ]; then
  echo "$btn_hits"
  report "Button shadow detected — buttons must be flat (shadow-none only)."
else
  ok "Buttons are flat."
fi

# 7. Confirm all 6 locked mock-ups exist
missing=0
for f in home signup_login directory_search_results professional_profile professional_dashboard admin_dashboard; do
  if [ ! -f "src/mockups/reps_fullpage_${f}_v1.png" ]; then
    report "Missing locked mock-up: reps_fullpage_${f}_v1.png"
    missing=1
  fi
done
[ $missing -eq 0 ] && ok "All 6 locked mock-ups present."

echo
if [ $fail -ne 0 ]; then
  echo "REPs compliance: FAIL"
  exit 1
fi
echo "REPs compliance: PASS"
