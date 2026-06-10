# Rebuild `/about` hero — two-person, between-sets documentary moment

## Diagnosis (why the current one fails)

- Light too even — no single hard key, decorative dust shaft is not the actual light source
- Composition is stock-fitness cliché (spotter behind squatter)
- Subjects read posed, not mid-life
- Background does too much narrating (plates + rig + brick + trusses + windows + chalk all compete)
- Floor/plate rendering reads as AI: rubber-prop plates, plastic concrete sheen, off foot placement

## Direction (locked)

Two-person, **between-sets** documentary moment. Not action — recovery. Not posed — overheard.

### Scene

- Inside a quiet converted warehouse, mid-morning, **one tall window back-left** is the only light source
- Coach (male, early-30s, charcoal heather REPS tee, blank left chest area for logo composite) is **crouched on one knee beside a barbell on the floor**, half-turned up to his client, demonstrating something with his hands — palm flat, fingers tracing a bar-path or hip hinge in the air
- Client (female, charcoal heather tee) is **standing relaxed, weight on one hip, towel draped over her shoulder, water bottle in hand**, listening — slight nod, not smiling for the camera
- A single Olympic barbell with two plates rests on the floor between them; one chalk-ghost handprint on the bar collar
- Everything else dropped: no rig, no rack stack, no second piece of equipment in frame

### Light (single source, hard)

- One tall steel-framed window back-left, low warm morning sun raking through at ~25° — bright hot spot on the floor, hard rim on coach's back and client's shoulder, **deep architectural shadow on the right two-thirds of the frame**
- Dust particles **only where the light beam actually is** (not floating everywhere)
- No fill light. Faces partly in shadow — editorial, not commercial

### Composition

- 16:9, **subjects in centre-right third**, kneeling coach foreground-low, client standing mid-ground slightly behind
- Wide negative space upper-left for headline + CTAs (window light spills there, type sits in the brightness)
- Lens reads ~35mm — wide enough for context, tight enough for intimacy
- Slight low angle (camera at coach's eye level looking up at client) to anchor the kneel and add quiet weight

### Finish (matches Independence + Heritage exactly)

- Muted film palette, deep blacks, warm amber **only** on rim + window-lit floor patch
- Hard shadow side stays nearly black (don't lift in post)
- Shallow DoF — sharp on coach's hands and client's face, soft on background brick
- Soft 35mm anamorphic grain, subtle halation on the window edge
- Photo-realistic — no overlays, no extra logos, no text

### Wardrobe + logo

- Both in charcoal heather REPS performance tees, technical joggers, trainers
- Composite real `src/assets/brand/logo.svg` as small left-chest white embroidery on the coach, per `mem://design/trainer-imagery`

## What this fixes vs the current hero

| Failure | Fix |
| --- | --- |
| Even soft light | Single hard window key + deep shadow opposite |
| Stock spotter pose | Recovery moment, kneeling demo, not action |
| Posed/frozen | Between-sets body language (weight on hip, towel, listening) |
| Background noise | Drop rig/rack/plates pile — just one bar, one window, one brick wall |
| Rubber plates / off floor | Fewer rendered objects → fewer AI tells; chalk handprint adds physical evidence |
| Stock-photo register | Documentary "overheard" framing — quiet, not heroic |

## Execution

1. Use `imagegen--edit_image` with `/tmp/about-independence.jpg` as the single style reference (it's already on disk from earlier this session). Target `/tmp/about-hero-base4.jpg`, 16:9. Prompt = the scene above with **explicit blank left chest** on the coach.
2. Second pass — composite `/tmp/reps-logo.png` (already on disk) as small white embroidery on coach's left chest. Save `/tmp/about-hero-v9.jpg`.
3. Inspect crop at displayed size with `image_tools--zoom_image` — verify single-light direction, no rubber-plate tells, embroidery sits on fabric.
4. If pass-1 base shows any of the previous AI tells (even light, busy background, multiple plates piles), regenerate the base before moving to logo pass.
5. `lovable-assets create` → overwrite `src/assets/about/about-hero.jpg.asset.json`.
6. Update hero `alt` in `src/routes/about.tsx` (line 135) to: "A REPs-registered coach coaching a client between sets in a warehouse gym."
7. QA on `/about` vs Independence + Heritage at full bleed — all three should read as one photographer's series.

## Out of scope

- No layout, copy, section order, or other image changes
- No route/component edits beyond the hero `alt`
- No memory updates

## Hard rejects on regen

Reject and re-prompt if the base shows: spotter-behind-squatter, multiple light sources, dust suspended outside the beam, both subjects facing camera, smiling, rack/rig in frame, more than one barbell, any text/graphics anywhere.
