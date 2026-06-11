## Diagnosis

The toggle logic works in a fresh preview: selecting **Monthly** changes Pro to £59/month and Studio to £149/month. The affected preview recorded a failed client-module load, which can leave the page visually rendered but prevent React interactions from hydrating.

## Plan

1. Harden the existing shadcn `ToggleGroup` so each Monthly/Annual item explicitly selects its billing period while retaining the controlled group behavior and current styling.
2. Keep Verified annual-only and preserve the restored Pro and Studio monthly/annual prices.
3. Refresh the preview runtime to clear the stale client module.
4. Verify both directions in-browser: Annual → Monthly and Monthly → Annual, confirming both Pro and Studio prices update each time.