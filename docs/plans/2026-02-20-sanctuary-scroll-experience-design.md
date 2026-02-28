# Sanctuary Scroll Experience — Design Document

**Date:** 2026-02-20
**Updated:** 2026-02-20
**Status:** Approved — asset generation in progress
**Branch:** `feature/reimagine-templates`

## Overview

Redesign the Sanctuary template from a static photo + scroll-to-cards layout into a cinematic scroll-driven experience. An AI-generated video of a treasure chest opening in the conservatory scene is extracted into frames and played back via canvas as the user scrolls. The chest opens further and the camera zooms in until gold light fills the screen, then fades to reveal the subpage selection cards.

## The Experience

### Hero State (before scroll)
- Full-viewport canvas showing frame 0: the sanctuary conservatory with a treasure chest on the table in front of the chair, slightly open, soft gold glow emanating from inside
- "Welcome to the Gift Site" title with frosted glass backdrop (same as current)
- Scroll indicator at bottom

### Scroll Scrub (continuous, reversible)
- 1:1 scroll-to-frame mapping via GSAP ScrollTrigger `scrub: true`
- ~120 desktop frames / ~100 mobile frames extracted from a ~5-8 second AI-generated video
- As user scrolls: chest opens further, camera pushes in, gold glow intensifies
- Title + frosted backdrop fade out within first ~5% of scroll
- Scrolling back up reverses everything naturally (ScrollTrigger scrub)
- Purely visual — no text overlays during the sequence

### Gold Climax
- Final ~10 frames = screen fully filled with gold light
- Visually seamless transition into the card section's gold background

### Card Reveal
- Gold radial gradient background matching final video frame color
- "Explore Your Gift" heading fades in
- 5 subpage cards stagger in (y:60→0, autoAlpha, 0.15s stagger)
- Cards: semi-transparent white on gold, subtle gold border, lift+glow hover
- Same 5 sections: Why We Exist, Discover, The Process, Facilitate, Gift Companion

## Page Structure

```
HERO (100vh, sticky canvas)
  └─ <canvas> with frame 0
  └─ Title + frosted backdrop (absolute, fades on scroll)
  └─ Scroll indicator

SCROLL RUNWAY (~600vh, invisible spacer)
  └─ ScrollTrigger maps scroll position → frame index 0-119
  └─ Canvas stays sticky, draws current frame

CARD SECTION
  └─ Gold radial gradient background
  └─ Heading + 5 nav cards + footer
  └─ ScrollTrigger card reveal animations
```

## Asset Pipeline (Phase 1 — before code)

### Step 1: Generate base image ✅ COMPLETE
Used ChatGPT GPT Image 1.5 to add treasure chest to the existing `sanctuary-desktop.png`.
- Uploaded original conservatory photo, prompted for antique chest on table with gold glow
- **Chosen image:** `assets/OpenAI Playground 2026-02-20 at 17.09.42.png` (chest more closed, subtle glow — better starting point for scroll arc)
- Resolution: 1536x1024 (sufficient — above our 1280x720 target)
- The more-open variant (`17.08.10`) was rejected because it leaves less dynamic range for the opening animation

**Single-image approach:** Only the desktop landscape photo was modified. Mobile uses the same video frames with `object-fit: cover` cropping (chest is centered, stays visible in portrait crop). No separate mobile base image needed.

### Step 2: Generate video — NEXT
Feed the chosen base image into an AI video tool.

**Recommended tool chain:**
- **Kling AI** (free daily credits) — iterate on prompts cheaply
- **Runway Gen-4.5** ($28/mo Pro) — final high-quality generation (best temporal consistency for frame extraction)
- **Google Veo 3.1** — alternative if camera control needs to be more precise

**Video prompt:**
> Slow cinematic push-in camera movement toward the treasure chest on the table. The chest lid gradually opens wider as the camera moves closer. The golden glow from inside the chest intensifies and grows, casting warm light across the table and room. Subtle dust motes float in the sunlight. The conservatory interior remains still and peaceful. The camera continues pushing in until the golden light from the chest fills the entire frame.

Target: 5 seconds at 24-30fps. Image-to-video mode (upload base image as starting frame).

