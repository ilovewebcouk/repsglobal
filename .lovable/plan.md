
## What Ascend ExerciseDB v2 gives us

11,000+ exercises via RapidAPI. Each exercise returns:
- `name`, `bodyParts`, `targetMuscles`, `secondaryMuscles`, `equipments`, `exerciseType`
- 4 image resolutions (360/480/720/1080p, webp)
- MP4 `videoUrl` demo
- `overview`, `instructions[]`, `exerciseTips[]`, `variations[]`, `relatedExerciseIds[]`

Auth: two headers — `X-RapidAPI-Key` (our key) + `X-RapidAPI-Host: edb-with-videos-and-images-by-ascendapi.p.rapidapi.com`.

Free tier = watermarked video/images. Paid tier = clean. We'll start on whichever tier you subscribe to.

## What the user has to do (one-off)

1. Subscribe at https://rapidapi.com/ascendapi/api/edb-with-videos-and-images-by-ascendapi (free tier is fine for now — videos will have an Ascend watermark until upgraded).
2. Copy the `X-RapidAPI-Key` from the RapidAPI dashboard.
3. I'll then prompt for it via `add_secret` and store it as `RAPIDAPI_EXERCISEDB_KEY` (server-only, never exposed to the browser).

## What I'll build (this turn)

### 1. Server boundary — never expose the RapidAPI key

`src/lib/exercisedb.server.ts` — thin fetch wrapper that injects both headers and base URL.

`src/lib/exercisedb.functions.ts` — two `createServerFn` endpoints:
- `searchExercises({ query?, bodyPart?, equipment?, limit })` → list view (name + 480p image + bodyPart + equipment)
- `getExercise({ exerciseId })` → full record including `videoUrl`

Both server fns add a 24h in-memory cache keyed by params. The CDN media URLs are public and safe to render directly in the browser — only the JSON metadata goes through our server.

### 2. Wire the Coaching page mock to real data

On `/features/coaching` the `ProgrammeMock` + `ExerciseLibraryMock` currently show hard-coded exercise names. I'll:
- Add a route loader that calls `searchExercises({ limit: 12 })` for a curated set (Bench Press, Squat, Deadlift, Pull-up, Romanian Deadlift, Overhead Press, Lunge, Plank, Bent-Over Row, Hip Thrust, Bulgarian Split Squat, Lat Pulldown).
- Render their real 480p webp thumbnails + names in the library grid.
- On click, swap the mock's right-hand "preview" pane to the real MP4 `videoUrl` in a muted, looped `<video>` (autoplay, `playsInline`, `loop`, `muted`). This makes the "600+ exercises with video demos" claim provably real on the marketing page itself.
- Add a small "Powered by ExerciseDB" attribution line under the mock — keeps us honest, no brand-logo grid (per banned-orgs rule).

If the API key is missing or the call fails, the mock falls back to the current static state (no marketing-page breakage).

### 3. Copy + counts

- Change "600+ exercises" → "10,000+ exercise demos" (we now have a real 11k library to back it).
- Keep "Pros can upload their own clips" as a roadmap line — it's the differentiator vs Trainerize charging extra.

## What I'm NOT building yet (separate plan)

- Real Programme Builder UI inside the authenticated dashboard (exercise picker, set/rep editor, drag-reorder, assign to client, mobile client view of the video). That's a 2–3 day product build, not a marketing-page fix.
- Mirroring the catalogue into our DB. Until we have paying Pros, hitting the API on demand with caching is enough.
- Paid-tier upgrade — start free + watermarked, upgrade when we ship the dashboard feature.

## Failure modes I've planned for

- **Missing key** → server fn throws a typed "not configured" error; coaching page renders the static fallback; no white screen.
- **Rate limit (RapidAPI free tier)** → 24h cache means a single curated set is ~12 requests on first deploy then 0; well under any free-tier ceiling.
- **Watermark on free tier** → acceptable for now; documented above.
- **CDN video blocked / slow** → `<video>` has a `poster` from the 720p image so the still always renders.

## Order of operations

1. You confirm the plan.
2. I prompt for `RAPIDAPI_EXERCISEDB_KEY` via `add_secret` (you paste it from RapidAPI).
3. I build the server fns + wire the Coaching mock + update copy.
4. We verify a real Bench Press video plays inside the mock on `/features/coaching`.

Shall I proceed?
