# Cabin → Sanctuary Template Redesign

## Problem

The cabin template's hero relies on a landscape fireplace video that doesn't work on mobile:
- iOS autoplay fails in Low Power Mode / Data Saver
- Landscape video crammed into portrait screens looks bad regardless of technique (blur+inset, image card, zoom)
- Multiple iterations have failed — the asset fundamentally mismatches the device
- Client wants **bright, blue, inviting** — the dark brown cabin aesthetic is wrong for the brand

## Solution

Replace the cabin template with **"The Sanctuary"** — a photography-based template featuring a bright, airy interior scene flooded with natural light.

## Concept

**Scene:** A sunlit interior space — conservatory, reading room with arched windows, or open courtyard. Blue sky visible through large windows. Warm natural materials (wood, linen). Inviting, calm, contemplative.

**Metaphor:** "Discovering your *internal* gift" in an *interior* space filled with light.

**Differentiation:**

| | Cloud | Book | Sanctuary |
|---|---|---|---|
| Medium | 3D interactive | Scroll-driven artifact | Photography-based |
| Mood | Dramatic, ascending | Tactile, intimate | Bright, inviting |
| Orientation | Up (sky) | Down (desk) | Inward (room) |
| Tech | Three.js | GSAP page-flip | Image + GSAP scroll |

## Visual Identity

**Color scheme (light theme — inverted from cabin):**
- Background: soft warm white (#f5f2ed) / pale cream
- Text: dark navy/slate (#1a2a3a range)
- Accents: gold (#d4a853) — consistent across all templates
- The hero image itself provides blue and warmth

## Layout

Structurally identical to the cabin — the change is visual, not architectural.

### Hero (full viewport)
- Background image fills viewport via `object-fit: cover` on a fixed `<img>`
- Light gradient overlay for text readability (subtle, not heavy)
- Title + tagline centered (Fraunces/Outfit, dark text)
- Scroll indicator at bottom

### Mobile
- Same image, same layout. Interior scenes have natural vertical composition (floor → walls → windows → ceiling) that fills portrait without cropping issues.
- No special mobile treatment beyond responsive font sizing.
- No video. No fallback chain. No media queries for asset juggling.

### Desktop
- Same image, `object-fit: cover` crops slightly — interior scenes handle this gracefully.
- Identical layout, just wider.

### Cards section
- Light background (#f5f2ed) instead of dark overlay
- White cards with subtle shadow, gold accent border on hover
- Same 5 nav cards, same GSAP scroll-reveal animations

### Footer + companion button
- Same structure, colors adjusted for light theme

## Technical Scope

### Files modified
- `cabin/index.html` — Full CSS rewrite (dark → light theme) + hero HTML simplification
- `js/cabin-home.js` — Remove `setupVideo()`, keep all GSAP/Lenis animation code

### New asset
- One hero photo (JPG, ~200-300KB) in `assets/` — user provides (AI-generated or stock)

### Deleted
- `setupVideo()` function
- All video-related CSS (`.hero-video`, `.playing`, opacity transition)
- All mobile media queries for video/image handling
- References to `cabin-fire.mp4`, `cabin-blur.jpg` in code (files can stay in assets)

### Unchanged
- `index.html` (chooser) — update thumbnail + card text in a follow-up
- `vite.config.js` — cabin entry point path unchanged
- All other templates
- GSAP SplitText hero animation (just color value changes)
- GSAP ScrollTrigger card reveals (unchanged)
- Lenis smooth scroll (unchanged)

### No new dependencies. No new build config. No new JS patterns.

## Asset Requirements

The hero image is the single most important element. Requirements:
- **Bright interior** with visible blue sky through windows
- **Works in both portrait and landscape** — interior scenes with vertical elements (walls, windows, doorways) naturally do
- **Resolution:** At least 1920px wide, ideally 2000x3000+ for portrait coverage
- **Format:** JPG, target ~200-300KB after compression
- **Mood:** Warm, inviting, contemplative, not sterile or corporate

## Risk Assessment

- **Low risk:** Code changes are a simplification (removing complexity, not adding it)
- **Medium risk:** Hero image quality — this makes or breaks the template
- **No risk:** Mobile layout — one image with `object-fit: cover` is the most reliable pattern in web development
