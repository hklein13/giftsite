# Sanctuary Scroll Experience — Design Document

**Date:** 2026-02-20
**Status:** Approved
**Branch:** TBD (new feature branch from current `feature/reimagine-templates`)

## Overview

Redesign the Sanctuary template from a static photo + scroll-to-cards layout into a cinematic scroll-driven experience. An AI-generated video of a treasure chest opening in the conservatory scene is extracted into frames and played back via canvas as the user scrolls. The chest opens further and the camera zooms in until gold light fills the screen, then fades to reveal the subpage selection cards.

## The Experience

### Hero State (before scroll)
- Full-viewport canvas showing frame 0: the sanctuary conservatory with a treasure chest on the table in front of the chair, slightly open, soft gold glow emanating from inside
- "Welcome to the Gift Site" title with frosted glass backdrop (same as current)
- Scroll indicator at bottom

### Scroll Scrub (continuous, reversible)
- 1:1 scroll-to-frame mapping via GSAP ScrollTrigger `scrub: true`
- ~150 frames extracted from a ~5-8 second AI-generated video
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

SCROLL RUNWAY (~500vh, invisible spacer)
  └─ ScrollTrigger maps scroll position → frame index 0-149
  └─ Canvas stays sticky, draws current frame

CARD SECTION
  └─ Gold radial gradient background
  └─ Heading + 5 nav cards + footer
  └─ ScrollTrigger card reveal animations
```

## Asset Pipeline (Phase 1 — before code)

### Step 1: Generate base image
Use AI image tool to create sanctuary photo with treasure chest on table, slightly open, gold glow. This is frame 0.

### Step 2: Generate video
Feed base image into AI video tool (Runway Gen-3, Kling, etc.). Prompt: chest lid opening, camera pushing in toward chest, gold glow intensifying, gold filling frame. Target ~5-8 seconds at 24-30fps.

### Step 3: Extract frames
Script (`scripts/extract-frames.mjs`) using ffmpeg:
- Input: video file
- Output: ~150 sequentially numbered WebP frames
- Two sets: desktop (1920x1080) and mobile (960x540)
- Output to `assets/sanctuary-frames/desktop/` and `mobile/`

### Step 4: Viability check
Standalone test page with canvas + scroll handler to verify scrub feels good before modifying Sanctuary code.

## Technical Implementation

### Frame Loading — Three-Phase Progressive

| Phase | Frames | Trigger | Purpose |
|-------|--------|---------|---------|
| 1 | 0-19 | Page init | Hero visible instantly |
| 2 | 20-59 | After hero animation | Covers first ~40% of scroll |
| 3 | 60-149 | On scroll approach | Chunks of 30, loaded when user within 20 frames of boundary |

If user scrolls faster than loading, hold on last loaded frame (no spinner).

### File Changes

| File | Status | Purpose |
|------|--------|---------|
| `assets/sanctuary-frames/desktop/*.webp` | New | ~150 desktop frames (1920x1080) |
| `assets/sanctuary-frames/mobile/*.webp` | New | ~150 mobile frames (960x540) |
| `scripts/extract-frames.mjs` | New | ffmpeg: video → numbered WebP frames |
| `js/frame-scroller.js` | New | Canvas + scroll-driven frame playback + progressive loading |
| `js/cabin-home.js` | Modified | Integrate frame scroller, keep title anim + card reveals |
| `cabin/index.html` | Modified | Replace `<picture>` with `<canvas>`, update markup |

### frame-scroller.js API

```js
FrameScroller({
  canvas,                // target canvas element
  frameCount: 150,       // total frames
  basePath: '...',       // path to frame directory
  scrollTrigger: {       // GSAP ScrollTrigger config
    trigger, start, end, scrub
  }
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

### Mobile Optimizations
- Smaller frame set (960x540 WebP, ~1.5-2.5MB total)
- Canvas `drawImage()` is GPU-accelerated on all modern mobile browsers
- RAF-throttled drawing (only redraws when frame index changes)
- Same progressive loading strategy

### What We're NOT Building
- No custom scroll physics (Lenis handles this)
- No video decode / WebCodecs
- No service worker caching
- No blur placeholders

## Scroll Runway Tuning
- Initial value: 500vh (~5 viewport heights to play full sequence)
- Adjustable — shorter = faster playback, longer = more deliberate
- Apple typically uses 300-600vh for similar experiences

## Color Spec
- Gold gradient (card section): radial, centered above middle
  - Core: bright warm gold (~`#f5d680`)
  - Edge: deeper gold (~`#c9982e`) → warm amber
  - Exact values tuned to match final video frame
- Cards: `rgba(255, 255, 255, 0.78)` on gold bg, subtle gold border
- All other colors unchanged from current Sanctuary palette