### Step 3: Extract frames
Script (`scripts/extract-frames.mjs`) using ffmpeg:
- Input: video file
- Extracts at ~20fps desktop, ~15fps mobile
- Desktop: 1280x720 WebP (quality 80) → ~120 frames, ~3MB total
- Mobile: 640x360 WebP (quality 75) → ~100 frames, ~1.2MB total
- Output to `public/sanctuary-frames/desktop/` and `mobile/`

### Step 4: Viability check
Standalone test page with canvas + scroll handler to verify scrub feels good before modifying Sanctuary code.

## Technical Implementation

### Frame Loading — Three-Phase Progressive

| Phase | Frames | Trigger | Purpose |
|-------|--------|---------|---------|
| 1 | 0-19 | Page init | Hero visible instantly |
| 2 | 20-59 | After hero animation | Covers first ~40% of scroll |
| 3 | 60-119 | On scroll approach | Chunks of 40, loaded when user within 20 frames of boundary |

If user scrolls faster than loading, hold on last loaded frame (no spinner).

### Frame Specs (updated after research)

| Setting | Desktop | Mobile |
|---------|---------|--------|
| Resolution | 1280x720 | 640x360 |
| Frame count | ~120 (extract at ~20fps) | ~100 (extract at ~15fps) |
| WebP quality | 80 | 75 |
| Per-frame size | ~25-40KB | ~8-12KB |
| Total payload | ~3MB | ~1.2MB |
| Canvas DPR cap | 1.5 | 1.0 |

**Why not 1920x1080?** iOS Safari has a 16.7M pixel canvas limit. 1080p at 2x DPR = 3840x2160 = 8.3M pixels, technically safe but risky. 720p at 1.5x DPR = 1920x1080 actual pixels — safe and performant.

### File Changes

| File | Status | Purpose |
|------|--------|---------|
| `public/sanctuary-frames/desktop/*.webp` | New | ~120 desktop frames (1280x720) |
| `public/sanctuary-frames/mobile/*.webp` | New | ~100 mobile frames (640x360) |
| `scripts/extract-frames.mjs` | New | ffmpeg: video → numbered WebP frames |
| `js/frame-scroller.js` | New | Canvas + scroll-driven frame playback + progressive loading |
| `js/cabin-home.js` | Modified | Integrate frame scroller, keep title anim + card reveals |
| `cabin/index.html` | Modified | Replace `<picture>` with `<canvas>`, update markup |

### frame-scroller.js API

```js
createFrameScroller({
  canvas,              // HTMLCanvasElement
  frameCount: 120,     // total frames
  desktopPath: '...',  // path to desktop frames directory
  mobilePath: '...',   // path to mobile frames directory
  trigger: '...',      // CSS selector for ScrollTrigger trigger element
  scrub: 0.5,          // ScrollTrigger scrub value
  onFrameChange: null, // optional callback(currentFrame, totalFrames)
})
```

Handles: frame loading (three-phase), canvas drawing, scroll-to-frame mapping, responsive frame set selection (desktop vs mobile).

### What Stays the Same
- Lenis smooth scroll
- SplitText hero title animation
- Card reveal animation pattern (re-targeted to gold section)
- Dust particles canvas (layered on top)
- Companion bot button
- Fraunces/Outfit typography

### Mobile Strategy
- Single video source (landscape) — mobile uses `object-fit: cover` to crop sides
- Smaller frame set (640x360 WebP, ~1.2MB total)
- Fewer frames (100 vs 120) — mobile scrolls are coarser, difference imperceptible
- Canvas DPR capped at 1.0 (avoids iOS canvas pixel limits)
- Canvas `drawImage()` is GPU-accelerated on all modern mobile browsers
- RAF-throttled drawing (only redraws when frame index changes)

### What We're NOT Building
- No custom scroll physics (Lenis handles this)
- No video decode / WebCodecs
- No service worker caching
- No blur placeholders
- No separate mobile video/image (single source, responsive crop)

## Scroll Runway Tuning
- Initial value: 600vh (~6 viewport heights to play full sequence)
- Adjustable — shorter = faster playback, longer = more deliberate
- Apple typically uses 300-600vh for similar experiences

## Color Spec
- Gold gradient (card section): radial, centered above middle
  - Core: bright warm gold (~`#f5d680`)
  - Edge: deeper gold (~`#c9982e`) → warm amber
  - Exact values tuned to match final video frame
- Cards: `rgba(255, 255, 255, 0.78)` on gold bg, subtle gold border
- All other colors unchanged from current Sanctuary palette
