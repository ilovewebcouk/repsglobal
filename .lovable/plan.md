## Swap laptop screen to a REPs professional dashboard

Single asset replacement. No layout/CSS changes needed.

### What I see in the mockup (zoomed)
The laptop screen shows a fitness-professional dashboard:
- **Top-left**: REPs orange logo/wordmark in a dark sidebar header
- **Left sidebar**: dark vertical nav with small icons
- **Top row**: three small KPI tiles ("£2,480", "142 clients", "87%" etc.)
- **Center**: a large dark panel titled "Weekly Progress" with an orange line chart (rising curve)
- **Right column**: stacked smaller widget cards
- All dark UI with bright orange accents — clearly REPs branded, not generic

### Change
1. **Edit `src/assets/signup-hero-bg.jpg` in place** using `imagegen--edit_image` with the current image as the input. Prompt the model to replace what's on the laptop screen with a REPs fitness professional dashboard matching the description above — explicitly:
   - Orange "REPs" wordmark logo in the top-left sidebar header
   - Dark sidebar nav on the left
   - Three small KPI tiles along the top (revenue, clients, retention)
   - Large "Weekly Progress" chart panel with bright orange line graph in the center
   - Stack of smaller widget cards on the right
   - Keep the rest of the photo identical: same dark desk, same warm orange spill lighting, same laptop angle, same depth of field

2. **No code edits** — the file path stays `src/assets/signup-hero-bg.jpg`, so the existing import in `src/routes/signup.tsx` picks the new image up automatically.

### Verification
After the edit, view the new asset, then screenshot `/signup` at 1469px and confirm the laptop now reads as a REPs branded dashboard (logo visible, orange chart prominent) and the overall hero ambience still matches the mockup.

### Out of scope
- No CSS, positioning, opacity, or overlay changes — the user said it's "very, very good and almost perfect."
- `/login` not touched.
